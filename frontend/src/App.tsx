import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTacticalStore } from '@/store/tacticalStore';
import { MainMenuScreen } from '@/components/screens/MainMenuScreen';
import { HarborScreen } from '@/components/screens/HarborScreen';
import { MissionBriefingScreen } from '@/components/screens/MissionBriefingScreen';
import { LiveCombatScreen } from '@/components/screens/LiveCombatScreen';
import { IntelligenceScreen } from '@/components/screens/IntelligenceScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';

export const App: React.FC = () => {
  const { currentScreen, reducedMotion } = useTacticalStore();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'MAIN_MENU':
        return <MainMenuScreen key="main_menu" />;
      case 'HARBOR_DRYDOCK':
        return <HarborScreen key="harbor_drydock" />;
      case 'MISSION_BRIEFING':
        return <MissionBriefingScreen key="mission_briefing" />;
      case 'LIVE_COMBAT':
        return <LiveCombatScreen key="live_combat" />;
      case 'INTELLIGENCE':
        return <IntelligenceScreen key="intelligence" />;
      case 'SETTINGS':
        return <SettingsScreen key="settings" />;
      default:
        return <MainMenuScreen key="main_menu_fallback" />;
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#05080F] text-slate-100 font-sans antialiased overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="w-full h-full"
        >
          {renderActiveScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default App;
