import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import type { CustomizationOptions, DocumentType } from "../../AppPage";
import EditModal from "./EditModal";
import { Pencil, Download, Copy, Settings } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import "react-quill/dist/quill.snow.css";
import {
  generateAiResumePoints,
  generateResumePdf,
} from "wasp/client/operations";
import { useAction } from "wasp/client/operations";
import type { Section } from "../customizer/ManageSectionsPanel";
import {
  filterContentBySections,
  logSectionVisibility,
} from "./contentFiltering";

import QuillEditor from "../common/forwarded-quill";

interface ResumeDisplayProps {
  options: CustomizationOptions;
  generatedContent: string | null;
  isResumeGenerated: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  onContentChange: (newContent: string) => void;
  documentType: "resume" | "coverLetter";
  sections: Section[];
  onOverflowDetected: (message: string, details: string) => void;
  onAdjustCustomizations: () => void;
}

const ResumeDisplayMobile: React.FC<ResumeDisplayProps> = ({
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
  onOverflowDetected,
  onAdjustCustomizations,
}) => {
  const [editedContent, setEditedContent] = useState(generatedContent || "");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [hasShownOverflowAlert, setHasShownOverflowAlert] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const instanceId = useRef(
    `mobile-resume-content-${Math.random().toString(36).substr(2, 9)}`
  ).current;

  // Edit states
  const [showSummaryEdit, setShowSummaryEdit] = useState(false);
  const [editingSummaryContent, setEditingSummaryContent] = useState("");
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
    gpa: string;
  } | null>(null);
  const [showSkillsEdit, setShowSkillsEdit] = useState(false);
  const [editingSkills, setEditingSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [showLanguagesEdit, setShowLanguagesEdit] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [showProjectsEdit, setShowProjectsEdit] = useState(false);
  const [editingProjectsContent, setEditingProjectsContent] = useState("");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState({
    experience: false,
    projects: false,
    summary: false,
  });

  const generateResumePointsAction = useAction(generateAiResumePoints);

  // Apply section visibility filtering
  const filteredContent = useMemo(() => {
    if (!generatedContent) return null;
    return filterContentBySections(generatedContent, sections);
  }, [generatedContent, sections]);

  // Find summary section in the rendered HTML (matching desktop behavior)
  useEffect(() => {
    if (!generatedContent) return;
    // Extract summary content from the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;
    const summaryH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("summary")
    );
    if (summaryH2) {
      const summaryContainer =
        summaryH2.nextElementSibling as HTMLElement | null;
      if (summaryContainer) {
        setEditingSummaryContent(summaryContainer.outerHTML);
      }
    }
  }, [generatedContent]);

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
      setIsOverflowing(false);
      setHasShownOverflowAlert(false);
    }
  }, [generatedContent]);

  // Mobile-specific fixed dimensions
  useLayoutEffect(() => {
    const setMobileDimensions = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode) {
        // Mobile A4 dimensions: 320px × 453px (maintains A4 aspect ratio 297/210 = 1.414)
        const MOBILE_WIDTH = 320;
        const MOBILE_HEIGHT = Math.round(320 * (297 / 210)); // 320 * 1.414 = 453px

        containerNode.style.width = `${MOBILE_WIDTH}px`;
        containerNode.style.height = `${MOBILE_HEIGHT}px`;

        // Set clipping container height (453px - 28px padding = 425px)
        const clippingContainer = containerNode.querySelector(
          'div[style*="overflow: hidden"]'
        ) as HTMLElement;
        if (clippingContainer) {
          clippingContainer.style.height = `${MOBILE_HEIGHT - 28}px`;
        }

        contentNode.style.transform = "none";
      }
    };

    setMobileDimensions();
  }, [generatedContent]);

  // Overflow detection for mobile
  useEffect(() => {
    const detectOverflow = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode && generatedContent) {
        const clippingContainer = containerNode.querySelector(
          'div[style*="overflow: hidden"]'
        ) as HTMLElement;
        if (!clippingContainer) return;

        const resumeContent = contentNode;
        if (!resumeContent) return;

        const clippingHeight = clippingContainer.offsetHeight;
        const actualContent = resumeContent.querySelector(
          'div[style*="padding: 0"]'
        ) as HTMLElement;
        if (!actualContent) return;

        const contentHeight = actualContent.scrollHeight;

        if (contentHeight > clippingHeight) {
          setIsOverflowing(true);
          if (!hasShownOverflowAlert) {
            setHasShownOverflowAlert(true);
            onOverflowDetected(
              "Resume content exceeds page limits!",
              'Content is too long. Consider reducing text or hiding sections via "Manage Sections".'
            );
          }
        } else {
          setIsOverflowing(false);
        }
      }
    };

    const timer = setTimeout(detectOverflow, 1000);
    return () => clearTimeout(timer);
  }, [generatedContent, onOverflowDetected, hasShownOverflowAlert]);

  // Mobile-specific styling injection
  useEffect(() => {
    const resumeContent = document.getElementById(instanceId);
    if (!resumeContent) return;

    const existingStyle = resumeContent.querySelector(
      "#mobile-resume-color-style"
    );
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "mobile-resume-color-style";
    style.innerHTML = `
      #${instanceId} h1,
      #${instanceId} h2,
      #${instanceId} h3,
      #${instanceId} p,
      #${instanceId} li,
      #${instanceId} span {
        color: ${options.colorScheme} !important;
      }
      
      #${instanceId} h1 {
        font-size: 9.6pt !important;
        line-height: 1.4 !important;
        margin: 0 !important;
      }
      
      #${instanceId} h2 {
        font-size: 4.8pt !important;
        line-height: 1.4 !important;
        margin: 6px 0 4px 0 !important;
      }
      
      #${instanceId} h3 {
        font-size: 4.4pt !important;
        line-height: 1.4 !important;
        margin: 0 !important;
      }
      
      #${instanceId} p {
        font-size: 4pt !important;
        line-height: 1.4 !important;
        margin: 0.8px 0 !important;
      }
      
      #${instanceId} li,
      #${instanceId} span {
        font-size: 4pt !important;
        line-height: 1.4 !important;
      }
      
      #${instanceId} ul {
        list-style-type: disc !important;
        margin-left: 0.5rem !important;
        padding-left: 0 !important;
        margin-top: 2px !important;
        margin-bottom: 1px !important;
        line-height: 1.4 !important;
      }
      
      #${instanceId} li {
        margin-bottom: 0.1rem !important;
      }
      
      #${instanceId} div {
        margin-bottom: 6px !important;
      }
      
      /* Make section dividers thinner in mobile */
      #${instanceId} hr {
        border: none !important;
        border-top: 0.4px solid ${options.colorScheme} !important;
        margin: 1px 0 !important;
      }
      
      #${instanceId} h2 {
        border-bottom: 0.4px solid ${options.colorScheme} !important;
        padding-bottom: 0.8px !important;
      }
    `;
    resumeContent.prepend(style);
  }, [generatedContent, options.colorScheme, instanceId]);

  // Mobile edit button attachment (always visible on mobile)
  useEffect(() => {
    const resumeContent = document.getElementById(instanceId);
    if (!resumeContent) return;

    // Summary edit button
    const summaryH2 = Array.from(resumeContent.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("summary")
    );
    const summaryP = summaryH2?.nextElementSibling as HTMLElement | null;

    const summarySectionState = sections.find((s) => s.id === "summary");
    if (summaryH2) {
      summaryH2.style.display = summarySectionState?.visible ? "" : "none";
    }
    if (summaryP) {
      summaryP.style.display = summarySectionState?.visible ? "" : "none";
    }

    if (summaryP) {
      summaryP.style.position = "relative";

      // Always show edit button on mobile
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mobile-edit-button";
      btn.style.position = "absolute";
      btn.style.top = "6px";
      btn.style.right = "6px";
      btn.style.zIndex = "10";
      btn.style.background = "white";
      btn.style.borderRadius = "6px";
      btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      btn.style.padding = "4px";
      btn.style.border = "1px solid #e2e8f0";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.cursor = "pointer";
      btn.style.width = "24px";
      btn.style.height = "24px";
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
      btn.onclick = () => {
        setEditingSummaryContent(summaryP.outerHTML);
        setShowSummaryEdit(true);
      };
      summaryP.appendChild(btn);
    }

    // Education edit buttons
    const educationH2 = Array.from(
      resumeContent.getElementsByTagName("h2")
    ).find((h2) => h2.textContent?.toLowerCase().includes("education"));
    if (educationH2 && educationH2.parentElement) {
      const educationSectionState = sections.find((s) => s.id === "education");
      const isVisible = educationSectionState?.visible;

      educationH2.style.display = isVisible ? "" : "none";

      const educationEntries = Array.from(
        educationH2.parentElement.children
      ).filter(
        (child) => child.tagName === "DIV" && child.querySelector("h3")
      ) as HTMLElement[];

      educationEntries.forEach((entry, index) => {
        entry.style.display = isVisible ? "" : "none";
        entry.style.position = "relative";

        // Always show edit button on mobile (remove any existing button first)
        entry.querySelector(".mobile-edit-button-education")?.remove();
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mobile-edit-button-education";
        btn.style.position = "absolute";
        btn.style.top = "6px";
        btn.style.right = "6px";
        btn.style.zIndex = "10";
        btn.style.background = "white";
        btn.style.borderRadius = "6px";
        btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        btn.style.padding = "4px";
        btn.style.border = "1px solid #e2e8f0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.style.width = "24px";
        btn.style.height = "24px";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = () => {
          const degree = entry.querySelector("h3")?.textContent || "";
          const pElement = entry.querySelector("p");
          const school = pElement?.childNodes[0]?.textContent?.trim() || "";
          const gpaSpan = pElement?.querySelector("span");
          const gpa = gpaSpan?.textContent?.trim() || "";
          const date =
            entry.querySelector('div[style*="text-align: right"] p')
              ?.textContent || "";
          setEditingEducation({ index, degree, school, date, gpa });
          setShowEducationEdit(true);
        };
        entry.appendChild(btn);
      });
    }

    // Experience edit buttons
    const experienceH2 = Array.from(
      resumeContent.getElementsByTagName("h2")
    ).find((h2) => h2.textContent?.toLowerCase().includes("experience"));

    if (experienceH2 && experienceH2.parentElement) {
      const experienceSectionState = sections.find(
        (s) => s.id === "experience"
      );
      const isVisible = experienceSectionState?.visible;

      experienceH2.style.display = isVisible ? "" : "none";

      const experienceEntries = Array.from(
        experienceH2.parentElement.children
      ).filter(
        (child) => child.tagName === "DIV" && child.querySelector("h3")
      ) as HTMLElement[];

      experienceEntries.forEach((entry, index) => {
        entry.style.display = isVisible ? "" : "none";
        entry.style.position = "relative";

        // Always show edit button on mobile
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.position = "absolute";
        btn.style.top = "6px";
        btn.style.right = "6px";
        btn.style.zIndex = "10";
        btn.style.background = "white";
        btn.style.borderRadius = "6px";
        btn.style.boxShadow = "0 1.6px 6.4px rgba(0,0,0,0.08)";
        btn.style.padding = "4.8px";
        btn.style.border = "1px solid #e2e8f0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = () => {
          const title = entry.querySelector("h3")?.textContent || "";
          const pElement = entry.querySelector("p");
          const companyLocation = pElement?.textContent?.split(" - ") || [];
          const company = companyLocation[0];
          const location = companyLocation[1] || "";
          const date =
            entry.querySelector('div[style*="text-align: right"] p')
              ?.textContent || "";
          const ulEl = entry.querySelector("ul");
          const description = ulEl
            ? ulEl.outerHTML
            : entry.querySelector("p")?.innerHTML || "";
          setEditingExperience({
            index,
            title,
            company,
            location,
            date,
            description,
          });
          setShowExperienceEdit(true);
        };
        entry.appendChild(btn);
      });
    }

    // Skills edit button
    const skillsH2 = Array.from(resumeContent.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("skills")
    );
    if (skillsH2 && skillsH2.parentElement) {
      const skillsSectionState = sections.find((s) => s.id === "skills");
      const isVisible = skillsSectionState?.visible;

      skillsH2.style.display = isVisible ? "" : "none";
      const skillsContainer = skillsH2.nextElementSibling as HTMLElement | null;
      if (skillsContainer) {
        skillsContainer.style.display = isVisible ? "" : "none";
        skillsContainer.style.position = "relative";

        // Always show edit button on mobile
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.position = "absolute";
        btn.style.top = "6px";
        btn.style.right = "6px";
        btn.style.zIndex = "10";
        btn.style.background = "white";
        btn.style.borderRadius = "6px";
        btn.style.boxShadow = "0 1.6px 6.4px rgba(0,0,0,0.08)";
        btn.style.padding = "4.8px";
        btn.style.border = "1px solid #e2e8f0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = () => {
          // Try different selectors to extract skills from various formats
          let skillsList: string[] = [];

          // Check for unordered list first
          const ulElement = skillsContainer.querySelector("ul");
          if (ulElement) {
            const listItems = Array.from(ulElement.querySelectorAll("li"));
            if (listItems.length > 0) {
              skillsList = listItems
                .map((li) => li.textContent?.trim() || "")
                .filter(Boolean);
            }
          }

          // Fallback to paragraph text
          if (skillsList.length === 0) {
            const paragraphElement = skillsContainer.querySelector("p");
            if (paragraphElement) {
              const allText = paragraphElement.textContent?.trim() || "";
              if (allText) {
                skillsList = allText
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean);
              }
            } else {
              // Last resort - use the container's direct text content
              const allText = skillsContainer.textContent?.trim() || "";
              if (allText) {
                skillsList = allText
                  .split(",")
                  .map((skill) => skill.trim())
                  .filter(Boolean);
              }
            }
          }

          setEditingSkills(skillsList);
          setShowSkillsEdit(true);
        };
        skillsContainer.appendChild(btn);
      }
    }

    // Projects & Achievements edit button
    const projectsH2 = Array.from(
      resumeContent.getElementsByTagName("h2")
    ).find(
      (h2) => h2.textContent?.toLowerCase().includes("projects & achievements")
    );
    if (projectsH2 && projectsH2.parentElement) {
      const projectsSectionState = sections.find((s) => s.id === "projects");
      const isVisible = projectsSectionState?.visible;

      projectsH2.style.display = isVisible ? "" : "none";
      const projectsContainer =
        projectsH2.nextElementSibling as HTMLElement | null;
      if (projectsContainer) {
        projectsContainer.style.display = isVisible ? "" : "none";
        projectsContainer.style.position = "relative";

        // Always show edit button on mobile
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.position = "absolute";
        btn.style.top = "6px";
        btn.style.right = "6px";
        btn.style.zIndex = "10";
        btn.style.background = "white";
        btn.style.borderRadius = "6px";
        btn.style.boxShadow = "0 1.6px 6.4px rgba(0,0,0,0.08)";
        btn.style.padding = "4.8px";
        btn.style.border = "1px solid #e2e8f0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = () => {
          setEditingProjectsContent(projectsContainer.outerHTML);
          setShowProjectsEdit(true);
        };
        projectsContainer.appendChild(btn);
      }
    }

    // Languages edit button
    const languagesH2 = Array.from(
      resumeContent.getElementsByTagName("h2")
    ).find((h2) => h2.textContent?.toLowerCase().includes("languages"));
    if (languagesH2 && languagesH2.parentElement) {
      const languageSectionState = sections.find((s) => s.id === "languages");
      const isVisible = languageSectionState?.visible;

      languagesH2.style.display = isVisible ? "" : "none";
      const languagesContainer =
        languagesH2.nextElementSibling as HTMLElement | null;
      if (languagesContainer) {
        languagesContainer.style.display = isVisible ? "" : "none";
        languagesContainer.style.position = "relative";

        // Always show edit button on mobile
        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.position = "absolute";
        btn.style.top = "6px";
        btn.style.right = "6px";
        btn.style.zIndex = "10";
        btn.style.background = "white";
        btn.style.borderRadius = "6px";
        btn.style.boxShadow = "0 1.6px 6.4px rgba(0,0,0,0.08)";
        btn.style.padding = "4.8px";
        btn.style.border = "1px solid #e2e8f0";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.cursor = "pointer";
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
        btn.onclick = () => {
          // Try different selectors to extract languages from various formats
          let languagesList: string[] = [];

          // Try spans first
          const spans = Array.from(languagesContainer.querySelectorAll("span"))
            .map((span) => span.textContent?.trim())
            .filter(Boolean) as string[];
          if (spans.length > 0) {
            languagesList = spans;
          } else {
            // Try extracting from paragraph text (comma-separated)
            const paragraphs = Array.from(
              languagesContainer.querySelectorAll("p")
            );
            if (paragraphs.length > 0) {
              const pText = paragraphs[0].textContent?.trim() || "";
              if (pText) {
                languagesList = pText
                  .split(",")
                  .map((lang) => lang.trim())
                  .filter(Boolean);
              }
            } else {
              // Try extracting from list items
              const listItems = Array.from(
                languagesContainer.querySelectorAll("li")
              )
                .map((li) => li.textContent?.trim())
                .filter(Boolean) as string[];
              if (listItems.length > 0) {
                languagesList = listItems;
              } else {
                // Fallback: get all text content and try to split
                const allText = languagesContainer.textContent?.trim() || "";
                if (allText) {
                  languagesList = allText
                    .split(",")
                    .map((lang) => lang.trim())
                    .filter(Boolean);
                }
              }
            }
          }

          setEditingLanguages(languagesList);
          setShowLanguagesEdit(true);
        };
        languagesContainer.appendChild(btn);
      }
    }

    // ... (end of useEffect)
  }, [filteredContent, sections, instanceId]);

  // AI generation for summary (matching desktop behavior)
  const handleGenerateSummaryContent = async () => {
    setIsAiLoading({ ...isAiLoading, summary: true });
    try {
      const resumeContent = document.getElementById(instanceId);
      if (!resumeContent) {
        throw new Error("Could not find resume content to build context.");
      }

      const experienceTitles = Array.from(resumeContent.querySelectorAll("h3"))
        .map((h3) => h3.textContent?.trim())
        .filter(Boolean)
        .join(", ");

      const context = `Based on job titles and degrees like: ${experienceTitles}, write a professional summary paragraph that highlights key strengths, experience, and career objectives. The summary should be 3-4 sentences and capture the candidate's value proposition.`;

      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        setEditingSummaryContent((prev) => (prev || "") + result.content);
      }
    } catch (error: any) {
      alert("Error generating AI content: " + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, summary: false });
    }
  };

  const handleGenerateProjectsContent = async () => {
    setIsAiLoading({ ...isAiLoading, projects: true });
    try {
      const resumeContent = document.getElementById(instanceId);
      if (!resumeContent) {
        throw new Error("Could not find resume content to build context.");
      }

      const experienceTitles = Array.from(resumeContent.querySelectorAll("h3"))
        .map((h3) => h3.textContent?.trim())
        .filter(Boolean)
        .join(", ");

      const context = `Based on job titles and degrees like: ${experienceTitles}, suggest three bullet points for a 'Projects & Achievements' section, providing 2 project ideas and 1 award or accomplishment. The points should be creative and relevant to the user's likely field.`;

      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        setEditingProjectsContent((prev) => (prev || "") + result.content);
      }
    } catch (error: any) {
      alert("Error generating AI content: " + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, projects: false });
    }
  };

  const documentTitle = documentType === "resume" ? "Resume" : "Cover Letter";

  const handleDownloadPdf = async () => {
    if (!generatedContent || isPdfGenerating) return;

    setIsPdfGenerating(true);
    try {
      const result = await generateResumePdf({
        htmlContent: filteredContent || generatedContent,
        filename: `${documentTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      });

      // PDF download logic (same as original)
      const byteCharacters = atob(result.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error("Failed to download PDF:", error);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedContent) return;

    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = filteredContent || generatedContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      await navigator.clipboard.writeText(textContent);
      console.log("Resume content copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  // Save handlers (same as original)
  const handleSummarySave = () => {
    if (!generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const summaryH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("summary")
    );
    if (summaryH2) {
      const summaryContainer =
        summaryH2.nextElementSibling as HTMLElement | null;
      if (summaryContainer) {
        // Replace the entire container to avoid nested lists
        summaryContainer.outerHTML = editingSummaryContent;
      }
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowSummaryEdit(false);
  };

  const handleExperienceSave = () => {
    if (!editingExperience || !generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const experienceH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("experience")
    );
    if (!experienceH2 || !experienceH2.parentElement) return;

    const experienceContainer = experienceH2.parentElement;
    const experienceEntries = Array.from(experienceContainer.children).filter(
      (child) => child.tagName === "DIV" && child.querySelector("h3")
    );
    const entryToUpdate = experienceEntries[
      editingExperience.index
    ] as HTMLElement;

    if (entryToUpdate) {
      let finalDescriptionHtml = "";
      const descTempDiv = document.createElement("div");
      descTempDiv.innerHTML = editingExperience.description;

      const isAlreadyList = descTempDiv.querySelector("ul, ol");

      if (isAlreadyList) {
        // If it's already a list, just reformat with proper mobile styling
        const listItems = Array.from(descTempDiv.querySelectorAll("li"));
        finalDescriptionHtml = `<ul style="margin-top: 2px; padding-left: 0; margin-left: 0.5rem; line-height: 1.4; list-style-type: disc;">${listItems
          .map(
            (p) =>
              `<li style="margin-bottom: 0.1rem; font-size: 4pt; line-height: 1.4;">${p.innerHTML}</li>`
          )
          .join("")}</ul>`;
      } else {
        finalDescriptionHtml = `<ul style="margin-top: 2px; padding-left: 0; margin-left: 0.5rem; line-height: 1.4; list-style-type: disc;"><li style="margin-bottom: 0.1rem; font-size: 4pt; line-height: 1.4;">${editingExperience.description}</li></ul>`;
      }

      entryToUpdate.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <div>
            <h3 style="font-weight: bold; margin: 0;">${editingExperience.title}</h3>
            <p style="margin: 0.8px 0;">${editingExperience.company} - ${editingExperience.location}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;">${editingExperience.date}</p>
          </div>
        </div>
        ${finalDescriptionHtml}
      `;
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowExperienceEdit(false);
    setEditingExperience(null);
  };

  const handleEducationSave = () => {
    if (!editingEducation || !generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const educationH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("education")
    );
    if (!educationH2 || !educationH2.parentElement) return;

    const educationContainer = educationH2.parentElement;
    const educationEntries = Array.from(educationContainer.children).filter(
      (child) => child.tagName === "DIV" && child.querySelector("h3")
    );
    const entryToUpdate = educationEntries[
      editingEducation.index
    ] as HTMLElement;

    if (entryToUpdate) {
      const gpaHtml = editingEducation.gpa
        ? ` <span style="margin-left: 1rem; color: #555;">${editingEducation.gpa}</span>`
        : "";
      entryToUpdate.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
            <div>
                <h3 style="font-size: 11pt; font-weight: bold; margin: 0;">${editingEducation.degree}</h3>
                <p style="margin: 2px 0;">${editingEducation.school}${gpaHtml}</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0;">${editingEducation.date}</p>
            </div>
        </div>
      `;
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowEducationEdit(false);
    setEditingEducation(null);
  };

  const handleSkillsSave = () => {
    if (!generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const skillsH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("skills")
    );
    if (skillsH2) {
      // Find and remove the old skills container (could be a p or ul)
      const oldSkillsContainer = skillsH2.nextElementSibling;
      if (
        oldSkillsContainer &&
        (oldSkillsContainer.tagName === "UL" ||
          oldSkillsContainer.tagName === "P")
      ) {
        oldSkillsContainer.remove();
      }

      // Create and insert the new skills list as a paragraph if there are skills
      if (editingSkills.length > 0) {
        const newSkillsP = document.createElement("p");
        newSkillsP.textContent = editingSkills.join(", ");
        skillsH2.insertAdjacentElement("afterend", newSkillsP);
      }
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowSkillsEdit(false);
    setEditingSkills([]);
  };

  const handleProjectsSave = () => {
    if (!generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const projectsH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("projects & achievements")
    );
    if (projectsH2) {
      const projectsContainer =
        projectsH2.nextElementSibling as HTMLElement | null;
      if (projectsContainer) {
        // Replace the entire container to avoid nested lists
        projectsContainer.outerHTML = editingProjectsContent;
      }
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowProjectsEdit(false);
  };

  const handleLanguagesSave = () => {
    if (!generatedContent) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generatedContent;

    const languagesH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("languages")
    );
    if (languagesH2) {
      // Find and remove the old languages container (could be a p or ul)
      const oldLanguagesContainer = languagesH2.nextElementSibling;
      if (
        oldLanguagesContainer &&
        (oldLanguagesContainer.tagName === "UL" ||
          oldLanguagesContainer.tagName === "P")
      ) {
        oldLanguagesContainer.remove();
      }

      // Create and insert the new languages list as a paragraph if there are languages
      if (editingLanguages.length > 0) {
        const newLanguagesP = document.createElement("p");
        newLanguagesP.textContent = editingLanguages.join(", ");
        languagesH2.insertAdjacentElement("afterend", newLanguagesP);
      }
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowLanguagesEdit(false);
    setEditingLanguages([]);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="flex justify-between items-center w-full px-4">
        <div className="flex items-center">
          <button
            onClick={onAdjustCustomizations}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Adjust</span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyToClipboard}
            disabled={!generatedContent}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Copy size={14} />
            <span className="hidden sm:inline">Copy</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isOverflowing || isPdfGenerating}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPdfGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Content Area */}
      <div className="flex justify-center p-4">
        <div
          className="relative overflow-hidden rounded-lg shadow-lg bg-white"
          ref={containerRef}
          style={{ padding: "12px 16px 16px 16px" }}
        >
          {/* Clipping container */}
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              ref={contentRef}
              id={instanceId}
              style={{
                transformOrigin: "top left",
                position: "relative",
                padding: "0",
              }}
            >
              <div
                style={{ padding: "0" }}
                dangerouslySetInnerHTML={{
                  __html:
                    filteredContent ||
                    "<p>Your generated document will appear here...</p>",
                }}
              />
            </div>
          </div>

          {/* Overflow warning */}
          {isOverflowing && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "20px",
                right: "20px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "6px",
                padding: "6px 8px",
                fontSize: "10px",
                color: "#dc2626",
                textAlign: "center",
                fontWeight: "500",
                zIndex: 10,
              }}
            >
              ⚠️ Text overflow detected
            </div>
          )}
        </div>
      </div>

      {/* Reuse existing EditModal */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onContentChange}
        initialContent={generatedContent || ""}
      />

      {/* Summary Edit Modal */}
      <Transition appear show={showSummaryEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowSummaryEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Summary
                  </Dialog.Title>
                  <div className="mt-4 quill-container">
                    <div className="flex justify-end items-center mb-1">
                      <button
                        type="button"
                        onClick={handleGenerateSummaryContent}
                        className="text-sm text-primary hover:underline"
                        disabled={isAiLoading.summary}
                      >
                        {isAiLoading.summary ? "Generating..." : "✨ AI Writer"}
                      </button>
                    </div>
                    <QuillEditor
                      value={editingSummaryContent}
                      onChange={setEditingSummaryContent}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowSummaryEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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

      {/* Education Edit Modal */}
      <Transition appear show={showEducationEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowEducationEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Education
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        School
                      </label>
                      <input
                        type="text"
                        value={editingEducation?.school || ""}
                        onChange={(e) =>
                          setEditingEducation((prev) =>
                            prev ? { ...prev, school: e.target.value } : null
                          )
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        Field of Study
                      </label>
                      <input
                        type="text"
                        value={editingEducation?.degree || ""}
                        onChange={(e) =>
                          setEditingEducation((prev) =>
                            prev ? { ...prev, degree: e.target.value } : null
                          )
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        Graduation Date
                      </label>
                      <input
                        type="text"
                        value={editingEducation?.date || ""}
                        onChange={(e) =>
                          setEditingEducation((prev) =>
                            prev ? { ...prev, date: e.target.value } : null
                          )
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                        GPA (optional)
                      </label>
                      <input
                        type="text"
                        value={editingEducation?.gpa || ""}
                        onChange={(e) =>
                          setEditingEducation((prev) =>
                            prev ? { ...prev, gpa: e.target.value } : null
                          )
                        }
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowEducationEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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

      {/* Experience Edit Modal */}
      <Transition appear show={showExperienceEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowExperienceEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Experience
                  </Dialog.Title>
                  {editingExperience && (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/2">
                          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                            Employer
                          </label>
                          <input
                            type="text"
                            value={editingExperience.company}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                company: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          />
                        </div>
                        <div className="w-full sm:w-1/2">
                          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                            Job Title
                          </label>
                          <input
                            type="text"
                            value={editingExperience.title}
                            onChange={(e) =>
                              setEditingExperience({
                                ...editingExperience,
                                title: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/2">
                          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                            Start Date
                          </label>
                          <input
                            type="text"
                            value={editingExperience.date.split(" - ")[0] || ""}
                            onChange={(e) => {
                              const newStartDate = e.target.value;
                              const endDate =
                                editingExperience.date.split(" - ")[1] ||
                                "Present";
                              setEditingExperience({
                                ...editingExperience,
                                date: `${newStartDate} - ${endDate}`,
                              });
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          />
                        </div>
                        <div className="w-full sm:w-1/2">
                          <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                            End Date
                          </label>
                          <input
                            type="text"
                            value={editingExperience.date.split(" - ")[1] || ""}
                            onChange={(e) => {
                              const newEndDate = e.target.value;
                              const startDate =
                                editingExperience.date.split(" - ")[0] || "";
                              setEditingExperience({
                                ...editingExperience,
                                date: `${startDate} - ${newEndDate}`,
                              });
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editingExperience.location}
                          onChange={(e) =>
                            setEditingExperience({
                              ...editingExperience,
                              location: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        />
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <label
                            htmlFor="experience-description"
                            className="block text-sm font-medium text-black dark:text-white"
                          >
                            Work Description at the Company
                          </label>
                        </div>
                        <div className="quill-container">
                          <QuillEditor
                            value={editingExperience.description}
                            onChange={(value) =>
                              setEditingExperience({
                                ...editingExperience,
                                description: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowExperienceEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none"
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

      {/* Skills Edit Modal */}
      <Transition appear show={showSkillsEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowSkillsEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Skills
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="mb-4.5">
                      <label className="mb-2.5 block text-black dark:text-white">
                        Skills
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add a skill and press Enter"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const trimmedSkill = currentSkill.trim();
                              if (
                                trimmedSkill &&
                                !editingSkills.includes(trimmedSkill)
                              ) {
                                setEditingSkills([
                                  ...editingSkills,
                                  trimmedSkill,
                                ]);
                                setCurrentSkill("");
                              }
                            }
                          }}
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedSkill = currentSkill.trim();
                            if (
                              trimmedSkill &&
                              !editingSkills.includes(trimmedSkill)
                            ) {
                              setEditingSkills([
                                ...editingSkills,
                                trimmedSkill,
                              ]);
                              setCurrentSkill("");
                            }
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md transition-opacity duration-200 ${
                            currentSkill
                              ? "opacity-100 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                              : "opacity-0 pointer-events-none"
                          }`}
                          aria-label="Add skill"
                        >
                          <span className="text-gray-600 dark:text-gray-300 text-xl">
                            +
                          </span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center mt-2">
                        {editingSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30 dark:text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSkills(
                                  editingSkills.filter((s) => s !== skill)
                                )
                              }
                              className="ml-2 cursor-pointer hover:text-danger"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                                  fill="currentColor"
                                ></path>
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowSkillsEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
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

      {/* Projects & Achievements Edit Modal */}
      <Transition appear show={showProjectsEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowProjectsEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Projects & Achievements
                  </Dialog.Title>
                  <div className="mt-4 quill-container">
                    <div className="flex justify-end items-center mb-1">
                      <button
                        type="button"
                        onClick={handleGenerateProjectsContent}
                        className="text-sm text-primary hover:underline"
                        disabled={isAiLoading.projects}
                      >
                        {isAiLoading.projects
                          ? "Generating..."
                          : "✨ AI Writer"}
                      </button>
                    </div>
                    <QuillEditor
                      value={editingProjectsContent}
                      onChange={setEditingProjectsContent}
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowProjectsEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                      onClick={handleProjectsSave}
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

      {/* Languages Edit Modal */}
      <Transition appear show={showLanguagesEdit} as={React.Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowLanguagesEdit(false)}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    Edit Languages
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="mb-4.5">
                      <label className="mb-2.5 block text-black dark:text-white">
                        Languages
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add a language and press Enter"
                          value={currentLanguage}
                          onChange={(e) => setCurrentLanguage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const trimmedLanguage = currentLanguage.trim();
                              if (
                                trimmedLanguage &&
                                !editingLanguages.includes(trimmedLanguage)
                              ) {
                                setEditingLanguages([
                                  ...editingLanguages,
                                  trimmedLanguage,
                                ]);
                                setCurrentLanguage("");
                              }
                            }
                          }}
                          className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedLanguage = currentLanguage.trim();
                            if (
                              trimmedLanguage &&
                              !editingLanguages.includes(trimmedLanguage)
                            ) {
                              setEditingLanguages([
                                ...editingLanguages,
                                trimmedLanguage,
                              ]);
                              setCurrentLanguage("");
                            }
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md transition-opacity duration-200 ${
                            currentLanguage
                              ? "opacity-100 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                              : "opacity-0 pointer-events-none"
                          }`}
                          aria-label="Add language"
                        >
                          <span className="text-gray-600 dark:text-gray-300 text-xl">
                            +
                          </span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center mt-2">
                        {editingLanguages.map((language, index) => (
                          <span
                            key={index}
                            className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30 dark:text-white"
                          >
                            {language}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingLanguages(
                                  editingLanguages.filter(
                                    (lang) => lang !== language
                                  )
                                )
                              }
                              className="ml-2 cursor-pointer hover:text-danger"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                                  fill="currentColor"
                                ></path>
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowLanguagesEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                      onClick={handleLanguagesSave}
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

export default ResumeDisplayMobile;
