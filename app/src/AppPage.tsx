import React, { useState, useEffect } from 'react';
import AccordionLayout from './features/topsection/AccordionLayout';
import ResumeCustomizer from './features/customizer/ResumeCustomizer';
import ResumeDisplay from './features/display/ResumeDisplay';
import SuccessAlert from './features/common/SuccessAlert';
import { useQuery, useAction } from 'wasp/client/operations';
import { getUserProfile } from 'wasp/client/operations';
import { generateDocument, updateGeneratedDocument } from 'wasp/client/operations';
import type { GeneratedDocument } from 'wasp/entities';

// Define types for customization options
export interface CustomizationOptions {
  template: string;
  colorScheme: string;
  targetJobTitle: string;
  targetCompany: string;
  keySkills: string; // Comma-separated
  tone: string; // e.g., 'formal', 'neutral', 'casual'
  // TODO: Add fields for cover letter later, e.g., recipientName?: string, companyAddress?: string etc.
}

export type DocumentType = 'resume' | 'coverLetter'; // Export DocumentType

const AppPage = () => {
  const { data: userProfile } = useQuery(getUserProfile);
  const updateGeneratedDocumentAction = useAction(updateGeneratedDocument);

  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [activeDocument, setActiveDocument] = useState<GeneratedDocument | null>(null);

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOptions>({
    template: 'classic',
    colorScheme: 'blue',
    targetJobTitle: '',
    targetCompany: '',
    keySkills: '',
    tone: 'neutral',
  });
  const [documentType, setDocumentType] = useState<DocumentType>('resume');
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const generatedResumeContent = activeDocument?.content || null;
  const isResumeGenerated = !!activeDocument;

  useEffect(() => {
    if (userProfile) {
      const wasComplete = isProfileComplete;
      const isNowComplete = !!(userProfile.firstName && userProfile.lastName && userProfile.phone);
      
      setIsProfileComplete(isNowComplete);

      // Only automatically change the accordion state if the completeness status has changed.
      // This allows the user to manually toggle the accordion otherwise.
      if (wasComplete !== isNowComplete) {
        setIsAccordionOpen(!isNowComplete);
      }
    }
  }, [userProfile, isProfileComplete]);

  const handleGenerateResume = async () => {
    setIsGenerating(true);
    try {
      const newDocument = await generateDocument({
        customizationOptions: {
          targetJobTitle: customizationOptions.targetJobTitle,
          targetCompany: customizationOptions.targetCompany,
          keySkills: customizationOptions.keySkills,
          tone: customizationOptions.tone,
        },
        documentType,
      });
      setActiveDocument(newDocument);
      setIsEditing(false);
      setShowEditModal(false);
      setIsDetailCustomizerVisible(false);
      const docTypeDisplay = documentType === 'resume' ? 'Resume' : 'Cover Letter';
      setAlertMessage(`${docTypeDisplay} Generated Successfully!`);
      setShowSuccessAlert(true);
    } catch (error: any) {
      console.error('Error generating document: ', error);
      alert('Error generating document: ' + (error.message || 'Something went wrong.'));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccessAlert) {
      timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showSuccessAlert]);

  const handleEditSave = async (newContent: string) => {
    if (!activeDocument) return;
    try {
      await updateGeneratedDocumentAction({
        id: activeDocument.id,
        content: newContent,
      });
      // Update local state after saving
      setActiveDocument({ ...activeDocument, content: newContent });
      alert('Document saved successfully!');
    } catch (error: any) {
      console.error('Error saving document: ', error);
      alert('Error saving document: ' + (error.message || 'Something went wrong.'));
    }
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setActiveDocument(null);
    setIsDetailCustomizerVisible(true);
    setShowSuccessAlert(false);
  };

  const handleCancelAdjustCustomizations = () => {
    setIsDetailCustomizerVisible(false);
    setShowSuccessAlert(false);
  };

  const handleShowAdjustCustomizations = () => {
    setIsDetailCustomizerVisible(true);
    setShowSuccessAlert(false);
  };

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDetailCustomizerVisible, setIsDetailCustomizerVisible] = useState<boolean>(true);

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-6 2xl:p-10'>
      {showSuccessAlert && (
        <SuccessAlert message={alertMessage} onClose={() => setShowSuccessAlert(false)} />
      )}
      <AccordionLayout
        isAccordionOpen={isAccordionOpen}
        onAccordionToggle={() => setIsAccordionOpen(!isAccordionOpen)}
        isProfileComplete={isProfileComplete}
      />

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <div className='flex flex-col gap-6 md:col-span-1'>
          <ResumeCustomizer part='templateControls' options={customizationOptions} onOptionsChange={setCustomizationOptions} />
        </div>

        <div className='flex flex-col gap-6 md:col-span-2'>
          {isGenerating ? (
            <div className='mt-8 flex h-40 items-center justify-center'>
              <div className='typewriter'>
                <div className='slide'>
                  <i></i>
                </div>
                <div className='paper'></div>
                <div className='keyboard'></div>
              </div>
            </div>
          ) : isDetailCustomizerVisible ? (
            <>
              <ResumeCustomizer
                part='detailControls'
                options={customizationOptions}
                onOptionsChange={setCustomizationOptions}
                documentType={documentType}
                onDocumentTypeChange={handleDocumentTypeChange}
              />
              <div className='flex gap-3'>
                {isResumeGenerated ? (
                  <>
                    <button
                      onClick={handleGenerateResume}
                      className='flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90'
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleCancelAdjustCustomizations}
                      className='dark:border-strokedark flex w-full justify-center rounded border border-stroke p-3 font-medium text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleGenerateResume}
                    className='flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90'
                  >
                    Generate
                  </button>
                )}
              </div>
            </>
          ) : null}

          {isResumeGenerated && !isDetailCustomizerVisible && !isGenerating && (
            <div className='space-y-4'>
              <ResumeDisplay
                options={customizationOptions}
                generatedContent={generatedResumeContent}
                isResumeGenerated={isResumeGenerated}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                onContentChange={handleEditSave}
                documentType={documentType}
              />
              <button
                onClick={handleShowAdjustCustomizations}
                className='-mt-2 flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90'
              >
                Adjust Customizations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPage; 