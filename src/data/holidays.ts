import { CalendarEvent, MilitaryHoliday } from '@/types';

/**
 * Official VMF Giveaway Holidays
 * These are the holidays when VMF distributes charity giveaway amounts.
 * Voting for these giveaways starts two weeks prior to each holiday.
 */

// Helper function to get the last Monday of May (Memorial Day)
const getMemorialDay = (year: number): Date => {
  const may = new Date(year, 4, 31); // May 31st
  const dayOfWeek = may.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Get to last Monday
  return new Date(year, 4, 31 - daysToSubtract);
};

// Helper function to calculate voting start date (2 weeks before)
const getVotingStartDate = (holidayDate: Date): Date => {
  const votingStart = new Date(holidayDate);
  votingStart.setDate(votingStart.getDate() - 14); // 2 weeks before
  return votingStart;
};

// Helper function to calculate voting end date (1 day before holiday)
const getVotingEndDate = (holidayDate: Date): Date => {
  const votingEnd = new Date(holidayDate);
  votingEnd.setDate(votingEnd.getDate() - 1); // 1 day before holiday
  return votingEnd;
};

/**
 * Generate VMF official holidays for a given year
 */
export const generateVMFHolidays = (year: number): MilitaryHoliday[] => {
  const holidays: MilitaryHoliday[] = [
    {
      id: `medal-of-honor-${year}`,
      name: 'National Medal of Honor Day',
      date: new Date(year, 2, 25), // March 25th
      description: 'Honor recipients of the Medal of Honor',
      significance: 'Recognizes the highest military decoration for valor',
      fundAllocation: 75000,
      isVotingEligible: true,
      flagIcon: '🏅',
      category: 'major',
    },
    {
      id: `memorial-day-${year}`,
      name: 'Memorial Day',
      date: getMemorialDay(year), // Last Monday in May
      description: 'Remember fallen service members',
      significance: 'Honors those who died while serving in the U.S. military',
      fundAllocation: 150000,
      isVotingEligible: true,
      flagIcon: '🇺🇸',
      category: 'major',
    },
    {
      id: `flag-day-${year}`,
      name: 'Flag Day',
      date: new Date(year, 5, 14), // June 14th
      description: 'Celebrate the American flag',
      significance:
        'Commemorates the adoption of the flag of the United States',
      fundAllocation: 50000,
      isVotingEligible: true,
      flagIcon: '🏴',
      category: 'observance',
    },
    {
      id: `independence-day-${year}`,
      name: 'Independence Day',
      date: new Date(year, 6, 4), // July 4th
      description: 'Celebrate American independence',
      significance: 'Commemorates the Declaration of Independence',
      fundAllocation: 200000,
      isVotingEligible: true,
      flagIcon: '🎆',
      category: 'major',
    },
    {
      id: `purple-heart-${year}`,
      name: 'Purple Heart Day',
      date: new Date(year, 7, 7), // August 7th
      description: 'Honor Purple Heart recipients',
      significance: 'Recognizes those wounded or killed in service',
      fundAllocation: 75000,
      isVotingEligible: true,
      flagIcon: '💜',
      category: 'major',
    },
    {
      id: `patriot-day-${year}`,
      name: 'Patriot Day',
      date: new Date(year, 8, 11), // September 11th
      description: 'Remember 9/11 victims and heroes',
      significance: 'Honors those lost in the September 11 attacks',
      fundAllocation: 100000,
      isVotingEligible: true,
      flagIcon: '🕊️',
      category: 'major',
    },
    {
      id: `veterans-day-${year}`,
      name: 'Veterans Day',
      date: new Date(year, 10, 11), // November 11th
      description: 'Honor all veterans',
      significance: 'Originally Armistice Day, commemorating the end of WWI',
      fundAllocation: 150000,
      isVotingEligible: true,
      flagIcon: '🎖️',
      category: 'major',
    },
  ];

  return holidays;
};

/**
 * Generate calendar events for VMF holidays including voting periods
 */
export const generateHolidayCalendarEvents = (
  year: number
): CalendarEvent[] => {
  const holidays = generateVMFHolidays(year);
  const events: CalendarEvent[] = [];

  holidays.forEach(holiday => {
    // Add the holiday event
    events.push({
      id: `holiday-${holiday.id}`,
      title: `${holiday.name} - Giveaway Distribution`,
      date: holiday.date,
      type: 'holiday',
      description: `${holiday.description}. $${holiday.fundAllocation.toLocaleString()} charity giveaway distribution.`,
      isVotingDay: false, // The actual holiday is not a voting day
      flagIcon: holiday.flagIcon,
      priority: holiday.category === 'major' ? 'high' : 'medium',
    });

    // Add voting start event (2 weeks before)
    const votingStart = getVotingStartDate(holiday.date);
    events.push({
      id: `voting-start-${holiday.id}`,
      title: `${holiday.name} Voting Opens`,
      date: votingStart,
      type: 'voting',
      description: `Voting opens for ${holiday.name} charity selection. Choose which charity receives $${holiday.fundAllocation.toLocaleString()}.`,
      isVotingDay: true,
      flagIcon: '📝',
      priority: 'high',
    });

    // Add voting end event (1 day before holiday)
    const votingEnd = getVotingEndDate(holiday.date);
    events.push({
      id: `voting-end-${holiday.id}`,
      title: `${holiday.name} Voting Closes`,
      date: votingEnd,
      type: 'voting',
      description: `Final day to vote for ${holiday.name} charity selection.`,
      isVotingDay: true,
      flagIcon: '⏰',
      priority: 'high',
    });
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Get current year's VMF holidays
 */
export const getCurrentYearHolidays = (): MilitaryHoliday[] => {
  return generateVMFHolidays(new Date().getFullYear());
};

/**
 * Get current year's holiday calendar events
 */
export const getCurrentYearHolidayEvents = (): CalendarEvent[] => {
  return generateHolidayCalendarEvents(new Date().getFullYear());
};

/**
 * Get upcoming holidays (next 12 months)
 */
export const getUpcomingHolidays = (): MilitaryHoliday[] => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const currentYearHolidays = generateVMFHolidays(currentYear);
  const nextYearHolidays = generateVMFHolidays(nextYear);

  const allHolidays = [...currentYearHolidays, ...nextYearHolidays];
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return allHolidays
    .filter(holiday => holiday.date >= now && holiday.date <= oneYearFromNow)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Get upcoming holiday events (next 12 months)
 */
export const getUpcomingHolidayEvents = (): CalendarEvent[] => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const currentYearEvents = generateHolidayCalendarEvents(currentYear);
  const nextYearEvents = generateHolidayCalendarEvents(nextYear);

  const allEvents = [...currentYearEvents, ...nextYearEvents];
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  return allEvents
    .filter(event => event.date >= now && event.date <= oneYearFromNow)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Check if a date is a VMF holiday
 */
export const isVMFHoliday = (date: Date): boolean => {
  const holidays = getCurrentYearHolidays();
  return holidays.some(
    holiday => holiday.date.toDateString() === date.toDateString()
  );
};

/**
 * Get the next upcoming VMF holiday
 */
export const getNextHoliday = (): MilitaryHoliday | null => {
  const upcomingHolidays = getUpcomingHolidays();
  return upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
};

/**
 * Get holidays that need voting (voting period is active or starting soon)
 */
export const getHolidaysNeedingVoting = (): MilitaryHoliday[] => {
  const holidays = getUpcomingHolidays();
  const now = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  return holidays.filter(holiday => {
    const votingStart = getVotingStartDate(holiday.date);
    const votingEnd = getVotingEndDate(holiday.date);

    // Holiday needs voting if:
    // 1. Voting period is currently active (between start and end)
    // 2. Voting starts within the next 2 weeks
    return (
      (now >= votingStart && now <= votingEnd) ||
      (votingStart >= now && votingStart <= twoWeeksFromNow)
    );
  });
};
