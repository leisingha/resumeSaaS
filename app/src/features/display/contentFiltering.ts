// Utility functions for filtering resume content based on section visibility

import type { Section } from "../customizer/ManageSectionsPanel";

/**
 * Filters HTML content to hide sections that are marked as not visible
 * This ensures PDF generation matches what the user sees in the browser
 */
export function filterContentBySections(
  htmlContent: string,
  sections: Section[]
): string {
  if (!htmlContent || !sections) {
    return htmlContent;
  }

  // Create a temporary DOM element to parse and manipulate the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  // Helper function to hide an element
  const hideElement = (element: HTMLElement) => {
    element.style.display = "none";
  };

  // Filter Summary Section
  const summarySectionState = sections.find((s) => s.id === "summary");
  if (summarySectionState && !summarySectionState.visible) {
    const summaryH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("summary")
    );
    const summaryP = summaryH2?.nextElementSibling as HTMLElement | null;

    if (summaryH2) hideElement(summaryH2);
    if (summaryP) hideElement(summaryP);
  }

  // Filter Education Section
  const educationSectionState = sections.find((s) => s.id === "education");
  if (educationSectionState && !educationSectionState.visible) {
    const educationH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("education")
    );

    if (educationH2) {
      hideElement(educationH2);

      // Hide all education entries (divs with h3 children)
      if (educationH2.parentElement) {
        const educationEntries = Array.from(
          educationH2.parentElement.children
        ).filter(
          (child) => child.tagName === "DIV" && child.querySelector("h3")
        ) as HTMLElement[];

        educationEntries.forEach((entry) => hideElement(entry));
      }
    }
  }

  // Filter Experience Section
  const experienceSectionState = sections.find((s) => s.id === "experience");
  if (experienceSectionState && !experienceSectionState.visible) {
    const experienceH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("experience")
    );

    if (experienceH2) {
      hideElement(experienceH2);

      // Hide all experience entries (divs with h3 children)
      if (experienceH2.parentElement) {
        const experienceEntries = Array.from(
          experienceH2.parentElement.children
        ).filter(
          (child) => child.tagName === "DIV" && child.querySelector("h3")
        ) as HTMLElement[];

        experienceEntries.forEach((entry) => hideElement(entry));
      }
    }
  }

  // Filter Skills Section
  const skillsSectionState = sections.find((s) => s.id === "skills");
  if (skillsSectionState && !skillsSectionState.visible) {
    const skillsH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("skills")
    );
    const skillsP = skillsH2?.nextElementSibling as HTMLElement | null;

    if (skillsH2) hideElement(skillsH2);
    if (skillsP) hideElement(skillsP);
  }

  // Filter Projects & Achievements Section
  const projectsSectionState = sections.find((s) => s.id === "projects");
  if (projectsSectionState && !projectsSectionState.visible) {
    const projectsH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) =>
        h2.textContent?.toLowerCase().includes("projects") ||
        h2.textContent?.toLowerCase().includes("achievements")
    );
    const projectsDiv = projectsH2?.nextElementSibling as HTMLElement | null;

    if (projectsH2) hideElement(projectsH2);
    if (projectsDiv) hideElement(projectsDiv);
  }

  // Filter Languages Section
  const languagesSectionState = sections.find((s) => s.id === "languages");
  if (languagesSectionState && !languagesSectionState.visible) {
    const languagesH2 = Array.from(tempDiv.getElementsByTagName("h2")).find(
      (h2) => h2.textContent?.toLowerCase().includes("languages")
    );
    const languagesP = languagesH2?.nextElementSibling as HTMLElement | null;

    if (languagesH2) hideElement(languagesH2);
    if (languagesP) hideElement(languagesP);
  }

  // Return the filtered HTML
  return tempDiv.innerHTML;
}

/**
 * Debug function to log which sections are visible/hidden
 */
export function logSectionVisibility(sections: Section[]): void {
  console.log("Section visibility status:");
  sections.forEach((section) => {
    console.log(
      `- ${section.label} (${section.id}): ${
        section.visible ? "visible" : "hidden"
      }`
    );
  });
}
