import {
  Proposal,
  Holiday,
  CommunityPost,
  CalendarEvent,
  Notification,
  Charity,
  MilitaryHoliday,
  HolidayCharityProposal,
  CharityDirectoryProposal,
  PlatformFeatureProposal,
  LegacyProposal,
} from '../types';

// Mock Charities Data
export const mockCharities: Charity[] = [
  {
    id: 'charity-1',
    name: 'Wounded Warrior Project',
    description:
      'Supporting wounded veterans and their families with programs and services.',
    website: 'https://www.woundedwarriorproject.org',
    ein: '20-2370934',
    category: 'disabled_veterans',
    verificationStatus: 'verified',
    impactMetrics: {
      veteransServed: 200000,
      fundingReceived: 350000000,
      programs: ['Mental Health', 'Career Counseling', 'Long-term Support'],
    },
    documents: [
      {
        type: '501c3',
        url: '/documents/wwp-501c3.pdf',
        uploadedAt: new Date('2024-01-01'),
      },
      {
        type: 'financial_report',
        url: '/documents/wwp-financial-2023.pdf',
        uploadedAt: new Date('2024-01-15'),
      },
    ],
    addedAt: new Date('2023-01-01'),
    verifiedAt: new Date('2023-01-15'),
  },
  {
    id: 'charity-2',
    name: 'Team Rubicon',
    description:
      'Uniting military veterans with first responders to rapidly deploy emergency response teams.',
    website: 'https://teamrubiconusa.org',
    ein: '27-2265587',
    category: 'veterans',
    verificationStatus: 'verified',
    impactMetrics: {
      veteransServed: 150000,
      fundingReceived: 75000000,
      programs: ['Disaster Relief', 'Community Impact', 'Veteran Integration'],
    },
    documents: [
      {
        type: '501c3',
        url: '/documents/tr-501c3.pdf',
        uploadedAt: new Date('2024-01-01'),
      },
    ],
    addedAt: new Date('2023-02-01'),
    verifiedAt: new Date('2023-02-15'),
  },
  {
    id: 'charity-3',
    name: 'Operation Homefront',
    description: 'Building strong, stable, and secure military families.',
    website: 'https://www.operationhomefront.org',
    ein: '20-0655443',
    category: 'military_families',
    verificationStatus: 'verified',
    impactMetrics: {
      veteransServed: 100000,
      fundingReceived: 45000000,
      programs: ['Financial Assistance', 'Housing', 'Family Support'],
    },
    documents: [
      {
        type: '501c3',
        url: '/documents/oh-501c3.pdf',
        uploadedAt: new Date('2024-01-01'),
      },
    ],
    addedAt: new Date('2023-03-01'),
    verifiedAt: new Date('2023-03-15'),
  },
  {
    id: 'charity-4',
    name: 'Veterans Community Living Centers',
    description:
      'Providing housing and support services for homeless veterans.',
    website: 'https://www.vclc.org',
    ein: '95-3567890',
    category: 'general_support',
    verificationStatus: 'verified',
    impactMetrics: {
      veteransServed: 5000,
      fundingReceived: 12000000,
      programs: ['Housing', 'Job Training', 'Mental Health Support'],
    },
    documents: [
      {
        type: '501c3',
        url: '/documents/vclc-501c3.pdf',
        uploadedAt: new Date('2024-01-01'),
      },
    ],
    addedAt: new Date('2023-04-01'),
    verifiedAt: new Date('2023-04-15'),
  },
];

// Mock Military Holidays Data
export const mockMilitaryHolidays: MilitaryHoliday[] = [
  {
    id: 'holiday-1',
    name: 'Veterans Day',
    date: new Date('2024-11-11'),
    description: 'A day to honor all military veterans',
    significance:
      'Originally called Armistice Day, commemorating the end of World War I',
    fundAllocation: 100000,
    isVotingEligible: true,
    flagIcon: '🇺🇸',
    category: 'major',
  },
  {
    id: 'holiday-2',
    name: 'Memorial Day',
    date: new Date('2024-05-27'),
    description: 'A day to remember fallen service members',
    significance: 'Honors those who died while serving in the U.S. military',
    fundAllocation: 150000,
    isVotingEligible: true,
    flagIcon: '🇺🇸',
    category: 'major',
  },
  {
    id: 'holiday-3',
    name: 'Armed Forces Day',
    date: new Date('2024-05-18'),
    description: 'A day to honor current military service members',
    significance: 'Celebrates all branches of the U.S. Armed Forces',
    fundAllocation: 75000,
    isVotingEligible: true,
    flagIcon: '⭐',
    category: 'major',
  },
  {
    id: 'holiday-4',
    name: 'Purple Heart Day',
    date: new Date('2024-08-07'),
    description: 'Honors Purple Heart recipients',
    significance: 'Recognizes those wounded or killed in service',
    fundAllocation: 50000,
    isVotingEligible: true,
    flagIcon: '💜',
    category: 'observance',
  },
  {
    id: 'holiday-5',
    name: 'National Medal of Honor Day',
    date: new Date('2024-03-25'),
    description: 'Honors Medal of Honor recipients',
    significance: 'Recognizes the highest military decoration',
    fundAllocation: 75000,
    isVotingEligible: true,
    flagIcon: '🏅',
    category: 'observance',
  },
];

// Mock Proposals Data - Updated for new type system
const holidayCharityProposals: HolidayCharityProposal[] = [
  {
    id: 'hcp-veterans-day-2024',
    type: 'holiday_charity',
    title: 'Veterans Day 2024 - Charity Selection',
    author: 'system',
    status: 'active',
    timeLeft: '2 days left',
    yesPercentage: 0,
    noPercentage: 0,
    abstainPercentage: 0,
    description:
      'Select which charity will receive $100,000 in funding for Veterans Day 2024.',
    createdAt: new Date('2024-01-10'),
    votingEndsAt: new Date('2024-01-25'),
    holidayId: 'holiday-1',
    availableCharities: ['charity-1', 'charity-2', 'charity-3'],
    isAutoGenerated: true,
    fundAmount: 100000,
    votingType: 'charity_selection',
  },
];

const charityDirectoryProposals: CharityDirectoryProposal[] = [
  {
    id: 'cdp-fisher-house-2024',
    type: 'charity_directory',
    title: 'Add "Fisher House Foundation" to VMF Charity Directory',
    author: 'veteran.eth',
    status: 'active',
    timeLeft: '5 days left',
    yesPercentage: 72,
    noPercentage: 18,
    abstainPercentage: 10,
    description:
      'Proposal to add Fisher House Foundation to our approved charity directory. They provide comfort homes for military families.',
    createdAt: new Date('2024-01-08'),
    votingEndsAt: new Date('2024-01-22'),
    charityData: {
      name: 'Fisher House Foundation',
      description:
        'Provides comfort homes for military families during medical treatment',
      website: 'https://www.fisherhouse.org',
      ein: '11-3158401',
      category: 'military_families',
      contactEmail: 'info@fisherhouse.org',
      contactPhone: '(888) 294-8560',
      address: {
        street: '12300 Twinbrook Parkway',
        city: 'Rockville',
        state: 'MD',
        zipCode: '20852',
      },
      missionStatement:
        'Providing comfort homes for military families during medical treatment',
      veteranFocus:
        'Supporting families of wounded, ill, and injured service members',
      impactDescription:
        'Over 8 million days of lodging provided to military families',
      requestedDocuments: [],
    },
    verificationDocuments: [],
    isAutoGenerated: false,
    votingType: 'approval',
  },
];

const platformFeatureProposals: PlatformFeatureProposal[] = [
  {
    id: 'pfp-mobile-app-2024',
    type: 'platform_feature',
    title: 'VMF Mobile Application Development',
    author: 'developer.eth',
    status: 'active',
    timeLeft: '8 days left',
    yesPercentage: 68,
    noPercentage: 22,
    abstainPercentage: 10,
    description:
      'Proposal to develop a native mobile application for iOS and Android to improve accessibility and user engagement.',
    createdAt: new Date('2024-01-05'),
    votingEndsAt: new Date('2024-01-19'),
    featureSpecification: {
      title: 'VMF Mobile Application',
      description:
        'Native mobile app for iOS and Android with full voting and community features',
      userStory:
        'As a VMF token holder, I want to access the platform from my mobile device so that I can participate in governance on the go',
      acceptanceCriteria: [
        'Native iOS and Android applications',
        'Full voting functionality',
        'Push notifications for new proposals',
        'Biometric authentication support',
        'Offline proposal viewing',
      ],
      technicalRequirements:
        'React Native framework, Web3 wallet integration, push notification service',
      priority: 'high',
      estimatedEffort: '3-4 months',
      targetUsers: ['Mobile users', 'Active voters', 'Community members'],
      businessValue: 'Increase participation rates and user engagement',
    },
    implementationComplexity: 'medium',
    estimatedDevelopmentTime: '3-4 months',
    isAutoGenerated: false,
    votingType: 'approval',
  },
];

// Legacy proposals (converted to new type system)
const legacyProposals: LegacyProposal[] = [
  {
    id: 'legacy-quarterly-2024',
    type: 'legacy',
    title: 'Quarterly Charity Funding Allocation',
    author: 'patriot.eth',
    status: 'passed',
    timeLeft: 'Completed',
    yesPercentage: 78,
    noPercentage: 15,
    abstainPercentage: 7,
    description:
      'Approved quarterly funding allocation of $200,000 to be distributed among top-voted charities.',
    createdAt: new Date('2023-12-01'),
    votingEndsAt: new Date('2023-12-15'),
    isAutoGenerated: false,
    votingType: 'approval',
  },
  {
    id: 'legacy-governance-2023',
    type: 'legacy',
    title: 'Platform Governance Structure Update',
    author: 'founder.eth',
    status: 'passed',
    timeLeft: 'Completed',
    yesPercentage: 85,
    noPercentage: 10,
    abstainPercentage: 5,
    description:
      'Implemented new governance structure with improved proposal types and voting mechanisms.',
    createdAt: new Date('2023-11-01'),
    votingEndsAt: new Date('2023-11-15'),
    isAutoGenerated: false,
    votingType: 'approval',
  },
];

// Combined proposals array
export const mockProposals: Proposal[] = [
  ...holidayCharityProposals,
  ...charityDirectoryProposals,
  ...platformFeatureProposals,
  ...legacyProposals,
];

export const mockHolidays: Holiday[] = [
  {
    id: '1',
    name: 'National Medal of Honor Day',
    date: new Date('2024-03-25'),
    isVotingDay: true,
    description: 'Honor recipients of the Medal of Honor',
  },
  {
    id: '2',
    name: 'Memorial Day',
    date: new Date('2024-05-27'),
    isVotingDay: true,
    description: 'Remember fallen service members',
  },
  {
    id: '3',
    name: 'Flag Day',
    date: new Date('2024-06-14'),
    isVotingDay: false,
    description: 'Celebrate the American flag',
  },
  {
    id: '4',
    name: 'Independence Day',
    date: new Date('2024-07-04'),
    isVotingDay: true,
    description: 'Celebrate American independence',
  },
  {
    id: '5',
    name: 'Purple Heart Day',
    date: new Date('2024-08-07'),
    isVotingDay: true,
    description: 'Honor Purple Heart recipients',
  },
  {
    id: '6',
    name: 'Patriot Day',
    date: new Date('2024-09-11'),
    isVotingDay: false,
    description: 'Remember 9/11 victims and heroes',
  },
  {
    id: '7',
    name: 'Veterans Day',
    date: new Date('2024-11-11'),
    isVotingDay: true,
    description: 'Honor all veterans',
  },
];

// Community Posts Mock Data
export const mockCommunityPosts: CommunityPost[] = [
  {
    id: '1',
    title: 'Mobile App for VMF Voice Platform',
    content:
      'We should develop a mobile app to make voting more accessible for veterans who primarily use smartphones. This would increase participation and engagement.',
    author: 'TechVet',
    authorAddress: '0x1234...5678',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    upvotes: 47,
    downvotes: 3,
    category: 'idea',
    tags: ['mobile', 'accessibility', 'technology'],
    isPromoted: true,
    userVote: null,
  },
  {
    id: '2',
    title: 'Quarterly Community Meetups',
    content:
      'Proposal to organize quarterly in-person meetups in major cities to strengthen the VMF community and discuss upcoming proposals face-to-face.',
    author: 'CommunityBuilder',
    authorAddress: '0xabcd...efgh',
    createdAt: new Date('2024-01-14T14:20:00Z'),
    upvotes: 32,
    downvotes: 8,
    category: 'discussion',
    tags: ['community', 'meetups', 'networking'],
    isPromoted: false,
    userVote: 'up',
  },
  {
    id: '3',
    title: 'Feedback on New Voting Interface',
    content:
      'The new voting interface is much cleaner! However, I think we could add more visual feedback when votes are submitted. Maybe some patriotic animations?',
    author: 'UIExpert',
    authorAddress: '0x9876...5432',
    createdAt: new Date('2024-01-13T09:15:00Z'),
    upvotes: 28,
    downvotes: 2,
    category: 'feedback',
    tags: ['ui', 'voting', 'animations'],
    isPromoted: false,
    userVote: null,
  },
  {
    id: '4',
    title: 'Partnership with Veterans Organizations',
    content:
      'We should reach out to established veterans organizations like VFW and American Legion to expand our reach and impact.',
    author: 'NetworkingPro',
    authorAddress: '0xfedc...ba98',
    createdAt: new Date('2024-01-12T16:45:00Z'),
    upvotes: 56,
    downvotes: 1,
    category: 'idea',
    tags: ['partnerships', 'outreach', 'veterans'],
    isPromoted: true,
    userVote: 'up',
  },
  {
    id: '5',
    title: 'New Proposal Categories Needed',
    content:
      'I think we need more specific categories for proposals. Maybe separate categories for mental health, housing, and employment initiatives?',
    author: 'CategoryGuru',
    authorAddress: '0x1111...2222',
    createdAt: new Date('2024-01-11T11:30:00Z'),
    upvotes: 19,
    downvotes: 5,
    category: 'feedback',
    tags: ['proposals', 'categories', 'organization'],
    isPromoted: false,
    userVote: null,
  },
];

// Calendar Events Mock Data
export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'National Medal of Honor Day',
    date: new Date('2024-03-25'),
    type: 'holiday',
    description: 'Honor recipients of the Medal of Honor',
    isVotingDay: true,
    flagIcon: '🏅',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Q1 Community Proposal Deadline',
    date: new Date('2024-03-31'),
    type: 'voting',
    description: 'Last day to submit proposals for Q1 voting cycle',
    isVotingDay: false,
    flagIcon: '📝',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Memorial Day',
    date: new Date('2024-05-27'),
    type: 'holiday',
    description: 'Remember fallen service members',
    isVotingDay: true,
    flagIcon: '🇺🇸',
    priority: 'high',
  },
  {
    id: '4',
    title: 'Community Meetup - NYC',
    date: new Date('2024-06-01'),
    type: 'community',
    description: 'In-person community meetup in New York City',
    isVotingDay: false,
    flagIcon: '🤝',
    priority: 'medium',
  },
  {
    id: '5',
    title: 'Flag Day',
    date: new Date('2024-06-14'),
    type: 'holiday',
    description: 'Celebrate the American flag',
    isVotingDay: false,
    flagIcon: '🏴',
    priority: 'medium',
  },
  {
    id: '6',
    title: 'Independence Day Voting Event',
    date: new Date('2024-07-04'),
    type: 'voting',
    description: 'Special Independence Day voting on patriotic initiatives',
    isVotingDay: true,
    flagIcon: '🎆',
    priority: 'high',
  },
  {
    id: '7',
    title: 'Purple Heart Day',
    date: new Date('2024-08-07'),
    type: 'holiday',
    description: 'Honor Purple Heart recipients',
    isVotingDay: true,
    flagIcon: '💜',
    priority: 'high',
  },
  {
    id: '8',
    title: 'Platform Update Announcement',
    date: new Date('2024-08-15'),
    type: 'announcement',
    description: 'Major platform updates and new features release',
    isVotingDay: false,
    flagIcon: '📢',
    priority: 'medium',
  },
  {
    id: '9',
    title: 'Patriot Day',
    date: new Date('2024-09-11'),
    type: 'holiday',
    description: 'Remember 9/11 victims and heroes',
    isVotingDay: false,
    flagIcon: '🕊️',
    priority: 'high',
  },
  {
    id: '10',
    title: 'Veterans Day',
    date: new Date('2024-11-11'),
    type: 'holiday',
    description: 'Honor all veterans',
    isVotingDay: true,
    flagIcon: '🎖️',
    priority: 'high',
  },
];

// Notifications Mock Data
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user1',
    type: 'vote_reminder',
    title: 'Voting Reminder',
    message:
      'Don\'t forget to vote on "Charity Selection for 2024" - ends in 2 days!',
    isRead: false,
    createdAt: new Date('2024-01-15T08:00:00Z'),
    actionUrl: '/proposal/1',
  },
  {
    id: '2',
    userId: 'user1',
    type: 'new_proposal',
    title: 'New Proposal',
    message:
      'A new proposal "Mental Health Support Initiative" has been submitted for review.',
    isRead: false,
    createdAt: new Date('2024-01-14T16:30:00Z'),
    actionUrl: '/proposal/4',
  },
  {
    id: '3',
    userId: 'user1',
    type: 'community_post',
    title: 'Popular Community Post',
    message:
      'The post "Mobile App for VMF Voice Platform" is trending with 47 upvotes!',
    isRead: true,
    createdAt: new Date('2024-01-13T12:15:00Z'),
    actionUrl: '/community',
  },
  {
    id: '4',
    userId: 'user1',
    type: 'event_reminder',
    title: 'Upcoming Event',
    message:
      'Memorial Day voting event starts in 3 days. Prepare your proposals!',
    isRead: true,
    createdAt: new Date('2024-01-12T10:00:00Z'),
    actionUrl: '/community',
  },
];
