import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { activatePro } from '@/lib/useIsPro';

export default function ProSuccess() {
  useEffect(() => { activatePro(); }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-7xl mb-6"
      >
        💎
      </motion.div>
      <h1 className="text-3xl font-black text-foreground mb-3">Welcome to Pro!</h1>
      <p className="text-muted-foreground text-sm mb-8 leading-relaxed max-w-xs">
        Your 7-day free trial has started. You now have unlimited hearts, double XP, and access to all 205+ terms across 20 units.
      </p>
      <Link
        to="/"
        className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-extrabold text-base flex items-center gap-2 shadow-lg"
      >
        <Zap className="w-5 h-5" /> Start Learning
      </Link>
    </div>
  );
}
