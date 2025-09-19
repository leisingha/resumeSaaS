import React, { useState } from "react";
import toast from "react-hot-toast";
import Footer from "../landing-page/components/Footer";
import SuccessAlert from "../features/common/SuccessAlert";

// Styled radio button component matching template design
const StyledRadioButton = ({
  id,
  name,
  value,
  checked,
  onChange,
  children,
  disabled = false,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <label
      className={`relative flex items-center gap-4 p-6 w-full cursor-pointer rounded-xl transition-all duration-300 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${
        checked
          ? "bg-transparent border-3 shadow-lg transform scale-[1.02]"
          : "bg-transparent border-0"
      }`}
      style={{
        borderColor: checked ? "#fbca1f" : "transparent",
        borderWidth: checked ? "3px" : "0px",
        backgroundColor: !checked && isHovered ? "#374151" : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div
          className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
            checked
              ? "border-yellow-400 bg-yellow-400"
              : "border-gray-400 bg-transparent"
          }`}
        >
          {checked && (
            <div className="w-2 h-2 rounded-full bg-white dark:bg-boxdark-2 transition-all duration-200" />
          )}
        </div>
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="absolute opacity-0 w-full h-full cursor-pointer"
        />
      </div>
      <div
        className={`flex-1 ${
          checked ? "text-white" : "text-black dark:text-white"
        }`}
      >
        {children}
      </div>
    </label>
  );
};

interface FormData {
  serviceType: "review" | "writing" | "";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeFocusAreas: string[];
  jobTitles: string[];
  experience: string;
  additionalInfo: string;
  resumeFile: File | null;
}

interface FormErrors {
  serviceType?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  resumeFocusAreas?: string;
  jobTitles?: string;
  experience?: string;
  resumeFile?: string;
}

export default function ResumeServicePage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    serviceType: "",
    resumeFocusAreas: [],
    jobTitles: [],
    experience: "",
    additionalInfo: "",
    resumeFile: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [currentJobTitle, setCurrentJobTitle] = useState("");

  // Class names consistent with the app's styling - matching checkbox text size
  const newStandardInputClass =
    "w-full rounded-lg border-[1.5px] border-stroke bg-transparent mobile-break:py-3 mobile-break:px-5 py-2 px-3 mobile-break:text-base text-base font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";

  const labelClassName =
    "mb-2.5 block mobile-break:text-base text-base font-medium text-black dark:text-white";

  const resumeFocusOptions = [
    "Making my resume content stand out to employers",
    "Addressing concerns about my work history",
    "Highlighting my skills",
    "Making my resume format stand out to employers",
    "Proofreading my resume for typos",
    "Shortening my resume",
    "Explaining my job responsibilities",
    "Matching job requirements for particular roles",
  ];

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (!formData.serviceType) {
      errors.serviceType = "Please select a service type";
    }

    if (formData.resumeFocusAreas.length === 0) {
      errors.resumeFocusAreas = "Please select at least one focus area";
    }

    if (formData.resumeFocusAreas.length > 3) {
      errors.resumeFocusAreas = "Please select up to 3 focus areas";
    }

    if (formData.jobTitles.length === 0) {
      errors.jobTitles = "Please enter at least one job title";
    }

    if (formData.serviceType === "review" && !formData.resumeFile) {
      errors.resumeFile = "Please upload your resume for review service";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleServiceTypeChange = (serviceType: "review" | "writing") => {
    setFormData((prev: FormData) => ({
      ...prev,
      serviceType,
    }));

    if (formErrors.serviceType) {
      setFormErrors((prev) => ({
        ...prev,
        serviceType: undefined,
      }));
    }
  };

  const handleFocusAreaChange = (option: string, checked: boolean) => {
    setFormData((prev: FormData) => {
      const newFocusAreas = checked
        ? [...prev.resumeFocusAreas, option]
        : prev.resumeFocusAreas.filter((area: string) => area !== option);

      return {
        ...prev,
        resumeFocusAreas: newFocusAreas.slice(0, 3), // Limit to 3 selections
      };
    });

    if (formErrors.resumeFocusAreas) {
      setFormErrors((prev) => ({
        ...prev,
        resumeFocusAreas: undefined,
      }));
    }
  };

  const addJobTitle = () => {
    if (currentJobTitle.trim() && formData.jobTitles.length < 3) {
      if (!formData.jobTitles.includes(currentJobTitle.trim())) {
        setFormData((prev: FormData) => ({
          ...prev,
          jobTitles: [...prev.jobTitles, currentJobTitle.trim()],
        }));
      }
      setCurrentJobTitle("");

      if (formErrors.jobTitles) {
        setFormErrors((prev) => ({
          ...prev,
          jobTitles: undefined,
        }));
      }
    }
  };

  const removeJobTitle = (titleToRemove: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      jobTitles: prev.jobTitles.filter(
        (title: string) => title !== titleToRemove
      ),
    }));
  };

  const handleJobTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addJobTitle();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      resumeFile: file,
    }));

    if (formErrors.resumeFile) {
      setFormErrors((prev) => ({
        ...prev,
        resumeFile: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement resume service submission logic
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success alert
      setShowSuccessAlert(true);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        serviceType: "",
        resumeFocusAreas: [],
        jobTitles: [],
        experience: "",
        additionalInfo: "",
        resumeFile: null,
      });

      // Reset file input
      const fileInput = document.getElementById(
        "resumeFile"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      console.error("Error submitting resume service request:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getServicePrice = () => {
    return formData.serviceType === "review" ? "$50 CAD" : "$100 CAD";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-boxdark-2 py-12">
      {/* Success Alert */}
      {showSuccessAlert && (
        <SuccessAlert
          message="Thank you for your resume service request!"
          details="We'll review your information and get back to you within 24 hours."
          onClose={() => setShowSuccessAlert(false)}
        />
      )}

      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Resume Services
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get professional help with your resume from our expert team.
          </p>
        </div>

        {/* Resume Service Form */}
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg">
            <form onSubmit={handleSubmit} className="p-6.5">
              {/* Service Type Selection */}
              <div className="mb-6">
                <label className={labelClassName}>
                  Select Service Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <StyledRadioButton
                    id="review"
                    name="serviceType"
                    value="review"
                    checked={formData.serviceType === "review"}
                    onChange={() => handleServiceTypeChange("review")}
                  >
                    <div>
                      <div className="font-bold text-lg text-black dark:text-white">
                        Resume Review - $50 CAD
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Expert review of your existing resume with detailed
                        feedback and improvement suggestions.
                      </div>
                    </div>
                  </StyledRadioButton>

                  <StyledRadioButton
                    id="writing"
                    name="serviceType"
                    value="writing"
                    checked={formData.serviceType === "writing"}
                    onChange={() => handleServiceTypeChange("writing")}
                  >
                    <div>
                      <div className="font-bold text-lg text-black dark:text-white">
                        Resume Writing Service - $100 CAD
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Complete professional rewrite of your resume to maximize
                        your job application success.
                      </div>
                    </div>
                  </StyledRadioButton>
                </div>
                {formErrors.serviceType && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.serviceType}
                  </p>
                )}
              </div>

              {/* Name Fields */}
              <div className="mb-4.5 flex flex-col gap-6 mobile-break:flex-row">
                <div className="w-full mobile-break:w-1/2">
                  <label className={labelClassName} htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Enter your first name"
                    className={newStandardInputClass}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="w-full mobile-break:w-1/2">
                  <label className={labelClassName} htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Enter your last name"
                    className={newStandardInputClass}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mb-4.5">
                <label className={labelClassName} htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  className={newStandardInputClass}
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Resume Focus Areas */}
              <div className="mb-4.5">
                <label className={labelClassName}>
                  What would you like your resume expert to focus on most?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-3">
                  Please select up to 3.
                </p>
                <div className="space-y-3">
                  {resumeFocusOptions.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        id={option}
                        checked={formData.resumeFocusAreas.includes(option)}
                        onChange={(e) =>
                          handleFocusAreaChange(option, e.target.checked)
                        }
                        disabled={
                          isSubmitting ||
                          (formData.resumeFocusAreas.length >= 3 &&
                            !formData.resumeFocusAreas.includes(option))
                        }
                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded transition-all"
                      />
                      <label
                        htmlFor={option}
                        className="ml-3 text-base text-black dark:text-white cursor-pointer"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
                {formErrors.resumeFocusAreas && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.resumeFocusAreas}
                  </p>
                )}
              </div>

              {/* Job Titles */}
              <div className="mb-4.5">
                <label className={labelClassName}>
                  What position(s) are you applying for?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-2">
                  Enter up to 3 job titles.
                </p>

                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Add a job title and press Enter"
                      className={`${newStandardInputClass} pr-12`}
                      value={currentJobTitle}
                      onChange={(e) => setCurrentJobTitle(e.target.value)}
                      onKeyPress={handleJobTitleKeyPress}
                      disabled={isSubmitting || formData.jobTitles.length >= 3}
                    />
                    <button
                      type="button"
                      onClick={addJobTitle}
                      disabled={
                        !currentJobTitle.trim() ||
                        formData.jobTitles.length >= 3 ||
                        isSubmitting ||
                        formData.jobTitles.includes(currentJobTitle.trim())
                      }
                      className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md transition-opacity duration-200 ${
                        currentJobTitle.trim()
                          ? "opacity-100 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                          : "opacity-0 pointer-events-none"
                      }`}
                      aria-label="Add job title"
                    >
                      <span className="text-gray-600 dark:text-gray-300 text-xl">
                        +
                      </span>
                    </button>
                  </div>
                </div>

                {formData.jobTitles.length > 0 && (
                  <div className="flex flex-wrap items-center mt-2">
                    {formData.jobTitles.map((title, index) => (
                      <span
                        key={index}
                        className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray mobile-break:py-1.5 mobile-break:px-2.5 py-1 px-2 mobile-break:text-sm text-xs font-medium dark:border-strokedark dark:bg-white/30 dark:text-white"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => removeJobTitle(title)}
                          disabled={isSubmitting}
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
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {formErrors.jobTitles && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.jobTitles}
                  </p>
                )}
              </div>

              {/* Resume Upload */}
              <div className="mb-4.5">
                <label className={labelClassName} htmlFor="resumeFile">
                  Upload Your Resume{" "}
                  {formData.serviceType === "review" && (
                    <span className="text-red-500">*</span>
                  )}
                  {formData.serviceType === "writing" && (
                    <span className="text-gray-500">(optional)</span>
                  )}
                </label>
                {formData.serviceType === "writing" && (
                  <p className="text-base text-gray-600 dark:text-gray-300 mb-2">
                    Upload your current resume if you'd like us to use it as a
                    reference, or leave blank for a fresh start.
                  </p>
                )}
                <input
                  type="file"
                  id="resumeFile"
                  name="resumeFile"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className={`${newStandardInputClass} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Accepted formats: PDF, DOC, DOCX (Max 10MB)
                </p>
                {formData.resumeFile && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ {formData.resumeFile.name} uploaded
                  </p>
                )}
                {formErrors.resumeFile && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.resumeFile}
                  </p>
                )}
              </div>

              {/* Additional Information */}
              <div className="mb-6">
                <label className={labelClassName} htmlFor="additionalInfo">
                  Is there anything else you'd like us to know? (optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows={4}
                  placeholder="Any specific questions, concerns, or additional context you'd like our resume expert to address..."
                  className={newStandardInputClass}
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.additionalInfo.length} / 500
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md text-white py-3 px-6 transition-all duration-150 hover:transform hover:-translate-x-1 hover:-translate-y-1 active:transform active:translate-x-1 active:translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
                style={{
                  background: "#1A222C",
                  fontWeight: 900,
                  fontSize: "18px",
                  border: "3px solid #fbca1f",
                  borderRadius: "0.4em",
                  boxShadow: isSubmitting
                    ? "0.1em 0.1em #fbca1f"
                    : "0.1em 0.1em #fbca1f",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0.1em 0.1em #fbca1f";
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.05em 0.05em #fbca1f";
                  }
                }}
                onMouseUp={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.boxShadow = "0.15em 0.15em #fbca1f";
                  }
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  `Request Service ${
                    formData.serviceType ? `- ${getServicePrice()}` : ""
                  }`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
