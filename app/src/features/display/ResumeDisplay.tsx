import React, { useState, useEffect } from 'react';
import type { CustomizationOptions } from '../../AppPage';

interface ResumeDisplayProps {
  options: CustomizationOptions;
  generatedContent: string | null;
  isResumeGenerated: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onContentChange: (newContent: string) => void;
}

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ 
  options, 
  generatedContent,
  isResumeGenerated,
  isEditing,
  setIsEditing,
  showEditModal,
  setShowEditModal,
  onContentChange
}) => {
  const [editedContent, setEditedContent] = useState(generatedContent || '');

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
    }
  }, [generatedContent]);

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent)
        .then(() => console.log('Resume copied to clipboard!')) // Replace with toast later
        .catch(err => console.error('Failed to copy resume: ', err));
    }
  };

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.txt'; // Or use a more dynamic name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Downloading resume...'); // Replace with toast later
    }
  };

  const handleOpenEditModal = () => {
    setEditedContent(generatedContent || ''); // Reset to current generated content
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    onContentChange(editedContent);
    setIsEditing(false); // To switch view back to non-textarea
    setShowEditModal(false);
    console.log('Resume updated!'); // Replace with toast later
  };

  return (
    <div className='bg-white dark:bg-boxdark shadow-md p-6 rounded-sm mt-6 md:mt-0 relative'>
      <h2 className='text-lg font-semibold text-black dark:text-white mb-4'>
        Live Resume Preview
      </h2>

      {isResumeGenerated && generatedContent ? (
        <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 min-h-[400px]'>
          {/* Action Buttons - Placed at the top right of the preview */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={handleCopy} 
              className="px-3 py-1.5 text-xs font-medium rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Copy
            </button>
            <button 
              onClick={handleDownload} 
              className="px-3 py-1.5 text-xs font-medium rounded bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
            >
              Download
            </button>
            <button 
              onClick={handleOpenEditModal} 
              className="px-3 py-1.5 text-xs font-medium rounded bg-yellow-500 text-black hover:bg-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600"
            >
              Edit
            </button>
          </div>
          
          {/* Display Area */}
          <div className="mt-10 whitespace-pre-wrap text-sm text-black dark:text-white">
            {generatedContent}
          </div>
        </div>
      ) : (
        <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 p-10 min-h-[400px] flex flex-col items-center justify-center'>
          <p className='text-gray-700 dark:text-gray-300 text-center mb-4'>
            Your generated resume will appear here after you click "Generate Resume".
          </p>
          <div className='text-center'>
            <p className='text-md font-medium text-black dark:text-white'>Current Settings:</p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>Template: <span className='font-semibold'>{options.template}</span></p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>Color Scheme: <span className='font-semibold'>{options.colorScheme}</span></p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-boxdark p-6 rounded-lg shadow-xl w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Edit Resume Content</h3>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={15}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-4 py-2 rounded border border-stroke text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="px-4 py-2 rounded bg-primary text-white hover:bg-opacity-90"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDisplay; 