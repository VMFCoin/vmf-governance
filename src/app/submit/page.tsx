'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Save, Eye } from 'lucide-react';
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
} from '@/components';
import { ProposalFormData, FormErrors, Step } from '@/types';

const STEPS: Step[] = [
  { id: 1, title: 'Basic Info', description: 'Title & Category' },
  { id: 2, title: 'Details', description: 'Description & Summary' },
  { id: 3, title: 'Funding', description: 'Amount & Timeline' },
  { id: 4, title: 'Attachments', description: 'Images & Files' },
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

export default function SubmitPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    category: '',
    summary: '',
    description: '',
    fundingAmount: '',
    timeline: '',
    beneficiaries: '',
    attachments: [],
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

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.category) newErrors.category = 'Category is required';
        break;
      case 2:
        if (!formData.summary.trim()) newErrors.summary = 'Summary is required';
        if (!formData.description.trim())
          newErrors.description = 'Description is required';
        if (formData.summary.length > 200)
          newErrors.summary = 'Summary must be under 200 characters';
        break;
      case 3:
        if (!formData.fundingAmount.trim())
          newErrors.fundingAmount = 'Funding amount is required';
        if (!formData.timeline.trim())
          newErrors.timeline = 'Timeline is required';
        if (!formData.beneficiaries.trim())
          newErrors.beneficiaries = 'Beneficiaries description is required';
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
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear saved draft
      localStorage.removeItem('vmf-proposal-draft');

      showSuccess('Proposal submitted successfully!');
      router.push('/vote');
    } catch (error) {
      showError('Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
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
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Requested Funding Amount (USD) *
              </label>
              <Input
                type="number"
                value={formData.fundingAmount}
                onChange={e => updateFormData('fundingAmount', e.target.value)}
                placeholder="Enter amount in USD"
                error={errors.fundingAmount}
                min="0"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Implementation Timeline *
              </label>
              <Input
                value={formData.timeline}
                onChange={e => updateFormData('timeline', e.target.value)}
                placeholder="e.g., 6 months, Q1 2024, etc."
                error={errors.timeline}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-patriotWhite mb-2">
                Target Beneficiaries *
              </label>
              <textarea
                value={formData.beneficiaries}
                onChange={e => updateFormData('beneficiaries', e.target.value)}
                placeholder="Describe who will benefit from this proposal and how many people will be impacted"
                className="w-full h-32 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
              />
              {errors.beneficiaries && (
                <p className="text-patriotRed text-sm mt-1">
                  {errors.beneficiaries}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
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
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-patriotWhite mb-4">
                Proposal Preview
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-patriotWhite">Title:</h4>
                  <p className="text-textSecondary">{formData.title}</p>
                </div>

                <div>
                  <h4 className="font-medium text-patriotWhite">Category:</h4>
                  <p className="text-textSecondary">
                    {CATEGORIES.find(c => c.value === formData.category)?.label}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-patriotWhite">Summary:</h4>
                  <p className="text-textSecondary">{formData.summary}</p>
                </div>

                <div>
                  <h4 className="font-medium text-patriotWhite">
                    Funding Amount:
                  </h4>
                  <p className="text-textSecondary">
                    ${parseInt(formData.fundingAmount || '0').toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-patriotWhite">Timeline:</h4>
                  <p className="text-textSecondary">{formData.timeline}</p>
                </div>

                <div>
                  <h4 className="font-medium text-patriotWhite">
                    Attachments:
                  </h4>
                  <p className="text-textSecondary">
                    {formData.attachments.length} file(s) attached
                  </p>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-backgroundDark">
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
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Form Content */}
        <Card className="p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-patriotWhite mb-2">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-textSecondary">
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {renderStepContent()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
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

            {currentStep < STEPS.length ? (
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
  );
}
