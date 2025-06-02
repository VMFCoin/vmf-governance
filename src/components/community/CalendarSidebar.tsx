'use client';

import { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Bell,
  Clock,
  Vote,
  Flag,
} from 'lucide-react';
import { CalendarEvent } from '@/types';
import { Card } from '@/components/ui';

interface CalendarSidebarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarSidebar({
  events,
  onEventClick,
}: CalendarSidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter events for current month
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === currentMonth &&
      eventDate.getFullYear() === currentYear
    );
  });

  // Get upcoming events (next 30 days)
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      const thirtyDaysFromNow = new Date(
        today.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      return eventDate >= today && eventDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventTypeStyles = (type: string) => {
    switch (type) {
      case 'holiday':
        return {
          textColor: 'text-patriotRed',
          bgColor: 'bg-patriotRed/10',
          borderColor: 'border-patriotRed/20',
          icon: Flag,
        };
      case 'voting':
        return {
          textColor: 'text-patriotBlue',
          bgColor: 'bg-patriotBlue/10',
          borderColor: 'border-patriotBlue/20',
          icon: Vote,
        };
      case 'community':
        return {
          textColor: 'text-starGold',
          bgColor: 'bg-starGold/10',
          borderColor: 'border-starGold/20',
          icon: Bell,
        };
      case 'announcement':
        return {
          textColor: 'text-textBase',
          bgColor: 'bg-textBase/10',
          borderColor: 'border-textBase/20',
          icon: Bell,
        };
      default:
        return {
          textColor: 'text-textSecondary',
          bgColor: 'bg-textSecondary/10',
          borderColor: 'border-textSecondary/20',
          icon: Calendar,
        };
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <div className="w-2 h-2 bg-patriotRed rounded-full ring-2 ring-patriotRed/30" />
        );
      case 'medium':
        return (
          <div className="w-2 h-2 bg-starGold rounded-full ring-2 ring-starGold/30" />
        );
      case 'low':
        return (
          <div className="w-2 h-2 bg-textSecondary rounded-full ring-2 ring-textSecondary/30" />
        );
      default:
        return null;
    }
  };

  const formatEventDate = (date: Date) => {
    const today = new Date();
    const eventDate = new Date(date);
    const diffInDays = Math.ceil(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    if (diffInDays < 7) return `In ${diffInDays} days`;
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-patriotBlue" />
            <h3 className="text-lg font-semibold text-patriotWhite">
              DAO Calendar
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 text-textSecondary hover:text-patriotWhite transition-colors rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 text-textSecondary hover:text-patriotWhite transition-colors rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center mb-4">
          <h4 className="text-xl font-bold text-patriotWhite">
            {monthNames[currentMonth]} {currentYear}
          </h4>
        </div>

        {/* Current Month Events */}
        <div className="space-y-2">
          {currentMonthEvents.length > 0 ? (
            currentMonthEvents.map(event => {
              const typeStyles = getEventTypeStyles(event.type);
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className="flex items-center justify-between p-3 rounded-lg bg-backgroundAccent/30 hover:bg-backgroundAccent/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-patriotBlue/20"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{event.flagIcon}</span>
                    <div>
                      <p className="text-sm font-medium text-patriotWhite">
                        {event.title}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getPriorityIndicator(event.priority)}
                    {event.isVotingDay && (
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-patriotWhite border border-patriotBlue/30">
                        <Vote className="w-3 h-3 text-patriotBlue" />
                        <span className="text-xs font-medium text-patriotBlue">
                          Vote
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-textSecondary text-sm text-center py-4">
              No events this month
            </p>
          )}
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="w-5 h-5 text-patriotRed" />
          <h3 className="text-lg font-semibold text-patriotWhite">
            Upcoming Events
          </h3>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map(event => {
            const typeStyles = getEventTypeStyles(event.type);
            const TypeIcon = typeStyles.icon;

            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className={`flex items-start space-x-3 p-3 rounded-lg ${typeStyles.bgColor} border ${typeStyles.borderColor} hover:bg-opacity-80 cursor-pointer transition-all duration-200`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span className="text-xl">{event.flagIcon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-patriotWhite truncate">
                      {event.title}
                    </h4>
                    {getPriorityIndicator(event.priority)}
                  </div>
                  <p className="text-xs text-textSecondary mb-2">
                    {formatEventDate(event.date)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <TypeIcon className={`w-3 h-3 ${typeStyles.textColor}`} />
                      <span
                        className={`text-xs font-medium ${typeStyles.textColor}`}
                      >
                        {event.type.charAt(0).toUpperCase() +
                          event.type.slice(1)}
                      </span>
                    </div>
                    {event.isVotingDay && (
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-patriotWhite border border-patriotBlue/30">
                        <Vote className="w-2.5 h-2.5 text-patriotBlue" />
                        <span className="text-xs font-medium text-patriotBlue">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {upcomingEvents.length === 0 && (
          <p className="text-textSecondary text-sm text-center py-4">
            No upcoming events
          </p>
        )}
      </Card>

      {/* Legend */}
      <Card>
        <h4 className="text-sm font-semibold text-patriotWhite mb-3">Legend</h4>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-textSecondary">Priority Levels</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-patriotRed rounded-full ring-2 ring-patriotRed/30" />
              <span className="text-textSecondary">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-starGold rounded-full ring-2 ring-starGold/30" />
              <span className="text-textSecondary">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-textSecondary rounded-full ring-2 ring-textSecondary/30" />
              <span className="text-textSecondary">Low</span>
            </div>
          </div>
          <div className="border-t border-patriotBlue/20 pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-textSecondary">Event Types</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Flag className="w-3 h-3 text-patriotRed" />
                <span className="text-textSecondary">National Holidays</span>
              </div>
              <div className="flex items-center space-x-2">
                <Vote className="w-3 h-3 text-patriotBlue" />
                <span className="text-textSecondary">Voting Events</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
