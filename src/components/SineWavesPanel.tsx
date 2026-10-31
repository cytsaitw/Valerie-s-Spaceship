import React, { useRef, useEffect, useState } from 'react';
import { Activity, BarChart2, Pause, Play, ZoomIn, ZoomOut, Sparkles, CheckCircle2, AlertTriangle, Flame } from 'lucide-react';
import { AcCircuitParams, AcSimulationResult } from '../types';
import { generateAcWaveforms } from '../utils/acThdPhysics';
import { useLanguage } from '../context/LanguageContext';

interface SineWavesPanelProps {
  params: AcCircuitParams;
  simResult: AcSimulationResult;
}

export const SineWavesPanel: React.FC<SineWavesPanelProps> = ({ params, simResult }) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sub-view mode: 'scope' (Time domain wave) vs 'spectrum' (Frequency domain harmonics)
  const [viewMode, setViewMode] = useState<'scope' | 'spectrum'>('scope');

  // Scope controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeZoom, setTimeZoom] = useState<number>(1.0);
  const [showRef, setShowRef] = useState<boolean>(true);
  const [showActual, setShowActual] = useState<boolean>(true);
  const [showPwm, setShowPwm] = useState<boolean>(false);

  // Oscilloscope canvas rendering
  useEffect(() => {
    if (viewMode !== 'scope') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Dark Phosphor Oscilloscope Screen background
    ctx.fillStyle = '#040810';
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope Grid Lines (10x8 divisions)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    const gridX = 10;
    const gridY = 8;
    for (let i = 0; i <= gridX; i++) {
      const x = (width / gridX) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let j = 0; j <= gridY; j++) {
      const y = (height / gridY) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Crosshairs
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Generate high-resolution waveform data
    const numCycles = 2 / timeZoom;
    const points = generateAcWaveforms(params, simResult, numCycles);
    if (points.length === 0) return;

    const centerY = height / 2;
    const maxVoltageScale = Math.max(350, params.dcBusVoltage * 1.3);
    const voltageToY = (v: number) => centerY - (v / maxVoltageScale) * (height * 0.42);

    // 1. Raw PWM pulses
    if (showPwm) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      points.forEach((pt, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = voltageToY(pt.vPwm);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // 2. Reference Pure Sine Wave (Dashed Green/Cyan)
    if (showRef) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      points.forEach((pt, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = voltageToY(pt.vRef);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Actual Filtered AC Output Voltage (Solid Glowing Wave)
    if (showActual) {
      const isClean = simResult.thdPercent < 5;
      const waveColor = isClean ? '#22D3EE' : simResult.thdPercent < 15 ? '#FBBF24' : '#F87171';

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = waveColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      points.forEach((pt, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const y = voltageToY(pt.vActual);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [params, simResult, isPlaying, timeZoom, showRef, showActual, showPwm, viewMode]);

  // THD Quality badge
  const getThdStatus = () => {
    if (simResult.thdPercent < 2.5) {
      return {
        label: language === 'zh' ? '極致正弦波' : 'Pure Sine (< 2.5%)',
        color: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/50',
        icon: Sparkles,
      };
    }
    if (simResult.thdPercent < 5.0) {
      return {
        label: language === 'zh' ? '優良 IEEE 519' : 'Good (< 5%)',
        color: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/50',
        icon: CheckCircle2,
      };
    }
    if (simResult.thdPercent < 15.0) {
      return {
        label: language === 'zh' ? '中度失真' : 'Moderate',
        color: 'text-amber-300 bg-amber-950/70 border-amber-500/50',
        icon: AlertTriangle,
      };
    }
    return {
      label: language === 'zh' ? '嚴重失真發熱' : 'Severe THD',
      color: 'text-red-300 bg-red-950/70 border-red-500/50',
      icon: Flame,
    };
  };

  const status = getThdStatus();
  const StatusIcon = status.icon;

  return (
    <div className="w-full bg-[#080e18] border border-cyan-900/40 rounded-xl p-4 shadow-xl flex flex-col justify-between gap-3">
      {/* 1. Header with Mode Toggle & THD Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-cyan-900/30">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-cyan-50 uppercase tracking-wider">
            {language === 'zh' ? '交流正弦波觀測' : 'Sine Waves'}
          </h2>
        </div>

        {/* View Switcher: Scope vs Spectrum */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-[#0e1726] p-0.5 border border-cyan-900/40 text-[11px] font-semibold">
            <button
              onClick={() => setViewMode('scope')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'scope'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'zh' ? '正弦波形' : 'Waveform'}
            </button>
            <button
              onClick={() => setViewMode('spectrum')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'spectrum'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'zh' ? '諧波頻譜' : 'Harmonics'}
            </button>
          </div>

          {/* THD Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>THD {simResult.thdPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. Main Screen Area: Time-Domain Scope OR Frequency-Domain FFT */}
      {viewMode === 'scope' ? (
        <div className="flex flex-col gap-2">
          {/* Scope Canvas Screen */}
          <div className="relative w-full aspect-[2.3/1] min-h-[175px] rounded-lg overflow-hidden border border-cyan-500/30 shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* In-screen Telemetry Overlay */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[10px] font-mono pointer-events-none">
              <span className="bg-slate-950/85 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded shadow">
                f₀ = {params.fundamentalFreq} Hz
              </span>
              <span className="bg-slate-950/85 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded shadow">
                V_rms = {simResult.vOutRms.toFixed(1)} V
              </span>
            </div>

            {/* Scope zoom buttons */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-slate-950/90 border border-cyan-900/60 p-0.5 rounded shadow">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 rounded text-cyan-300 hover:bg-cyan-900/40 cursor-pointer"
                title={isPlaying ? 'Freeze' : 'Run'}
              >
                {isPlaying ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-amber-400" />}
              </button>
              <button
                onClick={() => setTimeZoom((z) => Math.min(3, z * 1.5))}
                className="p-1 rounded text-cyan-300 hover:bg-cyan-900/40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => setTimeZoom((z) => Math.max(0.4, z / 1.5))}
                className="p-1 rounded text-cyan-300 hover:bg-cyan-900/40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Trace Selectors & Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-0.5">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer text-emerald-400 select-none">
                <input
                  type="checkbox"
                  checked={showRef}
                  onChange={(e) => setShowRef(e.target.checked)}
                  className="accent-emerald-500 rounded scale-90"
                />
                <span className="border-b border-dashed border-emerald-400 pb-0.5">{t('legendRefSine')}</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-cyan-300 select-none font-semibold">
                <input
                  type="checkbox"
                  checked={showActual}
                  onChange={(e) => setShowActual(e.target.checked)}
                  className="accent-cyan-500 rounded scale-90"
                />
                <span className="border-b border-cyan-400 pb-0.5">{t('legendActualWave')}</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-purple-400 select-none">
                <input
                  type="checkbox"
                  checked={showPwm}
                  onChange={(e) => setShowPwm(e.target.checked)}
                  className="accent-purple-500 rounded scale-90"
                />
                <span>{t('legendPwmSignal')}</span>
              </label>
            </div>

            <div className="text-[10px] text-slate-400 font-mono">
              LC f_c: {simResult.filterCutoffFreq.toLocaleString()} Hz
            </div>
          </div>
        </div>
      ) : (
        /* Harmonics Spectrum Bar Chart */
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-1.5 h-44 bg-[#040810] p-3 rounded-lg border border-cyan-950 relative">
            {simResult.harmonics.slice(0, 8).map((h) => {
              const isFund = h.order === 1;
              const heightPercent = isFund ? 100 : Math.min(100, Math.max(5, h.percentageOfFund * 1.5));
              const barColor = isFund
                ? 'bg-gradient-to-t from-cyan-600 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                : h.percentageOfFund > 15
                ? 'bg-gradient-to-t from-red-600 to-red-400'
                : h.percentageOfFund > 5
                ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                : 'bg-gradient-to-t from-cyan-800 to-cyan-500';

              return (
                <div key={h.order + h.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="text-[9px] font-mono text-cyan-300 opacity-80 mb-1">
                    {isFund ? '100%' : `${h.percentageOfFund.toFixed(1)}%`}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[26px] rounded-t transition-all duration-300 ${barColor}`}
                  />
                  <div className="mt-1 text-[9px] font-mono text-slate-400 text-center truncate w-full">
                    {h.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
            <span>{language === 'zh' ? 'h1: 基頻有用推力' : 'h1: Useful Thrust'}</span>
            <span>{language === 'zh' ? 'h3, h5, f_sw: 諧波廢熱' : 'Harmonics: Heat Loss'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
