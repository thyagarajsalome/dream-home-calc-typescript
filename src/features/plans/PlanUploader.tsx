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
  
  // Form State
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [facing, setFacing] = useState("East");
  const [dimensions, setDimensions] = useState(""); // e.g., 30x40
  const [floors, setFloors] = useState("G+1");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("2");
  const [parking, setParking] = useState("1 Car");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(""); // NEW: Added state for YouTube Shorts
  
  const [fullFile, setFullFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullFile || !title || !area) {
      showToast("Please fill all required fields and select a file.", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    showToast("Upload started. Please do not close the page.", "info");

    const progressInterval = setInterval(() => setUploadProgress(prev => (prev < 85 ? prev + 10 : prev)), 400);

    try {
      const timestamp = Date.now();
      const fullExt = fullFile.name.split('.').pop();
      const fullPath = `full-plans/${timestamp}-plan.${fullExt}`;

      // Upload Single File
      const { error: fullError } = await supabase.storage.from('house-plans').upload(fullPath, fullFile);
      if (fullError) throw fullError;
      setUploadProgress(90);

      // Save to Database with ALL fields including the YouTube URL
      const { error: dbError } = await supabase.from('house_plans').insert({
        title,
        area_sqft: parseInt(area) || 0,
        facing,
        dimensions,
        floors,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        parking,
        description,
        file_url: fullPath,
        youtube_url: youtubeUrl // NEW: Provision for embedded video
      });
      if (dbError) throw dbError;

      setUploadProgress(100);
      clearInterval(progressInterval);
      showToast("Plan uploaded successfully!", "success");
      
      // Reset Form
      setTitle(""); setArea(""); setDimensions(""); setDescription("");
      setYoutubeUrl(""); // NEW: Reset youtube state
      setFullFile(null);
      
      setTimeout(() => {
        setUploadProgress(0);
        onUploadSuccess();
      }, 1000);

    } catch (error: any) {
      clearInterval(progressInterval);
      showToast("Upload failed: " + error.message, "error");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className={`mb-8 border-primary/30 shadow-glow transition-all p-4 md:p-6 ${isUploading ? 'bg-gray-100 opacity-80 pointer-events-none' : 'bg-amber-50/30'}`}>
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-4">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center">
          {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Admin Upload Portal</h2>
          <p className="text-sm text-gray-500">Upload high-res plan and detailed specifications.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2"><Input label="Plan Title*" value={title} onChange={e => setTitle(e.target.value)} required disabled={isUploading} className="mb-0" /></div>
          <Input label="Area (sq.ft)*" type="number" value={area} onChange={e => setArea(e.target.value)} required disabled={isUploading} className="mb-0" />
          <Input label="Dimensions (e.g. 30x40)" value={dimensions} onChange={e => setDimensions(e.target.value)} disabled={isUploading} className="mb-0" />
        </div>

        {/* Specs Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Facing</label>
            <select value={facing} onChange={e => setFacing(e.target.value)} disabled={isUploading} className="w-full p-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary outline-none">
              <option value="East">East</option><option value="West">West</option><option value="North">North</option><option value="South">South</option>
            </select>
          </div>
          <Input label="Floors (e.g. G+1)" value={floors} onChange={e => setFloors(e.target.value)} disabled={isUploading} className="mb-0" />
          <Input label="Bedrooms" type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} disabled={isUploading} className="mb-0" />
          <Input label="Bathrooms" type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} disabled={isUploading} className="mb-0" />
          <Input label="Parking" value={parking} onChange={e => setParking(e.target.value)} disabled={isUploading} className="mb-0" />
        </div>

        {/* NEW: YouTube provision for Admins */}
        <div className="grid grid-cols-1 gap-4">
          <Input 
            label="YouTube Shorts Link" 
            placeholder="https://youtube.com/shorts/..." 
            value={youtubeUrl} 
            onChange={e => setYoutubeUrl(e.target.value)} 
            icon="fab fa-youtube"
            disabled={isUploading} 
            className="mb-0"
          />
        </div>

        {/* Detailed Description */}
        <div>
           <label className="block text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-wider">Detailed Specs (Living Room, Kitchen, Doors, Windows, Flooring, etc.)</label>
           <textarea 
             value={description} 
             onChange={e => setDescription(e.target.value)} 
             disabled={isUploading} 
             placeholder="e.g., Large living room (16x16), open kitchen. Vitrified tiles flooring (1200 sqft total). 8 doors, 6 windows..."
             className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-primary outline-none resize-y min-h-[100px]"
           />
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-primary/50 p-4 rounded-xl bg-white text-center hover:bg-gray-50 transition-colors">
          <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer">
            <i className="fas fa-file-image text-primary mr-2"></i>Select High-Res Plan Image*
          </label>
          <input type="file" onChange={e => setFullFile(e.target.files?.[0] || null)} required disabled={isUploading} className="text-sm w-full cursor-pointer" />
        </div>

        {uploadProgress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>Uploading...</span><span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isUploading} disabled={isUploading} className="w-full py-3 mt-2">
          {isUploading ? "Processing..." : "Upload Plan to Gallery"}
        </Button>
      </form>
    </Card>
  );
};