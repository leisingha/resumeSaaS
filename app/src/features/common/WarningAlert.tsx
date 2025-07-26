import React from 'react';

interface WarningAlertProps {
  message: string;
  details?: string;
  onClose: () => void;
}

const WarningAlert: React.FC<WarningAlertProps> = ({ message, details, onClose }) => {
  return (
    <div className='fixed top-20 right-5 z-[9999] w-full max-w-sm p-4 rounded-md shadow-lg bg-warning bg-opacity-20 border-l-4 border-warning dark:bg-boxdark dark:bg-opacity-80 dark:border-warning'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <div className='mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-warning bg-opacity-30'>
            <svg width='19' height='16' viewBox='0 0 19 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M1.50493 16H17.5023C18.6204 16 19.3413 14.9018 18.8354 13.9735L10.8367 0.770573C10.2852 -0.256858 8.70677 -0.256858 8.15528 0.770573L0.156617 13.9735C-0.334072 14.8998 0.386764 16 1.50493 16ZM10.7585 12.9298C10.7585 13.6155 10.2223 14.1433 9.45583 14.1433C8.6894 14.1433 8.15311 13.6155 8.15311 12.9298V12.9015C8.15311 12.2159 8.6894 11.688 9.45583 11.688C10.2223 11.688 10.7585 12.2159 10.7585 12.9015V12.9298ZM8.75236 4.01062H10.2548C10.6674 4.01062 10.9127 4.33826 10.8671 4.75288L10.2071 10.1186C10.1615 10.5049 9.88572 10.7455 9.50142 10.7455C9.11929 10.7455 8.84138 10.5028 8.79579 10.1186L8.13574 4.75288C8.09449 4.33826 8.33984 4.01062 8.75236 4.01062Z'
                fill='#FBBF24'
              />
            </svg>
          </div>
        </div>
        <div className='ml-3 w-0 flex-1 pt-0.5'>
          <p className='text-sm font-semibold text-[#9D5425] dark:text-warning'>{message}</p>
          {details && <p className='mt-1 text-sm text-[#D0915C] dark:text-gray-300'>{details}</p>}
        </div>
        <div className='ml-4 flex flex-shrink-0'>
          <button
            onClick={onClose}
            className='inline-flex rounded-md bg-transparent text-[#9D5425] hover:text-[#8B4513] dark:text-warning dark:hover:text-orange-300 focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2'
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

export default WarningAlert; 