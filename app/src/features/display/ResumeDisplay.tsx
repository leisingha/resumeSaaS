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
import type { Section } from '../customizer/ManageSectionsPanel';

import QuillEditor from '../common/forwarded-quill';

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
  sections: Section[];
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
  sections,
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
  const [showSkillsEdit, setShowSkillsEdit] = useState(false);
  const [editingSkills, setEditingSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

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
        const A4_ASPECT_RATIO = 297 / 210;
        const containerWidth = containerNode.offsetWidth;

        // Enforce A4 aspect ratio on the container
        containerNode.style.height = `${containerWidth * A4_ASPECT_RATIO}px`;

        const contentElement = contentNode.firstChild as HTMLElement;
        const contentWidth = contentElement.offsetWidth;

        if (contentWidth > 0 && containerWidth > 0) {
          const scale = containerWidth / contentWidth;
          contentNode.style.transform = `scale(${scale})`;
          // The container height is now set based on aspect ratio, not content.
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

  // Combined effect to attach all edit buttons dynamically
  useEffect(() => {
    const resumeContent = document.getElementById('resume-content');
    if (!resumeContent) return;

    // --- Summary Edit Button ---
    const summaryH2 = Array.from(resumeContent.getElementsByTagName('h2')).find(h2 => h2.textContent?.toLowerCase().includes('summary'));
    const summaryP = summaryH2?.nextElementSibling as HTMLElement | null;
    
    const summarySectionState = sections.find((s) => s.id === 'summary');
    if (summaryH2) {
      summaryH2.style.display = summarySectionState?.visible ? '' : 'none';
    }
    if (summaryP) {
      summaryP.style.display = summarySectionState?.visible ? '' : 'none';
    }
    
    if (summaryP) {
      summaryP.style.position = 'relative';

      const handleMouseEnter = () => {
        summaryP.querySelector('.edit-button-summary')?.remove(); // Clean up just in case
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'edit-button-summary';
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
        btn.onclick = () => setShowSummaryEdit(true);
        summaryP.appendChild(btn);
      };

      const handleMouseLeave = () => {
        setTimeout(() => {
          if (!summaryP.matches(':hover')) {
            summaryP.querySelector('.edit-button-summary')?.remove();
          }
        }, 300);
      };

      summaryP.addEventListener('mouseenter', handleMouseEnter);
      summaryP.addEventListener('mouseleave', handleMouseLeave);
    }

    // --- Experience Edit Buttons ---
    const experienceH2 = Array.from(resumeContent.getElementsByTagName('h2')).find(h2 => h2.textContent?.toLowerCase().includes('experience'));
    if (experienceH2 && experienceH2.parentElement) {
      const experienceEntries = Array.from(experienceH2.parentElement.children).filter(
        (child) => child.tagName === 'DIV' && child.querySelector('h3')
      ) as HTMLElement[];

      experienceEntries.forEach((entry, index) => {
        entry.style.position = 'relative';

        const handleMouseEnter = () => {
          entry.querySelector('.edit-button-experience')?.remove();
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'edit-button-experience';
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
      });
    }

    // --- Education Edit Buttons ---
    const educationH2 = Array.from(resumeContent.getElementsByTagName('h2')).find((h2) => h2.textContent?.toLowerCase().includes('education'));
    if (educationH2 && educationH2.parentElement) {
      const educationSectionState = sections.find((s) => s.id === 'education');
      const isVisible = educationSectionState?.visible;

      educationH2.style.display = isVisible ? '' : 'none';

       const educationEntries = Array.from(educationH2.parentElement.children).filter(
        (child) => child.tagName === 'DIV' && child.querySelector('h3')
      ) as HTMLElement[];

      educationEntries.forEach((entry, index) => {
        entry.style.display = isVisible ? '' : 'none';
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
      });
    }

    // --- Skills Edit Button ---
    const skillsH2 = Array.from(resumeContent.getElementsByTagName('h2')).find(h2 => h2.textContent?.toLowerCase().includes('skills'));
    if (skillsH2 && skillsH2.parentElement) {
      const skillsContainer = skillsH2.nextElementSibling as HTMLElement | null;
      if (skillsContainer) {
        skillsContainer.style.position = 'relative';

        const handleMouseEnter = () => {
          skillsContainer.querySelector('.edit-button-skills')?.remove();
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'edit-button-skills';
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
            const skillsList = Array.from(skillsContainer.querySelectorAll('span')).map(span => span.textContent?.trim()).filter(Boolean) as string[];
            setEditingSkills(skillsList);
            setShowSkillsEdit(true);
          }
          skillsContainer.appendChild(btn);
        };

        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!skillsContainer.matches(':hover')) {
              skillsContainer.querySelector('.edit-button-skills')?.remove();
            }
          }, 300);
        };

        skillsContainer.addEventListener('mouseenter', handleMouseEnter);
        skillsContainer.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    // No specific cleanup needed as dangerouslySetInnerHTML re-renders everything
  }, [generatedContent, sections]);

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

  // Save summary edit and update the parent's state
  const handleSummarySave = () => {
    if (!generatedContent) return;

    // Create a temporary div to safely manipulate the HTML structure
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generatedContent;

    // Find the specific summary H2
    const summaryH2 = Array.from(tempDiv.getElementsByTagName('h2')).find(h2 => 
        h2.textContent?.toLowerCase().includes('summary')
    );

    if (summaryH2) {
        // Find the paragraph right after the summary H2
        const summaryP = summaryH2.nextElementSibling;
        if (summaryP) {
            // Create a new paragraph with the updated content
            const newSummaryP = document.createElement('p');
            newSummaryP.innerHTML = summaryEditValue;

            // Replace the old one
            summaryP.parentNode?.replaceChild(newSummaryP, summaryP);
        }
    }

    // Get the full, updated HTML content
    const newContent = tempDiv.innerHTML;
    // Pass the new content up to the parent component
    onContentChange(newContent);
    // Close the modal
    setShowSummaryEdit(false);
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
        } else if (editingEducation.details) {
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

  const handleSkillsSave = () => {
    if (!generatedContent) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generatedContent;

    const skillsH2 = Array.from(tempDiv.getElementsByTagName('h2')).find(h2 => h2.textContent?.toLowerCase().includes('skills'));
    if (skillsH2) {
      // Find and remove the old skills container (could be a p or ul)
      const oldSkillsContainer = skillsH2.nextElementSibling;
      if (oldSkillsContainer && (oldSkillsContainer.tagName === 'UL' || oldSkillsContainer.tagName === 'P')) {
        oldSkillsContainer.remove();
      }

      // Create and insert the new skills list as a paragraph if there are skills
      if (editingSkills.length > 0) {
        const newSkillsP = document.createElement('p');
        newSkillsP.textContent = editingSkills.join(', ');
        skillsH2.insertAdjacentElement('afterend', newSkillsP);
      }
    }

    onContentChange(tempDiv.innerHTML);
    setShowSkillsEdit(false);
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
        className='relative w-full overflow-hidden rounded-lg shadow-lg bg-white'
        ref={containerRef}
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
                  <div className='mt-2'>
                    <label htmlFor='summary-edit' className='block text-sm font-medium text-black dark:text-white'>
                      Summary
                    </label>
                    <div className='quill-container'>
                      <QuillEditor value={summaryEditValue} onChange={setSummaryEditValue} />
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
                      <div className='mt-2'>
                        <div className='flex justify-between items-center mb-1'>
                          <label htmlFor='experience-description' className='block text-sm font-medium text-black dark:text-white'>
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
                          <QuillEditor
                            value={editingExperience.description}
                            onChange={(value) =>
                              setEditingExperience({ ...editingExperience, description: value })
                            }
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
                      <div className='mt-2'>
                        <div className='flex justify-between items-center mb-1'>
                          <label htmlFor='education-details' className='block text-sm font-medium text-black dark:text-white'>
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
                          <QuillEditor
                            value={editingEducation.details}
                            onChange={(value) =>
                              setEditingEducation({ ...editingEducation, details: value })
                            }
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

      {/* Skills Edit Modal */}
      <Transition appear show={showSkillsEdit} as={React.Fragment}>
        <Dialog as='div' className='relative z-50' onClose={() => setShowSkillsEdit(false)}>
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
                    Edit Skills
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="mb-4.5">
                      <label className="mb-2.5 block text-black dark:text-white">
                        Key Skills
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add a skill and press Enter"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmedSkill = currentSkill.trim();
                              if (trimmedSkill && !editingSkills.includes(trimmedSkill)) {
                                setEditingSkills([...editingSkills, trimmedSkill]);
                                setCurrentSkill('');
                              }
                            }
                          }}
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-wrap items-center mt-2">
                        {editingSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium text-black dark:text-white dark:border-strokedark dark:bg-white/30"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => setEditingSkills(editingSkills.filter(s => s !== skill))}
                              className="ml-2 cursor-pointer hover:text-danger"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='mt-6 flex justify-end gap-4'>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      onClick={() => setShowSkillsEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90'
                      onClick={handleSkillsSave}
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

export default ResumeDisplay; 