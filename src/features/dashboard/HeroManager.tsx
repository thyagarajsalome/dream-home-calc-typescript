// src/features/dashboard/HeroManager.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../config/supabaseClient";
import { Button } from "../../components/ui/Button";
import { HeroBanner, HeroService } from "../../services/heroService";
import { useToast } from "../../context/ToastContext";

export const HeroManager = () => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load current banners on mount
  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await HeroService.getBanners();
      setBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      // 1. Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 2. Upload to Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('hero-banners')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 3. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hero-banners')
        .getPublicUrl(filePath);

      // 4. Save record to Database
      const { error: dbError } = await supabase.from('hero_banners').insert({
        image_url: publicUrl,
        title: "Modern Architecture",
        subtitle: "HDE Premium Planning",
        order_index: banners.length // Set at the end of the list
      });

      if (dbError) throw dbError;

      showToast("Hero slide added successfully!", "success");
      setFile(null);
      // Reset input manually if needed
      const fileInput = document.getElementById('hero-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      loadBanners(); // Refresh list
    } catch (err: any) {
      console.error("Upload Error:", err);
      showToast(err.message || "Error uploading image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (banner: HeroBanner) => {
    const isConfirmed = window.confirm("Are you sure you want to remove this hero slide?");
    if (!isConfirmed) return;

    try {
      // 1. Extract file path from URL to delete from storage
      // Assumes URL structure: .../storage/v1/object/public/hero-banners/public/filename.jpg
      const urlParts = banner.image_url.split('/hero-banners/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('hero-banners').remove([filePath]);
      }

      // 2. Delete record from Database
      const { error: dbError } = await supabase
        .from('hero_banners')
        .delete()
        .eq('id', banner.id);

      if (dbError) throw dbError;

      showToast("Slide removed from gallery", "success");
      loadBanners(); // Refresh list
    } catch (err: any) {
      showToast("Error deleting slide", "error");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Slides List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-images text-primary"></i>
          Active Hero Slides
        </h3>

        {loading ? (
          <div className="flex justify-center py-8"><i className="fas fa-spinner fa-spin text-gray-300 text-2xl"></i></div>
        ) : banners.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm italic">No slides uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {banners.map((banner) => (
              <div key={banner.id} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100 border border-gray-100">
                <img src={banner.image_url} alt="Slide Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleDelete(banner)}
                    className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    title="Delete Slide"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Form */}
      <div className="bg-amber-50/50 rounded-2xl border-2 border-dashed border-amber-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-cloud-upload-alt text-primary"></i>
          Add New Slide
        </h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <input 
              id="hero-upload"
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-yellow-600 transition-all cursor-pointer" 
            />
            <Button 
              type="submit" 
              isLoading={uploading} 
              disabled={!file}
              className="w-full sm:w-auto"
            >
              Upload to Supabase
            </Button>
          </div>
          <p className="text-[10px] text-gray-400">
            Recommended size: 1920x800px. JPG, PNG or WEBP formats supported.
          </p>
        </form>
      </div>
    </div>
  );
};