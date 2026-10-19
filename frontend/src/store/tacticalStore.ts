import { create } from 'zustand';
import { 
  ScreenView, CameraMode, Faction, TacticalViewState, 
  ShipState, Vector2D, CombatEvent, InFlightProjectile, SensorContact 
} from '@/types/combat';
import { soundEngine } from '@/services/soundEngine';

export interface ThreatAlert {
  id: string;
  sourceShipId: string;
  targetShipId: string;
  threatType: string;
  estimatedSeconds: number;
  timestamp: number;
}

export interface DraftShip {
  shipId: string;
  customName: string;
  shipType: string;
  equippedWeaponIds: string[];
  equippedCountermeasureIds: string[];
}

interface TacticalStore {
  // Screen and UI navigation
  currentScreen: ScreenView;
  setScreen: (screen: ScreenView) => void;
  selectedScenario: string;
  setSelectedScenario: (scenarioId: string) => void;
  playerFaction: Faction;
  setPlayerFaction: (faction: Faction) => void;

  // Camera mode
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Harbor & Fleet Preparation
  fleetDraft: DraftShip[];
  isDeploymentLocked: boolean;
  setFleetDraft: (draft: DraftShip[]) => void;
  addShipToDraft: (ship: DraftShip) => void;
  removeShipFromDraft: (shipId: string) => void;
  updateShipLoadout: (shipId: string, weapons: string[], cms: string[]) => void;
  lockDeployment: () => void;

  // Active Combat State
  activeMatchId: string | null;
  tacticalView: TacticalViewState | null;
  selectedShipId: string | null;
  selectedTargetId: string | null;
  selectedTargetCoords: Vector2D | null;
  selectedWeaponId: string | null;
  incomingThreats: ThreatAlert[];
  actionFeedback: { success: boolean; message: string } | null;

  // Selection actions
  selectShip: (shipId: string | null) => void;
  selectTarget: (targetId: string | null, coords?: Vector2D) => void;
  selectWeapon: (weaponId: string | null) => void;
  clearActionFeedback: () => void;

  // WebSocket Connection
  socket: WebSocket | null;
  connectCombatSocket: (matchId: string) => void;
  disconnectCombatSocket: () => void;

  // Combat Actions
  fireSelectedWeapon: () => void;
  deployCountermeasure: (shipId: string, cmId: string) => void;
  orderManeuver: (shipId: string, heading: number, speed: number) => void;
  orderRetreat: (shipId?: string) => void;
  orderRescue: (rescuerId: string, disabledId: string) => void;

  // Audio & Settings
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (val: number) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
}

export const useTacticalStore = create<TacticalStore>((set, get) => ({
  currentScreen: 'MAIN_MENU',
  setScreen: (screen) => {
    soundEngine.playUIClick();
    set({ currentScreen: screen });
  },

  selectedScenario: 'SCENARIO_A',
  setSelectedScenario: (scenarioId) => set({ selectedScenario: scenarioId }),

  playerFaction: 'PACIFIC_FLEET',
  setPlayerFaction: (faction) => set({ playerFaction: faction }),

  cameraMode: 'TACTICAL_ORBIT',
  setCameraMode: (mode) => {
    soundEngine.playUIClick();
    set({ cameraMode: mode });
  },

  // Initial fleet draft
  fleetDraft: [
    {
      shipId: 'uss_sentinel',
      customName: 'USS Sentinel (D-57)',
      shipType: 'CRUISER',
      equippedWeaponIds: ['railgun_mark1', 'tomahawk_asm', 'ballistic_strike'],
      equippedCountermeasureIds: ['phalanx_ciws', 'chaff_launcher']
    },
    {
      shipId: 'uss_meridian',
      customName: 'USS Meridian (CVN-72)',
      shipType: 'CARRIER',
      equippedWeaponIds: ['railgun_mark1', 'tomahawk_asm'],
      equippedCountermeasureIds: ['phalanx_ciws', 'an_slq32_ecm']
    }
  ],
  isDeploymentLocked: false,
  setFleetDraft: (draft) => set({ fleetDraft: draft }),
  addShipToDraft: (ship) => set((state) => ({ fleetDraft: [...state.fleetDraft, ship] })),
  removeShipFromDraft: (shipId) => set((state) => ({ fleetDraft: state.fleetDraft.filter((s) => s.shipId !== shipId) })),
  updateShipLoadout: (shipId, weapons, cms) => set((state) => ({
    fleetDraft: state.fleetDraft.map((s) => s.shipId === shipId ? { ...s, equippedWeaponIds: weapons, equippedCountermeasureIds: cms } : s)
  })),
  lockDeployment: () => set({ isDeploymentLocked: true }),

  activeMatchId: null,
  tacticalView: null,
  selectedShipId: null,
  selectedTargetId: null,
  selectedTargetCoords: null,
  selectedWeaponId: null,
  incomingThreats: [],
  actionFeedback: null,

  selectShip: (shipId) => {
    soundEngine.playUIClick();
    const { tacticalView } = get();
    const ship = tacticalView?.friendly_fleet.find((s: ShipState) => s.id === shipId);
    set({ 
      selectedShipId: shipId,
      selectedWeaponId: ship?.weapons?.[0]?.id || null
    });
  },

  selectTarget: (targetId, coords) => {
    soundEngine.playUIClick();
    set({ 
      selectedTargetId: targetId,
      selectedTargetCoords: coords || null 
    });
  },

  selectWeapon: (weaponId) => {
    soundEngine.playUIClick();
    set({ selectedWeaponId: weaponId });
  },

  clearActionFeedback: () => set({ actionFeedback: null }),

  socket: null,
  connectCombatSocket: async (matchId: string) => {
    const existingSocket = get().socket;
    if (existingSocket) {
      existingSocket.close();
    }

    let targetMatchId = matchId;
    const { selectedScenario, playerFaction } = get();
    try {
      const res = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8000/api/matches/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: selectedScenario || 'SCENARIO_A',
          player_faction: playerFaction || 'PACIFIC_FLEET'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.match_id) {
          targetMatchId = data.match_id;
        }
      }
    } catch (e) {
      console.warn('Fallback to direct WS bootstrap:', e);
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || '127.0.0.1';
    const wsUrl = `${protocol}//${host}:8000/ws/combat/${targetMatchId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Combat WebSocket connected:', targetMatchId);
      set({ activeMatchId: targetMatchId, socket: ws });
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TACTICAL_TICK') {
          const newState: TacticalViewState = payload.state;

          // Check for incoming threats targeting friendly fleet
          const friendlyIds = new Set(newState.friendly_fleet.map((s: ShipState) => s.id));
          const currentThreats: ThreatAlert[] = [];

          newState.projectiles.forEach((p: InFlightProjectile) => {
            if (p.target_ship_id && friendlyIds.has(p.target_ship_id) && !p.intercepted && !p.resolved) {
              const remaining = Math.max(0, p.total_travel_time - p.elapsed_time);
              currentThreats.push({
                id: p.id,
                sourceShipId: p.attacker_ship_id,
                targetShipId: p.target_ship_id,
                threatType: p.weapon_type,
                estimatedSeconds: Math.round(remaining * 10) / 10,
                timestamp: Date.now()
              });
            }
          });

          if (currentThreats.length > 0) {
            soundEngine.startKlaxon();
          } else {
            soundEngine.stopKlaxon();
          }

          // Parse recent events for sound cues
          if (newState.recent_events && newState.recent_events.length > 0) {
            const latest = newState.recent_events[newState.recent_events.length - 1];
            if (latest.event_type === 'ATTACK_HIT' || latest.event_type === 'VESSEL_SUNK') {
              soundEngine.playExplosion();
            } else if (latest.event_type === 'ATTACK_INTERCEPTED') {
              soundEngine.playInterception();
            }
          }

          set((state) => {
            // Auto-select first friendly ship if none selected
            const currentSelected = state.selectedShipId && newState.friendly_fleet.some((s: ShipState) => s.id === state.selectedShipId)
              ? state.selectedShipId
              : newState.friendly_fleet[0]?.id || null;

            return {
              tacticalView: newState,
              incomingThreats: currentThreats,
              selectedShipId: currentSelected,
              selectedWeaponId: state.selectedWeaponId || newState.friendly_fleet.find((s: ShipState) => s.id === currentSelected)?.weapons[0]?.id || null
            };
          });
        } else if (payload.type === 'ACTION_FEEDBACK') {
          set({ actionFeedback: { success: payload.success, message: payload.message } });
          if (payload.success && payload.action === 'ATTACK') {
            soundEngine.playWeaponLaunch();
          }
        }
      } catch (e) {
        console.error('Error handling WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      console.log('Combat WebSocket disconnected');
      soundEngine.stopKlaxon();
      set({ socket: null });
    };

    set({ socket: ws });
  },

  disconnectCombatSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    soundEngine.stopKlaxon();
    set({ socket: null, activeMatchId: null });
  },

  fireSelectedWeapon: () => {
    const { socket, selectedShipId, selectedWeaponId, selectedTargetId, selectedTargetCoords, tacticalView } = get();
    if (!socket || !selectedShipId || !selectedWeaponId || !tacticalView) return;

    // Resolve target coordinates
    let targetPos = selectedTargetCoords;
    if (!targetPos && selectedTargetId) {
      const contact = tacticalView.sensor_contacts.find((c: SensorContact) => c.id === selectedTargetId);
      if (contact) {
        targetPos = contact.estimated_position;
      }
    }

    if (!targetPos) {
      set({ actionFeedback: { success: false, message: 'Select an active radar contact or coordinate target first.' } });
      return;
    }

    const payload = {
      type: 'ATTACK',
      attacker_id: selectedShipId,
      weapon_id: selectedWeaponId,
      target_pos: targetPos,
      target_ship_id: selectedTargetId ? selectedTargetId.replace('contact_', '') : null
    };

    socket.send(JSON.stringify(payload));
  },

  deployCountermeasure: (shipId, cmId) => {
    const { socket } = get();
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'COUNTERMEASURE',
      ship_id: shipId,
      cm_id: cmId
    }));
  },

  orderManeuver: (shipId, heading, speed) => {
    const { socket } = get();
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'MANEUVER',
      ship_id: shipId,
      heading,
      speed
    }));
  },

  orderRetreat: (shipId) => {
    const { socket } = get();
    if (!socket) return;
    soundEngine.playUIClick();
    socket.send(JSON.stringify({
      type: 'RETREAT',
      ship_id: shipId || null
    }));
  },

  orderRescue: (rescuerId, disabledId) => {
    const { socket } = get();
    if (!socket) return;
    soundEngine.playUIClick();
    socket.send(JSON.stringify({
      type: 'RESCUE',
      rescuer_id: rescuerId,
      target_disabled_id: disabledId
    }));
  },

  isMuted: false,
  toggleMute: () => {
    const next = !get().isMuted;
    soundEngine.setMute(next);
    set({ isMuted: next });
  },

  volume: 0.5,
  setVolume: (val) => {
    soundEngine.setVolume(val);
    set({ volume: val });
  },

  reducedMotion: false,
  setReducedMotion: (val) => set({ reducedMotion: val })
}));
