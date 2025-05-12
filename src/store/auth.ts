import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { useSkillsStore } from './skills';
import { useSAOsStore } from './saos';
import { useDocumentsStore } from './documents';
import { useDeadlinesStore } from './deadlines';
import { useProgressStore } from './progress';
import { useSearchStore } from './search';
import { useLocalDocumentStore } from './localDocuments';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Function to clear all stores
const clearAllStores = () => {
  // Clear each store's state
  useSkillsStore.setState({ skillCategories: [], loading: false, error: null });
  useSAOsStore.setState({ saos: [], loading: false, error: null });
  useDocumentsStore.setState({ documents: [], loading: false, error: null });
  useDeadlinesStore.setState({ deadlines: [], loading: false, error: null });
  useProgressStore.setState({ 
    overallProgress: null,
    completedSkills: null,
    documentedExperiences: null,
    supervisorApprovals: null,
    lastUpdated: '',
    loading: false
  });
  useSearchStore.setState({ results: [], loading: false, error: null });
  useLocalDocumentStore.setState({ documents: [], loading: false, error: null });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  },
  signUp: async (email: string, password: string, fullName: string) => {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) throw signUpError;

    const { error: profileError } = await supabase
      .from('users')
      .insert([{ email, full_name: fullName }]);
    
    if (profileError) throw profileError;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear all stores before setting user to null
    clearAllStores();
    set({ user: null });
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({ 
    user: session?.user ?? null,
    loading: false,
  });
});