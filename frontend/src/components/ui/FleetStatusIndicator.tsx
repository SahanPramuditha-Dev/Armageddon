import React from 'react';
import { motion } from 'motion/react';
import { Ship, Shield, Radio, Crosshair, Zap, Compass, Gauge } from 'lucide-react';
import { ShipState, DamageState } from '@/types/combat';

interface FleetStatusIndicatorProps {
  ship: ShipState;
  isSelected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export const FleetStatusIndicator: React.FC<FleetStatusIndicatorProps> = ({
  ship,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  const damageStateBadge: Record<string, { label: string; class: string }> = {
    OPERATIONAL: { label: 'Operational', class: 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30' },
    DAMAGED: { label: 'Damaged', class: 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30' },
    CRITICAL: { label: 'Critical', class: 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30 animate-pulse' },
    DISABLED: { label: 'Disabled', class: 'bg-[#FF453A]/25 text-[#FF453A] border-[#FF453A]/50 animate-pulse' },
    SINKING: { label: 'Sinking', class: 'bg-slate-800 text-slate-500 border-slate-700 line-through' },
  };

  const getSubsystemColor = (pct: number) => {
    if (pct > 70) return 'bg-[#30D158]';
    if (pct > 35) return 'bg-[#FF9F0A]';
    return 'bg-[#FF453A]';
  };

  const badge = damageStateBadge[ship.damage_state as string] || { label: ship.damage_state, class: 'bg-white/10 text-slate-300' };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'ios-glass-active bg-[#0A84FF]/10 border-[#0A84FF]/50 shadow-[0_0_15px_rgba(10,132,255,0.15)]'
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
      }`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#0A84FF]/20 text-[#0A84FF]' : 'bg-white/5 text-slate-400'}`}>
            <Ship className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white leading-tight">
              {ship.name}
            </h4>
            <span className="text-[11px] text-slate-400">
              {ship.ship_type} &bull; {ship.faction}
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] px-2 py-0.5 border rounded-full font-medium ${badge.class}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Telemetry Numbers */}
      <div className="flex items-center gap-3 mb-2.5 text-[10px] font-mono-tech text-slate-400 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-[#0A84FF]" />
          <span>{Math.round(ship.heading)}°</span>
        </div>
        <div className="flex items-center gap-1">
          <Gauge className="w-3 h-3 text-emerald-400" />
          <span>{Math.round(ship.speed)} kts</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-slate-500 font-sans">Pos:</span>
          <span>{ship.position.x.toFixed(1)}, {ship.position.y.toFixed(1)}</span>
        </div>
      </div>

      {/* Subsystem Health Progress Bars */}
      {!compact && (
        <div className="space-y-2 text-[10px]">
          {/* Hull */}
          <div>
            <div className="flex justify-between items-center text-slate-300 mb-1">
              <span className="flex items-center gap-1 font-medium text-[11px] text-slate-300">
                <Shield className="w-3 h-3 text-[#0A84FF]" /> Hull Integrity
              </span>
              <span className="font-mono-tech font-bold text-slate-100">{Math.round(ship.subsystems.hull)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getSubsystemColor(ship.subsystems.hull)}`}
                style={{ width: `${Math.min(100, Math.max(0, ship.subsystems.hull))}%` }}
              />
            </div>
          </div>

          {/* Subsystems Row */}
          <div className="grid grid-cols-3 gap-2 pt-0.5 font-mono-tech">
            <div className="bg-black/20 p-1.5 rounded-lg border border-white/[0.03]">
              <div className="flex justify-between text-slate-400 text-[9px] mb-1">
                <span className="font-sans font-medium">Engines</span>
                <span>{Math.round(ship.subsystems.propulsion)}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getSubsystemColor(ship.subsystems.propulsion)}`}
                  style={{ width: `${ship.subsystems.propulsion}%` }}
                />
              </div>
            </div>

            <div className="bg-black/20 p-1.5 rounded-lg border border-white/[0.03]">
              <div className="flex justify-between text-slate-400 text-[9px] mb-1">
                <span className="font-sans font-medium">Radar</span>
                <span>{Math.round(ship.subsystems.radar)}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getSubsystemColor(ship.subsystems.radar)}`}
                  style={{ width: `${ship.subsystems.radar}%` }}
                />
              </div>
            </div>

            <div className="bg-black/20 p-1.5 rounded-lg border border-white/[0.03]">
              <div className="flex justify-between text-slate-400 text-[9px] mb-1">
                <span className="font-sans font-medium">Fire Ctrl</span>
                <span>{Math.round(ship.subsystems.fire_control)}%</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getSubsystemColor(ship.subsystems.fire_control)}`}
                  style={{ width: `${ship.subsystems.fire_control}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
