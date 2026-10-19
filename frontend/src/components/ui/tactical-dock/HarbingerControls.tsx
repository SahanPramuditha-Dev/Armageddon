import React, { useState } from 'react';
import { Flame, Crosshair, Zap, Sun, Shield, Plane, EyeOff, Radio, Wrench, Compass } from 'lucide-react';
import { soundEngine } from '@/services/soundEngine';

interface HarbingerControlsProps {
  harbingerCam: string;
  setHarbingerCam: React.Dispatch<React.SetStateAction<string>>;
  sendSimMessage: (msg: Record<string, unknown>) => void;
}

export const HarbingerControls: React.FC<HarbingerControlsProps> = ({
  harbingerCam,
  setHarbingerCam,
  sendSimMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'ARSENAL' | 'DEFENSE' | 'FLIGHT'>('ARSENAL');

  return (
    <div className="space-y-3">
      {/* Subsystem Mode Switcher (Sleek Apple Inset Segmented Pill) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
        <button
          onClick={() => {
            soundEngine.playUIClick();
            setActiveTab('ARSENAL');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'ARSENAL'
              ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Arsenal (Weapons)</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playUIClick();
            setActiveTab('DEFENSE');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'DEFENSE'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Defenses & ECM</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playUIClick();
            setActiveTab('FLIGHT');
          }}
          className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
            activeTab === 'FLIGHT'
              ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-purple-400" />
          <span>Vector HUD</span>
        </button>
      </div>

      {/* Mode Panel: Arsenal / Weapons (2x2 Grid) */}
      {activeTab === 'ARSENAL' && (
        <div className="grid grid-cols-2 gap-2.5 animate-fadeIn">
          {/* Plasma Lance */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'plasma' });
            }}
            className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-orange-500/25 via-orange-950/15 to-transparent hover:from-orange-500/35 border border-orange-400/40 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_16px_rgba(249,115,22,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)]"
            title="Fire twin directed plasma siphon bolt barrage [1]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-400/30 group-hover:scale-105 transition-transform">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Plasma Siphon</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-orange-200 font-mono text-[9px] font-bold border border-orange-500/25">
                1
              </kbd>
            </div>
            <div className="text-[10px] font-mono-tech text-orange-200/60 mt-1 pl-8 text-left">
              Twin Directed Bolts
            </div>
          </button>

          {/* Gravimetric Shredder */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'shred' });
            }}
            className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-rose-500/20 via-rose-950/10 to-transparent hover:from-rose-500/30 border border-rose-400/30 hover:border-rose-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            title="Launch high-velocity gravimetric shredder disks [2]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center border border-rose-400/30 group-hover:scale-105 transition-transform">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Grav Shredder</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-rose-200 font-mono text-[9px] font-bold border border-rose-500/25">
                2
              </kbd>
            </div>
            <div className="text-[10px] font-mono-tech text-rose-200/60 mt-1 pl-8 text-left">
              Gravimetric Disks
            </div>
          </button>

          {/* Bio-Swarm Missiles */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'swarm' });
            }}
            className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-amber-950/10 to-transparent hover:from-amber-500/30 border border-amber-400/30 hover:border-amber-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            title="Deploy homing bio-swarm micro-missiles [3]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Bio-Swarm Pods</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-amber-200 font-mono text-[9px] font-bold border border-amber-500/25">
                3
              </kbd>
            </div>
            <div className="text-[10px] font-mono-tech text-amber-200/60 mt-1 pl-8 text-left">
              Multi-Homing Salvo
            </div>
          </button>

          {/* Particle Beam Lance */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'lance' });
            }}
            className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-yellow-500/20 via-yellow-950/10 to-transparent hover:from-yellow-500/30 border border-yellow-400/30 hover:border-yellow-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            title="Focus concentrated high-energy particle lance [5]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-400/30 group-hover:scale-105 transition-transform">
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Particle Lance</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-yellow-200 font-mono text-[9px] font-bold border border-yellow-500/25">
                5
              </kbd>
            </div>
            <div className="text-[10px] font-mono-tech text-yellow-200/60 mt-1 pl-8 text-left">
              Focused Energy Core
            </div>
          </button>
        </div>
      )}

      {/* Mode Panel: Defenses & Countermeasures (2x3 Grid) */}
      {activeTab === 'DEFENSE' && (
        <div className="grid grid-cols-3 gap-2.5 animate-fadeIn">
          {/* Biomorphic Shield Matrix */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'shield' });
            }}
            className="group relative p-2 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            title="Toggle biomorphic energy barrier [Q]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white truncate">Shield</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/25">
              Q
            </kbd>
          </button>

          {/* Thermal Decoy Flares */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'flare' });
            }}
            className="group relative p-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] hover:border-emerald-400/40 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between text-slate-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            title="Discharge thermal decoy pods against incoming missiles [E]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold truncate">Decoys</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-white/70 font-mono text-[9px] font-bold border border-white/10">
              E
            </kbd>
          </button>

          {/* EMP Radial Pulse */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'emp' });
            }}
            className="group relative p-2 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/35 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            title="Discharge radial EMP pulse neutralizing hostile target locks [R]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white truncate">EMP</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-purple-300 font-mono text-[9px] font-bold border border-purple-500/25">
              R
            </kbd>
          </button>

          {/* Phase Cloak */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'cloak' });
            }}
            className="group relative p-2 rounded-2xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/35 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            title="Engage electromagnetic phase cloaking field [C]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <EyeOff className="w-3.5 h-3.5 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white truncate">Cloak</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-teal-300 font-mono text-[9px] font-bold border border-teal-500/25">
              C
            </kbd>
          </button>

          {/* Defense Drones */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'drone' });
            }}
            className="group relative p-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] hover:border-sky-400/40 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between text-slate-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
            title="Launch escort point-defense drones [6]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold truncate">Drones</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-white/70 font-mono text-[9px] font-bold border border-white/10">
              6
            </kbd>
          </button>

          {/* Nanite Self-Repair */}
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'ACTION', action: 'repair' });
            }}
            className="group relative p-2 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            title="Deploy nanite repair swarm [F]"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white truncate">Nanites</span>
            </div>
            <kbd className="px-1.5 py-0.2 rounded bg-black/60 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/25">
              F
            </kbd>
          </button>
        </div>
      )}

      {/* Mode Panel: Flight Vector Controls HUD */}
      {activeTab === 'FLIGHT' && (
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-amber-300 border border-white/15">
              W / S / A / D
            </kbd>
            <span className="text-xs text-white/80">Vector Thrust</span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-sky-300 border border-white/15">
              Space / ↓
            </kbd>
            <span className="text-xs text-white/80">Climb / Submerge</span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-bold text-rose-300 border border-white/15">
              Shift
            </kbd>
            <span className="text-xs text-white/80">Afterburner</span>
          </div>
        </div>
      )}

      {/* Camera Modes Track & Quick Cycle Button */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="flex-1 flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          {[
            { label: 'Chase Cam', view: 'chase' },
            { label: 'Orbit View', view: 'orbit' },
            { label: 'Top Tactical', view: 'top' },
          ].map((c) => {
            const isSelected = harbingerCam === c.view;
            return (
              <button
                key={c.label}
                onClick={() => {
                  soundEngine.playUIClick();
                  sendSimMessage({ type: 'ACTION', action: 'view' });
                  setHarbingerCam(c.view);
                }}
                className={`flex-1 py-1 px-1 rounded-xl text-[10px] font-medium transition-all duration-150 cursor-pointer text-center active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500/30 text-amber-200 font-bold shadow-sm border border-amber-400/35'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Quick Camera Cycle Button */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'ACTION', action: 'view' });
            setHarbingerCam((c) => (c === 'chase' ? 'orbit' : c === 'orbit' ? 'top' : 'chase'));
          }}
          className="px-3.5 py-1.5 rounded-2xl bg-black/50 border border-white/[0.08] text-[10px] font-mono-tech text-white/70 hover:text-white cursor-pointer active:scale-95"
          title="Cycle view mode [V]"
        >
          [V] Cam Cycle
        </button>
      </div>

      {/* Military Grade Tactical Shortcuts Footer */}
      <div className="flex items-center justify-center gap-2.5 pt-1 text-[10px] font-mono-tech text-white/50 border-t border-white/[0.06]">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">1-5</kbd> Arsenal
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">Q</kbd> Shield
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">E</kbd> Decoy
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">R</kbd> EMP
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">C</kbd> Cloak
        </span>
      </div>
    </div>
  );
};
