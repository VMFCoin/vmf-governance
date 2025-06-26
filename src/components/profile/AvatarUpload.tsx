'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  User,
  Camera,
  Check,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => void;
  isLoading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onUpload,
  onRemove,
  isLoading = false,
  className,
  size = 'md',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive size classes
  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    md: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32',
  };

  const iconSizes = {
    sm: 'w-4 h-4 sm:w-5 sm:h-5',
    md: 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8',
    lg: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const simulateProgress = (onComplete: () => void) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Complete the upload when onComplete is called
    return () => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        onComplete();
      }, 300);
    };
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setUploadSuccess(false);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsUploading(true);
      const completeProgress = simulateProgress(() => {
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          setPreviewUrl(null);
          setUploadProgress(0);
        }, 1500);
      });

      try {
        await onUpload(file);
        completeProgress();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setPreviewUrl(null);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    if (!isLoading && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const showLoading = isLoading || isUploading;

  return (
    <div
      className={cn(
        'flex flex-col items-center space-y-3 sm:space-y-4',
        className
      )}
    >
      {/* Enhanced Avatar Display/Upload Area */}
      <div className="relative">
        <div
          className={cn(
            'relative rounded-full border-2 transition-all duration-300 cursor-pointer group overflow-hidden',
            sizeClasses[size],
            isDragOver
              ? 'border-patriotBlue bg-patriotBlue/20 scale-105'
              : showLoading
                ? 'border-patriotBlue/50'
                : displayUrl
                  ? 'border-patriotBlue/30 hover:border-patriotBlue hover:scale-105'
                  : 'border-dashed border-patriotBlue/50 hover:border-patriotBlue hover:bg-patriotBlue/10',
            (isLoading || isUploading) && 'cursor-not-allowed',
            // Touch-friendly on mobile
            'active:scale-95 sm:active:scale-100'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {displayUrl ? (
            <>
              <div className="relative w-full h-full rounded-full overflow-hidden bg-backgroundBase">
                <img
                  src={displayUrl}
                  alt="Avatar"
                  className={cn(
                    'w-full h-full object-cover transition-all duration-300',
                    showLoading ? 'opacity-50' : 'group-hover:scale-110'
                  )}
                />

                {/* Overlay for interactions */}
                {!showLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      <span className="text-white text-xs font-medium hidden sm:block">
                        Change
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-backgroundLight to-backgroundAccent flex items-center justify-center border border-patriotBlue/20">
              {showLoading ? (
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 border-2 border-patriotBlue/20 border-t-patriotBlue" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 sm:gap-2 text-patriotBlue">
                  <Upload
                    className={cn(
                      iconSizes[size],
                      'group-hover:scale-110 transition-transform duration-200'
                    )}
                  />
                  <span className="text-xs font-medium opacity-80 hidden sm:block">
                    Upload
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Progress Ring */}
          {isUploading && uploadProgress > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(59, 130, 246, 0.2)"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#3b82f6"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - uploadProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-patriotBlue font-bold text-xs sm:text-sm">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {uploadSuccess && (
            <div className="absolute inset-0 bg-green-500/90 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white animate-bounce" />
            </div>
          )}
        </div>

        {/* Enhanced Remove Button */}
        {displayUrl && !showLoading && !uploadSuccess && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-patriotRed hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-xl border-2 border-backgroundBase"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Status Indicator */}
        {uploadSuccess && (
          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-backgroundBase animate-pulse">
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      {/* Enhanced Upload Instructions */}
      <div className="text-center max-w-xs">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3 mb-3">
            <div className="flex items-center justify-center gap-2 text-red-400 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-center">{error}</span>
            </div>
          </div>
        ) : uploadSuccess ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-3 mb-3">
            <div className="flex items-center justify-center gap-2 text-green-400 text-xs sm:text-sm">
              <Check className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Avatar uploaded successfully!</span>
            </div>
          </div>
        ) : isUploading ? (
          <div className="bg-patriotBlue/10 border border-patriotBlue/30 rounded-lg p-2 sm:p-3 mb-3">
            <div className="flex items-center justify-center gap-2 text-patriotBlue text-xs sm:text-sm">
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-patriotBlue/20 border-t-patriotBlue"></div>
              <span>Uploading... {Math.round(uploadProgress)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-patriotWhite font-medium text-xs sm:text-sm">
              {displayUrl ? 'Tap to change avatar' : 'Upload your avatar'}
            </p>
            <p className="text-textSecondary text-xs leading-relaxed">
              {displayUrl
                ? 'Tap the image or drag a new file to update'
                : 'Drag & drop an image here, or tap to browse'}
            </p>
          </div>
        )}

        {/* File Requirements */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-textSecondary mt-2 sm:mt-3">
          <div className="flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            <span>JPEG, PNG, WebP</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-textSecondary rounded-full"></div>
          <span>Max 5MB</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={showLoading}
      />
    </div>
  );
};
