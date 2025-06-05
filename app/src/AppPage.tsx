import React, { useState, useEffect } from 'react';
import AccordionLayout from './features/topsection/AccordionLayout';
import ResumeCustomizer from './features/customizer/ResumeCustomizer';
import ResumeDisplay from './features/display/ResumeDisplay';
import SuccessAlert from './features/common/SuccessAlert';
import { useQuery } from 'wasp/client/operations';
import { getUserProfile } from 'wasp/client/operations';

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
  const { data: userProfile, isLoading: isProfileLoading } = useQuery(getUserProfile);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOptions>({
    template: 'classic',
    colorScheme: 'blue',
    targetJobTitle: '',
    targetCompany: '',
    keySkills: '',
    tone: 'neutral',
  });
  const [documentType, setDocumentType] = useState<DocumentType>('resume');
  const [generatedResumeContent, setGeneratedResumeContent] = useState<string | null>(null);
  const [isResumeGenerated, setIsResumeGenerated] = useState<boolean>(false);
  const [isEditingResume, setIsEditingResume] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isDetailCustomizerVisible, setIsDetailCustomizerVisible] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      const wasComplete = isProfileComplete;
      const isNowComplete = !!(userProfile.fullName && userProfile.phone && userProfile.professionalSummary);
      
      setIsProfileComplete(isNowComplete);

      // Only automatically change the accordion state if the completeness status has changed.
      // This allows the user to manually toggle the accordion otherwise.
      if (wasComplete !== isNowComplete) {
        setIsAccordionOpen(!isNowComplete);
      }
    }
  }, [userProfile, isProfileComplete]);

  const handleGenerateResume = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const docTypeDisplay = documentType === 'resume' ? 'Resume' : 'Cover Letter';
      const mockContent = `
        Document Type: ${documentType.toUpperCase()}\n
        Resume for: ${customizationOptions.targetJobTitle || '[Not Specified]'}
        Company: ${customizationOptions.targetCompany || '[Not Specified]'}
        Skills: ${customizationOptions.keySkills || '[Not Specified]'}
        Tone: ${customizationOptions.tone}
        Template: ${customizationOptions.template}
        Color Scheme: ${customizationOptions.colorScheme}
        
        --- (More ${documentType} content would go here) ---
      `;
      setGeneratedResumeContent(mockContent);
      setIsResumeGenerated(true);
      setIsEditingResume(false);
      setShowEditModal(false);
      setIsDetailCustomizerVisible(false);
      setIsGenerating(false);
      setAlertMessage(`${docTypeDisplay} Generated Successfully!`);
      setShowSuccessAlert(true);
    }, 2000);
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

  const handleEditSave = (newContent: string) => {
    setGeneratedResumeContent(newContent);
    setIsEditingResume(false);
    setShowEditModal(false);
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setIsResumeGenerated(false);
    setGeneratedResumeContent(null);
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

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 2xl:p-10 relative">
      {showSuccessAlert && 
        <SuccessAlert 
          message={alertMessage} 
          onClose={() => setShowSuccessAlert(false)} 
        />
      }
      <AccordionLayout
        isAccordionOpen={isAccordionOpen}
        onAccordionToggle={() => setIsAccordionOpen(!isAccordionOpen)}
        isProfileComplete={isProfileComplete}
      />

      <div className="mt-6 rounded-sm bg-transparent shadow-default dark:bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
          <div className="md:col-span-1 flex flex-col gap-6">
            <ResumeCustomizer
              part="templateControls"
              options={customizationOptions}
              onOptionsChange={setCustomizationOptions}
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-6">
            {isGenerating ? (
              <div className="flex justify-center items-center h-40 mt-8">
                <div className="typewriter">
                  <div className="slide"><i></i></div>
                  <div className="paper"></div>
                  <div className="keyboard"></div>
                </div>
              </div>
            ) : isDetailCustomizerVisible ? (
              <>
                <ResumeCustomizer
                  part="detailControls"
                  options={customizationOptions}
                  onOptionsChange={setCustomizationOptions}
                  documentType={documentType}
                  onDocumentTypeChange={handleDocumentTypeChange}
                />
                <div className="flex gap-3">
                  {isResumeGenerated ? (
                    <>
                      <button
                        onClick={handleGenerateResume}
                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={handleCancelAdjustCustomizations}
                        className="flex w-full justify-center rounded border border-stroke dark:border-strokedark p-3 font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleGenerateResume}
                      className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                    >
                      Generate
                    </button>
                  )}
                </div>
              </>
            ) : null}
            
            {isResumeGenerated && !isDetailCustomizerVisible && !isGenerating && (
              <ResumeDisplay 
                options={customizationOptions} 
                generatedContent={generatedResumeContent}
                isResumeGenerated={isResumeGenerated}
                isEditing={false} 
                setIsEditing={() => {}} 
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                onContentChange={handleEditSave}
                documentType={documentType}
              />
            )}

            {isResumeGenerated && !isDetailCustomizerVisible && !isGenerating && (
              <button
                onClick={handleShowAdjustCustomizations}
                className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 mt-4"
              >
                Adjust Customizations
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPage; 