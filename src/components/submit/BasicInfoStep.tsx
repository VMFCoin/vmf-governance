'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Input, Dropdown } from '@/components/ui';
import { FormField } from '@/components/ui/FormField';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { FormErrors } from '@/types';

interface BasicInfoStepProps {
  formData: {
    title: string;
    category: string;
    type: string;
  };
  onFormDataChange: (field: string, value: any) => void;
  errors: FormErrors;
  isMobile?: boolean;
  isSmallMobile?: boolean;
}

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

export const BasicInfoStep: React.FC<BasicInfoStepProps> = React.memo(
  ({
    formData,
    onFormDataChange,
    errors,
    isMobile = false,
    isSmallMobile = false,
  }) => {
    const categories = React.useMemo(
      () =>
        formData.type === 'charity_directory'
          ? CHARITY_CATEGORIES
          : FEATURE_CATEGORIES,
      [formData.type]
    );

    const titleLabel = React.useMemo(
      () =>
        formData.type === 'charity_directory'
          ? 'Proposal Title'
          : 'Feature Title',
      [formData.type]
    );

    const titlePlaceholder = React.useMemo(
      () =>
        formData.type === 'charity_directory'
          ? 'e.g., Add Wounded Warrior Project to VMF Directory'
          : 'e.g., Enhanced Mobile Voting Interface',
      [formData.type]
    );

    const categoryLabel = React.useMemo(
      () =>
        formData.type === 'charity_directory'
          ? 'Charity Category'
          : 'Feature Category',
      [formData.type]
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-patriotWhite mb-2">
            Basic Information
          </h2>
          <p className="text-textSecondary">
            Provide the essential details for your proposal
          </p>
        </div>

        <div className="space-y-6">
          <FormField
            label={titleLabel}
            required
            error={errors.title}
            helpText="Choose a clear, descriptive title that summarizes your proposal"
          >
            <Input
              value={formData.title}
              onChange={e => onFormDataChange('title', e.target.value)}
              placeholder={titlePlaceholder}
              className={isMobile ? 'text-base' : ''}
            />
          </FormField>

          <FormField
            label={categoryLabel}
            required
            error={errors.category}
            helpText="Select the most appropriate category for your proposal"
          >
            <Dropdown
              value={formData.category}
              onChange={value => onFormDataChange('category', value)}
              options={categories}
              placeholder="Select a category"
            />
          </FormField>
        </div>
      </motion.div>
    );
  }
);

BasicInfoStep.displayName = 'BasicInfoStep';
