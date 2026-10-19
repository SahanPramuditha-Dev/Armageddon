import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Anchor, Radio, Settings, Play, 
  Clock, ChevronRight, ChevronLeft, Zap, 
  Compass, Crosshair, Radar, Maximize2, Waves, Eye, EyeOff,
  Sun, Moon, Sunset, ShieldAlert,
  Flame, Navigation, Plane, Volume2, VolumeX, Crosshair as CrosshairIcon
} from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { soundEngine } from '@/services/soundEngine';
import { ShipType } from '@/types/combat';
import { SimulationModal, SimulatorVessel, SIMULATOR_CONFIGS } from '@/components/ui/SimulationModal';
import { TacticalPolarRadar } from '@/components/ui/TacticalPolarRadar';
import { TacticalActionDock } from '@/components/ui/tactical-dock';
import { FlagshipCommandCard } from '@/components/ui/flagship-command';

export const VESSEL_SPECS: Record<SimulatorVessel, {
  hardpoints: string[];
  subsystems: { name: string; status: string; detail: string; statusColor: string }[];
  combatRole: string;
}> = {
  SENTINEL: {
    hardpoints: [
      '3× Triple 16″/50 Mark 7',
      '18-Cell Tomahawk VLS',
      '2× Phalanx 20mm CIWS',
      'MH-60R Seahawk Helo',
      'AN/SPS-49 Air Radar'
    ],
    subsystems: [
      { name: 'Fire Control', status: 'ONLINE', detail: 'Optical + Radar lock', statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
      { name: 'Tomahawk VLS', status: 'ARMED', detail: '18/18 Tomahawk cells', statusColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
      { name: 'CIWS Defense', status: 'ACTIVE', detail: 'Automated 20mm umbrella', statusColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
    ],
    combatRole: 'Heavy Surface Strike & Long-Range Naval Fire Support'
  },
  CARRIER: {
    hardpoints: [
      '48× F/A-18E Super Hornets',
      '4× C-13 Steam Catapults',
      '2× RIM-116 Rolling Airframe',
      '3× Phalanx 20mm CIWS',
      '4× MH-60S Multirole Helis'
    ],
    subsystems: [
      { name: 'Flight Deck Ops', status: 'GREEN', detail: 'Catapults 1-4 primed', statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
      { name: 'Air Intercept Wing', status: 'AIRBORNE', detail: 'Combat Air Patrol on station', statusColor: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
      { name: 'Point Defense', status: 'ACTIVE', detail: 'Automated CIWS + RIM-116', statusColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30' }
    ],
    combatRole: 'Planetary Air Superiority & Fleet Carrier Strike Group'
  },
  SUBMARINE: {
    hardpoints: [
      '4× 533mm Heavy Torpedo Tubes',
      'Mk 48 ADCAP Heavy Torpedoes',
      'BQQ-10 Spherical Sonar Array',
      'Optronic Search Periscope',
      'High-Output Nuclear Core'
    ],
    subsystems: [
      { name: 'Ballast Control', status: 'OPTIMAL', detail: 'Depth rating 0 - 300m', statusColor: 'text-teal-400 bg-teal-500/15 border-teal-500/30' },
      { name: 'Acoustic Sonar', status: 'PASSIVE', detail: 'Listening array swept', statusColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
      { name: 'Torpedo Tubes', status: 'FLOODED', detail: '4 tubes armed & ready', statusColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
    ],
    combatRole: 'Silent Deep Infiltration & Sub-Surface Naval Interception'
  },
  HARBINGER: {
    hardpoints: [
      'Twin Plasma Siphon Lances',
      'Gravimetric Shredder Disks',
      'Bio-Swarm Homing Missiles',
      'Biomorphic Phase Cloak',
      'Omni-Directional EMP Core'
    ],
    subsystems: [
      { name: 'Gravitic Core', status: '1.21 GW', detail: 'Sub-sea & atmospheric vector', statusColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
      { name: 'Phase Cloak', status: 'CHARGED', detail: 'Radar & optical dispersion', statusColor: 'text-teal-400 bg-teal-500/15 border-teal-500/30' },
      { name: 'Bio-Shield', status: '100%', detail: 'Kinetic & energy absorption', statusColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' }
    ],
    combatRole: 'Alien Extraterrestrial Dreadnought & Multi-Domain Incursion'
  }
};

export const MainMenuScreen: React.FC = () => {
  const { 
    setScreen, 
    setSelectedScenario, 
    selectedScenario, 
    fleetDraft, 
    connectCombatSocket 
  } = useTacticalStore();

  const [activeSimulation, setActiveSimulation] = useState<SimulatorVessel>('SENTINEL');
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState<boolean>(false);
  const [isFleetOpen, setIsFleetOpen] = useState<boolean>(false);

  // iOS-grade UX states:
  const [isCinematicMode, setIsCinematicMode] = useState<boolean>(false);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isRadarVisible, setIsRadarVisible] = useState<boolean>(true);

  // Vessel-specific dynamic control states:
  const [subDepth, setSubDepth] = useState<number>(40);
  const [carrierCamMode, setCarrierCamMode] = useState<number>(0);
  const [harbingerCam, setHarbingerCam] = useState<string>('chase');

  // Live telemetry state from 3D ocean engine
  const [telemetry, setTelemetry] = useState<{
    knots: number;
    sea: string;
    camera: string;
    time: string;
    beams: boolean;
    heloMode: string;
  }>({
    knots: 23,
    sea: '1.0',
    camera: 'orbit',
    time: 'night',
    beams: true,
    heloMode: 'landed',
  });

  // Live military Zulu clock
  const [zuluTime, setZuluTime] = useState<string>('');
  useEffect(() => {
    const updateZulu = () => {
      const d = new Date();
      setZuluTime(d.toUTCString().slice(17, 25) + ' Z');
    };
    updateZulu();
    const timer = setInterval(updateZulu, 1000);
    return () => clearInterval(timer);
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendSimMessage = (msg: Record<string, unknown>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    }
  };

  const toggleAudio = () => {
    const nextMute = !isAudioMuted;
    setIsAudioMuted(nextMute);
    soundEngine.setMute(nextMute);
    if (!nextMute) {
      soundEngine.playUIClick();
    }
  };

  // Listen to messages from the native 3D warship engine
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'LAUNCH_SORTIE') {
        soundEngine.playUIClick();
        setScreen('MISSION_BRIEFING');
      } else if (e.data.type === 'TOGGLE_OPERATIONS') {
        soundEngine.playUIClick();
        setIsOperationsOpen((prev) => !prev);
      } else if (e.data.type === 'TOGGLE_FLEET') {
        soundEngine.playUIClick();
        setIsFleetOpen((prev) => !prev);
      } else if (e.data.type === 'DIRECT_SCRAMBLE') {
        handleDirectLaunch();
      } else if (e.data.type === 'SIM_TELEMETRY') {
        setTelemetry({
          knots: e.data.knots ?? 23,
          sea: e.data.sea ?? '1.0',
          camera: e.data.camera ?? 'orbit',
          time: e.data.time ?? 'day',
          beams: !!e.data.beams,
          heloMode: e.data.heloMode ?? 'landed',
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Keyboard shortcuts and active 3D simulator flight/naval control forwarding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();

      // Forward keydown event to active 3D simulator iframe (Harbinger, Meridian, Abyss, Sentinel)
      sendSimMessage({
        type: 'KEY_EVENT',
        event: 'keydown',
        key: key,
        code: e.code,
        shiftKey: e.shiftKey,
      });

      if (activeSimulation === 'SENTINEL') {
        if (e.code === 'Space' || key === 'f') {
          e.preventDefault();
          sendSimMessage({ type: 'FIRE_GUNS' });
        } else if (key === 'm') {
          sendSimMessage({ type: 'FIRE_MISSILES' });
        } else if (key === 'h') {
          sendSimMessage({ type: 'TOGGLE_HELO' });
        } else if (key === 'k') {
          sendSimMessage({ type: 'HELO_STRIKE' });
        } else if (key === 'b') {
          sendSimMessage({ type: 'HELO_SONOBUOY' });
        } else if (['1', '2', '3', '4', '5'].includes(key)) {
          const cams = ['orbit', 'bridge', 'bow', 'side', 'helo'];
          const cam = cams[parseInt(key) - 1];
          if (cam) {
            sendSimMessage({ type: 'SET_CAM', cam });
            setTelemetry(t => ({ ...t, camera: cam }));
          }
        }
      } else if (activeSimulation === 'CARRIER') {
        if (key === 'l') {
          sendSimMessage({ type: 'LAUNCH_JET' });
        } else if (key === 'r') {
          sendSimMessage({ type: 'RECALL_JETS' });
        } else if (key === 'h') {
          sendSimMessage({ type: 'TOGGLE_HELIS' });
        } else if (key === 's') {
          sendSimMessage({ type: 'STRIKE_SALVO' });
        } else if (key === 'd') {
          sendSimMessage({ type: 'AIR_DEFENSE' });
        } else if (key === 'c') {
          sendSimMessage({ type: 'CIWS_BURST' });
        } else if (key === 'v') {
          sendSimMessage({ type: 'CYCLE_CAM' });
          setCarrierCamMode(m => (m + 1) % 4);
        } else if (key === 't') {
          sendSimMessage({ type: 'CYCLE_TIME' });
        }
      } else if (activeSimulation === 'SUBMARINE') {
        if (e.code === 'Space') {
          e.preventDefault();
          sendSimMessage({ type: 'FIRE_TORPEDOES' });
        } else if (key === 'p') {
          sendSimMessage({ type: 'SONAR_PING' });
        } else if (key === 'd') {
          sendSimMessage({ type: 'TOGGLE_DIVE' });
          setSubDepth(d => d < 10 ? 40 : 0);
        } else if (key === 'l') {
          sendSimMessage({ type: 'TOGGLE_LIGHTS' });
        } else if (['1', '2', '3', '4', '5'].includes(key)) {
          const cams = ['orbit', 'peri', 'bow', 'stern', 'top'];
          const cam = cams[parseInt(key) - 1];
          if (cam) sendSimMessage({ type: 'SET_CAM', cam });
        }
      } else if (activeSimulation === 'HARBINGER') {
        if (key === '1') sendSimMessage({ type: 'ACTION', action: 'plasma' });
        else if (key === '2') sendSimMessage({ type: 'ACTION', action: 'shred' });
        else if (key === '3') sendSimMessage({ type: 'ACTION', action: 'swarm' });
        else if (key === '4') sendSimMessage({ type: 'ACTION', action: 'bottle' });
        else if (key === '5') sendSimMessage({ type: 'ACTION', action: 'lance' });
        else if (key === '6') sendSimMessage({ type: 'ACTION', action: 'drone' });
        else if (key === 'q') sendSimMessage({ type: 'ACTION', action: 'shield' });
        else if (key === 'e') sendSimMessage({ type: 'ACTION', action: 'flare' });
        else if (key === 'r') sendSimMessage({ type: 'ACTION', action: 'emp' });
        else if (key === 'c') sendSimMessage({ type: 'ACTION', action: 'cloak' });
        else if (key === 'f') sendSimMessage({ type: 'ACTION', action: 'repair' });
        else if (key === 'v') {
          sendSimMessage({ type: 'ACTION', action: 'view' });
          setHarbingerCam(c => c === 'chase' ? 'orbit' : c === 'orbit' ? 'top' : 'chase');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      const key = e.key.toLowerCase();
      sendSimMessage({
        type: 'KEY_EVENT',
        event: 'keyup',
        key: key,
        code: e.code,
        shiftKey: e.shiftKey,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeSimulation]);

  const scenarios = [
    {
      id: 'SCENARIO_A',
      sortieNumber: '01',
      codename: 'OPERATION COLD HORIZON',
      title: 'First Contact',
      subtitle: 'Humanity vs. Alien Threat',
      enemyFaction: 'The Harvesters',
      threatLevel: 'Extreme',
      threatBadge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      coordinates: '21°18\'N, 157°51\'W',
      theater: 'East Pacific Basin',
      featuredShip: 'DESTROYER' as ShipType,
      desc: 'Extraterrestrial biomorphic dreadnoughts breach the Pacific depths. Intercept the vanguard, analyze unfamiliar weapon acoustics, and eliminate the command leviathan.',
      objectives: ['Neutralize Leviathan', 'Survive Kinetic Spikes', 'Gather Acoustic Intel']
    },
    {
      id: 'SCENARIO_B',
      sortieNumber: '02',
      codename: 'OPERATION IRON LATITUDE',
      title: 'Nation vs. Nation',
      subtitle: 'Tactical Superpower Duel',
      enemyFaction: 'Eurasian Union',
      threatLevel: 'Tactical',
      threatBadge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      coordinates: '34°12\'N, 129°45\'E',
      theater: 'Contested Archipelago',
      featuredShip: 'CRUISER' as ShipType,
      desc: 'Symmetrical surface combat in contested international waters. Out-maneuver radar jamming, exploit electronic countermeasures, and rescue the disabled frigate USS Vandegrift.',
      objectives: ['Eliminate Cruisers', 'Rescue Disabled Frigate', 'Strategic Withdrawal Option']
    },
    {
      id: 'SCENARIO_C',
      sortieNumber: '03',
      codename: 'OPERATION AEGIS COALITION',
      title: 'Temporary Alliance',
      subtitle: 'Planetary Joint Defense',
      enemyFaction: 'Harvester Swarm',
      threatLevel: 'Apocalyptic',
      threatBadge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      coordinates: '14°20\'N, 144°45\'E',
      theater: 'Midway Deep Abyss',
      featuredShip: 'CARRIER' as ShipType,
      desc: 'Human superpowers establish an emergency defense pact against a planetary invasion swarm. Coordinate joint CIWS umbrellas and protect the coalition command carrier.',
      objectives: ['Defend Carrier Flagship', 'Intercept Plasma Salvos', 'Hold Defense Line']
    },
  ];

  const currentScenarioObj = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];
  const totalFleetTonnage = fleetDraft.length * 9500;
  const maxFleetTonnage = 35000;
  const totalFleetCost = fleetDraft.length * 14000;
  const maxFleetBudget = 50000;

  const handleSelectScenario = (sc: typeof scenarios[0]) => {
    soundEngine.playUIClick();
    setSelectedScenario(sc.id);
  };

  const handleDirectLaunch = () => {
    soundEngine.playUIClick();
    connectCombatSocket('direct_launch_match');
    setScreen('LIVE_COMBAT');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060a10] text-slate-100 select-none">
      
      {/* ----------------------------------------------------------------- */}
      {/* 1. NATIVE 3D WARSHIP & OCEAN SIMULATION (100% BIT-FOR-BIT IDENTICAL) */}
      {/* ----------------------------------------------------------------- */}
      <iframe
        ref={iframeRef}
        key={activeSimulation}
        src={`${SIMULATOR_CONFIGS[activeSimulation].src}?embedded=true`}
        title={SIMULATOR_CONFIGS[activeSimulation].name}
        className="absolute inset-0 w-full h-full border-0 select-none z-0"
        allow="autoplay"
      />

      {/* Subtle cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none z-1 bg-radial-[circle_at_center,transparent_45%,rgba(6,10,16,0.65)_100%]" />

      {/* ----------------------------------------------------------------- */}
      {/* 2. TOP TACTICAL COMMAND BAR (APPLE / iOS FLOATING DOCK)            */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!isCinematicMode && (
          <motion.header 
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-4 inset-x-6 z-30 flex items-center justify-between"
          >
            {/* Left: Brand Island */}
            <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#0B1320]/75 backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0A84FF] to-[#64D2FF] flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)]">
                <Radar className="w-4 h-4 text-white animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight text-white">
                    ARMAGEDDON
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono-tech font-semibold bg-white/10 text-white/80 border border-white/10">
                    2.4
                  </span>
                </div>
                <p className="text-[9px] font-medium tracking-wide text-white/50 uppercase">
                  Planetary Defense CIC
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-2 pl-3 ml-1 border-l border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-emerald-400">
                  DEFCON 2
                </span>
              </div>
            </div>

            {/* Center: Apple Segmented Pill Navigation */}
            <nav className="flex items-center gap-1 p-1 rounded-2xl bg-[#0B1320]/75 backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setIsOperationsOpen(prev => !prev);
                  setIsFleetOpen(false);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isOperationsOpen 
                    ? 'bg-white/15 text-white shadow-sm border border-white/15'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Operations</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-white/15 text-white">3</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setScreen('HARBOR_DRYDOCK');
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fleet Drydock</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setScreen('INTELLIGENCE');
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Intelligence</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setScreen('SETTINGS');
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Right: Telemetry & iOS Utility Island */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#0B1320]/75 backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] text-xs text-white/75">
                <div className="flex items-center gap-1.5 font-mono-tech text-[11px] text-sky-400">
                  <Navigation className="w-3 h-3 rotate-45" />
                  <span>21°18'N, 157°51'W</span>
                </div>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1.5 font-mono-tech text-[11px] text-emerald-400">
                  <Clock className="w-3 h-3" />
                  <span>{zuluTime || 'ZULU 17:35'}</span>
                </div>
              </div>

              {/* Sound Mute/Unmute Toggle Button */}
              <button
                onClick={toggleAudio}
                className="w-9 h-9 rounded-2xl bg-[#0B1320]/75 backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isAudioMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-400" />
                )}
              </button>

              {/* Toggle Cinematic View Button */}
              <button
                onClick={() => setIsCinematicMode(true)}
                className="w-9 h-9 rounded-2xl bg-[#0B1320]/75 backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                title="Cinematic View (Hide UI) — Press [H]"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Full 3D Simulation Deck Button */}
              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setIsSimModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 border border-[#0A84FF]/35 text-xs font-medium text-sky-300 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)] active:scale-95 transition-all cursor-pointer"
                title="Open Dedicated 3D Simulation Deck"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sim Deck</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* 3. HERO COMMAND STATION (LEFT APPLE GLASS CARD)                    */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!isCinematicMode && (
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-20 left-6 z-20 flex items-start gap-2"
          >
            {isLeftPanelCollapsed ? (
              /* Collapsed Slim iOS Pill */
              <motion.button
                onClick={() => setIsLeftPanelCollapsed(false)}
                className="px-3 py-2.5 rounded-2xl bg-[#0B1320]/80 backdrop-blur-3xl border border-white/[0.15] shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center gap-2 text-xs font-semibold text-white/90 hover:text-white hover:bg-white/15 transition-all cursor-pointer active:scale-95"
                title="Expand Command Center"
              >
                <Shield className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>{SIMULATOR_CONFIGS[activeSimulation].name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/50" />
              </motion.button>
            ) : (
              /* Expanded Apple VisionOS Flagship Command Center Card */
              <FlagshipCommandCard
                activeSimulation={activeSimulation}
                onSelectVessel={(v) => setActiveSimulation(v)}
                onCollapse={() => setIsLeftPanelCollapsed(true)}
                onCommenceSortie={() => {
                  soundEngine.playUIClick();
                  setScreen('MISSION_BRIEFING');
                }}
                onOpenTaskForce={() => {
                  soundEngine.playUIClick();
                  setIsFleetOpen(true);
                  setIsOperationsOpen(false);
                }}
                onQuickScramble={handleDirectLaunch}
                scenario={currentScenarioObj}
                vesselSpecs={VESSEL_SPECS}
              />
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* 4. COMPACT CINEMATIC & WEAPONS WIDGET (BOTTOM RIGHT)               */}
      {/* ----------------------------------------------------------------- */}
      <TacticalActionDock
        activeSimulation={activeSimulation}
        telemetry={telemetry}
        setTelemetry={setTelemetry}
        subDepth={subDepth}
        setSubDepth={setSubDepth}
        carrierCamMode={carrierCamMode}
        setCarrierCamMode={setCarrierCamMode}
        harbingerCam={harbingerCam}
        setHarbingerCam={setHarbingerCam}
        isRadarVisible={isRadarVisible}
        onToggleRadar={() => setIsRadarVisible(v => !v)}
        sendSimMessage={sendSimMessage}
        isCinematicMode={isCinematicMode}
      />

      {/* ----------------------------------------------------------------- */}
      {/* 5. CINEMATIC RESTORE FLOATING PILL (WHEN UI IS HIDDEN)             */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {isCinematicMode && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
          >
            <button
              onClick={() => setIsCinematicMode(false)}
              className="px-5 py-2.5 rounded-full bg-[#0B1320]/80 backdrop-blur-3xl border border-white/[0.18] shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center gap-2.5 text-xs font-semibold text-white hover:bg-white/15 transition-all cursor-pointer active:scale-95"
            >
              <EyeOff className="w-4 h-4 text-sky-400" />
              <span>Cinematic Mode Active</span>
              <span className="text-[10px] opacity-60 font-mono-tech ml-1">Click to restore UI [H]</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* 6. COLLAPSIBLE SLIDE-IN DRAWERS (OPERATIONS & FLEET)               */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {/* Left Drawer: Theater Operations */}
        {isOperationsOpen && (
          <motion.div
            initial={{ opacity: 0, x: -400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-20 left-6 bottom-6 z-40 w-[390px] p-5 rounded-3xl border border-white/[0.12] border-t-white/[0.22] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75),0_0_24px_rgba(10,132,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col justify-between backdrop-blur-3xl bg-gradient-to-b from-[#0c1626]/95 via-[#08101f]/96 to-[#040810]/98 select-none"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0A84FF]/25 to-sky-400/10 border border-sky-400/30 flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white tracking-wider uppercase">
                      Theater Operations
                    </h2>
                    <p className="text-[9px] font-mono-tech text-white/40">
                      ACTIVE STRATEGIC DIRECTIVES (3)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOperationsOpen(false)}
                  className="w-7 h-7 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 mt-3.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {scenarios.map((sc) => {
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => handleSelectScenario(sc)}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#0A84FF]/20 border-[#0A84FF]/50 shadow-[0_0_20px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]'
                          : 'bg-[#08101e]/80 border-white/[0.07] hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white/95">{sc.codename}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono-tech font-bold rounded-full uppercase border ${sc.threatBadge}`}>
                          {sc.threatLevel}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white tracking-wide">
                        {sc.title} &bull; <span className="text-white/60 font-normal">{sc.subtitle}</span>
                      </h3>
                      <p className="text-[9.5px] font-mono-tech text-sky-400 mt-1">
                        {sc.theater} // {sc.coordinates}
                      </p>
                      <p className="text-[11px] text-slate-300 font-normal mt-1 leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setScreen('MISSION_BRIEFING');
                }}
                className="w-full py-3 rounded-2xl text-xs font-bold tracking-wider text-white bg-gradient-to-b from-[#0A84FF] via-[#0076EB] to-[#0060C7] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(10,132,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] border border-sky-300/30"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>COMMENCE MISSION BRIEFING</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Right Drawer: Task Force Readiness */}
        {isFleetOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-20 right-6 bottom-6 z-40 w-[360px] p-5 rounded-3xl border border-white/[0.12] border-t-white/[0.22] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.75),0_0_24px_rgba(10,132,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col justify-between backdrop-blur-3xl bg-gradient-to-b from-[#0c1626]/95 via-[#08101f]/96 to-[#040810]/98 select-none"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0A84FF]/25 to-sky-400/10 border border-sky-400/30 flex items-center justify-center">
                    <Anchor className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-white tracking-wider uppercase">
                      Task Force Readiness
                    </h2>
                    <p className="text-[9px] font-mono-tech text-white/40">
                      DEPLOYED SQUADRON STATUS ({fleetDraft.length})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFleetOpen(false)}
                  className="w-7 h-7 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 mt-3.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {fleetDraft.map((ship, idx) => (
                  <div key={ship.shipId || idx} className="p-3 rounded-2xl bg-[#08101e]/80 border border-white/[0.07] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-sky-400" />
                        <span>{ship.customName || `USS Warship ${idx + 1}`}</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-white/50 block mt-0.5">
                        {ship.shipType} &bull; {ship.equippedWeaponIds.length}W / {ship.equippedCountermeasureIds.length}CM
                      </span>
                    </div>
                    <span className="text-[9px] font-mono-tech font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                      ARMED
                    </span>
                  </div>
                ))}

                {/* Tonnage & Budget Progress Bars */}
                <div className="p-3.5 rounded-2xl bg-black/45 border border-white/[0.07] space-y-3 mt-3">
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <span className="text-white/50 text-[10.5px]">Fleet Tonnage</span>
                      <span className="font-mono-tech text-xs font-bold text-white">
                        {totalFleetTonnage.toLocaleString()} / {maxFleetTonnage.toLocaleString()} t
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalFleetTonnage / maxFleetTonnage) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1.5">
                      <span className="text-white/50 text-[10.5px]">Naval Budget</span>
                      <span className="font-mono-tech text-xs font-bold text-amber-400">
                        {totalFleetCost.toLocaleString()} / {maxFleetBudget.toLocaleString()} CR
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (totalFleetCost / maxFleetBudget) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/[0.08]">
              <button
                onClick={handleDirectLaunch}
                className="w-full py-2.5 rounded-2xl text-xs font-bold tracking-wider text-white bg-rose-600/85 hover:bg-rose-600 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.35)] border border-rose-400/30 active:scale-[0.98]"
              >
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <span>DIRECT SCRAMBLE TO COMBAT</span>
              </button>
              <button
                onClick={() => {
                  soundEngine.playUIClick();
                  setScreen('HARBOR_DRYDOCK');
                }}
                className="w-full py-2.5 rounded-2xl text-xs font-medium text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Outfit in Drydock Bay</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Telemetry Simulation Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        initialVessel={activeSimulation}
      />
    </div>
  );
};
