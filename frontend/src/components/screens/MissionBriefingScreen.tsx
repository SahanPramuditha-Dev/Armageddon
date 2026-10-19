import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Play, ShieldAlert, Target, Compass, FileText, Anchor, Waves, Radio, Activity } from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { CommandPanel } from '@/components/ui/CommandPanel';

export const MissionBriefingScreen: React.FC = () => {
  const { setScreen, selectedScenario, connectCombatSocket, lockDeployment } = useTacticalStore();

  const handleLaunchMission = () => {
    lockDeployment();
    const matchId = `match_${Math.random().toString(36).substring(2, 8)}`;
    connectCombatSocket(matchId);
    setScreen('LIVE_COMBAT');
  };

  const briefings: Record<string, { title: string; codename: string; theater: string; obj: string[]; rules: string[] }> = {
    SCENARIO_A: {
      title: 'First Contact: Humanity vs. Extraterrestrial Threat',
      codename: 'OPERATION COLD HORIZON',
      theater: 'East Pacific Basin // 21°N, 157°W',
      obj: [
        'Intercept unidentified bio-metallic aquatic force.',
        'Protect Pacific Task Force capital vessels from long-range kinetic strike.',
        'Identify alien propulsion and weapon vulnerabilities.',
        'Neutralize the Hostile Leviathan dreadnought.',
      ],
      rules: [
        'Authorize weapons free once hostile contacts launch plasma or kinetic spikes.',
        'Deploy CIWS and ECM jamming to protect friendly hulls from devastating armor breaches.',
        'Sensor uncertainty is high: confirm target coordinates with radar before firing expensive missiles.',
      ],
    },
    SCENARIO_B: {
      title: 'Nation vs. Nation: Tactical Fleet Duel',
      codename: 'OPERATION IRON LATITUDE',
      theater: 'Contested Archipelago // Zone Charlie',
      obj: [
        'Secure naval supremacy in contested territorial waters.',
        'Deploy active chaff and radar jamming to mislead enemy targeting.',
        'Sink opposing heavy cruisers and destroyers.',
      ],
      rules: [
        'Full wartime engagement protocols active.',
        'Surface-to-surface anti-ship missiles authorized at maximum range.',
      ],
    },
    SCENARIO_C: {
      title: 'Temporary Alliance: Joint Coalition Defense',
      codename: 'OPERATION AEGIS COALITION',
      theater: 'Midway Trench // Deep Abyss',
      obj: [
        'Establish joint data-link with coalition allied forces.',
        'Screen the fleet aircraft carrier flagship from extraterrestrial drone skiffs.',
        'Coordinate combined salvo against the alien mothercore.',
      ],
      rules: [
        'Friendly fire prevention systems strictly enforced.',
        'Share contact telemetry with allied vessels to triangulate cloaked targets.',
      ],
    },
  };

  const currentBriefing = briefings[selectedScenario] || briefings['SCENARIO_A'];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col p-6 tactical-grid-bg select-none">
      {/* iOS Floating Header Bar */}
      <header className="ios-glass px-6 py-4 max-w-7xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <TacticalButton
            size="sm"
            variant="ghost"
            onClick={() => setScreen('MAIN_MENU')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Main Menu
          </TacticalButton>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
              <h1 className="font-semibold text-base text-white tracking-tight flex items-center gap-2">
                Mission Operational Briefing
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              <span className="text-[#0A84FF] font-semibold">{currentBriefing.codename}</span> &bull; {currentBriefing.theater}
            </p>
          </div>
        </div>

        <button
          onClick={handleLaunchMission}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0A84FF] hover:bg-[#0077ED] active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(10,132,255,0.35)] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Commence Mission</span>
        </button>
      </header>

      {/* Main Briefing Grid */}
      <div className="max-w-7xl mx-auto w-full my-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Objectives & Protocols Column */}
        <div className="lg:col-span-2 space-y-6">
          <CommandPanel
            title="Sortie Objectives"
            subtitle={currentBriefing.title}
            statusLed="cyan"
          >
            <div className="space-y-3 pt-1">
              {currentBriefing.obj.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center text-xs text-[#0A84FF] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-slate-200 font-medium leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </CommandPanel>

          <CommandPanel
            title="Rules of Engagement & Protocols"
            subtitle="Adherence to fleet security standard required"
            statusLed="amber"
          >
            <div className="space-y-3 pt-1">
              {currentBriefing.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="w-6 h-6 rounded-md bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#FF9F0A]" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{rule}</p>
                </div>
              ))}
            </div>
          </CommandPanel>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
          <CommandPanel
            title="Theater Environmental Conditions"
            subtitle="Satellite & acoustic recon feeds"
            statusLed="cyan"
          >
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Sea State 4</span>
                  <strong className="text-xs text-slate-100 font-semibold">Moderate swells, 2.5m waves</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Acoustic Thermocline</span>
                  <strong className="text-xs text-slate-100 font-semibold">Surface ducting at 40m depth</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">Atmospheric Radar Status</span>
                  <strong className="text-xs text-[#FF9F0A] font-semibold">Scattered squalls (-15% detection)</strong>
                </div>
              </div>
            </div>
          </CommandPanel>

          <div className="ios-glass p-5 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Anchor className="w-4 h-4 text-[#0A84FF]" /> Fleet Logistics Check
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Need to adjust your ship composition or swap missile magazines before deploying?
            </p>
            <TacticalButton
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setScreen('HARBOR_DRYDOCK')}
            >
              Configure in Drydock
            </TacticalButton>
          </div>
        </div>
      </div>
    </div>
  );
};
