import React, { createContext, useContext, useState } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, { zh: string; en: string }> = {
  // App Title & Header
  appTitle: {
    zh: "Valerie's Starship Inverter Lab",
    en: "Valerie's Starship Inverter Lab",
  },
  appSubTitle: {
    zh: "交流正弦波、總諧波失真 (THD) 與定額電力太空試飛",
    en: "AC Sine Waves, THD & Fixed-Power Flight Range",
  },
  headerBadge: {
    zh: "Power Electronics • AC Synthesis & Harmonic Minimization",
    en: "Power Electronics • AC Synthesis & Harmonic Minimization",
  },
  askValerieBtn: {
    zh: "問瓦莉莉 AI 助教",
    en: "Ask Valerie AI",
  },

  // Navigation Tabs
  tabFlightTest: {
    zh: "🚀 試飛調校台 (Flight Lab)",
    en: "🚀 Flight Test Lab",
  },
  tabWaypoints: {
    zh: "🎯 星際航行目標 (Waypoints)",
    en: "🎯 Flight Waypoints",
  },
  tabTheory: {
    zh: "📚 正弦波與 THD 學理 (Theory)",
    en: "📚 Sine Wave & THD Guide",
  },

  // Telemetry Bar
  fixedPowerLabel: {
    zh: "定額核心能量 (Fixed Power Core):",
    en: "Fixed Power Core:",
  },
  usefulThrustLabel: {
    zh: "有效推進功率 (Useful Thrust):",
    en: "Useful Thrust Power:",
  },
  harmonicLossLabel: {
    zh: "諧波發熱損耗 (Harmonic Loss):",
    en: "Harmonic Waste Heat:",
  },
  thrusterTempLabel: {
    zh: "推進線圈溫度 (Coil Temp):",
    en: "Thruster Coil Temp:",
  },
  projectedDistanceLabel: {
    zh: "預測最遠航程 (Projected Range):",
    en: "Projected Max Range:",
  },
  bestRecordLabel: {
    zh: "歷史最佳紀錄 (Best Record):",
    en: "Best Flight Record:",
  },
  launchFlightBtn: {
    zh: "🚀 啟動航程試飛 (Test Flight)",
    en: "🚀 Launch Test Flight",
  },

  // Circuit Controls
  controlsTitle: {
    zh: "太空船逆變器與 LC 濾波調校 (Inverter & Filter Tuning)",
    en: "Inverter Circuit & LC Filter Tuning",
  },
  modulationMode: {
    zh: "調變模式 (Modulation Mode)",
    en: "Modulation Mode",
  },
  modeSquare: {
    zh: "方波 (Square Wave 180°)",
    en: "Square Wave (180°)",
  },
  modeModified: {
    zh: "修正方波 (Modified Sine)",
    en: "Modified Sine (3-Level)",
  },
  modeSpwm: {
    zh: "正弦脈寬調變 (SPWM)",
    en: "Sinusoidal PWM (SPWM)",
  },
  modIndexLabel: {
    zh: "調變指數 m_a (Modulation Index)",
    en: "Modulation Index (m_a)",
  },
  overmodulatedNotice: {
    zh: "⚠️ 注意：過調變 (m_a > 1.0) 會導致電壓飽和並產生低頻三次/五次諧波！",
    en: "⚠️ Warning: Overmodulation (m_a > 1.0) causes saturation & low-order harmonics!",
  },
  switchingFreqLabel: {
    zh: "開關載波頻率 f_sw (Switching Frequency)",
    en: "Switching Frequency (f_sw)",
  },
  filterInductorLabel: {
    zh: "濾波電感 L (Filter Inductance)",
    en: "Filter Inductance (L)",
  },
  filterCapacitorLabel: {
    zh: "濾波電容 C (Filter Capacitance)",
    en: "Filter Capacitance (C)",
  },
  cutoffFreqLabel: {
    zh: "LC 濾波截止頻率 f_c (Cutoff Frequency)",
    en: "LC Cutoff Frequency (f_c)",
  },
  cutoffAdviceGood: {
    zh: "✅ 理想：截止頻率剛好落在 400Hz 基頻與載波頻率之間！",
    en: "✅ Optimal: Cutoff sits well between 400Hz and switching carrier!",
  },
  cutoffAdviceBad: {
    zh: "⚠️ 截止頻率太高，載波諧波無法被有效衰減，THD 偏高！",
    en: "⚠️ Cutoff too high! Switching harmonics leak through into thruster.",
  },
  presetsTitle: {
    zh: "快速電路預設 (Presets):",
    en: "Quick Circuit Presets:",
  },
  presetSquare: {
    zh: "原始方波 (無濾波)",
    en: "Raw Square Wave",
  },
  presetBasic: {
    zh: "初步 SPWM (低濾波)",
    en: "Basic SPWM",
  },
  presetInterstellar: {
    zh: "星際級純正弦波 (極低 THD)",
    en: "Interstellar Pure Sine",
  },

  // Oscilloscope & Spectrum
  scopeTitle: {
    zh: "即時交流正弦波示波器 (AC Sine Wave Scope)",
    en: "Real-Time AC Sine Wave Oscilloscope",
  },
  spectrumTitle: {
    zh: "傅立葉諧波頻譜分析 (Harmonic Spectrum FFT)",
    en: "Fourier Harmonics Spectrum (FFT)",
  },
  legendRefSine: {
    zh: "參考純正弦波 (Pure Sine)",
    en: "Pure Sine Ref (v_ref)",
  },
  legendActualWave: {
    zh: "實際輸出交流電壓 (Filtered v_out)",
    en: "Actual Output (v_out)",
  },
  legendPwmSignal: {
    zh: "原始 PWM 開關訊號 (Raw PWM)",
    en: "Raw PWM Pulses",
  },
  thdStatusLabel: {
    zh: "總諧波失真 (THD):",
    en: "Total Harmonic Distortion (THD):",
  },
  thdInterstellar: {
    zh: "🌌 星際級極致正弦波 (THD < 2%) — 幾乎零損耗！",
    en: "🌌 Interstellar Pure Sine (THD < 2%) — Near zero loss!",
  },
  thdStandard: {
    zh: "🌟 優良標準 (THD < 5%) — 符合 IEEE 519 高品質標準",
    en: "🌟 Industrial Standard (THD < 5%) — Meets IEEE 519 Standard",
  },
  thdModerate: {
    zh: "⚠️ 中度失真 (THD 5% ~ 20%) — 產生渦流損耗與線圈發熱",
    en: "⚠️ Moderate Distortion (5% - 20%) — Eddy losses & coil heat",
  },
  thdSevere: {
    zh: "🔥 嚴重失真 (THD > 25%) — 產生強烈逆向轉矩，定額電力快速耗盡！",
    en: "🔥 Severe Distortion (> 25%) — Counter torques exhaust power!",
  },

  // Test Flight Modal
  flightSimulationTitle: {
    zh: "太空船航程試飛模擬 (Starship Flight Test Simulation)",
    en: "Starship Flight Test Simulation",
  },
  flightOdometer: {
    zh: "目前航行距離 (Distance Traveled):",
    en: "Distance Traveled:",
  },
  energyRemaining: {
    zh: "定額電池殘留 (Core Energy):",
    en: "Remaining Power:",
  },
  highestWaypointReached: {
    zh: "本次試飛到達目標 (Waypoint Achieved):",
    en: "Farthest Waypoint Reached:",
  },
  flightSummaryTitle: {
    zh: "試飛結算報告 (Flight Test Debrief)",
    en: "Flight Test Debrief",
  },
  closeBtn: {
    zh: "返回調校 (Back to Tuning)",
    en: "Back to Tuning",
  },
  retryBtn: {
    zh: "再試一次 (Fly Again)",
    en: "Fly Again",
  },

  // Mascot quotes
  valerieCheerInterstellar: {
    zh: "太神奇了！這是我見過最純淨的交流正弦波！諧波損耗幾乎為零，我們抵達了南門二星際跳躍門！",
    en: "Incredible! That is the cleanest AC sine wave I've ever seen! Zero harmonic waste!",
  },
  valerieCheerMoon: {
    zh: "我們成功降落在月球前哨基地！但三次諧波還是讓線圈發燙，再加把勁調降 THD 我們就能飛到火星！",
    en: "We reached the Lunar Outpost! But 3rd harmonics heated the coils. Tweak THD to reach Mars!",
  },
  valerieWarnOverheat: {
    zh: "哇啊啊！推進線圈過熱了！方波的諧波產生太多反向力矩，定額能量全變成廢熱，連月球都飛不到！",
    en: "Whoa! The coils are overheating! Square wave harmonics burned our fixed energy into waste heat!",
  },
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'zh',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: () => '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
