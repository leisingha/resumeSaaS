import React, { useState, useEffect, useRef } from "react";
import type { CustomizationOptions, DocumentType } from "../../AppPage"; // Import the interface
import ModernSlider from "../customization/ModernSlider";

const colorOptions = [
  { name: "black", hex: "#2D3748" },
  { name: "gold", hex: "#B7791F" },
  { name: "teal", hex: "#319795" },
  { name: "blue", hex: "#3B82F6" },
  { name: "purple", hex: "#805AD5" },
  { name: "pink", hex: "#D53F8C" },
];

interface ResumeCustomizerProps {
  options: CustomizationOptions;
  onOptionsChange: (newOptions: CustomizationOptions) => void;
  part: "templateControls" | "detailControls";
  documentType?: DocumentType; // Make optional as it's only for detailControls
  onDocumentTypeChange?: (type: DocumentType) => void; // Make optional
  isResumeGenerated?: boolean;
}

const ResumeCustomizer: React.FC<ResumeCustomizerProps> = ({
  options,
  onOptionsChange,
  part,
  documentType,
  onDocumentTypeChange,
  isResumeGenerated,
}) => {
  const [currentSkill, setCurrentSkill] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>(
    options.keySkills
      ? options.keySkills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      : []
  );
  const [isJobDescriptionVisible, setIsJobDescriptionVisible] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsColorDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onOptionsChange({ ...options, [e.target.name]: e.target.value });
  };

  const handleColorChange = (color: string) => {
    onOptionsChange({ ...options, colorScheme: color });
  };

  const handleToneChange = (value: number) => {
    onOptionsChange({ ...options, tone: value });
  };

  const updateSkillsInOptions = (updatedSkillsList: string[]) => {
    onOptionsChange({ ...options, keySkills: updatedSkillsList.join(", ") });
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSkill(e.target.value);
  };

  const addSkill = () => {
    const trimmedSkill = currentSkill.trim();
    if (trimmedSkill && !skillsList.includes(trimmedSkill)) {
      const newSkillsList = [...skillsList, trimmedSkill];
      setSkillsList(newSkillsList);
      updateSkillsInOptions(newSkillsList);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkillsList = skillsList.filter((skill) => skill !== skillToRemove);
    setSkillsList(newSkillsList);
    updateSkillsInOptions(newSkillsList);
  };

  const handleSkillInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-white dark:bg-boxdark shadow-md p-4 rounded-lg template-break:h-auto h-full template-break:flex-none flex flex-col justify-center relative">
      {part === "templateControls" && (
        <>
          {/* Desktop/Tablet view - show text and colors inline */}
          <div className="mobile-break:block hidden">
            <div className="flex items-center gap-3 text-black dark:text-white ml-4">
              <span className="text-xl">🎨</span>
              <span>Templates</span>
            </div>
            <div className="flex justify-center items-center gap-2 mt-4">
              {colorOptions.map((color) => {
                const isSelected = options.colorScheme === color.hex;
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorChange(color.hex)}
                    title={color.name}
                    disabled={!isResumeGenerated}
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-violet-200 dark:bg-violet-800"
                        : "bg-transparent"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile view - show only icon with dropdown */}
          <div className="mobile-break:hidden block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
              className="flex w-full h-full items-center justify-center text-black dark:text-white transition-all"
              disabled={!isResumeGenerated}
            >
              <span className="text-xl">🎨</span>
            </button>

            {/* Dropdown menu */}
            {isColorDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsColorDropdownOpen(false)}
                />
                {/* Floating Menu Card */}
                <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-white dark:bg-boxdark-2 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl transition-all duration-200 ease-out opacity-100 scale-100">
                  <div className="p-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Choose Template Color
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {colorOptions.map((color) => {
                        const isSelected = options.colorScheme === color.hex;
                        return (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => {
                              handleColorChange(color.hex);
                              setIsColorDropdownOpen(false);
                            }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-150 focus:outline-none ${
                              isSelected
                                ? "bg-gray-100 dark:bg-gray-700"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600"
                              style={{ backgroundColor: color.hex }}
                            >
                              {isSelected && (
                                <svg
                                  className="w-4 h-4 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {part === "detailControls" && (
        <>
          {/* Target Job Title & Skills */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-2.5 block text-black dark:text-white">
                🎯 Target Job Title
              </label>
              <input
                type="text"
                name="targetJobTitle"
                placeholder="e.g., Software Engineer"
                value={options.targetJobTitle}
                onChange={handleInputChange}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2.5 block text-black dark:text-white">
                🔦 Skills to Highlight{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  (optional)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a skill and press Enter"
                  value={currentSkill}
                  onChange={handleSkillInputChange}
                  onKeyDown={handleSkillInputKeyDown}
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={addSkill}
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
                {skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30 dark:text-white"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
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

          {/* Job Description */}
          <div className="mt-4 mb-4.5">
            <button
              type="button"
              className="w-full flex justify-between items-center mb-2.5 text-black dark:text-white"
              onClick={() =>
                setIsJobDescriptionVisible(!isJobDescriptionVisible)
              }
            >
              <div className="flex items-center">
                <span className="font-medium">📝 Job Description</span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  (Recommended)
                </span>
              </div>
              <svg
                className={`transition-transform duration-200 ${
                  isJobDescriptionVisible ? "rotate-180" : ""
                }`}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isJobDescriptionVisible && (
              <textarea
                name="jobDescription"
                rows={6}
                placeholder="Paste the job description here..."
                value={options.jobDescription}
                onChange={handleInputChange}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
              />
            )}
          </div>

          {/* Tone Selection */}
          <div className="mt-4 mb-4.5">
            <ModernSlider value={options.tone} onChange={handleToneChange} />
          </div>
        </>
      )}
    </div>
  );
};

export default ResumeCustomizer;
