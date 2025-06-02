import { Charity, CharityStats, CharityCategory } from '@/types';

export const charities: Charity[] = [
  {
    id: 'patriots-promise',
    name: "Patriot's Promise",
    website: 'https://www.patriots-promise.com/',
    logo: '/images/PatriotsPromise.jpeg',
    mission:
      'Supporting veterans and their families through comprehensive programs',
    description:
      "Patriot's Promise is dedicated to providing comprehensive support to veterans and their families through various programs and services.",
    category: 'general_support',
    impactMetrics: {
      veteransServed: 15000,
      yearsOfService: 8,
      fundingReceived: 25000000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-01-15'),
      taxId: '12-3456789',
    },
    tags: [
      'Veteran Support',
      'Family Services',
      'Community Programs',
      'Comprehensive Care',
    ],
    featured: true,
    establishedYear: 2015,
    location: {
      city: 'Various',
      state: 'Nationwide',
      country: 'USA',
    },
  },
  {
    id: 'honor-her-foundation',
    name: 'Honor HER Foundation',
    website: 'https://www.honorher.org/',
    logo: '/images/HonorHer.jpg',
    mission: 'Empowering women veterans through support and advocacy',
    description:
      'Honor HER Foundation is dedicated to empowering women veterans through comprehensive support programs and advocacy initiatives.',
    category: 'general_support',
    impactMetrics: {
      veteransServed: 8500,
      yearsOfService: 6,
      fundingReceived: 12000000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-02-20'),
      taxId: '23-4567890',
    },
    tags: ['Women Veterans', 'Empowerment', 'Advocacy', 'Support Programs'],
    featured: true,
    establishedYear: 2017,
    location: {
      city: 'Various',
      state: 'Nationwide',
      country: 'USA',
    },
  },
  {
    id: 'holy-family-village',
    name: 'Holy Family Village',
    website: 'https://holyfamilyvillage.org/',
    logo: '/images/HolyFamilyVillage.jpeg',
    mission: 'Providing housing and support services for veterans and families',
    description:
      'Holy Family Village provides transitional housing and comprehensive support services for veterans and their families in need.',
    category: 'veteran_housing',
    impactMetrics: {
      veteransServed: 2500,
      yearsOfService: 12,
      fundingReceived: 18000000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-03-10'),
      taxId: '34-5678901',
    },
    tags: [
      'Transitional Housing',
      'Family Support',
      'Comprehensive Services',
      'Community Care',
    ],
    featured: true,
    establishedYear: 2011,
    location: {
      city: 'Various',
      state: 'Regional',
      country: 'USA',
    },
  },
  {
    id: 'veterans-in-need-project',
    name: 'Veterans In Need Project',
    website: 'https://veteransinneedproject.org/',
    logo: '/images/VeteransInNeedProject.jpeg',
    mission: 'Addressing immediate needs of veterans in crisis',
    description:
      'Veterans In Need Project focuses on providing immediate assistance to veterans facing crisis situations and urgent needs.',
    category: 'general_support',
    impactMetrics: {
      veteransServed: 12000,
      yearsOfService: 10,
      fundingReceived: 8500000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-01-25'),
      taxId: '45-6789012',
    },
    tags: [
      'Crisis Support',
      'Emergency Assistance',
      'Immediate Needs',
      'Veteran Care',
    ],
    featured: false,
    establishedYear: 2013,
    location: {
      city: 'Various',
      state: 'Regional',
      country: 'USA',
    },
  },
  {
    id: 'victory-for-veterans',
    name: 'Victory For Veterans',
    website: 'https://www.victoryforveterans.org/',
    logo: '/images/VictoryForVeterans.jpeg',
    mission: 'Achieving victories for veterans through advocacy and support',
    description:
      'Victory For Veterans works to achieve meaningful victories for veterans through advocacy, support programs, and community engagement.',
    category: 'general_support',
    impactMetrics: {
      veteransServed: 18500,
      yearsOfService: 9,
      fundingReceived: 22000000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-04-05'),
      taxId: '56-7890123',
    },
    tags: [
      'Advocacy',
      'Support Programs',
      'Community Engagement',
      'Veteran Rights',
    ],
    featured: false,
    establishedYear: 2014,
    location: {
      city: 'Various',
      state: 'Nationwide',
      country: 'USA',
    },
  },
  {
    id: 'camp-cowboy',
    name: 'Camp Cowboy',
    website: 'https://campcowboy.org/',
    logo: '/images/CampCowboy.jpeg',
    mission: 'Providing therapeutic outdoor experiences for veterans',
    description:
      'Camp Cowboy offers therapeutic outdoor experiences and recreational programs designed to support veteran healing and community building.',
    category: 'mental_health',
    impactMetrics: {
      veteransServed: 3500,
      yearsOfService: 7,
      fundingReceived: 5500000,
    },
    verification: {
      is501c3: true,
      verifiedDate: new Date('2023-02-15'),
      taxId: '67-8901234',
    },
    tags: ['Outdoor Therapy', 'Recreation', 'Healing', 'Community Building'],
    featured: false,
    establishedYear: 2016,
    location: {
      city: 'Various',
      state: 'Regional',
      country: 'USA',
    },
  },
];

export const getCharityStats = (): CharityStats => {
  const totalVeteransServed = charities.reduce(
    (sum, charity) => sum + charity.impactMetrics.veteransServed,
    0
  );

  const totalFundingDistributed = charities.reduce(
    (sum, charity) => sum + charity.impactMetrics.fundingReceived,
    0
  );

  const categoriesSupported = new Set(
    charities.map(charity => charity.category)
  ).size;

  return {
    totalCharities: charities.length,
    totalVeteransServed,
    totalFundingDistributed,
    categoriesSupported,
  };
};

export const getFeaturedCharities = (): Charity[] => {
  return charities.filter(charity => charity.featured);
};

export const getCharitiesByCategory = (category: string): Charity[] => {
  return charities.filter(charity => charity.category === category);
};

export const searchCharities = (query: string): Charity[] => {
  const lowercaseQuery = query.toLowerCase();
  return charities.filter(
    charity =>
      charity.name.toLowerCase().includes(lowercaseQuery) ||
      charity.mission.toLowerCase().includes(lowercaseQuery) ||
      charity.description.toLowerCase().includes(lowercaseQuery) ||
      charity.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getCategoryDisplayName = (category: CharityCategory): string => {
  const displayNames: Record<CharityCategory, string> = {
    disabled_veterans: 'Disabled Veterans',
    military_families: 'Military Families',
    veteran_housing: 'Veteran Housing',
    mental_health: 'Mental Health',
    education: 'Education',
    employment: 'Employment',
    general_support: 'General Support',
  };

  return displayNames[category];
};
