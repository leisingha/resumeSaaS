import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
    }
  }, [generatedContent]);

  useLayoutEffect(() => {
    const calculateScale = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode && contentNode.firstChild) {
        const containerWidth = containerNode.offsetWidth;
        const contentElement = contentNode.firstChild as HTMLElement;
        const contentWidth = contentElement.offsetWidth;

        if (contentWidth > 0 && containerWidth > 0) {
          const scale = containerWidth / contentWidth;
          contentNode.style.transform = `scale(${scale})`;
          const contentHeight = contentElement.offsetHeight;
          containerNode.style.height = `${contentHeight * scale}px`;
        }
      }
    };

    calculateScale();

    window.addEventListener('resize', calculateScale);
    return () => {
      window.removeEventListener('resize', calculateScale);
    };
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
    <>
      {/* Header */}
      <div className='flex justify-between items-center'>
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
      <div
        ref={containerRef}
        className='w-full overflow-hidden rounded-lg border border-stroke dark:border-strokedark'
      >
        <div
          ref={contentRef}
          id='resume-content'
          style={{
            transformOrigin: 'top left',
          }}
          dangerouslySetInnerHTML={{ __html: generatedContent || '<p>Your generated document will appear here...</p>' }}
        />
      </div>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onContentChange}
        initialContent={generatedContent || ''}
      />
    </>
  );
};

export default ResumeDisplay; 