import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Skill {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'not-started';
  rank?: number;
  category_name?: string;
}

export interface Category {
  name: string;
  skills: Skill[];
}

interface SkillsState {
  skillCategories: Category[];
  setSkillCategories: (categories: Category[]) => void;
  updateSkillRank: (categoryIndex: number, skillId: number, rank: number) => Promise<void>;
  loadUserSkills: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Initial skill categories data
const initialSkillCategories: Category[] = [
  {
    name: 'Category 1 – Technical Competence',
    skills: [
      { id: 1, name: '1.1 Regulations, Codes & Standards', status: 'not-started', rank: undefined },
      { id: 2, name: '1.2 Technical & Design Constraints', status: 'not-started', rank: undefined },
      { id: 3, name: '1.3 Risk Management for Technical Work', status: 'not-started', rank: undefined },
      { id: 4, name: '1.4 Application of Theory', status: 'not-started', rank: undefined },
      { id: 5, name: '1.5 Solution Techniques – Results Verification', status: 'not-started', rank: undefined },
      { id: 6, name: '1.6 Safety in Design & Technical Work', status: 'not-started', rank: undefined },
      { id: 7, name: '1.7 Systems & Their Components', status: 'not-started', rank: undefined },
      { id: 8, name: '1.8 Project or Asset Life-Cycle Awareness', status: 'not-started', rank: undefined },
      { id: 9, name: '1.9 Quality Assurance', status: 'not-started', rank: undefined },
      { id: 10, name: '1.10 Engineering Documentation', status: 'not-started', rank: undefined },
    ]
  },
  {
    name: 'Category 2 – Communication',
    skills: [
      { id: 11, name: '2.1 Oral Communication (English)', status: 'not-started', rank: undefined },
      { id: 12, name: '2.2 Written Communication (English)', status: 'not-started', rank: undefined },
      { id: 13, name: '2.3 Reading & Comprehension (English)', status: 'not-started', rank: undefined },
    ]
  },
  {
    name: 'Category 3 – Project & Financial Management',
    skills: [
      { id: 14, name: '3.1 Project Management Principles', status: 'not-started', rank: undefined },
      { id: 15, name: '3.2 Finances & Budget', status: 'not-started', rank: undefined },
    ]
  },
  {
    name: 'Category 4 – Team Effectiveness',
    skills: [
      { id: 16, name: '4.1 Promote Team Effectiveness & Resolve Conflict', status: 'not-started', rank: undefined },
    ]
  },
  {
    name: 'Category 5 – Professional Accountability',
    skills: [
      { id: 17, name: '5.1 Professional Accountability (Ethics, Liability, Limits)', status: 'not-started', rank: undefined },
    ]
  },
  {
    name: 'Category 6 – Social, Economic, Environmental & Sustainability',
    skills: [
      { id: 18, name: '6.1 Protection of the Public Interest', status: 'not-started', rank: undefined },
      { id: 19, name: '6.2 Benefits of Engineering to the Public', status: 'not-started', rank: undefined },
      { id: 20, name: '6.3 Role of Regulatory Bodies', status: 'not-started', rank: undefined },
      { id: 21, name: '6.4 Application of Sustainability Principles', status: 'not-started', rank: undefined },
      { id: 22, name: '6.5 Promotion of Sustainability', status: 'not-started', rank: undefined },
    ]
  },
];

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skillCategories: initialSkillCategories,
  loading: false,
  error: null,

  setSkillCategories: (categories) => set({ skillCategories: categories }),

  loadUserSkills: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }

      // First, check if user has any skills
      let { data: existingSkills, error: fetchError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching user skills:', fetchError);
        throw fetchError;
      }

      // If no skills exist for the user, initialize them
      if (!existingSkills || existingSkills.length === 0) {
        console.log('Initializing skills for new user');
        const initialSkills = initialSkillCategories.flatMap(category =>
          category.skills.map(skill => ({
            user_id: user.id,
            skill_id: skill.id,
            category_name: category.name,
            skill_name: skill.name,
            rank: null,
            status: 'not-started'
          }))
        );

        const { error: insertError } = await supabase
          .from('user_skills')
          .insert(initialSkills);

        if (insertError) {
          console.error('Error initializing user skills:', insertError);
          throw insertError;
        }

        // Fetch the newly inserted skills
        const { data: newSkills, error: newFetchError } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id);

        if (newFetchError) {
          console.error('Error fetching newly initialized skills:', newFetchError);
          throw newFetchError;
        }

        existingSkills = newSkills;
      }

      // Update the store with user's skill rankings
      const updatedCategories = get().skillCategories.map(category => ({
        ...category,
        skills: category.skills.map(skill => {
          const userSkill = existingSkills?.find(us => 
            us.skill_id === skill.id && us.category_name === category.name
          );
          return {
            ...skill,
            rank: userSkill?.rank || undefined,
            status: userSkill?.status || 'not-started'
          };
        })
      }));

      set({ skillCategories: updatedCategories });
    } catch (error: any) {
      console.error('Error in loadUserSkills:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      set({ error: `Failed to load skills: ${error.message || 'Unknown error'}` });
    } finally {
      set({ loading: false });
    }
  },

  updateSkillRank: async (categoryIndex: number, skillId: number, rank: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }

      const category = get().skillCategories[categoryIndex];
      const skill = category.skills.find(s => s.id === skillId);
      if (!skill) {
        console.error('Skill not found:', { categoryIndex, skillId });
        throw new Error('Skill not found');
      }

      // Optimistically update the UI first
      set(state => ({
        skillCategories: state.skillCategories.map((category, index) => {
          if (index === categoryIndex) {
            return {
              ...category,
              skills: category.skills.map(skill => {
                if (skill.id === skillId) {
                  return { 
                    ...skill, 
                    rank: rank || undefined,
                    status: rank ? 'completed' : 'not-started'
                  };
                }
                return skill;
              })
            };
          }
          return category;
        })
      }));

      // Then sync with Supabase in the background
      const updateData = {
        user_id: user.id,
        skill_id: skillId,
        category_name: category.name,
        skill_name: skill.name,
        rank: rank || null,
        status: rank ? 'completed' : 'not-started'
      };

      const { error } = await supabase
        .from('user_skills')
        .upsert(updateData, {
          onConflict: 'user_id,skill_id'
        });

      if (error) {
        // If there's an error, revert the optimistic update
        console.error('Error syncing with Supabase:', error);
        // Reload the skills to ensure consistency
        await get().loadUserSkills();
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating skill rank:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      set({ 
        error: `Failed to update skill rank: ${error.message || 'Unknown error'}`
      });
    }
  }
})); 