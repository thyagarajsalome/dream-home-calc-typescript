export type ProCategory = 
  | 'House Contractor' | 'Architect' | 'Plumber' 
  | 'Electrician' | 'Floor Layman' | 'Painter' 
  | 'Interior Designer' | 'Draftsman';

export interface Professional {
  id: string;
  name: string;
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