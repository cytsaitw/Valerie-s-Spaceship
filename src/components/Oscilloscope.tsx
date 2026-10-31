import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, Activity } from 'lucide-react';
import { AcCircuitParams, AcSimulationResult } from '../types';
import { generateAcWaveforms } from '../utils/acThdPhysics';
import { useLanguage } from '../context/LanguageContext';

interface OscilloscopeProps {
  params: AcCircuitParams;
  simResult: AcSimulationResult;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ params, simResult }) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeZoom, setTimeZoom] = useState<number>(1.0);
  const [showRef, setShowRef] = useState<boolean>(true);
  const [showActual, setShowActual] = useState<boolean>(true);
  const [showPwm, setShowPwm] = useState<boolean>(false);

  useEffect(() => {
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

    // 1. Raw PWM pulses (Optional background signal)
    if (showPwm) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1.5;
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
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
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
      ctx.setLineDash([]); // reset
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
      ctx.shadowBlur = 0; // reset
    }
  }, [params, simResult, isPlaying, timeZoom, showRef, showActual, showPwm]);

  return (
    <div className="w-full bg-[#0b121e] border border-cyan-900/40 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      {/* Scope Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-900/30">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="font-black text-cyan-100 text-xs sm:text-sm uppercase tracking-wider">
            {t('scopeTitle')}
          </h3>
        </div>

        {/* Scope Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-cyan-950/60 border-cyan-600/50 text-cyan-300'
                : 'bg-amber-950/60 border-amber-600/50 text-amber-300'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-amber-400" />}
            <span>{isPlaying ? (language === 'zh' ? '凍結' : 'Freeze') : (language === 'zh' ? '運作' : 'Run')}</span>
          </button>
          <button
            onClick={() => setTimeZoom((z) => Math.min(3, z * 1.5))}
            className="p-1 rounded bg-[#131b2a] border border-cyan-900/40 text-cyan-300 hover:bg-cyan-900/30 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTimeZoom((z) => Math.max(0.35, z / 1.5))}
            className="p-1 rounded bg-[#131b2a] border border-cyan-900/40 text-cyan-300 hover:bg-cyan-900/30 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Area */}
      <div className="relative w-full aspect-[2.2/1] min-h-[190px] rounded-lg overflow-hidden border border-cyan-500/20 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* On-screen telemetry HUD */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 text-[11px] font-mono pointer-events-none">
          <span className="bg-slate-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded shadow">
            f₀ = {params.fundamentalFreq} Hz
          </span>
          <span className="bg-slate-950/80 border border-cyan-500/40 text-cyan-300 px-2 py-0.5 rounded shadow">
            V_rms = {simResult.vOutRms.toFixed(1)} V
          </span>
          <span
            className={`px-2 py-0.5 rounded border shadow font-bold ${
              simResult.thdPercent < 5
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : simResult.thdPercent < 15
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            THD: {simResult.thdPercent}%
          </span>
        </div>

        {/* Timebase Badge */}
        <div className="absolute bottom-2 right-2 bg-slate-950/90 border border-slate-700 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none">
          TB: {((1 / params.fundamentalFreq / timeZoom) * 1000).toFixed(2)} ms/div
        </div>
      </div>

      {/* Waveform Trace Selectors & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 select-none">
            <input
              type="checkbox"
              checked={showRef}
              onChange={(e) => setShowRef(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <span className="border-b border-dashed border-emerald-400 pb-0.5">{t('legendRefSine')}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-cyan-300 select-none font-semibold">
            <input
              type="checkbox"
              checked={showActual}
              onChange={(e) => setShowActual(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="border-b border-cyan-400 pb-0.5">{t('legendActualWave')}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-purple-400 select-none">
            <input
              type="checkbox"
              checked={showPwm}
              onChange={(e) => setShowPwm(e.target.checked)}
              className="accent-purple-500 rounded"
            />
            <span>{t('legendPwmSignal')}</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          LC f_c = {simResult.filterCutoffFreq.toLocaleString()} Hz
        </div>
      </div>
    </div>
  );
};
