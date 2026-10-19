import React, { useState } from 'react';
import { 
  Shield, ChevronLeft, ChevronRight, Play, Anchor, Crosshair, 
  Flame, Radar, Zap, Eye, Cpu, Radio, Plane, Waves, ShieldAlert,
  Target, Activity, Layers, FileText
} from 'lucide-react';
import { SimulatorVessel, SIMULATOR_CONFIGS } from '@/components/ui/SimulationModal';
import { soundEngine } from '@/services/soundEngine';

interface SubsystemInfo {
  name: string;
  status: string;
  detail: string;
  statusColor: string;
}

interface VesselSpec {
  hardpoints: string[];
  subsystems: SubsystemInfo[];
  combatRole: string;
}

interface ScenarioInfo {
  id: string;
  sortieNumber: string;
  codename: string;
  title: string;
  subtitle: string;
  enemyFaction: string;
  threatLevel: string;
  threatBadge: string;
  coordinates: string;
  theater: string;
  desc: string;
  objectives: string[];
}

interface FlagshipCommandCardProps {
  activeSimulation: SimulatorVessel;
  onSelectVessel: (vessel: SimulatorVessel) => void;
  onCollapse: () => void;
  onCommenceSortie: () => void;
  onOpenTaskForce: () => void;
  onQuickScramble: () => void;
  scenario: ScenarioInfo;
  vesselSpecs: Record<SimulatorVessel, VesselSpec>;
}

// Tactical vessel callsigns & telemetry designations
const VESSEL_TACTICAL_META: Record<SimulatorVessel, {
  callsign: string;
  hullCode: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
  badgeClass: string;
}> = {
  SENTINEL: {
    callsign: 'Sentinel',
    hullCode: 'DDG-88',
    icon: Anchor,
    accentColor: 'text-sky-400',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  CARRIER: {
    callsign: 'Meridian',
    hullCode: 'CVN-72',
    icon: Plane,
    accentColor: 'text-indigo-400',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  SUBMARINE: {
    callsign: 'Abyss',
    hullCode: 'SSN-21',
    icon: Waves,
    accentColor: 'text-teal-400',
    glowColor: 'rgba(45, 212, 191, 0.4)',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  },
  HARBINGER: {
    callsign: 'Harbinger',
    hullCode: 'X-01',
    icon: Zap,
    accentColor: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

const getHardpointIcon = (hp: string) => {
  const lower = hp.toLowerCase();
  if (lower.includes('torpedo') || lower.includes('tube') || lower.includes('lance') || lower.includes('gun') || lower.includes('16″')) {
    return <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />;
  }
  if (lower.includes('missile') || lower.includes('tomahawk') || lower.includes('vls') || lower.includes('shredder')) {
    return <Flame className="w-3 h-3 text-amber-400 shrink-0" />;
  }
  if (lower.includes('sonar') || lower.includes('radar') || lower.includes('periscope') || lower.includes('optronic')) {
    return <Eye className="w-3 h-3 text-sky-400 shrink-0" />;
  }
  if (lower.includes('ciws') || lower.includes('shield') || lower.includes('rim-116') || lower.includes('defense')) {
    return <Shield className="w-3 h-3 text-emerald-400 shrink-0" />;
  }
  if (lower.includes('nuclear') || lower.includes('core') || lower.includes('gravitic') || lower.includes('emp')) {
    return <Cpu className="w-3 h-3 text-purple-400 shrink-0" />;
  }
  if (lower.includes('hornet') || lower.includes('helo') || lower.includes('jet') || lower.includes('catapult')) {
    return <Plane className="w-3 h-3 text-indigo-400 shrink-0" />;
  }
  return <Target className="w-3 h-3 text-white/50 shrink-0" />;
};

export const FlagshipCommandCard: React.FC<FlagshipCommandCardProps> = ({
  activeSimulation,
  onSelectVessel,
  onCollapse,
  onCommenceSortie,
  onOpenTaskForce,
  onQuickScramble,
  scenario,
  vesselSpecs,
}) => {
  // Inner view tab: systems vs mission directive to keep the card compact & balanced
  const [activeTab, setActiveTab] = useState<'SYSTEMS' | 'DIRECTIVE'>('SYSTEMS');

  const currentMeta = VESSEL_TACTICAL_META[activeSimulation];
  const currentConfig = SIMULATOR_CONFIGS[activeSimulation];
  const currentSpecs = vesselSpecs[activeSimulation];

  const vesselKeys: SimulatorVessel[] = ['SENTINEL', 'CARRIER', 'SUBMARINE', 'HARBINGER'];

  return (
    <div 
      className="w-[360px] max-w-[calc(100vw-32px)] p-3.5 sm:p-4 rounded-3xl border border-white/[0.12] border-t-white/[0.22] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8),0_0_30px_rgba(10,132,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col gap-2.5 backdrop-blur-3xl bg-gradient-to-b from-[#0c1626]/90 via-[#070e1b]/95 to-[#040810]/98 select-none text-slate-100"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. COMPACT HEADER: TITLE + DEFCON STATUS + COLLAPSE           */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0A84FF]/25 to-sky-400/10 border border-sky-400/30 flex items-center justify-center">
            <Shield className="w-3 h-3 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-white tracking-wider uppercase">
                Flagship Command
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[8.5px] font-mono-tech font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <p className="text-[8.5px] font-mono-tech text-white/40">
              CIC DIRECTORY // {currentMeta.hullCode}
            </p>
          </div>
        </div>

        <button
          onClick={onCollapse}
          className="w-6 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer active:scale-95"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPACT SEGMENTED VESSEL SELECTOR                          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-0.5 rounded-xl bg-black/45 border border-white/[0.08] grid grid-cols-4 gap-0.5">
        {vesselKeys.map((vKey) => {
          const isSelected = activeSimulation === vKey;
          const meta = VESSEL_TACTICAL_META[vKey];
          const Icon = meta.icon;

          return (
            <button
              key={vKey}
              onClick={() => {
                soundEngine.playUIClick();
                onSelectVessel(vKey);
              }}
              className={`py-1.5 px-1 rounded-lg transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-0.5 active:scale-95 relative ${
                isSelected
                  ? 'bg-white/[0.12] text-white border border-white/[0.18] shadow-sm font-semibold'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-3 h-3 ${isSelected ? meta.accentColor : 'opacity-65'}`} />
              <span className="text-[9.5px] tracking-tight leading-none">{meta.callsign}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. DUAL-MODE SWITCHER (SYSTEMS vs DIRECTIVE)                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        <button
          onClick={() => {
            soundEngine.playUIClick();
            setActiveTab('SYSTEMS');
          }}
          className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'SYSTEMS'
              ? 'bg-white/10 text-white shadow-xs font-semibold'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Vessel Systems</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playUIClick();
            setActiveTab('DIRECTIVE');
          }}
          className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'DIRECTIVE'
              ? 'bg-white/10 text-white shadow-xs font-semibold'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>Mission Directive</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. CONTENT PANE (EITHER SYSTEMS OR DIRECTIVE)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="min-h-[175px] max-h-[190px] overflow-hidden flex flex-col justify-between">
        {activeTab === 'SYSTEMS' ? (
          <div className="space-y-2">
            {/* Vessel Identity */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono-tech font-bold px-1 py-0.2 rounded bg-white/[0.08] text-white/90 border border-white/[0.1]">
                    {currentMeta.hullCode}
                  </span>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {currentConfig.name.split(' (')[0]}
                  </h3>
                </div>
                <p className="text-[9.5px] text-white/50 font-normal mt-0.5 truncate max-w-[210px]">
                  {currentConfig.classTitle}
                </p>
              </div>

              <span className={`px-1.5 py-0.2 text-[8.5px] font-mono-tech font-semibold rounded-full uppercase border shrink-0 ${currentConfig.badgeClass}`}>
                {currentConfig.badge}
              </span>
            </div>

            {/* Compact 2-column Hardpoints (Top 4 items) */}
            <div className="grid grid-cols-2 gap-1">
              {currentSpecs.hardpoints.slice(0, 4).map((hp) => (
                <div 
                  key={hp} 
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/[0.05] text-[9.5px] text-white/80"
                >
                  {getHardpointIcon(hp)}
                  <span className="truncate font-medium text-white/85" title={hp}>
                    {hp}
                  </span>
                </div>
              ))}
            </div>

            {/* Subsystem Telemetry Rows */}
            <div className="space-y-1 pt-1 border-t border-white/[0.05]">
              {currentSpecs.subsystems.slice(0, 3).map((sub) => (
                <div 
                  key={sub.name} 
                  className="flex items-center justify-between text-[10px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                    <span className="text-white/80 font-medium text-[10px]">{sub.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/40 font-mono-tech hidden sm:inline truncate max-w-[110px]">
                      {sub.detail}
                    </span>
                    <span className={`text-[8px] font-mono-tech font-semibold px-1 py-0.2 rounded uppercase border ${sub.statusColor}`}>
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Mission Directive Pane */
          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1.5 shadow-[inset_0_1px_0_rgba(244,63,94,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono-tech font-bold text-rose-300 tracking-wider uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" />
                {scenario.codename}
              </span>
              <span className="text-[8px] font-mono-tech px-1.5 py-0.2 rounded-full font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {scenario.threatLevel}
              </span>
            </div>

            <p className="text-[11px] font-bold text-white tracking-tight">
              {scenario.title} &bull; <span className="text-rose-200/80 font-normal">{scenario.enemyFaction}</span>
            </p>

            <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
              {scenario.desc}
            </p>

            {/* Objective Chips */}
            {scenario.objectives && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {scenario.objectives.slice(0, 2).map((obj, i) => (
                  <span 
                    key={obj} 
                    className="px-1.5 py-0.2 rounded text-[8.5px] font-mono-tech bg-black/40 text-rose-200/90 border border-rose-500/20 truncate"
                  >
                    0{i + 1}. {obj}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. PRIMARY & SECONDARY ACTIONS                                */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
        <button
          onClick={() => {
            soundEngine.playUIClick();
            onCommenceSortie();
          }}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold tracking-wider text-white bg-gradient-to-b from-[#0A84FF] via-[#0076EB] to-[#0060C7] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between shadow-[0_6px_20px_rgba(10,132,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-sky-300/30 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center">
              <Play className="w-2.5 h-2.5 fill-white text-white ml-0.5" />
            </div>
            <span>COMMENCE SORTIE</span>
          </div>
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
            <span className="text-[8.5px] font-mono-tech px-1 py-0.2 rounded bg-black/30 border border-white/20">
              Enter ↵
            </span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              onOpenTaskForce();
            }}
            className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Anchor className="w-3 h-3 text-emerald-400" />
            <span>Task Force</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUIClick();
              onQuickScramble();
            }}
            className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Crosshair className="w-3 h-3 text-rose-400" />
            <span>Quick Scramble</span>
          </button>
        </div>
      </div>
    </div>
  );
};
