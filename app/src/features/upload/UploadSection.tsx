import React, { useState, useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { useAction } from 'wasp/client/operations';
import { createFile, parseResumeAndPopulateProfile } from 'wasp/client/operations';

const UploadSection = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createFileAction = useAction(createFile);
  const parseResumeAction = useAction(parseResumeAndPopulateProfile);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
    setIsDragging(false);
  }, []);

  const dropzoneOptions = {
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    multiple: false,
    accept: { 
      'application/pdf': ['.pdf']
    }
  };

  // @ts-ignore 
  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone(dropzoneOptions);

  const handleUploadClick = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL and S3 key from backend
      const { s3UploadUrl, s3UploadFields, key } = await createFileAction({
        fileName: selectedFile.name,
        fileType: 'application/pdf' as const,
      });

      // Step 2: Upload to S3
      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', selectedFile);

      const uploadResponse = await fetch(s3UploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Trigger the resume parsing action
      console.log('File upload successful. Triggering resume parsing...');
      await parseResumeAction({ key });
      console.log('Resume parsing action completed.');


      // Step 4: Reset form
      setSelectedFile(null);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + (error.message || 'Something went wrong.'));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancelClick = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const effectiveIsDragActive = isDragActive || isDragging;

  return (
    <div className='rounded-lg border border-stroke dark:border-form-strokedark bg-white dark:bg-boxdark p-5 shadow-default'>
      <div
        {...getRootProps({
          className: `relative mb-5.5 block w-full cursor-pointer appearance-none rounded-lg border-2 border-dashed ${effectiveIsDragActive ? 'border-primary' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 hover:border-primary dark:hover:border-primary transition-all duration-150 ease-in-out p-6 text-center`
        })}
      >
        {/* @ts-ignore - Re-adding to suppress type error for getInputProps spread */}
        <input {...getInputProps()} disabled={isUploading} />
        <div className='flex flex-col items-center justify-center space-y-2'>
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${effectiveIsDragActive ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'} transition-colors duration-150 ease-in-out`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.344 11.097h-1.264" />
            </svg>
          </span>
          {selectedFile ? (
            <p className='text-sm font-medium text-black dark:text-white mt-2'>{selectedFile.name}</p>
          ) : (
            <>
              <p className='text-sm font-medium text-black dark:text-white'>
                <span className='text-primary'>Click to upload</span> or drag and drop
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>PDF only (MAX. 5MB)</p> 
            </>
          )}
          {fileRejections.length > 0 && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">
              File type not accepted. Please upload PDF only.
            </p>
          )}
          {isUploading && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>

      <div className='flex justify-end gap-3 mb-4'>
        <button
          className='flex justify-center rounded-md border border-stroke py-2 px-4 text-sm font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white disabled:opacity-50'
          type='button'
          onClick={handleCancelClick}
          disabled={!selectedFile || isUploading}
        >
          Cancel
        </button>
        <button
          className='flex justify-center rounded-md bg-primary py-2 px-4 text-sm font-medium text-gray hover:bg-opacity-90 disabled:opacity-50'
          type='button'
          onClick={handleUploadClick}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </div>
    </div>
  );
};

export default UploadSection; 