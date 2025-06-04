import React from 'react';

interface SuccessAlertProps {
  message: string;
  details?: string;
  onClose: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, details, onClose }) => {
  return (
    <div className='fixed top-20 right-5 z-[9999] w-full max-w-sm p-4 rounded-md shadow-lg bg-green-500 bg-opacity-20 border-l-4 border-green-600 dark:bg-boxdark dark:bg-opacity-80 dark:border-green-500'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-400'>
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className='ml-3 w-0 flex-1 pt-0.5'>
          <p className='text-sm font-semibold text-green-700 dark:text-green-400'>{message}</p>
          {details && <p className='mt-1 text-sm text-green-600 dark:text-gray-300'>{details}</p>}
        </div>
        <div className='ml-4 flex flex-shrink-0'>
          <button
            onClick={onClose}
            className='inline-flex rounded-md bg-transparent text-green-700 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          >
            <span className='sr-only'>Close</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessAlert; 