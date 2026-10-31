/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Rocket,
  BookOpen,
  Bot,
  Globe,
  Trophy,
  HelpCircle,
  X,
} from 'lucide-react';
import { AcCircuitParams } from './types';
import { calculateAcSimulation } from './utils/acThdPhysics';
import { SpaceshipFlightStage } from './components/SpaceshipFlightStage';
import { SineWavesPanel } from './components/SineWavesPanel';
import { AcCircuitControls } from './components/AcCircuitControls';
import { WaypointMissions } from './components/WaypointMissions';
import { FormulaGuide } from './components/FormulaGuide';
import { ValerieChatModal } from './components/ValerieChatModal';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language, toggleLanguage, t } = useLanguage();

  // Auxiliary overlays/modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isWaypointsModalOpen, setIsWaypointsModalOpen] = useState<boolean>(false);
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState<boolean>(false);

  // Best distance saved in local storage
  const [bestDistanceKm, setBestDistanceKm] = useState<number>(() => {
    const saved = localStorage.getItem('valerie_starship_best_dist');
    return saved ? parseInt(saved, 10) : 384_400; // Default: Lunar Outpost
  });

  // Circuit tuning parameters
  const [params, setParams] = useState<AcCircuitParams>({
    waveformMode: 'spwm',
    modulationIndex: 0.90,
    switchingFreq: 16000,
    filterInductance: 3.5e-3, // 3.5 mH
    filterCapacitance: 18e-6, // 18 µF
    fundamentalFreq: 400,     // 400 Hz standard aerospace AC
    dcBusVoltage: 300,        // 300 V
    fixedPowerCoreKw: 100,    // 100 kW fixed budget
  });

  // Real-time AC Simulation & Flight Distance Calculation
  const simResult = useMemo(() => {
    return calculateAcSimulation(params);
  }, [params]);

  // Handle parameter changes from Tuning panel
  const handleParamChange = (updated: Partial<AcCircuitParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  // Record new distance record
  const handleRecordNewDistance = (distKm: number) => {
    if (distKm > bestDistanceKm) {
      setBestDistanceKm(distKm);
      localStorage.setItem('valerie_starship_best_dist', distKm.toString());
    }
  };

  return (
    <div className="min-h-screen bg-[#040710] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#060b16]/95 backdrop-blur-md border-b border-cyan-900/40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-md">
        {/* Brand & Mascot Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-600 to-purple-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-sm sm:text-base text-cyan-50 tracking-wider">
                {t('appTitle')}
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded-full">
                {language === 'zh' ? '交流正弦波與 THD 實驗室' : 'AC Sine & THD Lab'}
              </span>
            </div>
            <p className="text-[11px] text-cyan-400 font-medium hidden sm:block">
              {t('appSubTitle')}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Waypoints, Theory, Ask Valerie, Language */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Waypoints Target Modal Button */}
          <button
            onClick={() => setIsWaypointsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0e1726] hover:bg-cyan-900/40 border border-cyan-900/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
            title={language === 'zh' ? '查看星際航行目標' : 'View Waypoint Missions'}
          >
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{language === 'zh' ? '航標目標' : 'Waypoints'}</span>
          </button>

          {/* Theory Guide Modal Button */}
          <button
            onClick={() => setIsTheoryModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0e1726] hover:bg-cyan-900/40 border border-cyan-900/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
            title={language === 'zh' ? '查看學理與公式' : 'View Theory & Formulas'}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{language === 'zh' ? '學理核心' : 'Theory'}</span>
          </button>

          {/* Ask Valerie AI */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1726] hover:bg-cyan-900/40 border border-cyan-600/40 text-cyan-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('askValerieBtn')}</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0e1726] hover:bg-cyan-900/40 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            title="Toggle Language (中文 / English)"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'zh' ? 'EN' : '繁中'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Exact arrangement requested by user
          - Left: Spaceship test fly
          - Right: Top = Sine waves, Bottom = Tuning
      */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-4 lg:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full items-stretch">
          {/* LEFT: Spaceship Test Fly (7 columns on desktop) */}
          <div className="lg:col-span-7 flex flex-col">
            <SpaceshipFlightStage
              params={params}
              simResult={simResult}
              bestDistanceKm={bestDistanceKm}
              onRecordNewDistance={handleRecordNewDistance}
              onOpenWaypointsModal={() => setIsWaypointsModalOpen(true)}
            />
          </div>

          {/* RIGHT: Stacked Vertically into 2 Panels (5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Top Right: Sine Waves */}
            <div className="flex-1">
              <SineWavesPanel params={params} simResult={simResult} />
            </div>

            {/* Bottom Right: Tuning */}
            <div className="flex-1">
              <AcCircuitControls
                params={params}
                onChange={handleParamChange}
                cutoffFreq={simResult.filterCutoffFreq}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Auxiliary Modal: Waypoint Missions */}
      {isWaypointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#080e18] border border-cyan-500/40 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-base sm:text-lg text-cyan-100">
                  {language === 'zh' ? '星際航行里程碑目標' : 'Celestial Flight Waypoints'}
                </h3>
              </div>
              <button
                onClick={() => setIsWaypointsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <WaypointMissions
              maxDistanceAchieved={bestDistanceKm}
              currentProjectedDistance={simResult.flightDistanceKm}
              currentThd={simResult.thdPercent}
              onLaunchFlight={() => setIsWaypointsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Auxiliary Modal: Theory & Formula Guide */}
      {isTheoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-[#080e18] border border-cyan-500/40 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-base sm:text-lg text-cyan-100">
                  {language === 'zh' ? '交流正弦波與 THD 學理核心' : 'AC Sine Wave & THD Theory'}
                </h3>
              </div>
              <button
                onClick={() => setIsTheoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <FormulaGuide />
          </div>
        </div>
      )}

      {/* Valerie AI Chat Assistant Modal */}
      <ValerieChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentParams={params}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-cyan-950/60 bg-[#03060c] px-4 py-2.5 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
        <span>
          {language === 'zh'
            ? '瓦莉莉的電力電子太空船工作坊 • 國立臺灣大學 Prof. Katherine A. Kim 實驗室啟發設計'
            : 'Valerie’s Power Electronics Starship Workshop • Inspired by NTU Prof. Katherine A. Kim Lab'}
        </span>
        <span className="text-cyan-800">•</span>
        <span className="text-cyan-400 font-mono text-[11px]">
          f₀ = 400Hz Aerospace AC • THD & Fixed Power Optimization
        </span>
      </footer>
    </div>
  );
}
