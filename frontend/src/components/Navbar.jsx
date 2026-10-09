import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Menu, 
  X, 
  LayoutGrid,
  Smartphone
} from 'lucide-react';

export default function Navbar({ onOpenLogin, onOpenDemo, onOpenFieldApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
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

  const scrollToHome = () => {
    setMobileMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const navItems = [
    { id: 'about', label: 'About SafetyAI' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'sif-intelligence', label: 'SIF Intelligence' },
    { id: 'life-saving-rules', label: 'Life-Saving Rules' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#07101F]/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl py-3.5' 
          : 'bg-gradient-to-b from-[#07101F]/90 via-[#07101F]/50 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo - Clicks smoothly to top of page */}
          <button 
            onClick={scrollToHome}
            className="flex items-center gap-2.5 group text-left focus:outline-none cursor-pointer"
            title="SafetyAI Home"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/25 group-hover:scale-105 transition-all duration-300">
              <Shield className="w-4 h-4 fill-slate-950/20 stroke-slate-950 stroke-2" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight font-heading flex items-center text-white">
                Safety<span className="text-amber-400">AI</span>
              </span>
              <span className="text-[8.5px] font-mono tracking-widest uppercase -mt-1 font-bold text-slate-400">
                INTELLIGENCE PLATFORM
              </span>
            </div>
          </button>

          {/* Smooth Scroll Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)} 
                className="px-3.5 py-2 text-sm font-semibold rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side: Worker Field App & Organization Login */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={onOpenFieldApp || (() => { window.history.pushState({}, '', '/field-app'); window.dispatchEvent(new PopStateEvent('popstate')); })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Launch dedicated Field Worker Mobile App with SOS & Rapid Checklist"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Worker Field App</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <span>Organization Login</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white bg-white/10 backdrop-blur-md focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07101F]/98 backdrop-blur-2xl border-b border-slate-800 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200 text-left">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => scrollToSection(item.id)} 
              className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
            >
              {item.label}
            </button>
          ))}
          
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenFieldApp) onOpenFieldApp();
                else {
                  window.history.pushState({}, '', '/field-app');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-sm shadow-md cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>📱 Open Worker Field App (SOS &amp; Log)</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin();
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold shadow-md cursor-pointer"
            >
              <span>Organization Login</span>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}