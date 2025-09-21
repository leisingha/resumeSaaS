import React, { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import Footer from "../landing-page/components/Footer";
import SuccessAlert from "../features/common/SuccessAlert";
import { submitResumeService, createResumeFileUpload } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { validateFile } from "../file-upload/fileUploading";

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
  const { data: user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phoneNumber || "",
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
  const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Check for success parameter in URL (from Stripe redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowSuccessAlert(true);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Class names consistent with the app's styling - matching checkbox text size
  const newStandardInputClass =
    "w-full rounded-lg border-[1.5px] border-stroke bg-transparent mobile-break:py-3 mobile-break:px-5 py-2 px-3 mobile-break:text-sm text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
    setIsDragging(false);
  }, []);

  const dropzoneOptions = {
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDragOver: () => setIsDragging(true),
    multiple: false,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone(dropzoneOptions);

  const handleJobTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addJobTitle();
    }
  };

  const handleFileUpload = async (file: File | null) => {

    if (!file) {
      setFormData((prev) => ({ ...prev, resumeFile: null }));
      setUploadedFileKey(null);
      return;
    }

    // Validate file
    const fileValidationError = validateFile(file);
    if (fileValidationError) {
      setFormErrors((prev) => ({
        ...prev,
        resumeFile: fileValidationError.message,
      }));
      return;
    }

    // Clear any previous errors
    if (formErrors.resumeFile) {
      setFormErrors((prev) => ({
        ...prev,
        resumeFile: undefined,
      }));
    }

    // Upload file immediately
    setIsUploading(true);
    try {
      // Create file upload URL
      const { s3UploadUrl, s3UploadFields, key } = await createResumeFileUpload({
        fileType: file.type as any,
        fileName: file.name,
      });

      // Upload to S3
      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([fieldKey, value]) => {
        formData.append(fieldKey, value);
      });
      formData.append('file', file);

      const uploadResponse = await fetch(s3UploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Store the file key for submission
      setUploadedFileKey(key);
      setFormData((prev) => ({ ...prev, resumeFile: file }));

      console.log('File uploaded successfully:', key);
    } catch (error) {
      console.error('File upload error:', error);
      setFormErrors((prev) => ({
        ...prev,
        resumeFile: 'Failed to upload file. Please try again.',
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare form data for submission
      const submissionData = {
        serviceType: formData.serviceType as "review" | "writing",
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        resumeFocusAreas: formData.resumeFocusAreas,
        jobTitles: formData.jobTitles,
        experience: formData.experience,
        additionalInfo: formData.additionalInfo,
        resumeFileKey: uploadedFileKey || undefined,
        resumeFileName: formData.resumeFile?.name,
      };

      // Submit to backend
      const response = await submitResumeService(submissionData);
      console.log("Resume service submission response:", response);

      // Redirect to Stripe checkout
      if (response.checkoutUrl) {
        console.log("Redirecting to Stripe checkout:", response.checkoutUrl);
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
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
                <div className="flex flex-col gap-3 md:flex-row md:gap-4">
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
                      <ul className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                        <li>• Tips to help your resume pass applicant tracking systems (ATS)</li>
                        <li>• Recommended sentences to include in your work experience</li>
                        <li>• Personalized suggestions to improve your format and layout</li>
                      </ul>
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
                        Resume Creation - $100 CAD
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                        <li>• A professionally rewritten resume highlighting your strengths</li>
                        <li>• An optimized layout designed to pass applicant tracking systems</li>
                        <li>• 1 round of follow-up edits to tailor your resume for success</li>
                      </ul>
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
                <label className={labelClassName}>
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

                {/* Drag and Drop Upload Section */}
                <div className="rounded-lg border border-stroke dark:border-form-strokedark bg-white dark:bg-boxdark p-5 shadow-default">
                  <div
                    {...getRootProps({
                      className: `relative mb-5.5 block w-full cursor-pointer appearance-none rounded-lg border-2 border-dashed ${
                        isDragActive || isDragging
                          ? "border-primary"
                          : "border-gray-300 dark:border-gray-600"
                      } bg-gray-50 dark:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all duration-150 ease-in-out p-6 text-center`,
                    })}
                  >
                    <input {...getInputProps()} disabled={isSubmitting || isUploading} />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          isDragActive || isDragging
                            ? "bg-primary text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        } transition-colors duration-150 ease-in-out`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 11.097h-1.264"
                          />
                        </svg>
                      </span>
                      {formData.resumeFile ? (
                        <p className="text-sm font-medium text-black dark:text-white mt-2">
                          {formData.resumeFile.name}
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-black dark:text-white">
                            <span className="text-primary">Click to upload</span> or drag
                            and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX only (MAX. 10MB)
                          </p>
                        </>
                      )}
                      {fileRejections.length > 0 && (
                        <p className="mt-2 text-xs text-red-500 dark:text-red-400">
                          File type not accepted. Please upload PDF, DOC, or DOCX only.
                        </p>
                      )}
                      {isUploading && (
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: "100%" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.resumeFile && !isUploading && (
                    <div className="flex justify-end gap-3 mb-4">
                      <button
                        className="flex justify-center rounded-md border border-stroke py-2 px-4 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white disabled:opacity-50"
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, resumeFile: null }));
                          setUploadedFileKey(null);
                          if (formErrors.resumeFile) {
                            setFormErrors((prev) => ({
                              ...prev,
                              resumeFile: undefined,
                            }));
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Uploading file...
                  </p>
                )}
                {formData.resumeFile && !isUploading && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ✓ {formData.resumeFile.name} uploaded successfully
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
