import { supabase } from "../../config/supabaseClient";

// A simple function to call when you want to add a new plan
export const uploadPlan = async (file: File, details: { title: string, area: number, facing: string }) => {
  // 1. Upload Full Res
  const { data: fileData } = await supabase.storage
    .from('house-plans')
    .upload(`full-plans/${file.name}`, file);

  // 2. Add to Database
  if (fileData) {
    await supabase.from('house_plans').insert({
      title: details.title,
      area_sqft: details.area,
      facing: details.facing,
      preview_url: `...your_watermarked_preview_url...`, 
      file_url: fileData.path // Store the storage path, not the full URL
    });
  }
};