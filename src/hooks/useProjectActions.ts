import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- Make sure you ran: npm install jspdf-autotable
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';

export const useProjectActions = (projectType: string) => {
  const { user } = useUser();
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
    const name = prompt("Enter a name for this project:");
    if (!name) return;

    setIsSaving(true);
    try {
      await ProjectService.save({
        user_id: user.id,
        name,
        type: projectType,
        data: { ...data, totalCost },
        date: new Date().toISOString(),
      });
      showToast("Project saved successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to save project.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 2. ORIGINAL IMAGE-BASED PDF (For Construction, Interior, etc) ---
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

  // --- 3. NEW SPREADSHEET-STYLE PDF (For Flooring, etc) ---
  const downloadSpreadsheetPDF = (projectName: string, tableData: any[], totalCost: number) => {
    setIsDownloading(true);
    showToast("Generating PDF...", "info");
    try {
      const doc = new jsPDF();

      // Header Text (Black and White)
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0); // Pure Black
      doc.text(`Project Estimate: ${projectName}`, 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Category: ${projectType.toUpperCase()}`, 14, 34);

      // Generate the Excel-style Table
      autoTable(doc, {
        startY: 45,
        head: [['Description / Item', 'Details / Quantity', 'Estimated Cost (INR)']],
        body: tableData.map(row => [row.item, row.details, `Rs. ${row.cost.toLocaleString('en-IN')}`]),
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
        foot: [['', 'TOTAL ESTIMATE', `Rs. ${totalCost.toLocaleString('en-IN')}`]],
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

  // Return ALL functions so older components don't break
  return { saveProject, downloadPDF, downloadSpreadsheetPDF, isSaving, isDownloading };
};