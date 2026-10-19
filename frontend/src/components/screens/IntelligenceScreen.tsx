import React, { useState } from 'react';
import { ArrowLeft, Radio, ShieldAlert, Cpu, Eye, Info, Crosshair, Shield, Activity, Zap, Anchor } from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { CommandPanel } from '@/components/ui/CommandPanel';
import { MenuShipShowcase } from '@/components/canvas/MenuShipShowcase';
import { ShipType, Faction } from '@/types/combat';
import { SimulationModal, SimulatorVessel } from '@/components/ui/SimulationModal';

export const IntelligenceScreen: React.FC = () => {
  const { setScreen } = useTacticalStore();
  const [selectedThreat, setSelectedThreat] = useState<string>('alien_harbinger');
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [simVessel, setSimVessel] = useState<SimulatorVessel>('HARBINGER');

  const threatProfiles: Record<
    string,
    {
      name: string;
      faction: Faction;
      shipType: ShipType;
      rcs: string;
      threatLevel: string;
      weapons: string[];
      defenses: string[];
      analysis: string;
    }
  > = {
    alien_harbinger: {
      name: 'Harbinger Strike Craft (Alien Multi-Domain)',
      faction: 'THE_HARVESTERS',
      shipType: 'ALIEN_SCOUT',
      rcs: 'Adaptive Stealth (4,200t equivalent)',
      threatLevel: 'EXTREME',
      weapons: ['Plasma Siphon Lance', 'Gravimetric Shredder Disc', 'Swarm Micro-Torpedo Pods', 'Kinetic Bottle Salvos'],
      defenses: ['Biomorphic Ion Shield', 'Optical Cloaking Field', 'EMP Burst Generator', 'Autonomous Escort Drones'],
      analysis:
        'Dual atmospheric fighter and deep-diving submersible craft. Possesses full multi-domain combat capabilities, high-agility thrusters, and can submerge beneath oceanic thermoclines to break radar and missile lock.',
    },
    alien_leviathan: {
      name: 'Extraterrestrial Leviathan Dreadnought',
      faction: 'THE_HARVESTERS',
      shipType: 'ALIEN_LEVIATHAN',
      rcs: 'Extreme (28,000t equivalent)',
      threatLevel: 'APOCALYPTIC',
      weapons: ['Plasma Siphon Lance (Directed thermal energy)', 'Gravimetric Spindle Pods (Kinetic armor penetrators)'],
      defenses: ['Reactive Biomorphic Carapace', 'Automated energy point-defense', 'Active electronic ECM deception'],
      analysis:
        'First documented during Pacific oceanic breaches. The Leviathan employs heavy kinetic projectiles that bypass standard radar warning until terminal phase. Recommend immediate countermeasure deployment (Chaff/CIWS) upon detection.',
    },
    alien_skiff: {
      name: 'Bio-Carapace Drone Skiff',
      faction: 'THE_HARVESTERS',
      shipType: 'ALIEN_SCOUT',
      rcs: 'Small / Stealth (6,000t)',
      threatLevel: 'HIGH',
      weapons: ['Pulsed Plasma Lance'],
      defenses: ['High-speed hydrofoil gliding', 'Acoustic masking'],
      analysis:
        'Fast vanguard units designed to swarm human fleet screens and overwhelm point-defense systems. Vulnerable to hyper-velocity railgun fire.',
    },
    eurasian_cruiser: {
      name: 'Eurasian Union Slava-Class Modernized',
      faction: 'EURASIAN_UNION',
      shipType: 'CRUISER',
      rcs: 'Large (12,500t)',
      threatLevel: 'TACTICAL',
      weapons: ['P-800 Oniks Supersonic Cruise Missiles', 'Twin 130mm AK-130 Naval Guns'],
      defenses: ['S-300F Fort Area Air Defense', 'Kashtan CIWS gun-missile system'],
      analysis:
        'Heavily armed guided missile cruiser capable of long-range coordinated anti-ship salvos. Can saturate friendly air defense batteries if not neutralized early.',
    },
  };

  const current = threatProfiles[selectedThreat] || threatProfiles['alien_leviathan'];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070B14] text-slate-100 flex flex-col select-none">
      {/* 1. FULL-STAGE 3D ADVERSARY SHOWCASE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <MenuShipShowcase
          key={current.shipType + current.faction}
          shipType={current.shipType}
          faction={current.faction}
          className="w-full h-full"
        />
        {/* Spatial vignettes for readability */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#070B14]/85 via-transparent to-[#070B14]/65" />
        <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-[#070B14]/70" />
      </div>

      {/* 2. FLOATING VISIONOS HEADER BAR */}
      <header className="relative z-30 px-6 py-3 flex items-center justify-between border-b border-white/[0.08] bg-[#070B14]/60 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <TacticalButton size="sm" variant="ghost" onClick={() => setScreen('MAIN_MENU')} icon={<ArrowLeft className="w-4 h-4" />}>
            Main Menu
          </TacticalButton>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-[#0A84FF]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white tracking-tight flex items-center gap-2">
                Threat & Sensor Intelligence Dossier
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF453A]/15 border border-[#FF453A]/30 text-red-300 font-medium font-mono-tech">
                  CLASSIFIED
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Acoustic Spectrograms &bull; Radar Cross-Sections &bull; Adversary Profiles
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/[0.08] text-xs text-slate-300 backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_8px_#30D158]" />
          <span>Naval Intelligence Satellite Uplink Active</span>
        </div>
      </header>

      {/* 3. SPATIAL FLOATING WORKSPACE */}
      <div className="relative z-10 flex-1 w-full h-[calc(100vh-65px)] p-6 flex justify-between pointer-events-none">
        {/* Left Floating Wing: Adversary Roster */}
        <div className="w-80 pointer-events-auto space-y-3 overflow-y-auto pr-1">
          <CommandPanel title="Adversary Signatures" statusLed="amber">
            <div className="space-y-2 pt-1">
              {Object.entries(threatProfiles).map(([id, t]) => {
                const isSelected = selectedThreat === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedThreat(id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'apple-glass-active bg-[#0A84FF]/15 border-[#0A84FF]/60 shadow-[0_0_20px_rgba(10,132,255,0.2)]'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-white">{t.name}</h4>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 font-mono-tech">
                      <span className="font-sans text-[11px] text-slate-300 font-medium">{t.faction.replace('_', ' ')}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          t.threatLevel === 'APOCALYPTIC'
                            ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                            : t.threatLevel === 'HIGH'
                            ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
                            : 'bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/40'
                        }`}
                      >
                        {t.threatLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CommandPanel>

          <CommandPanel title="Sensor Dynamics" statusLed="cyan">
            <div className="text-xs text-slate-300 space-y-2 pt-1 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-white block mb-0.5 text-xs font-semibold">Confidence Ellipse</strong>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Beyond 50km, contact reports represent probability clouds rather than pinpoint fixes.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <strong className="text-white block mb-0.5 text-xs font-semibold">Tactical Decoys</strong>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Chaff ribbons and active noisemakers produce phantom contacts requiring verification.
                </p>
              </div>
            </div>
          </CommandPanel>
        </div>

        {/* Right Floating Wing: Detailed Dossier */}
        <div className="w-96 pointer-events-auto space-y-3 overflow-y-auto pl-1">
          <CommandPanel title={current.name} subtitle={current.faction.replace('_', ' ')} statusLed="red">
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-medium mb-0.5">Radar Cross-Section</span>
                  <strong className="text-xs text-slate-100 font-semibold">{current.rcs}</strong>
                </div>
                <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                  <span className="text-slate-400 block text-[10px] font-medium mb-0.5">Threat Classification</span>
                  <strong className="text-xs text-[#FF453A] font-semibold">{current.threatLevel}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3 text-[#FF453A]" /> Known Weapons
                </h4>
                <div className="space-y-1.5">
                  {current.weapons.map((w, idx) => (
                    <div key={idx} className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-200 font-medium">
                      {w}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#30D158]" /> Defensive Countermeasures
                </h4>
                <div className="space-y-1.5">
                  {current.defenses.map((d, idx) => (
                    <div key={idx} className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs text-slate-200 font-medium">
                      {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <h4 className="text-[11px] font-semibold text-[#FF9F0A] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Reconnaissance Notes
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">{current.analysis}</p>
              </div>

              {/* 3D Combat Flight / Sea Trials Simulation Launcher */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSimVessel(current.faction === 'THE_HARVESTERS' ? 'HARBINGER' : 'SENTINEL');
                    setIsSimModalOpen(true);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    current.faction === 'THE_HARVESTERS'
                      ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/50 text-orange-300 shadow-orange-500/10'
                      : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/50 text-sky-300 shadow-sky-500/10'
                  }`}
                >
                  {current.faction === 'THE_HARVESTERS' ? (
                    <>
                      <Zap className="w-4 h-4 text-orange-400" />
                      <span>Pilot Alien Harbinger (3D Combat Sim)</span>
                    </>
                  ) : (
                    <>
                      <Anchor className="w-4 h-4 text-sky-400" />
                      <span>Launch Tactical Sea Trials (USS Sentinel)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </CommandPanel>
        </div>
      </div>

      {/* 3D Simulation Deck Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        initialVessel={simVessel}
      />
    </div>
  );
};
