import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Maximize2, Minimize2, Anchor, Waves, Zap, Plane,
  HelpCircle, Play, ShieldAlert, Compass, Volume2
} from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { soundEngine } from '@/services/soundEngine';

export type SimulatorVessel = 'SENTINEL' | 'CARRIER' | 'SUBMARINE' | 'HARBINGER';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVessel?: SimulatorVessel;
}

export const SIMULATOR_CONFIGS: Record<
  SimulatorVessel,
  {
    id: SimulatorVessel;
    name: string;
    classTitle: string;
    faction: string;
    src: string;
    badge: string;
    badgeClass: string;
    accentColor: string;
    controls: { key: string; label: string }[];
    description: string;
  }
> = {
  SENTINEL: {
    id: 'SENTINEL',
    name: 'USS SENTINEL (D-57)',
    classTitle: 'Guided-Missile Battleship · Surface Strike',
    faction: 'PACIFIC DEFENSE COALITION',
    src: '/sentinel_preview.html',
    badge: 'SURFACE WARFARE',
    badgeClass: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
    accentColor: '#0A84FF',
    description: 'Triple 16" primary naval turrets, 18-cell VLS Tomahawk launcher, automated CIWS umbrellas, dynamic weather & searchlights.',
    controls: [
      { key: 'Mouse Drag', label: 'Tactical Orbit & Pitch' },
      { key: 'Scroll', label: 'Zoom Camera' },
      { key: 'Space / F', label: '16" Main Gun Broadside' },
      { key: 'M', label: 'VLS Missile Salvo' },
      { key: 'H', label: 'Recon Helicopter Launch / RTB' },
      { key: 'K / G / R', label: 'Hellfire / Autocannon / Rockets' },
      { key: 'B', label: 'Deploy Dipping ASW Sonobuoy' },
      { key: 'V', label: 'Nose EOS FLIR Thermal Scope' },
      { key: 'X', label: 'Infrared Decoy Flares' },
      { key: 'T', label: 'Cycle Day / Dusk / Night' },
      { key: 'L', label: 'Toggle Searchlight Beams' },
      { key: '1 - 7', label: 'Camera Preset Angles' },
    ],
  },
  CARRIER: {
    id: 'CARRIER',
    name: 'USS MERIDIAN (CVN-72)',
    classTitle: 'Nuclear Fleet Aircraft Carrier · Strike Flight Ops',
    faction: 'PACIFIC DEFENSE COALITION',
    src: '/carrier.html',
    badge: 'CARRIER FLIGHT OPS',
    badgeClass: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300',
    accentColor: '#5EC8FF',
    description: 'Catapult steam launch and arrested recovery of F/A-18 strike fighters, MH-60 Seahawk helicopters, RIM-116 SeaRAM, Phalanx CIWS, and coordinated anti-ship defense.',
    controls: [
      { key: 'Mouse Drag', label: 'Tactical Orbit & Pitch' },
      { key: 'Scroll', label: 'Zoom Flight Deck Camera' },
      { key: 'L', label: 'Catapult Launch Jet' },
      { key: 'R', label: 'Arrested Recovery / Recall' },
      { key: 'H', label: 'Helicopter Flight Ops' },
      { key: 'S', label: 'Full Strike Wing Salvo' },
      { key: 'D', label: 'Air-Defense Missile Battery' },
      { key: 'C', label: 'Phalanx CIWS Rapid Fire' },
      { key: 'X', label: 'Anti-Ship Missile Interception' },
      { key: 'V', label: 'Cycle Views (Orbit, Deck, Jets)' },
      { key: 'T', label: 'Cycle Time (Day, Dusk, Night)' },
    ],
  },
  SUBMARINE: {
    id: 'SUBMARINE',
    name: 'SSN-21 ABYSS',
    classTitle: 'Nuclear Fast-Attack Submarine · Deep Infiltration',
    faction: 'US NAVY SUBMARINE CORPS',
    src: '/submarine.html',
    badge: 'SUB-SURFACE',
    badgeClass: 'bg-teal-500/15 border-teal-500/40 text-teal-300',
    accentColor: '#4FE0D0',
    description: 'Mk 48 heavy wire-guided acoustic torpedoes, active sonar ping array, variable depth ballast tanks, periscope optics, and seabed navigation.',
    controls: [
      { key: 'Mouse Drag', label: 'Orbit Submarine / Periscope Look' },
      { key: 'Scroll', label: 'Zoom Sensor Scope' },
      { key: 'Space', label: 'Launch Heavy Torpedoes' },
      { key: 'P', label: 'Sonar Acoustic Ping' },
      { key: 'D', label: 'Emergency Dive / Surface' },
      { key: 'L', label: 'Floodlights On / Off' },
      { key: '1 - 6', label: 'Cam (Orbit, Bow, Stern, Periscope)' },
    ],
  },
  HARBINGER: {
    id: 'HARBINGER',
    name: 'HARBINGER STRIKE CRAFT',
    classTitle: 'Extraterrestrial Multi-Domain Warcraft · Air & Sub-Sea',
    faction: 'THE HARVESTERS (ALIEN VANGUARD)',
    src: '/harbinger.html',
    badge: 'EXTRATERRESTRIAL',
    badgeClass: 'bg-orange-500/15 border-orange-500/40 text-orange-400',
    accentColor: '#FF7A2E',
    description: 'Directed plasma siphon lances, gravimetric shredder disks, swarm homing missiles, biomorphic shielding, EMP burst, cloaking field, and dual atmospheric/submersible flight.',
    controls: [
      { key: 'W / S / A / D', label: 'Thrust, Reverse & Turn Vector' },
      { key: '↑ / ↓ / Space', label: 'Climb / Dive (Dive below water)' },
      { key: '← / →', label: 'Lateral Strafe Drift' },
      { key: 'Shift', label: 'Afterburner Boost' },
      { key: '1 - 6', label: 'Plasma, Shredder, Swarm, Lance' },
      { key: 'Q / E / R / C', label: 'Shield, Decoys, EMP, Cloak' },
      { key: 'V', label: 'Cycle View (Chase / Orbit / Top)' },
    ],
  },
};

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  initialVessel = 'SENTINEL',
}) => {
  const { setScreen } = useTacticalStore();
  const [activeVessel, setActiveVessel] = useState<SimulatorVessel>(initialVessel);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  useEffect(() => {
    setActiveVessel(initialVessel);
  }, [initialVessel]);

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Send action or key to simulator iframe
  const sendSimAction = (action: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'ACTION', action }, '*');
  };

  const sendSimKey = (key: string, isDown: boolean) => {
    iframeRef.current?.contentWindow?.postMessage({
      type: 'KEY_EVENT',
      event: isDown ? 'keydown' : 'keyup',
      key: key.toLowerCase(),
      code: key,
      shiftKey: key === 'shift',
    }, '*');
  };

  // Global keyboard forwarding to active simulator iframe
  useEffect(() => {
    if (!isOpen) return;
    const forwardKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const key = e.key.toLowerCase();
      iframeRef.current?.contentWindow?.postMessage({
        type: 'KEY_EVENT',
        event: e.type,
        key: key,
        code: e.code,
        shiftKey: e.shiftKey,
      }, '*');
    };
    window.addEventListener('keydown', forwardKey);
    window.addEventListener('keyup', forwardKey);
    return () => {
      window.removeEventListener('keydown', forwardKey);
      window.removeEventListener('keyup', forwardKey);
    };
  }, [isOpen, activeVessel]);

  // Listen to messages from the iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'LAUNCH_SORTIE') {
        soundEngine.playUIClick();
        onClose();
        setScreen('MISSION_BRIEFING');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, setScreen]);

  if (!isOpen) return null;

  const currentConfig = SIMULATOR_CONFIGS[activeVessel];

  const handleSelectVessel = (v: SimulatorVessel) => {
    soundEngine.playUIClick();
    setActiveVessel(v);
  };

  const handleLaunchSortie = () => {
    soundEngine.playUIClick();
    onClose();
    setScreen('MISSION_BRIEFING');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full rounded-2xl border border-white/15 bg-[#070B14]/95 shadow-2xl flex flex-col overflow-hidden ${
            isFullscreen ? 'h-full max-h-screen' : 'h-[92vh] max-w-[96vw]'
          }`}
        >
          {/* Header Bar */}
          <div className="relative z-20 px-5 py-3 flex items-center justify-between border-b border-white/10 bg-[#0A1018]/90 backdrop-blur-md">
            {/* Left: Vessel Selector Tabs */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.05] border border-white/10">
                <button
                  onClick={() => handleSelectVessel('SENTINEL')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeVessel === 'SENTINEL'
                      ? 'bg-[#0A84FF] text-white shadow-[0_0_12px_rgba(10,132,255,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Anchor className="w-3.5 h-3.5" />
                  <span>USS Sentinel</span>
                </button>

                <button
                  onClick={() => handleSelectVessel('CARRIER')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeVessel === 'CARRIER'
                      ? 'bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Plane className="w-3.5 h-3.5" />
                  <span>USS Meridian</span>
                </button>

                <button
                  onClick={() => handleSelectVessel('SUBMARINE')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeVessel === 'SUBMARINE'
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(79,224,208,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>SSN-21 Abyss</span>
                </button>

                <button
                  onClick={() => handleSelectVessel('HARBINGER')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeVessel === 'HARBINGER'
                      ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(255,122,46,0.4)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Harbinger</span>
                </button>
              </div>

              {/* Status pill */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono-tech ${currentConfig.badgeClass}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{currentConfig.badge}</span>
              </div>
            </div>

            {/* Right: Actions (Controls Guide, Sortie, Fullscreen, Close) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp((prev) => !prev)}
                className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  showHelp
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Telemetry & Controls"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span className="hidden md:inline">Controls</span>
              </button>

              <button
                onClick={handleLaunchSortie}
                className="px-3.5 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(10,132,255,0.35)] flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Sortie</span>
              </button>

              <button
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
                title="Close Simulation"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Simulator Viewport */}
          <div className="relative flex-1 w-full h-full bg-[#05080F] overflow-hidden">
            <iframe
              ref={iframeRef}
              key={currentConfig.id}
              src={currentConfig.src}
              title={currentConfig.name}
              className="w-full h-full border-0 select-none"
              allow="autoplay"
            />

            {/* Bottom Floating Interactive Flight / Helm Control Dock */}
            <div className="absolute bottom-4 inset-x-4 z-30 pointer-events-none flex items-center justify-center">
              <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-2xl bg-[#080E18]/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-xs">
                {activeVessel === 'HARBINGER' && (
                  <>
                    <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                      <button
                        onPointerDown={() => sendSimKey('w', true)}
                        onPointerUp={() => sendSimKey('w', false)}
                        onPointerLeave={() => sendSimKey('w', false)}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-200 active:scale-95 transition-all cursor-pointer font-bold flex items-center gap-1"
                        title="Forward Thrust (W)"
                      >
                        <span>Thrust</span>
                        <span className="text-[10px] font-mono opacity-60">[W]</span>
                      </button>
                      <button
                        onPointerDown={() => sendSimKey('s', true)}
                        onPointerUp={() => sendSimKey('s', false)}
                        onPointerLeave={() => sendSimKey('s', false)}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white active:scale-95 transition-all cursor-pointer font-medium"
                        title="Reverse / Brake (S)"
                      >
                        <span>Rev</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[S]</span>
                      </button>
                      <button
                        onPointerDown={() => sendSimKey('a', true)}
                        onPointerUp={() => sendSimKey('a', false)}
                        onPointerLeave={() => sendSimKey('a', false)}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white active:scale-95 transition-all cursor-pointer font-medium"
                        title="Steer Port (A)"
                      >
                        ◀ <span className="text-[10px] font-mono opacity-60">[A]</span>
                      </button>
                      <button
                        onPointerDown={() => sendSimKey('d', true)}
                        onPointerUp={() => sendSimKey('d', false)}
                        onPointerLeave={() => sendSimKey('d', false)}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white active:scale-95 transition-all cursor-pointer font-medium"
                        title="Steer Starboard (D)"
                      >
                        <span className="text-[10px] font-mono opacity-60">[D]</span> ▶
                      </button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                      <button
                        onPointerDown={() => sendSimKey(' ', true)}
                        onPointerUp={() => sendSimKey(' ', false)}
                        onPointerLeave={() => sendSimKey(' ', false)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 active:scale-95 transition-all cursor-pointer font-medium"
                        title="Climb Altitude (Space / ↑)"
                      >
                        <span>Climb</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[Space]</span>
                      </button>
                      <button
                        onPointerDown={() => sendSimKey('arrowdown', true)}
                        onPointerUp={() => sendSimKey('arrowdown', false)}
                        onPointerLeave={() => sendSimKey('arrowdown', false)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 active:scale-95 transition-all cursor-pointer font-medium"
                        title="Dive Underwater (↓)"
                      >
                        <span>Dive</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[↓]</span>
                      </button>
                      <button
                        onPointerDown={() => sendSimKey('shift', true)}
                        onPointerUp={() => sendSimKey('shift', false)}
                        onPointerLeave={() => sendSimKey('shift', false)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/40 text-amber-200 font-bold active:scale-95 transition-all cursor-pointer"
                        title="Afterburner Boost (Shift)"
                      >
                        <span>Boost</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[Shift]</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-white/10 pr-2">
                      <button
                        onClick={() => sendSimAction('plasma')}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Plasma</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[1]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('shred')}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Shredder</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[2]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('swarm')}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Swarm</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[3]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('lance')}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Lance</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[5]</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => sendSimAction('shield')}
                        className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Shield</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[Q]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('cloak')}
                        className="px-2 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/35 border border-teal-500/40 text-teal-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>Cloak</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[C]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('emp')}
                        className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>EMP</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[R]</span>
                      </button>
                      <button
                        onClick={() => sendSimAction('view')}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 active:scale-95 transition-all cursor-pointer font-medium"
                      >
                        <span>View</span>
                        <span className="text-[10px] font-mono opacity-60 ml-0.5">[V]</span>
                      </button>
                    </div>
                  </>
                )}

                {activeVessel === 'SENTINEL' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'FIRE_GUNS' }, '*')}
                      className="px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Fire 16" Broadside [Space]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'FIRE_MISSILES' }, '*')}
                      className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Launch VLS Tomahawks [M]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'TOGGLE_HELO' }, '*')}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Helo Sortie [H]
                    </button>
                  </div>
                )}

                {activeVessel === 'CARRIER' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 'l', code: 'KeyL' }, '*')}
                      className="px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Catapult Launch [L]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 'r', code: 'KeyR' }, '*')}
                      className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Arrested Recovery [R]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 's', code: 'KeyS' }, '*')}
                      className="px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-500/40 text-orange-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Strike Salvo [S]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 'c', code: 'KeyC' }, '*')}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Phalanx CIWS [C]
                    </button>
                  </div>
                )}

                {activeVessel === 'SUBMARINE' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: ' ', code: 'Space' }, '*')}
                      className="px-3 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/35 border border-teal-500/40 text-teal-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Launch Torpedoes [Space]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 'p', code: 'KeyP' }, '*')}
                      className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Active Sonar Ping [P]
                    </button>
                    <button
                      onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'KEY_EVENT', event: 'keydown', key: 'd', code: 'KeyD' }, '*')}
                      className="px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Dive / Surface [D]
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Controls & Telemetry Drawer Overlay */}
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-4 z-30 max-w-md p-4 rounded-xl border border-white/15 bg-[#0A1018]/92 backdrop-blur-2xl shadow-2xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                        {currentConfig.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
                        {currentConfig.classTitle}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowHelp(false)}
                      className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {currentConfig.description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider font-mono-tech block">
                      Flight / Marine Controls
                    </span>
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      {currentConfig.controls.map((ctrl, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1 rounded bg-white/[0.04] border border-white/5"
                        >
                          <span className="font-mono-tech font-bold text-white text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                            {ctrl.key}
                          </span>
                          <span className="text-slate-300 text-[11px]">
                            {ctrl.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
