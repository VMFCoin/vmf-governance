import React from 'react';
import { motion } from 'framer-motion';
import { fadeInVariants } from '@/lib/animations';
import { HelpTooltip } from './HelpTooltip';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  helpText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {helpText && <HelpTooltip content={helpText} />}
      </div>
      {children}
      {error && (
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};
