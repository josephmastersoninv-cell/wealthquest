import { useState, useEffect } from 'react';

const PRO_KEY = 'monelingo_is_pro';

export function useIsPro() {
  const [isPro, setIsPro] = useState(() => {
    try { return localStorage.getItem(PRO_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const handler = () => setIsPro(localStorage.getItem(PRO_KEY) === 'true');
    window.addEventListener('monelingo:pro_updated', handler);
    return () => window.removeEventListener('monelingo:pro_updated', handler);
  }, []);

  return isPro;
}

export function activatePro() {
  localStorage.setItem(PRO_KEY, 'true');
  window.dispatchEvent(new Event('monelingo:pro_updated'));
}

export function deactivatePro() {
  localStorage.removeItem(PRO_KEY);
  window.dispatchEvent(new Event('monelingo:pro_updated'));
}
