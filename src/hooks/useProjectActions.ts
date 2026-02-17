import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useUser } from '../context/UserContext';
import { ProjectService } from '../services/projectService';

export const useProjectActions = (projectType: string) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const saveProject = async (data: any, totalCost: number) => {
    if (!user) {
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
      alert("Project saved successfully!"); // Replace with Toast later
    } catch (error) {
      console.error(error);
      alert("Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async (elementRef: React.RefObject<HTMLElement>, fileName: string) => {
    if (!elementRef.current) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(elementRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("PDF Error", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return { saveProject, downloadPDF, isSaving, isDownloading };
};