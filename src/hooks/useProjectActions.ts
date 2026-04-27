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

      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0); 
      doc.text(`Project Estimate: ${projectName}`, 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Category: ${projectType.toUpperCase()}`, 14, 34);

      let footData = undefined;
      if (footerLabel && footerValue !== undefined) {
        const footRow = Array(headers.length).fill('');
        footRow[headers.length - 2] = footerLabel;
        footRow[headers.length - 1] = footerValue.toString();
        footData = [footRow];
      }

      autoTable(doc, {
        startY: 45,
        head: [headers],
        body: rows,
        theme: 'grid', 
        styles: {
          font: 'helvetica',
          lineColor: [0, 0, 0], 
          lineWidth: 0.1,
          textColor: [0, 0, 0], 
          fillColor: [255, 255, 255], 
        },
        headStyles: {
          fillColor: [240, 240, 240], 
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        foot: footData,
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        }
      });

      doc.save(`${projectName.replace(/\s+/g, '-')}.pdf`);
      showToast("PDF downloaded successfully!", "success");

    } catch (error) {
      console.error("PDF Error", error);
      showToast("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return { saveProject, downloadPDF, downloadSpreadsheetPDF, isSaving, isDownloading };
};