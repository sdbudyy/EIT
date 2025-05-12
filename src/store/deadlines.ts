import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Deadline {
  id: string;
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  type: 'skill' | 'experience' | 'approval' | 'document' | 'other';
  related_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DeadlinesState {
  deadlines: Deadline[];
  loading: boolean;
  error: string | null;
  loadDeadlines: () => Promise<void>;
  addDeadline: (deadline: Omit<Deadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => Promise<void>;
  deleteDeadline: (id: string) => Promise<void>;
}

export const useDeadlinesStore = create<DeadlinesState>((set, get) => ({
  deadlines: [],
  loading: false,
  error: null,

  loadDeadlines: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: deadlines, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      set({ deadlines: deadlines || [] });
    } catch (error: any) {
      console.error('Error loading deadlines:', error);
      set({ error: error.message || 'Failed to load deadlines' });
    } finally {
      set({ loading: false });
    }
  },

  addDeadline: async (deadline) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('deadlines')
        .insert([{
          ...deadline,
          user_id: user.id
        }]);

      if (error) throw error;

      // Reload deadlines to get the updated list
      await get().loadDeadlines();
    } catch (error: any) {
      console.error('Error adding deadline:', error);
      set({ error: error.message || 'Failed to add deadline' });
    } finally {
      set({ loading: false });
    }
  },

  updateDeadline: async (id, deadline) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('deadlines')
        .update(deadline)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload deadlines to get the updated list
      await get().loadDeadlines();
    } catch (error: any) {
      console.error('Error updating deadline:', error);
      set({ error: error.message || 'Failed to update deadline' });
    } finally {
      set({ loading: false });
    }
  },

  deleteDeadline: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Reload deadlines to get the updated list
      await get().loadDeadlines();
    } catch (error: any) {
      console.error('Error deleting deadline:', error);
      set({ error: error.message || 'Failed to delete deadline' });
    } finally {
      set({ loading: false });
    }
  }
})); 