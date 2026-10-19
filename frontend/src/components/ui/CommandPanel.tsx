import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { soundEngine } from '@/services/soundEngine';

interface CommandPanelProps {
  title: string;
  subtitle?: string;
  statusLed?: 'cyan' | 'amber' | 'red' | 'emerald' | 'neutral';
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  variant?: 'normal' | 'alert' | 'active';
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  title,
  subtitle,
  statusLed = 'cyan',
  actions,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className = '',
  variant = 'normal',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const ledColors = {
    cyan: 'bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.6)]',
    emerald: 'bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.6)]',
    amber: 'bg-[#FF9F0A] shadow-[0_0_8px_rgba(255,159,10,0.6)]',
    red: 'bg-[#FF453A] shadow-[0_0_8px_rgba(255,69,58,0.7)] animate-pulse',
    neutral: 'bg-slate-500',
  };

  const variantBorders = {
    normal: 'border-white/[0.08] bg-[#0E1526]/75',
    active: 'border-[#0A84FF]/40 bg-[#121C33]/85 shadow-[0_0_20px_rgba(10,132,255,0.1)]',
    alert: 'border-[#FF453A]/40 bg-[#280F16]/85 shadow-[0_0_20px_rgba(255,69,58,0.15)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl border backdrop-blur-2xl shadow-xl overflow-hidden ${variantBorders[variant]} ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${ledColors[statusLed]}`} />
          <div>
            <h3 className="font-display text-xs font-semibold tracking-normal text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {collapsible && (
            <button
              onClick={() => {
                soundEngine.playUIClick();
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!isCollapsed && <div className="p-4">{children}</div>}
    </motion.div>
  );
};
