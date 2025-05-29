import { z } from 'zod';

// Proposal validation schema
export const proposalSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&:()]+$/, 'Title contains invalid characters'),

  category: z.string().min(1, 'Please select a category'),

  summary: z
    .string()
    .min(50, 'Summary must be at least 50 characters')
    .max(500, 'Summary must be less than 500 characters'),

  description: z
    .string()
    .min(100, 'Description must be at least 100 characters')
    .max(5000, 'Description must be less than 5000 characters'),

  fundingAmount: z
    .string()
    .regex(/^\$?[\d,]+(\.\d{2})?$/, 'Please enter a valid funding amount')
    .refine(val => {
      const num = parseFloat(val.replace(/[$,]/g, ''));
      return num >= 1000 && num <= 10000000;
    }, 'Funding amount must be between $1,000 and $10,000,000'),

  timeline: z
    .string()
    .min(10, 'Timeline must be at least 10 characters')
    .max(200, 'Timeline must be less than 200 characters'),

  beneficiaries: z
    .string()
    .min(20, 'Beneficiaries description must be at least 20 characters')
    .max(500, 'Beneficiaries description must be less than 500 characters'),
});

// Community post validation schema
export const communityPostSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(150, 'Title must be less than 150 characters'),

  content: z
    .string()
    .min(20, 'Content must be at least 20 characters')
    .max(2000, 'Content must be less than 2000 characters'),

  category: z.enum(['idea', 'discussion', 'feedback', 'announcement'], {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),

  tags: z
    .array(z.string())
    .min(1, 'Please add at least one tag')
    .max(5, 'Maximum 5 tags allowed')
    .refine(
      tags => tags.every(tag => tag.length >= 2 && tag.length <= 20),
      'Each tag must be between 2 and 20 characters'
    ),
});

// User preferences validation schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['patriotic', 'dark', 'light']),

  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    voteReminders: z.boolean(),
    newProposals: z.boolean(),
    communityUpdates: z.boolean(),
  }),

  privacy: z.object({
    showVotingHistory: z.boolean(),
    showProfile: z.boolean(),
    allowDirectMessages: z.boolean(),
  }),

  display: z.object({
    compactMode: z.boolean(),
    showAnimations: z.boolean(),
    autoPlayVideos: z.boolean(),
  }),
});

// Wallet address validation
export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

// ENS name validation
export const ensNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9-]+\.eth$/, 'Invalid ENS name format')
  .min(3, 'ENS name too short')
  .max(50, 'ENS name too long');

// Vote validation
export const voteSchema = z.object({
  proposalId: z.string().uuid('Invalid proposal ID'),
  vote: z.enum(['yes', 'no', 'abstain']),
  votingPower: z.number().min(1, 'Voting power must be at least 1'),
});

// Search query validation
export const searchQuerySchema = z
  .string()
  .max(100, 'Search query too long')
  .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Search query contains invalid characters');

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      file => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      file =>
        ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(
          file.type
        ),
      'File type must be JPEG, PNG, GIF, or PDF'
    ),
});

// Validation utility functions
export const validateProposal = (data: unknown) => {
  return proposalSchema.safeParse(data);
};

export const validateCommunityPost = (data: unknown) => {
  return communityPostSchema.safeParse(data);
};

export const validateUserPreferences = (data: unknown) => {
  return userPreferencesSchema.safeParse(data);
};

export const validateWalletAddress = (address: string) => {
  return walletAddressSchema.safeParse(address);
};

export const validateENSName = (ensName: string) => {
  return ensNameSchema.safeParse(ensName);
};

export const validateVote = (data: unknown) => {
  return voteSchema.safeParse(data);
};

export const validateSearchQuery = (query: string) => {
  return searchQuerySchema.safeParse(query);
};

export const validateFileUpload = (file: File) => {
  return fileUploadSchema.safeParse({ file });
};

// Form error formatting utility
export const formatValidationErrors = (errors: z.ZodError) => {
  const formattedErrors: Record<string, string> = {};

  errors.errors.forEach(error => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });

  return formattedErrors;
};

// Sanitization utilities
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 1000); // Limit length
};

export const sanitizeMarkdown = (markdown: string): string => {
  return markdown
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 5000); // Limit length
};

// Data type guards
export const isValidEthereumAddress = (address: string): boolean => {
  return walletAddressSchema.safeParse(address).success;
};

export const isValidENSName = (ensName: string): boolean => {
  return ensNameSchema.safeParse(ensName).success;
};

export const isValidVoteType = (
  vote: string
): vote is 'yes' | 'no' | 'abstain' => {
  return ['yes', 'no', 'abstain'].includes(vote);
};

// Custom validation rules for VMF-specific logic
export const vmfValidationRules = {
  // Minimum VMF balance required to vote
  minVotingBalance: 100,

  // Minimum VMF balance required to submit proposals
  minProposalBalance: 1000,

  // Maximum proposals per user per month
  maxProposalsPerMonth: 5,

  // Maximum community posts per user per day
  maxPostsPerDay: 10,

  // Validate if user can vote
  canUserVote: (vmfBalance: number): boolean => {
    return vmfBalance >= vmfValidationRules.minVotingBalance;
  },

  // Validate if user can submit proposals
  canUserSubmitProposal: (vmfBalance: number): boolean => {
    return vmfBalance >= vmfValidationRules.minProposalBalance;
  },

  // Validate voting power calculation
  calculateVotingPower: (vmfBalance: number): number => {
    if (vmfBalance < vmfValidationRules.minVotingBalance) return 0;

    // Diminishing returns for large holders
    if (vmfBalance <= 1000) {
      return vmfBalance;
    } else {
      return 1000 + Math.floor(Math.sqrt(vmfBalance - 1000) * 10);
    }
  },
};

export type ProposalFormData = z.infer<typeof proposalSchema>;
export type CommunityPostFormData = z.infer<typeof communityPostSchema>;
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;
export type VoteData = z.infer<typeof voteSchema>;
