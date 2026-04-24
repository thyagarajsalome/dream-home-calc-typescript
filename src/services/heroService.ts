import { supabase } from '../config/supabaseClient';

export interface HeroBanner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
}

export const HeroService = {
  getBanners: async (): Promise<HeroBanner[]> => {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('order_index', { ascending: true })
      .limit(5);

    if (error) throw error;
    return data || [];
  }
};