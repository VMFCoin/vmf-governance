'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
  error?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeInMB = 10,
  className,
  error,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ FIX 1: Stable callback to prevent infinite re-renders
  const notifyParent = useCallback((files: UploadedFile[]) => {
    onFilesChange(files.map(f => f.file));
  }, []); // Empty dependency array - we'll handle updates manually

  // ✅ FIX 2: Improved file handling with better async management
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles: UploadedFile[] = [];
      const imageFiles: { file: File; uploadedFile: UploadedFile }[] = [];

      fileArray.forEach(file => {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
          alert(`File type ${file.type} is not supported`);
          return;
        }

        // Check file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
          alert(
            `File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB`
          );
          return;
        }

        const uploadedFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
        };

        // Separate image files for preview generation
        if (file.type.startsWith('image/')) {
          imageFiles.push({ file, uploadedFile });
        } else {
          validFiles.push(uploadedFile);
        }
      });

      // ✅ FIX 3: Batch state updates to prevent race conditions
      setUploadedFiles(prev => {
        const currentCount = prev.length;
        const newFilesCount = validFiles.length + imageFiles.length;

        if (currentCount + newFilesCount > maxFiles) {
          alert(
            `Maximum ${maxFiles} files allowed. You can add ${maxFiles - currentCount} more files.`
          );
          return prev;
        }

        // Add non-image files immediately
        const updatedFiles = [...prev, ...validFiles];

        // Process image files asynchronously
        imageFiles.forEach(({ uploadedFile }) => {
          const reader = new FileReader();
          reader.onload = e => {
            uploadedFile.preview = e.target?.result as string;
            setUploadedFiles(current => {
              const exists = current.find(f => f.id === uploadedFile.id);
              if (exists) return current; // Prevent duplicates
              return [...current, uploadedFile];
            });
          };
          reader.onerror = () => {
            console.error('Error reading file:', uploadedFile.file.name);
          };
          reader.readAsDataURL(uploadedFile.file);
        });

        return updatedFiles;
      });
    },
    [acceptedTypes, maxSizeInMB, maxFiles]
  );

  // ✅ FIX 4: Stable remove function
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // ✅ FIX 5: Stable drag handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleChooseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ✅ FIX 6: Controlled parent notification - only when files actually change
  useEffect(() => {
    notifyParent(uploadedFiles);
  }, [uploadedFiles]); // Removed onFilesChange from dependencies

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          {
            'border-patriotBlue/30 bg-backgroundLight/30': !dragActive,
            'border-patriotRed bg-patriotRed/10': dragActive,
            'border-patriotRed': error,
          }
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-textSecondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-patriotWhite mb-2">
          Upload Images
        </h3>
        <p className="text-textSecondary mb-4">
          Drag and drop your images here, or click to browse
        </p>
        <Button type="button" variant="secondary" onClick={handleChooseFiles}>
          Choose Files
        </Button>

        <div className="mt-4 text-xs text-textSecondary">
          <p>Supported formats: JPEG, PNG, GIF, WebP</p>
          <p>Maximum file size: {maxSizeInMB}MB</p>
          <p>Maximum files: {maxFiles}</p>
        </div>
      </div>

      {error && <p className="text-patriotRed text-sm">{error}</p>}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-patriotWhite">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedFiles.map(uploadedFile => (
              <div
                key={uploadedFile.id}
                className="relative group bg-backgroundLight border border-patriotBlue/30 rounded-lg p-3"
              >
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-backgroundAccent rounded">
                    <File className="w-8 h-8 text-textSecondary" />
                  </div>
                )}

                <p className="text-xs text-textSecondary mt-2 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-textSecondary">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile.id)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-patriotRed hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
