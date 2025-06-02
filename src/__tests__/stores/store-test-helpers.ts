import {
  CharitySubmission,
  FeatureSpec,
  Charity,
  MilitaryHoliday,
} from '@/types';

// Mock localStorage for testing
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
};

// Mock Date for consistent testing
export const createMockDate = (
  mockDate: string = '2024-01-15T10:00:00.000Z'
) => {
  const originalDate = Date;
  const mockDateObj = new originalDate(mockDate);

  // @ts-ignore - Mocking Date for testing
  global.Date = jest.fn(() => mockDateObj);
  global.Date.now = jest.fn(() => mockDateObj.getTime());
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;

  return mockDateObj;
};

// Mock crypto.randomUUID for consistent IDs
export const mockRandomUUID = () => {
  let counter = 0;
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: jest.fn(() => `test-uuid-${++counter}`),
    },
    writable: true,
  });
};

// Test data generators
export const createMockCharitySubmission = (
  overrides: Partial<CharitySubmission> = {}
): CharitySubmission => ({
  name: 'Test Veterans Charity',
  description: 'A charity dedicated to helping veterans',
  website: 'https://testcharity.org',
  ein: '12-3456789',
  category: 'veterans',
  contactEmail: 'contact@testcharity.org',
  contactPhone: '555-0123',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
  },
  missionStatement: 'To serve those who served',
  veteranFocus: 'Supporting disabled veterans',
  impactDescription: 'We have helped over 1000 veterans',
  requestedDocuments: [],
  ...overrides,
});

export const createMockFeatureSpec = (
  overrides: Partial<FeatureSpec> = {}
): FeatureSpec => ({
  title: 'Test Platform Feature',
  description: 'A new feature for the platform',
  userStory: 'As a user, I want to test features',
  acceptanceCriteria: ['Feature works correctly', 'Feature is accessible'],
  technicalRequirements: 'React component with TypeScript',
  priority: 'medium',
  estimatedEffort: '2 weeks',
  targetUsers: ['All users'],
  businessValue: 'Improves user experience',
  ...overrides,
});

export const createMockCharity = (
  overrides: Partial<Charity> = {}
): Charity => ({
  id: 'test-charity-1',
  name: 'Test Veterans Charity',
  description: 'A charity for testing',
  website: 'https://testcharity.org',
  ein: '12-3456789',
  category: 'veterans',
  verificationStatus: 'verified',
  impactMetrics: {
    veteransServed: 1000,
    fundingReceived: 500000,
    programs: ['Housing', 'Healthcare'],
  },
  documents: [],
  addedAt: new Date('2024-01-01'),
  verifiedAt: new Date('2024-01-15'),
  ...overrides,
});

export const createMockMilitaryHoliday = (
  overrides: Partial<MilitaryHoliday> = {}
): MilitaryHoliday => ({
  id: 'test-holiday-1',
  name: 'Test Veterans Day',
  date: new Date('2024-11-11'),
  description: 'A day to honor veterans',
  significance: 'Honors all military veterans',
  fundAllocation: 100000,
  isVotingEligible: true,
  flagIcon: '🇺🇸',
  category: 'major',
  ...overrides,
});

// Store state reset helpers
export const resetAllStores = () => {
  // Clear localStorage
  localStorage.clear();

  // Reset any global mocks
  jest.clearAllMocks();
};

// Async test helpers
export const waitForAsync = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Validation helpers
export const expectProposalStructure = (proposal: any) => {
  expect(proposal).toHaveProperty('id');
  expect(proposal).toHaveProperty('type');
  expect(proposal).toHaveProperty('title');
  expect(proposal).toHaveProperty('author');
  expect(proposal).toHaveProperty('status');
  expect(proposal).toHaveProperty('createdAt');
  expect(proposal).toHaveProperty('votingEndsAt');
  expect(proposal).toHaveProperty('votingType');
};

export const expectCharityStructure = (charity: any) => {
  expect(charity).toHaveProperty('id');
  expect(charity).toHaveProperty('name');
  expect(charity).toHaveProperty('description');
  expect(charity).toHaveProperty('website');
  expect(charity).toHaveProperty('ein');
  expect(charity).toHaveProperty('category');
  expect(charity).toHaveProperty('verificationStatus');
};
