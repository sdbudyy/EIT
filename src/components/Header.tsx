import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Search, X, BookOpen, FileEdit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu';
import { useSearchStore, SearchResult } from '../store/search';
import { useSAOsStore, SAO } from '../store/saos';
import SAOModal from './saos/SAOModal';
import ModalPortal from './ModalPortal';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSAOModalOpen, setIsSAOModalOpen] = useState(false);
  const [selectedSAO, setSelectedSAO] = useState<SAO | undefined>();
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { results, loading, search } = useSearchStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    await search(query);
  };

  const handleResultClick = (result: SearchResult) => {
    // Close the search dropdown
    setSearchQuery('');
    setIsSearchFocused(false);

    if (result.type === 'sao' && result.data) {
      // Navigate to SAOs page and open the edit modal
      navigate('/saos');
      // Ensure we have all required SAO fields
      const saoData: SAO = {
        id: result.data.id,
        title: result.data.title,
        content: result.data.content,
        created_at: result.data.created_at,
        updated_at: result.data.updated_at,
        skills: result.data.skills || []
      };
      setSelectedSAO(saoData);
      setIsSAOModalOpen(true);
    } else if (result.type === 'skill') {
      // Handle skill navigation
      navigate(result.link);
      // Wait for navigation and component mount
      setTimeout(() => {
        const skillId = result.link.split('#skill-')[1];
        const element = document.getElementById(`skill-${skillId}`);
        if (element) {
          // Scroll to the element with smooth behavior
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add a highlight effect
          element.classList.add('bg-teal-50', 'border-teal-300');
          // Remove highlight after 2 seconds
          setTimeout(() => {
            element.classList.remove('bg-teal-50', 'border-teal-300');
          }, 2000);
        }
      }, 100); // Small delay to ensure DOM is ready
    }
  };

  const handleCloseSAOModal = () => {
    setIsSAOModalOpen(false);
    setSelectedSAO(undefined);
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-0 md:left-64 bg-white/80 backdrop-blur-md z-10 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
          <div className="ml-2 md:ml-0">
            <h1 className="text-xl font-semibold text-slate-800">EIT Progress</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search skills, SAOs..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setIsSearchFocused(true)}
                className="pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isSearchFocused && (searchQuery || results.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500 mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-start space-x-3"
                      >
                        <div className="mt-1">
                          {result.type === 'skill' ? (
                            <BookOpen size={16} className="text-blue-500" />
                          ) : (
                            <FileEdit size={16} className="text-teal-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{result.title}</div>
                          {result.description && (
                            <div className="text-sm text-slate-500">{result.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <UserMenu />
        </div>
      </header>

      {/* SAO Modal */}
      <ModalPortal isOpen={isSAOModalOpen}>
        <SAOModal
          isOpen={isSAOModalOpen}
          onClose={handleCloseSAOModal}
          editSAO={selectedSAO}
        />
      </ModalPortal>
    </>
  );
};

export default Header;