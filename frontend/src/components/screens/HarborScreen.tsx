import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Anchor, ArrowLeft, Shield, Crosshair, Lock, AlertTriangle, Plus, Trash2, Gauge, Activity, Radar, DollarSign, X, Waves, Play, Plane } from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { CommandPanel } from '@/components/ui/CommandPanel';
import { EquipmentSlot } from '@/components/ui/EquipmentSlot';
import { MenuShipShowcase } from '@/components/canvas/MenuShipShowcase';
import { WEAPONS, COUNTERMEASURES, SHIP_TEMPLATES } from '@/services/harborCatalog';
import { ShipType } from '@/types/combat';
import { SimulationModal, SimulatorVessel } from '@/components/ui/SimulationModal';

export const HarborScreen: React.FC = () => {
  const {
    setScreen,
    fleetDraft,
    addShipToDraft,
    removeShipFromDraft,
    updateShipLoadout,
    lockDeployment,
    connectCombatSocket,
    selectedScenario,
  } = useTacticalStore();

  const [selectedDraftShipId, setSelectedDraftShipId] = useState<string>(fleetDraft[0]?.shipId || '');
  const [modalOpen, setModalOpen] = useState<{ open: boolean; slotType: 'weapon' | 'countermeasure'; slotIndex: number }>({
    open: false,
    slotType: 'weapon',
    slotIndex: 0,
  });
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [simVessel, setSimVessel] = useState<SimulatorVessel>('SENTINEL');

  const selectedShip = fleetDraft.find((s) => s.shipId === selectedDraftShipId) || fleetDraft[0];
  const template = selectedShip ? SHIP_TEMPLATES[selectedShip.shipType] : null;

  // Calculate fleet totals
  const totalTonnage = fleetDraft.reduce((acc, s) => acc + (SHIP_TEMPLATES[s.shipType]?.displacement_tons || 0), 0);
  const totalCost = fleetDraft.reduce((acc, s) => acc + (SHIP_TEMPLATES[s.shipType]?.cost_credits || 0), 0);
  const maxTonnage = 35000;
  const maxBudget = 50000;

  const isTonnageExceeded = totalTonnage > maxTonnage;
  const isBudgetExceeded = totalCost > maxBudget;

  const handleDeployLock = () => {
    if (isTonnageExceeded || isBudgetExceeded) return;
    lockDeployment();
    const matchId = `match_${Math.random().toString(36).substring(2, 8)}`;
    connectCombatSocket(matchId);
    setScreen('LIVE_COMBAT');
  };

  const handleMountItem = (itemId: string) => {
    if (!selectedShip) return;

    if (modalOpen.slotType === 'weapon') {
      const nextWeapons = [...selectedShip.equippedWeaponIds];
      nextWeapons[modalOpen.slotIndex] = itemId;
      updateShipLoadout(selectedShip.shipId, nextWeapons, selectedShip.equippedCountermeasureIds);
    } else {
      const nextCms = [...selectedShip.equippedCountermeasureIds];
      nextCms[modalOpen.slotIndex] = itemId;
      updateShipLoadout(selectedShip.shipId, selectedShip.equippedWeaponIds, nextCms);
    }
    setModalOpen({ open: false, slotType: 'weapon', slotIndex: 0 });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070B14] text-slate-100 flex flex-col select-none">
      {/* 1. FULL-STAGE 3D DRYDOCK WARSHIP SHOWCASE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        {selectedShip && (
          <MenuShipShowcase
            key={selectedShip.shipId + selectedShip.shipType}
            shipType={selectedShip.shipType as ShipType}
            className="w-full h-full"
          />
        )}
        {/* Subtle vignette gradient so floating glass pods remain legible */}
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
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white tracking-tight flex items-center gap-2">
                Naval Drydock & Fleet Logistics
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 text-sky-300 font-medium font-mono-tech">
                  BAY-01
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Task Force Outfitting &bull; Hardpoint Systems &bull; Deployment Readiness
              </p>
            </div>
          </div>
        </div>

        {/* Fleet Metrics & Deployment Action */}
        <div className="flex items-center gap-4">
          {/* Apple-style Metric Capsules */}
          <div className="flex items-center gap-4 bg-black/40 border border-white/[0.08] px-4 py-2 rounded-2xl backdrop-blur-xl">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Displacement</span>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-mono-tech font-bold ${isTonnageExceeded ? 'text-[#FF453A]' : 'text-slate-100'}`}>
                  {totalTonnage.toLocaleString()} <span className="text-slate-500 font-normal">/ {maxTonnage.toLocaleString()} t</span>
                </span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isTonnageExceeded ? 'bg-[#FF453A]' : 'bg-[#0A84FF]'}`}
                    style={{ width: `${Math.min(100, (totalTonnage / maxTonnage) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Naval Budget</span>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-mono-tech font-bold ${isBudgetExceeded ? 'text-[#FF453A]' : 'text-slate-100'}`}>
                  {totalCost.toLocaleString()} <span className="text-slate-500 font-normal">/ {maxBudget.toLocaleString()} CR</span>
                </span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isBudgetExceeded ? 'bg-[#FF453A]' : 'bg-[#FF9F0A]'}`}
                    style={{ width: `${Math.min(100, (totalCost / maxBudget) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            disabled={isTonnageExceeded || isBudgetExceeded || fleetDraft.length === 0}
            onClick={handleDeployLock}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-tight transition-all cursor-pointer ${
              isTonnageExceeded || isBudgetExceeded || fleetDraft.length === 0
                ? 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                : 'bg-[#0A84FF] hover:bg-[#0077ED] text-white shadow-[0_4px_20px_rgba(10,132,255,0.4)] active:scale-[0.98]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock & Deploy Fleet</span>
          </button>
        </div>
      </header>

      {/* 3. SPATIAL FLOATING WORKSPACE (HUD OVERLAY OVER 3D VESSEL) */}
      <div className="relative z-10 flex-1 w-full h-[calc(100vh-65px)] p-6 flex justify-between pointer-events-none">
        {/* Left Floating Wing: Task Force Roster */}
        <div className="w-80 pointer-events-auto space-y-3 flex flex-col justify-between overflow-y-auto pr-1">
          <div className="space-y-3">
            <CommandPanel
              title="Task Force Roster"
              subtitle={`${fleetDraft.length} of 4 Capital Vessels Commissioned`}
              statusLed="cyan"
              actions={
                fleetDraft.length < 4 && (
                  <button
                    onClick={() => {
                      const id = `ship_${Date.now().toString(36)}`;
                      addShipToDraft({
                        shipId: id,
                        customName: 'USS Hopper (DDG-70)',
                        shipType: 'DESTROYER',
                        equippedWeaponIds: ['railgun_mark1', 'tomahawk_asm'],
                        equippedCountermeasureIds: ['phalanx_ciws'],
                      });
                      setSelectedDraftShipId(id);
                    }}
                    className="text-xs font-semibold text-[#0A84FF] hover:text-[#0077ED] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Vessel
                  </button>
                )
              }
            >
              <div className="space-y-2 pt-1">
                {fleetDraft.map((s) => {
                  const isSelected = selectedDraftShipId === s.shipId;
                  const tmpl = SHIP_TEMPLATES[s.shipType];
                  return (
                    <div
                      key={s.shipId}
                      onClick={() => setSelectedDraftShipId(s.shipId)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'apple-glass-active bg-[#0A84FF]/15 border-[#0A84FF]/60 shadow-[0_0_20px_rgba(10,132,255,0.2)]'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]' : 'bg-slate-500'}`} />
                          <h4 className="text-xs font-semibold text-white">{s.customName}</h4>
                        </div>
                        {fleetDraft.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeShipFromDraft(s.shipId);
                            }}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:text-[#FF453A] hover:bg-white/[0.08] transition-colors"
                            title="Decommission Ship"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5 font-mono-tech">
                        <span className="font-sans text-[11px] text-slate-300 font-medium">{tmpl?.name}</span>
                        <span>{tmpl?.displacement_tons.toLocaleString()} t</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CommandPanel>

            {/* Logistics Directive Note */}
            <div className="apple-glass p-3.5 text-xs text-slate-300 space-y-1.5">
              <span className="text-[#FF9F0A] font-semibold flex items-center gap-1.5 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" /> Fleet Protocol
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                Munitions and countermeasures lock once departure clearance is granted. Drag center viewport to rotate warship 360°.
              </p>
            </div>
          </div>
        </div>

        {/* Right Floating Wing: Ship Hardpoint Outfitting */}
        {selectedShip && template ? (
          <div className="w-96 pointer-events-auto space-y-3 overflow-y-auto pl-1">
            <CommandPanel
              title={selectedShip.customName}
              subtitle={`${template.name} Class &bull; ${template.displacement_tons.toLocaleString()} Tons`}
              statusLed="cyan"
            >
              {/* Ship Class Specifications (Apple Health-style metrics) */}
              <div className="grid grid-cols-2 gap-2 mb-3 pt-1">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-[#0A84FF]" /> Hull Armor
                  </span>
                  <strong className="text-xs text-white font-mono-tech font-bold mt-1 block">
                    {template.base_hull} HP
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Gauge className="w-3 h-3 text-emerald-400" /> Flank Speed
                  </span>
                  <strong className="text-xs text-white font-mono-tech font-bold mt-1 block">
                    {template.base_speed} KTS
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Radar className="w-3 h-3 text-sky-400" /> Radar Cross-Section
                  </span>
                  <strong className="text-xs text-white font-mono-tech font-bold mt-1 block">
                    {template.radar_signature}x
                  </strong>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-purple-400" /> Acoustic Signature
                  </span>
                  <strong className="text-xs text-white font-mono-tech font-bold mt-1 block">
                    {template.acoustic_signature}x
                  </strong>
                </div>
              </div>

              {/* Weapon Hardpoints */}
              <div className="space-y-2 mb-3">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#0A84FF]" /> Weapons ({template.max_weapon_slots} Slots)
                </h4>
                <div className="space-y-2">
                  {Array.from({ length: template.max_weapon_slots }).map((_, slotIdx) => {
                    const weaponId = selectedShip.equippedWeaponIds[slotIdx];
                    const weapon = weaponId ? WEAPONS[weaponId] : null;
                    return (
                      <EquipmentSlot
                        key={slotIdx}
                        slotIndex={slotIdx}
                        slotType="weapon"
                        item={weapon}
                        onEquipClick={() => setModalOpen({ open: true, slotType: 'weapon', slotIndex: slotIdx })}
                        onRemoveClick={() => {
                          const next = [...selectedShip.equippedWeaponIds];
                          next.splice(slotIdx, 1);
                          updateShipLoadout(selectedShip.shipId, next, selectedShip.equippedCountermeasureIds);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Countermeasure Hardpoints */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#30D158]" /> Countermeasures ({template.max_countermeasure_slots} Slots)
                </h4>
                <div className="space-y-2">
                  {Array.from({ length: template.max_countermeasure_slots }).map((_, slotIdx) => {
                    const cmId = selectedShip.equippedCountermeasureIds[slotIdx];
                    const cm = cmId ? COUNTERMEASURES[cmId] : null;
                    return (
                      <EquipmentSlot
                        key={slotIdx}
                        slotIndex={slotIdx}
                        slotType="countermeasure"
                        item={cm}
                        onEquipClick={() => setModalOpen({ open: true, slotType: 'countermeasure', slotIndex: slotIdx })}
                        onRemoveClick={() => {
                          const next = [...selectedShip.equippedCountermeasureIds];
                          next.splice(slotIdx, 1);
                          updateShipLoadout(selectedShip.shipId, selectedShip.equippedWeaponIds, next);
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 3D Interactive Sea Trials / Flight Ops Simulator Button */}
              <div className="pt-3 border-t border-white/10 mt-3">
                <button
                  onClick={() => {
                    const vessel: SimulatorVessel = 
                      selectedShip.shipType === 'SUBMARINE' ? 'SUBMARINE' :
                      selectedShip.shipType === 'CARRIER' ? 'CARRIER' : 'SENTINEL';
                    setSimVessel(vessel);
                    setIsSimModalOpen(true);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    selectedShip.shipType === 'SUBMARINE'
                      ? 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-500/50 text-teal-300 shadow-teal-500/10'
                      : selectedShip.shipType === 'CARRIER'
                      ? 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/50 text-indigo-300 shadow-indigo-500/10'
                      : 'bg-[#0A84FF]/20 hover:bg-[#0A84FF]/30 border-[#0A84FF]/50 text-sky-300 shadow-[#0A84FF]/10'
                  }`}
                >
                  {selectedShip.shipType === 'SUBMARINE' ? (
                    <>
                      <Waves className="w-4 h-4 text-teal-400" />
                      <span>Launch SSN-21 Sea Trials (3D Sub Sim)</span>
                    </>
                  ) : selectedShip.shipType === 'CARRIER' ? (
                    <>
                      <Plane className="w-4 h-4 text-indigo-400" />
                      <span>Launch Carrier Flight Ops (3D USS Meridian)</span>
                    </>
                  ) : (
                    <>
                      <Anchor className="w-4 h-4 text-sky-400" />
                      <span>Launch 3D Sea Trials (USS Sentinel)</span>
                    </>
                  )}
                </button>
              </div>
            </CommandPanel>
          </div>
        ) : null}
      </div>

      {/* Apple Equipment Selection Sheet Modal */}
      {modalOpen.open && template && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="apple-glass max-w-lg w-full p-6 space-y-4 shadow-2xl border border-white/[0.12]"
          >
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Equip {modalOpen.slotType === 'weapon' ? 'Weapon System' : 'Countermeasure'}
                </h3>
                <p className="text-xs text-slate-400">Hardpoint #{modalOpen.slotIndex + 1}</p>
              </div>
              <button
                onClick={() => setModalOpen({ open: false, slotType: 'weapon', slotIndex: 0 })}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {modalOpen.slotType === 'weapon'
                ? Object.values(WEAPONS)
                    .filter((w: any) => template.allowed_weapon_types.includes(w.weapon_type as any))
                    .map((w: any) => (
                      <div
                        key={w.id}
                        onClick={() => handleMountItem(w.id)}
                        className="p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.18] rounded-xl cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-center text-xs font-semibold text-white">
                          <span>{w.name}</span>
                          <span className="font-mono-tech text-[11px] text-[#0A84FF] px-2 py-0.5 rounded-full bg-[#0A84FF]/10">
                            {w.max_ammo} RDS
                          </span>
                        </div>
                        <div className="flex gap-4 text-[11px] font-mono-tech text-slate-400 mt-2">
                          <span>DMG: <strong className="text-amber-400">{w.damage}</strong></span>
                          <span>RNG: <strong className="text-sky-300">{w.max_range}km</strong></span>
                          <span>CD: <strong className="text-slate-300">{w.cooldown_seconds}s</strong></span>
                        </div>
                      </div>
                    ))
                : Object.values(COUNTERMEASURES).map((cm: any) => (
                    <div
                      key={cm.id}
                      onClick={() => handleMountItem(cm.id)}
                      className="p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.18] rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center text-xs font-semibold text-white">
                        <span>{cm.name}</span>
                        <span className="font-mono-tech text-[11px] text-[#30D158] px-2 py-0.5 rounded-full bg-[#30D158]/10">
                          {cm.max_charges} CHG
                        </span>
                      </div>
                      <div className="flex gap-4 text-[11px] font-mono-tech text-slate-400 mt-2">
                        <span>EFF: <strong className="text-emerald-400">{Math.round(cm.effectiveness * 100)}%</strong></span>
                        <span>CD: <strong className="text-slate-300">{cm.cooldown_seconds}s</strong></span>
                      </div>
                    </div>
                  ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 3D Sea Trials Simulation Modal */}
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        initialVessel={simVessel}
      />
    </div>
  );
};
