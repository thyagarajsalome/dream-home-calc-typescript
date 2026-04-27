import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../config/supabaseClient'; // Added for direct profile updates
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';

export const useProjectActions = (projectType: string) => {
  // Destructure credits, planTier, and refreshProfile from context
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

    // Check credit eligibility: Pro tier has unlimited credits
    const isPro = planTier === 'pro';
    if (!isPro && credits <= 0) {
      showToast("No credits remaining. Please upgrade your plan.", "error");
      navigate('/upgrade');
      return;
    }

    const name = prompt("Enter a name for this project:");
    if (!name) return;

    setIsSaving(true);
    try {
      // Step 1: Save project data to the 'projects' table
      await ProjectService.save({
        user_id: user.id,
        name,
        type: projectType,
        data: { ...data, totalCost },
        date: new Date().toISOString(),
      });

      // Step 2: Deduct 1 credit from the 'profiles' table if not a Pro user
      if (!isPro) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ credits: credits - 1 })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Step 3: Refresh the local user state to update the Dashboard counters
      await refreshProfile();
      
      showToast(isPro ? "Project saved successfully!" : "Project saved and 1 credit deducted!", "success");
    } catch (error: any) {
      console.error(error);
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

      // Header Text (Black and White)
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