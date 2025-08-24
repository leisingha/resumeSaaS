import React, { useState } from 'react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  href?: string;
};

export default function FAQ({ faqs }: { faqs: FAQ[] }) {
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className='mt-32 mx-auto max-w-2xl divide-y divide-gray-900/10 dark:divide-gray-200/10 px-6 pb-8 sm:pb-24 sm:pt-12 lg:max-w-7xl lg:px-8 lg:py-32'>
      <h2 className='text-2xl font-bold leading-10 tracking-tight text-gray-900 dark:text-white'>
        Frequently asked questions
      </h2>
      
      {/* FAQ Accordion Section */}
      <div className='mt-10 space-y-4'>
        {faqs.map((faq) => (
          <div key={faq.id} className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
            <button
              className='w-full px-6 py-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex justify-between items-center'
              onClick={() => toggleAccordion(faq.id)}
            >
              <span className='font-semibold text-gray-900 dark:text-white'>
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ${
                  openAccordion === faq.id ? 'rotate-180' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openAccordion === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className='px-6 py-4 bg-white dark:bg-gray-900'>
                <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
                  {faq.answer}
                </p>
                {faq.href && (
                  <a href={faq.href} className='inline-block mt-3 text-base leading-7 text-yellow-500 hover:text-yellow-600'>
                    Learn more →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
