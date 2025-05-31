import React from 'react';

const AppPage = () => {
  return (
    <div className='min-h-screen bg-gray-100 dark:bg-boxdark-2'>
      {/* Top section for accordion */}
      <div className='bg-white dark:bg-boxdark shadow-md p-4 mb-4'>
        <h1 className='text-xl font-semibold text-black dark:text-white'>Top Accordion Section (Profile/Upload)</h1>
        {/* Placeholder for AccordionLayout component */}
      </div>

      {/* Main content section for resume customization and display */}
      <div className='bg-white dark:bg-boxdark shadow-md p-4'>
        <h1 className='text-xl font-semibold text-black dark:text-white'>Main Content Section (Resume Customization & Display)</h1>
        {/* Placeholder for ResumeCustomizer and ResumeDisplay components */}
      </div>
    </div>
  );
};

export default AppPage; 