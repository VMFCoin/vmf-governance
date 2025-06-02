'use client';

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Input, Dropdown } from '@/components/ui';
import { CharitySubmission, FormErrors } from '@/types';
import { formErrorVariants, getAnimationVariants } from '@/lib/animations';

interface CharityDetailsStepProps {
  charityData: CharitySubmission;
  errors: FormErrors['charityData'];
  onCharityDataChange: (field: keyof CharitySubmission, value: string) => void;
}

const CHARITY_CATEGORIES = [
  { value: 'veterans', label: 'Veterans Services' },
  { value: 'military_families', label: 'Military Families' },
  { value: 'disabled_veterans', label: 'Disabled Veterans' },
  { value: 'mental_health', label: 'Mental Health Support' },
  { value: 'general_support', label: 'General Support' },
];

export const CharityDetailsStep = memo(function CharityDetailsStep({
  charityData,
  errors,
  onCharityDataChange,
}: CharityDetailsStepProps) {
  const handleInputChange = useCallback(
    (field: keyof CharitySubmission) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onCharityDataChange(field, e.target.value);
      },
    [onCharityDataChange]
  );

  const handleDropdownChange = useCallback(
    (value: string) => {
      onCharityDataChange('category', value);
    },
    [onCharityDataChange]
  );

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
            value={charityData?.name || ''}
            onChange={handleInputChange('name')}
            placeholder="Enter the official charity name"
            error={errors?.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-patriotWhite mb-2">
            Official Website *
          </label>
          <Input
            type="url"
            value={charityData?.website || ''}
            onChange={handleInputChange('website')}
            placeholder="https://charity-website.org"
            error={errors?.website}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-patriotWhite mb-2">
          Charity Category *
        </label>
        <Dropdown
          options={CHARITY_CATEGORIES}
          value={charityData?.category || 'veterans'}
          onChange={handleDropdownChange}
          placeholder="Select charity category"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-patriotWhite mb-2">
          Mission Statement *
        </label>
        <textarea
          value={charityData?.missionStatement || ''}
          onChange={handleInputChange('missionStatement')}
          placeholder="Describe the charity's mission and goals"
          className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
        />
        {errors?.missionStatement && (
          <motion.p
            className="text-patriotRed text-sm mt-1"
            variants={getAnimationVariants(formErrorVariants)}
            initial="initial"
            animate="enter"
            exit="exit"
            key={`mission-error-${errors.missionStatement}`}
          >
            {errors.missionStatement}
          </motion.p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-patriotWhite mb-2">
          Veteran Focus *
        </label>
        <textarea
          value={charityData?.veteranFocus || ''}
          onChange={handleInputChange('veteranFocus')}
          placeholder="Explain how this charity specifically serves veterans and military families"
          className="w-full h-24 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
        />
        {errors?.veteranFocus && (
          <p className="text-patriotRed text-sm mt-1">{errors.veteranFocus}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-patriotWhite mb-2">
          Why Add to VMF Directory? *
        </label>
        <textarea
          value={charityData?.impactDescription || ''}
          onChange={handleInputChange('impactDescription')}
          placeholder="Explain why this charity should be added to the VMF directory for holiday voting"
          className="w-full h-32 bg-backgroundLight border border-patriotBlue/30 rounded-lg p-4 text-textBase placeholder-textSecondary resize-none focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent"
        />
        {errors?.impactDescription && (
          <p className="text-patriotRed text-sm mt-1">
            {errors.impactDescription}
          </p>
        )}
      </div>
    </div>
  );
});
