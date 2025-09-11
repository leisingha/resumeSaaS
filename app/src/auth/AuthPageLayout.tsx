import { ReactNode } from 'react';

export function AuthPageLayout({children} : {children: ReactNode }) {
  return (
    <div className='flex min-h-full flex-col justify-center pt-10 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow-default border border-stroke sm:rounded-lg sm:px-10 dark:bg-boxdark dark:border-strokedark dark:text-white'>
          <div className='-mt-8'>
            { children }
          </div>
        </div>
      </div>
    </div>
  );
}
