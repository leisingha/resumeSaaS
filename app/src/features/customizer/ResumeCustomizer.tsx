import React, { useState } from 'react';
import type { CustomizationOptions, DocumentType } from '../../AppPage'; // Import the interface
import ModernSlider from '../customization/ModernSlider';

interface ResumeCustomizerProps {
  options: CustomizationOptions;
  onOptionsChange: (newOptions: CustomizationOptions) => void;
  part: 'templateControls' | 'detailControls';
  documentType?: DocumentType; // Make optional as it's only for detailControls
  onDocumentTypeChange?: (type: DocumentType) => void; // Make optional
}

const ResumeCustomizer: React.FC<ResumeCustomizerProps> = ({ options, onOptionsChange, part, documentType, onDocumentTypeChange }) => {
  const [currentSkill, setCurrentSkill] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>(options.keySkills ? options.keySkills.split(',').map(s => s.trim()).filter(s => s) : []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onOptionsChange({ ...options, template: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({ ...options, colorScheme: e.target.value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onOptionsChange({ ...options, [e.target.name]: e.target.value });
  };

  const handleToneChange = (value: number) => {
    onOptionsChange({ ...options, tone: value });
  };

  const updateSkillsInOptions = (updatedSkillsList: string[]) => {
    onOptionsChange({ ...options, keySkills: updatedSkillsList.join(', ') });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSkill(e.target.value);
  };

  const addSkill = () => {
    const trimmedSkill = currentSkill.trim();
    if (trimmedSkill && !skillsList.includes(trimmedSkill)) {
      const newSkillsList = [...skillsList, trimmedSkill];
      setSkillsList(newSkillsList);
      updateSkillsInOptions(newSkillsList);
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkillsList = skillsList.filter(skill => skill !== skillToRemove);
    setSkillsList(newSkillsList);
    updateSkillsInOptions(newSkillsList);
  };

  const handleSkillInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className='bg-white dark:bg-boxdark shadow-md p-6 rounded-lg'>
      <div className="flex items-center justify-between mb-4">
        <h2 className='text-lg font-semibold text-black dark:text-white'>
          {part === 'templateControls' 
            ? 'Template Options' 
            : 'Customise'}
        </h2>
        {part === 'detailControls' && onDocumentTypeChange && (
          <div className="flex rounded-md border border-stroke dark:border-form-strokedark">
            <button
              type="button"
              onClick={() => onDocumentTypeChange('resume')}
              className={`py-2 px-4 text-sm font-medium transition focus:outline-none rounded-l-md
                ${documentType === 'resume'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-black hover:bg-gray-2 dark:text-white dark:hover:bg-boxdark-2'}
              `}
            >
              Resume
            </button>
            <button
              type="button"
              onClick={() => onDocumentTypeChange('coverLetter')}
              className={`py-2 px-4 text-sm font-medium transition focus:outline-none rounded-r-md border-l border-stroke dark:border-form-strokedark
                ${documentType === 'coverLetter'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-black hover:bg-gray-2 dark:text-white dark:hover:bg-boxdark-2'}
              `}
            >
              Cover Letter
            </button>
          </div>
        )}
      </div>
      
      {part === 'templateControls' && (
        <>
          {/* Template Selection */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Template
            </label>
            <div className="relative">
              <select 
                value={options.template}
                onChange={handleTemplateChange}
                className="relative z-10 w-full appearance-none rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              >
                <option value="classic">Classic</option>
                <option value="modern">Modern</option>
                <option value="creative">Creative</option>
              </select>
              <span className="absolute top-1/2 right-4 z-20 -translate-y-1/2 pointer-events-none">
                <svg className="fill-current text-gray-500 dark:text-gray-400" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g opacity="0.8"><path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"></path></g></svg>
              </span>
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Color Scheme
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="colorScheme" value="blue" checked={options.colorScheme === 'blue'} onChange={handleColorChange} className="form-radio" />
                Blue Tone
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="colorScheme" value="green" checked={options.colorScheme === 'green'} onChange={handleColorChange} className="form-radio" />
                Green Tone
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="colorScheme" value="mono" checked={options.colorScheme === 'mono'} onChange={handleColorChange} className="form-radio" />
                Monochrome
              </label>
            </div>
          </div>
        </>
      )}

      {part === 'detailControls' && (
        <>
          {/* Target Job Title */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Target Job Title
            </label>
            <input
              type="text"
              name="targetJobTitle"
              placeholder="e.g., Software Engineer"
              value={options.targetJobTitle}
              onChange={handleInputChange}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          {/* Target Company */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Target Company (Optional)
            </label>
            <input
              type="text"
              name="targetCompany"
              placeholder="e.g., Google"
              value={options.targetCompany}
              onChange={handleInputChange}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>

          {/* Key Skills */}
          <div className="mb-4.5">
            <label className="mb-2.5 block text-black dark:text-white">
              Key Skills
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Add a skill and press Enter or comma"
                value={currentSkill}
                onChange={handleSkillInputChange}
                onKeyDown={handleSkillInputKeyDown}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap items-center mt-2">
              {skillsList.map((skill, index) => (
                <span
                  key={index}
                  className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30 dark:text-white"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-2 cursor-pointer hover:text-danger"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z" fill="currentColor"></path></svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div className='mb-4.5'>
            <ModernSlider
              value={options.tone}
              onChange={handleToneChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeCustomizer; 