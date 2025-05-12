import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useSkillsStore, Skill } from '../../store/skills';
import { useSAOsStore, SAO } from '../../store/saos';

interface SAOModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSAO?: SAO;
}

const SAOModal: React.FC<SAOModalProps> = ({ isOpen, onClose, editSAO }) => {
  const [title, setTitle] = useState('');
  const [sao, setSao] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const { skillCategories } = useSkillsStore();
  const { createSAO, updateSAO, loading, error } = useSAOsStore();

  // Reset form when modal opens with editSAO
  useEffect(() => {
    if (isOpen && editSAO) {
      setTitle(editSAO.title);
      setSao(editSAO.content);
      setSelectedSkills(editSAO.skills);
    } else if (isOpen) {
      setTitle('');
      setSao('');
      setSelectedSkills([]);
    }
  }, [isOpen, editSAO]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editSAO) {
        await updateSAO(editSAO.id, title, sao, selectedSkills);
      } else {
        await createSAO(title, sao, selectedSkills);
      }
      setTitle('');
      setSao('');
      setSelectedSkills([]);
      onClose();
    } catch (error) {
      console.error('Error saving SAO:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {editSAO ? 'Edit SAO' : 'Create New SAO'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Enter SAO title"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="sao" className="block text-sm font-medium text-slate-700 mb-1">
              Situation-Action-Outcome
            </label>
            <textarea
              id="sao"
              value={sao}
              onChange={(e) => setSao(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[200px]"
              placeholder="Describe your situation, actions, and outcomes..."
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Relevant Skills
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                >
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => setSelectedSkills(prev => prev.filter(s => s.id !== skill.id))}
                    className="ml-1 text-teal-600 hover:text-teal-800"
                    disabled={loading}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsSkillsModalOpen(true)}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
              disabled={loading}
            >
              <Plus size={18} />
              Select Skills
            </button>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : editSAO ? 'Update SAO' : 'Create SAO'}
            </button>
          </div>
        </form>

        {/* Skills Selection Modal */}
        {isSkillsModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[110]">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Skills</h3>
                <button
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {skillCategories.map((category) => (
                  <div key={category.name} className="border rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">{category.name}</h4>
                    <div className="space-y-2">
                      {category.skills.map((skill) => (
                        <label
                          key={skill.id}
                          className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkills.some(s => s.id === skill.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSkills(prev => [...prev, { ...skill, category_name: category.name }]);
                              } else {
                                setSelectedSkills(prev => prev.filter(s => s.id !== skill.id));
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-sm">{skill.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsSkillsModalOpen(false)}
                  className="btn btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SAOModal; 