import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, AlertTriangle, ArrowRight, ShieldCheck, 
  Anchor, Crosshair, DollarSign, Clock, CheckCircle2, XCircle, LifeBuoy
} from 'lucide-react';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { BattleReport, MissionOutcomeType } from '@/types/combat';

interface PostBattleDebriefModalProps {
  report?: BattleReport | null;
  outcome?: MissionOutcomeType | null;
  onReturnToHarbor: () => void;
  onViewIntelligence?: () => void;
}

export const PostBattleDebriefModal: React.FC<PostBattleDebriefModalProps> = ({
  report,
  outcome,
  onReturnToHarbor,
  onViewIntelligence,
}) => {
  const finalOutcome = report?.outcome || outcome || 'DEFEAT';

  const isVictory = finalOutcome === 'VICTORY';
  const isWithdrawal = finalOutcome === 'WITHDRAWAL';
  const isPartial = finalOutcome === 'PARTIAL_SUCCESS';

  const getBannerConfig = () => {
    if (isVictory) {
      return {
        title: 'Tactical Victory &bull; Area Secured',
        subtitle: 'All theater objectives achieved. Threat contacts neutralized.',
        border: 'border-[#30D158]/40',
        bg: 'bg-[#30D158]/10',
        badgeBg: 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40',
        icon: <Trophy className="w-7 h-7 text-[#30D158]" />
      };
    }
    if (isWithdrawal) {
      return {
        title: 'Strategic Withdrawal &bull; Fleet Recovered',
        subtitle: 'Disengagement completed across extraction boundary. Task force preserved.',
        border: 'border-[#0A84FF]/40',
        bg: 'bg-[#0A84FF]/10',
        badgeBg: 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40',
        icon: <Anchor className="w-7 h-7 text-[#0A84FF]" />
      };
    }
    if (isPartial) {
      return {
        title: 'Partial Success &bull; Incomplete Sortie',
        subtitle: 'Mission resolved with secondary objectives remaining.',
        border: 'border-[#FF9F0A]/40',
        bg: 'bg-[#FF9F0A]/10',
        badgeBg: 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/40',
        icon: <AlertTriangle className="w-7 h-7 text-[#FF9F0A]" />
      };
    }
    return {
      title: 'Operational Defeat &bull; Task Force Decimated',
      subtitle: 'Critical hull losses sustained. Mission requirements failed.',
      border: 'border-[#FF453A]/40',
      bg: 'bg-[#FF453A]/10',
      badgeBg: 'bg-[#FF453A]/20 text-[#FF453A] border-[#FF453A]/40',
      icon: <XCircle className="w-7 h-7 text-[#FF453A]" />
    };
  };

  const banner = getBannerConfig();

  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl ios-glass border ${banner.border} rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-auto`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
              <span className="text-xs text-slate-300 font-semibold tracking-wide">
                Stage 09 &bull; Mission Debrief & Casualty Assessment
              </span>
            </div>
            <span className="font-mono-tech text-xs text-slate-400">
              Match: {report?.match_id || 'CLASSIFIED'}
            </span>
          </div>

          {/* Outcome Hero Banner */}
          <div className={`p-6 border-b border-white/[0.08] ${banner.bg} flex items-center justify-between gap-6`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 border border-white/10 rounded-2xl">
                {banner.icon}
              </div>
              <div>
                <div className={`inline-block px-3 py-0.5 mb-1 text-[11px] font-semibold uppercase rounded-full border ${banner.badgeBg}`}>
                  {finalOutcome}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {banner.title}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 font-normal">
                  {banner.subtitle}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="text-[11px] text-slate-400 font-medium">
                Engagement Duration
              </div>
              <div className="flex items-center gap-1.5 text-base font-mono-tech font-bold text-white mt-0.5">
                <Clock className="w-4 h-4 text-[#0A84FF]" />
                {formatDuration(report?.duration_seconds)}
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* 1. Mission Objectives Status */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0A84FF]" />
                Theater Objectives Evaluation
              </h3>

              <div className="space-y-2">
                {report?.objectives && report.objectives.length > 0 ? (
                  report.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 text-xs ${
                        obj.is_completed
                          ? 'bg-[#30D158]/10 border-[#30D158]/30 text-slate-100'
                          : obj.is_failed
                          ? 'bg-[#FF453A]/10 border-[#FF453A]/30 text-slate-200'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {obj.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />
                        ) : obj.is_failed ? (
                          <XCircle className="w-4 h-4 text-[#FF453A] shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-500 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            <span>{obj.title}</span>
                            {obj.is_mandatory && (
                              <span className="text-[9px] px-2 py-0.2 bg-[#FF453A]/20 border border-[#FF453A]/40 text-red-300 rounded-full font-bold">
                                REQUIRED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                            {obj.description}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full uppercase ${
                          obj.is_completed
                            ? 'bg-[#30D158]/20 text-[#30D158]'
                            : obj.is_failed
                            ? 'bg-[#FF453A]/20 text-[#FF453A]'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {obj.is_completed ? 'Completed' : obj.is_failed ? 'Failed' : 'Incomplete'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center">
                    No objective telemetry logged for this sortie.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Task Force Casualty Ledger */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Anchor className="w-3.5 h-3.5 text-[#0A84FF]" />
                Task Force Casualties & Logistics
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Deployed</div>
                  <div className="text-xl font-mono-tech font-bold text-white mt-1">
                    {report?.ships_deployed ?? 0}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-emerald-400 uppercase font-medium">Survived</div>
                  <div className="text-xl font-mono-tech font-bold text-[#30D158] mt-1">
                    {report?.ships_survived ?? 0}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-amber-400 uppercase font-medium">Damaged</div>
                  <div className="text-xl font-mono-tech font-bold text-[#FF9F0A] mt-1">
                    {report?.ships_damaged ?? 0}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-orange-400 uppercase font-medium">Disabled</div>
                  <div className="text-xl font-mono-tech font-bold text-orange-400 mt-1">
                    {report?.ships_disabled ?? 0}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-red-400 uppercase font-medium">Lost</div>
                  <div className="text-xl font-mono-tech font-bold text-[#FF453A] mt-1">
                    {report?.ships_lost ?? 0}
                  </div>
                </div>

                <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-center">
                  <div className="text-[10px] text-sky-400 uppercase font-medium flex items-center justify-center gap-1">
                    <LifeBuoy className="w-3 h-3" /> Rescued
                  </div>
                  <div className="text-xl font-mono-tech font-bold text-sky-300 mt-1">
                    {report?.ships_rescued ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Munitions & Credit Rewards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-[#0A84FF]" />
                  Combat Statistics
                </div>
                <div className="space-y-1.5 text-xs text-slate-300 font-mono-tech">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Hostiles Neutralized:</span>
                    <span className="font-bold text-white">{report?.hostiles_neutralized ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Munitions Expended:</span>
                    <span className="font-bold text-slate-200">{report?.ammo_consumed ?? 0} rounds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">CIWS Interceptions:</span>
                    <span className="font-bold text-[#30D158]">{report?.ciws_interceptions ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white mb-1 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-[#FF9F0A]" />
                    Naval Treasury Compensation
                  </div>
                  <div className="text-xs text-slate-400">
                    Operational combat compensation added to drydock budget.
                  </div>
                </div>
                <div className="text-2xl font-mono-tech font-bold text-[#FF9F0A] tracking-tight mt-2">
                  +{report?.tactical_credits_earned ? report.tactical_credits_earned.toLocaleString() : '0'} CR
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-5 bg-white/[0.02] border-t border-white/[0.08]">
            {onViewIntelligence ? (
              <TacticalButton
                variant="ghost"
                onClick={onViewIntelligence}
              >
                Intelligence Database
              </TacticalButton>
            ) : <div />}

            <button
              onClick={onReturnToHarbor}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0A84FF] hover:bg-[#0077ED] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(10,132,255,0.35)] cursor-pointer"
            >
              <span>Return to Drydock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
