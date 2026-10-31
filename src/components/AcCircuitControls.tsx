import React from 'react';
import { Sliders, Zap, Sparkles } from 'lucide-react';
import { AcCircuitParams, WaveformMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AcCircuitControlsProps {
  params: AcCircuitParams;
  onChange: (updated: Partial<AcCircuitParams>) => void;
  cutoffFreq: number;
}

export const AcCircuitControls: React.FC<AcCircuitControlsProps> = ({
  params,
  onChange,
  cutoffFreq,
}) => {
  const { t, language } = useLanguage();
  const { waveformMode, modulationIndex, switchingFreq, filterInductance, filterCapacitance } = params;

  // Presets
  const applyPreset = (mode: 'square' | 'basic' | 'interstellar') => {
    if (mode === 'square') {
      onChange({
        waveformMode: 'square',
        modulationIndex: 1.0,
        switchingFreq: 2000,
        filterInductance: 0.2e-3,
        filterCapacitance: 1e-6,
      });
    } else if (mode === 'basic') {
      onChange({
        waveformMode: 'spwm',
        modulationIndex: 0.85,
        switchingFreq: 10000,
        filterInductance: 1.5e-3,
        filterCapacitance: 10e-6,
      });
    } else {
      onChange({
        waveformMode: 'spwm',
        modulationIndex: 0.95,
        switchingFreq: 25000,
        filterInductance: 5e-3,
        filterCapacitance: 25e-6,
      });
    }
  };

  const isCutoffOptimal = cutoffFreq > 600 && cutoffFreq < switchingFreq * 0.45;

  return (
    <div className="w-full bg-[#080e18] border border-cyan-900/40 rounded-xl p-4 shadow-xl flex flex-col justify-between gap-3">
      {/* 1. Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-cyan-900/30">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-cyan-50 uppercase tracking-wider">
            {language === 'zh' ? '電路調校 (Tuning)' : 'Tuning'}
          </h2>
        </div>

        {/* Quick Circuit Presets */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => applyPreset('square')}
            className="px-2 py-1 rounded bg-[#0f1827] hover:bg-cyan-900/30 border border-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
          >
            {language === 'zh' ? '方波' : 'Square'}
          </button>
          <button
            onClick={() => applyPreset('basic')}
            className="px-2 py-1 rounded bg-[#0f1827] hover:bg-cyan-900/30 border border-slate-700 text-cyan-300 font-semibold cursor-pointer transition-colors"
          >
            {language === 'zh' ? '初階 SPWM' : 'Basic SPWM'}
          </button>
          <button
            onClick={() => applyPreset('interstellar')}
            className="px-2 py-1 rounded bg-gradient-to-r from-cyan-900/70 to-emerald-900/70 hover:from-cyan-800/70 hover:to-emerald-800/70 border border-cyan-500/60 text-cyan-200 font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(34,211,238,0.2)]"
          >
            {language === 'zh' ? '星際正弦波' : 'Pure Sine'}
          </button>
        </div>
      </div>

      {/* 2. Waveform Modulation Mode Selection */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
          <span>{t('modulationMode')}</span>
          <span className="text-[10px] text-slate-400 font-mono">f₀ = 400 Hz</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['square', 'modified_sine', 'spwm'] as WaveformMode[]).map((mode) => {
            const isSelected = waveformMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onChange({ waveformMode: mode })}
                className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                    : 'bg-[#0f1726] border-cyan-900/40 text-slate-400 hover:text-cyan-300 hover:bg-cyan-900/20'
                }`}
              >
                {mode === 'square' && t('modeSquare')}
                {mode === 'modified_sine' && t('modeModified')}
                {mode === 'spwm' && t('modeSpwm')}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Parameter Sliders Grid (2 columns on medium screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Modulation Index m_a */}
        <div className="bg-[#0f1726]/80 p-2.5 rounded-lg border border-cyan-900/30 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold">{t('modIndexLabel')}</span>
            <span className="font-mono text-cyan-200 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/40 text-[11px]">
              m_a = {modulationIndex.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.25"
            step="0.01"
            value={modulationIndex}
            onChange={(e) => onChange({ modulationIndex: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.2</span>
            <span className="text-cyan-400">1.0 (Linear)</span>
            <span className="text-amber-400">1.25 (Overmod)</span>
          </div>
        </div>

        {/* Switching Frequency f_sw */}
        <div className="bg-[#0f1726]/80 p-2.5 rounded-lg border border-cyan-900/30 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold">{t('switchingFreqLabel')}</span>
            <span className="font-mono text-cyan-200 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/40 text-[11px]">
              {(switchingFreq / 1000).toFixed(1)} kHz
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="40000"
            step="500"
            value={switchingFreq}
            onChange={(e) => onChange({ switchingFreq: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>1 kHz</span>
            <span>20 kHz</span>
            <span>40 kHz</span>
          </div>
        </div>

        {/* Filter Inductor L */}
        <div className="bg-[#0f1726]/80 p-2.5 rounded-lg border border-cyan-900/30 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold">{t('filterInductorLabel')}</span>
            <span className="font-mono text-cyan-200 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/40 text-[11px]">
              L = {(filterInductance * 1000).toFixed(2)} mH
            </span>
          </div>
          <input
            type="range"
            min="0.0002"
            max="0.015"
            step="0.0001"
            value={filterInductance}
            onChange={(e) => onChange({ filterInductance: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>0.2 mH</span>
            <span>7.5 mH</span>
            <span>15 mH</span>
          </div>
        </div>

        {/* Filter Capacitor C */}
        <div className="bg-[#0f1726]/80 p-2.5 rounded-lg border border-cyan-900/30 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold">{t('filterCapacitorLabel')}</span>
            <span className="font-mono text-cyan-200 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/40 text-[11px]">
              C = {(filterCapacitance * 1e6).toFixed(1)} µF
            </span>
          </div>
          <input
            type="range"
            min="0.000001"
            max="0.00008"
            step="0.000001"
            value={filterCapacitance}
            onChange={(e) => onChange({ filterCapacitance: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
            <span>1 µF</span>
            <span>40 µF</span>
            <span>80 µF</span>
          </div>
        </div>
      </div>

      {/* 4. LC Cutoff Status Badge */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg border text-[11px] font-mono transition-all ${
          isCutoffOptimal
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>
            LC f_c: <b>{cutoffFreq.toLocaleString()} Hz</b>
          </span>
        </div>
        <div className="text-[10px] font-sans text-right">
          {isCutoffOptimal ? t('cutoffAdviceGood') : t('cutoffAdviceBad')}
        </div>
      </div>
    </div>
  );
};
