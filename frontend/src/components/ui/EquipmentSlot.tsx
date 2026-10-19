import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, Shield, Plus, X } from 'lucide-react';
import { WeaponMount, CountermeasureMount } from '@/types/combat';
import { TacticalButton } from './TacticalButton';

interface EquipmentSlotProps {
  slotIndex: number;
  slotType: 'weapon' | 'countermeasure';
  item?: WeaponMount | CountermeasureMount | null;
  onEquipClick?: () => void;
  onRemoveClick?: () => void;
  isLocked?: boolean;
}

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slotIndex,
  slotType,
  item,
  onEquipClick,
  onRemoveClick,
  isLocked = false,
}) => {
  const isWeapon = slotType === 'weapon';
  const weapon = isWeapon ? (item as WeaponMount) : null;
  const cm = !isWeapon ? (item as CountermeasureMount) : null;

  return (
    <div className="relative p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-white/[0.06] pb-1.5">
        <span className="flex items-center gap-1.5 font-medium uppercase tracking-wider text-sky-400 text-[11px]">
          <span className="w-5 h-5 rounded-md bg-sky-500/15 flex items-center justify-center">
            {isWeapon ? <Crosshair className="w-3 h-3 text-sky-400" /> : <Shield className="w-3 h-3 text-sky-400" />}
          </span>
          Slot #{slotIndex + 1} &bull; {slotType}
        </span>
        {item && !isLocked && onRemoveClick && (
          <button
            onClick={onRemoveClick}
            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-white/[0.08] transition-colors"
            title="Dismount System"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {item ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h5 className="font-semibold text-xs text-white truncate">
              {item.name}
            </h5>
            <span className="font-mono-tech text-[10px] text-sky-300 font-semibold px-2 py-0.5 bg-sky-500/10 border border-sky-400/20 rounded-full shrink-0">
              {isWeapon ? `${weapon?.ammo_remaining}/${weapon?.max_ammo} RDS` : `${cm?.charges_remaining} CHG`}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 bg-black/20 px-2.5 py-1.5 rounded-lg border border-white/[0.04]">
            {isWeapon && weapon && (
              <>
                <span>DMG <strong className="text-amber-400 font-bold">{weapon.damage}</strong></span>
                <span>RNG <strong className="text-sky-300 font-bold">{weapon.max_range}km</strong></span>
                <span>CD <strong className="text-slate-200 font-bold">{weapon.cooldown_seconds}s</strong></span>
              </>
            )}
            {!isWeapon && cm && (
              <>
                <span>EFF <strong className="text-emerald-400 font-bold">{Math.round(cm.effectiveness * 100)}%</strong></span>
                <span>CD <strong className="text-slate-200 font-bold">{cm.cooldown_seconds}s</strong></span>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2.5 text-center">
          <p className="text-[11px] text-slate-500 uppercase font-medium mb-1.5 tracking-wide">
            Empty Hardpoint
          </p>
          {!isLocked && onEquipClick && (
            <TacticalButton size="sm" variant="ghost" onClick={onEquipClick} icon={<Plus className="w-3.5 h-3.5" />}>
              Mount System
            </TacticalButton>
          )}
        </div>
      )}
    </div>
  );
};
