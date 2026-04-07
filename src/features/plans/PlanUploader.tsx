// src/features/plans/PlanUploader.tsx
import React, { useState } from "react";
import { supabase } from "../../config/supabaseClient";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

interface PlanUploaderProps {
  onUploadSuccess: () => void;
}

export const PlanUploader: React.FC<PlanUploaderProps> = ({ onUploadSuccess }) => {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [facing, setFacing] = useState("East");
  const [fullFile, setFullFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullFile || !title || !area) {
      showToast("Please fill all fields and select a file.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    showToast("Upload started. Please do not close the page.", "info");

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 10 : prev));
    }, 400);

    try {
      const timestamp = Date.now();
      const fullExt = fullFile.name.split('.').pop();
      const fullPath = `full-plans/${timestamp}-plan.${fullExt}`;

      // Upload Single File
      const { error: fullError } = await supabase.storage
        .from('house-plans')
        .upload(fullPath, fullFile);
      if (fullError) throw fullError;
      setUploadProgress(90);

      // Save to Database (No preview_url anymore)
      const { error: dbError } = await supabase.from('house_plans').insert({
        title: title,
        area_sqft: parseInt(area),
        facing: facing,
        file_url: fullPath
      });
      if (dbError) throw dbError;

      setUploadProgress(100);
      clearInterval(progressInterval);
      showToast("Plan uploaded successfully!", "success");
      
      // Reset
      setTitle("");
      setArea("");
      setFullFile(null);
      
      setTimeout(() => {
        setUploadProgress(0);
        onUploadSuccess();
      }, 1000);

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Upload Error:", error);
      showToast("Upload failed: " + error.message, "error");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className={`mb-8 border-primary/30 shadow-glow transition-all p-4 md:p-6 ${isUploading ? 'bg-gray-100 opacity-80 pointer-events-none' : 'bg-amber-50/30'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
          {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Admin Upload Portal</h2>
          <p className="text-sm text-gray-500">Single high-res image upload.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Input label="Plan Title" value={title} onChange={e => setTitle(e.target.value)} required disabled={isUploading} className="mb-0" />
        <Input label="Area (sq.ft)" type="number" value={area} onChange={e => setArea(e.target.value)} required disabled={isUploading} className="mb-0" />
        
        <div className="mb-0">
          <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Facing Direction</label>
          <select value={facing} onChange={e => setFacing(e.target.value)} disabled={isUploading} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-primary outline-none">
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="North">North</option>
            <option value="South">South</option>
          </select>
        </div>

        <div className="md:col-span-3 border-2 border-dashed border-primary/50 p-4 rounded-xl bg-white text-center hover:bg-gray-50 transition-colors">
          <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer">
            <i className="fas fa-file-image text-primary mr-2"></i>Select High-Res Plan Image
          </label>
          <input type="file" onChange={e => setFullFile(e.target.files?.[0] || null)} required disabled={isUploading} className="text-sm w-full cursor-pointer" />
        </div>

        {uploadProgress > 0 && (
          <div className="md:col-span-3 mt-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>Uploading...</span><span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isUploading} disabled={isUploading} className="md:col-span-3 py-3 mt-2">
          {isUploading ? "Processing..." : "Upload Plan to Gallery"}
        </Button>
      </form>
    </Card>
  );
};