import React, { useState, useEffect } from "react";
import { useQuery, useAction } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import {
  getUserProfile,
  saveUserProfile,
  generateAiResumePoints,
  getCurrentDailyCredits,
  getLocationSuggestions,
  getSchoolSuggestions,
  getJobTitleSuggestions,
} from "wasp/client/operations";
import { SubscriptionStatus } from "../../payment/plans";
import UploadSection from "../upload/UploadSection";
import SwitcherOne from "../../admin/elements/forms/SwitcherOne";
import { Trash2 } from "lucide-react";
import StyledButton from "../common/StyledButton";

import QuillEditor from "../common/forwarded-quill";

// NOTE: Education and Experience are not yet saved to the backend. This will be implemented in a future step.
// For now, we keep the UI and local state management for them.

const SmallSwitcher = ({
  isOn,
  onChange,
}: {
  isOn: boolean;
  onChange: (value: boolean) => void;
}) => {
  const id = React.useId();
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            id={id}
            type="checkbox"
            className="sr-only"
            checked={isOn}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className="reblock h-5 w-10 rounded-full bg-meta-9 dark:bg-[#5A616B]"></div>
          <div
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white dark:bg-gray-400 transition ${
              isOn ? "translate-x-full !bg-primary dark:!bg-white" : ""
            }`}
          ></div>
        </div>
      </label>
    </div>
  );
};

interface EducationEntry {
  id: string;
  school: string | null;
  fieldOfStudy: string | null;
  graduationDate: string | null;
  gpa: string | null;
}

interface ExperienceEntry {
  id: string;
  employer: string | null;
  jobTitle: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  workDescription: string | null;
}

const ProfileForm = ({
  setProfileProgress,
  onResumeParsed,
  profileData,
  educationEntries,
  experienceEntries,
  languages,
  achievements,
  setProfileData,
  setEducationEntries,
  setExperienceEntries,
  setLanguages,
  setAchievements,
  onShowSuccessAlert,
  onCloseAccordion,
}: {
  setProfileProgress: (progress: number) => void;
  onResumeParsed: (data: any) => void;
  profileData: any;
  educationEntries: any[];
  experienceEntries: any[];
  languages: string[];
  achievements: string;
  setProfileData: (data: any) => void;
  setEducationEntries: (data: any[]) => void;
  setExperienceEntries: (data: any[]) => void;
  setLanguages: (data: string[]) => void;
  setAchievements: (data: string) => void;
  onShowSuccessAlert?: (message: string) => void;
  onCloseAccordion?: () => void;
}) => {
  const { data: user } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } =
    useQuery(getUserProfile);
  const { data: creditData, isLoading: creditsLoading } = useQuery(
    getCurrentDailyCredits
  );
  const generateResumePointsAction = useAction(generateAiResumePoints);
  const getLocationSuggestionsAction = useAction(getLocationSuggestions);
  const getSchoolSuggestionsAction = useAction(getSchoolSuggestions);
  const getJobTitleSuggestionsAction = useAction(getJobTitleSuggestions);
  const [isAiLoading, setIsAiLoading] = useState({
    experience: -1,
    achievements: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{description: string; placeId: string}>>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingLocationSuggestions, setIsLoadingLocationSuggestions] = useState(false);

  // Experience location autocomplete state
  const [experienceLocationSuggestions, setExperienceLocationSuggestions] = useState<Record<number, Array<{description: string; placeId: string}>>>({});
  const [showExperienceLocationSuggestions, setShowExperienceLocationSuggestions] = useState<Record<number, boolean>>({});
  const [isLoadingExperienceLocationSuggestions, setIsLoadingExperienceLocationSuggestions] = useState<Record<number, boolean>>({});

  // Education school autocomplete state
  const [schoolSuggestions, setSchoolSuggestions] = useState<Record<number, Array<{description: string; placeId: string}>>>({});
  const [showSchoolSuggestions, setShowSchoolSuggestions] = useState<Record<number, boolean>>({});
  const [isLoadingSchoolSuggestions, setIsLoadingSchoolSuggestions] = useState<Record<number, boolean>>({});

  // Experience job title autocomplete state
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<Record<number, Array<{description: string; id: string}>>>({});
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState<Record<number, boolean>>({});
  const [isLoadingJobTitleSuggestions, setIsLoadingJobTitleSuggestions] = useState<Record<number, boolean>>({});

  // Check if user has a valid subscription for AI Writer feature
  const hasValidSubscription =
    !!user?.subscriptionStatus &&
    user.subscriptionStatus !== SubscriptionStatus.Deleted &&
    user.subscriptionStatus !== SubscriptionStatus.PastDue;

  // Check if user has access to AI Writer (subscription OR more than 3 credits)
  const totalCredits = creditData?.totalCredits ?? 0;
  const hasAccessToAiWriter = hasValidSubscription || totalCredits > 3;

  // Get appropriate disabled message
  const getAiWriterDisabledReason = () => {
    // Pro users always have access, no credit requirement
    if (hasValidSubscription) {
      return ""; // No disabled reason for Pro users
    }

    // For non-subscribed users
    if (totalCredits <= 3) {
      return "🚀 Upgrade to Pro for unlimited AI Writer access, or purchase more than 3 credits to unlock this feature!";
    }
    if (totalCredits < 1) {
      return "⭐ No credits available. Upgrade to Pro for free AI Writer, or purchase more credits. Daily credits reset tomorrow!";
    }
    return "";
  };
  const [formErrors, setFormErrors] = useState<Partial<typeof profileData>>({});
  const [educationErrors, setEducationErrors] = useState<Array<{school?: string; fieldOfStudy?: string; graduationDate?: string}>>([]);
  const [currentLanguage, setCurrentLanguage] = useState("");

  useEffect(() => {
    if (userProfile && !profileData.firstName) {
      // Only set from query if not already populated
      setProfileData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        email: userProfile.email || "",
      });
      setEducationEntries(
        userProfile.education.length > 0
          ? userProfile.education.map((edu) => ({ ...edu, gpa: edu.gpa || "" }))
          : [
              {
                id: "",
                school: "",
                fieldOfStudy: "",
                graduationDate: "",
                gpa: "",
              },
            ]
      );
      setExperienceEntries(
        userProfile.experience.length > 0
          ? userProfile.experience.map((exp) => ({ ...exp }))
          : [
              {
                id: "",
                employer: "",
                jobTitle: "",
                startDate: "",
                endDate: "",
                location: "",
                workDescription: "",
              },
            ]
      );
      setLanguages(
        (userProfile.languages || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      );
      setAchievements(userProfile.awards || "");
    }
  }, [
    userProfile,
    profileData.firstName,
    setProfileData,
    setEducationEntries,
    setExperienceEntries,
    setLanguages,
    setAchievements,
  ]);

  useEffect(() => {
    const calculateProfileProgress = () => {
      let completed = 0;
      const totalPoints = 10;

      if (profileData.firstName) completed++;
      if (profileData.lastName) completed++;
      if (profileData.phone) completed++;
      if (profileData.location) completed++;
      if (educationEntries.length > 0 && educationEntries[0].school)
        completed++;
      if (educationEntries.length > 0 && educationEntries[0].fieldOfStudy)
        completed++;
      if (experienceEntries.length > 0 && experienceEntries[0].employer)
        completed++;
      if (experienceEntries.length > 0 && experienceEntries[0].jobTitle)
        completed++;
      if (languages.length > 0) completed++;
      if (achievements) completed++;

      return Math.round((completed / totalPoints) * 100);
    };
    setProfileProgress(calculateProfileProgress());
  }, [
    profileData,
    educationEntries,
    experienceEntries,
    languages,
    achievements,
    setProfileProgress,
  ]);

  const handleResumeParsed = (parsedData: any) => {
    setProfileData({
      firstName: parsedData.firstName || "",
      lastName: parsedData.lastName || "",
      phone: parsedData.phone || "",
      location: parsedData.location || "",
      email: profileData.email, // Keep existing email
    });
    setEducationEntries(
      parsedData.education && parsedData.education.length > 0
        ? parsedData.education.map((edu: any) => ({
            ...edu,
            id: Date.now().toString(),
          }))
        : [
            {
              id: Date.now().toString(),
              school: "",
              fieldOfStudy: "",
              graduationDate: "",
              gpa: "",
            },
          ]
    );
    setExperienceEntries(
      parsedData.experience && parsedData.experience.length > 0
        ? parsedData.experience.map((exp: any) => ({
            ...exp,
            id: Date.now().toString() + "_exp",
          }))
        : [
            {
              id: Date.now().toString() + "_exp",
              employer: "",
              jobTitle: "",
              startDate: "",
              endDate: "",
              location: "",
              workDescription: "",
            },
          ]
    );
    setLanguages(
      (parsedData.languages || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s)
    );
    setAchievements(parsedData.awards || "");
  };

  // Debounced location search
  const handleLocationSearch = async (input: string) => {
    if (input.trim().length < 2) return;

    setIsLoadingLocationSuggestions(true);
    try {
      const suggestions = await getLocationSuggestionsAction({ input });
      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocationSuggestions(false);
    }
  };

  // Debounce timer refs
  const locationSearchTimeoutRef = React.useRef<NodeJS.Timeout>();
  const experienceLocationSearchTimeoutRefs = React.useRef<Record<number, NodeJS.Timeout>>({});
  const schoolSearchTimeoutRefs = React.useRef<Record<number, NodeJS.Timeout>>({});
  const jobTitleSearchTimeoutRefs = React.useRef<Record<number, NodeJS.Timeout>>({});

  // Experience location search handler
  const handleExperienceLocationSearch = async (input: string, index: number) => {
    if (input.trim().length < 2) return;

    setIsLoadingExperienceLocationSuggestions(prev => ({ ...prev, [index]: true }));
    try {
      const suggestions = await getLocationSuggestionsAction({ input });
      setExperienceLocationSuggestions(prev => ({ ...prev, [index]: suggestions }));
      setShowExperienceLocationSuggestions(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error fetching experience location suggestions:', error);
      setExperienceLocationSuggestions(prev => ({ ...prev, [index]: [] }));
    } finally {
      setIsLoadingExperienceLocationSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };

  // School search handler
  const handleSchoolSearch = async (input: string, index: number) => {
    if (input.trim().length < 2) return;

    setIsLoadingSchoolSuggestions(prev => ({ ...prev, [index]: true }));
    try {
      const suggestions = await getSchoolSuggestionsAction({ input });
      setSchoolSuggestions(prev => ({ ...prev, [index]: suggestions }));
      setShowSchoolSuggestions(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error fetching school suggestions:', error);
      setSchoolSuggestions(prev => ({ ...prev, [index]: [] }));
    } finally {
      setIsLoadingSchoolSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };

  // Job title search handler
  const handleJobTitleSearch = async (input: string, index: number) => {
    if (input.trim().length < 1) return;

    setIsLoadingJobTitleSuggestions(prev => ({ ...prev, [index]: true }));
    try {
      const suggestions = await getJobTitleSuggestionsAction({ input });
      setJobTitleSuggestions(prev => ({ ...prev, [index]: suggestions }));
      setShowJobTitleSuggestions(prev => ({ ...prev, [index]: true }));
    } catch (error) {
      console.error('Error fetching job title suggestions:', error);
      setJobTitleSuggestions(prev => ({ ...prev, [index]: [] }));
    } finally {
      setIsLoadingJobTitleSuggestions(prev => ({ ...prev, [index]: false }));
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (locationSearchTimeoutRef.current) {
        clearTimeout(locationSearchTimeoutRef.current);
      }
      Object.values(experienceLocationSearchTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(schoolSearchTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(jobTitleSearchTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileData((prev: any) => ({ ...prev, [name]: value }));

    // Handle location autocomplete with debouncing
    if (name === 'location') {
      // Clear existing timeout
      if (locationSearchTimeoutRef.current) {
        clearTimeout(locationSearchTimeoutRef.current);
      }

      if (value.trim().length >= 2) {
        // Set new timeout
        locationSearchTimeoutRef.current = setTimeout(() => {
          handleLocationSearch(value);
        }, 300);
      } else {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      }
    }
  };

  const handleLocationSuggestionClick = (suggestion: {description: string; placeId: string}) => {
    setProfileData((prev: any) => ({ ...prev, location: suggestion.description }));
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  const handleExperienceLocationSuggestionClick = (suggestion: {description: string; placeId: string}, index: number) => {
    const updatedEntries = [...experienceEntries];
    updatedEntries[index] = { ...updatedEntries[index], location: suggestion.description };
    setExperienceEntries(updatedEntries);
    setShowExperienceLocationSuggestions(prev => ({ ...prev, [index]: false }));
    setExperienceLocationSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const handleSchoolSuggestionClick = (suggestion: {description: string; placeId: string}, index: number) => {
    const updatedEntries = [...educationEntries];
    updatedEntries[index] = { ...updatedEntries[index], school: suggestion.description };
    setEducationEntries(updatedEntries);
    setShowSchoolSuggestions(prev => ({ ...prev, [index]: false }));
    setSchoolSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const handleJobTitleSuggestionClick = (suggestion: {description: string; id: string}, index: number) => {
    const updatedEntries = [...experienceEntries];
    updatedEntries[index] = { ...updatedEntries[index], jobTitle: suggestion.description };
    setExperienceEntries(updatedEntries);
    setShowJobTitleSuggestions(prev => ({ ...prev, [index]: false }));
    setJobTitleSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const handleQuillChange = (
    value: string,
    section: "experience" | "achievements",
    index?: number
  ) => {
    if (section === "experience" && index !== undefined) {
      const updatedEntries = [...experienceEntries];
      updatedEntries[index] = {
        ...updatedEntries[index],
        workDescription: value,
      };
      setExperienceEntries(updatedEntries);
    } else if (section === "achievements") {
      setAchievements(value);
    }
  };

  const handleDynamicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: "education" | "experience",
    index: number
  ) => {
    const { name, value } = e.target;
    if (section === "education") {
      const updatedEntries = [...educationEntries];
      updatedEntries[index] = { ...updatedEntries[index], [name]: value };
      setEducationEntries(updatedEntries);

      // Handle education school autocomplete
      if (name === 'school') {
        // Clear existing timeout for this index
        if (schoolSearchTimeoutRefs.current[index]) {
          clearTimeout(schoolSearchTimeoutRefs.current[index]);
        }

        if (value.trim().length >= 2) {
          // Set new timeout for this index
          schoolSearchTimeoutRefs.current[index] = setTimeout(() => {
            handleSchoolSearch(value, index);
          }, 300);
        } else {
          setSchoolSuggestions(prev => ({ ...prev, [index]: [] }));
          setShowSchoolSuggestions(prev => ({ ...prev, [index]: false }));
        }
      }
    } else {
      const updatedEntries = [...experienceEntries];
      updatedEntries[index] = { ...updatedEntries[index], [name]: value };
      setExperienceEntries(updatedEntries);

      // Handle experience location autocomplete
      if (name === 'location') {
        // Clear existing timeout for this index
        if (experienceLocationSearchTimeoutRefs.current[index]) {
          clearTimeout(experienceLocationSearchTimeoutRefs.current[index]);
        }

        if (value.trim().length >= 2) {
          // Set new timeout for this index
          experienceLocationSearchTimeoutRefs.current[index] = setTimeout(() => {
            handleExperienceLocationSearch(value, index);
          }, 300);
        } else {
          setExperienceLocationSuggestions(prev => ({ ...prev, [index]: [] }));
          setShowExperienceLocationSuggestions(prev => ({ ...prev, [index]: false }));
        }
      }

      // Handle experience job title autocomplete
      if (name === 'jobTitle') {
        // Clear existing timeout for this index
        if (jobTitleSearchTimeoutRefs.current[index]) {
          clearTimeout(jobTitleSearchTimeoutRefs.current[index]);
        }

        if (value.trim().length >= 1) {
          // Set new timeout for this index
          jobTitleSearchTimeoutRefs.current[index] = setTimeout(() => {
            handleJobTitleSearch(value, index);
          }, 300);
        } else {
          setJobTitleSuggestions(prev => ({ ...prev, [index]: [] }));
          setShowJobTitleSuggestions(prev => ({ ...prev, [index]: false }));
        }
      }
    }
  };

  const addEducationEntry = () => {
    setEducationEntries([
      ...educationEntries,
      {
        id: Date.now().toString(),
        school: "",
        fieldOfStudy: "",
        graduationDate: "",
        gpa: "",
      },
    ]);
  };

  const removeEducationEntry = (index: number) => {
    setEducationEntries(educationEntries.filter((_, i) => i !== index));

    // Clean up school autocomplete state for this index
    setSchoolSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setShowSchoolSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setIsLoadingSchoolSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    // Clear timeout for this index
    if (schoolSearchTimeoutRefs.current[index]) {
      clearTimeout(schoolSearchTimeoutRefs.current[index]);
      delete schoolSearchTimeoutRefs.current[index];
    }
  };

  const addExperienceEntry = () => {
    setExperienceEntries([
      ...experienceEntries,
      {
        id: Date.now().toString() + "_exp",
        employer: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        location: "",
        workDescription: "",
      },
    ]);
  };

  const removeExperienceEntry = (index: number) => {
    setExperienceEntries(experienceEntries.filter((_, i) => i !== index));

    // Clean up location autocomplete state for this index
    setExperienceLocationSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setShowExperienceLocationSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setIsLoadingExperienceLocationSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    // Clean up job title autocomplete state for this index
    setJobTitleSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setShowJobTitleSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setIsLoadingJobTitleSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });

    // Clear timeouts for this index
    if (experienceLocationSearchTimeoutRefs.current[index]) {
      clearTimeout(experienceLocationSearchTimeoutRefs.current[index]);
      delete experienceLocationSearchTimeoutRefs.current[index];
    }
    if (jobTitleSearchTimeoutRefs.current[index]) {
      clearTimeout(jobTitleSearchTimeoutRefs.current[index]);
      delete jobTitleSearchTimeoutRefs.current[index];
    }
  };

  const handleLanguageInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLanguage();
    }
  };

  const addLanguage = () => {
    const trimmedLanguage = currentLanguage.trim();
    if (trimmedLanguage && !languages.includes(trimmedLanguage)) {
      setLanguages([...languages, trimmedLanguage]);
      setCurrentLanguage("");
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setLanguages(languages.filter((lang) => lang !== langToRemove));
  };

  const validateForm = () => {
    const errors: Partial<typeof profileData> = {};
    if (!profileData.firstName.trim())
      errors.firstName = "First Name is required.";
    if (!profileData.lastName.trim())
      errors.lastName = "Last Name is required.";
    if (!profileData.phone.trim()) errors.phone = "Phone is required.";
    if (!profileData.email.trim()) errors.email = "Email is required."; // Email is auto-filled but good to keep validation

    // Education validation
    const eduErrors: Array<{school?: string; fieldOfStudy?: string; graduationDate?: string}> = [];
    educationEntries.forEach((edu, index) => {
      const eduError: {school?: string; fieldOfStudy?: string; graduationDate?: string} = {};
      if (!edu.school?.trim()) eduError.school = "School is required.";
      if (!edu.fieldOfStudy?.trim()) eduError.fieldOfStudy = "Field of Study is required.";
      if (!edu.graduationDate?.trim()) eduError.graduationDate = "Graduation Date is required.";
      eduErrors[index] = eduError;
    });

    setFormErrors(errors);
    setEducationErrors(eduErrors);

    const hasContactErrors = Object.keys(errors).length > 0;
    const hasEducationErrors = eduErrors.some(eduError => Object.keys(eduError).length > 0);

    return !hasContactErrors && !hasEducationErrors;
  };

  const handleGenerateProjectsAchievements = async () => {
    const educationContext =
      educationEntries
        .map(
          (edu) =>
            `School: ${edu.school || "N/A"}, Field of Study: ${
              edu.fieldOfStudy || "N/A"
            }`
        )
        .join("; ") || "No education history provided.";

    const context = `Based on the following education history, generate 3 bullet points for a 'Projects & Achievements' section of a resume. The points should be creative and relevant to the field of study. Please provide 2 project ideas and 1 potential academic or personal award.

Education History: ${educationContext}`;
    setIsAiLoading({ ...isAiLoading, achievements: true });
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        const newContent = (achievements || "") + result.content;
        setAchievements(newContent);
      }
    } catch (error: any) {
      alert("Error generating AI content: " + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, achievements: false });
    }
  };

  const handleGenerateWorkDescription = async (index: number) => {
    const exp = experienceEntries[index];
    const context = `Employer: ${exp.employer}, Job Title: ${exp.jobTitle}, Location: ${exp.location}`;
    setIsAiLoading({ ...isAiLoading, experience: index });
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        const updatedEntries = [...experienceEntries];
        updatedEntries[index].workDescription =
          (updatedEntries[index].workDescription || "") + result.content;
        setExperienceEntries(updatedEntries);
      }
    } catch (error: any) {
      alert("Error generating AI content: " + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, experience: -1 });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    try {
      await saveUserProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        location: profileData.location,
        education: educationEntries.map(
          ({ id, school, fieldOfStudy, graduationDate, gpa }) => ({
            id,
            school,
            fieldOfStudy,
            graduationDate,
            gpa,
          })
        ),
        experience: experienceEntries.map(
          ({
            id,
            employer,
            jobTitle,
            startDate,
            endDate,
            location,
            workDescription,
          }) => ({
            id,
            employer,
            jobTitle,
            startDate,
            endDate,
            location,
            workDescription,
          })
        ),
        languages: languages.join(", "),
        awards: achievements,
      });
      // Show styled success alert
      if (onShowSuccessAlert) {
        onShowSuccessAlert("Profile Saved Successfully!");
      } else {
        alert("Profile Saved Successfully!");
      }
    } catch (error: any) {
      console.error("Error saving profile: ", error);
      alert("Error saving profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        email: userProfile.email || "",
      });
      setEducationEntries(
        userProfile.education.length > 0
          ? userProfile.education.map((edu) => ({ ...edu, gpa: edu.gpa || "" }))
          : [
              {
                id: "",
                school: "",
                fieldOfStudy: "",
                graduationDate: "",
                gpa: "",
              },
            ]
      );
      setExperienceEntries(
        userProfile.experience.length > 0
          ? userProfile.experience.map((exp) => ({ ...exp }))
          : [
              {
                id: "",
                employer: "",
                jobTitle: "",
                startDate: "",
                endDate: "",
                location: "",
                workDescription: "",
              },
            ]
      );
      setLanguages(
        (userProfile.languages || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      );
      setAchievements(userProfile.awards || "");
    }
    setFormErrors({});
    setEducationErrors([]);

    // Close the accordion after resetting the form
    if (onCloseAccordion) {
      onCloseAccordion();
    }
  };

  const newStandardInputClass =
    "w-full rounded-lg border-[1.5px] border-stroke bg-transparent mobile-break:py-3 mobile-break:px-5 py-2 px-3 mobile-break:text-base text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";
  const newStandardInputWithIconClass =
    "w-full rounded-lg border-[1.5px] border-stroke bg-transparent mobile-break:py-3 mobile-break:pl-12 mobile-break:pr-5 py-2 pl-10 pr-3 mobile-break:text-base text-sm font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary";
  const labelClassName =
    "mb-2.5 block mobile-break:text-base text-sm font-medium text-black dark:text-white";
  const subSectionTitleClassName =
    "text-md font-semibold text-black dark:text-white mb-3 pt-3";

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className="p-1.5 space-y-5.5">
      <div className="grid grid-cols-1 mobile-break:grid-cols-5 gap-6">
        <div className="mobile-break:col-span-3 space-y-5.5">
          <h3 className={subSectionTitleClassName}>
            <span className="text-xl mr-2">🪪</span>Contact Info
          </h3>
          {/* Personal Details */}
          <div className="flex flex-col gap-5.5 mobile-break:flex-row">
            <div className="w-full mobile-break:w-1/2">
              <label className={labelClassName} htmlFor="firstName">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  className={newStandardInputClass}
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.firstName}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full mobile-break:w-1/2">
              <label className={labelClassName} htmlFor="lastName">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Enter your last name"
                  className={newStandardInputClass}
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5.5 mobile-break:flex-row">
            <div className="w-full mobile-break:w-1/2">
              <label className={labelClassName} htmlFor="phone">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  placeholder="Enter your phone number"
                  className={newStandardInputClass}
                  value={profileData.phone}
                  onChange={handleProfileChange}
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full mobile-break:w-1/2">
              <label className={labelClassName} htmlFor="location">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Enter your location"
                  className={newStandardInputClass}
                  value={profileData.location}
                  onChange={handleProfileChange}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) {
                      setShowLocationSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicks
                    setTimeout(() => setShowLocationSuggestions(false), 200);
                  }}
                />

                {/* Location suggestions dropdown */}
                {showLocationSuggestions && (locationSuggestions.length > 0 || isLoadingLocationSuggestions) && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {isLoadingLocationSuggestions ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </div>
                    ) : (
                      locationSuggestions.map((suggestion, index) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                          onClick={() => handleLocationSuggestionClick(suggestion)}
                        >
                          {suggestion.description}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mobile-break:col-span-2">
          <UploadSection onResumeParsed={onResumeParsed} />
        </div>
      </div>
      <div className="grid grid-cols-1 mobile-break:grid-cols-5 gap-6">
        <div className="mobile-break:col-span-3 space-y-5.5">
          {/* Education Section */}
          <h3 className={subSectionTitleClassName}>
            <span className="text-xl mr-2">🎓</span>Education
          </h3>
          {educationEntries.map((edu, index) => (
            <div key={edu.id} className="space-y-4 mb-4 relative">
              {educationEntries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducationEntry(index)}
                  className="absolute top-0 right-0 p-1 text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
              <div className="flex flex-col mobile-break:flex-row gap-4">
                <div className="w-full mobile-break:w-1/2">
                  <label htmlFor={`school-${index}`} className={labelClassName}>
                    School
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id={`school-${index}`}
                      name="school"
                      value={edu.school || ""}
                      onChange={(e) => handleDynamicChange(e, "education", index)}
                      className={newStandardInputClass}
                      placeholder="e.g., University of Example"
                      onFocus={() => {
                        if (schoolSuggestions[index]?.length > 0) {
                          setShowSchoolSuggestions(prev => ({ ...prev, [index]: true }));
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicks
                        setTimeout(() => {
                          setShowSchoolSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                    />

                    {/* School suggestions dropdown */}
                    {showSchoolSuggestions[index] && (schoolSuggestions[index]?.length > 0 || isLoadingSchoolSuggestions[index]) && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {isLoadingSchoolSuggestions[index] ? (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                          </div>
                        ) : (
                          schoolSuggestions[index]?.map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestion.placeId}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleSchoolSuggestionClick(suggestion, index)}
                            >
                              {suggestion.description}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {educationErrors[index]?.school && (
                    <p className="text-sm text-red-500 mt-1">
                      {educationErrors[index].school}
                    </p>
                  )}
                </div>
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`fieldOfStudy-${index}`}
                    className={labelClassName}
                  >
                    Field of Study
                  </label>
                  <input
                    type="text"
                    id={`fieldOfStudy-${index}`}
                    name="fieldOfStudy"
                    value={edu.fieldOfStudy || ""}
                    onChange={(e) => handleDynamicChange(e, "education", index)}
                    className={newStandardInputClass}
                    placeholder="e.g., Computer Science"
                  />
                  {educationErrors[index]?.fieldOfStudy && (
                    <p className="text-sm text-red-500 mt-1">
                      {educationErrors[index].fieldOfStudy}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col mobile-break:flex-row gap-4">
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`graduationDate-${index}`}
                    className={labelClassName}
                  >
                    Graduation Date
                  </label>
                  <input
                    type="text"
                    id={`graduationDate-${index}`}
                    name="graduationDate"
                    value={edu.graduationDate || ""}
                    onChange={(e) => handleDynamicChange(e, "education", index)}
                    className={newStandardInputClass}
                    placeholder="e.g., May 2024"
                  />
                  {educationErrors[index]?.graduationDate && (
                    <p className="text-sm text-red-500 mt-1">
                      {educationErrors[index].graduationDate}
                    </p>
                  )}
                </div>
                <div className="w-full mobile-break:w-1/2">
                  <label htmlFor={`gpa-${index}`} className={labelClassName}>
                    GPA{" "}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    id={`gpa-${index}`}
                    name="gpa"
                    value={edu.gpa || ""}
                    onChange={(e) => handleDynamicChange(e, "education", index)}
                    className={newStandardInputClass}
                    placeholder="e.g., 3.8/4.0"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addEducationEntry}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            + Add Another School
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 mobile-break:grid-cols-5 gap-6">
        <div className="mobile-break:col-span-3 space-y-5.5">
          {/* Work Experience Section */}
          <h3 className={subSectionTitleClassName}>
            <span className="text-xl mr-2">💼</span>Work Experience
          </h3>
          {experienceEntries.map((exp, index) => (
            <div
              key={exp.id}
              className="space-y-4 mb-4 relative border-t border-stroke dark:border-strokedark pt-4 mt-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-black dark:text-white">
                  📎 Work Experience {index + 1}
                </h4>
                {experienceEntries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperienceEntry(index)}
                    className="p-1 text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="flex flex-col mobile-break:flex-row gap-4">
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`employer-${index}`}
                    className={labelClassName}
                  >
                    Employer
                  </label>
                  <input
                    type="text"
                    id={`employer-${index}`}
                    name="employer"
                    value={exp.employer || ""}
                    onChange={(e) =>
                      handleDynamicChange(e, "experience", index)
                    }
                    className={newStandardInputClass}
                    placeholder="e.g., Example Corp"
                  />
                </div>
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`jobTitle-${index}`}
                    className={labelClassName}
                  >
                    Job Title
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id={`jobTitle-${index}`}
                      name="jobTitle"
                      value={exp.jobTitle || ""}
                      onChange={(e) =>
                        handleDynamicChange(e, "experience", index)
                      }
                      className={newStandardInputClass}
                      placeholder="e.g., Software Engineer"
                      onFocus={() => {
                        if (jobTitleSuggestions[index]?.length > 0) {
                          setShowJobTitleSuggestions(prev => ({ ...prev, [index]: true }));
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicks
                        setTimeout(() => {
                          setShowJobTitleSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                    />

                    {/* Job title suggestions dropdown */}
                    {showJobTitleSuggestions[index] && (jobTitleSuggestions[index]?.length > 0 || isLoadingJobTitleSuggestions[index]) && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {isLoadingJobTitleSuggestions[index] ? (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                          </div>
                        ) : (
                          jobTitleSuggestions[index]?.map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleJobTitleSuggestionClick(suggestion, index)}
                            >
                              {suggestion.description}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col mobile-break:flex-row gap-4">
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`startDate-${index}`}
                    className={labelClassName}
                  >
                    Start Date
                  </label>
                  <input
                    type="text"
                    id={`startDate-${index}`}
                    name="startDate"
                    value={exp.startDate || ""}
                    onChange={(e) =>
                      handleDynamicChange(e, "experience", index)
                    }
                    className={newStandardInputClass}
                    placeholder="e.g., June 2024"
                  />
                </div>
                <div className="w-full mobile-break:w-1/2">
                  <label
                    htmlFor={`endDate-${index}`}
                    className={labelClassName}
                  >
                    End Date
                  </label>
                  <input
                    type="text"
                    id={`endDate-${index}`}
                    name="endDate"
                    value={exp.endDate || ""}
                    onChange={(e) =>
                      handleDynamicChange(e, "experience", index)
                    }
                    className={newStandardInputClass}
                    placeholder="e.g., Present"
                  />
                </div>
              </div>
              <div className="flex flex-col mobile-break:flex-row gap-4">
                <div className="w-full">
                  <label
                    htmlFor={`location-${index}`}
                    className={labelClassName}
                  >
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id={`location-${index}`}
                      name="location"
                      value={exp.location || ""}
                      onChange={(e) =>
                        handleDynamicChange(e, "experience", index)
                      }
                      className={newStandardInputClass}
                      placeholder="e.g., City, State"
                      onFocus={() => {
                        if (experienceLocationSuggestions[index]?.length > 0) {
                          setShowExperienceLocationSuggestions(prev => ({ ...prev, [index]: true }));
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicks
                        setTimeout(() => {
                          setShowExperienceLocationSuggestions(prev => ({ ...prev, [index]: false }));
                        }, 200);
                      }}
                    />

                    {/* Experience location suggestions dropdown */}
                    {showExperienceLocationSuggestions[index] && (experienceLocationSuggestions[index]?.length > 0 || isLoadingExperienceLocationSuggestions[index]) && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {isLoadingExperienceLocationSuggestions[index] ? (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            Loading...
                          </div>
                        ) : (
                          experienceLocationSuggestions[index]?.map((suggestion, suggestionIndex) => (
                            <button
                              key={suggestion.placeId}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-black dark:text-white text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                              onClick={() => handleExperienceLocationSuggestionClick(suggestion, index)}
                            >
                              {suggestion.description}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="quill-container">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor={`workDescription-${index}`}
                    className={labelClassName}
                  >
                    Work Description at the Company
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateWorkDescription(index)}
                    className={`text-sm ${
                      hasAccessToAiWriter &&
                      (hasValidSubscription ||
                        (!hasValidSubscription && totalCredits >= 1))
                        ? "text-primary hover:underline cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    disabled={
                      isAiLoading.experience === index ||
                      !hasAccessToAiWriter ||
                      (!hasValidSubscription && totalCredits < 1)
                    }
                    title={
                      hasValidSubscription
                        ? "AI Writer - Generate work description (Pro benefit - no credits required)"
                        : hasAccessToAiWriter
                          ? "AI Writer - Generate work description (1 credit will be consumed)"
                          : getAiWriterDisabledReason()
                    }
                  >
                    {isAiLoading.experience === index
                      ? "Generating..."
                      : "✨ AI Writer"}
                  </button>
                </div>
                <QuillEditor
                  value={exp.workDescription || ""}
                  onChange={(value) =>
                    handleQuillChange(value, "experience", index)
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addExperienceEntry}
            className="text-sm text-primary hover:underline"
          >
            + Add Work Experience
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 mobile-break:grid-cols-5 gap-6">
        <div className="mobile-break:col-span-3 space-y-5.5">
          {/* Achievements Section */}
          <div className="space-y-2">
            <div className="flex items-center">
              <h3 className="text-md font-semibold text-black dark:text-white mr-4">
                <span className="text-xl mr-2">🏆</span>Projects & Achievements
              </h3>
            </div>
            <div className="mt-2.5 quill-container">
              <div className="flex justify-end items-center mb-1">
                <button
                  type="button"
                  onClick={handleGenerateProjectsAchievements}
                  className={`text-sm ${
                    hasAccessToAiWriter &&
                    (hasValidSubscription ||
                      (!hasValidSubscription && totalCredits >= 1))
                      ? "text-primary hover:underline cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={
                    isAiLoading.achievements ||
                    !hasAccessToAiWriter ||
                    (!hasValidSubscription && totalCredits < 1)
                  }
                  title={
                    hasValidSubscription
                      ? "AI Writer - Generate projects & achievements (Pro benefit - no credits required)"
                      : hasAccessToAiWriter
                        ? "AI Writer - Generate projects & achievements (1 credit will be consumed)"
                        : getAiWriterDisabledReason()
                  }
                >
                  {isAiLoading.achievements ? "Generating..." : "✨ AI Writer"}
                </button>
              </div>
              <QuillEditor
                value={achievements}
                onChange={(value) => handleQuillChange(value, "achievements")}
              />
            </div>
          </div>
          {/* Languages Section */}
          <div className="space-y-2">
            <div className="flex items-center">
              <h3 className="text-md font-semibold text-black dark:text-white mr-4">
                <span className="text-xl mr-2">🗣️</span>Languages
              </h3>
            </div>
            <div className="mt-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a language and press Enter"
                  value={currentLanguage}
                  onChange={(e) => setCurrentLanguage(e.target.value)}
                  onKeyDown={handleLanguageInputKeyDown}
                  className={`${newStandardInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={addLanguage}
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
                {languages.map((lang, index) => (
                  <span
                    key={index}
                    className="m-1.5 flex items-center justify-center rounded border-[.5px] border-stroke bg-gray py-1.5 px-2.5 text-sm font-medium dark:border-strokedark dark:bg-white/30"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="ml-2 cursor-pointer hover:text-danger"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-start pt-4">
        <div
          style={{
            width: "100px",
            transform: "scale(0.7)",
            transformOrigin: "left",
          }}
        >
          <StyledButton
            onClick={(e) => {
              e?.preventDefault();
              const formEvent = {
                ...e,
                preventDefault: () => e?.preventDefault(),
                stopPropagation: () => e?.stopPropagation(),
              } as React.FormEvent;
              handleSaveProfile(formEvent);
            }}
            text={isSaving ? "Saving..." : "Save"}
            variant="gradient"
          />
        </div>
        <div
          style={{
            width: "120px",
            transform: "scale(0.7)",
            transformOrigin: "left",
            marginLeft: "-20px",
          }}
        >
          <StyledButton
            onClick={handleCancel}
            text="Cancel"
            variant="secondary"
          />
        </div>
      </div>
    </form>
  );
};

export default ProfileForm;
