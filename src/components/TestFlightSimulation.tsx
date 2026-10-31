import React, { useEffect, useRef, useState } from 'react';
import { Rocket, Trophy, AlertTriangle, CheckCircle2, RotateCcw, X, Sparkles, Flame } from 'lucide-react';
import { AcSimulationResult, CelestialWaypoint, AcCircuitParams } from '../types';
import { CELESTIAL_WAYPOINTS } from '../data/waypoints';
import { formatDistance } from '../utils/acThdPhysics';
import { useLanguage } from '../context/LanguageContext';
import { ValerieMascot } from './ValerieMascot';

interface TestFlightSimulationProps {
  params: AcCircuitParams;
  simResult: AcSimulationResult;
  onClose: () => void;
  onRecordNewDistance: (distance: number, waypointId: string) => void;
}

export const TestFlightSimulation: React.FC<TestFlightSimulationProps> = ({
  params,
  simResult,
  onClose,
  onRecordNewDistance,
}) => {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Flight simulation state
  const [currentDistKm, setCurrentDistKm] = useState<number>(0);
  const [energyPercent, setEnergyPercent] = useState<number>(100);
  const [isFlightFinished, setIsFlightFinished] = useState<boolean>(false);
  const [passedWaypoints, setPassedWaypoints] = useState<string[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<CelestialWaypoint | null>(null);

  const targetDistKm = simResult.flightDistanceKm;

  // Run the animated flight loop
  useEffect(() => {
    let animId: number;
    let startTime: number | null = null;
    const durationMs = 3800; // 3.8 seconds flight animation

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Easing out
      const easeOut = 1 - Math.pow(1 - progress, 2.5);
      const dist = Math.round(easeOut * targetDistKm);
      setCurrentDistKm(dist);
      setEnergyPercent(Math.max(0, Math.round((1 - progress) * 100)));

      // Check waypoint announcements
      for (const wp of CELESTIAL_WAYPOINTS) {
        if (dist >= wp.distanceKm && !passedWaypoints.includes(wp.id)) {
          setPassedWaypoints((prev) => [...prev, wp.id]);
          setActiveAnnouncement(wp);
        }
      }

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setIsFlightFinished(true);
        onRecordNewDistance(targetDistKm, simResult.highestWaypointId);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetDistKm]);

  // Starfield canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let starAnim: number;
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 1 + Math.random() * 4,
      size: 1 + Math.random() * 2,
    }));

    const render = () => {
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw moving stars
      ctx.fillStyle = '#ffffff';
      stars.forEach((star) => {
        star.x -= star.speed * (isFlightFinished ? 0.3 : 1.5);
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spaceship Position & Thruster Flame
      const shipX = canvas.width * 0.28;
      const shipY = canvas.height * 0.52;

      // Draw Thruster Flame based on THD
      const isPureSine = simResult.thdPercent < 2.5;
      const isSevere = simResult.thdPercent > 20;
      const flameLength = isFlightFinished ? 10 : isSevere ? 30 + Math.random() * 20 : 65 + Math.random() * 15;

      ctx.save();
      if (!isFlightFinished) {
        // Flame glow
        const grad = ctx.createRadialGradient(
          shipX - 10,
          shipY,
          2,
          shipX - flameLength,
          shipY,
          flameLength
        );
        if (isPureSine) {
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.3, '#22D3EE');
          grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else if (isSevere) {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(0.5, '#EF4444');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          grad.addColorStop(0, '#E0F2FE');
          grad.addColorStop(0.4, '#38BDF8');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(shipX - 6, shipY - 12);
        ctx.lineTo(shipX - flameLength, shipY + (isSevere ? (Math.random() - 0.5) * 12 : 0));
        ctx.lineTo(shipX - 6, shipY + 12);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Spaceship Hull
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shipX + 50, shipY);
      ctx.lineTo(shipX - 10, shipY - 18);
      ctx.lineTo(shipX - 2, shipY - 6);
      ctx.lineTo(shipX - 6, shipY);
      ctx.lineTo(shipX - 2, shipY + 6);
      ctx.lineTo(shipX - 10, shipY + 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Window
      ctx.fillStyle = '#06B6D4';
      ctx.beginPath();
      ctx.ellipse(shipX + 22, shipY, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      starAnim = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(starAnim);
  }, [isFlightFinished, simResult.thdPercent]);

  // Highest waypoint object
  const highestWp =
    CELESTIAL_WAYPOINTS.find((w) => w.id === simResult.highestWaypointId) || CELESTIAL_WAYPOINTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#080d16] border border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0e1624] border-b border-cyan-900/40 text-cyan-50">
          <div className="flex items-center gap-2.5">
            <Rocket className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="font-black text-sm sm:text-base tracking-wider uppercase">
              {t('flightSimulationTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flight Starfield Screen */}
        <div className="relative w-full aspect-[2.4/1] min-h-[220px] sm:min-h-[280px] bg-black overflow-hidden border-b border-cyan-900/50">
          <canvas ref={canvasRef} width={800} height={320} className="w-full h-full block" />

          {/* Top In-Flight Telemetry HUD */}
          <div className="absolute top-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Live Distance Odometer */}
            <div className="bg-slate-950/85 border border-cyan-500/60 rounded-lg px-3 py-1.5 shadow-lg">
              <span className="text-[10px] text-cyan-400 font-mono block uppercase">
                {t('flightOdometer')}
              </span>
              <span className="text-base sm:text-xl font-black font-mono text-cyan-200">
                {formatDistance(currentDistKm, language)}
              </span>
            </div>

            {/* Battery Core Remaining */}
            <div className="bg-slate-950/85 border border-cyan-500/60 rounded-lg px-3 py-1.5 shadow-lg min-w-[140px]">
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>{t('energyRemaining')}</span>
                <span className="text-cyan-300 font-bold">{energyPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${energyPercent}%` }}
                  className={`h-full transition-all duration-100 ${
                    energyPercent > 30 ? 'bg-cyan-400' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Active Waypoint Announcement Popup during flight */}
          {activeAnnouncement && !isFlightFinished && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-400/80 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 animate-bounce">
              <span className="text-2xl">{activeAnnouncement.icon}</span>
              <div>
                <div className="text-xs font-black text-cyan-200 uppercase">
                  {language === 'zh' ? '航行里程碑解鎖！' : 'Waypoint Reached!'}
                </div>
                <div className="text-sm font-bold text-white">
                  {language === 'zh' ? activeAnnouncement.nameZh : activeAnnouncement.nameEn}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debrief & Results Section */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/30">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                {t('flightSummaryTitle')}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-cyan-100 flex items-center gap-2">
                <span>{highestWp.icon}</span>
                <span>{language === 'zh' ? highestWp.nameZh : highestWp.nameEn}</span>
              </h3>
            </div>

            {/* THD & Efficiency Badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-[#131b2a] border border-cyan-700/50 rounded-lg text-xs font-mono">
                <span className="text-slate-400">THD: </span>
                <span className="font-bold text-cyan-300">{simResult.thdPercent}%</span>
              </div>
              <div className="px-3 py-1 bg-[#131b2a] border border-cyan-700/50 rounded-lg text-xs font-mono">
                <span className="text-slate-400">
                  {language === 'zh' ? '推進效率: ' : 'Eff: '}
                </span>
                <span className="font-bold text-emerald-400">{simResult.thrustEfficiency}%</span>
              </div>
            </div>
          </div>

          {/* Valerie's Evaluation & Feedback */}
          <div className="bg-[#0f1726] border border-cyan-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0">
              <ValerieMascot
                expression={
                  simResult.thdPercent < 2.5
                    ? 'proud'
                    : simResult.thdPercent < 10
                    ? 'happy'
                    : simResult.thdPercent < 20
                    ? 'thinking'
                    : 'surprised'
                }
                size="md"
              />
            </div>

            <div className="flex-1 text-xs sm:text-sm text-cyan-100">
              <div className="font-bold text-cyan-300 text-xs uppercase mb-1">
                {language === 'zh' ? '瓦莉莉駕駛員即時簡報 (Valerie Debrief):' : "Valerie's Flight Debrief:"}
              </div>
              <p className="leading-relaxed">
                {simResult.thdPercent < 2.5 && t('valerieCheerInterstellar')}
                {simResult.thdPercent >= 2.5 && simResult.thdPercent < 15 && t('valerieCheerMoon')}
                {simResult.thdPercent >= 15 && t('valerieWarnOverheat')}
              </p>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                💡 {language === 'zh' ? highestWp.valerieTipsZh : highestWp.valerieTipsEn}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              <span>{t('closeBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
