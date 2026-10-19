import React from 'react';
import { ArrowLeft, Settings, Volume2, Eye, Shield, VolumeX, Sparkles } from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { CommandPanel } from '@/components/ui/CommandPanel';

export const SettingsScreen: React.FC = () => {
  const {
    setScreen,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    reducedMotion,
    setReducedMotion,
  } = useTacticalStore();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col p-6 tactical-grid-bg select-none">
      {/* Top iOS Header Bar */}
      <header className="ios-glass px-6 py-4 max-w-2xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <TacticalButton size="sm" variant="ghost" onClick={() => setScreen('MAIN_MENU')} icon={<ArrowLeft className="w-4 h-4" />}>
            Main Menu
          </TacticalButton>
          <div className="h-6 w-px bg-white/10" />
          <div>
            <h1 className="font-semibold text-base text-white tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#0A84FF]" /> Simulation Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Audio Channels &bull; Motion Dynamics &bull; Accessibility
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full my-auto space-y-6">
        {/* Audio Configuration Group */}
        <CommandPanel title="Audio Channels" statusLed="cyan">
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                  {isMuted ? <VolumeX className="w-4 h-4 text-[#FF453A]" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Acoustic Audio Feed</span>
                  <span className="text-xs text-slate-400">Radar pings, hydrophone acoustics & munitions sfx</span>
                </div>
              </div>
              <button
                onClick={toggleMute}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/40'
                    : 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40'
                }`}
              >
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">Master Gain Level</span>
                <strong className="font-mono-tech text-slate-100 font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                  {Math.round(volume * 100)}%
                </strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#0A84FF] cursor-pointer"
              />
            </div>
          </div>
        </CommandPanel>

        {/* Visuals & Accessibility Group */}
        <CommandPanel title="Display & Accessibility" statusLed="amber">
          <div className="pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white block">Reduced Motion</span>
                  <span className="text-xs text-slate-400">Subdues rapid camera transitions and viewport pans</span>
                </div>
              </div>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  reducedMotion
                    ? 'bg-[#0A84FF] text-white shadow-[0_2px_10px_rgba(10,132,255,0.3)]'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {reducedMotion ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </CommandPanel>

        <div className="text-center pt-2">
          <button
            onClick={() => setScreen('MAIN_MENU')}
            className="px-6 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0077ED] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(10,132,255,0.35)] active:scale-[0.98] transition-all cursor-pointer"
          >
            Save & Return to CIC
          </button>
        </div>
      </div>
    </div>
  );
};
