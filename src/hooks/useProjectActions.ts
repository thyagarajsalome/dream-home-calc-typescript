import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';
import { useToast } from '../context/ToastContext'; // <-- Imported ToastContext

export const useProjectActions = (projectType: string) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast(); // <-- Initialized useToast
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const saveProject = async (data: any, totalCost: number) => {
    if (!user) {
      showToast("Please sign in to save projects", "info"); // <-- Toast instead of silent redirect
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
      showToast("Project saved successfully!", "success"); // <-- Toast instead of alert
    } catch (error) {
      console.error(error);
      showToast("Failed to save project.", "error"); // <-- Toast instead of alert
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async (elementRef: React.RefObject<HTMLElement>, fileName: string) => {
    if (!elementRef.current) return;
    setIsDownloading(true);
    showToast("Generating PDF...", "info"); // <-- Added helpful Toast
    
    try {
      const canvas = await html2canvas(elementRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
      showToast("PDF downloaded successfully!", "success"); // <-- Added success Toast
    } catch (error) {
      console.error("PDF Error", error);
      showToast("Failed to generate PDF.", "error"); // <-- Added error Toast
    } finally {
      setIsDownloading(false);
    }
  };

  return { saveProject, downloadPDF, isSaving, isDownloading };
};