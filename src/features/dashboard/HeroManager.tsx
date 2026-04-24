import React, { useState } from "react";
import { supabase } from "../../config/supabaseClient";
import { Button } from "../../components/ui/Button";

export const HeroManager = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadHero = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `hero-${Date.now()}`;
      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('hero-banners')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('hero-banners')
        .getPublicUrl(fileName);

      // 3. Save to Table
      const { error: dbError } = await supabase.from('hero_banners').insert({
        image_url: publicUrl,
        title: "New Architectural Design",
        subtitle: "Built with Precision",
        order_index: 0
      });

      if (dbError) throw dbError;
      alert("Hero image added!");
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
      <h3 className="font-bold mb-4">Add New Hero Slide</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4 block" />
      <Button onClick={uploadHero} isLoading={uploading}>Upload to Supabase</Button>
    </div>
  );
};