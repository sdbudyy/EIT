import React, { useEffect } from 'react';
import { CalendarClock, AlertCircle } from 'lucide-react';
import { useDeadlinesStore } from '../../store/deadlines';

const UpcomingDeadlines: React.FC = () => {
  const { deadlines, loading, error, loadDeadlines } = useDeadlinesStore();

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  const priorityClasses = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const calculateDaysLeft = (date: string) => {
    const deadline = new Date(date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-100 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-200 w-10 h-10"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-sm text-red-600">
        Error loading deadlines: {error}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-slate-500">
        No upcoming deadlines
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.map((deadline) => {
        const daysLeft = calculateDaysLeft(deadline.date);
        const isDueSoon = daysLeft <= 3;

        return (
          <div 
            key={deadline.id}
            className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex justify-between items-center"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${isDueSoon ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                <CalendarClock size={18} />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">{deadline.title}</h4>
                <div className="flex items-center mt-1 text-sm text-slate-500">
                  <span>{new Date(deadline.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric'
                  })}</span>
                  {isDueSoon && (
                    <span className="flex items-center ml-2 text-red-600">
                      <AlertCircle size={12} className="mr-1" />
                      Due in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${priorityClasses[deadline.priority]}`}>
                {deadline.priority.charAt(0).toUpperCase() + deadline.priority.slice(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingDeadlines;