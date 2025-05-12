import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  category: string;
  status: 'draft' | 'submitted' | 'approved';
  related_skill_id: string | null;
  related_experience_id: string | null;
}

interface DocumentsState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  addDocument: (document: Omit<Document, 'id' | 'created_at' | 'user_id'>, file?: File) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ documents: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch documents' });
    } finally {
      set({ loading: false });
    }
  },

  addDocument: async (document, file) => {
    set({ loading: true, error: null });
    try {
      let file_url = null;

      // If a file is provided, upload it to Supabase Storage
      if (file) {
        console.log('Starting file upload process...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth check - User:', user ? 'Authenticated' : 'Not authenticated');
        
        if (!user) {
          console.error('Authentication error: No user found');
          throw new Error('User not authenticated');
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log('File upload details:', {
          fileName,
          filePath,
          fileType: file.type,
          fileSize: file.size
        });

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error details:', {
            error: uploadError,
            message: uploadError.message,
            name: uploadError.name
          });
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        console.log('File upload successful:', uploadData);

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        console.log('Generated public URL:', publicUrl);
        file_url = publicUrl;
      }

      // Prepare document data for database insertion
      const documentData = {
        ...document,
        file_url,
        file_type: file?.type || null,
        file_size: file?.size || null,
        user_id: (await supabase.auth.getUser()).data.user?.id // Add user_id to the document
      };

      console.log('Attempting to insert document into database with data:', documentData);

      // Insert the document record
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error details:', {
          error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database insertion failed: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned after successful insert');
        throw new Error('Document was created but no data was returned');
      }

      console.log('Database insertion successful. Received data:', data);

      // Verify the current state before update
      const currentState = get();
      console.log('Current state before update:', {
        documentCount: currentState.documents.length,
        documents: currentState.documents
      });

      // Update the state with the new document
      set(state => {
        const newState = {
          documents: [data, ...state.documents]
        };
        console.log('Updating state with:', newState);
        return newState;
      });

      // Verify the state after update
      const updatedState = get();
      console.log('State after update:', {
        documentCount: updatedState.documents.length,
        documents: updatedState.documents
      });

      // Fetch documents again to ensure we have the latest data
      await get().fetchDocuments();

    } catch (error) {
      console.error('Full error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      set({ error: error instanceof Error ? error.message : 'Failed to add document' });
      throw error; // Re-throw to let the component know about the error
    } finally {
      set({ loading: false });
    }
  },

  updateDocument: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...data } : doc
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update document' });
    } finally {
      set({ loading: false });
    }
  },

  deleteDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      // Get the document to find the file URL
      const document = get().documents.find(doc => doc.id === id);
      
      // Delete the file from storage if it exists
      if (document?.file_url) {
        const filePath = document.file_url.split('/').pop();
        const { data: { user } } = await supabase.auth.getUser();
        if (filePath && user) {
          await supabase.storage
            .from('documents')
            .remove([`${user.id}/${filePath}`]);
        }
      }

      // Delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        documents: state.documents.filter(doc => doc.id !== id)
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete document' });
    } finally {
      set({ loading: false });
    }
  },
})); 