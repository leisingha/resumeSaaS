import React, { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getUserProfile, saveUserProfile } from 'wasp/client/operations';
// NOTE: Education and Experience are not yet saved to the backend. This will be implemented in a future step.
// For now, we keep the UI and local state management for them.

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  graduationYear: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

const ProfileForm = () => {
  const { data: userProfile, isLoading: isProfileLoading } = useQuery(getUserProfile);

  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    email: '', // This will be populated from the query but is not editable
    professionalSummary: '',
  });
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([
    { id: Date.now().toString(), institution: '', degree: '', graduationYear: '' },
  ]);
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([
    { id: Date.now().toString() + '_exp', company: '', role: '', duration: '', description: '' },
  ]);
  const [formErrors, setFormErrors] = useState<Partial<typeof profileData>>({});
  
  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        professionalSummary: userProfile.professionalSummary || '',
      });
      setEducationEntries(userProfile.education.length > 0 ? userProfile.education : [
        { id: '', institution: '', degree: '', graduationYear: '' },
      ]);
      setExperienceEntries(userProfile.experience.length > 0 ? userProfile.experience : [
        { id: '', company: '', role: '', duration: '', description: '' },
      ]);
    }
  }, [userProfile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
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
      { id: Date.now().toString(), institution: '', degree: '', graduationYear: '' },
    ]);
  };

  const removeEducationEntry = (index: number) => {
    setEducationEntries(educationEntries.filter((_, i) => i !== index));
  };

  const addExperienceEntry = () => {
    setExperienceEntries([
      ...experienceEntries,
      { id: Date.now().toString() + '_exp', company: '', role: '', duration: '', description: '' },
    ]);
  };

  const removeExperienceEntry = (index: number) => {
    setExperienceEntries(experienceEntries.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: Partial<typeof profileData> = {};
    if (!profileData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!profileData.phone.trim()) errors.phone = 'Phone is required.';
    if (!profileData.email.trim()) errors.email = 'Email is required.'; // Email is auto-filled but good to keep validation
    if (!profileData.professionalSummary.trim()) errors.professionalSummary = 'Professional Summary is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    try {
      await saveUserProfile({
        fullName: profileData.fullName,
        phone: profileData.phone,
        professionalSummary: profileData.professionalSummary,
        education: educationEntries.map(({ id, institution, degree, graduationYear }) => ({ id, institution, degree, graduationYear })),
        experience: experienceEntries.map(({ id, company, role, duration, description }) => ({ id, company, role, duration, description })),
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
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        email: userProfile.email || '',
        professionalSummary: userProfile.professionalSummary || '',
      });
      setEducationEntries(userProfile.education.length > 0 ? userProfile.education : [
        { id: '', institution: '', degree: '', graduationYear: '' },
      ]);
      setExperienceEntries(userProfile.experience.length > 0 ? userProfile.experience : [
        { id: '', company: '', role: '', duration: '', description: '' },
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
      {/* Personal Details */}
      <div className='flex flex-col gap-5.5 sm:flex-row'>
        <div className='w-full sm:w-1/2'>
          <label className={labelClassName} htmlFor='fullName'>
            Full Name
          </label>
          <div className='relative'>
            <input
              className={newStandardInputClass}
              type='text'
              name='fullName'
              id='fullName'
              placeholder='Full Name'
              value={profileData.fullName}
              onChange={handleProfileChange}
            />
            {formErrors.fullName && <p className='text-sm text-red-500 mt-1'>{formErrors.fullName}</p>}
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
            value={profileData.phone}
            onChange={handleProfileChange}
          />
          {formErrors.phone && <p className='text-sm text-red-500 mt-1'>{formErrors.phone}</p>}
        </div>
      </div>
      <div>
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
      <div>
        <label className={labelClassName} htmlFor='professionalSummary'>
          Professional Summary
        </label>
        <div className='relative'>
          <textarea
            className={newStandardInputClass + ' min-h-[120px]'}
            name='professionalSummary'
            id='professionalSummary'
            rows={6}
            placeholder='Write your professional summary here'
            value={profileData.professionalSummary}
            onChange={handleProfileChange}
          ></textarea>
          {formErrors.professionalSummary && <p className='text-sm text-red-500 mt-1'>{formErrors.professionalSummary}</p>}
        </div>
      </div>

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
          <div>
            <label htmlFor={`institution-${index}`} className={labelClassName}>
              Institution
            </label>
            <input
              type='text'
              name='institution'
              id={`institution-${index}`}
              value={edu.institution}
              onChange={(e) => handleDynamicChange(e, 'education', index)}
              className={newStandardInputClass}
              placeholder='Stark University'
            />
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='w-full sm:w-1/2'>
              <label htmlFor={`degree-${index}`} className={labelClassName}>
                Degree/Certificate
              </label>
              <input
                type='text'
                name='degree'
                id={`degree-${index}`}
                value={edu.degree}
                onChange={(e) => handleDynamicChange(e, 'education', index)}
                className={newStandardInputClass}
                placeholder='B.S. in Iron Studies'
              />
            </div>
            <div className='w-full sm:w-1/2'>
              <label htmlFor={`graduationYear-${index}`} className={labelClassName}>
                Graduation Year
              </label>
              <input
                type='text'
                name='graduationYear'
                id={`graduationYear-${index}`}
                value={edu.graduationYear}
                onChange={(e) => handleDynamicChange(e, 'education', index)}
                className={newStandardInputClass}
                placeholder='2010'
              />
            </div>
          </div>
        </div>
      ))}
      <button type='button' onClick={addEducationEntry} className='text-sm text-primary hover:underline'>
        + Add Education
      </button>

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
          <div>
            <label htmlFor={`company-${index}`} className={labelClassName}>
              Company
            </label>
            <input
              type='text'
              name='company'
              id={`company-${index}`}
              value={exp.company}
              onChange={(e) => handleDynamicChange(e, 'experience', index)}
              className={newStandardInputClass}
              placeholder='Stark Industries'
            />
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='w-full sm:w-2/3'>
              <label htmlFor={`role-${index}`} className={labelClassName}>
                Role/Title
              </label>
              <input
                type='text'
                name='role'
                id={`role-${index}`}
                value={exp.role}
                onChange={(e) => handleDynamicChange(e, 'experience', index)}
                className={newStandardInputClass}
                placeholder='CEO'
              />
            </div>
            <div className='w-full sm:w-1/3'>
              <label htmlFor={`duration-${index}`} className={labelClassName}>
                Duration
              </label>
              <input
                type='text'
                name='duration'
                id={`duration-${index}`}
                value={exp.duration}
                onChange={(e) => handleDynamicChange(e, 'experience', index)}
                className={newStandardInputClass}
                placeholder='2008 - Present'
              />
            </div>
          </div>
          <div>
            <label htmlFor={`description-${index}`} className={labelClassName}>
              Description/Responsibilities
            </label>
            <textarea
              name='description'
              id={`description-${index}`}
              rows={4}
              value={exp.description}
              onChange={(e) => handleDynamicChange(e, 'experience', index)}
              className={newStandardInputClass + ' min-h-[100px]'}
              placeholder='Saving the world, inventing cool tech...'
            ></textarea>
          </div>
        </div>
      ))}
      <button type='button' onClick={addExperienceEntry} className='text-sm text-primary hover:underline'>
        + Add Work Experience
      </button>

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