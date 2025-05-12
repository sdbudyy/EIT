import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Award, BarChart3, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProgressCard from '../components/dashboard/ProgressCard';
import RecentActivities from '../components/dashboard/RecentActivities';
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines';
import SkillsOverview from '../components/dashboard/SkillsOverview';
import { useProgressStore } from '../store/progress';
import { useEssayStore } from '../store/essays';

type ProgressStat = {
  title: string;
  value: number;
  total?: number;
  description: string;
  color: 'teal' | 'blue' | 'indigo' | 'purple';
};

const Dashboard: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const {
    overallProgress,
    completedSkills,
    totalSkills,
    documentedExperiences,
    totalExperiences,
    supervisorApprovals,
    totalApprovals,
    lastUpdated,
    loading,
    updateProgress
  } = useProgressStore();
  const startWriting = useEssayStore(state => state.startWriting);
  const essayLoading = useEssayStore(state => state.loading);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      }
    };

    const testDatabase = async () => {
      try {
        // Test inserting a skill
        const { data: skillData, error: skillError } = await supabase
          .from('skills')
          .insert([
            {
              name: 'Test Skill',
              description: 'A test skill to verify database operations',
              category: 'Technical',
              status: 'completed'
            }
          ])
          .select();

        if (skillError) {
          console.error('Error inserting skill:', skillError);
          return;
        }
        console.log('Successfully inserted skill:', skillData);

        // Test inserting an experience
        const { data: expData, error: expError } = await supabase
          .from('experiences')
          .insert([
            {
              title: 'Test Experience',
              description: 'A test experience to verify database operations',
              category: 'Project Management',
              is_documented: true,
              supervisor_approved: true
            }
          ])
          .select();

        if (expError) {
          console.error('Error inserting experience:', expError);
          return;
        }
        console.log('Successfully inserted experience:', expData);

        // Test retrieving all skills
        const { data: skills, error: skillsError } = await supabase
          .from('skills')
          .select('*');

        if (skillsError) {
          console.error('Error fetching skills:', skillsError);
          return;
        }
        console.log('Successfully fetched skills:', skills);

        // Test retrieving all experiences
        const { data: experiences, error: experiencesError } = await supabase
          .from('experiences')
          .select('*');

        if (experiencesError) {
          console.error('Error fetching experiences:', experiencesError);
          return;
        }
        console.log('Successfully fetched experiences:', experiences);

        // Update progress to reflect new data
        await updateProgress();

      } catch (error) {
        console.error('Database test failed:', error);
      }
    };

    getUserProfile();
    testDatabase(); // Run the test
    updateProgress(); // Load initial progress data
  }, [updateProgress]);

  // Only construct progressStats if all values are not null
  const allProgressLoaded = overallProgress !== null && completedSkills !== null && documentedExperiences !== null && supervisorApprovals !== null && totalSkills !== null && totalExperiences !== null && totalApprovals !== null;

  const progressStats: ProgressStat[] = allProgressLoaded ? [
    { 
      title: 'Overall Progress', 
      value: overallProgress as number,
      description: (overallProgress as number) >= 75 ? 'Excellent progress!' : 
                 (overallProgress as number) >= 50 ? 'Good progress!' : 
                 (overallProgress as number) >= 25 ? 'Keep going!' : 'Just getting started!',
      color: 'teal' 
    },
    { 
      title: 'Completed Skills', 
      value: completedSkills as number,
      total: totalSkills as number,
      description: `${(totalSkills as number) - (completedSkills as number)} skills remaining to complete`,
      color: 'blue' 
    },
    { 
      title: 'Documented Experience', 
      value: documentedExperiences as number,
      total: totalExperiences as number,
      description: `${(totalExperiences as number) - (documentedExperiences as number)} experiences need documentation`,
      color: 'indigo' 
    },
    { 
      title: 'Supervisor Approvals', 
      value: supervisorApprovals as number,
      total: totalApprovals as number,
      description: `${(totalApprovals as number) - (supervisorApprovals as number)} items pending approval`,
      color: 'purple' 
    },
  ] : [];

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Welcome back, {userName || 'Engineer'}!
          </h1>
          <p className="text-slate-500 mt-1">Here's an overview of your EIT progress</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <span className="text-sm text-slate-500 flex items-center">
            <Clock size={14} className="mr-1" /> 
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
          <button 
            className={`btn btn-primary ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            onClick={() => updateProgress()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      {!allProgressLoaded ? (
        <div className="flex justify-center items-center h-32">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mr-2"></span>
          <span className="text-teal-700 font-medium">Loading progress...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {progressStats.map((stat, index) => (
            <ProgressCard key={index} {...stat} />
          ))}
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Calendar size={18} className="mr-2 text-teal-600" />
                Recent Activities
              </h2>
              <button 
                onClick={() => setIsActivitiesModalOpen(true)}
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
              >
                View All <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <RecentActivities isModalOpen={isActivitiesModalOpen} onCloseModal={() => setIsActivitiesModalOpen(false)} />
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <Award size={18} className="mr-2 text-teal-600" />
                Upcoming Deadlines
              </h2>
              <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center">
                View All <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <UpcomingDeadlines />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <BarChart3 size={18} className="mr-2 text-teal-600" />
                Skills Overview
              </h2>
              <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center">
                Details <ArrowRight size={14} className="ml-1" />
              </button>
            </div>
            <SkillsOverview />
          </div>
          
          <div className="card border-2 border-teal-100 bg-teal-50/50">
            <h3 className="font-semibold text-teal-800 mb-2">AI Writing Assistant</h3>
            <p className="text-sm text-teal-700 mb-3">
              Let our AI help you draft your next Self-Assessment Outcome (SAO) essay based on your documented experiences.
            </p>
            <button 
              className={`btn btn-primary w-full ${essayLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              onClick={() => startWriting()}
              disabled={essayLoading}
            >
              {essayLoading ? 'Generating...' : 'Start Writing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;