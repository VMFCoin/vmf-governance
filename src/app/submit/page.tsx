'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Save, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Header,
  Footer,
  Button,
  Card,
  Input,
  MarkdownEditor,
  StepIndicator,
  FileUpload,
  Dropdown,
  useToast,
  ProfileGuard,
} from '@/components';
import {
  ProposalFormData,
  FormErrors,
  Step,
  CharitySubmission,
  FeatureSpec,
} from '@/types';

const CHARITY_STEPS: Step[] = [
  { id: 0, title: 'Proposal Type', description: 'Select proposal type' },
  { id: 1, title: 'Basic Info', description: 'Title & Category' },
  { id: 2, title: 'Charity Details', description: 'Charity Information' },
  { id: 3, title: 'Logo Upload', description: 'Charity Logo' },
  { id: 4, title: 'Review', description: 'Final Preview' },
];

const PLATFORM_FEATURE_STEPS: Step[] = [
  { id: 0, title: 'Proposal Type', description: 'Select proposal type' },
  { id: 1, title: 'Basic Info', description: 'Title & Category' },
  {
    id: 2,
    title: 'Feature Specification',
    description: 'Feature Specification',
  },
  {
    id: 3,
    title: 'Priority & Complexity',
    description: 'Implementation Details',
  },
  { id: 4, title: 'Feature Logo', description: 'Feature Icon/Logo' },
  { id: 5, title: 'Review', description: 'Final Preview' },
];

const CATEGORIES = [
  { value: 'healthcare', label: 'Healthcare & Mental Health' },
  { value: 'education', label: 'Education & Training' },
  { value: 'housing', label: 'Housing & Shelter' },
  { value: 'employment', label: 'Employment & Career' },
  { value: 'family', label: 'Family Support' },
  { value: 'emergency', label: 'Emergency Relief' },
  { value: 'community', label: 'Community Programs' },
  { value: 'other', label: 'Other' },
];

const PROPOSAL_TYPES = [
  {
    value: 'charity_directory',
    label: 'Charity Directory Addition',
    description:
      'Propose adding a new charity to the VMF directory for holiday voting',
  },
  {
    value: 'platform_feature',
    label: 'Platform Feature Request',
    description: 'Suggest new features or improvements to the VMF platform',
  },
];

const CHARITY_CATEGORIES = [
  { value: 'veterans', label: 'Veterans Services' },
  { value: 'military_families', label: 'Military Families' },
  { value: 'disabled_veterans', label: 'Disabled Veterans' },
  { value: 'mental_health', label: 'Mental Health Support' },
  { value: 'general_support', label: 'General Support' },
];

const FEATURE_CATEGORIES = [
  { value: 'ui_ux', label: 'UI/UX Improvements' },
  { value: 'governance', label: 'Governance Features' },
  { value: 'community', label: 'Community Tools' },
  { value: 'technical', label: 'Technical Infrastructure' },
  { value: 'security', label: 'Security Enhancements' },
  { value: 'analytics', label: 'Analytics & Reporting' },
  { value: 'mobile', label: 'Mobile Experience' },
  { value: 'integration', label: 'Third-party Integrations' },
];

const FEATURE_PRIORITIES = [
  {
    value: 'low',
    label: 'Low Priority',
    description: 'Nice to have, can wait',
  },
  {
    value: 'medium',
    label: 'Medium Priority',
    description: 'Important for user experience',
  },
  {
    value: 'high',
    label: 'High Priority',
    description: 'Critical for platform success',
  },
  {
    value: 'critical',
    label: 'Critical Priority',
    description: 'Urgent security or functionality issue',
  },
];

const IMPLEMENTATION_COMPLEXITY = [
  {
    value: 'low',
    label: 'Low Complexity',
    description: '1-2 weeks development time',
  },
  {
    value: 'medium',
    label: 'Medium Complexity',
    description: '3-6 weeks development time',
  },
  {
    value: 'high',
    label: 'High Complexity',
    description: '2+ months development time',
  },
];

export default function SubmitPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousType, setPreviousType] = useState<string>('charity_directory');

  const [formData, setFormData] = useState<ProposalFormData>({
    type: 'charity_directory', // Default to charity directory instead of legacy
    title: '',
    category: '',
    summary: '',
    description: '',
    fundingAmount: '',
    timeline: '',
    beneficiaries: '',
    attachments: [],
    // Charity-specific fields
    charityData: {
      name: '',
      description: '',
      website: '',
      ein: '',
      category: 'veterans',
      contactEmail: '',
      contactPhone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      missionStatement: '',
      veteranFocus: '',
      impactDescription: '',
      requestedDocuments: [],
    },
    // Platform feature-specific fields
    featureSpecification: {
      title: '',
      description: '',
      userStory: '',
      acceptanceCriteria: [],
      technicalRequirements: '',
      priority: 'medium',
      estimatedEffort: '',
      targetUsers: [],
      businessValue: '',
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('vmf-proposal-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('vmf-proposal-draft', JSON.stringify(formData));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // ✅ Create stable updateFormData function
  const updateFormData = useCallback(
    (field: keyof ProposalFormData, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // ✅ Create stable file change handler
  const handleFilesChange = useCallback(
    (files: File[]) => {
      updateFormData('attachments', files);
    },
    [updateFormData]
  );

  // Helper function to update charity data
  const updateCharityData = useCallback(
    (field: keyof CharitySubmission, value: any) => {
      setFormData(prev => ({
        ...prev,
        charityData: {
          ...prev.charityData!,
          [field]: value,
        },
      }));
      // Clear error when user starts typing
      if (errors.charityData?.[field]) {
        setErrors(prev => ({
          ...prev,
          charityData: {
            ...prev.charityData,
            [field]: undefined,
          },
        }));
      }
    },
    [errors.charityData]
  );

  // Helper function to update feature specification data
  const updateFeatureData = useCallback(
    (field: keyof FeatureSpec, value: any) => {
      setFormData(prev => ({
        ...prev,
        featureSpecification: {
          ...prev.featureSpecification!,
          [field]: value,
        },
      }));
      // Clear error when user starts typing
      if (errors.featureSpecification?.[field]) {
        setErrors(prev => ({
          ...prev,
          featureSpecification: {
            ...prev.featureSpecification,
            [field]: undefined,
          },
        }));
      }
    },
    [errors.featureSpecification]
  );

  // Helper function to get current steps based on proposal type
  const getCurrentSteps = () => {
    if (formData.type === 'charity_directory') return CHARITY_STEPS;
    if (formData.type === 'platform_feature') return PLATFORM_FEATURE_STEPS;
    // Default to charity steps since we removed legacy proposals
    return CHARITY_STEPS;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 0:
        // Proposal type is always valid (has default)
        break;
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (formData.type === 'charity_directory') {
          // Charity-specific validation
          if (!formData.charityData?.name.trim()) {
            newErrors.charityData = {
              ...newErrors.charityData,
              name: 'Charity name is required',
            };
          }
          if (!formData.charityData?.website.trim()) {
            newErrors.charityData = {
              ...newErrors.charityData,
              website: 'Website is required',
            };
          }
          if (!formData.charityData?.missionStatement.trim()) {
            newErrors.charityData = {
              ...newErrors.charityData,
              missionStatement: 'Mission statement is required',
            };
          }
          if (!formData.charityData?.veteranFocus.trim()) {
            newErrors.charityData = {
              ...newErrors.charityData,
              veteranFocus: 'Veteran focus description is required',
            };
          }
          if (!formData.charityData?.impactDescription.trim()) {
            newErrors.charityData = {
              ...newErrors.charityData,
              impactDescription: 'Impact description is required',
            };
          }
        } else if (formData.type === 'platform_feature') {
          // Platform feature-specific validation
          if (!formData.featureSpecification?.title.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              title: 'Feature title is required',
            };
          }
          if (!formData.featureSpecification?.description.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              description: 'Feature description is required',
            };
          }
          if (!formData.featureSpecification?.userStory.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              userStory: 'User story is required',
            };
          }
          if (!formData.featureSpecification?.businessValue.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              businessValue: 'Business value is required',
            };
          }
        }
        break;
      case 3:
        if (formData.type === 'charity_directory') {
          // Skip funding validation for charity directory proposals
          break;
        } else if (formData.type === 'platform_feature') {
          // Platform feature priority and complexity validation
          if (!formData.featureSpecification?.priority) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              priority: 'Priority is required',
            };
          }
          if (!formData.featureSpecification?.estimatedEffort.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              estimatedEffort: 'Estimated effort is required',
            };
          }
          if (!formData.featureSpecification?.technicalRequirements.trim()) {
            newErrors.featureSpecification = {
              ...newErrors.featureSpecification,
              technicalRequirements: 'Technical requirements are required',
            };
          }
        }
        break;
      case 4:
        // Attachments are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const steps = getCurrentSteps();
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const steps = getCurrentSteps();
    const finalStepId = steps[steps.length - 1].id;

    if (!validateStep(finalStepId)) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear saved draft
      localStorage.removeItem('vmf-proposal-draft');

      // Show success message based on proposal type
      const successMessage =
        formData.type === 'charity_directory'
          ? 'Charity directory proposal submitted successfully! The community will vote on adding this charity to the VMF directory.'
          : 'Platform feature proposal submitted successfully! The community will vote on implementing this feature.';

      showSuccess(successMessage);
      router.push('/vote');
    } catch (error) {
      showError('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const isCharityDirectory = formData.type === 'charity_directory';

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display font-bold text-patriotWhite mb-4">
                Choose Proposal Type
              </h3>
              <p className="text-textSecondary">
                Select the type of proposal you'd like to submit to the VMF
                community
              </p>
            </div>
            <div className="grid gap-4">
              {PROPOSAL_TYPES.map((type, index) => {
                const isSelected = formData.type === type.value;

                return (
                  <motion.div
                    key={type.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1,
                      ease: [0.4, 0.0, 0.2, 1],
                    }}
                    className={`group relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ease-out overflow-hidden ${
                      isSelected
                        ? 'border-patriotRed bg-patriotRed/5 shadow-lg shadow-patriotRed/10'
                        : 'border-patriotBlue/30 bg-backgroundLight/30 hover:border-patriotBlue/50 hover:bg-backgroundLight/50 hover:shadow-md'
                    }`}
                    onClick={() => {
                      updateFormData('type', type.value);
                      setPreviousType(type.value);
                    }}
                    whileHover={{
                      scale: 1.01,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Clean selection indicator */}
                    <div className="flex items-start">
                      <div className="relative mr-4 mt-1 flex-shrink-0">
                        <motion.div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-patriotRed bg-patriotRed'
                              : 'border-patriotBlue/50'
                          }`}
                          animate={{
                            scale: isSelected ? 1.1 : 1,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
                        >
                          {/* Perfectly centered white dot */}
                          <motion.div
                            className="w-2 h-2 bg-patriotWhite rounded-full"
                            initial={{ scale: 0 }}
                            animate={{
                              scale: isSelected ? 1 : 0,
                            }}
                            transition={{
                              duration: 0.2,
                              ease: [0.4, 0.0, 0.2, 1],
                            }}
                          />
                        </motion.div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-lg font-semibold mb-2 transition-colors duration-300 ${
                            isSelected
                              ? 'text-patriotWhite'
                              : 'text-patriotWhite/90'
                          }`}
                        >
                          {type.label}
                        </h4>
                        <p
                          className={`text-sm transition-colors duration-300 ${
                            isSelected
                              ? 'text-textSecondary'
                              : 'text-textSecondary/80'
                          }`}
                        >
                          {type.description}
                        </p>
                      </div>

                      {/* Clean checkmark for selected state */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 flex-shrink-0"
                          >
                            <div className="w-6 h-6 rounded-full bg-patriotRed flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-patriotWhite"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Subtle hover shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-patriotWhite/3 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Proposal Title *
              </label>
              <Input
                value={formData.title}
                onChange={e => updateFormData('title', e.target.value)}
                placeholder="Enter a clear, descriptive title for your proposal"
                error={errors.title}
                maxLength={100}
              />
              <p className="text-xs text-textSecondary mt-1">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Category *
              </label>
              <Dropdown
                options={CATEGORIES}
                value={formData.category}
                onChange={value => updateFormData('category', value)}
                placeholder="Select a category"
              />
              {errors.category && (
                <p className="text-patriotRed text-sm mt-1">
                  {errors.category}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        if (isCharityDirectory) {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                  Charity Information
                </h3>
                <p className="text-textSecondary">
                  Provide details about the charity you'd like to add to the VMF
                  directory
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-patriotWhite mb-2">
                    Charity Name *
                  </label>
                  <Input
                    value={formData.charityData?.name || ''}
                    onChange={e => updateCharityData('name', e.target.value)}
                    placeholder="Enter the official charity name"
                    error={errors.charityData?.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-patriotWhite mb-2">
                    Official Website *
                  </label>
                  <Input
                    type="url"
                    value={formData.charityData?.website || ''}
                    onChange={e => updateCharityData('website', e.target.value)}
                    placeholder="https://charity-website.org"
                    error={errors.charityData?.website}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Charity Category *
                </label>
                <Dropdown
                  options={CHARITY_CATEGORIES}
                  value={formData.charityData?.category || 'veterans'}
                  onChange={value => updateCharityData('category', value)}
                  placeholder="Select charity category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Mission Statement *
                </label>
                <textarea
                  value={formData.charityData?.missionStatement || ''}
                  onChange={e =>
                    updateCharityData('missionStatement', e.target.value)
                  }
                  placeholder="Describe the charity's mission and goals"
                  className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.charityData?.missionStatement && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.charityData.missionStatement}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Veteran Focus *
                </label>
                <textarea
                  value={formData.charityData?.veteranFocus || ''}
                  onChange={e =>
                    updateCharityData('veteranFocus', e.target.value)
                  }
                  placeholder="Explain how this charity specifically serves veterans and military families"
                  className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.charityData?.veteranFocus && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.charityData.veteranFocus}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Why Add to VMF Directory? *
                </label>
                <textarea
                  value={formData.charityData?.impactDescription || ''}
                  onChange={e =>
                    updateCharityData('impactDescription', e.target.value)
                  }
                  placeholder="Explain why this charity should be added to the VMF directory for holiday voting"
                  className="w-full h-32 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.charityData?.impactDescription && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.charityData.impactDescription}
                  </p>
                )}
              </div>
            </div>
          );
        }

        if (formData.type === 'platform_feature') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                  Feature Specification
                </h3>
                <p className="text-textSecondary">
                  Provide detailed information about the feature you'd like to
                  propose
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Feature Title *
                </label>
                <Input
                  value={formData.featureSpecification?.title || ''}
                  onChange={e => updateFeatureData('title', e.target.value)}
                  placeholder="Enter a clear, descriptive title for the feature"
                  error={errors.featureSpecification?.title}
                  maxLength={100}
                />
                <p className="text-xs text-textSecondary mt-1">
                  {(formData.featureSpecification?.title || '').length}/100
                  characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Feature Description *
                </label>
                <textarea
                  value={formData.featureSpecification?.description || ''}
                  onChange={e =>
                    updateFeatureData('description', e.target.value)
                  }
                  placeholder="Describe what this feature does and how it works"
                  className="w-full h-32 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.featureSpecification?.description && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  User Story *
                </label>
                <textarea
                  value={formData.featureSpecification?.userStory || ''}
                  onChange={e => updateFeatureData('userStory', e.target.value)}
                  placeholder="As a [user type], I want [feature] so that [benefit]"
                  className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.featureSpecification?.userStory && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.userStory}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Business Value *
                </label>
                <textarea
                  value={formData.featureSpecification?.businessValue || ''}
                  onChange={e =>
                    updateFeatureData('businessValue', e.target.value)
                  }
                  placeholder="Explain the value this feature brings to the VMF platform and community"
                  className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.featureSpecification?.businessValue && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.businessValue}
                  </p>
                )}
              </div>

              <div className="bg-backgroundLight/50 rounded-lg p-4 border border-patriotBlue/30">
                <h4 className="font-medium text-patriotWhite mb-2">
                  🎨 Feature Guidelines
                </h4>
                <p className="text-textSecondary text-sm">
                  Focus on features that enhance veteran support, improve
                  governance participation, or strengthen community engagement.
                  Consider technical feasibility and user impact.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Executive Summary *
              </label>
              <textarea
                value={formData.summary}
                onChange={e => updateFormData('summary', e.target.value)}
                placeholder="Provide a brief summary of your proposal (max 200 characters)"
                className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                maxLength={200}
              />
              <p className="text-xs text-textSecondary mt-1">
                {formData.summary.length}/200 characters
              </p>
              {errors.summary && (
                <p className="text-patriotRed text-sm mt-1">{errors.summary}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Detailed Description *
              </label>
              <MarkdownEditor
                value={formData.description}
                onChange={value => updateFormData('description', value)}
                placeholder="Provide a detailed description of your proposal. Use markdown for formatting."
                error={errors.description}
              />
            </div>
          </div>
        );

      case 3:
        if (isCharityDirectory) {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                  Charity Logo
                </h3>
                <p className="text-textSecondary">
                  Upload the charity's official logo for display in the VMF
                  directory
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-4">
                  Charity Logo *
                </label>
                <FileUpload
                  onFilesChange={handleFilesChange}
                  maxFiles={1}
                  maxSizeInMB={5}
                  acceptedTypes={[
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                  ]}
                  error={errors.attachments}
                />
                <p className="text-textSecondary text-sm mt-2">
                  Upload the charity's official logo. This will be displayed in
                  the VMF directory and voting interface.
                </p>
              </div>

              <div className="bg-backgroundLight/50 rounded-lg p-4 border border-patriotBlue/30">
                <h4 className="font-medium text-patriotWhite mb-2">
                  📋 Next Steps
                </h4>
                <p className="text-textSecondary text-sm">
                  After submission, the community will vote on whether to add
                  this charity to the VMF directory. If approved, the charity
                  will be available for selection during holiday voting events.
                </p>
              </div>
            </div>
          );
        }

        if (formData.type === 'platform_feature') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                  Priority & Complexity
                </h3>
                <p className="text-textSecondary">
                  Help us understand the priority and technical complexity of
                  this feature
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Priority Level *
                </label>
                <Dropdown
                  options={[
                    {
                      value: 'critical',
                      label: 'Critical - Essential for platform operation',
                    },
                    {
                      value: 'high',
                      label: 'High - Significantly improves user experience',
                    },
                    {
                      value: 'medium',
                      label: 'Medium - Nice to have enhancement',
                    },
                    { value: 'low', label: 'Low - Future consideration' },
                  ]}
                  value={formData.featureSpecification?.priority || ''}
                  onChange={value => updateFeatureData('priority', value)}
                  placeholder="Select priority level"
                />
                {errors.featureSpecification?.priority && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.priority}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Estimated Development Effort *
                </label>
                <Dropdown
                  options={[
                    {
                      value: 'small',
                      label:
                        'Small (1-2 weeks) - Minor UI changes or simple features',
                    },
                    {
                      value: 'medium',
                      label:
                        'Medium (3-6 weeks) - New components or moderate complexity',
                    },
                    {
                      value: 'large',
                      label:
                        'Large (2-3 months) - Major features or system changes',
                    },
                    {
                      value: 'epic',
                      label:
                        'Epic (3+ months) - Platform overhaul or complex integrations',
                    },
                  ]}
                  value={formData.featureSpecification?.estimatedEffort || ''}
                  onChange={value =>
                    updateFeatureData('estimatedEffort', value)
                  }
                  placeholder="Select estimated effort"
                />
                {errors.featureSpecification?.estimatedEffort && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.estimatedEffort}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-2">
                  Technical Requirements *
                </label>
                <textarea
                  value={
                    formData.featureSpecification?.technicalRequirements || ''
                  }
                  onChange={e =>
                    updateFeatureData('technicalRequirements', e.target.value)
                  }
                  placeholder="Describe any specific technical requirements, dependencies, or considerations for implementing this feature"
                  className="w-full h-32 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
                />
                {errors.featureSpecification?.technicalRequirements && (
                  <p className="text-patriotRed text-sm mt-1">
                    {errors.featureSpecification.technicalRequirements}
                  </p>
                )}
              </div>

              <div className="bg-backgroundLight/50 rounded-lg p-4 border border-patriotBlue/30">
                <h4 className="font-medium text-patriotWhite mb-2">
                  💡 Development Notes
                </h4>
                <p className="text-textSecondary text-sm">
                  Platform features are evaluated based on community value,
                  technical feasibility, and alignment with VMF's mission.
                  Features that enhance veteran support or improve governance
                  participation are prioritized.
                </p>
              </div>
            </div>
          );
        }

        // Default fallback (shouldn't reach here with current proposal types)
        return null;

      case 4:
        if (isCharityDirectory) {
          // This is the review step for charity directory
          return (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                  Charity Directory Submission Preview
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-patriotWhite">Type:</h4>
                    <p className="text-textSecondary">
                      Charity Directory Addition
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Title:</h4>
                    <p className="text-textSecondary">{formData.title}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Category:</h4>
                    <p className="text-textSecondary">
                      {
                        CATEGORIES.find(c => c.value === formData.category)
                          ?.label
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Charity Name:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.name}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Website:</h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.website}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Charity Category:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.category}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Mission Statement:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.missionStatement}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Veteran Focus:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.veteranFocus}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Impact Description:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.charityData?.impactDescription}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Logo:</h4>
                    <p className="text-textSecondary">
                      {formData.attachments.length} file(s) attached (Logo)
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          );
        }

        if (formData.type === 'platform_feature') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                  Feature Icon/Logo
                </h3>
                <p className="text-textSecondary">
                  Upload an icon or logo to represent this feature (optional)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-patriotWhite mb-4">
                  Feature Icon/Logo
                </label>
                <FileUpload
                  onFilesChange={handleFilesChange}
                  maxFiles={1}
                  maxSizeInMB={5}
                  acceptedTypes={[
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'image/svg+xml',
                  ]}
                  error={errors.attachments}
                />
                <p className="text-textSecondary text-sm mt-2">
                  Upload an icon or logo that represents this feature. This will
                  be displayed in the proposal interface and voting system. SVG,
                  PNG, JPG, GIF, and WebP formats are supported.
                </p>
              </div>

              <div className="bg-backgroundLight/50 rounded-lg p-4 border border-patriotBlue/30">
                <h4 className="font-medium text-patriotWhite mb-2">
                  🎨 Design Guidelines
                </h4>
                <p className="text-textSecondary text-sm">
                  For best results, use a square icon (1:1 aspect ratio) with a
                  transparent background. The icon should be simple and
                  recognizable at small sizes. Consider using VMF's color
                  palette for consistency.
                </p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-4">
                Supporting Documents & Images
              </label>
              <FileUpload
                onFilesChange={handleFilesChange}
                maxFiles={5}
                maxSizeInMB={10}
                error={errors.attachments}
              />
              <p className="text-textSecondary text-sm mt-2">
                Upload any supporting documents, images, or files that help
                explain your proposal.
              </p>
            </div>
          </div>
        );

      case 5:
        if (formData.type === 'platform_feature') {
          return (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                  Platform Feature Proposal Preview
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-patriotWhite">Type:</h4>
                    <p className="text-textSecondary">
                      Platform Feature Request
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Title:</h4>
                    <p className="text-textSecondary">{formData.title}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">Category:</h4>
                    <p className="text-textSecondary">
                      {
                        CATEGORIES.find(c => c.value === formData.category)
                          ?.label
                      }
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Feature Title:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.featureSpecification?.title}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Feature Description:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.featureSpecification?.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      User Story:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.featureSpecification?.userStory}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Business Value:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.featureSpecification?.businessValue}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Priority Level:
                    </h4>
                    <p className="text-textSecondary">
                      {FEATURE_PRIORITIES.find(
                        p => p.value === formData.featureSpecification?.priority
                      )?.label || formData.featureSpecification?.priority}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Estimated Development Effort:
                    </h4>
                    <p className="text-textSecondary">
                      {IMPLEMENTATION_COMPLEXITY.find(
                        c =>
                          c.value ===
                          formData.featureSpecification?.estimatedEffort
                      )?.label ||
                        formData.featureSpecification?.estimatedEffort}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Technical Requirements:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.featureSpecification?.technicalRequirements}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-patriotWhite">
                      Feature Icon/Logo:
                    </h4>
                    <p className="text-textSecondary">
                      {formData.attachments.length} file(s) attached
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          );
        }

        // Default fallback (shouldn't reach here with current proposal types)
        return null;

      default:
        return null;
    }
  };

  return (
    <ProfileGuard fallbackMessage="You need a profile to submit governance proposals.">
      <main className="min-h-screen landing-page-flag">
        <Header />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/vote"
            className="inline-flex items-center text-patriotRed hover:text-red-400 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-patriotWhite mb-4">
              Submit New Proposal
            </h1>
            <p className="text-xl text-textSecondary">
              Help shape the future of veteran support through community-driven
              proposals
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-12">
            <StepIndicator
              steps={getCurrentSteps()}
              currentStep={currentStep}
            />
          </div>

          {/* Form Content */}
          <Card className="p-8 mb-8">
            {currentStep !== 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-patriotWhite mb-2">
                  {getCurrentSteps()[currentStep].title}
                </h2>
                <p className="text-textSecondary">
                  {getCurrentSteps()[currentStep].description}
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{
                  duration: 0.25,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => {
                  localStorage.setItem(
                    'vmf-proposal-draft',
                    JSON.stringify(formData)
                  );
                  showSuccess('Draft saved successfully!');
                }}
                className="flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>

              {currentStep < getCurrentSteps().length - 1 ? (
                <Button onClick={nextStep} className="flex items-center">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-patriotWhite border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Submit Proposal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </ProfileGuard>
  );
}
