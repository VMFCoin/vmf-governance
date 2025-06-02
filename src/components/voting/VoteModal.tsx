'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '../ui';
import ConfettiSystem, { FireworksConfetti } from '../ui/ConfettiSystem';
import { useConfetti } from '@/hooks/useConfetti';
import {
  modalVariants,
  fadeInVariants,
  buttonVariants,
  votingButtonVariants,
  voteCountVariants,
  loadingSpinnerVariants,
  celebrationVariants,
  getAnimationVariants,
} from '@/lib/animations';
import { cn } from '@/lib/utils';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVote: (vote: 'yes' | 'no' | 'abstain') => Promise<void>;
  proposalTitle: string;
  selectedVote: 'yes' | 'no' | 'abstain' | null;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onVote,
  proposalTitle,
  selectedVote,
}) => {
  const [isVoting, setIsVoting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { confettiState, triggerVoteSuccess, stopConfetti } = useConfetti();

  useEffect(() => {
    if (showSuccess) {
      triggerVoteSuccess();
      const timer = setTimeout(() => {
        setShowSuccess(false);
        stopConfetti();
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, onClose, triggerVoteSuccess, stopConfetti]);

  const handleVote = async () => {
    if (!selectedVote) return;

    setIsVoting(true);
    try {
      await onVote(selectedVote);
      setShowSuccess(true);
    } catch (error) {
      console.error('Voting failed:', error);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'yes':
        return 'text-green-400';
      case 'no':
        return 'text-red-400';
      case 'abstain':
        return 'text-gray-400';
      default:
        return 'text-patriotWhite';
    }
  };

  const getVoteEmoji = (vote: string) => {
    switch (vote) {
      case 'yes':
        return '✅';
      case 'no':
        return '❌';
      case 'abstain':
        return '⚪';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          >
            {/* Modal Content */}
            <motion.div
              className="max-w-md w-full"
              variants={modalVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              onClick={e => e.stopPropagation()}
            >
              <Card className="relative">
                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  disabled={isVoting}
                  className="absolute top-4 right-4 text-textSecondary hover:text-patriotWhite transition-colors z-10"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <AnimatePresence mode="wait">
                  {showSuccess ? (
                    /* Success State */
                    <motion.div
                      key="success"
                      className="text-center py-8"
                      variants={getAnimationVariants(celebrationVariants)}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{
                            scale: 1,
                            rotate: 0,
                            filter: [
                              'drop-shadow(0 0 0px rgba(34, 197, 94, 0))',
                              'drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))',
                              'drop-shadow(0 0 0px rgba(34, 197, 94, 0))',
                            ],
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 15,
                            delay: 0.2,
                            filter: {
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            },
                          }}
                        >
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        </motion.div>

                        {/* Enhanced pulse rings */}
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        >
                          <div className="w-20 h-20 border-4 border-green-500/20 rounded-full" />
                        </motion.div>

                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 2, opacity: [0, 0.3, 0] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 0.5,
                          }}
                        >
                          <div className="w-24 h-24 border-2 border-green-500/10 rounded-full" />
                        </motion.div>

                        {/* Sparkle effects */}
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                            style={{
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                            animate={{
                              x: [0, Math.cos((i * 60 * Math.PI) / 180) * 40],
                              y: [0, Math.sin((i * 60 * Math.PI) / 180) * 40],
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.5 + i * 0.1,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </div>

                      <motion.h3
                        className="text-2xl font-display font-bold text-patriotWhite mb-2"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Vote Submitted! 🎉
                      </motion.h3>

                      <motion.p
                        className="text-textSecondary mb-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        Your vote has been recorded successfully
                      </motion.p>

                      <motion.div
                        className="bg-backgroundAccent rounded-lg p-4"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <p className="text-sm text-textSecondary">
                          You voted:{' '}
                          <span
                            className={cn(
                              'font-bold capitalize',
                              getVoteColor(selectedVote || '')
                            )}
                          >
                            {getVoteEmoji(selectedVote || '')} {selectedVote}
                          </span>
                        </p>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* Confirmation State */
                    <motion.div
                      key="confirmation"
                      variants={fadeInVariants}
                      initial="initial"
                      animate="enter"
                      exit="exit"
                    >
                      <motion.h3
                        className="text-xl font-display font-bold text-patriotWhite mb-4 pr-8"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        Confirm Your Vote
                      </motion.h3>

                      <motion.div
                        className="bg-backgroundAccent rounded-lg p-4 mb-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="text-sm text-textSecondary mb-2">
                          Proposal:
                        </p>
                        <p className="text-patriotWhite font-medium">
                          {proposalTitle}
                        </p>
                      </motion.div>

                      <motion.div
                        className="text-center mb-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.3,
                          type: 'spring',
                          stiffness: 200,
                        }}
                      >
                        <motion.div
                          className="inline-flex items-center gap-3 bg-backgroundDark rounded-lg px-6 py-4"
                          variants={getAnimationVariants(voteCountVariants)}
                          animate="animate"
                        >
                          <motion.span
                            className="text-2xl"
                            animate={{
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            {getVoteEmoji(selectedVote || '')}
                          </motion.span>
                          <div>
                            <p className="text-sm text-textSecondary">
                              Your Vote:
                            </p>
                            <motion.p
                              className={cn(
                                'text-lg font-bold capitalize',
                                getVoteColor(selectedVote || '')
                              )}
                              animate={{
                                scale: [1, 1.1, 1],
                                textShadow: [
                                  '0 0 0px rgba(255, 255, 255, 0)',
                                  '0 0 10px rgba(255, 255, 255, 0.5)',
                                  '0 0 0px rgba(255, 255, 255, 0)',
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            >
                              {selectedVote}
                            </motion.p>
                          </div>
                        </motion.div>
                      </motion.div>

                      <motion.div
                        className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <p className="text-yellow-200 text-sm">
                          ⚠️ <strong>Important:</strong> This action cannot be
                          undone. Your vote will be permanently recorded on the
                          blockchain.
                        </p>
                      </motion.div>

                      <motion.div
                        className="flex gap-3"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          className="flex-1"
                          variants={getAnimationVariants(votingButtonVariants)}
                          animate={isVoting ? 'loading' : 'initial'}
                          whileHover={!isVoting ? 'hover' : undefined}
                          whileTap={!isVoting ? 'tap' : undefined}
                        >
                          <Button
                            onClick={handleVote}
                            disabled={isVoting || !selectedVote}
                            className="w-full relative overflow-hidden"
                          >
                            {isVoting && (
                              <motion.div
                                className="absolute inset-0 bg-patriotRed/20"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                            )}
                            <span className="relative flex items-center justify-center">
                              {isVoting ? (
                                <>
                                  <motion.div
                                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                                    variants={getAnimationVariants(
                                      loadingSpinnerVariants
                                    )}
                                    animate="animate"
                                  />
                                  <motion.span
                                    animate={{
                                      opacity: [0.7, 1, 0.7],
                                    }}
                                    transition={{
                                      duration: 1.5,
                                      repeat: Infinity,
                                      ease: 'easeInOut',
                                    }}
                                  >
                                    Submitting...
                                  </motion.span>
                                </>
                              ) : (
                                <motion.span
                                  animate={{
                                    scale: [1, 1.02, 1],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                >
                                  Confirm Vote
                                </motion.span>
                              )}
                            </span>
                          </Button>
                        </motion.div>

                        <motion.div
                          className="flex-1"
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                        >
                          <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isVoting}
                            className="w-full"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </motion.div>

          {/* Enhanced Confetti System */}
          {confettiState.type === 'fireworks' && (
            <FireworksConfetti
              isActive={confettiState.isActive}
              duration={confettiState.config.duration}
              burstCount={confettiState.config.burstCount}
              colors={confettiState.config.colors}
              onComplete={stopConfetti}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};
