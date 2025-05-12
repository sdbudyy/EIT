import React from 'react';
import { X, FileText, CheckCircle, TrendingUp, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivityProps } from './RecentActivities';
import { supabase } from '../../lib/supabase';
import { SAO } from '../../store/saos';

interface RecentActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityProps[];
  onViewSAO?: (sao: SAO) => void;
}

const RecentActivitiesModal: React.FC<RecentActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities,
  onViewSAO
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText size={18} className="text-blue-500" />;
      case 'approval':
        return <CheckCircle size={18} className="text-purple-500" />;
      case 'skill_rank':
        return <TrendingUp size={18} className="text-indigo-500" />;
      case 'sao':
        return <Edit3 size={18} className="text-teal-500" />;
      case 'completed':
        return <CheckCircle size={18} className="text-green-500" />;
      default:
        return <FileText size={18} className="text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewActivity = async (activity: ActivityProps) => {
    if (!activity.link) return;

    switch (activity.type) {
      case 'document':
        navigate(activity.link);
        break;
      case 'sao':
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
            .eq('id', activity.id)
            .single();
          
          if (sao && onViewSAO) {
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
            onViewSAO(transformedSAO);
          }
        } catch (error) {
          console.error('Error fetching SAO:', error);
        }
        break;
      case 'completed':
      case 'skill_rank':
        // Extract the skill_id from the link
        const skillIdMatch = activity.link.match(/\d+$/);
        if (skillIdMatch) {
          const actualSkillId = skillIdMatch[0];
          navigate(`/skills#skill-${actualSkillId}`);
        }
        break;
      default:
        navigate(activity.link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-800">Recent Activities</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800">{activity.title}</h4>
                      {activity.link && (
                        <button
                          onClick={() => handleViewActivity(activity)}
                          className="text-xs text-teal-600 hover:text-teal-700 flex items-center"
                        >
                          View
                        </button>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivitiesModal; 