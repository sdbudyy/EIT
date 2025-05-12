import React, { useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocalDocumentStore } from '../store/localDocuments';

const TextInput: React.FC = () => {
  const [text, setText] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] = useState('Experience Reports');
  const navigate = useNavigate();
  const { addDocument } = useLocalDocumentStore();

  const handleSave = () => {
    try {
      if (!documentName.trim()) {
        alert('Please enter a document name');
        return;
      }

      addDocument(documentName, text, category);
      navigate('/documents');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Error saving document. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/documents')}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">New Text Document</h1>
          <p className="text-slate-500 mt-1">Write and save your text</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div>
          <label htmlFor="documentName" className="block text-sm font-medium text-slate-700 mb-1">
            Document Name
          </label>
          <input
            id="documentName"
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter document name..."
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Experience Reports">Experience Reports</option>
            <option value="Technical Reports">Technical Reports</option>
            <option value="Certificates">Certificates</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-[400px] p-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            placeholder="Start writing your text here..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary flex items-center"
        >
          <Save size={16} className="mr-1.5" />
          Save Document
        </button>
      </div>
    </div>
  );
};

export default TextInput; 