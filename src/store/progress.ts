import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useSkillsStore } from './skills';

interface ProgressState {
  overallProgress: number | null;
  completedSkills: number | null;
  totalSkills: number | null;
  documentedExperiences: number | null;
  totalExperiences: number | null;
  supervisorApprovals: number | null;
  totalApprovals: number | null;
  lastUpdated: string;
  loading: boolean;
  updateProgress: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set) => ({
  overallProgress: null,
  completedSkills: null,
  totalSkills: 22, // Total number of skills required
  documentedExperiences: null,
  totalExperiences: 24, // Total number of experiences required
  supervisorApprovals: null,
  totalApprovals: 24, // Total number of approvals required
  lastUpdated: '',
  loading: false,

  updateProgress: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, refresh the skills data
      const skillsStore = useSkillsStore.getState();
      await skillsStore.loadUserSkills();

      // Get skills progress from skills store after refresh
      const { skillCategories } = skillsStore;
      const completedSkills = skillCategories.reduce((acc, category) => {
        return acc + category.skills.filter(skill => skill.rank !== undefined).length;
      }, 0);

      // Fetch documented experiences
      const { data: experiences, error: experiencesError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_documented', true);

      if (experiencesError) throw experiencesError;

      // Fetch supervisor approvals
      const { data: approvals, error: approvalsError } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .eq('supervisor_approved', true);

      if (approvalsError) throw approvalsError;

      // Only update state if we have valid data
      if (experiences && approvals) {
        // Calculate overall progress
        const skillsProgress = completedSkills / 22;
        const experiencesProgress = experiences.length / 24;
        const approvalsProgress = approvals.length / 24;
        const overallProgress = Math.round(((skillsProgress + experiencesProgress + approvalsProgress) / 3) * 100);

        set({
          overallProgress,
          completedSkills,
          documentedExperiences: experiences.length,
          supervisorApprovals: approvals.length,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Don't update state on error, keep null values
    } finally {
      set({ loading: false });
    }
  }
}));