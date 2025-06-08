'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Trophy,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { VMFNotification } from '@/services/notificationService';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  notification: VMFNotification;
  onClose: () => void;
  onAction?: () => void;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
  duration = 5000,
  position = 'top-right',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-close timer
  useEffect(() => {
    if (duration <= 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - 100 / (duration / 100);
        if (newProgress <= 0) {
          setIsVisible(false);
          setTimeout(onClose, 300); // Allow exit animation
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  // Get notification icon
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'holiday_proposal':
        return <Trophy className="w-5 h-5 text-starGold" />;
      case 'voting_reminder':
        return <Clock className="w-5 h-5 text-patriotRed" />;
      case 'proposal_result':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'live_update':
        return <TrendingUp className="w-5 h-5 text-patriotBlue" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-starGold" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get priority styling
  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-patriotRed bg-patriotRed/5';
      case 'medium':
        return 'border-l-starGold bg-starGold/5';
      case 'low':
        return 'border-l-gray-400 bg-gray-400/5';
      default:
        return 'border-l-patriotBlue bg-patriotBlue/5';
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Animation variants
  const slideVariants = {
    initial: {
      opacity: 0,
      x: position.includes('right') ? 100 : -100,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: position.includes('right') ? 100 : -100,
      scale: 0.8,
    },
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('fixed z-50 w-96 max-w-sm', getPositionClasses())}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          <div
            className={cn(
              'bg-backgroundDark/95 backdrop-blur-lg border-l-4 border border-white/20 rounded-lg shadow-2xl overflow-hidden',
              getPriorityStyles()
            )}
          >
            {/* Progress bar */}
            {duration > 0 && (
              <div className="h-1 bg-white/10">
                <motion.div
                  className="h-full bg-patriotBlue"
                  initial={{ width: '100%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-semibold text-white truncate pr-2">
                      {notification.title}
                    </h4>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="p-1 text-gray-400 hover:text-white flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Action button */}
                  {(notification.actionUrl || onAction) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAction}
                      className="mt-3 text-xs text-patriotBlue hover:text-white hover:bg-patriotBlue/20 p-2 h-auto"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast container component for managing multiple toasts
interface NotificationToastContainerProps {
  notifications: VMFNotification[];
  onRemove: (id: string) => void;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationToastContainer: React.FC<
  NotificationToastContainerProps
> = ({ notifications, onRemove, maxToasts = 3, position = 'top-right' }) => {
  // Show only the most recent toasts
  const visibleToasts = notifications.slice(0, maxToasts);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {visibleToasts.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 110}px)`,
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemove(notification.id)}
            position={position}
            duration={5000}
          />
        </div>
      ))}
    </div>
  );
};
