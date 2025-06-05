import React, { useState } from 'react';
import ProfileForm from '../profile/ProfileForm';
import UploadSection from '../upload/UploadSection';
// Placeholder for UploadSection import, will be added in the next step
// import UploadSection from '../upload/UploadSection'; 

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onToggle, isComplete }) => {

  return (
    <div> 
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left py-2"
      >
        {/* Group for Title and Indicator, aligned to the left */}
        <div className="flex items-center">
          <span className="text-lg font-medium text-black dark:text-white">{title}</span>
          {/* Completeness Indicator - to the right of the title */}
          {isComplete ? (
            <svg className='w-5 h-5 ml-3 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
          ) : (
            <span className='w-4 h-4 ml-3 inline-block rounded-full border-2 border-gray-400'></span>
          )}
        </div>

        {/* Dropdown Arrow SVG - aligned to the right by justify-between on parent */}
        <span className='text-black dark:text-white'>
          {isOpen ? (
            // SVG for "open" state (chevron pointing UP)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transform rotate-180">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            // SVG for "closed" state (chevron pointing DOWN)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>
      {isOpen && (
        <div className='border-t border-stroke dark:border-strokedark pt-3 mt-3'>
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionLayoutProps {
  isAccordionOpen: boolean;
  onAccordionToggle: () => void;
  isProfileComplete: boolean;
}

const AccordionLayout: React.FC<AccordionLayoutProps> = ({ isAccordionOpen, onAccordionToggle, isProfileComplete }) => {
  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-5">
      <AccordionItem
        title="My Profile"
        isOpen={isAccordionOpen}
        onToggle={onAccordionToggle}
        isComplete={isProfileComplete}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <ProfileForm />
          </div>
          <div className="md:col-span-2">
            <h3 className="text-md font-medium text-black dark:text-white mb-3">Your Resume</h3>
            <UploadSection />
          </div>
        </div>
      </AccordionItem>
    </div>
  );
};

export default AccordionLayout; 