import React, { useState } from 'react';
import { Flame, Zap, Plane, Sun, Sunset, Moon, Crosshair, Radio, Eye, Target, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { soundEngine } from '@/services/soundEngine';

interface SentinelControlsProps {
  telemetry: {
    camera: string;
    time: string;
    heloMode: string;
  };
  sendSimMessage: (msg: Record<string, unknown>) => void;
  setTelemetry: React.Dispatch<React.SetStateAction<{
    knots: number;
    sea: string;
    camera: string;
    time: string;
    beams: boolean;
    heloMode: string;
  }>>;
}

export const SentinelControls: React.FC<SentinelControlsProps> = ({
  telemetry,
  sendSimMessage,
  setTelemetry,
}) => {
  const isAirborne = telemetry.heloMode && telemetry.heloMode !== 'landed';
  const isLanding = telemetry.heloMode === 'landing';
  const [isSpotlightOn, setIsSpotlightOn] = useState(true);

  return (
    <div className="space-y-2.5">
      {/* Primary Weapon & Flight Deck Action Row */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Main Naval Guns */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'FIRE_GUNS' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-orange-500/20 via-orange-950/10 to-transparent hover:from-orange-500/30 border border-orange-500/35 hover:border-orange-400 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_16px_rgba(249,115,22,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)]"
          title="Fire 16-inch Triple Main Gun Broadside [Space / F]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white tracking-wide">16″ Guns</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-orange-300 font-mono text-[9px] font-bold border border-orange-500/20">
              Space
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-orange-200/60 mt-1 pl-5 text-left">
            Triple Turrets
          </div>
        </button>

        {/* Tomahawk VLS Missiles */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'FIRE_MISSILES' });
          }}
          className="group relative p-2.5 rounded-2xl bg-gradient-to-b from-sky-500/20 via-sky-950/10 to-transparent hover:from-sky-500/30 border border-sky-500/35 hover:border-sky-400 active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[0_4px_16px_rgba(14,165,233,0.18),inset_0_1px_1px_rgba(255,255,255,0.18)]"
          title="Launch Tomahawk Vertical Launch System Salvo [M]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white tracking-wide">Tomahawk</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-sky-300 font-mono text-[9px] font-bold border border-sky-500/20">
              M
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-sky-200/60 mt-1 pl-5 text-left">
            18-Cell VLS Salvo
          </div>
        </button>

        {/* Recon Helicopter Ops (Launch / RTB) */}
        <button
          onClick={() => {
            soundEngine.playUIClick();
            sendSimMessage({ type: 'TOGGLE_HELO' });
          }}
          className={`group relative p-2.5 rounded-2xl border active:scale-[0.98] transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] ${
            isLanding
              ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.35)]'
              : isAirborne
              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
              : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.12] text-slate-200 hover:text-white'
          }`}
          title="Launch or recall MH-60R Seahawk reconnaissance helicopter [H]"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 min-w-0">
              <Plane className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                isLanding ? 'text-amber-300 animate-pulse' : isAirborne ? 'text-emerald-300' : 'text-slate-400'
              }`} />
              <span className="text-xs font-bold tracking-wide">
                {isLanding ? 'Landing...' : isAirborne ? 'Recall RTB' : 'Seahawk'}
              </span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-white/70 font-mono text-[9px] font-bold border border-white/10">
              H
            </kbd>
          </div>
          <div className="text-[10px] font-mono-tech text-white/50 mt-1 pl-5 text-left">
            {isLanding ? 'Touchdown Approach' : isAirborne ? 'Land on Deck' : 'Launch Helo'}
          </div>
        </button>
      </div>

      {/* Airborne Helicopter Mission Operations Sub-Bar (Revealed when Helo is in flight!) */}
      {isAirborne && (
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#07131b]/60 to-emerald-950/40 border border-emerald-500/30 flex flex-col gap-2 shadow-[inset_0_1px_0_rgba(52,211,153,0.15)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 pl-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono-tech font-bold text-emerald-300 uppercase tracking-wider">
                Airborne Ops • Seahawk Combat Suite
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400/70 uppercase">
              Status: {telemetry.heloMode}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {/* 30mm Guns */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'HELO_GUNS' });
              }}
              className="px-2 py-1.5 rounded-xl text-[10.5px] font-bold bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 flex items-center justify-between transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              title="Fire 30mm Autocannon strafing burst [C]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Target className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">30mm Guns</span>
              </div>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-amber-500/30">C</kbd>
            </button>

            {/* S-8 Rockets */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'HELO_ROCKETS' });
              }}
              className="px-2 py-1.5 rounded-xl text-[10.5px] font-bold bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-200 flex items-center justify-between transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
              title="Fire Hydra 70 / S-8 rocket pod salvo [R]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Zap className="w-3 h-3 text-orange-400 shrink-0" />
                <span className="truncate">Rockets</span>
              </div>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-orange-500/30">R</kbd>
            </button>

            {/* Hellfire Strike */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'HELO_STRIKE' });
              }}
              className="px-2 py-1.5 rounded-xl text-[10.5px] font-bold bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 flex items-center justify-between transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              title="Launch AGM-114 Hellfire missile salvo from Seahawk [K]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Crosshair className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">Hellfire</span>
              </div>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-rose-500/30">K</kbd>
            </button>

            {/* Decoy Flares */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'HELO_FLARES' });
              }}
              className="px-2 py-1.5 rounded-xl text-[10.5px] font-bold bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-200 flex items-center justify-between transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              title="Dispense infrared decoy flares & chaff [X]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Sparkles className="w-3 h-3 text-yellow-300 shrink-0" />
                <span className="truncate">Flares</span>
              </div>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-yellow-500/30">X</kbd>
            </button>
          </div>

          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            {/* Drop Sonobuoy (Acoustic ASW Recon) */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'HELO_SONOBUOY' });
              }}
              className="flex-1 px-2 py-1.5 rounded-xl text-[10.5px] font-bold bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
              title="Deploy dipping sonobuoy for acoustic submarine detection [B]"
            >
              <Radio className="w-3 h-3 text-sky-400" />
              <span>Sonobuoy</span>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-sky-500/30">B</kbd>
            </button>

            {/* FLIR Cam / Electro-Optical Thermal Turret */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                const targetCam = telemetry.camera === 'flir' ? 'helo' : 'flir';
                sendSimMessage({ type: 'SET_CAM', cam: targetCam });
                sendSimMessage({ type: 'HELO_FLIR' });
                setTelemetry((t) => ({ ...t, camera: targetCam }));
              }}
              className={`flex-1 px-2 py-1.5 rounded-xl text-[10.5px] font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                telemetry.camera === 'flir'
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Toggle Electro-Optical Sensor / FLIR thermal nose turret view [V]"
            >
              <Eye className={`w-3 h-3 ${telemetry.camera === 'flir' ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>FLIR Cam</span>
              <kbd className="text-[8px] font-mono bg-black/50 px-1 py-0.2 rounded border border-cyan-500/30">V</kbd>
            </button>

            {/* Direct Helo Chase Cam */}
            <button
              onClick={() => {
                soundEngine.playUIClick();
                sendSimMessage({ type: 'SET_CAM', cam: 'helo' });
                setTelemetry((t) => ({ ...t, camera: 'helo' }));
              }}
              className={`flex-1 px-2 py-1.5 rounded-xl text-[10.5px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                telemetry.camera === 'helo'
                  ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Switch camera to chase MH-60R Seahawk [7]"
            >
              <Plane className="w-3 h-3 text-emerald-400" />
              <span>Chase Cam</span>
            </button>
          </div>
        </div>
      )}

      {/* FLIR Active Slew & Zoom Controller */}
      {telemetry.camera === 'flir' && (
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-[#04121f]/70 to-cyan-950/40 border border-cyan-500/40 flex flex-col gap-2 shadow-[inset_0_1px_0_rgba(6,182,212,0.2),0_0_16px_rgba(6,182,212,0.15)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 pl-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono-tech font-bold text-cyan-300 uppercase tracking-wider">
                FLIR Turret Slewing • EOS-9A Articulation
              </span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
              ARROWS / DRAG ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            {/* Slewing D-Pad */}
            <div className="flex items-center gap-1">
              <div className="grid grid-cols-3 grid-rows-3 gap-1 place-items-center bg-black/60 p-1 rounded-xl border border-cyan-500/30">
                <div />
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_PAN', dy: 1 });
                  }}
                  className="w-6 h-6 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Tilt Up [ArrowUp]"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_PAN', dx: 1 });
                  }}
                  className="w-6 h-6 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Pan Left [ArrowLeft]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_CENTER' });
                  }}
                  className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/35 text-white border border-white/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Boresight Center / Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_PAN', dx: -1 });
                  }}
                  className="w-6 h-6 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Pan Right [ArrowRight]"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_PAN', dy: -1 });
                  }}
                  className="w-6 h-6 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 border border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  title="Tilt Down [ArrowDown]"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div />
              </div>
            </div>

            {/* Quick Zoom Presets & Stepping */}
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_ZOOM', zoom: 'in' });
                  }}
                  className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Zoom In [+ / =]"
                >
                  <ZoomIn className="w-3 h-3 text-cyan-300" />
                  <span>Zoom +</span>
                </button>
                <button
                  onClick={() => {
                    soundEngine.playUIClick();
                    sendSimMessage({ type: 'FLIR_ZOOM', zoom: 'out' });
                  }}
                  className="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  title="Zoom Out [- / _]"
                >
                  <ZoomOut className="w-3 h-3 text-cyan-300" />
                  <span>Zoom −</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: '1X', fov: 52 },
                  { label: '2X', fov: 38 },
                  { label: '4X', fov: 22 },
                  { label: '8X', fov: 12 },
                ].map(({ label, fov }) => (
                  <button
                    key={label}
                    onClick={() => {
                      soundEngine.playUIClick();
                      sendSimMessage({ type: 'FLIR_ZOOM', zoom: fov });
                    }}
                    className="py-1 rounded-md text-[9.5px] font-mono font-bold bg-white/5 hover:bg-cyan-500/25 border border-white/10 hover:border-cyan-400/40 text-cyan-200 transition-all cursor-pointer active:scale-95"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optical Camera Angles & Lighting Track */}
      <div className="flex items-center gap-2.5 pt-0.5">
        {/* Camera Selector Inset Track */}
        <div className="flex-1 flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08]">
          {(['orbit', 'bridge', 'bow', 'side', 'helo', 'flir'] as const).map((cam) => {
            const isSelected = telemetry.camera.toLowerCase() === cam;
            return (
              <button
                key={cam}
                onClick={() => {
                  soundEngine.playUIClick();
                  sendSimMessage({ type: 'SET_CAM', cam });
                  setTelemetry((t) => ({ ...t, camera: cam }));
                }}
                className={`flex-1 py-1 px-1 rounded-xl text-[10px] font-medium uppercase tracking-wider transition-all duration-150 cursor-pointer text-center active:scale-95 ${
                  isSelected
                    ? 'bg-white/[0.18] text-white font-semibold shadow-sm border border-white/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {cam}
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
              setTelemetry((t) => ({ ...t, time: 'day' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'day' ? 'bg-amber-500/25 text-amber-300 shadow-sm border border-amber-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Day Lighting Mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'SET_TIME', time: 'dusk' });
              setTelemetry((t) => ({ ...t, time: 'dusk' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'dusk' ? 'bg-orange-500/25 text-orange-300 shadow-sm border border-orange-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Dusk Lighting Mode"
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundEngine.playUIClick();
              sendSimMessage({ type: 'SET_TIME', time: 'night' });
              setTelemetry((t) => ({ ...t, time: 'night' }));
            }}
            className={`p-1.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 ${
              telemetry.time === 'night' ? 'bg-indigo-500/25 text-indigo-300 shadow-sm border border-indigo-400/30' : 'text-white/40 hover:text-white'
            }`}
            title="Night Combat Lighting"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Military Grade Tactical Shortcuts Footer */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[10px] font-mono-tech text-white/50 border-t border-white/[0.06] flex-wrap">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">Space</kbd> 16″ Guns
        </span>
        <span className="text-white/20">•</span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">M</kbd> Tomahawk VLS
        </span>
        <span className="text-white/20">•</span>
        {isAirborne ? (
          <>
            <span className="flex items-center gap-1 text-amber-300">
              <kbd className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-bold text-[9px] border border-amber-500/30">C</kbd> 30mm
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-orange-300">
              <kbd className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-200 font-bold text-[9px] border border-orange-500/30">R</kbd> Rockets
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-rose-300">
              <kbd className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200 font-bold text-[9px] border border-rose-500/30">K</kbd> Hellfire
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-yellow-300">
              <kbd className="px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-200 font-bold text-[9px] border border-yellow-500/30">X</kbd> Flares
            </span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-sky-300">
              <kbd className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-200 font-bold text-[9px] border border-sky-500/30">B</kbd> Sonobuoy
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 rounded bg-white/10 text-white font-bold text-[9px] border border-white/15">H</kbd> Launch Helo
          </span>
        )}
      </div>
    </div>
  );
};

