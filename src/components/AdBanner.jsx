import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useIsPro } from '@/lib/useIsPro';

// Replace with your AdSense publisher ID: ca-pub-XXXXXXXXXXXXXXXX
const ADSENSE_CLIENT = 'ca-pub-4729741706570877';

// Slot IDs — create these in your AdSense dashboard
const SLOTS = {
  learnBanner: 'XXXXXXXXXX',   // Learn page between-unit banner
  lessonBottom: 'XXXXXXXXXX',  // Lesson completion banner
};

function AdSenseUnit({ slot, format = 'auto', style }) {
  const ref = useRef(null);
  useEffect(() => {
    try {
      if (window.adsbygoogle && ref.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {}
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      style={style ?? { display: 'block' }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}

// Shown between units on the Learn page
export function LearnAdBanner() {
  const isPro = useIsPro();
  if (isPro) return null;

  const isConfigured = !ADSENSE_CLIENT.includes('XXXXXXXX');

  return (
    <div className="mx-4 my-3">
      {isConfigured ? (
        <AdSenseUnit slot={SLOTS.learnBanner} style={{ display: 'block', minHeight: 100 }} />
      ) : (
        /* Placeholder shown until AdSense is configured */
        <Link to="/pro" className="block">
          <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-violet-300">💎 Go Pro — Remove All Ads</p>
              <p className="text-[10px] text-white/40 mt-0.5">€4.99/mo · Unlimited hearts · Double XP</p>
            </div>
            <span className="text-xs font-extrabold text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-full shrink-0">
              Try Free →
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}

// Shown at the bottom of a completed lesson
export function LessonAdBanner() {
  const isPro = useIsPro();
  if (isPro) return null;

  const isConfigured = !ADSENSE_CLIENT.includes('XXXXXXXX');

  return (
    <div className="mt-4">
      {isConfigured ? (
        <AdSenseUnit slot={SLOTS.lessonBottom} style={{ display: 'block', minHeight: 90 }} />
      ) : (
        <Link to="/pro">
          <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-violet-300">💎 Remove ads with Pro</p>
              <p className="text-[10px] text-white/40 mt-0.5">7-day free trial · Cancel anytime</p>
            </div>
            <span className="text-xs font-extrabold text-violet-300 bg-violet-500/20 px-2.5 py-1 rounded-full shrink-0">
              Upgrade →
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
