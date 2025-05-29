'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(spring, current =>
    (
      Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals)
    ).toFixed(decimals)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
}

interface PercentageCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function PercentageCounter({
  value,
  duration = 1,
  className = '',
}: PercentageCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
      suffix="%"
      decimals={1}
    />
  );
}

interface VoteCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function VoteCounter({
  value,
  duration = 1,
  className = '',
}: VoteCounterProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const display = useTransform(spring, current =>
    formatNumber(Math.round(current))
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

// Specialized counter for currency
export function CurrencyCounter({
  value,
  currency = '$',
  className = '',
  ...props
}: Omit<AnimatedCounterProps, 'prefix'> & { currency?: string }) {
  return (
    <AnimatedCounter
      value={value}
      prefix={currency}
      decimals={2}
      className={className}
      {...props}
    />
  );
}
