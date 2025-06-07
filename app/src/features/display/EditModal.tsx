import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import './QuillEditorStyles.css'; // Custom styles for dark mode

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent: string;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, initialContent }) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as='div' className='relative z-50' onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black bg-opacity-50' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4 text-center'>
            <Transition.Child
              as={React.Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel className='w-full max-w-4xl transform rounded-2xl bg-white dark:bg-boxdark p-6 text-left align-middle shadow-xl transition-all'>
                <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900 dark:text-white'>
                  Edit Document
                </Dialog.Title>
                <div className='mt-4 quill-container'>
                  <ReactQuill theme='bubble' value={content} onChange={setContent} />
                </div>

                <div className='mt-6 flex justify-end gap-4'>
                  <button
                    type='button'
                    className='inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type='button'
                    className='inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
                    onClick={handleSave}
                  >
                    Save Changes
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditModal; 