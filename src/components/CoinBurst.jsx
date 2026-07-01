import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoinBurst({ trigger, count = 6 }) {
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const newCoins = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 160,
      y: -(60 + Math.random() * 80),
      rotate: (Math.random() - 0.5) * 360,
      delay: i * 0.05,
    }));
    setCoins(newCoins);
    const t = setTimeout(() => setCoins([]), 1200);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <AnimatePresence>
        {coins.map(c => (
          <motion.div
            key={c.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
            animate={{ opacity: 0, x: c.x, y: c.y, scale: 0.5, rotate: c.rotate }}
            transition={{ duration: 0.9, delay: c.delay, ease: 'easeOut' }}
            className="absolute text-xl select-none"
          >
            💰
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
