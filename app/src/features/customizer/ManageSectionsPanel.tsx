import React from 'react';
import ToggleSwitch from '../common/ToggleSwitch';

export interface Section {
  id: string;
  label: string;
  visible: boolean;
  hasHandle?: boolean;
}

interface ManageSectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  onSectionToggle: (id: string) => void;
  className?: string;
}

const DragHandleIcon = () => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='currentColor'
    xmlns='http://www.w3.org/2000/svg'
    className='text-gray-400 dark:text-gray-500'
  >
    <circle cx='5' cy='5' r='1.5' />
    <circle cx='11' cy='5' r='1.5' />
    <circle cx='5' cy='11' r='1.5' />
    <circle cx='11' cy='11' r='1.5' />
  </svg>
);

const ManageSectionsPanel: React.FC<ManageSectionsPanelProps> = ({
  isOpen,
  onClose,
  sections,
  onSectionToggle,
  className,
}) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-boxdark shadow-lg p-6 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${className}`}
      >
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-semibold text-black dark:text-white'>Manage Sections</h2>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path>
            </svg>
          </button>
        </div>
        <ul>
          {sections.map((section) => (
            <li
              key={section.id}
              className='flex items-center justify-between py-3 border-b border-stroke dark:border-strokedark last:border-b-0'
            >
              <div className='flex items-center gap-3'>
                {section.hasHandle ? <DragHandleIcon /> : <div className='w-4' />}
                <span className='text-black dark:text-white'>{section.label}</span>
              </div>
              <ToggleSwitch isOn={section.visible} onToggle={() => onSectionToggle(section.id)} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default ManageSectionsPanel; 