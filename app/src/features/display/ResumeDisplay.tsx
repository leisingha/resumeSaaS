import React, { useState, useEffect } from 'react';
import type { CustomizationOptions, DocumentType } from '../../AppPage';
import EditModal from './EditModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResumeDisplayProps {
  options: CustomizationOptions;
  generatedContent: string | null;
  isResumeGenerated: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onContentChange: (newContent: string) => void;
  documentType: 'resume' | 'coverLetter';
}

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({
  options,
  generatedContent,
  isResumeGenerated,
  isEditing,
  setIsEditing,
  showEditModal,
  setShowEditModal,
  onContentChange,
  documentType,
}) => {
  const [editedContent, setEditedContent] = useState(generatedContent || '');

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
    }
  }, [generatedContent]);

  const documentTitle = documentType === 'resume' ? 'Resume' : 'Cover Letter';

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      alert('Copied to clipboard!');
    }
  };

  const handleDownloadPdf = () => {
    const input = document.getElementById('resume-content');
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('resume.pdf');
      });
    }
  };

  const handleSaveChanges = () => {
    onContentChange(editedContent);
    setShowEditModal(false);
  };

  return (
    <div className='bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-default p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-4 pb-4 border-b border-stroke dark:border-strokedark'>
        <div>
          <h2 className='text-xl font-semibold text-black dark:text-white'>Generated {documentTitle}</h2>
          <div className='text-sm text-gray-400 mt-1'>
            <span>
              Template: <span className='font-medium text-gray-500 dark:text-gray-300'>{options.template}</span>
            </span>
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleCopyToClipboard}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Copy
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Edit
          </button>
          <button
            onClick={handleDownloadPdf}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Download
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className='max-w-full overflow-x-auto rounded-lg border-[1.5px] border-stroke bg-gray-50 dark:border-form-strokedark dark:bg-form-input p-5'>
        <div
          id='resume-content'
          className='prose dark:prose-invert min-w-full'
          dangerouslySetInnerHTML={{ __html: generatedContent || '<p>Your generated document will appear here...</p>' }}
        />
      </div>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onContentChange}
        initialContent={generatedContent || ''}
      />
    </div>
  );
};

export default ResumeDisplay; 