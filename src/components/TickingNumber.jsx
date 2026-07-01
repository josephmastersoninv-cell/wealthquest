import React, { useEffect, useState } from 'react';

export default function TickingNumber({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!value) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}
