import React, { useState, useEffect } from 'react';
import { useQuery, useAction } from 'wasp/client/operations';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getUserProfile, saveUserProfile, generateAiResumePoints } from 'wasp/client/operations';
import UploadSection from '../upload/UploadSection';
// NOTE: Education and Experience are not yet saved to the backend. This will be implemented in a future step.
// For now, we keep the UI and local state management for them.

interface EducationEntry {
  id: string;
  school: string | null;
  fieldOfStudy: string | null;
  graduationDate: string | null;
  location: string | null;
  achievements: string | null;
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

const ProfileForm = () => {
  const { data: userProfile, isLoading: isProfileLoading } = useQuery(getUserProfile);
  const generateResumePointsAction = useAction(generateAiResumePoints);
  const [isAiLoading, setIsAiLoading] = useState({ education: -1, experience: -1 });

  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    email: '', // This will be populated from the query but is not editable
  });
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([
    { id: Date.now().toString(), school: '', fieldOfStudy: '', graduationDate: '', location: '', achievements: '' },
  ]);
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([
    {
      id: Date.now().toString() + '_exp',
      employer: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      location: '',
      workDescription: '',
    },
  ]);
  const [formErrors, setFormErrors] = useState<Partial<typeof profileData>>({});
  
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        email: userProfile.email || '',
      });
      setEducationEntries(userProfile.education.length > 0 ? userProfile.education.map(edu => ({...edu})) : [
        { id: '', school: '', fieldOfStudy: '', graduationDate: '', location: '', achievements: '' },
      ]);
      setExperienceEntries(userProfile.experience.length > 0 ? userProfile.experience.map(exp => ({...exp})) : [
        { id: '', employer: '', jobTitle: '', startDate: '', endDate: '', location: '', workDescription: '' },
      ]);
    }
  }, [userProfile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuillChange = (value: string, section: 'education' | 'experience', index: number) => {
    if (section === 'education') {
      const updatedEntries = [...educationEntries];
      updatedEntries[index] = { ...updatedEntries[index], achievements: value };
      setEducationEntries(updatedEntries);
    } else {
      const updatedEntries = [...experienceEntries];
      updatedEntries[index] = { ...updatedEntries[index], workDescription: value };
      setExperienceEntries(updatedEntries);
    }
  };

  const handleDynamicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: 'education' | 'experience',
    index: number
  ) => {
    const { name, value } = e.target;
    if (section === 'education') {
      const updatedEntries = [...educationEntries];
      updatedEntries[index] = { ...updatedEntries[index], [name]: value };
      setEducationEntries(updatedEntries);
    } else {
      const updatedEntries = [...experienceEntries];
      updatedEntries[index] = { ...updatedEntries[index], [name]: value };
      setExperienceEntries(updatedEntries);
    }
  };

  const addEducationEntry = () => {
    setEducationEntries([
      ...educationEntries,
      { id: Date.now().toString(), school: '', fieldOfStudy: '', graduationDate: '', location: '', achievements: '' },
    ]);
  };

  const removeEducationEntry = (index: number) => {
    setEducationEntries(educationEntries.filter((_, i) => i !== index));
  };

  const addExperienceEntry = () => {
    setExperienceEntries([
      ...experienceEntries,
      {
        id: Date.now().toString() + '_exp',
        employer: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        location: '',
        workDescription: '',
      },
    ]);
  };

  const removeExperienceEntry = (index: number) => {
    setExperienceEntries(experienceEntries.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Partial<typeof profileData> = {};
    if (!profileData.firstName.trim()) errors.firstName = 'First Name is required.';
    if (!profileData.lastName.trim()) errors.lastName = 'Last Name is required.';
    if (!profileData.phone.trim()) errors.phone = 'Phone is required.';
    if (!profileData.email.trim()) errors.email = 'Email is required.'; // Email is auto-filled but good to keep validation
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerateAchievements = async (index: number) => {
    const edu = educationEntries[index];
    const context = `School: ${edu.school}, Field of Study: ${edu.fieldOfStudy}, Location: ${edu.location}`;
    setIsAiLoading({ ...isAiLoading, education: index });
    try {
      const result = await generateResumePointsAction({ context });
      if (result?.content) {
        const updatedEntries = [...educationEntries];
        updatedEntries[index].achievements = (updatedEntries[index].achievements || '') + result.content;
        setEducationEntries(updatedEntries);
      }
    } catch (error: any) {
      alert('Error generating AI content: ' + error.message);
    } finally {
      setIsAiLoading({ ...isAiLoading, education: -1 });
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
        updatedEntries[index].workDescription = (updatedEntries[index].workDescription || '') + result.content;
        setExperienceEntries(updatedEntries);
      }
    } catch (error: any) {
      alert('Error generating AI content: ' + error.message);
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
        education: educationEntries.map(({ id, school, fieldOfStudy, graduationDate, location, achievements }) => ({ id, school, fieldOfStudy, graduationDate, location, achievements })),
        experience: experienceEntries.map(({ id, employer, jobTitle, startDate, endDate, location, workDescription }) => ({ id, employer, jobTitle, startDate, endDate, location, workDescription })),
      });
      // You can add a success alert here
      alert('Profile Saved Successfully!');
    } catch (error: any) {
      console.error('Error saving profile: ', error);
      alert('Error saving profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setProfileData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        email: userProfile.email || '',
      });
      setEducationEntries(userProfile.education.length > 0 ? userProfile.education.map(edu => ({...edu})) : [
        { id: '', school: '', fieldOfStudy: '', graduationDate: '', location: '', achievements: '' },
      ]);
      setExperienceEntries(userProfile.experience.length > 0 ? userProfile.experience.map(exp => ({...exp})) : [
        { id: '', employer: '', jobTitle: '', startDate: '', endDate: '', location: '', workDescription: '' },
      ]);
    }
    setFormErrors({});
  };

  const newStandardInputClass =
    'w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary';
  const newStandardInputWithIconClass =
    'w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 pl-12 pr-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary';
  const labelClassName = 'mb-2.5 block text-sm font-medium text-black dark:text-white';
  const subSectionTitleClassName = 'text-md font-semibold text-black dark:text-white mb-3 pt-3';

  if (isProfileLoading) {
    return (
      <div className='flex justify-center items-center h-40'>
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveProfile} className='p-1.5 space-y-5.5'>
      <div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
        <div className='md:col-span-3 space-y-5.5'>
          <h3 className={subSectionTitleClassName}>Contact Info</h3>
          {/* Personal Details */}
          <div className='flex flex-col gap-5.5 sm:flex-row'>
            <div className='w-full sm:w-1/2'>
              <label className={labelClassName} htmlFor='firstName'>
                First Name
              </label>
              <div className='relative'>
                <input
                  className={newStandardInputClass}
                  type='text'
                  name='firstName'
                  id='firstName'
                  placeholder='First Name'
                  value={profileData.firstName || ''}
                  onChange={handleProfileChange}
                />
                {formErrors.firstName && <p className='text-sm text-red-500 mt-1'>{formErrors.firstName}</p>}
              </div>
            </div>
            <div className='w-full sm:w-1/2'>
              <label className={labelClassName} htmlFor='lastName'>
                Last Name
              </label>
              <input
                className={newStandardInputClass}
                type='text'
                name='lastName'
                id='lastName'
                placeholder='Last Name'
                value={profileData.lastName || ''}
                onChange={handleProfileChange}
              />
              {formErrors.lastName && <p className='text-sm text-red-500 mt-1'>{formErrors.lastName}</p>}
            </div>
          </div>
          <div className='flex flex-col gap-5.5 sm:flex-row'>
            <div className='w-full sm:w-1/2'>
              <label className={labelClassName} htmlFor='emailAddress'>
                Email Address
              </label>
              <div className='relative'>
                <input
                  className={newStandardInputClass}
                  type='email'
                  name='email'
                  id='emailAddress'
                  placeholder='Email Address'
                  value={profileData.email}
                  disabled // Email is from auth and not editable
                />
                {formErrors.email && <p className='text-sm text-red-500 mt-1'>{formErrors.email}</p>}
              </div>
            </div>
            <div className='w-full sm:w-1/2'>
              <label className={labelClassName} htmlFor='phoneNumber'>
                Phone Number
              </label>
              <input
                className={newStandardInputClass}
                type='tel'
                name='phone'
                id='phoneNumber'
                placeholder='Phone Number'
                value={profileData.phone || ''}
                onChange={handleProfileChange}
              />
              {formErrors.phone && <p className='text-sm text-red-500 mt-1'>{formErrors.phone}</p>}
            </div>
          </div>
          <div>
            <label className={labelClassName} htmlFor='location'>
              Location
            </label>
            <div className='relative'>
              <input
                className={newStandardInputClass}
                type='text'
                name='location'
                id='location'
                placeholder='City, Country'
                value={profileData.location || ''}
                onChange={handleProfileChange}
              />
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-md font-medium text-black dark:text-white mb-3">Your Resume</h3>
          <UploadSection />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
        <div className='md:col-span-3 space-y-5.5'>
          {/* Education Section */}
          <h3 className={subSectionTitleClassName}>Education</h3>
          {educationEntries.map((edu, index) => (
            <div key={edu.id} className='space-y-4 mb-4 relative'>
              {educationEntries.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeEducationEntry(index)}
                  className='absolute top-0 right-0 p-1 text-red-500 hover:text-red-700'
                >
                  Remove
                </button>
              )}
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`school-${index}`} className={labelClassName}>
                    School
                  </label>
                  <input
                    type='text'
                    name='school'
                    id={`school-${index}`}
                    value={edu.school || ''}
                    onChange={(e) => handleDynamicChange(e, 'education', index)}
                    className={newStandardInputClass}
                    placeholder='Stark University'
                  />
                </div>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`fieldOfStudy-${index}`} className={labelClassName}>
                    Field of Study
                  </label>
                  <input
                    type='text'
                    name='fieldOfStudy'
                    id={`fieldOfStudy-${index}`}
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => handleDynamicChange(e, 'education', index)}
                    className={newStandardInputClass}
                    placeholder='B.S. in Iron Studies'
                  />
                </div>
              </div>
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`graduationDate-${index}`} className={labelClassName}>
                    Graduation Date
                  </label>
                  <input
                    type='text'
                    name='graduationDate'
                    id={`graduationDate-${index}`}
                    value={edu.graduationDate || ''}
                    onChange={(e) => handleDynamicChange(e, 'education', index)}
                    className={newStandardInputClass}
                    placeholder='May 2010'
                  />
                </div>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`location-${index}`} className={labelClassName}>
                    Location
                  </label>
                  <input
                    type='text'
                    name='location'
                    id={`location-${index}`}
                    value={edu.location || ''}
                    onChange={(e) => handleDynamicChange(e, 'education', index)}
                    className={newStandardInputClass}
                    placeholder='New York, NY'
                  />
                </div>
              </div>
              <div className='quill-container'>
                <div className='flex justify-between items-center'>
                  <label htmlFor={`achievements-${index}`} className={labelClassName}>
                    What are your academic achievements?
                  </label>
                  <button
                    type='button'
                    onClick={() => handleGenerateAchievements(index)}
                    className='text-sm text-primary hover:underline'
                    disabled={isAiLoading.education === index}
                  >
                    {isAiLoading.education === index ? 'Generating...' : '✨ AI Writer'}
                  </button>
                </div>
                <ReactQuill
                  theme='snow'
                  value={edu.achievements || ''}
                  onChange={(value) => handleQuillChange(value, 'education', index)}
                />
              </div>
            </div>
          ))}
          <button type='button' onClick={addEducationEntry} className='text-sm text-primary hover:underline'>
            + Add Education
          </button>
        </div>
        <div className="md:col-span-2">
          <h3 className='text-md font-medium text-black dark:text-white mb-3'>Tips</h3>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            It pays to be picky about the academic accomplishments that you list on your resume. Employers want to see a maximum of three education entries in a resume.* If you have more academic achievements, consider listing them under one of your main education entries.
            <br/><br/>
            Listing your education shows that you meet any necessary prerequisites to employment and allows you to showcase your book smarts if you're a little short on actual experience.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-5 gap-6'>
        <div className='md:col-span-3 space-y-5.5'>
          {/* Work Experience Section */}
          <h3 className={subSectionTitleClassName}>Work Experience</h3>
          {experienceEntries.map((exp, index) => (
            <div key={exp.id} className='space-y-4 mb-4 relative'>
              {experienceEntries.length > 1 && (
                <button
                  type='button'
                  onClick={() => removeExperienceEntry(index)}
                  className='absolute top-0 right-0 p-1 text-red-500 hover:text-red-700'
                >
                  Remove
                </button>
              )}
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`employer-${index}`} className={labelClassName}>
                    Employer
                  </label>
                  <input
                    type='text'
                    name='employer'
                    id={`employer-${index}`}
                    value={exp.employer || ''}
                    onChange={(e) => handleDynamicChange(e, 'experience', index)}
                    className={newStandardInputClass}
                    placeholder='Stark Industries'
                  />
                </div>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`jobTitle-${index}`} className={labelClassName}>
                    Job Title
                  </label>
                  <input
                    type='text'
                    name='jobTitle'
                    id={`jobTitle-${index}`}
                    value={exp.jobTitle || ''}
                    onChange={(e) => handleDynamicChange(e, 'experience', index)}
                    className={newStandardInputClass}
                    placeholder='CEO'
                  />
                </div>
              </div>
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`startDate-${index}`} className={labelClassName}>
                    Start Date
                  </label>
                  <input
                    type='text'
                    name='startDate'
                    id={`startDate-${index}`}
                    value={exp.startDate || ''}
                    onChange={(e) => handleDynamicChange(e, 'experience', index)}
                    className={newStandardInputClass}
                    placeholder='Aug 2008'
                  />
                </div>
                <div className='w-full sm:w-1/2'>
                  <label htmlFor={`endDate-${index}`} className={labelClassName}>
                    End Date
                  </label>
                  <input
                    type='text'
                    name='endDate'
                    id={`endDate-${index}`}
                    value={exp.endDate || ''}
                    onChange={(e) => handleDynamicChange(e, 'experience', index)}
                    className={newStandardInputClass}
                    placeholder='Present'
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`location-${index}`} className={labelClassName}>
                  Location
                </label>
                <input
                  type='text'
                  name='location'
                  id={`location-${index}`}
                  value={exp.location || ''}
                  onChange={(e) => handleDynamicChange(e, 'experience', index)}
                  className={newStandardInputClass}
                  placeholder='New York, NY'
                />
              </div>
              <div className='quill-container'>
                <div className='flex justify-between items-center'>
                  <label htmlFor={`workDescription-${index}`} className={labelClassName}>
                    Work Description at the Company
                  </label>
                  <button
                    type='button'
                    onClick={() => handleGenerateWorkDescription(index)}
                    className='text-sm text-primary hover:underline'
                    disabled={isAiLoading.experience === index}
                  >
                    {isAiLoading.experience === index ? 'Generating...' : '✨ AI Writer'}
                  </button>
                </div>
                <ReactQuill
                  theme='snow'
                  value={exp.workDescription || ''}
                  onChange={(value) => handleQuillChange(value, 'experience', index)}
                />
              </div>
            </div>
          ))}
          <button type='button' onClick={addExperienceEntry} className='text-sm text-primary hover:underline'>
            + Add Work Experience
          </button>
        </div>
        <div className="md:col-span-2">
          <h3 className='text-md font-medium text-black dark:text-white mb-3'>Tips</h3>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Details can differentiate your resume. More than three out of four employers think that descriptions of experience must always be present on a resume*. Show that you create value with your work by listing your responsibilities and quantifiable achievements in the experience section of your resume to help you catch their eye.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className='flex justify-start gap-4.5 pt-4'>
        <button
          type='button'
          onClick={handleCancel}
          className='flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white'
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          className='flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:shadow-1'
          type='submit'
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;