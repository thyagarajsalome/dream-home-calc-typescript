export type ProCategory = 
  | 'House Contractor' | 'Architect' | 'Plumber' 
  | 'Electrician' | 'Floor Layman' | 'Painter' 
  | 'Interior Designer' | 'Draftsman';

export interface Professional {
  id: string;
  user_id: string;
  name: string;
  email: string; // NEW: Business email for verification
  category: ProCategory;
  years_of_experience: number;
  city: string;
  area?: string;
  contact_number: string;
  whatsapp_number?: string;
  bio?: string; // This will be limited to 300 chars
  profile_pic_url?: string;
  is_verified: boolean;
}