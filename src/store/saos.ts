import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Skill } from './skills';

export interface SAO {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  skills: Skill[];
}

interface SAOsState {
  saos: SAO[];
  loading: boolean;
  error: string | null;
  createSAO: (title: string, content: string, skills: Skill[]) => Promise<void>;
  loadUserSAOs: () => Promise<void>;
  deleteSAO: (id: string) => Promise<void>;
  updateSAO: (id: string, title: string, content: string, skills: Skill[]) => Promise<void>;
}

export const useSAOsStore = create<SAOsState>((set, get) => ({
  saos: [],
  loading: false,
  error: null,

  createSAO: async (title: string, content: string, skills: Skill[]) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // First, create the SAO
      const { data: sao, error: saoError } = await supabase
        .from('saos')
        .insert([
          {
            user_id: user.id,
            title,
            content
          }
        ])
        .select()
        .single();

      if (saoError) throw saoError;

      // Then, create the SAO skills relationships
      const saoSkills = skills.map(skill => ({
        sao_id: sao.id,
        skill_id: skill.id,
        category_name: skill.category_name,
        skill_name: skill.name
      }));

      const { error: skillsError } = await supabase
        .from('sao_skills')
        .insert(saoSkills);

      if (skillsError) throw skillsError;

      // Reload SAOs to get the updated list
      await get().loadUserSAOs();
    } catch (error: any) {
      console.error('Error creating SAO:', error);
      set({ error: error.message || 'Failed to create SAO' });
    } finally {
      set({ loading: false });
    }
  },

  loadUserSAOs: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // Fetch SAOs with their associated skills
      const { data: saos, error: saosError } = await supabase
        .from('saos')
        .select(`
          *,
          sao_skills (
            skill_id,
            category_name,
            skill_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (saosError) throw saosError;

      // Transform the data to match our SAO interface
      const transformedSAOs: SAO[] = saos.map(sao => ({
        id: sao.id,
        title: sao.title,
        content: sao.content,
        created_at: sao.created_at,
        updated_at: sao.updated_at,
        skills: sao.sao_skills.map((skill: any) => ({
          id: skill.skill_id,
          name: skill.skill_name,
          category_name: skill.category_name,
          status: 'completed' // Since it's associated with an SAO, we consider it completed
        }))
      }));

      set({ saos: transformedSAOs });
    } catch (error: any) {
      console.error('Error loading SAOs:', error);
      set({ error: error.message || 'Failed to load SAOs' });
    } finally {
      set({ loading: false });
    }
  },

  deleteSAO: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('saos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the local state
      set(state => ({
        saos: state.saos.filter(sao => sao.id !== id)
      }));
    } catch (error: any) {
      console.error('Error deleting SAO:', error);
      set({ error: error.message || 'Failed to delete SAO' });
    } finally {
      set({ loading: false });
    }
  },

  updateSAO: async (id: string, title: string, content: string, skills: Skill[]) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // Update the SAO
      const { error: saoError } = await supabase
        .from('saos')
        .update({ title, content })
        .eq('id', id)
        .eq('user_id', user.id);

      if (saoError) throw saoError;

      // Delete existing skills
      const { error: deleteSkillsError } = await supabase
        .from('sao_skills')
        .delete()
        .eq('sao_id', id);

      if (deleteSkillsError) throw deleteSkillsError;

      // Insert new skills
      const saoSkills = skills.map(skill => ({
        sao_id: id,
        skill_id: skill.id,
        category_name: skill.category_name,
        skill_name: skill.name
      }));

      const { error: skillsError } = await supabase
        .from('sao_skills')
        .insert(saoSkills);

      if (skillsError) throw skillsError;

      // Reload SAOs to get the updated list
      await get().loadUserSAOs();
    } catch (error: any) {
      console.error('Error updating SAO:', error);
      set({ error: error.message || 'Failed to update SAO' });
    } finally {
      set({ loading: false });
    }
  }
})); 