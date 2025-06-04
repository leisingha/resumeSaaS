import React, { useState, useEffect } from 'react';
import type { CustomizationOptions, DocumentType } from '../../AppPage';

interface ResumeDisplayProps {
  options: CustomizationOptions;
  generatedContent: string | null;
  isResumeGenerated: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onContentChange: (newContent: string) => void;
  documentType: DocumentType;
}

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({ 
  options,
  generatedContent,
  showEditModal,
  setShowEditModal,
  onContentChange,
  documentType
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
        .then(() => console.log('Copied to clipboard')) // Replace with user feedback
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}_${options.targetJobTitle || 'document'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSaveChanges = () => {
    onContentChange(editedContent);
    setShowEditModal(false);
  };

  const documentTitle = documentType === 'resume' ? 'Resume' : 'Cover Letter';

  return (
    <div className="bg-boxdark border border-strokedark rounded-lg shadow-default p-6">
      {/* New Header Section */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-strokedark">
        {/* Left Side: Title and Customization Info */}
        <div>
          <h2 className="text-xl font-semibold text-white">
            Generated {documentTitle}
          </h2>
          <div className="text-sm text-gray-400 mt-1">
            <span>Template: <span className="font-medium text-gray-300">{options.template}</span></span>
            <span className="ml-3">Color: <span className="font-medium text-gray-300">{options.colorScheme}</span></span>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleCopy} 
            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-boxdark"
          >
            Copy
          </button>
          <button 
            onClick={handleDownload} 
            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-boxdark"
          >
            Download
          </button>
          <button 
            onClick={() => setShowEditModal(true)} 
            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-boxdark"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Main Content Display */}
      <div className="prose prose-invert max-w-none text-gray-300">
        {generatedContent ? (
          <pre className="whitespace-pre-wrap break-words p-4 bg-gray-800 rounded-md">{generatedContent}</pre>
        ) : (
          <p>No document generated yet.</p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-boxdark p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Edit {documentTitle}</h3>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full flex-grow p-3 bg-gray-800 border border-strokedark rounded-md text-gray-300 resize-none focus:ring-primary focus:border-primary"
              rows={15}
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark"
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