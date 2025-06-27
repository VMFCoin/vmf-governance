'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  User,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarUpload } from './AvatarUpload';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: (data: {
    displayName: string;
    avatarUrl?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

type Step = 'name' | 'avatar' | 'complete';

export const CreateProfileModal: React.FC<CreateProfileModalProps> = ({
  isOpen,
  onClose,
  onCreateProfile,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('name');
      setDisplayName('');
      setAvatarUrl(null);
      setNameError(null);
      setUploadError(null);
      setIsCreating(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateDisplayName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return 'Display name is required';
    }
    if (name.trim().length < 2) {
      return 'Display name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Display name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s._-]+$/.test(name.trim())) {
      return 'Display name can only contain letters, numbers, spaces, dots, underscores, and hyphens';
    }
    return null;
  }, []);

  const handleNameSubmit = () => {
    const error = validateDisplayName(displayName);
    if (error) {
      setNameError(error);
      return;
    }
    setNameError(null);
    setCurrentStep('avatar');
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    try {
      setUploadError(null);
      // Simulate upload - replace with actual upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockUrl = URL.createObjectURL(file);
      setAvatarUrl(mockUrl);
      return mockUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      throw error;
    }
  };

  const handleCreateProfile = async () => {
    try {
      console.log('Modal: Starting profile creation...', {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || undefined,
      });
      setIsCreating(true);
      await onCreateProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || undefined,
      });
      console.log(
        'Modal: Profile created successfully, moving to complete step'
      );
      setCurrentStep('complete');

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Modal: Failed to create profile:', error);
      // TODO: Show error state to user instead of just logging
      // For now, reset the creating state so user can try again
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
    if (e.key === 'Enter' && currentStep === 'name') {
      handleNameSubmit();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'name':
        return 'Create Your Profile';
      case 'avatar':
        return 'Add Your Avatar';
      case 'complete':
        return 'Profile Created!';
      default:
        return 'Create Profile';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'name':
        return 'Choose a display name that represents you in the community';
      case 'avatar':
        return 'Add a profile picture to personalize your account (optional)';
      case 'complete':
        return 'Welcome to the community! Your profile has been created successfully.';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div
          className={cn(
            'relative w-full max-w-md sm:max-w-lg lg:max-w-xl',
            'bg-backgroundBase border border-patriotBlue/20 rounded-xl sm:rounded-2xl',
            'shadow-2xl transform transition-all duration-300',
            'max-h-[90vh] flex flex-col'
          )}
          onClick={e => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Enhanced Header */}
          <div className="relative p-4 sm:p-6 lg:p-8 border-b border-patriotBlue/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-patriotBlue to-patriotBlue/80 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-patriotWhite">
                    {getStepTitle()}
                  </h2>
                  <p className="text-xs sm:text-sm text-textSecondary mt-1 max-w-xs sm:max-w-sm">
                    {getStepDescription()}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                disabled={isCreating || isLoading}
                className={cn(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center',
                  'text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10',
                  'transition-all duration-200 transform hover:scale-110',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  // Touch-friendly
                  'active:scale-95'
                )}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Enhanced Progress Indicator */}
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-textSecondary">
                  Step{' '}
                  {currentStep === 'name'
                    ? '1'
                    : currentStep === 'avatar'
                      ? '2'
                      : '3'}{' '}
                  of 3
                </span>
                <span className="text-xs sm:text-sm text-patriotBlue font-medium">
                  {currentStep === 'name'
                    ? '33%'
                    : currentStep === 'avatar'
                      ? '67%'
                      : '100%'}
                </span>
              </div>
              <div className="w-full bg-backgroundAccent rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-gradient-to-r from-patriotBlue to-patriotBlue/80 h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width:
                      currentStep === 'name'
                        ? '33%'
                        : currentStep === 'avatar'
                          ? '67%'
                          : '100%',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {currentStep === 'name' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-patriotWhite mb-2 sm:mb-3">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => {
                        setDisplayName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="Enter your display name"
                      className={cn(
                        'w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base',
                        'bg-backgroundLight border rounded-lg sm:rounded-xl',
                        'text-patriotWhite placeholder-textSecondary',
                        'focus:outline-none focus:ring-2 focus:ring-patriotBlue/50 focus:border-patriotBlue',
                        'transition-all duration-200',
                        nameError
                          ? 'border-red-500 bg-red-500/5'
                          : 'border-patriotBlue/30 hover:border-patriotBlue/50'
                      )}
                      maxLength={50}
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-textSecondary" />
                    </div>
                  </div>

                  {/* Character Count */}
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-textSecondary">
                      {displayName.length}/50 characters
                    </div>
                    {nameError && (
                      <div className="flex items-center gap-1 text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{nameError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name Guidelines */}
                <div className="bg-patriotBlue/5 border border-patriotBlue/20 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-medium text-patriotWhite mb-2">
                    Guidelines:
                  </h4>
                  <ul className="text-xs sm:text-sm text-textSecondary space-y-1">
                    <li>• 2-50 characters long</li>
                    <li>
                      • Letters, numbers, spaces, dots, underscores, and hyphens
                      only
                    </li>
                    <li>
                      • Choose something that represents you in the community
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {currentStep === 'avatar' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    onUpload={handleAvatarUpload}
                    onRemove={() => setAvatarUrl(null)}
                    size="lg"
                    className="mb-4 sm:mb-6"
                  />
                </div>

                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                <div className="bg-backgroundLight/50 border border-patriotBlue/20 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-textSecondary text-center">
                    You can skip this step and add an avatar later from your
                    profile settings.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-patriotWhite">
                    Welcome, {displayName}!
                  </h3>
                  <p className="text-sm sm:text-base text-textSecondary">
                    Your profile has been created successfully. You're now ready
                    to participate in the community!
                  </p>
                </div>

                {avatarUrl && (
                  <div className="flex justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-patriotBlue/30">
                      <img
                        src={avatarUrl}
                        alt="Your avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          {currentStep !== 'complete' && (
            <div className="p-4 sm:p-6 lg:p-8 border-t border-patriotBlue/20">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                {/* Back Button */}
                {currentStep === 'avatar' && (
                  <button
                    onClick={() => setCurrentStep('name')}
                    disabled={isCreating || isLoading}
                    className={cn(
                      'flex-1 sm:flex-none px-4 py-2.5 sm:px-6 sm:py-3',
                      'bg-backgroundLight hover:bg-backgroundAccent',
                      'border border-patriotBlue/30 hover:border-patriotBlue/50',
                      'text-patriotWhite rounded-lg sm:rounded-xl',
                      'transition-all duration-200 transform hover:scale-105',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                      'flex items-center justify-center gap-2',
                      'text-sm sm:text-base font-medium',
                      // Touch-friendly
                      'active:scale-95'
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={
                    currentStep === 'name'
                      ? handleNameSubmit
                      : handleCreateProfile
                  }
                  disabled={
                    isCreating ||
                    isLoading ||
                    (currentStep === 'name' && !displayName.trim())
                  }
                  className={cn(
                    'flex-1 px-4 py-2.5 sm:px-6 sm:py-3',
                    'bg-gradient-to-r from-patriotBlue to-patriotBlue/90',
                    'hover:from-patriotBlue/90 hover:to-patriotBlue',
                    'text-white rounded-lg sm:rounded-xl',
                    'transition-all duration-200 transform hover:scale-105',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                    'flex items-center justify-center gap-2',
                    'text-sm sm:text-base font-medium shadow-lg hover:shadow-xl',
                    // Touch-friendly
                    'active:scale-95'
                  )}
                >
                  {isCreating || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                      <span>
                        {currentStep === 'name'
                          ? 'Processing...'
                          : 'Creating Profile...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentStep === 'name' ? 'Continue' : 'Create Profile'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip Option for Avatar Step */}
              {currentStep === 'avatar' && !isCreating && (
                <div className="text-center mt-3 sm:mt-4">
                  <button
                    onClick={handleCreateProfile}
                    className="text-xs sm:text-sm text-textSecondary hover:text-patriotWhite transition-colors duration-200"
                  >
                    Skip and create profile without avatar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
