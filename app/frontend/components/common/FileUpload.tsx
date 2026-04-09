import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection, DropEvent } from 'react-dropzone';

interface FileUploadProps {
  onFileAccepted: (files: File[]) => void;
  promptText?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileAccepted, promptText = 'Drag & drop a file here, or click to select a file' }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[], event: DropEvent) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles);
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white hover:border-slate-400'}
      `}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Preview" className="mx-auto max-h-48 rounded-md" />
           <p className="text-sm text-slate-500 mt-2">Drop another file to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-1 text-sm text-slate-600">{promptText}</p>
            <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
