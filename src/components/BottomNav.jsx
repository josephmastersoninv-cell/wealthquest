import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Swords, TrendingUp, Trophy, User, GalleryVerticalEnd } from 'lucide-react';

const TABS = [
  { to: '/',             icon: BookOpen,          label: 'Learn'     },
  { to: '/flashcards',   icon: GalleryVerticalEnd, label: 'Cards'     },
  { to: '/play',         icon: Swords,            label: 'Play'      },
  { to: '/portfolio', icon: TrendingUp, label: 'Portfolio' },
  { to: '/league',    icon: Trophy,     label: 'League'    },
  { to: '/profile',   icon: User,       label: 'Profile'   },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
