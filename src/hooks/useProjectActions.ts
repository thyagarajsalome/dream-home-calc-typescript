import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../config/supabaseClient';
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';

export const useProjectActions = (projectType: string) => {
  const { user, credits, planTier, refreshProfile } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- 1. SAVE PROJECT LOGIC ---
  const saveProject = async (data: any, totalCost: number) => {
    if (!user) {
      showToast("Please sign in to save projects", "info");
      navigate('/signin');
      return;
    }

    // Client-side quick check for non-Pro users to avoid unnecessary DB calls
    if (planTier !== 'pro' && credits <= 0) {
      showToast("No credits remaining. Please upgrade your plan.", "error");
      navigate('/upgrade');
      return;
    }

    const name = prompt("Enter a name for this project:");
    if (!name) return;

    setIsSaving(true);
    try {
      // Step 1: Call the RPC function FIRST to verify usage limits and deduct credits
      // This ensures we don't save a project if the user has reached their daily/monthly cap
      const { error: rpcError } = await supabase.rpc('deduct_project_credit', {
        user_uuid: user.id
      });

      if (rpcError) {
        // Handle specific Pro limit errors from the SQL function
        if (rpcError.message.includes("limit")) {
          showToast(rpcError.message, "error");
          return;
        }
        // Handle standard credit exhaustion
        if (rpcError.message.includes("Insufficient credits")) {
          showToast("Insufficient credits. Redirecting to upgrade page...", "error");
          navigate('/upgrade');
          return;
        }
        throw rpcError;
      }

      // Step 2: Save project data after successful credit validation/deduction
      await ProjectService.save({
        user_id: user.id,
        name,
        type: projectType,
        data: { ...data, totalCost },
        date: new Date().toISOString(),
      });

      // Step 3: Refresh local profile to update the UI counters (credits, usage counts)
      await refreshProfile();

      // Step 4: Clear the temporary auto-saved draft
      try {
        const key = `hde_draft_${user.id}_${projectType}`;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } catch (err) {
        console.warn("Failed to clear draft after save:", err);
      }
      
      showToast("Project saved successfully!", "success");
    } catch (error: any) {
      console.error("Save error:", error);
      showToast(error.message || "Failed to save project.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 2. ORIGINAL IMAGE-BASED PDF (Fallback) ---
  const downloadPDF = async (elementRef: React.RefObject<HTMLElement>, fileName: string) => {
    if (!elementRef.current) return;
    setIsDownloading(true);
    showToast("Generating PDF...", "info");
    
    try {
      const canvas = await html2canvas(elementRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
      showToast("PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF Error", error);
      showToast("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  // --- Helper: Convert Number to Words (Indian numbering system) ---
  const convertNumberToWords = (amount: number | string): string => {
    let num = 0;
    if (typeof amount === "number") {
      num = Math.round(amount);
    } else {
      const cleanStr = amount.replace(/[^0-9]/g, "");
      num = parseInt(cleanStr, 10) || 0;
    }

    if (num === 0) return "Rupees Zero Only";

    const a = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function numToWords(n: number): string {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + numToWords(n % 100) : "");
      
      // Indian system: Thousands, Lakhs, Crores
      if (n < 100000) {
        return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + numToWords(n % 1000) : "");
      }
      if (n < 10000000) {
        return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + numToWords(n % 100000) : "");
      }
      return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + numToWords(n % 10000000) : "");
    }

    return "Rupees " + numToWords(num) + " Only";
  };

  // --- 3. NEW UNIVERSAL SPREADSHEET-STYLE PDF ---
  const downloadSpreadsheetPDF = (
    projectName: string, 
    headers: string[], 
    rows: (string | number)[][], 
    footerLabel?: string, 
    footerValue?: string | number
  ) => {
    setIsDownloading(true);
    showToast("Generating PDF...", "info");
    try {
      const doc = new jsPDF();

      // Top brand accent line (HDE Gold / Amber)
      doc.setDrawColor(217, 164, 67);
      doc.setLineWidth(1.5);
      doc.line(14, 12, 196, 12);

      // Header Brand
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("HOME DESIGN ENGLISH (HDE)", 14, 18);
      
      const categoryLabel = `ESTIMATE REPORT - ${projectType.toUpperCase()}`;
      doc.text(categoryLabel, 196 - doc.getTextWidth(categoryLabel), 18);

      // Estimate Title
      const titleText = projectName
        .replace(/-/g, " ")
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()));
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 30);
      doc.text(titleText, 14, 28);

      // Metadata Block
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 34);

      // Horizontal Divider
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(14, 37, 196, 37);

      let footData = undefined;
      if (footerLabel && footerValue !== undefined) {
        const footRow = Array(headers.length).fill('');
        footRow[headers.length - 2] = footerLabel;
        footRow[headers.length - 1] = footerValue.toString();
        footData = [footRow];
      }

      autoTable(doc, {
        startY: 42,
        head: [headers],
        body: rows,
        theme: 'striped', 
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4,
          textColor: [40, 40, 40], 
        },
        headStyles: {
          fillColor: [30, 30, 30], 
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          [headers.length - 1]: { halign: 'right' }
        },
        foot: footData,
        footStyles: {
          fillColor: [245, 245, 245],
          textColor: [30, 30, 30],
          fontStyle: 'bold',
        }
      });

      // Amount in Words
      const finalY = (doc as any).lastAutoTable.finalY || 42;
      if (footerValue) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        
        const words = convertNumberToWords(footerValue);
        doc.text(`Amount in Words:`, 14, finalY + 12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(words, 14, finalY + 17);
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for using Home Design English. This estimate is for reference based on local market factors.", 14, 285);

      doc.save(`${projectName.replace(/\s+/g, '-')}.pdf`);
      showToast("PDF downloaded successfully!", "success");

    } catch (error) {
      console.error("PDF Error", error);
      showToast("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const autosaveDraft = async (data: any) => {
    if (!user || typeof window === 'undefined') return;
    try {
      const key = `hde_draft_${user.id}_${projectType}`;
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn("Autosave draft failed:", err);
    }
  };

  const getAutosaveDraft = async () => {
    if (!user || typeof window === 'undefined') return null;
    try {
      const key = `hde_draft_${user.id}_${projectType}`;
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.warn("Retrieve draft failed:", err);
      return null;
    }
  };

  const deleteAutosaveDraft = async () => {
    if (!user || typeof window === 'undefined') return;
    try {
      const key = `hde_draft_${user.id}_${projectType}`;
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn("Delete draft failed:", err);
    }
  };

  return { 
    saveProject, 
    downloadPDF, 
    downloadSpreadsheetPDF, 
    isSaving, 
    isDownloading,
    autosaveDraft,
    getAutosaveDraft,
    deleteAutosaveDraft
  };
};