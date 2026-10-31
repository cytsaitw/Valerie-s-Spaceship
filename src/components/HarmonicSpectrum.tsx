import React from 'react';
import { BarChart3, Flame, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AcSimulationResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HarmonicSpectrumProps {
  simResult: AcSimulationResult;
}

export const HarmonicSpectrum: React.FC<HarmonicSpectrumProps> = ({ simResult }) => {
  const { t, language } = useLanguage();
  const { harmonics, thdPercent, usefulThrustPowerKw, harmonicLossPowerKw, isOvermodulated } = simResult;

  // Filter components to show: h1, h3, h5, h7, h9, and high-frequency carrier
  const displayHarmonics = harmonics.slice(0, 8);

  const getThdStatus = () => {
    if (thdPercent < 2) {
      return {
        badge: t('thdInterstellar'),
        color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/50',
        icon: Sparkles,
      };
    }
    if (thdPercent < 5) {
      return {
        badge: t('thdStandard'),
        color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/50',
        icon: CheckCircle2,
      };
    }
    if (thdPercent < 20) {
      return {
        badge: t('thdModerate'),
        color: 'text-amber-400 bg-amber-950/60 border-amber-500/50',
        icon: AlertTriangle,
      };
    }
    return {
      badge: t('thdSevere'),
      color: 'text-red-400 bg-red-950/60 border-red-500/50',
      icon: Flame,
    };
  };

  const status = getThdStatus();
  const StatusIcon = status.icon;

  return (
    <div className="w-full bg-[#0b121e] border border-cyan-900/40 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-900/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="font-black text-cyan-100 text-xs sm:text-sm uppercase tracking-wider">
            {t('spectrumTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t('thdStatusLabel')}</span>
          <span className="text-sm font-black font-mono text-cyan-300 bg-[#131b2a] px-2 py-0.5 rounded border border-cyan-700/50">
            {thdPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* THD Quality Rating Banner */}
      <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${status.color}`}>
        <StatusIcon className="w-4 h-4 shrink-0" />
        <span>{status.badge}</span>
      </div>

      {isOvermodulated && (
        <div className="text-[11px] text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded p-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t('overmodulatedNotice')}</span>
        </div>
      )}

      {/* Harmonics Bar Graph */}
      <div className="pt-2">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-36 bg-[#040810] p-3 rounded-lg border border-cyan-950 relative">
          {displayHarmonics.map((h) => {
            const isFund = h.order === 1;
            // Height calculation relative to fundamental (capped at 100%)
            const heightPercent = isFund ? 100 : Math.min(100, Math.max(4, h.percentageOfFund * 1.5));
            const barColor = isFund
              ? 'bg-gradient-to-t from-cyan-600 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
              : h.percentageOfFund > 15
              ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-[0_0_6px_rgba(248,113,113,0.3)]'
              : h.percentageOfFund > 5
              ? 'bg-gradient-to-t from-amber-600 to-amber-400'
              : 'bg-gradient-to-t from-cyan-800 to-cyan-500';

            return (
              <div key={h.order + h.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* Bar Value Tooltip on hover */}
                <div className="text-[10px] font-mono text-cyan-300 opacity-80 group-hover:opacity-100 transition-opacity mb-1">
                  {isFund ? '100%' : `${h.percentageOfFund.toFixed(1)}%`}
                </div>
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${barColor}`}
                />
                {/* Label */}
                <div className="mt-1.5 text-[10px] font-mono text-slate-400 group-hover:text-cyan-300 text-center truncate w-full">
                  {h.label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
          <span>{language === 'zh' ? '← 基頻有效推進 (h1)' : '← Fundamental Thrust (h1)'}</span>
          <span>{language === 'zh' ? '高頻諧波與載波 (損失廢熱) →' : 'High Frequency Waste Harmonics →'}</span>
        </div>
      </div>

      {/* Energy Breakdown Mini Bar */}
      <div className="bg-[#131b2a] border border-cyan-900/40 rounded-lg p-2.5 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-emerald-400">
            {language === 'zh' ? '有用推力功率:' : 'Useful Thrust:'} {usefulThrustPowerKw.toFixed(1)} kW ({simResult.thrustEfficiency}%)
          </span>
          <span className="text-red-400">
            {language === 'zh' ? '諧波發熱損耗:' : 'Harmonic Heat:'} {harmonicLossPowerKw.toFixed(1)} kW
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${simResult.thrustEfficiency}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
          />
          <div
            style={{ width: `${100 - simResult.thrustEfficiency}%` }}
            className="h-full bg-red-500 transition-all duration-300"
          />
        </div>
      </div>
    </div>
  );
};
