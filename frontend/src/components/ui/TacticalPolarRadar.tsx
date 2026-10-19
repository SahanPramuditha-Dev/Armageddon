import React, { useState, useEffect } from 'react';
import { soundEngine } from '@/services/soundEngine';

interface TacticalPolarRadarProps {
  onPing?: () => void;
  className?: string;
}

export const TacticalPolarRadar: React.FC<TacticalPolarRadarProps> = ({ onPing, className = '' }) => {
  const [contacts, setContacts] = useState([
    { id: 'HV-01', angle: 42, dist: 68, active: true, pulse: false },
    { id: 'HV-02', angle: 135, dist: 45, active: true, pulse: false },
    { id: 'SK-03', angle: 285, dist: 80, active: true, pulse: false },
  ]);

  const handleRadarClick = () => {
    soundEngine.playRadarPing();
    if (onPing) onPing();
  };

  return (
    <div 
      onClick={handleRadarClick}
      title="Tactical Polar Radar // Click to Ping Sonar Array"
      className={`relative w-36 h-36 rounded-full border border-white/15 bg-[#070e17]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#0A84FF]/60 transition-all ${className}`}
    >
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full border border-[#0A84FF]/10 group-hover:border-[#0A84FF]/30 transition-colors pointer-events-none" />

      {/* Range Rings SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 144 144">
        {/* Concentric rings */}
        <circle cx="72" cy="72" r="64" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="72" cy="72" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="72" cy="72" r="24" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />

        {/* Crosshairs */}
        <line x1="72" y1="8" x2="72" y2="136" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1="8" y1="72" x2="136" y2="72" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Degree notches */}
        <text x="72" y="16" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace" textAnchor="middle">000</text>
        <text x="132" y="74" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace" textAnchor="middle">090</text>
        <text x="72" y="132" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace" textAnchor="middle">180</text>
        <text x="14" y="74" fill="rgba(255,255,255,0.4)" fontSize="6" fontFamily="monospace" textAnchor="middle">270</text>
      </svg>

      {/* Rotating Polar Sweep Beam */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none origin-center animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, rgba(10, 132, 255, 0.35) 0deg, rgba(10, 132, 255, 0) 55deg, transparent 60deg, transparent 360deg)',
        }}
      />

      {/* Hostile Alien Contacts */}
      {contacts.map((c) => {
        const rad = (c.angle - 90) * (Math.PI / 180);
        const radiusPx = (c.dist / 100) * 58;
        const cx = 72 + Math.cos(rad) * radiusPx;
        const cy = 72 + Math.sin(rad) * radiusPx;

        return (
          <div
            key={c.id}
            className="absolute flex items-center gap-1 pointer-events-none"
            style={{ left: `${cx}px`, top: `${cy}px`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
            </span>
            <span className="text-[7px] font-mono-tech text-red-400 font-bold tracking-tight bg-black/60 px-1 rounded">
              {c.id}
            </span>
          </div>
        );
      })}

      {/* Center Friendly Flagship Dot */}
      <div className="absolute w-2.5 h-2.5 rounded-full bg-sky-400 border border-white shadow-[0_0_10px_#38bdf8] flex items-center justify-center pointer-events-none">
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>

      {/* Heading marker line (Ship forward) */}
      <div className="absolute top-[38px] left-[71px] w-[2px] h-[34px] bg-sky-400/60 pointer-events-none" />

      {/* Bottom Tag */}
      <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
        <span className="text-[7px] font-mono-tech uppercase tracking-widest text-sky-400 font-bold bg-black/40 px-1.5 py-0.5 rounded-full border border-sky-500/20">
          50 KM SCAN
        </span>
      </div>
    </div>
  );
};
