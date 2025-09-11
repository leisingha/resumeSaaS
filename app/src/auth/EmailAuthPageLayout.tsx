import { ReactNode } from 'react';

export function EmailAuthPageLayout({children} : {children: ReactNode }) {
  return (
    <div className='flex min-h-screen flex-col px-6 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md mx-auto'>
        <div className='bg-white py-8 px-4 shadow-default border border-stroke rounded-lg sm:px-10 dark:bg-boxdark dark:border-strokedark dark:text-white'>
          { children }
        </div>
      </div>
    </div>
  );
}
