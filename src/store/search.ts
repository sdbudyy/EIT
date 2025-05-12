import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'skill' | 'sao';
  title: string;
  description: string;
  link: string;
  data?: any; // Additional data for SAOs
}

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  loading: false,
  error: null,
  search: async (query: string) => {
    if (!query.trim()) {
      set({ results: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Searching for:', query);

      // Search in user_skills table
      const { data: skills, error: skillsError } = await supabase
        .from('user_skills')
        .select(`
          id,
          skill_id,
          skill_name,
          rank,
          category_name
        `)
        .eq('user_id', user.id)
        .ilike('skill_name', `%${query}%`);

      console.log('Skills search results:', skills);
      if (skillsError) {
        console.error('Skills search error:', skillsError);
        throw skillsError;
      }

      // Search in SAOs with their skills
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
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

      console.log('SAOs search results:', saos);
      if (saosError) {
        console.error('SAOs search error:', saosError);
        throw saosError;
      }

      const results: SearchResult[] = [
        ...(skills?.map(skill => ({
          id: skill.id,
          type: 'skill' as const,
          title: skill.skill_name,
          description: `Category: ${skill.category_name}${skill.rank ? ` | Rank: ${skill.rank}` : ''}`,
          link: `/skills#skill-${skill.skill_id}`
        })) || []),
        ...(saos?.map(sao => ({
          id: sao.id,
          type: 'sao' as const,
          title: sao.title,
          description: sao.content?.substring(0, 100) + '...',
          link: '/saos',
          data: {
            id: sao.id,
            title: sao.title,
            content: sao.content,
            created_at: sao.created_at,
            updated_at: sao.updated_at,
            skills: sao.sao_skills.map((skill: any) => ({
              id: skill.skill_id,
              name: skill.skill_name,
              category_name: skill.category_name,
              status: 'completed'
            }))
          }
        })) || [])
      ];

      console.log('Final search results:', results);
      set({ results, loading: false });
    } catch (error: any) {
      console.error('Search error:', error);
      set({ error: error.message, loading: false });
    }
  }
})); 