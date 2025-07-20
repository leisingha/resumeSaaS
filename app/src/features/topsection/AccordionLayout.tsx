import React, { useState } from 'react';
import ProfileForm from '../profile/ProfileForm';
import UploadSection from '../upload/UploadSection';
import { ModernProgress } from '../common/ModernProgress';
// Placeholder for UploadSection import, will be added in the next step
// import UploadSection from '../upload/UploadSection'; 

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  progress: number;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle, progress }) => {
  return (
    <div> 
      <button onClick={onToggle} className='flex w-full items-center justify-between text-left py-2'>
        <div>
          <h2 className='text-xl font-semibold text-black dark:text-white'>{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete your profile to generate better results
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <ModernProgress value={progress} size='sm' thickness={5} />
        <span className='text-black dark:text-white'>
          {isOpen ? (
            // SVG for "open" state (chevron pointing UP)
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-5 h-5 transform rotate-180'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          ) : (
            // SVG for "closed" state (chevron pointing DOWN)
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-5 h-5'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          )}
        </span>
        </div>
      </button>
      {isOpen && <div className='border-t border-stroke dark:border-strokedark pt-3 mt-3'>{children}</div>}
    </div>
  );
};

interface AccordionLayoutProps {
  isAccordionOpen: boolean;
  onAccordionToggle: () => void;
  profileProgress: number;
  setProfileProgress: (progress: number) => void;
  onProfileDataParsed: (data: any) => void;
  profileData: any;
  educationEntries: any[];
  experienceEntries: any[];
  languages: string[];
  achievements: string;
  setProfileData: (data: any) => void;
  setEducationEntries: (data: any[]) => void;
  setExperienceEntries: (data: any[]) => void;
  setLanguages: (data: string[]) => void;
  setAchievements: (data: string) => void;
}

const AccordionLayout: React.FC<AccordionLayoutProps> = ({
  isAccordionOpen,
  onAccordionToggle,
  profileProgress,
  setProfileProgress,
  onProfileDataParsed,
  ...rest
}) => {
  return (
    <div className='rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-4'>
      <AccordionItem
        title='My Profile'
        isOpen={isAccordionOpen}
        onToggle={onAccordionToggle}
        progress={profileProgress}
      >
        <ProfileForm setProfileProgress={setProfileProgress} onResumeParsed={onProfileDataParsed} {...rest} />
      </AccordionItem>
    </div>
  );
};

export default AccordionLayout; 