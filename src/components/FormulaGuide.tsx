import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FormulaGuide: React.FC = () => {
  const { language } = useLanguage();
  const [activeCard, setActiveCard] = useState<number>(0);

  const guides = [
    {
      titleZh: '1. 交流正弦波與定額電力航程關係',
      titleEn: '1. AC Sine Waves & Fixed-Power Flight Range',
      formula: 'P_{thrust} = P_{core} \\times \\frac{1}{1 + 2.4 \\cdot (\\text{THD}/100)^2}',
      explainZh:
        '太空船推進線圈是由交流磁場驅動。只有 400Hz 基頻正弦波 (Fundamental) 能產生向前推進力。高階諧波 (3rd, 5th, 7th...) 不僅不提供有用推力，反而在線圈內產生反向旋轉力矩與渦流發熱。給定 100 kW 定額電力時，THD 越低，浪費的廢熱越少，航行距離越遠！',
      explainEn:
        'Spaceship thrusters are driven by AC magnetic fields. Only the 400Hz fundamental sine wave produces forward thrust. Higher harmonics create counter-torques and eddy current coil heating. Given a fixed 100 kW core, lower THD directly maximizes flight distance!',
    },
    {
      titleZh: '2. 總諧波失真 (THD) 數學定義',
      titleEn: '2. Total Harmonic Distortion (THD) Definition',
      formula: '\\text{THD} = \\frac{\\sqrt{V_2^2 + V_3^2 + V_5^2 + \\dots + V_n^2}}{V_1} \\times 100\\%',
      explainZh:
        'THD 衡量交流訊號中有多少比例是失真的非基頻成分。在未濾波的方波中，THD 高達約 48.3% (由大量 1/3, 1/5, 1/7 諧波構成)；而在調校良好的 SPWM 搭配 LC 濾波器下，THD 可降至 2% 以下，達到星際航太等級！',
      explainEn:
        'THD measures the total RMS content of all harmonics relative to the fundamental V_1. An unfiltered square wave has THD ~48.3%. A properly tuned SPWM with LC filter drops THD below 2%, achieving aerospace interstellar grade!',
    },
    {
      titleZh: '3. SPWM 調變指數 (Modulation Index m_a)',
      titleEn: '3. SPWM Modulation Index (m_a)',
      formula: 'm_a = \\frac{V_{control, peak}}{V_{tri, peak}}, \\quad V_{1, peak} = m_a \\cdot V_{dc}',
      explainZh:
        'SPWM 將正弦參考波與高頻三角載波比對產生 PWM 脈衝。當 m_a ≤ 1.0 (線性調變區) 時，低階諧波很小；但若 m_a > 1.0 (過調變 Overmodulation)，波形頂部會飽和削頂，產生有害的三次與五次諧波，使 THD 惡化！',
      explainEn:
        'SPWM compares a sinusoidal reference against a high-frequency triangle carrier. In the linear region (m_a <= 1.0), low-order harmonics are virtually absent. If m_a > 1.0 (Overmodulation), waveform clipping generates unwanted 3rd & 5th harmonics!',
    },
    {
      titleZh: '4. LC 低通濾波器截止頻率 (LC Low-Pass Filter)',
      titleEn: '4. LC Low-Pass Filter Cutoff Frequency',
      formula: 'f_c = \\frac{1}{2\\pi \\sqrt{L \\cdot C}}',
      explainZh:
        'LC 濾波器是將 PWM 方波平滑成純淨正弦波的核心！截止頻率 f_c 的最佳配置是落在基頻 (400 Hz) 與開關頻率 (例如 20 kHz) 之間。若 f_c 太高，高頻開關漣波會洩漏至線圈；若適當配置 L 與 C，能以 -40 dB/decade 強力濾除載波諧波！',
      explainEn:
        'The LC low-pass filter turns pulsed PWM into a smooth, clean sine wave! Its cutoff frequency f_c should be placed between fundamental (400 Hz) and switching carrier (e.g. 20 kHz), attenuating switching harmonics at -40 dB/decade!',
    },
  ];

  return (
    <div className="w-full bg-[#0b121e] border border-cyan-900/40 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center gap-2 pb-2 border-b border-cyan-900/30">
        <BookOpen className="w-5 h-5 text-cyan-400" />
        <h3 className="font-black text-cyan-50 text-sm sm:text-base uppercase tracking-wider">
          {language === 'zh'
            ? '交流正弦波與 THD 電力電子學理核心 (Core Theory)'
            : 'AC Sine Wave & THD Power Electronics Principles'}
        </h3>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {guides.map((g, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCard(idx)}
            className={`p-2 rounded-lg text-xs font-bold transition-all text-left truncate cursor-pointer ${
              activeCard === idx
                ? 'bg-cyan-950/70 border border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                : 'bg-[#131b2a] border border-cyan-900/30 text-slate-400 hover:text-cyan-300'
            }`}
          >
            {language === 'zh' ? g.titleZh : g.titleEn}
          </button>
        ))}
      </div>

      {/* Active Card Body */}
      <div className="bg-[#080d16] border border-cyan-900/50 rounded-xl p-4 sm:p-6 flex flex-col gap-3">
        <h4 className="text-base font-black text-cyan-200">
          {language === 'zh' ? guides[activeCard].titleZh : guides[activeCard].titleEn}
        </h4>

        {/* Formula Box */}
        <div className="bg-[#121927] border border-cyan-500/40 rounded-lg p-3 text-center font-mono text-cyan-300 text-sm sm:text-base shadow-inner">
          {guides[activeCard].formula}
        </div>

        {/* Explanation */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
          {language === 'zh' ? guides[activeCard].explainZh : guides[activeCard].explainEn}
        </p>
      </div>
    </div>
  );
};
