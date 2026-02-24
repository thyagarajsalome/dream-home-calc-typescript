import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';
import { useToast } from '../context/ToastContext';

export const useProjectActions = (projectType: string) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const downloadPDF = async (elementRef: React.RefObject<HTMLElement>, fileName: string) => {
    if (!elementRef.current) return;
    setIsDownloading(true);
    showToast("Generating PDF...", "info");
    
    try {
      const canvas = await html2canvas(elementRef.current, { 
        scale: 2, 
        useCORS: true,
        // Force a standard desktop width on the clone so mobile devices don't generate massive fonts
        onclone: (_, clonedElement) => {
          clonedElement.style.width = '800px';
          clonedElement.style.maxWidth = '800px';
          clonedElement.style.padding = '20px';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.backgroundColor = '#ffffff';
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculate dimensions with uniform 10mm margins
      const margin = 10;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const printWidth = pdfWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, printWidth, printHeight);
      pdf.save(`${fileName}.pdf`);
      showToast("PDF downloaded successfully!", "success");
    } catch (error) {
      console.error("PDF Error", error);
      showToast("Failed to generate PDF.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return { saveProject, downloadPDF, isSaving, isDownloading };
};