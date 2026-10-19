import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldAlert, Zap, Radio, RefreshCw } from 'lucide-react';
import { ThreatAlert } from '@/store/tacticalStore';
import { ShipState } from '@/types/combat';
import { TacticalButton } from './TacticalButton';

interface AlertBannerProps {
  threats: ThreatAlert[];
  friendlyShips: ShipState[];
  onDeployCountermeasure: (shipId: string, cmId: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  threats,
  friendlyShips,
  onDeployCountermeasure,
}) => {
  if (threats.length === 0) return null;

  const primaryThreat = threats[0];
  const targetShip = friendlyShips.find((s) => s.id === primaryThreat.targetShipId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -25, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl"
      >
        <div className="apple-glass bg-[#220B10]/85 border border-[#FF453A]/40 shadow-[0_12px_36px_rgba(255,69,58,0.3)] px-5 py-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Warning Headline */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF453A]/20 border border-[#FF453A]/40 flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-[#FF453A]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#FF453A] uppercase tracking-wider">
                  Critical Inbound Threat
                </span>
                <span className="text-[10px] font-mono-tech px-2 py-0.5 bg-[#FF453A]/20 border border-[#FF453A]/40 text-red-200 rounded-full font-bold">
                  ETA {primaryThreat.estimatedSeconds}s
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-normal">
                Incoming <strong className="text-[#FF453A] font-semibold">{primaryThreat.threatType}</strong> vectoring on{' '}
                <strong className="text-white font-semibold">{targetShip?.name || primaryThreat.targetShipId}</strong>
              </p>
            </div>
          </div>

          {/* Quick Countermeasure Reaction Actions */}
          {targetShip && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-[11px] text-slate-400 font-medium mr-1">
                Deploy Defense:
              </span>

              {targetShip.countermeasures.map((cm) => {
                const canDeploy = cm.charges_remaining > 0 && cm.current_cooldown <= 0;
                return (
                  <button
                    key={cm.id}
                    disabled={!canDeploy}
                    onClick={() => onDeployCountermeasure(targetShip.id, cm.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      canDeploy
                        ? 'bg-[#FF9F0A] hover:bg-[#E08A05] text-slate-950 shadow-[0_2px_12px_rgba(255,159,10,0.35)] active:scale-[0.98]'
                        : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{cm.name.split(' ')[0]}</span>
                    <span className="font-mono-tech text-[10px] opacity-80">({cm.charges_remaining})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
