import React, { useState } from 'react';

interface EducationEntry {
  id: string; // For key prop
  institution: string;
  degree: string;
  graduationYear: string;
}

interface ExperienceEntry {
  id: string; // For key prop
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface ProfileFormState {
  fullName: string;
  phone: string;
  email: string;
  bio: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
}

const ProfileForm = () => {
  const [formData, setFormData] = useState<ProfileFormState>({
    fullName: 'Devid Jhon',
    phone: '+990 3343 7865',
    email: 'devidjond45@gmail.com',
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque posuere fermentum urna, eu condimentum mauris tempus ut. Donec fermentum blandit aliquet.',
    education: [{ id: Date.now().toString(), institution: '', degree: '', graduationYear: '' }],
    experience: [{ id: Date.now().toString() + '_exp', company: '', role: '', duration: '', description: '' }],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, section?: 'education' | 'experience', index?: number) => {
    const { name, value } = e.target;
    if (section && typeof index === 'number') {
      setFormData(prevState => {
        const updatedSection = [...prevState[section]];
        // @ts-ignore - section is a key of ProfileFormState, and updatedSection[index] will have the correct type
        updatedSection[index] = { ...updatedSection[index], [name]: value }; 
        return { ...prevState, [section]: updatedSection as any }; // Using any to simplify type for dynamic section update
      });
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const addExperienceEntry = () => {
    setFormData(prevState => ({
      ...prevState,
      experience: [
        ...prevState.experience,
        { id: Date.now().toString() + '_exp', company: '', role: '', duration: '', description: '' },
      ],
    }));
  };

  const removeExperienceEntry = (index: number) => {
    setFormData(prevState => ({
      ...prevState,
      experience: prevState.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducationEntry = () => {
    setFormData(prevState => ({
      ...prevState,
      education: [
        ...prevState.education,
        { id: Date.now().toString(), institution: '', degree: '', graduationYear: '' },
      ],
    }));
  };

  const removeEducationEntry = (index: number) => {
    setFormData(prevState => ({
      ...prevState,
      education: prevState.education.filter((_, i) => i !== index),
    }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Profile Form Data:', formData);
    alert('Profile data logged to console. See console for details.');
  };

  const inputClassName = "w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary";
  const inputWithIconClassName = inputClassName + " pl-11.5";
  const labelClassName = "mb-3 block text-sm font-medium text-black dark:text-white";
  const subSectionTitleClassName = "text-md font-semibold text-black dark:text-white mb-3 pt-3";

  return (
    <form onSubmit={handleSubmit} className='p-1.5 space-y-5.5'>
      {/* Personal Details - existing fields */}
      <div className='flex flex-col gap-5.5 sm:flex-row'>
        <div className='w-full sm:w-1/2'>
          <label className={labelClassName} htmlFor='fullName'>Full Name</label>
          <div className='relative'>
            <span className='absolute left-4.5 top-4'><svg className='fill-current' width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><g opacity='0.8'><path fillRule='evenodd' clipRule='evenodd' d='M3.72039 12.887C4.50179 12.1056 5.5616 11.6666 6.66667 11.6666H13.3333C14.4384 11.6666 15.4982 12.1056 16.2796 12.887C17.061 13.6684 17.5 14.7282 17.5 15.8333V17.5C17.5 17.9602 17.1269 18.3333 16.6667 18.3333C16.2064 18.3333 15.8333 17.9602 15.8333 17.5V15.8333C15.8333 15.1703 15.5699 14.5344 15.1011 14.0655C14.6323 13.5967 13.9964 13.3333 13.3333 13.3333H6.66667C6.00363 13.3333 5.36774 13.5967 4.8989 14.0655C4.43006 14.5344 4.16667 15.1703 4.16667 15.8333V17.5C4.16667 17.9602 3.79357 18.3333 3.33333 18.3333C2.8731 18.3333 2.5 17.9602 2.5 17.5V15.8333C2.5 14.7282 2.93899 13.6684 3.72039 12.887Z' fill='currentColor'></path><path fillRule='evenodd' clipRule='evenodd' d='M9.99967 3.33329C8.61896 3.33329 7.49967 4.45258 7.49967 5.83329C7.49967 7.214 8.61896 8.33329 9.99967 8.33329C11.3804 8.33329 12.4997 7.214 12.4997 5.83329C12.4997 4.45258 11.3804 3.33329 9.99967 3.33329ZM5.83301 5.83329C5.83301 3.53211 7.69849 1.66663 9.99967 1.66663C12.3009 1.66663 14.1663 3.53211 14.1663 5.83329C14.1663 8.13448 12.3009 9.99996 9.99967 9.99996C7.69849 9.99996 5.83301 8.13448 5.83301 5.83329Z' fill='currentColor'></path></g></svg></span>
            <input className={inputWithIconClassName} type='text' name='fullName' id='fullName' placeholder='Full Name' value={formData.fullName} onChange={handleChange} />
          </div>
        </div>
        <div className='w-full sm:w-1/2'>
          <label className={labelClassName} htmlFor='phoneNumber'>Phone Number</label>
          <input className={inputClassName} type='tel' name='phone' id='phoneNumber' placeholder='Phone Number' value={formData.phone} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label className={labelClassName} htmlFor='emailAddress'>Email Address</label>
        <div className='relative'>
          <span className='absolute left-4.5 top-4'><svg className='fill-current' width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><g opacity='0.8'><path fillRule='evenodd' clipRule='evenodd' d='M3.33301 4.16667C2.87658 4.16667 2.49967 4.54357 2.49967 5V15C2.49967 15.4564 2.87658 15.8333 3.33301 15.8333H16.6663C17.1228 15.8333 17.4997 15.4564 17.4997 15V5C17.4997 4.54357 17.1228 4.16667 16.6663 4.16667H3.33301ZM0.833008 5C0.833008 3.6231 1.9561 2.5 3.33301 2.5H16.6663C18.0432 2.5 19.1663 3.6231 19.1663 5V15C19.1663 16.3769 18.0432 17.5 16.6663 17.5H3.33301C1.9561 17.5 0.833008 16.3769 0.833008 15V5Z' fill='currentColor'></path><path fillRule='evenodd' clipRule='evenodd' d='M0.983719 4.52215C1.24765 4.1451 1.76726 4.05341 2.1443 4.31734L9.99975 9.81615L17.8552 4.31734C18.2322 4.05341 18.7518 4.1451 19.0158 4.52215C19.2797 4.89919 19.188 5.4188 18.811 5.68272L10.4776 11.5161C10.1907 11.7169 9.80879 11.7169 9.52186 11.5161L1.18853 5.68272C0.811486 5.4188 0.719791 4.89919 0.983719 4.52215Z' fill='currentColor'></path></g></svg></span>
          <input className={inputWithIconClassName} type='email' name='email' id='emailAddress' placeholder='Email Address' value={formData.email} onChange={handleChange} />
        </div>
      </div>
      <div>
        <label className={labelClassName} htmlFor='bio'>BIO</label>
        <div className='relative'>
          <span className='absolute left-4.5 top-4'><svg className='fill-current' width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'><g opacity='0.8' clipPath='url(#clip0_88_10224)'><path fillRule='evenodd' clipRule='evenodd' d='M1.56524 3.23223C2.03408 2.76339 2.66997 2.5 3.33301 2.5H9.16634C9.62658 2.5 9.99967 2.8731 9.99967 3.33333C9.99967 3.79357 9.62658 4.16667 9.16634 4.16667H3.33301C3.11199 4.16667 2.90003 4.25446 2.74375 4.41074C2.58747 4.56702 2.49967 4.77899 2.49967 5V16.6667C2.49967 16.8877 2.58747 17.0996 2.74375 17.2559C2.90003 17.4122 3.11199 17.5 3.33301 17.5H14.9997C15.2207 17.5 15.4326 17.4122 15.5889 17.2559C15.7452 17.0996 15.833 16.8877 15.833 16.6667V10.8333C15.833 10.3731 16.2061 10 16.6663 10C17.1266 10 17.4997 10.3731 17.4997 10.8333V16.6667C17.4997 17.3297 17.2363 17.9656 16.7674 18.4344C16.2986 18.9033 15.6627 19.1667 14.9997 19.1667H3.33301C2.66997 19.1667 2.03408 18.9033 1.56524 18.4344C1.0964 17.9656 0.833008 17.3297 0.833008 16.6667V5C0.833008 4.33696 1.0964 3.70107 1.56524 3.23223Z' fill='currentColor'></path><path fillRule='evenodd' clipRule='evenodd' d='M16.6664 2.39884C16.4185 2.39884 16.1809 2.49729 16.0056 2.67253L8.25216 10.426L7.81167 12.188L9.57365 11.7475L17.3271 3.99402C17.5023 3.81878 17.6008 3.5811 17.6008 3.33328C17.6008 3.08545 17.5023 2.84777 17.3271 2.67253C17.1519 2.49729 16.9142 2.39884 16.6664 2.39884ZM14.8271 1.49402C15.3149 1.00622 15.9765 0.732178 16.6664 0.732178C17.3562 0.732178 18.0178 1.00622 18.5056 1.49402C18.9934 1.98182 19.2675 2.64342 19.2675 3.33328C19.2675 4.02313 18.9934 4.68473 18.5056 5.17253L10.5889 13.0892C10.4821 13.196 10.3483 13.2718 10.2018 13.3084L6.86847 14.1417C6.58449 14.2127 6.28409 14.1295 6.0771 13.9225C5.87012 13.7156 5.78691 13.4151 5.85791 13.1312L6.69124 9.79783C6.72787 9.65131 6.80364 9.51749 6.91044 9.41069L14.8271 1.49402Z' fill='currentColor'></path></g><defs><clipPath id='clip0_88_10224'><rect width='20' height='20' fill='white'></rect></clipPath></defs></svg></span>
          <textarea className={inputWithIconClassName + " h-auto min-h-[120px]"} name='bio' id='bio' rows={6} placeholder='Write your bio here' value={formData.bio} onChange={handleChange}></textarea>
        </div>
      </div>

      {/* Education Section */}
      <h3 className={subSectionTitleClassName}>Education</h3>
      {formData.education.map((edu, index) => (
        <div key={edu.id} className='p-4 border border-gray-200 dark:border-gray-700 rounded-md space-y-4 mb-4 relative'>
          {formData.education.length > 1 && (
            <button type="button" onClick={() => removeEducationEntry(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
              Remove
            </button>
          )}
          <div>
            <label htmlFor={`institution-${index}`} className={labelClassName}>Institution</label>
            <input type='text' name='institution' id={`institution-${index}`} value={edu.institution} onChange={(e) => handleChange(e, 'education', index)} className={inputClassName} placeholder="Stark University"/>
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className="w-full sm:w-1/2">
              <label htmlFor={`degree-${index}`} className={labelClassName}>Degree/Certificate</label>
              <input type='text' name='degree' id={`degree-${index}`} value={edu.degree} onChange={(e) => handleChange(e, 'education', index)} className={inputClassName} placeholder="B.S. in Iron Studies"/>
            </div>
            <div className="w-full sm:w-1/2">
              <label htmlFor={`graduationYear-${index}`} className={labelClassName}>Graduation Year</label>
              <input type='text' name='graduationYear' id={`graduationYear-${index}`} value={edu.graduationYear} onChange={(e) => handleChange(e, 'education', index)} className={inputClassName} placeholder="2010"/>
            </div>
          </div>
        </div>
      ))}
      <button type='button' onClick={addEducationEntry} className='text-sm text-primary hover:underline'>
        + Add Education
      </button>

      {/* Work Experience Section */}
      <h3 className={subSectionTitleClassName}>Work Experience</h3>
      {formData.experience.map((exp, index) => (
        <div key={exp.id} className='p-4 border border-gray-200 dark:border-gray-700 rounded-md space-y-4 mb-4 relative'>
          {formData.experience.length > 1 && (
            <button type="button" onClick={() => removeExperienceEntry(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                Remove
            </button>
          )}
          <div>
            <label htmlFor={`company-${index}`} className={labelClassName}>Company</label>
            <input type='text' name='company' id={`company-${index}`} value={exp.company} onChange={(e) => handleChange(e, 'experience', index)} className={inputClassName} placeholder="Stark Industries"/>
          </div>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className="w-full sm:w-2/3">
              <label htmlFor={`role-${index}`} className={labelClassName}>Role/Title</label>
              <input type='text' name='role' id={`role-${index}`} value={exp.role} onChange={(e) => handleChange(e, 'experience', index)} className={inputClassName} placeholder="CEO"/>
            </div>
            <div className="w-full sm:w-1/3">
              <label htmlFor={`duration-${index}`} className={labelClassName}>Duration</label>
              <input type='text' name='duration' id={`duration-${index}`} value={exp.duration} onChange={(e) => handleChange(e, 'experience', index)} className={inputClassName} placeholder="2008 - Present"/>
            </div>
          </div>
          <div>
            <label htmlFor={`description-${index}`} className={labelClassName}>Description/Responsibilities</label>
            <textarea name='description' id={`description-${index}`} rows={4} value={exp.description} onChange={(e) => handleChange(e, 'experience', index)} className={inputClassName + " h-auto min-h-[100px]"} placeholder="Saving the world, inventing cool tech..."></textarea>
          </div>
        </div>
      ))}
      <button type='button' onClick={addExperienceEntry} className='text-sm text-primary hover:underline'>
        + Add Work Experience
      </button>

      {/* Save Button */}
      <div className='flex justify-end gap-4.5 pt-4'>
        <button
          className='flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white'
          type='button' 
          onClick={() => alert('Cancel action - form reset/previous state not implemented yet.')}
        >
          Cancel
        </button>
        <button
          className='flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:shadow-1'
          type='submit'
        >
          Save Profile
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 