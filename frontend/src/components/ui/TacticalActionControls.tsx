import React, { useState } from 'react';
import { Crosshair, Shield, Compass, Gauge, AlertCircle, Wrench, Navigation, Zap } from 'lucide-react';
import { ShipState, Vector2D } from '@/types/combat';
import { TacticalButton } from './TacticalButton';

interface TacticalActionControlsProps {
  selectedShip: ShipState | null;
  selectedTargetId: string | null;
  selectedTargetCoords: Vector2D | null;
  selectedWeaponId: string | null;
  onSelectWeapon: (weaponId: string) => void;
  onFireWeapon: () => void;
  onDeployCountermeasure: (shipId: string, cmId: string) => void;
  onOrderManeuver: (shipId: string, heading: number, speed: number) => void;
  className?: string;
}

export const TacticalActionControls: React.FC<TacticalActionControlsProps> = ({
  selectedShip,
  selectedTargetId,
  selectedTargetCoords,
  selectedWeaponId,
  onSelectWeapon,
  onFireWeapon,
  onDeployCountermeasure,
  onOrderManeuver,
  className = '',
}) => {
  const [headingInput, setHeadingInput] = useState<number>(selectedShip?.heading || 0);
  const [speedInput, setSpeedInput] = useState<number>(selectedShip?.speed || 15);

  if (!selectedShip) {
    return (
      <div className={`p-6 ios-glass text-center text-slate-400 text-xs font-medium ${className}`}>
        Select a friendly warship to access combat systems
      </div>
    );
  }

  const selectedWeapon = selectedShip.weapons.find((w) => w.id === selectedWeaponId) || selectedShip.weapons[0];
  const isWeaponReady = selectedWeapon && selectedWeapon.ammo_remaining > 0 && selectedWeapon.current_cooldown <= 0;
  const hasTarget = !!selectedTargetId || !!selectedTargetCoords;

  return (
    <div className={`apple-glass p-4 space-y-4 rounded-2xl shadow-xl ${className}`}>
      {/* Weapons Selector Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#0A84FF]" /> Weapon Hardpoints
          </span>
          <span className="text-[11px] font-mono-tech text-slate-400 font-normal">
            {selectedShip.weapons.length} Online
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedShip.weapons.map((w) => {
            const isSelected = selectedWeapon?.id === w.id;
            const onCd = w.current_cooldown > 0;
            return (
              <button
                key={w.id}
                onClick={() => onSelectWeapon(w.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'apple-glass-active bg-[#0A84FF]/15 border-[#0A84FF]/60 shadow-[0_0_15px_rgba(10,132,255,0.2)]'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {w.name}
                  </span>
                  <span className="text-[10px] font-mono-tech px-1.5 py-0.2 bg-black/40 text-sky-300 rounded-full font-bold">
                    {w.ammo_remaining}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono-tech text-slate-400 mt-1.5">
                  <span>{w.max_range}km</span>
                  <span className={onCd ? 'text-amber-400' : 'text-emerald-400 font-bold'}>
                    {onCd ? `${w.current_cooldown.toFixed(1)}s` : 'Ready'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target & Fire Order Execution */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Target Solution</span>
          {hasTarget ? (
            <span className="text-xs font-semibold text-white truncate block mt-0.5">
              {selectedTargetId ? selectedTargetId.toUpperCase() : `Coord (${selectedTargetCoords?.x}, ${selectedTargetCoords?.y})`}
            </span>
          ) : (
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-normal">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> No Target Locked
            </span>
          )}
        </div>

        <button
          disabled={!isWeaponReady || !hasTarget}
          onClick={onFireWeapon}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            isWeaponReady && hasTarget
              ? 'bg-[#FF453A] hover:bg-[#E03A30] text-white shadow-[0_4px_16px_rgba(255,69,58,0.35)] active:scale-[0.98]'
              : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Fire Salvo</span>
        </button>
      </div>

      {/* Navigation & Rudder Controls */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Navigation & Throttle
          </span>
          <span className="font-mono-tech text-[11px] text-slate-400 font-normal">
            {Math.round(headingInput)}° &bull; {Math.round(speedInput)} kts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <label className="text-[10px] text-slate-400 block mb-1">Heading</label>
            <input
              type="range"
              min="0"
              max="359"
              value={headingInput}
              onChange={(e) => setHeadingInput(Number(e.target.value))}
              className="w-full accent-[#0A84FF] cursor-pointer"
            />
          </div>

          <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <label className="text-[10px] text-slate-400 block mb-1">Flank Speed</label>
            <input
              type="range"
              min="0"
              max={selectedShip.max_speed}
              value={speedInput}
              onChange={(e) => setSpeedInput(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={() => onOrderManeuver(selectedShip.id, headingInput, speedInput)}
          className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0077ED] transition-all shadow-[0_2px_10px_rgba(10,132,255,0.25)] active:scale-[0.98] cursor-pointer"
        >
          Execute Course Change
        </button>
      </div>

      {/* Defensive Countermeasures */}
      <div className="border-t border-white/[0.06] pt-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#30D158]" /> Defenses & Damage Control
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {selectedShip.countermeasures.map((cm) => {
            const isDmgControl = cm.countermeasure_type === 'DAMAGE_CONTROL';
            const canDeploy = cm.charges_remaining > 0 && cm.current_cooldown <= 0;
            return (
              <button
                key={cm.id}
                disabled={!canDeploy}
                onClick={() => onDeployCountermeasure(selectedShip.id, cm.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  canDeploy
                    ? isDmgControl
                      ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40 hover:bg-[#FF9F0A]/30'
                      : 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40 hover:bg-[#30D158]/30'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isDmgControl ? <Wrench className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                <span>{cm.name.split(' ')[0]}</span>
                <span className="font-mono-tech text-[10px] opacity-80">({cm.charges_remaining})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
