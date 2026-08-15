import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Clock, Sparkles, Tv } from 'lucide-react';
import { INITIAL_THEMES } from '../data/mockData';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({ isOpen, onClose }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Slide rotation every 8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % INITIAL_THEMES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSlide = INITIAL_THEMES[slideIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden font-sans select-none">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-6 right-6 z-50 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-white shadow-2xl">
            <Tv className="w-4 h-4 text-amber-400" />
            <span>4K Live Display Simulation Mode</span>
            <span className="text-amber-400 font-mono">({slideIndex + 1} / {INITIAL_THEMES.length})</span>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 text-white hover:bg-rose-500/80 transition-all shadow-2xl"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Canvas Frame */}
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
          {/* Ken Burns Background Image */}
          <motion.img
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            src={currentSlide.bgUrl}
            alt={currentSlide.name}
            className="absolute inset-0 w-full h-full object-cover ken-burns-anim"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Signage Top Bar */}
          <nav className="relative z-20 flex justify-between items-center px-8 md:px-16 py-8 backdrop-blur-xl bg-black/20 border-b border-white/10">
            <div className="text-2xl md:text-3xl font-bold tracking-tighter text-amber-400 font-serif">
              LUMINA SIGNAGE
            </div>
            <div className="flex items-center gap-4 text-amber-400 font-bold tracking-widest text-lg font-mono">
              <Clock className="w-4 h-4" /> {currentTime}
            </div>
          </nav>

          {/* Main Slide Content */}
          <main className="relative z-20 flex-grow flex flex-col justify-end px-8 md:px-20 pb-32 max-w-5xl">
            <motion.div
              key={`slide-content-${currentSlide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="inline-block px-5 py-2 mb-6 border border-amber-400 text-amber-300 font-bold text-xs tracking-widest uppercase backdrop-blur-md bg-black/40 rounded-full">
                {currentSlide.subtitleText}
              </span>

              <h1 
                className="text-4xl md:text-7xl font-extrabold text-white mb-6 uppercase tracking-tight drop-shadow-2xl"
                style={{ fontFamily: currentSlide.titleFont }}
              >
                {currentSlide.headlineText}
              </h1>

              {currentSlide.descriptionText && (
                <p className="text-sm md:text-lg text-slate-200 max-w-2xl mb-10 leading-relaxed font-sans drop-shadow">
                  {currentSlide.descriptionText}
                </p>
              )}

              <button className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-10 py-5 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_30px_rgba(242,202,80,0.5)] flex items-center gap-3 active:scale-95 group">
                <span>{currentSlide.ctaText || 'Discover More'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </main>

          {/* Footer Bar with Progress Bar */}
          <footer className="relative z-20 flex justify-between items-center px-8 md:px-20 py-8 backdrop-blur-md bg-black/30 border-t border-white/10">
            {/* Top progress bar indicator */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-800">
              <div className="h-full bg-amber-400 progress-bar-anim shadow-[0_0_10px_#f2ca50]" />
            </div>

            <div className="text-xs font-bold text-white uppercase tracking-[0.2em]">
              RESERVED ENTRANCE • PRIVATE EVENT
            </div>

            <div className="flex gap-8 text-xs font-semibold text-slate-300">
              <span className="hover:text-amber-400 cursor-pointer">Schedule</span>
              <span className="hover:text-amber-400 cursor-pointer">Info</span>
            </div>
          </footer>
        </div>
      </div>
    </AnimatePresence>
  );
};
