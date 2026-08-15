import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'indigo' | 'gold' | 'emerald' | 'cyan' | 'purple';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glowColor = 'indigo',
  hoverEffect = true,
  onClick
}) => {
  const glowClasses = {
    indigo: 'hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)]',
    gold: 'hover:border-amber-400/50 hover:shadow-[0_8px_30px_rgb(242,202,80,0.25)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(34,197,94,0.2)]',
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgb(6,182,212,0.2)]',
    purple: 'hover:border-purple-500/40 hover:shadow-[0_8px_30px_rgb(168,85,247,0.2)]'
  };

  return (
    <motion.div
      whileHover={hoverEffect ? { scale: 1.02, y: -2 } : undefined}
      whileTap={hoverEffect && onClick ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`
        bg-slate-900/60 backdrop-blur-xl 
        border border-white/10 rounded-xl p-5 
        transition-all duration-300
        ${hoverEffect ? glowClasses[glowColor] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};
