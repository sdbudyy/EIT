import React, { useEffect, useState } from 'react';
import { CheckCircle2, FileText, UserCheck, Edit3, ArrowRight, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSAOsStore, SAO } from '../../store/saos';
import SAOModal from '../saos/SAOModal';
import RecentActivitiesModal from './RecentActivitiesModal';

export interface ActivityProps {
  id: string;
  type: 'completed' | 'document' | 'approval' | 'essay' | 'sao' | 'skill_rank';
  title: string;
  timestamp: string;
  user?: string;
  link?: string;
}

interface Skill {
  id: string;
  name: string;
  completed_at: string | null;
  rank: number | null;
  updated_at: string;
}

interface RecentActivitiesProps {
  isModalOpen: boolean;
  onCloseModal: () => void;
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ isModalOpen, onCloseModal }) => {
  const [activities, setActivities] = useState<ActivityProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSAO, setSelectedSAO] = useState<SAO | null>(null);
  const [isSAOModalOpen, setIsSAOModalOpen] = useState(false);
  const navigate = useNavigate();
  const { loadUserSAOs } = useSAOsStore();

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch recent SAOs
        const { data: saos } = await supabase
          .from('saos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch recent documents
        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch recent skills
        const { data: skills } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5);

        // Combine and sort all activities
        const allActivities: ActivityProps[] = [
          ...(saos?.map(sao => ({
            id: sao.id,
            type: 'sao' as const,
            title: `Created SAO: ${sao.title}`,
            timestamp: sao.created_at,
            link: `/saos/${sao.id}`
          })) || []),
          ...(documents?.map(doc => ({
            id: doc.id,
            type: 'document' as const,
            title: `Uploaded document: ${doc.title}`,
            timestamp: doc.created_at,
            link: `/documents/${doc.id}`
          })) || []),
          ...(skills?.map((skill) => {
            if (skill.status === 'completed') {
              return {
                id: skill.id,
                type: 'completed' as const,
                title: `Completed skill: ${skill.skill_name}`,
                timestamp: skill.updated_at,
                link: `/skills/${skill.skill_id}`
              } as ActivityProps;
            } else if (skill.rank !== null) {
              return {
                id: skill.id,
                type: 'skill_rank' as const,
                title: `Updated rank for ${skill.skill_name} to ${skill.rank}`,
                timestamp: skill.updated_at,
                link: `/skills/${skill.skill_id}`
              } as ActivityProps;
            }
            return null;
          }).filter((activity): activity is ActivityProps => activity !== null) || [])
        ].sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        }).slice(0, 5);

        setActivities(allActivities);
      } catch (error) {
        console.error('Error fetching recent activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  const handleViewSAO = async (saoId: string) => {
    try {
      const { data: sao } = await supabase
        .from('saos')
        .select(`
          *,
          sao_skills (
            skill_id,
            category_name,
            skill_name
          )
        `)
        .eq('id', saoId)
        .single();
      
      if (sao) {
        const transformedSAO: SAO = {
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
        };
        setSelectedSAO(transformedSAO);
        setIsSAOModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching SAO:', error);
    }
  };

  const handleCloseModal = () => {
    setIsSAOModalOpen(false);
    setSelectedSAO(null);
  };

  const handleSkillClick = (skillId: string) => {
    // Extract the skill_id from the link
    const skillIdMatch = skillId.match(/\d+$/);
    if (skillIdMatch) {
      const actualSkillId = skillIdMatch[0];
      navigate(`/skills#skill-${actualSkillId}`);
    }
  };

  const typeIcons = {
    completed: <CheckCircle2 size={16} className="text-green-500" />,
    document: <FileText size={16} className="text-blue-500" />,
    approval: <UserCheck size={16} className="text-purple-500" />,
    essay: <Edit3 size={16} className="text-amber-500" />,
    sao: <Edit3 size={16} className="text-teal-500" />,
    skill_rank: <TrendingUp size={16} className="text-indigo-500" />
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="p-2 rounded-full bg-slate-200 mt-0.5 w-8 h-8"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 group">
            <div className="p-2 rounded-full bg-slate-100 mt-0.5">
              {typeIcons[activity.type]}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-800">{activity.title}</p>
                {activity.link && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {activity.type === 'document' && (
                      <button
                        onClick={() => navigate(activity.link as string)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                        title="View document"
                      >
                        <FileText size={12} className="mr-1" />
                        View
                      </button>
                    )}
                    {activity.type === 'sao' && (
                      <button
                        onClick={() => handleViewSAO(activity.id)}
                        className="text-xs text-teal-600 hover:text-teal-700 flex items-center"
                        title="View SAO"
                      >
                        <Edit3 size={12} className="mr-1" />
                        View
                      </button>
                    )}
                    {(activity.type === 'completed' || activity.type === 'skill_rank') && activity.link && (
                      <button
                        onClick={() => handleSkillClick(activity.link as string)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center"
                        title="View skill"
                      >
                        <TrendingUp size={12} className="mr-1" />
                        View
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center mt-1">
                {activity.user && (
                  <span className="text-xs font-medium text-slate-700 mr-2">{activity.user}</span>
                )}
                <span className="text-xs text-slate-500">{formatTimestamp(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center py-4 text-sm text-slate-500">
            No recent activities
          </div>
        )}
      </div>

      <SAOModal
        isOpen={isSAOModalOpen}
        onClose={handleCloseModal}
        editSAO={selectedSAO || undefined}
      />

      <RecentActivitiesModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        activities={activities}
        onViewSAO={(sao) => {
          setSelectedSAO(sao);
          setIsSAOModalOpen(true);
        }}
      />
    </>
  );
};

export default RecentActivities;