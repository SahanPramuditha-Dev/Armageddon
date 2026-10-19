import React from 'react';
import { Plane, Anchor, Navigation, Zap, Shield, Flame, Sun, Sunset, Moon } from 'lucide-react';
import { soundEngine } from '@/services/soundEngine';

interface CarrierControlsProps {
  carrierCamMode: number;
  setCarrierCamMode: React.Dispatch<React.SetStateAction<number>>;
  telemetry: {
    time: string;
  };
  setTelemetry: React.Dispatch<React.SetStateAction<{
    knots: number;
    sea: string;
    camera: string;
    time: string;
    beams: boolean;
    heloMode: string;
  }>>;
  sendSimMessage: (msg: Record<string, unknown>) => void;
}

export const CarrierControls: React.FC<CarrierControlsProps> = ({
  carrierCamMode,
  setCarrierCamMode,
  telemetry,
  setTelemetry,
  sendSimMessage,
}) => {
  return (
    <div className="space-y-3">
      {/* Flight Operations Row (3 Columns) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Catapult Launch Jet */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'LAUNCH_JET' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-indigo-500/25 via-indigo-950/15 to-transparent hover:from-indigo-500/35 border border-indigo-400/40 hover:border-indigo-300 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_16px_rgba(99,102,241,0.2),inset_0_1px_1px_rgba(255,255,255,0.18)]"
          title="Launch F/A-18 strike fighter via steam catapult [L]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Plane className="w-3.5 h-3.5 text-indigo-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white tracking-wide">Launch Jet</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-indigo-200 font-mono text-[9px] font-bold border border-indigo-500/25">
              L
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-indigo-200/60 mt-1 pl-5 text-left">
            Steam Catapult
          </div>
        </button>

        {/* Arrested Recovery / Recall */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'RECALL_JETS' });
          }}
          className="group relative p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] hover:border-white/25 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          title="Recall airborne patrol fighters for arrested landing [R]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Anchor className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white tracking-wide">Recall Wing</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-white/70 font-mono text-[9px] font-bold border border-white/10">
              R
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-white/50 mt-1 pl-5 text-left">
            Arrested Recovery
          </div>
        </button>

        {/* Helicopter Operations */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'TOGGLE_HELIS' });
          }}
          className="group relative p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] hover:border-emerald-400/35 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          title="Launch or recall MH-60 Seahawk helicopters [H]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white tracking-wide">Helo Ops</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-white/70 font-mono text-[9px] font-bold border border-white/10">
              H
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-white/50 mt-1 pl-5 text-left">
            MH-60S Helis
          </div>
        </button>
      </div>

      {/* Combat & Defensive Umbrella Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Full Strike Wing Salvo */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'STRIKE_SALVO' });
          }}
          className="group relative h-9 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400/50 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          title="Execute coordinated strike wing attack [S]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-amber-200 truncate">Strike Wing</span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-black/50 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/25">
            S
          </kbd>
        </button>

        {/* Air Defense Umbrella */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'AIR_DEFENSE' });
          }}
          className="group relative h-9 px-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 hover:border-sky-400/50 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          title="Activate automated RIM-116 Rolling Airframe defense umbrella [D]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-sky-200 truncate">Air Defense</span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-black/50 text-sky-300 font-mono text-[9px] font-bold border border-sky-500/25">
            D
          </kbd>
        </button>

        {/* Phalanx 20mm CIWS */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'CIWS_BURST' });
          }}
          className="group relative h-9 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-400/50 active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          title="Fire 20mm Phalanx Close-In Weapon System burst [C]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-rose-200 truncate">CIWS Burst</span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-black/50 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/25">
            C
          </kbd>
        </button>
      </div>

      {/* Flight Deck Camera Views & Lighting Track */}
      <div className="flex items-center gap-2.5 pt-0.5">
        <div className="flex-1 flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          {[
            { label: 'Orbit', mode: 0 },
            { label: 'Flight Deck', mode: 1 },
            { label: 'Launch Cam', mode: 9 },
            { label: 'Airborne Jets', mode: 2 },
          ].map((c) => {
            const isSelected = carrierCamMode === c.mode;
            return (
              <button
                key={c.label}
                onClick={() => {
                  soundEngine.playUIClick();
                  sendSimMessage({ type: 'SET_CAM_MODE', mode: c.mode });
                  setCarrierCamMode(c.mode);
                }}
                className={`flex-1 py-1 px-1.5 rounded-xl text-[10px] font-medium transition-all duration-150 cursor-pointer text-center active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-500/35 text-indigo-200 font-bold shadow-sm border border-indigo-400/40'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Day / Dusk / Night Lighting Track */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'CYCLE_TIME' });
              setTelemetry((t) => ({ ...t, time: 'day' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'day' ? 'bg-amber-500/25 text-amber-300 shadow-sm border border-amber-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Day Lighting"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'CYCLE_TIME' });
              setTelemetry((t) => ({ ...t, time: 'dusk' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'dusk' ? 'bg-orange-500/25 text-orange-300 shadow-sm border border-orange-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Dusk Lighting"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'CYCLE_TIME' });
              setTelemetry((t) => ({ ...t, time: 'night' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'night' ? 'bg-indigo-500/25 text-indigo-300 shadow-sm border border-indigo-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Night Lighting"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Military Grade Tactical Shortcuts Footer */}
      <div className="flex items-center justify-center gap-2.5 pt-1 text-[10px] font-mono-tech text-white/50 border-t border-white/[0.06]">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">L</kbd> Launch
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">R</kbd> Recall
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">S</kbd> Strike
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">D</kbd> Air Defense
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">C</kbd> CIWS
        </span>
      </div>
    </div>
  );
};
