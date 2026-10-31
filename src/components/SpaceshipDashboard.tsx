import React from 'react';
import { Rocket, Zap, Gauge, Flame, Sparkles } from 'lucide-react';
import { AcSimulationResult, AcCircuitParams } from '../types';
import { ValerieMascot } from './ValerieMascot';
import { formatDistance } from '../utils/acThdPhysics';
import { useLanguage } from '../context/LanguageContext';

interface SpaceshipDashboardProps {
  params: AcCircuitParams;
  simResult: AcSimulationResult;
  onLaunchFlight: () => void;
  bestDistanceKm: number;
}

export const SpaceshipDashboard: React.FC<SpaceshipDashboardProps> = ({
  params,
  simResult,
  onLaunchFlight,
  bestDistanceKm,
}) => {
  const { t, language } = useLanguage();
  const { usefulThrustPowerKw, harmonicLossPowerKw, thdPercent, thrusterTempC, flightDistanceKm } = simResult;

  const isCoilOverheating = thrusterTempC > 120;
  const isOptimal = thdPercent < 3.0;

  return (
    <div className="w-full bg-[#0b121e] border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Top Bar with Launch CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-900/30">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-cyan-400" />
          <h3 className="font-black text-cyan-50 text-xs sm:text-sm uppercase tracking-wider">
            {language === 'zh'
              ? '定額能量動力遙測 (Fixed Power Telemetry)'
              : 'Fixed-Power Propulsion Telemetry'}
          </h3>
        </div>

        {/* Big Launch Flight CTA Button */}
        <button
          onClick={onLaunchFlight}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_18px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Rocket className="w-4 h-4 animate-bounce" />
          <span>{t('launchFlightBtn')}</span>
        </button>
      </div>

      {/* Main Telemetry 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Fixed Power Core */}
        <div className="bg-[#131b2a] border border-cyan-900/40 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('fixedPowerLabel')}</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black font-mono text-cyan-300">
            {params.fixedPowerCoreKw} kW
          </div>
          <div className="text-[10px] text-slate-400">
            {language === 'zh' ? '總可用定額電力' : 'Fixed Total Energy'}
          </div>
        </div>

        {/* 2. Useful Thrust Power */}
        <div className="bg-[#131b2a] border border-emerald-900/40 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('usefulThrustLabel')}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg sm:text-xl font-black font-mono text-emerald-300">
            {usefulThrustPowerKw.toFixed(1)} kW
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">
            {simResult.thrustEfficiency}% {language === 'zh' ? '推進轉換率' : 'Thrust Eff'}
          </div>
        </div>

        {/* 3. Harmonic Loss & Coil Temp */}
        <div
          className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${
            isCoilOverheating
              ? 'bg-red-950/40 border-red-500/50'
              : 'bg-[#131b2a] border-cyan-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('harmonicLossLabel')}</span>
            <Flame className={`w-3.5 h-3.5 ${isCoilOverheating ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          </div>
          <div className={`mt-2 text-lg sm:text-xl font-black font-mono ${isCoilOverheating ? 'text-red-400' : 'text-amber-300'}`}>
            {harmonicLossPowerKw.toFixed(1)} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {language === 'zh' ? '線圈溫度:' : 'Coil Temp:'} {thrusterTempC}°C {isCoilOverheating ? '⚠️' : ''}
          </div>
        </div>

        {/* 4. Projected Max Range */}
        <div className="bg-[#131b2a] border border-cyan-500/30 p-3 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t('projectedDistanceLabel')}</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 text-sm sm:text-base font-black font-mono text-cyan-100">
            {formatDistance(flightDistanceKm, language)}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {language === 'zh' ? '最佳航程:' : 'Best:'} {formatDistance(bestDistanceKm, language)}
          </div>
        </div>
      </div>

      {/* Pilot Valerie Status Strip */}
      <div className="flex items-center gap-3 bg-[#0a111b] border border-cyan-900/40 rounded-lg p-3">
        <ValerieMascot
          expression={isOptimal ? 'proud' : isCoilOverheating ? 'surprised' : 'happy'}
          size="sm"
          showHelmet={true}
        />
        <div className="flex-1 text-xs">
          <div className="font-bold text-cyan-300">
            {language === 'zh' ? '瓦莉莉領航員觀察 (Pilot Log):' : 'Pilot Valerie Telemetry Note:'}
          </div>
          <div className="text-slate-300 mt-0.5 leading-relaxed">
            {isOptimal &&
              (language === 'zh'
                ? '交流正弦波非常乾淨！幾乎所有 100 kW 電力都化作有效推進力，準備啟動深空試飛！'
                : 'Pristine AC sine wave! Almost all 100 kW power goes straight into thrust!')}
            {!isOptimal && !isCoilOverheating &&
              (language === 'zh'
                ? '諧波失真尚可，但若加大電感 L 或開關頻率 f_sw，THD 能壓得更低，飛得更遠！'
                : 'Harmonics are moderate. Increasing L or switching freq f_sw will reduce THD and boost range!')}
            {isCoilOverheating &&
              (language === 'zh'
                ? '危險！諧波發熱過劇，請切換至 SPWM 或增加濾波電感與電容，避免耗光定額電力！'
                : 'Alert! Severe harmonic loss! Switch to SPWM or increase LC filter to stop wasting power!')}
          </div>
        </div>
      </div>
    </div>
  );
};
