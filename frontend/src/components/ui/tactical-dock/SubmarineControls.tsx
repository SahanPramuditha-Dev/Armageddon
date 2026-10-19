import React from 'react';
import { Crosshair, Radar, Waves, Sun, Sunset, Moon } from 'lucide-react';
import { soundEngine } from '@/services/soundEngine';

interface SubmarineControlsProps {
  subDepth: number;
  setSubDepth: React.Dispatch<React.SetStateAction<number>>;
  sendSimMessage: (msg: Record<string, unknown>) => void;
}

export const SubmarineControls: React.FC<SubmarineControlsProps> = ({
  subDepth,
  setSubDepth,
  sendSimMessage,
}) => {
  const [timeMode, setTimeMode] = React.useState<'day' | 'dusk' | 'night'>('day');
  return (
    <div className="space-y-3">
      {/* 2x2 Tactical Action Console Tiles (Ample breathing room, zero truncation, high-contrast glow) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Mk 48 Torpedo Salvo */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'FIRE_TORPEDOES' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-teal-500/20 via-teal-900/10 to-transparent hover:from-teal-500/30 hover:via-teal-900/20 border border-teal-400/40 hover:border-teal-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_20px_rgba(20,184,166,0.18),inset_0_1px_1px_rgba(255,255,255,0.2)]"
          title="Launch Mk 48 ADCAP heavy wire-guided acoustic torpedoes [Space]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-400/30 group-hover:scale-105 transition-transform">
                <Crosshair className="w-3.5 h-3.5 text-teal-300" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Mk 48 Torpedoes</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-black/60 text-teal-300 font-mono text-[9px] font-bold border border-teal-500/30">
              Space
            </kbd>
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 pl-8 text-[10px] font-mono-tech text-teal-200/60">
            <span>Acoustic Wire-Guided</span>
            <span className="text-emerald-400 font-semibold">Tubes Armed</span>
          </div>
        </button>

        {/* Active Acoustic Sonar Ping */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'SONAR_PING' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-sky-500/20 via-sky-900/10 to-transparent hover:from-sky-500/30 hover:via-sky-900/20 border border-sky-400/40 hover:border-sky-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_20px_rgba(14,165,233,0.18),inset_0_1px_1px_rgba(255,255,255,0.2)]"
          title="Transmit active high-frequency spherical acoustic ping [P]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center border border-sky-400/30 group-hover:scale-105 transition-transform">
                <Radar className="w-3.5 h-3.5 text-sky-300" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Sonar Active Ping</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-black/60 text-sky-300 font-mono text-[9px] font-bold border border-sky-500/30">
              P
            </kbd>
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 pl-8 text-[10px] font-mono-tech text-sky-200/60">
            <span>BQQ-10 Spherical Array</span>
            <span className="text-sky-300 font-semibold">Sweep 360°</span>
          </div>
        </button>

        {/* Emergency Dive / Surface Ballast Blow */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'TOGGLE_DIVE' });
            setSubDepth((d) => (d < 10 ? 40 : 0));
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-cyan-500/15 via-white/[0.03] to-transparent hover:from-cyan-500/25 border border-cyan-400/30 hover:border-cyan-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
          title="Blow ballast tanks to surface or plunge to 40m depth [D]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30 group-hover:scale-105 transition-transform">
                <Waves className="w-3.5 h-3.5 text-cyan-300" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">
                {subDepth < 10 ? 'Submerge to 40M' : 'Blow Ballast (Surface)'}
              </span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-black/60 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
              D
            </kbd>
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 pl-8 text-[10px] font-mono-tech text-cyan-200/60">
            <span>Variable Ballast Tank</span>
            <span className="text-cyan-300 font-semibold">{subDepth < 10 ? 'Surface' : `${subDepth}M Submerged`}</span>
          </div>
        </button>

        {/* High-Intensity Forward Searchlights */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'TOGGLE_LIGHTS' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-amber-500/15 via-white/[0.03] to-transparent hover:from-amber-500/25 border border-amber-400/30 hover:border-amber-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
          title="Toggle high-intensity underwater forward searchlights [L]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Floodlights Array</span>
            </div>
            <kbd className="px-2 py-0.5 rounded-md bg-black/60 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/30">
              L
            </kbd>
          </div>
          <div className="flex items-center justify-between w-full mt-1.5 pl-8 text-[10px] font-mono-tech text-amber-200/60">
            <span>Dual High-Lux Cones</span>
            <span className="text-amber-300 font-semibold">Active Optics</span>
          </div>
        </button>
      </div>

      {/* Sensor Scopes & Depth Ballast Presets */}
      <div className="flex items-center gap-2.5 pt-0.5">
        {/* Optical Sensor Presets Inset Track */}
        <div className="flex-1 flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          {[
            { label: 'Orbit', cam: 'orbit' },
            { label: 'Periscope', cam: 'peri' },
            { label: 'Bow', cam: 'bow' },
            { label: 'Stern', cam: 'stern' },
            { label: 'Top', cam: 'top' },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'SET_CAM', cam: c.cam });
              }}
              className="flex-1 py-1 px-1.5 rounded-xl text-[10px] font-medium transition-all duration-150 cursor-pointer text-center text-white/60 hover:text-white hover:bg-white/10 whitespace-nowrap active:scale-95"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Quick Ballast Depth Presets Inset Track */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          {[
            { label: '0m', depth: 0, title: 'Surface' },
            { label: '15m', depth: 15, title: 'Periscope Depth' },
            { label: '40m', depth: 40, title: 'Patrol Depth' },
            { label: '80m', depth: 80, title: 'Deep Abyss' },
          ].map((dp) => {
            const isSelected = subDepth === dp.depth;
            return (
              <button
                key={dp.label}
                onClick={() => {
                  soundEngine.playUIClick();
                  sendSimMessage({ type: 'SET_DEPTH', depth: dp.depth });
                  setSubDepth(dp.depth);
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono-tech transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-teal-500/35 text-teal-200 font-bold border border-teal-400/40 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                title={`Submerge to ${dp.depth} meters (${dp.title})`}
              >
                {dp.label}
              </button>
            );
          })}
        </div>

        {/* Day / Dusk / Night Lighting Track */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'SET_TIME', time: 'day' });
              setTimeMode('day');
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              timeMode === 'day' ? 'bg-amber-500/25 text-amber-300 shadow-sm border border-amber-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Day Lighting Mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'SET_TIME', time: 'dusk' });
              setTimeMode('dusk');
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              timeMode === 'dusk' ? 'bg-orange-500/25 text-orange-300 shadow-sm border border-orange-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Dusk Lighting Mode"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'SET_TIME', time: 'night' });
              setTimeMode('night');
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              timeMode === 'night' ? 'bg-indigo-500/25 text-indigo-300 shadow-sm border border-indigo-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Night Combat Lighting"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Military Grade Tactical Shortcuts Footer */}
      <div className="flex items-center justify-center gap-3 pt-1 text-[10px] font-mono-tech text-white/50 border-t border-white/[0.06] flex-wrap">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">Space</kbd> Torpedoes
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">P</kbd> Sonar Ping
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">D</kbd> Dive
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">L</kbd> Lights
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">T</kbd> Time
        </span>
      </div>
    </div>
  );
};
