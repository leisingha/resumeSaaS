import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import type { CustomizationOptions, DocumentType } from "../../AppPage";
import EditModal from "./EditModal";
// PDF download libraries removed - will be replaced with new implementation
import { Pencil, Download, Copy, Settings } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import "react-quill/dist/quill.snow.css";
import "./ResumeDisplay.css";
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

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["clean"],
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
  onOverflowDetected,
  onAdjustCustomizations,
}) => {
  const [editedContent, setEditedContent] = useState(generatedContent || "");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [hasShownOverflowAlert, setHasShownOverflowAlert] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Create a unique ID for this instance to avoid conflicts with multiple ResumeDisplay components
  const instanceId = useRef(
    `resume-content-${Math.random().toString(36).substr(2, 9)}`
  ).current;
  const [showSummaryEdit, setShowSummaryEdit] = useState(false);
  const [editingSummaryContent, setEditingSummaryContent] = useState("");
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
    gpa: string;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState({
    experience: false,
    projects: false,
    summary: false,
  });
  const generateResumePointsAction = useAction(generateAiResumePoints);
  const [showSkillsEdit, setShowSkillsEdit] = useState(false);
  const [editingSkills, setEditingSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [showLanguagesEdit, setShowLanguagesEdit] = useState(false);
  const [editingLanguages, setEditingLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [showProjectsEdit, setShowProjectsEdit] = useState(false);
  const [editingProjectsContent, setEditingProjectsContent] = useState("");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Apply section visibility filtering to the displayed content
  const filteredContent = useMemo(() => {
    if (!generatedContent) return null;
    return filterContentBySections(generatedContent, sections);
  }, [generatedContent, sections]);

  useEffect(() => {
    if (generatedContent) {
      setEditedContent(generatedContent);
      setIsOverflowing(false); // Reset overflow on new content
      setHasShownOverflowAlert(false); // Reset alert state on new content
    }
  }, [generatedContent]);

  useLayoutEffect(() => {
    const setFixedDimensions = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode) {
        // Fixed A4 dimensions: 800px × 1131px (maintains A4 aspect ratio 297/210)
        const FIXED_WIDTH = 800;
        const FIXED_HEIGHT = 1131;

        // Lock container to fixed dimensions
        containerNode.style.width = `${FIXED_WIDTH}px`;
        containerNode.style.height = `${FIXED_HEIGHT}px`;

        // Set the clipping container height to account for vertical padding (30px + 40px = 70px)
        const clippingContainer = containerNode.querySelector(
          'div[style*="overflow: hidden"]'
        ) as HTMLElement;
        if (clippingContainer) {
          clippingContainer.style.height = `${FIXED_HEIGHT - 70}px`;
        }

        // Remove any scaling transforms - content displays at native size
        contentNode.style.transform = "none";
      }
    };

    setFixedDimensions();
    // Note: No window resize listener - dimensions are locked
  }, [generatedContent]);

  // Overflow detection effect
  useEffect(() => {
    const detectOverflow = () => {
      const containerNode = containerRef.current;
      const contentNode = contentRef.current;

      if (containerNode && contentNode && generatedContent) {
        // Get the clipping container within this specific container instance
        const clippingContainer = containerNode.querySelector(
          'div[style*="overflow: hidden"]'
        ) as HTMLElement;
        if (!clippingContainer) {
          return;
        }

        // Use contentNode (which has the ref) instead of document.getElementById
        // This ensures we're working with the correct instance of the resume content
        const resumeContent = contentNode;
        if (!resumeContent) {
          return;
        }

        const clippingHeight = clippingContainer.offsetHeight;

        // Get the actual content div inside resume-content (the one with dangerouslySetInnerHTML)
        const actualContent = resumeContent.querySelector(
          'div[style*="padding: 0"]'
        ) as HTMLElement;
        if (!actualContent) {
          return;
        }

        // Get the natural height of the content - no scaling needed since container is fixed size
        const contentHeight = actualContent.scrollHeight;

        // Check if content height exceeds the available clipping height
        // Since the container is now fixed-size (800px × 1131px) and never scales,
        // we can directly compare the content height with the clipping height
        if (contentHeight > clippingHeight) {
          setIsOverflowing(true);
          // Only show alert if we haven't shown it already for this content
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

    // Run overflow detection after a short delay to ensure layout is complete
    const timer = setTimeout(detectOverflow, 1000);
    return () => clearTimeout(timer);
  }, [generatedContent, onOverflowDetected, hasShownOverflowAlert]);

  useEffect(() => {
    const resumeContent = document.getElementById(instanceId);
    if (!resumeContent) return;

    // Remove any existing color style tag to prevent multiple insertions
    const existingStyle = resumeContent.querySelector("#resume-color-style");
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject a new style tag
    const style = document.createElement("style");
    style.id = "resume-color-style";
    style.innerHTML = `
      #${instanceId} h1,
      #${instanceId} h2,
      #${instanceId} h3,
      #${instanceId} p,
      #${instanceId} li,
      #${instanceId} span {
        color: ${options.colorScheme} !important;
      }
      
      /* Bullet point styling for this instance */
      #${instanceId} ul {
        list-style-type: disc !important;
        margin-left: 1.25rem !important;
        padding-left: 0 !important;
        margin-top: 5px !important;
        line-height: 1.4 !important;
      }
      
      #${instanceId} li {
        margin-bottom: 0.25rem !important;
        font-size: 10pt !important;
        line-height: 1.4 !important;
      }
    `;
    resumeContent.prepend(style);
  }, [generatedContent, options.colorScheme]);

  // Find summary section in the rendered HTML
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

  // Combined effect to attach all edit buttons dynamically
  useEffect(() => {
    const resumeContent = document.getElementById(instanceId);
    if (!resumeContent) return;

    // --- Summary Edit Button ---
    const summaryH2 = Array.from(resumeContent.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("summary")
    );
    if (summaryH2 && summaryH2.parentElement) {
      const summarySectionState = sections.find((s) => s.id === "summary");
      const isVisible = summarySectionState?.visible;

      summaryH2.style.display = isVisible ? "" : "none";
      const summaryContainer =
        summaryH2.nextElementSibling as HTMLElement | null;
      if (summaryContainer) {
        summaryContainer.style.display = isVisible ? "" : "none";
        summaryContainer.style.position = "relative";

        const handleMouseEnter = () => {
          summaryContainer.querySelector(".edit-button-summary")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-summary";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            setEditingSummaryContent(summaryContainer.outerHTML);
            setShowSummaryEdit(true);
          };
          summaryContainer.appendChild(btn);
        };

        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!summaryContainer.matches(":hover")) {
              summaryContainer.querySelector(".edit-button-summary")?.remove();
            }
          }, 300);
        };

        summaryContainer.addEventListener("mouseenter", handleMouseEnter);
        summaryContainer.addEventListener("mouseleave", handleMouseLeave);
      }
    }

    // --- Experience Edit Buttons ---
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

        const handleMouseEnter = () => {
          entry.querySelector(".edit-button-experience")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-experience";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const title = entry.querySelector("h3")?.textContent || "";
            const companyLocation = entry
              .querySelector("p")
              ?.textContent?.split(" - ") || ["", ""];
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
        };
        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!entry.matches(":hover")) {
              entry.querySelector(".edit-button-experience")?.remove();
            }
          }, 300);
        };
        entry.addEventListener("mouseenter", handleMouseEnter);
        entry.addEventListener("mouseleave", handleMouseLeave);
      });
    }

    // --- Education Edit Buttons ---
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
        const handleMouseEnter = () => {
          entry.querySelector(".edit-button-education")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-education";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
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
        };
        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!entry.matches(":hover")) {
              entry.querySelector(".edit-button-education")?.remove();
            }
          }, 300);
        };
        entry.addEventListener("mouseenter", handleMouseEnter);
        entry.addEventListener("mouseleave", handleMouseLeave);
      });
    }

    // --- Skills Edit Button ---
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

        const handleMouseEnter = () => {
          skillsContainer.querySelector(".edit-button-skills")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-skills";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();

            // Try different selectors to extract skills from various formats
            let skillsList: string[] = [];

            // Try spans first
            const spans = Array.from(skillsContainer.querySelectorAll("span"))
              .map((span) => span.textContent?.trim())
              .filter(Boolean) as string[];
            if (spans.length > 0) {
              skillsList = spans;
            } else {
              // Try extracting from paragraph text (comma-separated)
              const paragraphs = Array.from(
                skillsContainer.querySelectorAll("p")
              );
              if (paragraphs.length > 0) {
                const pText = paragraphs[0].textContent?.trim() || "";
                if (pText) {
                  skillsList = pText
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean);
                }
              } else {
                // Try extracting from list items
                const listItems = Array.from(
                  skillsContainer.querySelectorAll("li")
                )
                  .map((li) => li.textContent?.trim())
                  .filter(Boolean) as string[];
                if (listItems.length > 0) {
                  skillsList = listItems;
                } else {
                  // Fallback: get all text content and try to split
                  const allText = skillsContainer.textContent?.trim() || "";
                  if (allText) {
                    skillsList = allText
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean);
                  }
                }
              }
            }

            console.log("Extracted skills:", skillsList);
            setEditingSkills(skillsList);
            setShowSkillsEdit(true);
          };
          skillsContainer.appendChild(btn);
        };

        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!skillsContainer.matches(":hover")) {
              skillsContainer.querySelector(".edit-button-skills")?.remove();
            }
          }, 300);
        };

        skillsContainer.addEventListener("mouseenter", handleMouseEnter);
        skillsContainer.addEventListener("mouseleave", handleMouseLeave);
      }
    }

    // --- Languages Edit Button ---
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

        const handleMouseEnter = () => {
          languagesContainer.querySelector(".edit-button-languages")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-languages";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();

            // Try different selectors to extract languages from various formats
            let languagesList: string[] = [];

            // Try spans first
            const spans = Array.from(
              languagesContainer.querySelectorAll("span")
            )
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

            console.log("Extracted languages:", languagesList);
            setEditingLanguages(languagesList);
            setShowLanguagesEdit(true);
          };
          languagesContainer.appendChild(btn);
        };

        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!languagesContainer.matches(":hover")) {
              languagesContainer
                .querySelector(".edit-button-languages")
                ?.remove();
            }
          }, 300);
        };

        languagesContainer.addEventListener("mouseenter", handleMouseEnter);
        languagesContainer.addEventListener("mouseleave", handleMouseLeave);
      }
    }

    // --- Projects & Achievements Edit Button ---
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

        const handleMouseEnter = () => {
          projectsContainer.querySelector(".edit-button-projects")?.remove();
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "edit-button-projects";
          btn.style.position = "absolute";
          btn.style.top = "8px";
          btn.style.right = "8px";
          btn.style.zIndex = "10";
          btn.style.background = "white";
          btn.style.borderRadius = "8px";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
          btn.style.padding = "6px";
          btn.style.border = "1px solid #e2e8f0";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";
          btn.style.cursor = "pointer";
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M15.232 5.232 18 8l-9 9H6v-3l9-9z"/><path d="M17.207 2.793a2.5 2.5 0 0 1 3.535 3.535l-1.414 1.414a2.5 2.5 0 0 1-3.535-3.535l1.414-1.414z"/></svg>`;
          btn.onclick = (e) => {
            e.stopPropagation();
            setEditingProjectsContent(projectsContainer.outerHTML);
            setShowProjectsEdit(true);
          };
          projectsContainer.appendChild(btn);
        };

        const handleMouseLeave = () => {
          setTimeout(() => {
            if (!projectsContainer.matches(":hover")) {
              projectsContainer
                .querySelector(".edit-button-projects")
                ?.remove();
            }
          }, 300);
        };

        projectsContainer.addEventListener("mouseenter", handleMouseEnter);
        projectsContainer.addEventListener("mouseleave", handleMouseLeave);
      }
    }

    // No specific cleanup needed as dangerouslySetInnerHTML re-renders everything
  }, [filteredContent]);

  const documentTitle = documentType === "resume" ? "Resume" : "Cover Letter";

  const handleDownloadPdf = async () => {
    if (!generatedContent) {
      console.error("No content to download");
      return;
    }

    if (isPdfGenerating) {
      console.log("PDF generation already in progress");
      return;
    }

    setIsPdfGenerating(true);

    try {
      console.log("Starting PDF generation...");

      // Use the already filtered content to match browser display
      logSectionVisibility(sections);
      console.log("Using filtered content that matches browser display");

      // Call the backend PDF generation with filtered content
      const result = await generateResumePdf({
        htmlContent: filteredContent || generatedContent,
        filename: `${documentTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      });

      console.log(
        `PDF generated: ${result.size} bytes, base64 length: ${result.pdfBase64.length}`
      );
      console.log("Base64 type:", typeof result.pdfBase64);
      console.log(
        "Base64 sample (first 50 chars):",
        result.pdfBase64.substring(0, 50)
      );

      // Check if we received actual base64 or something else
      if (typeof result.pdfBase64 !== "string") {
        console.error(
          "Received non-string base64 data:",
          typeof result.pdfBase64
        );
        throw new Error("PDF data is not a string");
      }

      // Convert base64 to blob with error handling
      let byteCharacters;
      try {
        byteCharacters = atob(result.pdfBase64);
        console.log(
          "Base64 decoded successfully, length:",
          byteCharacters.length
        );
      } catch (decodeError) {
        console.error("Failed to decode base64:", decodeError);
        console.error(
          "Base64 preview (first 100 chars):",
          result.pdfBase64.substring(0, 100)
        );
        console.error("Base64 typeof:", typeof result.pdfBase64);

        // Check if it looks like comma-separated numbers (array serialization issue)
        if (result.pdfBase64.includes(",") && /^\d/.test(result.pdfBase64)) {
          console.log(
            "Detected comma-separated bytes, attempting to convert..."
          );

          try {
            // Parse the comma-separated numbers back into a byte array
            const byteArray = result.pdfBase64
              .split(",")
              .map((num) => parseInt(num.trim(), 10));
            console.log("Parsed byte array length:", byteArray.length);

            // Convert byte array directly to Uint8Array for blob creation
            const uint8Array = new Uint8Array(byteArray);
            const blob = new Blob([uint8Array], { type: "application/pdf" });
            console.log("Blob created from byte array, size:", blob.size);

            // Skip the normal base64 decoding and go straight to download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = result.filename;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
              try {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log("Cleanup completed");
              } catch (cleanupError) {
                console.warn("Cleanup error (non-critical):", cleanupError);
              }
            }, 1000);

            console.log("PDF download successful using byte array conversion");

            // Success - exit the function early
            setIsPdfGenerating(false);
            return;
          } catch (byteArrayError) {
            console.error("Failed to convert byte array:", byteArrayError);
          }
        }

        throw new Error("Failed to decode PDF data");
      }

      // Simple and reliable conversion to Uint8Array
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: "application/pdf" });
      console.log("Blob created successfully, size:", blob.size);

      // Create and trigger download with enhanced debugging
      const url = URL.createObjectURL(blob);
      console.log("Object URL created:", url);

      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.style.display = "none";

      console.log("Download link created with filename:", result.filename);

      document.body.appendChild(link);
      console.log("Link added to DOM");

      // Force click with multiple approaches
      try {
        link.click();
        console.log("Download link clicked");
      } catch (clickError) {
        console.error("Click failed, trying manual dispatch:", clickError);
        // Alternative approach
        const event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        link.dispatchEvent(event);
      }

      // Cleanup with slight delay to ensure download starts
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log("Cleanup completed");
        } catch (cleanupError) {
          console.warn("Cleanup error (non-critical):", cleanupError);
        }
      }, 1000); // Increased delay

      console.log(
        `PDF download initiated successfully: ${result.filename} (${result.size} bytes)`
      );
    } catch (error: any) {
      console.error("Failed to download PDF:", error);

      // Enhanced error logging
      if (error?.message) {
        console.error("Error details:", error.message);
      }

      // Could add subtle error indication here in the future
      // For now, just ensure the button becomes available again
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedContent) {
      console.error("No content to copy");
      return;
    }

    try {
      // Create a temporary element to extract text content from HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = filteredContent || generatedContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      await navigator.clipboard.writeText(textContent);

      // You could add a toast notification here in the future
      console.log("Resume content copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);

      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = filteredContent || generatedContent;
        textArea.value = tempDiv.textContent || tempDiv.innerText || "";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        console.log("Resume content copied to clipboard (fallback)");
      } catch (fallbackError) {
        console.error("Fallback copy also failed:", fallbackError);
      }
    }
  };

  const handleSaveChanges = () => {
    onContentChange(editedContent);
    setShowEditModal(false);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
  };

  // Save summary edit and update the parent's state
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

  // Save experience edit and update DOM
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
        // Ensure existing list has proper styling
        isAlreadyList.setAttribute(
          "style",
          "margin-top: 5px; padding-left: 0; margin-left: 1.25rem; line-height: 1.4; list-style-type: disc;"
        );
        const existingListItems = isAlreadyList.querySelectorAll("li");
        existingListItems.forEach((li) => {
          li.setAttribute(
            "style",
            "margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;"
          );
        });
        finalDescriptionHtml = isAlreadyList.outerHTML;
      } else {
        const paragraphs = Array.from(descTempDiv.querySelectorAll("p"));
        if (paragraphs.length > 0) {
          finalDescriptionHtml = `<ul style="margin-top: 5px; padding-left: 0; margin-left: 1.25rem; line-height: 1.4; list-style-type: disc;">${paragraphs
            .map(
              (p) =>
                `<li style="margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;">${p.innerHTML}</li>`
            )
            .join("")}</ul>`;
        } else {
          finalDescriptionHtml = `<ul style="margin-top: 5px; padding-left: 0; margin-left: 1.25rem; line-height: 1.4; list-style-type: disc;"><li style="margin-bottom: 0.25rem; font-size: 10pt; line-height: 1.4;">${editingExperience.description}</li></ul>`;
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
        newLanguagesP.style.lineHeight = "1.4";
        languagesH2.insertAdjacentElement("afterend", newLanguagesP);
      }
    }

    onContentChange(tempDiv.innerHTML);
    // Reset overflow alert state when content is changed
    setHasShownOverflowAlert(false);
    setShowLanguagesEdit(false);
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

  const handleGenerateWorkDescription = async () => {
    if (!editingExperience) return;
    const { title, company, location } = editingExperience;
    const context = `Job Title: ${title}, Employer: ${company}, Location: ${location}`;
    setIsAiLoading({ ...isAiLoading, experience: true });
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        setEditingExperience({
          ...editingExperience,
          description: (editingExperience.description || "") + result.content,
        });
      }
    } catch (error: any) {
      alert("Error generating AI content: " + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, experience: false });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center">
          <button
            onClick={onAdjustCustomizations}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 shadow-sm"
            style={{ marginLeft: "7px" }}
          >
            <Settings size={16} />
            Adjust Customizations
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyToClipboard}
            disabled={!generatedContent}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Copy size={16} />
            Copy
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isOverflowing || isPdfGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPdfGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Download
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg shadow-lg bg-white"
        ref={containerRef}
        style={{ padding: "30px 40px 40px 40px" }}
      >
        {/* Clipping container that defines the exact boundary for content */}
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
            {/* Render the resume HTML */}
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

        {/* Overflow warning message */}
        {isOverflowing && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "40px",
              right: "40px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "8px 12px",
              fontSize: "12px",
              color: "#dc2626",
              textAlign: "center",
              fontWeight: "500",
              zIndex: 10,
            }}
          >
            ⚠️ Text overflow detected - Content exceeds page limits
          </div>
        )}
      </div>

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
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setShowSummaryEdit(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
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
                          <button
                            type="button"
                            onClick={handleGenerateWorkDescription}
                            className="text-sm text-primary hover:underline"
                            disabled={isAiLoading.experience}
                          >
                            {isAiLoading.experience
                              ? "Generating..."
                              : "✨ AI Writer"}
                          </button>
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

      {/* Education Edit Modal */}
      <Transition show={showEducationEdit} as={React.Fragment}>
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-boxdark">
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
    </>
  );
};

export default ResumeDisplay;
