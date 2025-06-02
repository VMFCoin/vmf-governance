'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  Shield,
  MapPin,
  Building,
  Award,
  TrendingUp,
  ImageIcon,
  Heart,
} from 'lucide-react';
import { Charity } from '@/types';
import { Button, Card } from '@/components/ui';
import { getCategoryDisplayName } from '@/data/charities';

interface CharityImpactModalProps {
  charity: Charity | null;
  isOpen: boolean;
  onClose: () => void;
}

// Image mapping for charity logos (same as CharityCard)
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

export const CharityImpactModal: React.FC<CharityImpactModalProps> = ({
  charity,
  isOpen,
  onClose,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!charity) return null;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const imagePath = getCharityImagePath(charity.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Enhanced Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden"
          >
            <Card className="overflow-hidden bg-backgroundLight/95 backdrop-blur-sm border-patriotBlue/40">
              {/* Enhanced Header */}
              <div className="relative h-72 bg-gradient-to-br from-patriotBlue/30 via-backgroundAccent/40 to-patriotRed/30 overflow-hidden">
                <div className="absolute inset-0 bg-backgroundDark/40" />

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute top-6 right-6 z-10 p-3 bg-patriotWhite/95 hover:bg-patriotWhite rounded-full transition-all duration-200 shadow-lg"
                >
                  <X className="w-6 h-6 text-backgroundDark" />
                </motion.button>

                {/* Enhanced Header Content */}
                <div className="relative h-full flex items-center p-8">
                  <div className="flex items-center space-x-8 w-full">
                    {/* Enhanced Logo */}
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-patriotWhite shadow-xl ring-4 ring-patriotWhite/30 flex-shrink-0">
                      {!imageError ? (
                        <>
                          <Image
                            src={imagePath}
                            alt={`${charity.name} logo`}
                            fill
                            className={`object-contain p-3 transition-opacity duration-300 ${
                              imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            sizes="128px"
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
                            <ImageIcon className="w-10 h-10 text-textSecondary/50 mx-auto mb-2" />
                            <span className="text-sm text-textSecondary/70 font-medium">
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

                    {/* Enhanced Basic Info */}
                    <div className="flex-1">
                      <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold text-patriotWhite mb-3"
                      >
                        {charity.name}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-textSecondary mb-6 leading-relaxed"
                      >
                        {charity.mission}
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex items-center space-x-2 px-4 py-2 bg-patriotWhite/95 rounded-full shadow-sm">
                          <Shield className="w-4 h-4 text-patriotBlue" />
                          <span className="text-sm font-semibold text-patriotBlue">
                            Verified 501(c)(3)
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 px-4 py-2 bg-patriotBlue/30 border border-patriotBlue/50 rounded-full backdrop-blur-sm">
                          <span className="text-sm font-semibold text-patriotWhite">
                            {getCategoryDisplayName(charity.category)}
                          </span>
                        </div>

                        {charity.featured && (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-starGold/30 border border-starGold/50 rounded-full backdrop-blur-sm">
                            <Heart className="w-4 h-4 text-starGold fill-current" />
                            <span className="text-sm font-semibold text-starGold">
                              Featured
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-backgroundLight/90 to-transparent" />
              </div>

              {/* Enhanced Content */}
              <div className="max-h-[60vh] overflow-y-auto p-8 space-y-8">
                {/* Enhanced Impact Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-2xl font-bold text-patriotWhite mb-6 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-patriotRed" />
                    Impact Metrics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Card className="p-6 text-center bg-patriotBlue/20 border-patriotBlue/40 hover:bg-patriotBlue/30 transition-all duration-300">
                        <Users className="w-10 h-10 text-patriotBlue mx-auto mb-4" />
                        <div className="text-3xl font-bold text-patriotWhite mb-2">
                          {formatNumber(charity.impactMetrics.veteransServed)}
                        </div>
                        <div className="text-sm text-textSecondary font-medium">
                          Veterans Served
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Card className="p-6 text-center bg-patriotRed/20 border-patriotRed/40 hover:bg-patriotRed/30 transition-all duration-300">
                        <Calendar className="w-10 h-10 text-patriotRed mx-auto mb-4" />
                        <div className="text-3xl font-bold text-patriotWhite mb-2">
                          {charity.impactMetrics.yearsOfService}
                        </div>
                        <div className="text-sm text-textSecondary font-medium">
                          Years of Service
                        </div>
                      </Card>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Card className="p-6 text-center bg-starGold/20 border-starGold/40 hover:bg-starGold/30 transition-all duration-300">
                        <DollarSign className="w-10 h-10 text-starGold mx-auto mb-4" />
                        <div className="text-3xl font-bold text-patriotWhite mb-2">
                          {formatCurrency(
                            charity.impactMetrics.fundingReceived
                          )}
                        </div>
                        <div className="text-sm text-textSecondary font-medium">
                          Total Funding
                        </div>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Enhanced Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-2xl font-bold text-patriotWhite mb-4">
                    About This Organization
                  </h3>
                  <p className="text-textSecondary leading-relaxed text-lg">
                    {charity.description}
                  </p>
                </motion.div>

                {/* Enhanced Organization Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* Basic Details */}
                  <div>
                    <h4 className="text-xl font-semibold text-patriotWhite mb-6 flex items-center">
                      <Building className="w-5 h-5 mr-3 text-patriotBlue" />
                      Organization Details
                    </h4>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-patriotBlue/20">
                        <span className="text-textSecondary font-medium">
                          Established
                        </span>
                        <span className="text-patriotWhite font-semibold">
                          {charity.establishedYear}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-patriotBlue/20">
                        <span className="text-textSecondary font-medium">
                          Tax ID
                        </span>
                        <span className="text-patriotWhite font-semibold">
                          {charity.verification.taxId}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-patriotBlue/20">
                        <span className="text-textSecondary font-medium">
                          Verified Date
                        </span>
                        <span className="text-patriotWhite font-semibold">
                          {formatDate(charity.verification.verifiedDate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <span className="text-textSecondary font-medium">
                          Location
                        </span>
                        <span className="text-patriotWhite font-semibold flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-patriotRed" />
                          {charity.location.city}, {charity.location.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <h4 className="text-xl font-semibold text-patriotWhite mb-6 flex items-center">
                      <Award className="w-5 h-5 mr-3 text-starGold" />
                      Focus Areas
                    </h4>

                    <div className="flex flex-wrap gap-3">
                      {charity.tags.map((tag, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="px-4 py-2 text-sm bg-patriotBlue/20 text-patriotBlue rounded-full border border-patriotBlue/40 font-medium hover:bg-patriotBlue/30 transition-colors duration-200"
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-patriotBlue/30"
                >
                  <Button
                    asChild
                    className="flex items-center justify-center space-x-2 h-12 bg-patriotRed hover:bg-patriotRed/80 transition-all duration-300"
                  >
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="font-semibold">
                        Visit Official Website
                      </span>
                    </a>
                  </Button>

                  <Button
                    variant="secondary"
                    asChild
                    className="flex items-center justify-center space-x-2 h-12 bg-patriotBlue/20 hover:bg-patriotBlue/30 border-patriotBlue/40 transition-all duration-300"
                  >
                    <a href="/vote" className="flex items-center space-x-2">
                      <Heart className="w-5 h-5" />
                      <span className="font-semibold">Support in Voting</span>
                    </a>
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
