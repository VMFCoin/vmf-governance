import {
  proposalSchema,
  communityPostSchema,
  userPreferencesSchema,
  validateProposal,
  validateCommunityPost,
  isValidEthereumAddress,
} from '@/lib/validation';

describe('Validation', () => {
  describe('proposalSchema', () => {
    it('validates correct proposal data', () => {
      const validProposal = {
        title: 'Test Proposal for Community',
        category: 'governance',
        summary:
          'This is a test proposal summary that is long enough to meet the minimum requirements',
        description:
          'This is a test proposal description that is long enough to meet the minimum requirements for the description field which needs to be at least 100 characters long',
        fundingAmount: '$50,000',
        timeline: '6 months implementation',
        beneficiaries:
          'This proposal will benefit the entire VMF community by improving governance processes',
      };

      const result = proposalSchema.safeParse(validProposal);
      expect(result.success).toBe(true);
    });

    it('rejects proposal with short title', () => {
      const invalidProposal = {
        title: 'Short',
        category: 'governance',
        summary:
          'This is a test proposal summary that is long enough to meet the minimum requirements',
        description:
          'This is a test proposal description that is long enough to meet the minimum requirements for the description field which needs to be at least 100 characters long',
        fundingAmount: '$50,000',
        timeline: '6 months implementation',
        beneficiaries:
          'This proposal will benefit the entire VMF community by improving governance processes',
      };

      const result = proposalSchema.safeParse(invalidProposal);
      expect(result.success).toBe(false);
    });

    it('rejects proposal with short description', () => {
      const invalidProposal = {
        title: 'Valid Title for Test',
        category: 'governance',
        summary:
          'This is a test proposal summary that is long enough to meet the minimum requirements',
        description: 'Short description',
        fundingAmount: '$50,000',
        timeline: '6 months implementation',
        beneficiaries:
          'This proposal will benefit the entire VMF community by improving governance processes',
      };

      const result = proposalSchema.safeParse(invalidProposal);
      expect(result.success).toBe(false);
    });

    it('rejects proposal with invalid funding amount', () => {
      const invalidProposal = {
        title: 'Valid Title for Test',
        category: 'governance',
        summary:
          'This is a test proposal summary that is long enough to meet the minimum requirements',
        description:
          'This is a test proposal description that is long enough to meet the minimum requirements for the description field which needs to be at least 100 characters long',
        fundingAmount: '$100',
        timeline: '6 months implementation',
        beneficiaries:
          'This proposal will benefit the entire VMF community by improving governance processes',
      };

      const result = proposalSchema.safeParse(invalidProposal);
      expect(result.success).toBe(false);
    });
  });

  describe('communityPostSchema', () => {
    it('validates correct community post data', () => {
      const validPost = {
        title: 'Test Community Post',
        content:
          'This is test content for a community post that meets the minimum length',
        category: 'idea' as const,
        tags: ['test', 'community'],
      };

      const result = communityPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('rejects post with empty title', () => {
      const invalidPost = {
        title: '',
        content: 'Valid content that meets minimum length requirements',
        category: 'idea' as const,
        tags: ['test'],
      };

      const result = communityPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('rejects post with short content', () => {
      const invalidPost = {
        title: 'Valid Title',
        content: 'Short',
        category: 'idea' as const,
        tags: ['test'],
      };

      const result = communityPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('rejects post with invalid category', () => {
      const invalidPost = {
        title: 'Valid Title',
        content: 'Valid content that meets minimum length requirements',
        category: 'invalid-category',
        tags: ['test'],
      };

      const result = communityPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });
  });

  describe('userPreferencesSchema', () => {
    it('validates correct user preferences data', () => {
      const validPreferences = {
        theme: 'patriotic' as const,
        notifications: {
          email: true,
          push: false,
          voteReminders: true,
          newProposals: true,
          communityUpdates: false,
        },
        privacy: {
          showVotingHistory: true,
          showProfile: true,
          allowDirectMessages: false,
        },
        display: {
          compactMode: false,
          showAnimations: true,
          autoPlayVideos: false,
        },
      };

      const result = userPreferencesSchema.safeParse(validPreferences);
      expect(result.success).toBe(true);
    });

    it('rejects preferences with invalid theme', () => {
      const invalidPreferences = {
        theme: 'invalid-theme',
        notifications: {
          email: true,
          push: false,
          voteReminders: true,
          newProposals: true,
          communityUpdates: false,
        },
        privacy: {
          showVotingHistory: true,
          showProfile: true,
          allowDirectMessages: false,
        },
        display: {
          compactMode: false,
          showAnimations: true,
          autoPlayVideos: false,
        },
      };

      const result = userPreferencesSchema.safeParse(invalidPreferences);
      expect(result.success).toBe(false);
    });
  });

  describe('validateProposal', () => {
    it('returns validation result for valid proposal', () => {
      const validProposal = {
        title: 'Test Proposal for Community',
        category: 'governance',
        summary:
          'This is a test proposal summary that is long enough to meet the minimum requirements',
        description:
          'This is a test proposal description that is long enough to meet the minimum requirements for the description field which needs to be at least 100 characters long',
        fundingAmount: '$50,000',
        timeline: '6 months implementation',
        beneficiaries:
          'This proposal will benefit the entire VMF community by improving governance processes',
      };

      const result = validateProposal(validProposal);
      expect(result.success).toBe(true);
    });

    it('returns validation errors for invalid proposal', () => {
      const invalidProposal = {
        title: 'Hi',
        category: '',
        summary: 'Short',
        description: 'Short',
        fundingAmount: '$100',
        timeline: '',
        beneficiaries: '',
      };

      const result = validateProposal(invalidProposal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateCommunityPost', () => {
    it('returns validation result for valid post', () => {
      const validPost = {
        title: 'Test Post',
        content:
          'This is test content that meets the minimum length requirements',
        category: 'idea',
        tags: ['test'],
      };

      const result = validateCommunityPost(validPost);
      expect(result.success).toBe(true);
    });

    it('returns validation errors for invalid post', () => {
      const invalidPost = {
        title: '',
        content: '',
        category: 'invalid',
        tags: [],
      };

      const result = validateCommunityPost(invalidPost);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('isValidEthereumAddress', () => {
    it('validates correct Ethereum addresses', () => {
      expect(
        isValidEthereumAddress('0x1234567890123456789012345678901234567890')
      ).toBe(true);
    });

    it('rejects invalid addresses', () => {
      expect(isValidEthereumAddress('invalid')).toBe(false);
      expect(isValidEthereumAddress('0x123')).toBe(false);
      expect(
        isValidEthereumAddress('1234567890123456789012345678901234567890')
      ).toBe(false);
    });
  });
});
