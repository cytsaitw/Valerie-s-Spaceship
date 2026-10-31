import React, { useRef, useEffect, useState } from 'react';
import { Rocket, Gauge, Zap, Flame, Sparkles, CheckCircle2, Trophy, RotateCcw, AlertTriangle } from 'lucide-react';
import { AcCircuitParams, AcSimulationResult, CelestialWaypoint } from '../types';
import { CELESTIAL_WAYPOINTS } from '../data/waypoints';
import { formatDistance } from '../utils/acThdPhysics';
import { ValerieMascot } from './ValerieMascot';
import { useLanguage } from '../context/LanguageContext';

interface SpaceshipFlightStageProps {
  params: AcCircuitParams;
  simResult: AcSimulationResult;
  bestDistanceKm: number;
  onRecordNewDistance: (distance: number, waypointId: string) => void;
  onOpenWaypointsModal?: () => void;
}

export const SpaceshipFlightStage: React.FC<SpaceshipFlightStageProps> = ({
  params,
  simResult,
  bestDistanceKm,
  onRecordNewDistance,
  onOpenWaypointsModal,
}) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Flight simulation states
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [currentDistKm, setCurrentDistKm] = useState<number>(0);
  const [energyRemainingPercent, setEnergyRemainingPercent] = useState<number>(100);
  const [lastFlightSummary, setLastFlightSummary] = useState<{
    distanceKm: number;
    highestWaypoint: CelestialWaypoint;
    thd: number;
    efficiency: number;
  } | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState<CelestialWaypoint | null>(null);

  const targetDistKm = simResult.flightDistanceKm;
  const isOptimal = simResult.thdPercent < 3.0;
  const isOverheating = simResult.thrusterTempC > 120;

  // Handle Launch Test Flight
  const handleLaunchFlight = () => {
    if (isFlying) return;
    setIsFlying(true);
    setCurrentDistKm(0);
    setEnergyRemainingPercent(100);
    setLastFlightSummary(null);
    setActiveAnnouncement(null);

    const startTime = performance.now();
    const flightDurationMs = 3600; // 3.6s flight

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / flightDurationMs);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 2.5);
      const dist = Math.round(easeOut * targetDistKm);
      setCurrentDistKm(dist);
      setEnergyRemainingPercent(Math.max(0, Math.round((1 - progress) * 100)));

      // Check waypoints hit
      for (const wp of CELESTIAL_WAYPOINTS) {
        if (dist >= wp.distanceKm && (!activeAnnouncement || activeAnnouncement.id !== wp.id)) {
          setActiveAnnouncement(wp);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsFlying(false);
        const highestWp =
          CELESTIAL_WAYPOINTS.slice().reverse().find((w) => targetDistKm >= w.distanceKm) ||
          CELESTIAL_WAYPOINTS[0];

        setLastFlightSummary({
          distanceKm: targetDistKm,
          highestWaypoint: highestWp,
          thd: simResult.thdPercent,
          efficiency: simResult.thrustEfficiency,
        });

        onRecordNewDistance(targetDistKm, highestWp.id);
      }
    };

    requestAnimationFrame(step);
  };

  // Cosmic flight canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Dynamic Starfield
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.8 + Math.random() * 3.5,
      radius: 0.8 + Math.random() * 2,
      brightness: 0.4 + Math.random() * 0.6,
    }));

    let animId: number;
    let shakeOffset = { x: 0, y: 0 };

    const render = () => {
      // Cosmic Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#040711');
      bgGrad.addColorStop(0.6, '#060b18');
      bgGrad.addColorStop(1, '#020409');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Nebula Glow
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.7,
        height * 0.4,
        20,
        width * 0.7,
        height * 0.4,
        width * 0.5
      );
      nebulaGrad.addColorStop(0, 'rgba(88, 28, 135, 0.12)');
      nebulaGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.06)');
      nebulaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Move and render stars
      const starSpeedMultiplier = isFlying ? 3.5 : 0.8;
      stars.forEach((star) => {
        star.x -= star.speed * starSpeedMultiplier;
        if (star.x < 0) {
          star.x = width;
          star.y = Math.random() * height;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Space grid perspective (subtle)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Spaceship vibration if THD is severe
      if (simResult.thdPercent > 20) {
        shakeOffset = {
          x: (Math.random() - 0.5) * (isFlying ? 7 : 3),
          y: (Math.random() - 0.5) * (isFlying ? 7 : 3),
        };
      } else {
        shakeOffset = { x: 0, y: Math.sin(Date.now() / 600) * 3 };
      }

      const shipX = width * 0.32 + shakeOffset.x;
      const shipY = height * 0.48 + shakeOffset.y;

      // 1. Dynamic Plasma Thruster Flame (Directly driven by THD)
      ctx.save();
      const isPureSine = simResult.thdPercent < 2.5;
      const isSevere = simResult.thdPercent > 20;
      const flameLength = isFlying
        ? (isSevere ? 45 + Math.random() * 30 : 90 + Math.random() * 25)
        : (isSevere ? 25 + Math.random() * 15 : 45 + Math.random() * 10);

      // Radial Plasma Glow
      const flameGrad = ctx.createRadialGradient(
        shipX - 12,
        shipY,
        4,
        shipX - flameLength,
        shipY,
        flameLength
      );

      if (isPureSine) {
        // Interstellar Cyan Laser Beam
        flameGrad.addColorStop(0, '#FFFFFF');
        flameGrad.addColorStop(0.3, '#22D3EE');
        flameGrad.addColorStop(0.7, '#0284C7');
        flameGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      } else if (isSevere) {
        // Coughing, sputtering orange/red flame
        flameGrad.addColorStop(0, '#F59E0B');
        flameGrad.addColorStop(0.4, '#EF4444');
        flameGrad.addColorStop(0.8, '#991B1B');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        // Standard blue thrust
        flameGrad.addColorStop(0, '#E0F2FE');
        flameGrad.addColorStop(0.4, '#38BDF8');
        flameGrad.addColorStop(0.8, '#1D4ED8');
        flameGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      }

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(shipX - 8, shipY - 14);
      ctx.lineTo(
        shipX - flameLength,
        shipY + (isSevere ? (Math.random() - 0.5) * 16 : 0)
      );
      ctx.lineTo(shipX - 8, shipY + 14);
      ctx.closePath();
      ctx.fill();

      // Spark particles for high THD (wasted heat loss)
      if (isSevere) {
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? '#F59E0B' : '#EF4444';
          ctx.beginPath();
          ctx.arc(
            shipX - 15 - Math.random() * flameLength,
            shipY + (Math.random() - 0.5) * 26,
            1.5 + Math.random() * 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // 2. Spaceship Hull
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = isPureSine ? '#38BDF8' : isSevere ? '#EF4444' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipX + 55, shipY);
      ctx.lineTo(shipX - 12, shipY - 20);
      ctx.lineTo(shipX - 4, shipY - 8);
      ctx.lineTo(shipX - 8, shipY);
      ctx.lineTo(shipX - 4, shipY + 8);
      ctx.lineTo(shipX - 12, shipY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Spaceship Wing details
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(shipX + 20, shipY - 6);
      ctx.lineTo(shipX - 10, shipY - 18);
      ctx.lineTo(shipX - 6, shipY - 6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(shipX + 20, shipY + 6);
      ctx.lineTo(shipX - 10, shipY + 18);
      ctx.lineTo(shipX - 6, shipY + 6);
      ctx.closePath();
      ctx.fill();

      // Cockpit Window (Glowing)
      ctx.fillStyle = isPureSine ? '#67E8F9' : '#06B6D4';
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(shipX + 24, shipY, 8, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pilot Valerie Mini Silhouette in cockpit
      ctx.fillStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(shipX + 24, shipY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isFlying, simResult.thdPercent]);

  // Current projected highest waypoint
  const currentProjectedWaypoint =
    CELESTIAL_WAYPOINTS.slice().reverse().find((w) => targetDistKm >= w.distanceKm) ||
    CELESTIAL_WAYPOINTS[0];

  return (
    <div className="w-full h-full bg-[#080e18] border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col justify-between gap-4">
      {/* 1. Header & Quick Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-900/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-cyan-50 uppercase tracking-wider">
              {language === 'zh' ? '太空船試飛遙測台' : 'Spaceship Test Fly'}
            </h2>
            <div className="text-[11px] text-slate-400">
              {language === 'zh'
                ? '定額 100 kW 電力核心 • 降低 THD 提升星際航程'
                : '100 kW Fixed Core • Minimize THD to Maximize Range'}
            </div>
          </div>
        </div>

        {/* Action Button: Launch Test Flight */}
        <button
          onClick={handleLaunchFlight}
          disabled={isFlying}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2 cursor-pointer shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Rocket className={`w-4 h-4 ${isFlying ? 'animate-spin' : 'animate-bounce'}`} />
          <span>
            {isFlying
              ? (language === 'zh' ? '飛行推進中...' : 'Flying...')
              : t('launchFlightBtn')}
          </span>
        </button>
      </div>

      {/* 2. Telemetry Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Core Power */}
        <div className="bg-[#0f1726] border border-cyan-900/40 p-2.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{t('fixedPowerLabel')}</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black font-mono text-cyan-300">
            {params.fixedPowerCoreKw} kW
          </div>
          <div className="text-[10px] text-slate-500">
            {language === 'zh' ? '定額總能量' : 'Fixed Budget'}
          </div>
        </div>

        {/* Useful Thrust */}
        <div className="bg-[#0f1726] border border-emerald-900/40 p-2.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{t('usefulThrustLabel')}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-base sm:text-lg font-black font-mono text-emerald-300">
            {simResult.usefulThrustPowerKw.toFixed(1)} kW
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">
            {simResult.thrustEfficiency}% {language === 'zh' ? '推進效率' : 'Thrust Eff'}
          </div>
        </div>

        {/* Harmonic Waste Heat */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between transition-colors ${
            isOverheating
              ? 'bg-red-950/40 border-red-500/50'
              : 'bg-[#0f1726] border-cyan-900/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{t('harmonicLossLabel')}</span>
            <Flame className={`w-3.5 h-3.5 ${isOverheating ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          </div>
          <div className={`mt-1 text-base sm:text-lg font-black font-mono ${isOverheating ? 'text-red-400' : 'text-amber-300'}`}>
            {simResult.harmonicLossPowerKw.toFixed(1)} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {language === 'zh' ? '線圈' : 'Coil'}: {simResult.thrusterTempC}°C {isOverheating ? '⚠️' : ''}
          </div>
        </div>

        {/* Max Projected Range */}
        <div className="bg-[#0f1726] border border-cyan-500/30 p-2.5 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>{t('projectedDistanceLabel')}</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-xs sm:text-sm font-black font-mono text-cyan-100 truncate">
            {formatDistance(targetDistKm, language)}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {currentProjectedWaypoint.icon} {language === 'zh' ? currentProjectedWaypoint.nameZh : currentProjectedWaypoint.nameEn}
          </div>
        </div>
      </div>

      {/* 3. Cosmic Spaceship Interactive Flight Stage (Large visual center) */}
      <div className="relative w-full flex-1 min-h-[220px] sm:min-h-[260px] rounded-xl overflow-hidden border border-cyan-500/30 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top Floating Telemetry in Stage */}
        <div className="absolute top-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Live Flight Odometer */}
          <div className="bg-slate-950/85 border border-cyan-500/50 rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm">
            <span className="text-[10px] text-cyan-400 font-mono uppercase block">
              {isFlying ? t('flightOdometer') : (language === 'zh' ? '調校預測航程' : 'Projected Range')}
            </span>
            <span className="text-sm sm:text-lg font-black font-mono text-cyan-200">
              {formatDistance(isFlying ? currentDistKm : targetDistKm, language)}
            </span>
          </div>

          {/* Core Energy Gauge (100% down to 0% during test flight) */}
          <div className="bg-slate-950/85 border border-cyan-500/50 rounded-lg px-3 py-1.5 shadow-lg min-w-[130px] backdrop-blur-sm">
            <div className="flex justify-between text-[10px] font-mono text-slate-300 mb-1">
              <span>{t('energyRemaining')}</span>
              <span className="text-cyan-300 font-bold">{isFlying ? energyRemainingPercent : 100}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${isFlying ? energyRemainingPercent : 100}%` }}
                className={`h-full transition-all duration-100 ${
                  energyRemainingPercent > 30 ? 'bg-cyan-400' : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Live In-Flight Milestone Toast */}
        {isFlying && activeAnnouncement && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-400 px-3.5 py-1.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="text-xl">{activeAnnouncement.icon}</span>
            <div className="text-left">
              <div className="text-[10px] font-bold text-cyan-300 uppercase">
                {language === 'zh' ? '航標通過！' : 'Waypoint Passed!'}
              </div>
              <div className="text-xs font-black text-white">
                {language === 'zh' ? activeAnnouncement.nameZh : activeAnnouncement.nameEn}
              </div>
            </div>
          </div>
        )}

        {/* Quality status badge pinned to bottom right of stage */}
        <div className="absolute bottom-2.5 right-3 bg-slate-950/90 border border-cyan-900/80 px-2.5 py-1 rounded-lg text-[11px] font-mono pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full animate-pulse bg-cyan-400" />
          <span className="text-cyan-300">THD: {simResult.thdPercent}%</span>
        </div>
      </div>

      {/* 4. Celestial Waypoints Milestones Progression */}
      <div className="bg-[#0c1422] border border-cyan-900/40 rounded-lg p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-cyan-300 font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'zh' ? '星際航標里程碑' : 'Celestial Waypoints'}</span>
          </span>
          <span className="text-slate-400">
            {language === 'zh' ? '歷史最佳:' : 'Best:'} {formatDistance(bestDistanceKm, language)}
          </span>
        </div>

        {/* Progress track */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {CELESTIAL_WAYPOINTS.map((wp) => {
            const isReached = bestDistanceKm >= wp.distanceKm;
            const isCurrentProjected = targetDistKm >= wp.distanceKm;

            return (
              <div
                key={wp.id}
                title={`${language === 'zh' ? wp.nameZh : wp.nameEn} (${formatDistance(wp.distanceKm, language)}) - Req THD ≤ ${wp.requiredThd}%`}
                className={`p-1 rounded text-center transition-all flex flex-col items-center justify-center border ${
                  isReached
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.2)]'
                    : isCurrentProjected
                    ? 'bg-cyan-950/60 border-cyan-400/70 text-cyan-200 animate-pulse'
                    : 'bg-[#090d16] border-slate-800 text-slate-600 opacity-70'
                }`}
              >
                <span className="text-xs sm:text-sm">{wp.icon}</span>
                <span className="text-[9px] font-mono truncate w-full mt-0.5">
                  {language === 'zh' ? wp.nameZh.slice(0, 3) : wp.nameEn.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pilot Valerie Coaching / Feedback Strip */}
      <div className="flex items-center gap-3 bg-[#0a111c] border border-cyan-900/50 rounded-lg p-2.5">
        <ValerieMascot
          expression={isOptimal ? 'proud' : isOverheating ? 'surprised' : 'happy'}
          size="sm"
          showHelmet={true}
        />
        <div className="flex-1 text-xs">
          <div className="font-bold text-cyan-300 text-[11px] flex items-center justify-between">
            <span>{language === 'zh' ? '瓦莉莉領航簡報 (Pilot Valerie):' : 'Pilot Valerie Debrief:'}</span>
            {lastFlightSummary && (
              <span className="text-emerald-400 font-mono">
                {language === 'zh' ? '試飛完成！' : 'Test Flight Done!'}
              </span>
            )}
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
            {isOptimal &&
              (language === 'zh'
                ? '太棒了！交流正弦波非常平滑 (THD < 3%)，諧波損耗極低，100 kW 定額動力全數化為強大推力！'
                : 'Superb! The AC sine wave is silky smooth (THD < 3%). Near zero loss—ready for deep space!')}
            {!isOptimal && !isOverheating &&
              (language === 'zh'
                ? '諧波失真尚可，但若在右下方微調開關頻率 f_sw 或加大濾波電感 L，THD 能降更多，飛得更遠！'
                : 'Acceptable harmonics. Fine-tune switching frequency f_sw or filter L in the tuning panel to fly further!')}
            {isOverheating &&
              (language === 'zh'
                ? '注意！諧波發熱過劇，請切換至 SPWM 或增加濾波電感與電容，避免耗光定額電力！'
                : 'Caution! High harmonic heating. Switch to SPWM or increase LC filter to stop wasting power!')}
          </div>
        </div>
      </div>
    </div>
  );
};
