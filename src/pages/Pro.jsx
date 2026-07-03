import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Heart, BookOpen, Globe, Trophy, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: Heart,    label: 'Unlimited Hearts',         sub: 'Never get locked out of lessons', pro: true,  free: false },
  { icon: Zap,      label: 'Double XP on all lessons', sub: 'Level up 2× faster permanently',  pro: true,  free: false },
  { icon: Trophy,   label: 'Exclusive leagues',         sub: 'Compete in Pro-only leagues',     pro: true,  free: false },
  { icon: BookOpen, label: 'All 200+ terms unlocked',  sub: 'Full glossary access',            pro: true,  free: false },
  { icon: Globe,    label: 'Offline mode',              sub: 'Learn without internet',          pro: true,  free: false },
  { icon: Zap,      label: 'Basic lessons',             sub: '26 lessons, 131 terms',           pro: true,  free: true  },
  { icon: Trophy,   label: 'League rankings',           sub: 'Bronze to Gold leagues',          pro: true,  free: true  },
  { icon: BookOpen, label: 'Flashcards & review',       sub: 'Spaced repetition system',        pro: true,  free: true  },
];

const PLANS = [
  { id: 'annual',  label: 'Annual',  price: '€4.99', per: '/month', total: '€59.99 billed annually', badge: 'BEST VALUE', save: 'Save 58%' },
  { id: 'monthly', label: 'Monthly', price: '€11.99', per: '/month', total: 'Billed monthly', badge: null, save: null },
];

export default function Pro() {
  const [selected, setSelected] = useState('annual');

  return (
    <div className="min-h-screen bg-background pb-16 max-w-lg mx-auto">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 px-4 pt-12 pb-10 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute text-2xl" style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`, opacity: 0.5 }}>
              {['⚡','💎','🏆','🎯','🔥'][i % 5]}
            </div>
          ))}
        </div>
        <Link to="/profile" className="relative inline-flex items-center gap-1 text-white/70 text-sm font-bold mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="relative text-center">
          <div className="text-5xl mb-3">💎</div>
          <h1 className="text-3xl font-black mb-2">Monelingo Pro</h1>
          <p className="text-white/80 text-sm leading-relaxed">Unlock your full financial education potential. No limits.</p>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Plan selector */}
        <div className="bg-card border border-border rounded-3xl p-4 mb-5 shadow-lg">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">Choose your plan</p>
          <div className="flex gap-3">
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => setSelected(plan.id)}
                className={`flex-1 rounded-2xl border-2 p-4 text-left transition-all ${selected === plan.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-extrabold text-sm text-foreground">{plan.label}</p>
                  {plan.badge && (
                    <span className="text-[9px] font-extrabold bg-primary text-white px-1.5 py-0.5 rounded-full">{plan.badge}</span>
                  )}
                </div>
                <p className="text-2xl font-black text-foreground">{plan.price}<span className="text-sm font-bold text-muted-foreground">{plan.per}</span></p>
                {plan.save && <p className="text-xs font-bold text-emerald-500 mt-1">{plan.save}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{plan.total}</p>
                {selected === plan.id && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs font-bold text-primary">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-lg shadow-xl mb-2">
          Start 7-Day Free Trial 🚀
        </motion.button>
        <p className="text-center text-xs text-muted-foreground mb-6">Cancel anytime · No commitment · Secure payment</p>

        {/* Feature comparison */}
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-3">What's included</p>
        <div className="bg-card border border-border rounded-3xl overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-3 px-4 py-3 border-b border-border bg-muted/50">
            <p className="text-xs font-extrabold text-muted-foreground col-span-1">Feature</p>
            <p className="text-xs font-extrabold text-center text-muted-foreground">Free</p>
            <p className="text-xs font-extrabold text-center text-primary">Pro 💎</p>
          </div>
          {FEATURES.map((f, i) => (
            <div key={i} className={`grid grid-cols-3 px-4 py-3.5 items-center ${i < FEATURES.length - 1 ? 'border-b border-border' : ''}`}>
              <div className="col-span-1 pr-2">
                <p className="text-xs font-bold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.sub}</p>
              </div>
              <div className="flex justify-center">
                {f.free
                  ? <Check className="w-4 h-4 text-emerald-500" />
                  : <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
              </div>
              <div className="flex justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="bg-gradient-to-br from-primary/10 to-fuchsia-500/10 rounded-3xl p-5 mb-6 border border-primary/20">
          <p className="text-xs font-extrabold uppercase tracking-wide text-primary mb-3">What learners say</p>
          {[
            { text: '"I passed my CFA Level 1 prep using Monelingo Pro. The spaced repetition is unreal."', name: 'Aoife M., Dublin' },
            { text: '"Best €5/month I spend. Learned more in 2 weeks than a semester of finance class."', name: 'Conor B., Cork' },
          ].map((r, i) => (
            <div key={i} className={i > 0 ? 'mt-3 pt-3 border-t border-primary/10' : ''}>
              <p className="text-xs text-foreground italic leading-relaxed">"{r.text}"</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1">— {r.name}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
          By subscribing you agree to our Terms of Service. Subscription auto-renews. Cancel anytime in account settings.
        </p>
      </div>
    </div>
  );
}
