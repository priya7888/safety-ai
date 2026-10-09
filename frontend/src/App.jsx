import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import HowItWorksSection from './components/HowItWorksSection';
import CinematicVideoSection from './components/CinematicVideoSection';
import LifeSavingRulesSection from './components/LifeSavingRulesSection';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import InteractiveAiDemoModal from './components/InteractiveAiDemoModal';
import OrganizationPlatform from './components/platform/OrganizationPlatform';
import WorkerFieldApp from './components/field/WorkerFieldApp';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/ai-analysis',
  '/bulk-upload',
  '/reports',
  '/week-signals',
  '/strong-report',
  '/sif-precursors',
  '/critical-alerts',
  '/corrective-actions',
  '/analytics',
  '/risk-heatmap',
  '/life-saving-rules',
  '/settings'
];

function AppContent() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  // Synchronize browser history and popstate navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Redirect unauthenticated access to any protected platform route back to authentication page
  useEffect(() => {
    if (!loading && !isAuthenticated && PROTECTED_ROUTES.includes(currentPath)) {
      window.history.replaceState({}, '', '/');
      setCurrentPath('/');
      setLoginModalOpen(true);
    }
  }, [loading, isAuthenticated, currentPath]);

  const handleOpenLogin = () => {
    setLoginModalOpen(true);
  };

  // Dynamic continuous Oil Rope & Playful Person Hanging Scroller
  const [scrollerY, setScrollerY] = useState(60);
  const [scrollerVisible, setScrollerVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const storyContainerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Sync scroll position with mascot position
  useEffect(() => {
    const handleScroll = () => {
      if (isDraggingRef.current) return;
      if (!storyContainerRef.current) return;
      const rect = storyContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Check if user is scrolled within the story container (Page 2 to Page 7)
      if (rect.top <= windowHeight * 0.7 && rect.bottom >= windowHeight * 0.2) {
        setScrollerVisible(true);
        const totalHeight = rect.height;
        const currentProgress = windowHeight * 0.45 - rect.top;
        const clampedY = Math.max(30, Math.min(totalHeight - 30, currentProgress));
        setScrollerY(clampedY);
      } else {
        setScrollerVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Dragging Up and Down
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDraggingRef.current || !storyContainerRef.current) return;
      
      const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      if (clientY === null) return;

      const rect = storyContainerRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const totalHeight = rect.height;
      const clampedY = Math.max(30, Math.min(totalHeight - 30, relativeY));
      setScrollerY(clampedY);

      // Scroll window to match the drag position
      const containerTopPage = window.scrollY + rect.top;
      const targetScroll = containerTopPage + clampedY - window.innerHeight * 0.45;
      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'auto'
      });
    };

    const handleDragEnd = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
      }
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  // Click on rope line to jump scroll
  const handleRopeClick = (e) => {
    if (!storyContainerRef.current) return;
    const rect = storyContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const containerTopPage = window.scrollY + rect.top;
    const targetScroll = containerTopPage + relativeY - window.innerHeight * 0.45;
    window.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    });
  };

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Dedicated Field Worker Mobile App Route (Accessible for ground personnel & SOS)
  if (currentPath === '/field-app' || currentPath === '/worker-app' || currentPath === '/app') {
    return (
      <WorkerFieldApp 
        onNavigate={navigateTo}
        onExitToWeb={() => navigateTo(isAuthenticated ? '/dashboard' : '/')}
      />
    );
  }

  // Protect all 13 platform routes: require authentication
  if (PROTECTED_ROUTES.includes(currentPath)) {
    // Show spinner while resolving localStorage session
    if (loading) {
      return (
        <div className="min-h-screen bg-[#070D18] flex flex-col items-center justify-center text-slate-300">
          <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="mt-4 text-xs font-mono text-amber-300 tracking-wider">Verifying Security Session...</p>
        </div>
      );
    }

    // Authenticated: Render SIF Sentinel Enterprise Multi-Page Platform
    if (isAuthenticated) {
      return (
        <OrganizationPlatform 
          currentPath={currentPath}
          onNavigate={navigateTo}
          onExitPlatform={() => {
            logout();
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
            setLoginModalOpen(false);
          }}
        />
      );
    }

    // Unauthenticated access attempt: Redirect to authentication modal
    return (
      <div className="min-h-screen bg-[#070709] text-slate-100">
        <LoginModal
          isOpen={true}
          onClose={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
            setLoginModalOpen(false);
          }}
          onLoginSuccess={() => {
            navigateTo(currentPath || '/dashboard');
          }}
        />
      </div>
    );
  }

  // IF NOT ON DASHBOARD: RENDER COMPLETE PUBLIC LANDING PAGE (UNTOUCHED)
  return (
    <div className="min-h-screen bg-[#070709] text-slate-100 transition-colors duration-300 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navigation Bar with Direct Smooth Scrolling */}
      <Navbar 
        onOpenLogin={handleOpenLogin}
        onOpenDemo={() => setDemoModalOpen(true)}
      />

      <main>
        {/* 1. Landing / Hero Section */}
        <HeroSection 
          onExplore={() => setDemoModalOpen(true)}
          onLogin={handleOpenLogin}
        />

        {/* Continuous Story Container (Page 2 to Page 7 with Central Golden Rope & Scroller) */}
        <div ref={storyContainerRef} className="relative select-none">
          
          {/* CONTINUOUS INTERACTIVE OIL ROPE LINE FROM 2ND PAGE TO LAST PAGE */}
          <div 
            onClick={handleRopeClick}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-7 z-20 cursor-pointer group"
          >
            {/* Golden central rope thread */}
            <div className="w-[3px] h-full mx-auto bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 shadow-sm shadow-amber-500/50 group-hover:w-[4px] group-hover:from-yellow-300 group-hover:to-amber-400 transition-all duration-200" />
          </div>

          {/* DYNAMIC DRAGGABLE PERSON HANGING ON ROPE SCROLLER */}
          <div 
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 group cursor-grab active:cursor-grabbing select-none ${
              scrollerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{ 
              top: `${scrollerY}px`,
              transition: isDragging ? 'none' : 'opacity 0.25s ease, top 0.12s ease-out'
            }}
          >
            {/* Outer Golden Glow Aura Ring */}
            <div className={`relative w-16 h-16 rounded-full bg-slate-950/90 border-2 ${isDragging ? 'border-yellow-300 ring-4 ring-amber-400/50 scale-110' : 'border-amber-400/80 ring-2 ring-amber-500/20'} shadow-2xl flex items-center justify-center transition-transform duration-200 backdrop-blur-md`}>
              
              {/* PERSON HANGING ON ROPE WITH SWAYING ANIMATION */}
              <div className={`relative w-12 h-12 flex items-center justify-center ${
                isDragging ? 'animate-silly-drag' : 'animate-silly-bob'
              }`}>
                
                {/* PERSON HANGING ON THE ROPE SVG */}
                <svg 
                  className="w-11 h-11 drop-shadow-md" 
                  viewBox="0 0 48 48" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Vertical Rope in Background */}
                  <line x1="24" y1="0" x2="24" y2="48" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="2 1" opacity="0.6" />

                  {/* Legs / Safety Boots hanging and gripping */}
                  <path d="M21 34L19 41L15 42" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M27 34L29 41L33 42" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Boots */}
                  <ellipse cx="15" cy="42" rx="2" ry="1.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1" />
                  <ellipse cx="33" cy="42" rx="2" ry="1.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1" />

                  {/* Body / High-Vis Safety Vest & Harness */}
                  <rect x="18" y="22" width="12" height="12" rx="4" fill="#0f172a" />
                  <path d="M20 22L24 34L28 22" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                  <rect x="20" y="27" width="8" height="2" fill="#38bdf8" />
                  
                  {/* Carabiner / Fall Arrest Safety Clip on Rope */}
                  <ellipse cx="24" cy="27" rx="2" ry="3" stroke="#facc15" strokeWidth="1.5" fill="none" />

                  {/* Head / Face */}
                  <circle cx="24" cy="16" r="6" fill="#fed7aa" stroke="#0f172a" strokeWidth="1.2" />
                  
                  {/* Cute Eyes looking forward */}
                  <circle cx="22" cy="15.5" r="1.2" fill="#0f172a" />
                  <circle cx="26" cy="15.5" r="1.2" fill="#0f172a" />
                  <circle cx="22.4" cy="15" r="0.4" fill="#ffffff" />
                  <circle cx="26.4" cy="15" r="0.4" fill="#ffffff" />

                  {/* Confident Smile */}
                  <path d="M22.5 18C23.5 19 24.5 19 25.5 18" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Yellow Safety Hardhat Helmet */}
                  <path d="M17 14C17 9.5 20 6.5 24 6.5C28 6.5 31 9.5 31 14H17Z" fill="#facc15" stroke="#0f172a" strokeWidth="1.2" />
                  <path d="M15 14H33" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="24" cy="9" r="1.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />

                  {/* Arms & Hands FIRMLY GRIPPING THE VERTICAL ROPE */}
                  <path d="M18 24L18 10L24 8" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="8" r="2" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.2" />

                  <path d="M30 24L30 14L24 13" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="24" cy="13" r="2" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.2" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Page 2 (LIGHT): LEFT IMAGE | RIGHT TEXT */}
          <AboutSection 
            onExplore={() => setDemoModalOpen(true)}
          />

          {/* 3. Page 3 (DARK): LEFT TEXT | RIGHT IMAGE */}
          <HowItWorksSection />

          {/* 4. Page 4 (LIGHT): LEFT IMAGE/VIDEO | RIGHT TEXT */}
          <CinematicVideoSection 
            onLogin={() => setLoginModalOpen(true)}
            onSeeHowItWorks={scrollToHowItWorks}
          />

          {/* 5. Page 5 (DARK): LEFT TEXT | RIGHT IMAGE/GRID */}
          <LifeSavingRulesSection />

        </div>
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* 9. Organization Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => {
          navigateTo('/dashboard');
        }}
      />

      {/* 10. Interactive AI SIF Demo Simulator Modal */}
      <InteractiveAiDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}