import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { CustomizationOptions, DocumentType } from '../../AppPage';
import EditModal from './EditModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Pencil } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import 'react-quill/dist/quill.snow.css';
import './ResumeDisplay.css';
import { generateAiResumePoints } from 'wasp/client/operations';
import { useAction } from 'wasp/client/operations';

import ReactQuill from 'react-quill';

interface ResumeDisplayProps {
  options: CustomizationOptions;
  generatedContent: string | null;
  isResumeGenerated: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onContentChange: (newContent: string) => void;
  documentType: 'resume' | 'coverLetter';
}

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const ResumeDisplay: React.FC<ResumeDisplayProps> = ({
  options,
  generatedContent,
  isResumeGenerated,
  isEditing,
  setIsEditing,
  showEditModal,
  setShowEditModal,
  onContentChange,
  documentType,
}) => {
  const [editedContent, setEditedContent] = useState(generatedContent || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showSummaryEdit, setShowSummaryEdit] = useState(false);
  const [summaryEditValue, setSummaryEditValue] = useState('');
  const [isSummaryHovered, setIsSummaryHovered] = useState(false);
  const [showExperienceEdit, setShowExperienceEdit] = useState(false);
  const [editingExperience, setEditingExperience] = useState<{
    index: number;
    title: string;
    company: string;
    location: string;
    date: string;
    description: string;
  } | null>(null);
  const [showEducationEdit, setShowEducationEdit] = useState(false);
  const [editingEducation, setEditingEducation] = useState<{
    index: number;
    degree: string;
    school: string;
    date: string;
    details: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const generateResumePointsAction = useAction(generateAiResumePoints);

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
    }
  }, [generatedContent]);

  useLayoutEffect(() => {
    const calculateScale = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode && contentNode.firstChild) {
        const containerWidth = containerNode.offsetWidth;
        const contentElement = contentNode.firstChild as HTMLElement;
        const contentWidth = contentElement.offsetWidth;

        if (contentWidth > 0 && containerWidth > 0) {
          const scale = containerWidth / contentWidth;
          contentNode.style.transform = `scale(${scale})`;
          const contentHeight = contentElement.offsetHeight;
          containerNode.style.height = `${contentHeight * scale}px`;
        }
      }
    };

    calculateScale();

    window.addEventListener('resize', calculateScale);
    return () => {
      window.removeEventListener('resize', calculateScale);
    };
  }, [generatedContent]);

  // Find summary section in the rendered HTML
  useEffect(() => {
    if (!generatedContent) return;
    // Extract summary from the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generatedContent;
    const summarySection = tempDiv.querySelector('h2')?.nextElementSibling;
    if (summarySection && summarySection.tagName === 'P') {
      setSummaryEditValue(summarySection.innerHTML);
    }
  }, [generatedContent]);

  // Attach edit buttons to experience sections
  useEffect(() => {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    const h2s = Array.from(resumeContent.getElementsByTagName('h2'));
    const experienceH2 = h2s.find(h2 => h2.textContent?.toLowerCase().includes('experience'));
    if (!experienceH2) return;

    const experienceContainer = experienceH2.parentElement;
    if (!experienceContainer) return;

    // Find all direct children divs which are experience entries
    const experienceEntries = Array.from(experienceContainer.children).filter(
      (child) => child.tagName === 'DIV' && child.querySelector('h3')
    ) as HTMLElement[];

    experienceEntries.forEach((entry, index) => {
      entry.style.position = 'relative';

      const handleMouseEnter = () => {
        // Remove existing button before adding a new one
        entry.querySelector('.edit-button-experience')?.remove();

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'edit-button-experience'; // Add a class to identify the button
        btn.style.position = 'absolute';
        btn.style.top = '8px';
        btn.style.right = '8px';
        btn.style.zIndex = '10';
        btn.style.background = 'white';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        btn.style.padding = '6px';
        btn.style.border = '1px solid #e2e8f0';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();

          // Parse data from the DOM to pre-fill the modal
          const title = entry.querySelector('h3')?.textContent || '';
          const companyLocation = entry.querySelector('p')?.textContent?.split(' - ') || ['', ''];
          const company = companyLocation[0];
          const location = companyLocation[1] || '';
          const date = entry.querySelector('div[style*="text-align: right"] p')?.textContent || '';
          const ulEl = entry.querySelector('ul');
          const description = ulEl ? ulEl.outerHTML : (entry.querySelector('p')?.innerHTML || '');

          setEditingExperience({ index, title, company, location, date, description });
          setShowExperienceEdit(true);
        };
        entry.appendChild(btn);
      };

      const handleMouseLeave = () => {
        setTimeout(() => {
          if (!entry.matches(':hover')) {
            entry.querySelector('.edit-button-experience')?.remove();
          }
        }, 300);
      };

      entry.addEventListener('mouseenter', handleMouseEnter);
      entry.addEventListener('mouseleave', handleMouseLeave);
      
      // Cleanup function
      return () => {
        entry.removeEventListener('mouseenter', handleMouseEnter);
        entry.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [generatedContent]);

  // Attach edit buttons to education sections
  useEffect(() => {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    const h2s = Array.from(resumeContent.getElementsByTagName('h2'));
    const educationH2 = h2s.find((h2) => h2.textContent?.toLowerCase().includes('education'));
    if (!educationH2) return;

    const educationContainer = educationH2.parentElement;
    if (!educationContainer) return;

    const educationEntries = Array.from(educationContainer.children).filter(
      (child) => child.tagName === 'DIV' && child.querySelector('h3')
    ) as HTMLElement[];

    educationEntries.forEach((entry, index) => {
      entry.style.position = 'relative';

      const handleMouseEnter = () => {
        entry.querySelector('.edit-button-education')?.remove();

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'edit-button-education';
        btn.style.position = 'absolute';
        btn.style.top = '8px';
        btn.style.right = '8px';
        btn.style.zIndex = '10';
        btn.style.background = 'white';
        btn.style.borderRadius = '8px';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        btn.style.padding = '6px';
        btn.style.border = '1px solid #e2e8f0';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();

          const degree = entry.querySelector('h3')?.textContent || '';
          const school = entry.querySelector('p')?.textContent || '';
          const date = entry.querySelector('div[style*="text-align: right"] p')?.textContent || '';
          const details = entry.querySelector('ul')?.outerHTML || '';

          setEditingEducation({ index, degree, school, date, details });
          setShowEducationEdit(true);
        };
        entry.appendChild(btn);
      };

      const handleMouseLeave = () => {
        setTimeout(() => {
          if (!entry.matches(':hover')) {
            entry.querySelector('.edit-button-education')?.remove();
          }
        }, 300);
      };

      entry.addEventListener('mouseenter', handleMouseEnter);
      entry.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        entry.removeEventListener('mouseenter', handleMouseEnter);
        entry.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [generatedContent]);

  const documentTitle = documentType === 'resume' ? 'Resume' : 'Cover Letter';

  const handleCopyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      alert('Copied to clipboard!');
    }
  };

  const handleDownloadPdf = () => {
    const input = document.getElementById('resume-content');
    if (input) {
      html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('resume.pdf');
      });
    }
  };

  const handleSaveChanges = () => {
    onContentChange(editedContent);
    setShowEditModal(false);
  };

  // Save summary edit and update DOM
  const handleSummarySave = () => {
    setShowSummaryEdit(false);
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = summaryEditValue;

    // This ensures that the summary, which should be paragraphs, is preserved as such.
    const summaryHtml = tempDiv.innerHTML;
    
    // Clear existing content after the summary H2
    let nextElement = resumeContent.querySelector('h2:last-of-type')?.nextElementSibling;
    while (nextElement && nextElement.tagName !== 'H2') {
        const toRemove = nextElement;
        nextElement = nextElement.nextElementSibling;
        toRemove.remove();
    }

    // Insert new content
    resumeContent.insertAdjacentHTML('beforeend', summaryHtml);
  };

  // Save experience edit and update DOM
  const handleExperienceSave = () => {
    if (!editingExperience) return;

    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    const experienceH2 = Array.from(resumeContent.getElementsByTagName('h2')).find((h2) =>
      h2.textContent?.toLowerCase().includes('experience')
    );
    if (!experienceH2 || !experienceH2.parentElement) return;

    const experienceContainer = experienceH2.parentElement;
    const experienceEntries = Array.from(experienceContainer.children).filter(
      (child) => child.tagName === 'DIV' && child.querySelector('h3')
    );
    const entryToUpdate = experienceEntries[editingExperience.index] as HTMLElement;

    if (entryToUpdate) {
      let finalDescriptionHtml = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editingExperience.description;
      
      const isAlreadyList = tempDiv.querySelector('ul, ol');

      if (isAlreadyList) {
        finalDescriptionHtml = isAlreadyList.outerHTML;
      } else {
        const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
        if (paragraphs.length > 0) {
          finalDescriptionHtml = `<ul>${paragraphs.map(p => `<li>${p.innerHTML}</li>`).join('')}</ul>`;
        } else {
          finalDescriptionHtml = `<ul><li>${editingExperience.description}</li></ul>`
        }
      }

      entryToUpdate.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <div>
            <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${editingExperience.title}</h3>
            <p style="margin: 2px 0;">${editingExperience.company} - ${editingExperience.location}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">${editingExperience.date}</p>
          </div>
        </div>
        ${finalDescriptionHtml.replace('<ul', '<ul style="margin-top: 5px; padding-left: 20px; line-height: 1.4;"')}
      `;
    }

    setShowExperienceEdit(false);
    setEditingExperience(null);
  };

  const handleEducationSave = () => {
    if (!editingEducation) return;

    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    const educationH2 = Array.from(resumeContent.getElementsByTagName('h2')).find((h2) =>
      h2.textContent?.toLowerCase().includes('education')
    );
    if (!educationH2 || !educationH2.parentElement) return;

    const educationContainer = educationH2.parentElement;
    const educationEntries = Array.from(educationContainer.children).filter(
      (child) => child.tagName === 'DIV' && child.querySelector('h3')
    );
    const entryToUpdate = educationEntries[editingEducation.index] as HTMLElement;

    if (entryToUpdate) {
      let finalDetailsHtml = '';
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editingEducation.details;

      const isAlreadyList = tempDiv.querySelector('ul, ol');

      if (isAlreadyList) {
        finalDetailsHtml = isAlreadyList.outerHTML;
      } else {
        const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
        if (paragraphs.length > 0) {
          finalDetailsHtml = `<ul>${paragraphs.map((p) => `<li>${p.innerHTML}</li>`).join('')}</ul>`;
        } else {
          finalDetailsHtml = `<ul><li>${editingEducation.details}</li></ul>`;
        }
      }

      entryToUpdate.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <div>
            <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${editingEducation.degree}</h3>
            <p style="margin: 2px 0;">${editingEducation.school}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">${editingEducation.date}</p>
          </div>
        </div>
        ${finalDetailsHtml.replace('<ul', '<ul style="margin-top: 5px; padding-left: 20px; line-height: 1.4;"')}
      `;
    }

    setShowEducationEdit(false);
    setEditingEducation(null);
  };

  const handleGenerateWorkDescription = async () => {
    if (!editingExperience) return;
    const { title, company, location } = editingExperience;
    const context = `Job Title: ${title}, Employer: ${company}, Location: ${location}`;
    setIsAiLoading(true);
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        setEditingExperience({
          ...editingExperience,
          description: (editingExperience.description || '') + result.content,
        });
      }
    } catch (error: any) {
      alert('Error generating AI content: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateEducationAchievements = async () => {
    if (!editingEducation) return;
    const { degree, school } = editingEducation;
    const context = `Degree: ${degree}, School: ${school}`;
    setIsAiLoading(true);
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        setEditingEducation({
          ...editingEducation,
          details: (editingEducation.details || '') + result.content,
        });
      }
    } catch (error: any) {
      alert('Error generating AI content: ' + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-xl font-semibold text-black dark:text-white'>Generated {documentTitle}</h2>
          <div className='text-sm text-gray-400 mt-1'>
            <span>
              Template: <span className='font-medium text-gray-500 dark:text-gray-300'>{options.template}</span>
            </span>
          </div>
        </div>
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleCopyToClipboard}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Copy
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Edit
          </button>
          <button
            onClick={handleDownloadPdf}
            className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          >
            Download
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className='w-full overflow-hidden rounded-lg border border-stroke dark:border-strokedark'
      >
        <div
          ref={contentRef}
          id='resume-content'
          style={{ transformOrigin: 'top left', position: 'relative' }}
        >
          {/* Render the resume HTML */}
          <div
          dangerouslySetInnerHTML={{ __html: generatedContent || '<p>Your generated document will appear here...</p>' }}
        />
          {/* Overlay edit button for summary section */}
          {generatedContent && (
            <SummaryEditOverlay
              isHovered={isSummaryHovered}
              setIsHovered={setIsSummaryHovered}
              onEdit={() => setShowSummaryEdit(true)}
            />
          )}
        </div>
      </div>

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onContentChange}
        initialContent={generatedContent || ''}
      />

      {/* Summary Edit Modal */}
      <Transition appear show={showSummaryEdit} as={React.Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setShowSummaryEdit(false)}>
          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-50' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={React.Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-lg transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900 dark:text-white'>
                    Edit Summary
                  </Dialog.Title>
                  <div className='mt-4'>
                    <label className='mb-2.5 block text-black dark:text-white'>How can you describe yourself?</label>
                    <div className='quill-container'>
                      <ReactQuill theme='snow' value={summaryEditValue} onChange={setSummaryEditValue} modules={quillModules} />
                    </div>
                  </div>
                  <div className='mt-6 flex justify-end gap-4'>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      onClick={() => setShowSummaryEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                      onClick={handleSummarySave}
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Experience Edit Modal */}
      <Transition appear show={showExperienceEdit} as={React.Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setShowExperienceEdit(false)}>
          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-50' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={React.Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900 dark:text-white'>
                    Edit Experience
                  </Dialog.Title>
                  {editingExperience && (
                    <div className='mt-4 space-y-4'>
                      <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            Employer
                          </label>
                          <input
                            type='text'
                            value={editingExperience.company}
                            onChange={(e) =>
                              setEditingExperience({ ...editingExperience, company: e.target.value })
                            }
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            Job Title
                          </label>
                          <input
                            type='text'
                            value={editingExperience.title}
                            onChange={(e) =>
                              setEditingExperience({ ...editingExperience, title: e.target.value })
                            }
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                      </div>
                      <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            Start Date
                          </label>
                          <input
                            type='text'
                            value={editingExperience.date.split(' - ')[0] || ''}
                            onChange={(e) => {
                              const newStartDate = e.target.value;
                              const endDate = editingExperience.date.split(' - ')[1] || 'Present';
                              setEditingExperience({ ...editingExperience, date: `${newStartDate} - ${endDate}` });
                            }}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            End Date
                          </label>
                          <input
                            type='text'
                            value={editingExperience.date.split(' - ')[1] || ''}
                            onChange={(e) => {
                              const newEndDate = e.target.value;
                              const startDate = editingExperience.date.split(' - ')[0] || '';
                              setEditingExperience({ ...editingExperience, date: `${startDate} - ${newEndDate}` });
                            }}
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                          Location
                        </label>
                        <input
                          type='text'
                          value={editingExperience.location}
                          onChange={(e) =>
                            setEditingExperience({ ...editingExperience, location: e.target.value })
                          }
                          className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                        />
                      </div>
                      <div>
                        <div className='flex justify-between items-center mb-2.5'>
                          <label className='block text-sm font-medium text-black dark:text-white'>
                            Work Description at the Company
                          </label>
                          <button
                            type='button'
                            onClick={handleGenerateWorkDescription}
                            className='text-sm text-primary hover:underline'
                            disabled={isAiLoading}
                          >
                            {isAiLoading ? 'Generating...' : '✨ AI Writer'}
                          </button>
                        </div>
                        <div className='quill-container'>
                          <ReactQuill
                            theme='snow'
                            value={editingExperience.description}
                            onChange={(value: any) => setEditingExperience({ ...editingExperience, description: value })}
                            modules={quillModules}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className='mt-6 flex justify-end gap-4'>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      onClick={() => setShowExperienceEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none'
                      onClick={handleExperienceSave}
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Education Edit Modal */}
      <Transition appear show={showEducationEdit} as={React.Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setShowEducationEdit(false)}>
          <Transition.Child
            as={React.Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <div className='fixed inset-0 bg-black bg-opacity-50' />
          </Transition.Child>

          <div className='fixed inset-0 overflow-y-auto'>
            <div className='flex min-h-full items-center justify-center p-4 text-center'>
              <Transition.Child
                as={React.Fragment}
                enter='ease-out duration-300'
                enterFrom='opacity-0 scale-95'
                enterTo='opacity-100 scale-100'
                leave='ease-in duration-200'
                leaveFrom='opacity-100 scale-100'
                leaveTo='opacity-0 scale-95'
              >
                <Dialog.Panel className='w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all'>
                  <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900 dark:text-white'>
                    Edit Education
                  </Dialog.Title>
                  {editingEducation && (
                    <div className='mt-4 space-y-4'>
                      <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            Degree
                          </label>
                          <input
                            type='text'
                            value={editingEducation.degree}
                            onChange={(e) =>
                              setEditingEducation({ ...editingEducation, degree: e.target.value })
                            }
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            School
                          </label>
                          <input
                            type='text'
                            value={editingEducation.school}
                            onChange={(e) =>
                              setEditingEducation({ ...editingEducation, school: e.target.value })
                            }
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                      </div>
                      <div className='flex flex-col sm:flex-row gap-4'>
                        <div className='w-full sm:w-1/2'>
                          <label className='mb-2.5 block text-sm font-medium text-black dark:text-white'>
                            Date
                          </label>
                          <input
                            type='text'
                            value={editingEducation.date}
                            onChange={(e) =>
                              setEditingEducation({ ...editingEducation, date: e.target.value })
                            }
                            className='w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
                          />
                        </div>
                         <div className='w-full sm:w-1/2'>
                          {/* This can be a location field if needed in the future */}
                        </div>
                      </div>
                      <div>
                        <div className='flex justify-between items-center mb-2.5'>
                          <label className='block text-sm font-medium text-black dark:text-white'>
                            Key Achievements
                          </label>
                          <button
                            type='button'
                            onClick={handleGenerateEducationAchievements}
                            className='text-sm text-primary hover:underline'
                            disabled={isAiLoading}
                          >
                            {isAiLoading ? 'Generating...' : '✨ AI Writer'}
                          </button>
                        </div>
                        <div className='quill-container'>
                          <ReactQuill
                            theme='snow'
                            value={editingEducation.details}
                            onChange={(value: any) => setEditingEducation({ ...editingEducation, details: value })}
                            modules={quillModules}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className='mt-6 flex justify-end gap-4'>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      onClick={() => setShowEducationEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none'
                      onClick={handleEducationSave}
                    >
                      Save
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

// Floating edit button overlay for summary section
const SummaryEditOverlay = ({
  isHovered,
  setIsHovered,
  onEdit,
}: {
  isHovered: boolean;
  setIsHovered: (v: boolean) => void;
  onEdit: () => void;
}) => {
  // Position the overlay absolutely over the summary section
  // We'll use JS to find the summary section and overlay the button
  useEffect(() => {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;
    const h2s = resumeContent.getElementsByTagName('h2');
    let summaryH2: HTMLElement | null = null;
    for (let h2 of h2s) {
      if (h2.textContent?.toLowerCase().includes('summary')) {
        summaryH2 = h2;
        break;
      }
    }
    if (!summaryH2) return;
    const summaryP = summaryH2.nextElementSibling as HTMLElement | null;
    if (!summaryP) return;
    // Add a relative wrapper to the parent
    summaryP.style.position = 'relative';
    // Add hover listeners
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    summaryP.addEventListener('mouseenter', handleMouseEnter);
    summaryP.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      summaryP.removeEventListener('mouseenter', handleMouseEnter);
      summaryP.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [setIsHovered]);

  // Render the floating button if hovered
  useEffect(() => {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;
    const h2s = resumeContent.getElementsByTagName('h2');
    let summaryH2: HTMLElement | null = null;
    for (let h2 of h2s) {
      if (h2.textContent?.toLowerCase().includes('summary')) {
        summaryH2 = h2;
        break;
      }
    }
    if (!summaryH2) return;
    const summaryP = summaryH2.nextElementSibling as HTMLElement | null;
    if (!summaryP) return;
    let btn: HTMLButtonElement | null = null;
    if (isHovered) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '8px';
      btn.style.zIndex = '10';
      btn.style.background = 'white';
      btn.style.borderRadius = '8px';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      btn.style.padding = '6px';
      btn.style.border = '1px solid #e2e8f0';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.cursor = 'pointer';
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
      btn.onmousedown = (e) => { e.stopPropagation(); e.preventDefault(); onEdit(); };
      summaryP.appendChild(btn);
    }
    return () => {
      if (btn && summaryP.contains(btn)) summaryP.removeChild(btn);
    };
  }, [isHovered, onEdit]);
  return null;
};

export default ResumeDisplay; 