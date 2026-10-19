import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Camera, Eye, Crosshair, Compass, ArrowLeft, Volume2, VolumeX, 
  ShieldAlert, RefreshCw, Radio, Anchor, LifeBuoy, CheckCircle2, XCircle, Shield
} from 'lucide-react';
import { useTacticalStore } from '@/store/tacticalStore';
import { BattleScene } from '@/components/canvas/BattleScene';
import { RadarDisplay } from '@/components/ui/RadarDisplay';
import { FleetStatusIndicator } from '@/components/ui/FleetStatusIndicator';
import { TacticalActionControls } from '@/components/ui/TacticalActionControls';
import { EventLog } from '@/components/ui/EventLog';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { TacticalButton } from '@/components/ui/TacticalButton';
import { CommandPanel } from '@/components/ui/CommandPanel';
import { PostBattleDebriefModal } from '@/components/screens/PostBattleDebriefModal';
import { ShipState, CameraMode } from '@/types/combat';

export const LiveCombatScreen: React.FC = () => {
  const {
    tacticalView,
    activeMatchId,
    selectedShipId,
    selectedTargetId,
    selectedTargetCoords,
    selectedWeaponId,
    incomingThreats,
    cameraMode,
    setCameraMode,
    selectShip,
    selectTarget,
    selectWeapon,
    fireSelectedWeapon,
    deployCountermeasure,
    orderManeuver,
    orderRetreat,
    orderRescue,
    actionFeedback,
    clearActionFeedback,
    setScreen,
    isMuted,
    toggleMute,
    disconnectCombatSocket,
  } = useTacticalStore();

  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'LOGS'>('CONTROLS');

  const friendlyFleet: ShipState[] = tacticalView?.friendly_fleet || [];
  const contacts = tacticalView?.sensor_contacts || [];
  const projectiles = tacticalView?.projectiles || [];
  const events = tacticalView?.recent_events || [];
  const objectives = tacticalView?.objectives || [];

  const selectedShip: ShipState | null = friendlyFleet.find((s: ShipState) => s.id === selectedShipId) || friendlyFleet[0] || null;

  // Disabled ship rescue detection
  const disabledShip = friendlyFleet.find((s) => s.damage_state === 'DISABLED' && !s.is_rescued);
  const rescuerShip = selectedShip && selectedShip.damage_state !== 'DISABLED' && selectedShip.damage_state !== 'SINKING' ? selectedShip : null;
  let distanceToDisabled: number | null = null;
  if (disabledShip && rescuerShip) {
    distanceToDisabled = Math.hypot(
      rescuerShip.position.x - disabledShip.position.x,
      rescuerShip.position.y - disabledShip.position.y
    );
  }
  const canRescue = distanceToDisabled !== null && distanceToDisabled <= 6.0;

  const isRetreating = friendlyFleet.some((s) => s.is_retreating) || tacticalView?.current_phase === 'RETREATING';

  const isBattleFinished = Boolean(
    tacticalView?.is_finished ||
    tacticalView?.current_phase === 'DEBRIEF_RECOVERY' ||
    tacticalView?.battle_report ||
    tacticalView?.outcome
  );

  const handleReturnToHarbor = () => {
    disconnectCombatSocket();
    setScreen('HARBOR_DRYDOCK');
  };

  // Manual Tactical & Action Key Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!selectedShip || selectedShip.damage_state === 'DISABLED' || selectedShip.damage_state === 'SINKING') return;

      const key = e.key.toLowerCase();
      const isAlien = selectedShip.ship_type.includes('ALIEN') || selectedShip.faction === 'THE_HARVESTERS';

      // W / S: Speed up / Speed down (+/- 5 knots, or +/- 10 knots for high-agility alien craft)
      if (key === 'w') {
        const currentSpeed = selectedShip.speed || 0;
        const maxSpeed = selectedShip.max_speed || (isAlien ? 48 : 32);
        const speedStep = isAlien ? 10 : 5;
        const nextSpeed = Math.min(maxSpeed, currentSpeed + speedStep);
        orderManeuver(selectedShip.id, selectedShip.heading, nextSpeed);
      } else if (key === 's') {
        const currentSpeed = selectedShip.speed || 0;
        const speedStep = isAlien ? 10 : 5;
        const nextSpeed = Math.max(0, currentSpeed - speedStep);
        orderManeuver(selectedShip.id, selectedShip.heading, nextSpeed);
      }
      // A / D: Turn Port / Turn Starboard (-15 deg / +15 deg, or -25 deg / +25 deg for alien craft)
      else if (key === 'a') {
        const turnStep = isAlien ? 25 : 15;
        const nextHeading = (selectedShip.heading - turnStep + 360) % 360;
        orderManeuver(selectedShip.id, nextHeading, selectedShip.speed || 15);
      } else if (key === 'd') {
        const turnStep = isAlien ? 25 : 15;
        const nextHeading = (selectedShip.heading + turnStep) % 360;
        orderManeuver(selectedShip.id, nextHeading, selectedShip.speed || 15);
      }
      // Shift: Afterburner Boost for Alien Warcraft (instant flank speed 48 kts)
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (isAlien) {
          orderManeuver(selectedShip.id, selectedShip.heading, 48);
        }
      }
      // Space: Fire currently selected weapon
      else if (e.code === 'Space') {
        e.preventDefault();
        fireSelectedWeapon();
      }
      // C: Deploy CIWS or defensive countermeasure
      else if (key === 'c') {
        if (selectedShip.countermeasures && selectedShip.countermeasures.length > 0) {
          const readyCm = selectedShip.countermeasures.find(c => c.charges_remaining > 0 && c.current_cooldown <= 0) || selectedShip.countermeasures[0];
          deployCountermeasure(selectedShip.id, readyCm.id);
        } else {
          deployCountermeasure(selectedShip.id, 'phalanx_ciws');
        }
      }
      // 1, 2, 3, 4: Quick-select weapon mount
      else if (['1', '2', '3', '4'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (selectedShip.weapons && selectedShip.weapons[idx]) {
          selectWeapon(selectedShip.weapons[idx].id);
        }
      }
      // V: Cycle Camera Modes
      else if (key === 'v') {
        const modes: CameraMode[] = ['TACTICAL_ORBIT', 'TACTICAL_TOPDOWN', 'ACTION_CHASE', 'BRIDGE_FIRST_PERSON'];
        const currIdx = modes.indexOf(cameraMode);
        const nextMode = modes[(currIdx + 1) % modes.length];
        setCameraMode(nextMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShip, cameraMode, orderManeuver, fireSelectedWeapon, deployCountermeasure, selectWeapon, setCameraMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090D16] text-slate-100 flex flex-col select-none">
      {/* 1. TOP THREAT ALERT BANNER */}
      <AlertBanner
        threats={incomingThreats}
        friendlyShips={friendlyFleet}
        onDeployCountermeasure={deployCountermeasure}
      />

      {/* 2. TOP CIC TELEMETRY BAR */}
      <header className="relative z-30 flex items-center justify-between px-6 py-2.5 bg-[#070B14]/70 border-b border-white/[0.08] backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <TacticalButton size="sm" variant="ghost" onClick={handleReturnToHarbor} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Drydock
          </TacticalButton>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF] animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-tight">
              Combat Information Center
            </span>
            <span className="text-[11px] font-mono-tech text-slate-400">
              T+{tacticalView?.simulation_time.toFixed(1) || '0.0'}s
            </span>
            {tacticalView?.current_phase && (
              <span className="hidden md:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 text-sky-300 font-medium uppercase tracking-wider font-mono-tech">
                {tacticalView.current_phase.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Camera Mode Segmented Pill Toggles */}
        <div className="flex items-center gap-3">
          <div className="ios-segmented-container flex items-center gap-1">
            <button
              onClick={() => setCameraMode('TACTICAL_ORBIT')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'TACTICAL_ORBIT'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Orbit</span>
            </button>

            <button
              onClick={() => setCameraMode('TACTICAL_TOPDOWN')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'TACTICAL_TOPDOWN'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Overhead</span>
            </button>

            <button
              onClick={() => setCameraMode('ACTION_CHASE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'ACTION_CHASE'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Action</span>
            </button>

            <button
              onClick={() => setCameraMode('BRIDGE_FIRST_PERSON')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'BRIDGE_FIRST_PERSON'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Bridge / Cockpit</span>
            </button>
          </div>

          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/[0.08] cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-[#FF453A]" /> : <Volume2 className="w-4 h-4 text-[#0A84FF]" />}
          </button>
        </div>
      </header>

      {/* 3. CENTER VIEWPORT: 3D OCEAN BATTLE ARENA */}
      <div className="relative flex-1 w-full h-full">
        <BattleScene />

        {/* Action Feedback Toast */}
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border text-xs font-medium backdrop-blur-xl shadow-2xl ${
              actionFeedback.success
                ? 'bg-[#0E2038]/90 text-sky-200 border-[#0A84FF]/40'
                : 'bg-[#2E0B12]/90 text-red-200 border-[#FF453A]/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span>{actionFeedback.message}</span>
              <button
                onClick={clearActionFeedback}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. OVERLAY LEFT PANEL: FRIENDLY FLEET STATUS, RESCUE & OBJECTIVES */}
        <div className="absolute top-4 left-4 z-20 w-80 space-y-3 pointer-events-auto max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          <CommandPanel
            title="Task Force Status"
            subtitle={`${friendlyFleet.length} Vessels Under Command`}
            statusLed="cyan"
          >
            <div className="space-y-2.5 pt-1">
              {friendlyFleet.map((ship) => (
                <FleetStatusIndicator
                  key={ship.id}
                  ship={ship}
                  isSelected={selectedShipId === ship.id}
                  onSelect={() => selectShip(ship.id)}
                />
              ))}
            </div>
          </CommandPanel>

          {/* Distress Beacon & Rescue HUD Card */}
          {disabledShip && (
            <div className={`p-4 rounded-2xl border transition-all ${
              canRescue 
                ? 'bg-[#FF9F0A]/10 border-[#FF9F0A]/40 text-amber-200 shadow-[0_4px_20px_rgba(255,159,10,0.15)]' 
                : 'bg-white/[0.03] border-white/[0.08] text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs flex items-center gap-1.5 text-[#FF9F0A]">
                  <LifeBuoy className="w-4 h-4 animate-pulse" />
                  Distress: {disabledShip.name}
                </span>
                <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] font-bold">
                  {distanceToDisabled !== null ? `${distanceToDisabled.toFixed(1)}km` : 'In Scan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3 font-normal leading-relaxed">
                {canRescue 
                  ? 'Vessel within recovery proximity. Tow cable locked.' 
                  : 'Maneuver friendly vessel within 6.0km envelope to initiate rescue.'}
              </p>
              <button
                disabled={!canRescue || !rescuerShip}
                onClick={() => {
                  if (rescuerShip && disabledShip) {
                    orderRescue(rescuerShip.id, disabledShip.id);
                  }
                }}
                className={`w-full py-2 text-center text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  canRescue
                    ? 'bg-[#FF9F0A] hover:bg-[#E08A05] text-slate-950 shadow-[0_2px_12px_rgba(255,159,10,0.35)] active:scale-[0.98]'
                    : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                Execute Rescue & Tow
              </button>
            </div>
          )}

          {/* Strategic Retreat Order */}
          <CommandPanel
            title="Strategic Decision"
            subtitle={isRetreating ? "Retreat in progress" : "Tactical disengagement"}
            statusLed={isRetreating ? "amber" : "cyan"}
          >
            <div className="space-y-2.5 text-xs pt-1">
              <p className="text-slate-400 font-normal leading-relaxed">
                Order task force to break contact and withdraw south across extraction line (Y &le; -25km).
              </p>
              <button
                onClick={() => orderRetreat()}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isRetreating
                    ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40'
                    : 'bg-white/10 hover:bg-white/15 text-white active:scale-[0.98]'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>{isRetreating ? 'Withdrawal Course Active' : 'Order Strategic Withdrawal'}</span>
              </button>
            </div>
          </CommandPanel>

          {/* Mission Objectives Checklist */}
          {objectives.length > 0 && (
            <CommandPanel
              title="Mission Objectives"
              subtitle={`${objectives.filter(o => o.is_completed).length} of ${objectives.length} accomplished`}
              statusLed={objectives.every(o => o.is_completed) ? "cyan" : "amber"}
            >
              <div className="space-y-2 pt-1 text-xs">
                {objectives.map((obj) => (
                  <div key={obj.id} className="flex items-start gap-2.5 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    {obj.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0 mt-0.5" />
                    ) : obj.is_failed ? (
                      <XCircle className="w-4 h-4 text-[#FF453A] shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold truncate ${obj.is_completed ? 'text-[#30D158]' : 'text-slate-200'}`}>
                          {obj.title}
                        </span>
                        {obj.is_mandatory && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#FF453A]/20 border border-[#FF453A]/40 text-red-300 rounded-full font-bold shrink-0">
                            REQ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-normal truncate">{obj.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CommandPanel>
          )}
        </div>

        {/* 5. OVERLAY RIGHT PANEL: 2D RADAR DISPLAY & TACTICAL ACTIONS */}
        <div className="absolute top-4 right-4 z-20 w-96 space-y-3 pointer-events-auto max-h-[calc(100vh-120px)] overflow-y-auto pl-1">
          {/* 2D Tactical Radar Scope */}
          <CommandPanel
            title="Tactical Radar Scope"
            subtitle={`${contacts.length} Tracks Detected`}
            statusLed={contacts.length > 0 ? 'amber' : 'cyan'}
          >
            <RadarDisplay
              friendlyShips={friendlyFleet}
              sensorContacts={contacts}
              projectiles={projectiles}
              selectedShipId={selectedShipId}
              selectedTargetId={selectedTargetId}
              onSelectShip={selectShip}
              onSelectTarget={selectTarget}
            />
          </CommandPanel>

          {/* Action Tabs: Controls or Event Chronolog */}
          <div className="ios-segmented-container flex">
            <button
              onClick={() => setActiveTab('CONTROLS')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'CONTROLS'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weapons & Rudder
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'LOGS'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Chronolog ({events.length})
            </button>
          </div>

          {activeTab === 'CONTROLS' ? (
            <TacticalActionControls
              selectedShip={selectedShip}
              selectedTargetId={selectedTargetId}
              selectedTargetCoords={selectedTargetCoords}
              selectedWeaponId={selectedWeaponId}
              onSelectWeapon={selectWeapon}
              onFireWeapon={fireSelectedWeapon}
              onDeployCountermeasure={deployCountermeasure}
              onOrderManeuver={orderManeuver}
            />
          ) : (
            <div className="h-72 apple-glass rounded-2xl overflow-hidden p-3 border border-white/[0.08]">
              <EventLog events={events} />
            </div>
          )}
        </div>

        {/* Action Helm Keyboard Controls HUD */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#070B14]/85 border border-white/10 backdrop-blur-xl shadow-2xl text-[11px] font-mono-tech">
            <span className={`flex items-center gap-1.5 font-semibold uppercase tracking-wider pr-2.5 border-r border-white/10 ${
              selectedShip?.ship_type.includes('ALIEN') || selectedShip?.faction === 'THE_HARVESTERS'
                ? 'text-orange-400'
                : 'text-sky-400'
            }`}>
              <Compass className="w-3.5 h-3.5" />
              {selectedShip?.ship_type.includes('ALIEN') || selectedShip?.faction === 'THE_HARVESTERS'
                ? 'Harbinger Flight Helm'
                : cameraMode === 'BRIDGE_FIRST_PERSON' ? 'Bridge Direct Control' : 'Action Helm'}
            </span>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">W</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">S</kbd>
                <span className="text-slate-400">{selectedShip?.ship_type.includes('ALIEN') ? 'Thrusters' : 'Throttle'}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">A</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">D</kbd>
                <span className="text-slate-400">{selectedShip?.ship_type.includes('ALIEN') ? 'Vector Yaw' : 'Rudder'}</span>
              </span>
              {(selectedShip?.ship_type.includes('ALIEN') || selectedShip?.faction === 'THE_HARVESTERS') && (
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">SHIFT</kbd>
                  <span className="text-amber-300 font-semibold">Boost (48kt)</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">SPACE</kbd>
                <span className="text-amber-300 font-semibold">Fire</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">C</kbd>
                <span className="text-emerald-400">{selectedShip?.ship_type.includes('ALIEN') ? 'Shield/ECM' : 'CIWS'}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">1-4</kbd>
                <span className="text-slate-400">Mounts</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px] border border-white/15">V</kbd>
                <span className="text-purple-300">View</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. POST-BATTLE DEBRIEF MODAL (STAGE 09) */}
      {isBattleFinished && (
        <PostBattleDebriefModal
          report={tacticalView?.battle_report}
          outcome={tacticalView?.outcome}
          onReturnToHarbor={handleReturnToHarbor}
          onViewIntelligence={() => {
            disconnectCombatSocket();
            setScreen('INTELLIGENCE');
          }}
        />
      )}
    </div>
  );
};
