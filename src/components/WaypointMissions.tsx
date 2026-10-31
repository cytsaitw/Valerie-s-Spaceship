import React from 'react';
import { Target, CheckCircle2, Lock, Rocket, Sparkles } from 'lucide-react';
import { CELESTIAL_WAYPOINTS } from '../data/waypoints';
import { formatDistance } from '../utils/acThdPhysics';
import { useLanguage } from '../context/LanguageContext';

interface WaypointMissionsProps {
  maxDistanceAchieved: number;
  currentProjectedDistance: number;
  currentThd: number;
  onLaunchFlight: () => void;
}

export const WaypointMissions: React.FC<WaypointMissionsProps> = ({
  maxDistanceAchieved,
  currentProjectedDistance,
  currentThd,
  onLaunchFlight,
}) => {
  const { language } = useLanguage();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header */}
      <div className="bg-[#0b121e] border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase font-bold tracking-wider">
            <Target className="w-4 h-4" />
            <span>
              {language === 'zh'
                ? '定額能量星際航程目標 (Fixed Power Flight Waypoints)'
                : 'Fixed-Power Flight Waypoint Directives'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-cyan-50 mt-1">
            {language === 'zh'
              ? '降低交流正弦波總諧波失真 (THD)，解鎖深空航標！'
              : 'Minimize AC Sine Wave THD to Unlock Deep Space Waypoints!'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {language === 'zh'
              ? '太空船配備 100 kW 定額動力核心。正弦波純度越高 (THD 越低)，有害發熱與反轉矩越少，太空船能飛得越遠！'
              : 'Equipped with a fixed 100 kW core. Lower THD minimizes harmful harmonic counter-torques and coil heat, allowing your ship to sail much farther!'}
          </p>
        </div>

        <button
          onClick={onLaunchFlight}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0"
        >
          <Rocket className="w-4 h-4" />
          <span>{language === 'zh' ? '立即試飛測距' : 'Test Flight Now'}</span>
        </button>
      </div>

      {/* Waypoints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {CELESTIAL_WAYPOINTS.map((wp, idx) => {
          const isReached = maxDistanceAchieved >= wp.distanceKm;
          const isCurrentProjectedReachable = currentProjectedDistance >= wp.distanceKm;

          return (
            <div
              key={wp.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                isReached
                  ? 'bg-[#0e1928] border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : isCurrentProjectedReachable
                  ? 'bg-[#0f1b2c]/80 border-cyan-700/60'
                  : 'bg-[#090e17]/80 border-slate-800 opacity-80'
              }`}
            >
              {/* Waypoint Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl">{wp.icon}</span>
                  <div>
                    <div className="text-[11px] font-mono text-cyan-400 font-semibold">
                      WP-{idx + 1} • {formatDistance(wp.distanceKm, language)}
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-cyan-100">
                      {language === 'zh' ? wp.nameZh : wp.nameEn}
                    </h3>
                  </div>
                </div>

                {isReached ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{language === 'zh' ? '已達成' : 'Achieved'}</span>
                  </span>
                ) : isCurrentProjectedReachable ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-full animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'zh' ? '調校可達' : 'Ready'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>{language === 'zh' ? '未解鎖' : 'Locked'}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'zh' ? wp.descriptionZh : wp.descriptionEn}
              </p>

              {/* THD Benchmark & Valerie's Advice */}
              <div className="pt-2 border-t border-cyan-900/30 flex flex-col gap-1 text-[11px]">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">
                    {language === 'zh' ? '目標 THD 標準:' : 'Target THD:'}
                  </span>
                  <span className="font-bold text-cyan-300">≤ {wp.requiredThd}%</span>
                </div>
                <div className="text-slate-400 italic">
                  💡 {language === 'zh' ? wp.valerieTipsZh : wp.valerieTipsEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
