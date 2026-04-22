// src/types/directory.ts
export type ProCategory = 
  | '3D Designer / Visualizer' | 'Architect' | 'Borewell Contractor' | 'Carpenter' 
  | 'Draftsman' | 'Electrician' | 'Fabricator (Grill/Gate)' | 'Floor Layman' 
  | 'House Contractor' | 'Interior Designer' | 'Material Vendor' | 'Painter' 
  | 'Plumber' | 'Solar / UPS Vendor' | 'Structural Engineer' 
  | 'Waterproofing Specialist' | 'Windows & Door Contractor';

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  email: string; // NEW
  category: ProCategory;
  years_of_experience: number;
  city: string;
  area?: string;
  contact_number: string;
  whatsapp_number?: string;
  bio?: string;
  profile_pic_url?: string;
  is_verified: boolean;
}