import { supabase } from '../config/supabaseClient';

export interface ProjectData {
  user_id: string;
  name: string;
  type: string;
  data: any;
  date: string;
}

export const ProjectService = {
  save: async (project: ProjectData) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
      
    if (error) throw new Error(error.message);
    return data;
  },

  getAllByUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
};