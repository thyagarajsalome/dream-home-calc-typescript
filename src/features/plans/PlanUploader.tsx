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
    showToast("Uploading files... please wait", "info");

    try {
      // 1. Generate unique filenames to prevent overwriting
      const timestamp = Date.now();
      const previewExt = previewFile.name.split('.').pop();
      const fullExt = fullFile.name.split('.').pop();
      
      const previewPath = `previews/${timestamp}-preview.${previewExt}`;
      const fullPath = `full-plans/${timestamp}-full.${fullExt}`;

      // 2. Upload Preview Image to Storage
      const { error: previewError } = await supabase.storage
        .from('house-plans')
        .upload(previewPath, previewFile);
      if (previewError) throw previewError;

      // 3. Upload Full File to Storage
      const { error: fullError } = await supabase.storage
        .from('house-plans')
        .upload(fullPath, fullFile);
      if (fullError) throw fullError;

      // 4. Save to Database (Using exact relative paths!)
      const { error: dbError } = await supabase.from('house_plans').insert({
        title: title,
        area_sqft: parseInt(area),
        facing: facing,
        preview_url: previewPath,
        file_url: fullPath
      });
      if (dbError) throw dbError;

      showToast("Plan uploaded successfully!", "success");
      
      // Reset form
      setTitle("");
      setArea("");
      setPreviewFile(null);
      setFullFile(null);
      
      // Tell the gallery to refresh
      onUploadSuccess();

    } catch (error: any) {
      console.error("Upload Error:", error);
      showToast("Upload failed: " + error.message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-8 border-primary/30 shadow-glow bg-amber-50/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
          <i className="fas fa-upload"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Admin Upload Portal</h2>
          <p className="text-sm text-gray-500">Upload new plans directly to the database.</p>
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

        <Button type="submit" isLoading={isUploading} className="md:col-span-2 mt-4">
          {isUploading ? "Uploading to Supabase..." : "Upload Plan"}
        </Button>
      </form>
    </Card>
  );
};