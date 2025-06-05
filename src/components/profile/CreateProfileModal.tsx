'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Upload,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  Zap,
  Award,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';
import { useUserProfileStore } from '@/stores/useUserProfileStore';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

interface CreateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProfileModal({
  isOpen,
  onClose,
}: CreateProfileModalProps) {
  const { createProfile, uploadAvatar, error, clearError } =
    useUserProfileStore();
  const { walletAddress } = useProfile();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setAvatarUrl('');
      setValidationError('');
      setShowSuccess(false);
      clearError();
    }
  }, [isOpen, clearError]);

  if (!isOpen) return null;

  const validateName = (nameValue: string): string | null => {
    if (!nameValue.trim()) {
      return 'Name is required';
    }
    if (nameValue.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (nameValue.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    if (!/^[a-zA-Z0-9\s._-]+$/.test(nameValue.trim())) {
      return 'Name can only contain letters, numbers, spaces, dots, underscores, and hyphens';
    }
    return null;
  };

  const handleNameNext = () => {
    const nameValidation = validateName(name);
    if (nameValidation) {
      setValidationError(nameValidation);
      return;
    }
    setValidationError('');
    setStep(2);
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      return url;
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!walletAddress) {
      setValidationError('Wallet not connected');
      return;
    }

    const nameValidation = validateName(name);
    if (nameValidation) {
      setValidationError(nameValidation);
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      await createProfile({
        walletAddress,
        name: name.trim(),
        avatarUrl,
      });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to create profile:', err);
      setValidationError('Failed to create profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Shield,
      title: 'Governance Participation',
      description: 'Vote on proposals and shape the future of VMF',
    },
    {
      icon: Zap,
      title: 'Enhanced Voting Power',
      description: 'Lock tokens to increase your influence in decisions',
    },
    {
      icon: Award,
      title: 'Community Recognition',
      description: 'Build reputation through active participation',
    },
    {
      icon: Star,
      title: 'Exclusive Access',
      description: 'Submit proposals and access premium features',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Enhanced Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-backgroundLight via-backgroundAccent to-backgroundLight border border-patriotBlue/30 rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 overflow-hidden">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-green-500/90 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center text-white">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold mb-2">Profile Created!</h3>
              <p className="text-green-100">Welcome to VMF Governance</p>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-patriotBlue/20 via-patriotRed/10 to-patriotBlue/20 p-6 border-b border-patriotBlue/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_rgba(0,0,0,0.1)_100%)]"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-patriotBlue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-patriotWhite">
                  Create Your Profile
                </h2>
                <p className="text-textSecondary text-sm">
                  Join the VMF governance community
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-textSecondary hover:text-patriotWhite hover:bg-patriotBlue/10 transition-all duration-200 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-4">
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
                  step >= 1
                    ? 'bg-patriotBlue text-white'
                    : 'bg-patriotBlue/20 text-patriotBlue'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                    step > 1 ? 'bg-white text-patriotBlue' : ''
                  )}
                >
                  {step > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
                </div>
                <span className="font-medium">Name</span>
              </div>

              <ArrowRight
                className={cn(
                  'w-5 h-5 transition-colors duration-300',
                  step >= 2 ? 'text-patriotBlue' : 'text-textSecondary'
                )}
              />

              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
                  step >= 2
                    ? 'bg-patriotBlue text-white'
                    : 'bg-patriotBlue/20 text-patriotBlue'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                    step > 2 ? 'bg-white text-patriotBlue' : ''
                  )}
                >
                  {step > 2 ? <CheckCircle className="w-4 h-4" /> : '2'}
                </div>
                <span className="font-medium">Avatar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              {/* Benefits Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4 text-center">
                  Unlock Your Governance Potential
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="bg-patriotBlue/10 border border-patriotBlue/20 rounded-xl p-4 hover:border-patriotBlue/40 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                          <benefit.icon className="w-4 h-4 text-patriotBlue" />
                        </div>
                        <h4 className="font-semibold text-patriotWhite text-sm">
                          {benefit.title}
                        </h4>
                      </div>
                      <p className="text-textSecondary text-xs leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-3">
                  Choose Your Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name (e.g., CryptoPatriot, VMF_Supporter)"
                  className="w-full px-4 py-4 bg-backgroundBase border border-patriotBlue/30 rounded-xl text-patriotWhite placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-patriotBlue focus:border-patriotBlue transition-all duration-200 text-lg"
                  maxLength={50}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-textSecondary text-xs">
                    This name will be visible to other community members
                  </p>
                  <span
                    className={cn(
                      'text-xs',
                      name.length > 45
                        ? 'text-yellow-400'
                        : 'text-textSecondary'
                    )}
                  >
                    {name.length}/50
                  </span>
                </div>
              </div>

              {/* Name Tips */}
              <div className="bg-patriotBlue/5 border border-patriotBlue/20 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-patriotBlue mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Pro Tips
                </h4>
                <ul className="space-y-1 text-xs text-textSecondary">
                  <li>• Choose a name that represents you in the community</li>
                  <li>• You can change this later in your profile settings</li>
                  <li>
                    • Consider using a name that's easy to remember and
                    professional
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-patriotWhite mb-2">
                  Add Your Avatar
                </h3>
                <p className="text-textSecondary">
                  Make your profile stand out with a personal touch
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  onUpload={handleAvatarUpload}
                  className="items-center"
                />
              </div>

              {/* Avatar Tips */}
              <div className="bg-patriotBlue/5 border border-patriotBlue/20 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-patriotBlue mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Avatar Guidelines
                </h4>
                <ul className="space-y-1 text-xs text-textSecondary">
                  <li>• Upload a clear, recognizable image</li>
                  <li>• Square images work best (1:1 ratio)</li>
                  <li>• Keep it professional for governance participation</li>
                  <li>• You can skip this step and add an avatar later</li>
                </ul>
              </div>

              {/* Profile Preview */}
              <div className="bg-gradient-to-br from-backgroundLight to-backgroundAccent border border-patriotBlue/30 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-patriotWhite mb-4 text-center">
                  Profile Preview
                </h4>
                <div className="flex items-center gap-4 justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-patriotBlue to-patriotRed p-1">
                    <div className="w-full h-full rounded-full bg-backgroundBase flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-patriotBlue" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-patriotWhite">
                      {name}
                    </h3>
                    <p className="text-textSecondary text-sm">
                      VMF Community Member
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {(validationError || error) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{validationError || error}</p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {step === 1 ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border border-patriotBlue/30 text-textSecondary hover:text-patriotWhite hover:border-patriotBlue/50 transition-all duration-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNameNext}
                  disabled={!name.trim() || isSubmitting}
                  className="flex-1 px-6 py-4 bg-patriotBlue text-white rounded-xl hover:bg-patriotBlue/80 disabled:bg-patriotBlue/30 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 border border-patriotBlue/30 text-textSecondary hover:text-patriotWhite hover:border-patriotBlue/50 transition-all duration-200 rounded-xl font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-500 disabled:bg-green-600/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Create Profile
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Skip Option for Avatar */}
          {step === 2 && !avatarUrl && (
            <div className="text-center mt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-textSecondary hover:text-patriotWhite transition-colors duration-200 text-sm underline"
              >
                Skip avatar and create profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
