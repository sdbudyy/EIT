import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, AlertCircle, Upload } from 'lucide-react';
import { useDocumentsStore, Document } from '../store/documents';
import { supabase } from '../lib/supabase';

const Documents: React.FC = () => {
  const {
    documents,
    loading,
    error,
    fetchDocuments,
    addDocument,
    deleteDocument,
  } = useDocumentsStore();

  useEffect(() => {
    console.log('Documents component mounted or fetchDocuments changed');
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    console.log('Documents array updated:', {
      documentCount: documents.length,
      documents
    });
  }, [documents]);

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const title = file.name;
    try {
      console.log('Starting document upload process...');
      await addDocument({
        title,
        description: null,
        category: 'General',
        status: 'draft',
        related_skill_id: null,
        related_experience_id: null,
        file_url: null,
        file_type: null,
        file_size: null,
      }, file);
      console.log('Document upload completed successfully');
      // Clear the file input
      e.target.value = '';
    } catch (err) {
      console.error('Document upload failed:', err);
      // Error is already handled in store, but we can add additional handling here if needed
    }
  };

  // Add a function to refresh the documents list
  const refreshDocuments = async () => {
    try {
      console.log('Manually refreshing documents list...');
      await fetchDocuments();
      console.log('Documents list refreshed');
    } catch (err) {
      console.error('Failed to refresh documents:', err);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) {
      console.error('No file URL available for document:', doc);
      return;
    }

    try {
      console.log('Starting file download:', {
        title: doc.title,
        url: doc.file_url,
        fileType: doc.file_type,
        fileSize: doc.file_size
      });

      // First, try to get a signed URL if the file is private
      let downloadUrl = doc.file_url;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Extract the file path from the URL
          const urlParts = doc.file_url.split('/');
          const filePath = urlParts.slice(urlParts.indexOf('documents') + 1).join('/');
          
          console.log('Getting signed URL for path:', filePath);
          
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(filePath, 60); // URL valid for 60 seconds

          if (signedUrlError) {
            console.error('Error getting signed URL:', signedUrlError);
          } else if (signedUrlData?.signedUrl) {
            console.log('Got signed URL successfully');
            downloadUrl = signedUrlData.signedUrl;
          }
        }
      } catch (signedUrlError) {
        console.error('Error in signed URL generation:', signedUrlError);
        // Continue with public URL if signed URL fails
      }

      console.log('Attempting to fetch file from URL:', downloadUrl);

      // Fetch the file
      const response = await fetch(downloadUrl);
      console.log('Fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed with response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorText
        });
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      // Get the file blob
      const blob = await response.blob();
      console.log('File blob received:', {
        type: blob.type,
        size: blob.size
      });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;

      // Set the download filename
      // Use the original file extension if available, otherwise try to determine from file_type
      const fileExt = doc.file_type?.split('/').pop() || 'bin';
      const fileName = `${doc.title}.${fileExt}`;
      link.download = fileName;

      console.log('Initiating download with filename:', fileName);

      // Append to body, click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('File download completed successfully');
    } catch (error) {
      console.error('Download failed with error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add a loading state for downloads
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-slate-500 mt-1">Upload, view, and manage your documents.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshDocuments}
            className="btn btn-secondary flex items-center gap-2"
            title="Refresh documents list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
          <label className="btn btn-primary flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            Upload
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No documents</h3>
          <p className="mt-2 text-slate-500">
            Get started by uploading your first document.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-slate-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {doc.title}
                        </div>
                        {doc.description && (
                          <div className="text-sm text-slate-500">
                            {doc.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                    <button
                      onClick={async () => {
                        setDownloadingId(doc.id);
                        try {
                          await handleDownload(doc);
                        } finally {
                          setDownloadingId(null);
                        }
                      }}
                      disabled={downloadingId === doc.id}
                      className={`text-teal-600 hover:text-teal-900 ${downloadingId === doc.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={downloadingId === doc.id ? 'Downloading...' : 'Download'}
                    >
                      {downloadingId === doc.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full" />
                      ) : (
                        <Download size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Documents;