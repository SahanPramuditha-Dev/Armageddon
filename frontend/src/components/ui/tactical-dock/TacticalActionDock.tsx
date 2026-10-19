import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SimulatorVessel } from '@/components/ui/SimulationModal';
import { TacticalPolarRadar } from '@/components/ui/TacticalPolarRadar';
import { VesselTelemetryHeader } from './VesselTelemetryHeader';
import { SentinelControls } from './SentinelControls';
import { CarrierControls } from './CarrierControls';
import { SubmarineControls } from './SubmarineControls';
import { HarbingerControls } from './HarbingerControls';

interface TacticalActionDockProps {
  activeSimulation: SimulatorVessel;
  telemetry: {
    knots: number;
    sea: string;
    camera: string;
    time: string;
    beams: boolean;
    heloMode: string;
  };
  setTelemetry: React.Dispatch<React.SetStateAction<{
    knots: number;
    sea: string;
    camera: string;
    time: string;
    beams: boolean;
    heloMode: string;
  }>>;
  subDepth: number;
  setSubDepth: React.Dispatch<React.SetStateAction<number>>;
  carrierCamMode: number;
  setCarrierCamMode: React.Dispatch<React.SetStateAction<number>>;
  harbingerCam: string;
  setHarbingerCam: React.Dispatch<React.SetStateAction<string>>;
  isRadarVisible: boolean;
  onToggleRadar: () => void;
  sendSimMessage: (msg: Record<string, unknown>) => void;
  isCinematicMode: boolean;
}

export const TacticalActionDock: React.FC<TacticalActionDockProps> = ({
  activeSimulation,
  telemetry,
  setTelemetry,
  subDepth,
  setSubDepth,
  carrierCamMode,
  setCarrierCamMode,
  harbingerCam,
  setHarbingerCam,
  isRadarVisible,
  onToggleRadar,
  sendSimMessage,
  isCinematicMode,
}) => {
  return (
    <AnimatePresence>
      {!isCinematicMode && (
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 25 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-6 right-6 z-20 flex items-end gap-3.5 select-none"
        >
          {/* Tactical Polar Sonar / Radar Display (Toggleable) */}
          <AnimatePresence>
            {isRadarVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 15 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 15 }}
                transition={{ duration: 0.25 }}
              >
                <TacticalPolarRadar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Master Glass Console Container */}
          <div className="w-[520px] max-w-[calc(100vw-32px)] p-4 rounded-3xl border border-white/[0.14] border-t-white/[0.24] shadow-[0_25px_65px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(10,132,255,0.06),inset_0_1px_1px_rgba(255,255,255,0.22),inset_0_0_24px_rgba(0,0,0,0.4)] flex flex-col gap-3 backdrop-blur-3xl bg-gradient-to-b from-[#0c1626]/90 via-[#070e1b]/95 to-[#040810]/98">
            {/* Dynamic Telemetry HUD Header */}
            <VesselTelemetryHeader
              vessel={activeSimulation}
              telemetry={telemetry}
              subDepth={subDepth}
              carrierCamMode={carrierCamMode}
              harbingerCam={harbingerCam}
              isRadarVisible={isRadarVisible}
              onToggleRadar={onToggleRadar}
            />

            {/* Vessel Subsystem Controller Component */}
            {activeSimulation === 'SENTINEL' && (
              <SentinelControls
                telemetry={telemetry}
                sendSimMessage={sendSimMessage}
                setTelemetry={setTelemetry}
              />
            )}

            {activeSimulation === 'CARRIER' && (
              <CarrierControls
                carrierCamMode={carrierCamMode}
                setCarrierCamMode={setCarrierCamMode}
                telemetry={telemetry}
                setTelemetry={setTelemetry}
                sendSimMessage={sendSimMessage}
              />
            )}

            {activeSimulation === 'SUBMARINE' && (
              <SubmarineControls
                subDepth={subDepth}
                setSubDepth={setSubDepth}
                sendSimMessage={sendSimMessage}
              />
            )}

            {activeSimulation === 'HARBINGER' && (
              <HarbingerControls
                harbingerCam={harbingerCam}
                setHarbingerCam={setHarbingerCam}
                sendSimMessage={sendSimMessage}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
