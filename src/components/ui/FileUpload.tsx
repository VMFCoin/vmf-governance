'use client';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, File, Image, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { fadeInVariants, getAnimationVariants } from '@/lib/animations';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  className?: string;
  error?: string;
  showPreview?: boolean;
  showProgress?: boolean;
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
  uploadProgress?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeInMB = 10,
  className,
  error,
  showPreview = true,
  showProgress = true,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Enhanced stable callback to prevent infinite re-renders
  const notifyParent = useCallback((files: UploadedFile[]) => {
    onFilesChange(files.map(f => f.file));
  }, []); // Empty dependency array - we'll handle updates manually

  // ✅ Enhanced file validation with better error messages
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
      }

      if (file.size > maxSizeInMB * 1024 * 1024) {
        return `File "${file.name}" is too large. Maximum size is ${maxSizeInMB}MB`;
      }

      return null;
    },
    [acceptedTypes, maxSizeInMB]
  );

  // ✅ Enhanced file handling with progress simulation
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles: UploadedFile[] = [];
      const imageFiles: { file: File; uploadedFile: UploadedFile }[] = [];
      const errors: string[] = [];

      fileArray.forEach(file => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
          return;
        }

        const uploadedFile: UploadedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          uploadProgress: 0,
        };

        // Separate image files for preview generation
        if (file.type.startsWith('image/') && showPreview) {
          imageFiles.push({ file, uploadedFile });
        } else {
          validFiles.push(uploadedFile);
        }
      });

      // Show validation errors
      if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
      }

      // ✅ Enhanced batch state updates with progress simulation
      setUploadedFiles(prev => {
        const currentCount = prev.length;
        const newFilesCount = validFiles.length + imageFiles.length;

        if (currentCount + newFilesCount > maxFiles) {
          alert(
            `Maximum ${maxFiles} files allowed. You can add ${maxFiles - currentCount} more files.`
          );
          return prev;
        }

        // Add non-image files immediately with progress simulation
        const updatedFiles = [...prev, ...validFiles];

        // Simulate upload progress for non-image files
        if (showProgress) {
          validFiles.forEach(uploadedFile => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += Math.random() * 30;
              if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
              }
              setUploadedFiles(current =>
                current.map(f =>
                  f.id === uploadedFile.id
                    ? { ...f, uploadProgress: progress }
                    : f
                )
              );
            }, 100);
          });
        }

        // Process image files asynchronously with progress
        imageFiles.forEach(({ uploadedFile }) => {
          const reader = new FileReader();

          reader.onloadstart = () => {
            if (showProgress) {
              setUploadedFiles(current => {
                const exists = current.find(f => f.id === uploadedFile.id);
                if (exists) return current;
                return [...current, { ...uploadedFile, uploadProgress: 0 }];
              });
            }
          };

          reader.onprogress = e => {
            if (showProgress && e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              setUploadedFiles(current =>
                current.map(f =>
                  f.id === uploadedFile.id
                    ? { ...f, uploadProgress: progress }
                    : f
                )
              );
            }
          };

          reader.onload = e => {
            uploadedFile.preview = e.target?.result as string;
            uploadedFile.uploadProgress = 100;
            setUploadedFiles(current => {
              const exists = current.find(f => f.id === uploadedFile.id);
              if (exists) {
                return current.map(f =>
                  f.id === uploadedFile.id
                    ? {
                        ...f,
                        preview: uploadedFile.preview,
                        uploadProgress: 100,
                      }
                    : f
                );
              }
              return [...current, uploadedFile];
            });
          };

          reader.onerror = () => {
            console.error('Error reading file:', uploadedFile.file.name);
            setUploadedFiles(current =>
              current.filter(f => f.id !== uploadedFile.id)
            );
          };

          reader.readAsDataURL(uploadedFile.file);
        });

        return updatedFiles;
      });
    },
    [
      acceptedTypes,
      maxSizeInMB,
      maxFiles,
      validateFile,
      showPreview,
      showProgress,
    ]
  );

  // ✅ Enhanced remove function with animation
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // ✅ Enhanced drag handlers with counter for nested elements
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setDragActive(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
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

  // ✅ Controlled parent notification - only when files actually change
  useEffect(() => {
    notifyParent(uploadedFiles);
  }, [uploadedFiles, notifyParent]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Enhanced Upload Area */}
      <motion.div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 relative overflow-hidden',
          {
            'border-patriotBlue/30 bg-backgroundLight/30':
              !dragActive && !error,
            'border-patriotRed bg-patriotRed/10 scale-105': dragActive,
            'border-patriotRed bg-patriotRed/5': error && !dragActive,
          }
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Drag overlay effect */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              className="absolute inset-0 bg-patriotRed/20 border-2 border-patriotRed border-dashed rounded-lg flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="text-patriotRed font-semibold text-lg">
                Drop files here
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />

        <motion.div
          animate={{ scale: dragActive ? 0.9 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className="w-12 h-12 text-textSecondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-patriotWhite mb-2">
            Upload Files
          </h3>
          <p className="text-textSecondary mb-4">
            Drag and drop your files here, or click to browse
          </p>
          <Button type="button" variant="secondary" onClick={handleChooseFiles}>
            Choose Files
          </Button>

          <div className="mt-4 text-xs text-textSecondary">
            <p>
              Supported formats:{' '}
              {acceptedTypes
                .map(type => type.split('/')[1].toUpperCase())
                .join(', ')}
            </p>
            <p>Maximum file size: {maxSizeInMB}MB</p>
            <p>Maximum files: {maxFiles}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced File List with Previews */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className="space-y-3"
            variants={getAnimationVariants(fadeInVariants)}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <h4 className="text-sm font-medium text-textBase">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h4>

            <div className="grid gap-3">
              {uploadedFiles.map(uploadedFile => (
                <motion.div
                  key={uploadedFile.id}
                  className="flex items-center gap-3 p-3 bg-backgroundLight rounded-lg border border-patriotBlue/20"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* File Preview or Icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <div className="relative group">
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="w-12 h-12 object-cover rounded border border-patriotBlue/30"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-backgroundAccent rounded border border-patriotBlue/30 flex items-center justify-center">
                        {uploadedFile.file.type.startsWith('image/') ? (
                          <Image className="w-6 h-6 text-textSecondary" />
                        ) : (
                          <File className="w-6 h-6 text-textSecondary" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-textBase truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-textSecondary">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {showProgress &&
                      uploadedFile.uploadProgress !== undefined &&
                      uploadedFile.uploadProgress < 100 && (
                        <div className="mt-2">
                          <div className="w-full bg-backgroundAccent rounded-full h-1.5">
                            <motion.div
                              className="bg-patriotBlue h-1.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${uploadedFile.uploadProgress}%`,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-textSecondary mt-1">
                            {Math.round(uploadedFile.uploadProgress)}%
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="flex-shrink-0 text-textSecondary hover:text-patriotRed"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="text-sm text-patriotRed bg-patriotRed/10 border border-patriotRed/30 rounded-lg p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
