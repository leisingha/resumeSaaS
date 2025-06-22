import React, { useState, useEffect } from 'react';
import AccordionLayout from './features/topsection/AccordionLayout';
import ResumeCustomizer from './features/customizer/ResumeCustomizer';
import ResumeDisplay from './features/display/ResumeDisplay';
import SuccessAlert from './features/common/SuccessAlert';
import { useQuery, useAction } from 'wasp/client/operations';
import { getUserProfile } from 'wasp/client/operations';
import { generateDocument, updateGeneratedDocument } from 'wasp/client/operations';
import type { GeneratedDocument, UserProfile, EducationEntry, ExperienceEntry } from 'wasp/entities';
import StyledButton from './features/common/StyledButton';
import ResumeReviewIllustration from './features/common/ResumeReviewIllustration';
import ManageSectionsPanel, { Section } from './features/customizer/ManageSectionsPanel';

// Define types for customization options
export interface CustomizationOptions {
  template: string;
  colorScheme: string;
  targetJobTitle: string;
  targetCompany: string;
  keySkills: string; // Comma-separated
  tone: number; // e.g., 0-100
  jobDescription: string;
  // TODO: Add fields for cover letter later, e.g., recipientName?: string, companyAddress?: string etc.
}

export type DocumentType = 'resume' | 'coverLetter'; // Export DocumentType

const AppPage = () => {
  const { data: userProfile } = useQuery(getUserProfile);
  const updateGeneratedDocumentAction = useAction(updateGeneratedDocument);

  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [activeDocument, setActiveDocument] = useState<GeneratedDocument | null>(null);
  const [profileProgress, setProfileProgress] = useState(0);

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOptions>({
    template: 'classic',
    colorScheme: '#805AD5',
    targetJobTitle: '',
    targetCompany: '',
    keySkills: '',
    tone: 50,
    jobDescription: '',
  });
  const [documentType, setDocumentType] = useState<DocumentType>('resume');
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const generatedResumeContent = activeDocument?.content || null;
  const isResumeGenerated = !!activeDocument;

  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([
    { id: 'summary', label: 'Summary', visible: false, hasHandle: false },
    { id: 'experience', label: 'Experience', visible: true, hasHandle: true },
    { id: 'education', label: 'Education', visible: true, hasHandle: true },
    { id: 'languages', label: 'Languages', visible: false, hasHandle: true },
    { id: 'skills', label: 'Skills', visible: true, hasHandle: true },
    { id: 'certificates', label: 'Certificates', visible: false, hasHandle: true },
    { id: 'awards', label: 'Awards', visible: false, hasHandle: true },
  ]);

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

  const handleSectionToggle = (id: string) => {
    setSections(sections.map((sec) => (sec.id === id ? { ...sec, visible: !sec.visible } : sec)));
  };

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-6 2xl:p-10'>
      <ManageSectionsPanel
        isOpen={isManageSectionsOpen}
        onClose={() => setIsManageSectionsOpen(false)}
        sections={sections}
        onSectionToggle={handleSectionToggle}
      />
      {showSuccessAlert && (
        <SuccessAlert message={alertMessage} onClose={() => setShowSuccessAlert(false)} />
      )}
      <AccordionLayout
        isAccordionOpen={isAccordionOpen}
        onAccordionToggle={() => setIsAccordionOpen(!isAccordionOpen)}
        profileProgress={profileProgress}
        setProfileProgress={setProfileProgress}
      />

      <div className='grid grid-cols-1 gap-6 md:grid-cols-12'>
        <div className='flex flex-col gap-6 md:col-span-3'>
          <div className='h-9' />
          <ResumeCustomizer part='templateControls' options={customizationOptions} onOptionsChange={setCustomizationOptions} />
          <button
            type='button'
            onClick={() => setIsManageSectionsOpen(true)}
            disabled={!isResumeGenerated}
            className='flex w-full items-center gap-3 rounded-lg bg-white py-3 px-4 text-black shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:bg-boxdark dark:text-white'
          >
            <span className='text-xl'>🧩</span>
            <span>Manage Sections</span>
          </button>
          <div className='rounded-lg bg-white p-4 shadow-sm dark:bg-boxdark'>
            <div className='flex items-center'>
              <div className='flex-grow'>
                <h3 className='text-md leading-tight text-black dark:text-white'>
                  Get professional
                  <br />
                  resume help
                </h3>
              </div>
              <div className='flex-shrink-0'>
                <ResumeReviewIllustration />
              </div>
            </div>
            <button className='mt-4 w-full rounded-lg border border-stroke py-2 font-medium text-blue-600 transition hover:bg-blue-50 focus:outline-none dark:border-strokedark dark:text-blue-400 dark:hover:bg-blue-900/20'>
              Request Resume Review
            </button>
          </div>
        </div>

        <div className='flex flex-col gap-6 md:col-span-9'>
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
              <div className="flex items-center justify-between h-9">
                <h2 className='text-xl font-semibold text-black dark:text-white'>
                  Customise
                </h2>
                <div className="p-1 flex rounded-lg bg-gray-100 dark:bg-strokedark">
                  <button
                    type="button"
                    onClick={() => handleDocumentTypeChange('resume')}
                    className={`transition-all duration-200 ease-in-out py-1.5 px-4 text-sm font-medium rounded-md focus:outline-none
                      ${documentType === 'resume'
                        ? 'bg-white shadow-sm text-black dark:bg-white dark:text-black'
                        : 'bg-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}
                    `}
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDocumentTypeChange('coverLetter')}
                    className={`transition-all duration-200 ease-in-out py-1.5 px-4 text-sm font-medium rounded-md focus:outline-none
                      ${documentType === 'coverLetter'
                        ? 'bg-white shadow-sm text-black dark:bg-white dark:text-black'
                        : 'bg-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'}
                    `}
                  >
                    Cover Letter
                  </button>
                </div>
              </div>
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
                    <StyledButton onClick={handleGenerateResume} text="✨ Regenerate" variant="gradient" />
                    <button
                      onClick={handleCancelAdjustCustomizations}
                      className='dark:border-strokedark flex w-full justify-center rounded border border-stroke p-3 font-medium text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <StyledButton onClick={handleGenerateResume} text="✨ Generate" variant="gradient" />
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
              <StyledButton onClick={handleShowAdjustCustomizations} text="Adjust Customizations" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPage; 