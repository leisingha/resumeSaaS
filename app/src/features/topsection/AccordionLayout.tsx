import React, { useState } from 'react';
import ProfileForm from '../profile/ProfileForm';
import UploadSection from '../upload/UploadSection';
// Placeholder for UploadSection import, will be added in the next step
// import UploadSection from '../upload/UploadSection'; 

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, setIsOpen }) => {
  return (
    <div className='border-b border-gray-200 dark:border-gray-700'>
      <h2>
        <button
          type='button'
          className='flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none'
          onClick={setIsOpen}
          aria-expanded={isOpen}
        >
          <span>{title}</span>
          <svg
            className={`w-3 h-3 transform transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
            aria-hidden='true'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 10 6'
          >
            <path stroke='currentColor' strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5 5 1 1 5' />
          </svg>
        </button>
      </h2>
      {isOpen && (
        <div className='p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-boxdark-2'>
          {children}
        </div>
      )}
    </div>
  );
};

const AccordionLayout = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>('My Profile');

  const toggleAccordion = (title: string) => {
    setOpenAccordion(openAccordion === title ? null : title);
  };

  return (
    <div id='accordion-collapse' data-accordion='collapse' className='w-full rounded-sm border border-stroke dark:border-strokedark shadow-default'>
      <AccordionItem
        title='My Profile & Resume'
        isOpen={openAccordion === 'My Profile'}
        setIsOpen={() => toggleAccordion('My Profile')}
      >
        <div className='grid grid-cols-1 xl:grid-cols-5 gap-8'>
          <div className='xl:col-span-3'>
            <h3 className='mb-4 text-lg font-medium text-black dark:text-white'>Personal Information</h3>
            <ProfileForm />
          </div>
          <div className='xl:col-span-2'>
            <h3 className='mb-4 text-lg font-medium text-black dark:text-white'>Your Resume</h3>
            <UploadSection />
          </div>
        </div>
      </AccordionItem>
    </div>
  );
};

export default AccordionLayout; 