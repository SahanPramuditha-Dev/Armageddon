import React from 'react';
import { motion } from 'motion/react';
import { soundEngine } from '@/services/soundEngine';

interface TacticalButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: 'primary' | 'caution' | 'danger' | 'ghost' | 'active';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  badge?: string | number;
  loading?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  badge,
  loading = false,
  disabled,
  onClick,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-[0_4px_16px_rgba(10,132,255,0.35)] border border-blue-400/30',
    caution:
      'bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FFB340] border border-[#FF9F0A]/30 shadow-[0_4px_12px_rgba(255,159,10,0.15)]',
    danger:
      'bg-[#FF453A]/15 hover:bg-[#FF453A]/25 text-[#FF6961] border border-[#FF453A]/30 shadow-[0_4px_12px_rgba(255,69,58,0.15)]',
    ghost:
      'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] hover:border-white/[0.15]',
    active:
      'bg-[#0A84FF] text-white font-semibold border-blue-300 shadow-[0_0_16px_rgba(10,132,255,0.4)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg font-medium',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl font-medium',
    lg: 'px-6 py-3.5 text-sm gap-2.5 rounded-xl font-semibold',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    soundEngine.playUIClick();
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center tracking-normal transition-all cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}

      <span>{children}</span>

      {badge !== undefined && (
        <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white">
          {badge}
        </span>
      )}
    </motion.button>
  );
};
