import React, { useState } from 'react';
import AccordionLayout from './features/topsection/AccordionLayout';
import ResumeCustomizer from './features/customizer/ResumeCustomizer';
import ResumeDisplay from './features/display/ResumeDisplay';

// Define types for customization options
export interface CustomizationOptions {
  template: string;
  colorScheme: string;
  targetJobTitle: string;
  targetCompany: string;
  keySkills: string; // Comma-separated
  tone: string; // e.g., 'formal', 'neutral', 'casual'
  // Add more options like fontSize, sectionVisibility, etc. later
}

const AppPage = () => {
  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOptions>({
    template: 'classic',
    colorScheme: 'blue',
    targetJobTitle: '',
    targetCompany: '',
    keySkills: '',
    tone: 'neutral',
  });
  const [generatedResumeContent, setGeneratedResumeContent] = useState<string | null>(null);
  const [isResumeGenerated, setIsResumeGenerated] = useState<boolean>(false);
  const [isEditingResume, setIsEditingResume] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const handleGenerateResume = () => {
    // In a real app, you would also fetch data from ProfileForm
    const mockResume = `
      Resume for: ${customizationOptions.targetJobTitle || '[Not Specified]'}
      At: ${customizationOptions.targetCompany || '[Not Specified]'}
      Skills: ${customizationOptions.keySkills || '[Not Specified]'}
      Template: ${customizationOptions.template}
      Color Scheme: ${customizationOptions.colorScheme}
      Tone: ${customizationOptions.tone}
      --- (This is a mock generated resume) ---
    `;
    setGeneratedResumeContent(mockResume);
    setIsResumeGenerated(true);
    setIsEditingResume(false); // Ensure edit mode is off when generating
    setShowEditModal(false); // Ensure modal is closed
  };

  const handleEditResume = (newContent: string) => {
    setGeneratedResumeContent(newContent);
  };

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-boxdark-2 p-4 md:p-6 xl:p-7.5'>
      {/* Top section for accordion */}
      <div className='bg-transparent dark:bg-transparent shadow-none mb-4'>
        <AccordionLayout />
      </div>

      {/* Main content section for resume customization and display */}
      <div className='bg-transparent dark:bg-transparent shadow-none p-4 rounded-sm'>
        <h1 className='text-lg font-medium text-black dark:text-white mb-4'>
          Resume Customization & Display
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Template and Color Scheme */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <ResumeCustomizer
              part="templateControls"
              options={customizationOptions}
              onOptionsChange={setCustomizationOptions}
            />
          </div>

          {/* Right Column: Details, Generate Button, and Display */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <ResumeCustomizer
              part="detailControls"
              options={customizationOptions}
              onOptionsChange={setCustomizationOptions}
            />
            <button
              onClick={handleGenerateResume}
              className="w-full justify-center rounded bg-primary p-3 font-medium text-white hover:bg-opacity-90"
            >
              Generate Resume
            </button>
            <ResumeDisplay 
              options={customizationOptions} 
              generatedContent={generatedResumeContent}
              isResumeGenerated={isResumeGenerated}
              isEditing={isEditingResume}
              setIsEditing={setIsEditingResume}
              showEditModal={showEditModal}
              setShowEditModal={setShowEditModal}
              onContentChange={handleEditResume}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPage; 