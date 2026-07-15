import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@/lib/themeContext';
import { AuthProvider } from '@/lib/authContext';
import Learn from '@/pages/Learn';
import Flashcards from '@/pages/Flashcards';
import Exam from '@/pages/Exam';
import Practice from '@/pages/Practice';
import DailyChallenge from '@/pages/DailyChallenge';
import Lesson from '@/pages/Lesson';
import Play from '@/pages/Play';
import League from '@/pages/League';
import Portfolio from '@/pages/Portfolio';
import Profile from '@/pages/Profile';
import Shop from '@/pages/Shop';
import Scenarios from '@/pages/Scenarios';
import Review from '@/pages/Review';
import BossBattle from '@/pages/BossBattle';
import ChapterExam from '@/pages/ChapterExam';
import Pro from '@/pages/Pro';
import ProSuccess from '@/pages/ProSuccess';
import Calculators from '@/pages/Calculators';
import GlossarySearch from '@/pages/GlossarySearch';
import NewsBriefing from '@/pages/NewsBriefing';
import RealEstate from '@/pages/RealEstate';
import BottomNav from '@/components/BottomNav';
import OnboardingModal from '@/components/OnboardingModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';

const NAV_ROUTES = ['/', '/play', '/portfolio', '/estate', '/league', '/profile', '/flashcards'];

export default function App() {
  const location = useLocation();
  const showNav = NAV_ROUTES.includes(location.pathname);

  return (
    <ThemeProvider>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Learn />} />
        <Route path="/play" element={<Play />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/league" element={<League />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/review" element={<Review />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/daily" element={<DailyChallenge />} />
        <Route path="/lesson/:id" element={<Lesson />} />
        <Route path="/boss/:unitId" element={<BossBattle />} />
        <Route path="/chapter-exam/:examId" element={<ChapterExam />} />
        <Route path="/pro" element={<Pro />} />
        <Route path="/pro/success" element={<ProSuccess />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/glossary" element={<GlossarySearch />} />
        <Route path="/news" element={<NewsBriefing />} />
        <Route path="/estate" element={<RealEstate />} />
      </Routes>
      {showNav && <BottomNav />}
      <OnboardingModal />
      <ResetPasswordModal />
    </AuthProvider>
    </ThemeProvider>
  );
}
