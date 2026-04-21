import { supabase } from '../config/supabaseClient';
import { Professional } from '../types/directory';

export const ProService = {
  getProfessionals: async (category?: string, city?: string, page = 0) => {
    const pageSize = 12;
    let query = supabase
      .from('professionals')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (category) query = query.eq('category', category);
    if (city) query = query.ilike('city', `%${city}%`);

    const { data, error, count } = await query.order('is_verified', { ascending: false });
    
    if (error) throw error;
    return { data, count };
  }
};