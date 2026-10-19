import React from 'react';
import { SimulatorVessel } from '@/components/ui/SimulationModal';
import { Radar } from 'lucide-react';

interface VesselTelemetryHeaderProps {
  vessel: SimulatorVessel;
  telemetry: {
    knots: number;
    sea: string;
    camera: string;
    time: string;
    heloMode: string;
  };
  subDepth: number;
  carrierCamMode: number;
  harbingerCam: string;
  isRadarVisible: boolean;
  onToggleRadar: () => void;
}

export const VesselTelemetryHeader: React.FC<VesselTelemetryHeaderProps> = ({
  vessel,
  telemetry,
  subDepth,
  carrierCamMode,
  harbingerCam,
  isRadarVisible,
  onToggleRadar,
}) => {
  return (
    <div className="flex items-center justify-between px-1 pb-3 border-b border-white/[0.08] text-[11px] font-mono-tech select-none gap-2">
      {/* Left: Active Vessel Telemetry Readout */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 whitespace-nowrap shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-semibold text-emerald-400 tracking-wider">LIVE</span>
        </div>

        {vessel === 'SENTINEL' && (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white whitespace-nowrap shrink-0">
              <strong className="text-white font-bold">{telemetry.knots}</strong> <span className="text-[10px] text-white/50">KTS</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white whitespace-nowrap shrink-0">
              <strong className="text-white font-bold">{telemetry.sea}</strong> <span className="text-[10px] text-white/50">SEA</span>
            </span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border whitespace-nowrap shrink-0 ${
              telemetry.heloMode === 'landed' 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : telemetry.heloMode === 'landing'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}>
              HELO {telemetry.heloMode.toUpperCase()}
            </span>
          </div>
        )}

        {vessel === 'CARRIER' && (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 whitespace-nowrap shrink-0">
              <strong className="font-bold">30</strong> <span className="text-[10px] opacity-70">KTS</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/90 whitespace-nowrap shrink-0">
              <strong className="font-semibold">40 KT</strong> <span className="text-[10px] text-white/50">WIND</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">48</strong> <span className="text-[10px] opacity-70">AIR WING</span>
            </span>
          </div>
        )}

        {vessel === 'SUBMARINE' && (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">{subDepth}M</strong> <span className="text-[10px] opacity-70">DEPTH</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/90 whitespace-nowrap shrink-0">
              <strong className="font-semibold">32</strong> <span className="text-[10px] text-white/50">KTS</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">{(1 + subDepth / 10).toFixed(1)}</strong> <span className="text-[10px] opacity-70">BAR</span>
            </span>
          </div>
        )}

        {vessel === 'HARBINGER' && (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">100%</strong> <span className="text-[10px] opacity-70">HULL</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">100%</strong> <span className="text-[10px] opacity-70">SHIELD</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 whitespace-nowrap shrink-0">
              <strong className="font-bold">1.21</strong> <span className="text-[10px] opacity-70">GW</span>
            </span>
          </div>
        )}
      </div>

      {/* Right: Radar Toggle & Perspective Mode Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleRadar}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isRadarVisible
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'bg-white/[0.04] text-white/50 border border-white/10 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Toggle Tactical Polar Radar Display"
        >
          <Radar className={`w-3 h-3 shrink-0 ${isRadarVisible ? 'text-sky-400 animate-spin-slow' : 'text-white/40'}`} />
          <span className="whitespace-nowrap">{isRadarVisible ? 'Radar' : 'Radar Off'}</span>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRadarVisible ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' : 'bg-white/20'}`} />
        </button>

        <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/25 shadow-sm whitespace-nowrap shrink-0">
          {vessel === 'SENTINEL' && `${telemetry.camera} CAM`}
          {vessel === 'CARRIER' && (carrierCamMode === 0 ? 'ORBIT' : carrierCamMode === 1 ? 'DECK' : carrierCamMode === 9 ? 'LAUNCH' : 'JETS')}
          {vessel === 'SUBMARINE' && 'PERISCOPE'}
          {vessel === 'HARBINGER' && `${harbingerCam.toUpperCase()} CAM`}
        </span>
      </div>
    </div>
  );
};
