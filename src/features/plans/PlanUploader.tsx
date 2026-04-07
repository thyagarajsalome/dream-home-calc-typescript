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
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [fullFile, setFullFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewFile || !fullFile || !title || !area) {
      showToast("Please fill all fields and select both files.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    showToast("Upload started. Please do not close the page.", "info");

    // Simulate progress bar advancing while we wait for Supabase
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 5 : prev));
    }, 500);

    try {
      const timestamp = Date.now();
      const previewExt = previewFile.name.split('.').pop();
      const fullExt = fullFile.name.split('.').pop();
      
      const previewPath = `previews/${timestamp}-preview.${previewExt}`;
      const fullPath = `full-plans/${timestamp}-full.${fullExt}`;

      // Upload Preview
      const { error: previewError } = await supabase.storage
        .from('house-plans')
        .upload(previewPath, previewFile);
      if (previewError) throw previewError;
      setUploadProgress(50);

      // Upload Full File
      const { error: fullError } = await supabase.storage
        .from('house-plans')
        .upload(fullPath, fullFile);
      if (fullError) throw fullError;
      setUploadProgress(90);

      // Save to Database
      const { error: dbError } = await supabase.from('house_plans').insert({
        title: title,
        area_sqft: parseInt(area),
        facing: facing,
        preview_url: previewPath,
        file_url: fullPath
      });
      if (dbError) throw dbError;

      setUploadProgress(100);
      clearInterval(progressInterval);
      showToast("Plan uploaded successfully!", "success");
      
      // Reset form
      setTitle("");
      setArea("");
      setPreviewFile(null);
      setFullFile(null);
      
      // Refresh gallery
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
    <Card className={`mb-8 border-primary/30 shadow-glow transition-all ${isUploading ? 'bg-gray-100 opacity-80 pointer-events-none' : 'bg-amber-50/30'}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
          {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-upload"></i>}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Admin Upload Portal</h2>
          <p className="text-sm text-gray-500">
            {isUploading ? "Uploading in progress... Safety lock active." : "Upload one plan at a time to prevent server overload."}
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Plan Title" value={title} onChange={e => setTitle(e.target.value)} required disabled={isUploading} />
        <Input label="Area (sq.ft)" type="number" value={area} onChange={e => setArea(e.target.value)} required disabled={isUploading} />
        
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Facing</label>
          <select value={facing} onChange={e => setFacing(e.target.value)} disabled={isUploading} className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-primary outline-none">
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="North">North</option>
            <option value="South">South</option>
          </select>
        </div>

        <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-dashed border-gray-300 p-4 rounded-xl bg-white text-center">
            <label className="block text-sm font-bold text-gray-700 mb-2">1. Preview Image (Watermarked)</label>
            <input type="file" accept="image/*" onChange={e => setPreviewFile(e.target.files?.[0] || null)} required disabled={isUploading} className="text-sm w-full" />
          </div>

          <div className="border-2 border-dashed border-primary/50 p-4 rounded-xl bg-white text-center">
            <label className="block text-sm font-bold text-gray-700 mb-2">2. Full Resolution File (Pro Download)</label>
            <input type="file" onChange={e => setFullFile(e.target.files?.[0] || null)} required disabled={isUploading} className="text-sm w-full" />
          </div>
        </div>

        {uploadProgress > 0 && (
          <div className="md:col-span-2 mt-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isUploading} disabled={isUploading} className="md:col-span-2 mt-4">
          {isUploading ? "Processing Upload..." : "Upload Plan"}
        </Button>
      </form>
    </Card>
  );
};