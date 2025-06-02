'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  Building,
  Shield,
  Heart,
  ImageIcon,
} from 'lucide-react';
import { Charity } from '@/types';
import { Button, Card } from '@/components/ui';
import { getCategoryDisplayName } from '@/data/charities';
import { cn } from '@/lib/utils';

interface CharityCardProps {
  charity: Charity;
  onViewImpact?: (charity: Charity) => void;
  className?: string;
}

// Image mapping for charity logos
const getCharityImagePath = (charityId: string): string => {
  const imageMap: Record<string, string> = {
    'patriots-promise': '/images/PatriotsPromise.jpeg',
    'honor-her-foundation': '/images/HonorHer.jpg',
    'holy-family-village': '/images/HolyFamilyVillage.jpeg',
    'veterans-in-need-project': '/images/VeteransInNeedProject.jpeg',
    'victory-for-veterans': '/images/VictoryForVeterans.jpeg',
    'camp-cowboy': '/images/CampCowboy.jpeg',
  };

  return imageMap[charityId] || '/images/charities/default-charity.svg';
};

export const CharityCard: React.FC<CharityCardProps> = ({
  charity,
  onViewImpact,
  className,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const imagePath = getCharityImagePath(charity.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('group h-full', className)}
      whileHover={{ y: -4 }}
    >
      <Card className="h-full overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-patriotBlue/30 hover:border-patriotBlue/60 bg-backgroundLight/95 backdrop-blur-sm">
        {/* Enhanced Charity Logo Section */}
        <div className="relative h-52 bg-gradient-to-br from-patriotBlue/20 via-backgroundAccent/30 to-patriotRed/20 overflow-hidden">
          <div className="absolute inset-0 bg-backgroundDark/20" />

          {/* Logo Container */}
          <div className="relative h-full flex items-center justify-center p-8">
            <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-patriotWhite shadow-xl ring-2 ring-patriotWhite/20 group-hover:ring-patriotBlue/40 transition-all duration-300">
              {!imageError ? (
                <>
                  <Image
                    src={imagePath}
                    alt={`${charity.name} logo`}
                    fill
                    className={cn(
                      'object-contain p-3 transition-all duration-500 group-hover:scale-105',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 144px, 144px"
                    priority={charity.featured}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-patriotWhite animate-pulse flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-textSecondary/50" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-patriotWhite flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-textSecondary/50 mx-auto mb-2" />
                    <span className="text-xs text-textSecondary/70 font-medium">
                      {charity.name
                        .split(' ')
                        .map(word => word[0])
                        .join('')
                        .slice(0, 3)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {/* Verification Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-1 px-3 py-1.5 bg-patriotWhite/95 border border-patriotBlue/30 rounded-full shadow-sm backdrop-blur-sm"
            >
              <Shield className="w-3 h-3 text-patriotBlue" />
              <span className="text-xs font-semibold text-patriotBlue">
                Verified 501(c)(3)
              </span>
            </motion.div>

            {/* Featured Badge */}
            {charity.featured && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-starGold/20 border border-starGold/40 rounded-full shadow-sm backdrop-blur-sm"
              >
                <Star className="w-3 h-3 text-starGold fill-current" />
                <span className="text-xs font-semibold text-starGold">
                  Featured
                </span>
              </motion.div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-backgroundLight/80 to-transparent" />
        </div>

        {/* Enhanced Content Section */}
        <div className="p-6 space-y-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-bold text-patriotWhite mb-2 group-hover:text-patriotRed transition-colors duration-300 line-clamp-2">
                {charity.name}
              </h3>
              <p className="text-sm text-textSecondary mb-3 line-clamp-3 leading-relaxed">
                {charity.mission}
              </p>
            </div>

            {/* Category & Location */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1.5 bg-patriotBlue/20 text-patriotBlue rounded-full font-medium border border-patriotBlue/30">
                {getCategoryDisplayName(charity.category)}
              </span>
              <div className="flex items-center space-x-1 text-textSecondary">
                <MapPin className="w-3 h-3" />
                <span className="font-medium">
                  {charity.location.city}, {charity.location.state}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced Impact Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-3 bg-backgroundAccent/40 rounded-lg border border-patriotBlue/20 hover:border-patriotBlue/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-1">
                <Users className="w-4 h-4 text-patriotBlue" />
              </div>
              <div className="text-sm font-bold text-patriotWhite mb-1 leading-tight">
                {formatNumber(charity.impactMetrics.veteransServed)}
              </div>
              <div className="text-xs text-textSecondary font-medium leading-tight">
                Veterans
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-3 bg-backgroundAccent/40 rounded-lg border border-patriotRed/20 hover:border-patriotRed/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-1">
                <Calendar className="w-4 h-4 text-patriotRed" />
              </div>
              <div className="text-sm font-bold text-patriotWhite mb-1 leading-tight">
                {charity.impactMetrics.yearsOfService}
              </div>
              <div className="text-xs text-textSecondary font-medium leading-tight">
                Years
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-3 bg-backgroundAccent/40 rounded-lg border border-starGold/20 hover:border-starGold/40 transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="w-4 h-4 text-starGold" />
              </div>
              <div className="text-sm font-bold text-patriotWhite mb-1 leading-tight">
                {formatCurrency(charity.impactMetrics.fundingReceived)}
              </div>
              <div className="text-xs text-textSecondary font-medium leading-tight">
                Funding
              </div>
            </motion.div>
          </div>

          {/* Enhanced Tags */}
          <div className="flex flex-wrap gap-2">
            {charity.tags.slice(0, 3).map((tag, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="px-3 py-1 text-xs bg-patriotBlue/15 text-patriotBlue rounded-full font-medium border border-patriotBlue/25 hover:bg-patriotBlue/25 transition-colors duration-200"
              >
                {tag}
              </motion.span>
            ))}
            {charity.tags.length > 3 && (
              <span className="px-3 py-1 text-xs bg-textSecondary/15 text-textSecondary rounded-full font-medium border border-textSecondary/25">
                +{charity.tags.length - 3} more
              </span>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col space-y-3 pt-2 mt-auto">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center justify-center space-x-2 h-10 border-patriotRed/40 hover:border-patriotRed hover:bg-patriotRed/10 transition-all duration-300"
              >
                <a
                  href={charity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                  aria-label={`Visit ${charity.name} website`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-medium">Website</span>
                </a>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewImpact?.(charity)}
                className="flex items-center justify-center space-x-2 h-10 border border-patriotRed/40 hover:border-patriotRed hover:bg-patriotRed/10 transition-all duration-300"
                aria-label={`View impact details for ${charity.name}`}
              >
                <span className="font-medium">Impact</span>
              </Button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              asChild
              className="flex items-center justify-center space-x-2 h-10 bg-patriotRed/20 hover:bg-patriotRed/30 border-patriotRed/30 hover:border-patriotRed/50 transition-all duration-300"
            >
              <Link
                href="/vote"
                className="flex items-center space-x-2"
                aria-label={`Support ${charity.name} in voting`}
              >
                <Heart className="w-4 h-4" />
                <span className="font-medium">Support in Voting</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
