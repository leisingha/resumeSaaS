import React, { useEffect, useRef, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // or 'quill/dist/quill.bubble.css'

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const QuillEditor = ({ value, onChange, readOnly = false }: QuillEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const isInitializedRef = useRef(false);

  const initializeQuill = useCallback(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create a new div for Quill
    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    // Initialize Quill
    quillRef.current = new Quill(editorDiv, {
      theme: 'snow',
      readOnly,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    });

    // Set initial content
    if (value) {
      const delta = quillRef.current.clipboard.convert(value);
      quillRef.current.setContents(delta, 'silent');
    }

    // Handle changes
    quillRef.current.on('text-change', (delta, oldDelta, source) => {
      if (source === 'user') {
        const html = quillRef.current?.root.innerHTML || '';
        onChange(html === '<p><br></p>' ? '' : html);
      }
    });

    isInitializedRef.current = true;
  }, [onChange, readOnly, value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      initializeQuill();
    }, 0);

    return () => {
      clearTimeout(timeout);
      if (quillRef.current) {
        quillRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      isInitializedRef.current = false;
    };
  }, [initializeQuill]);

  // Handle value changes
  useEffect(() => {
    if (quillRef.current && isInitializedRef.current) {
      const currentHtml = quillRef.current.root.innerHTML;
      if (value !== currentHtml) {
        const delta = quillRef.current.clipboard.convert(value);
        quillRef.current.setContents(delta, 'silent');
      }
    }
  }, [value]);

  // Handle readOnly changes
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return <div ref={containerRef} />;
};

export default QuillEditor; 