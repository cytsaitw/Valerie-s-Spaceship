import { AcCircuitParams, AcSimulationResult, HarmonicComponent, WaveformPoint } from '../types';
import { CELESTIAL_WAYPOINTS } from '../data/waypoints';

/**
 * Calculates AC simulation results, Harmonic spectrum, THD, and flight distance.
 */
export function calculateAcSimulation(params: AcCircuitParams): AcSimulationResult {
  const {
    waveformMode,
    modulationIndex: rawMa,
    switchingFreq: rawFsw,
    filterInductance: rawL,
    filterCapacitance: rawC,
    fundamentalFreq = 400,
    dcBusVoltage = 300,
    fixedPowerCoreKw = 100,
  } = params;

  const ma = Math.max(0.1, Math.min(1.3, rawMa));
  const fsw = Math.max(500, rawFsw);
  const L = Math.max(1e-5, rawL);
  const C = Math.max(1e-7, rawC);
  const isOvermodulated = ma > 1.0;

  // LC low-pass filter cutoff frequency: f_c = 1 / (2 * pi * sqrt(L * C))
  const filterCutoffFreq = 1 / (2 * Math.PI * Math.sqrt(L * C));

  // Quality factor Q assuming equivalent load resistance R_eq = 20 ohms
  const rEq = 20;

  // Transfer function magnitude for 2nd order LC filter at frequency f:
  // |H(f)| = 1 / sqrt( (1 - (f/fc)^2)^2 + (f / (Q * fc))^2 )
  const getFilterAttenuation = (freq: number): number => {
    if (freq <= 0) return 1;
    const ratio = freq / filterCutoffFreq;
    const Q = rEq * Math.sqrt(C / L);
    const safeQ = Math.max(0.5, Math.min(10, Q));
    const denom = Math.sqrt(Math.pow(1 - ratio * ratio, 2) + Math.pow(ratio / safeQ, 2));
    return Math.min(2.5, 1 / (denom || 1e-4));
  };

  const harmonics: HarmonicComponent[] = [];
  let vFund = 0;

  if (waveformMode === 'square') {
    // Square wave: v(t) = (4*Vdc/pi) * sum(sin(n*w*t)/n) for n = 1, 3, 5, 7, 9, 11...
    vFund = (4 * dcBusVoltage) / Math.PI;
    const orders = [1, 3, 5, 7, 9, 11, 13, 15];
    for (const n of orders) {
      const freq = n * fundamentalFreq;
      const rawMag = vFund / n;
      const att = getFilterAttenuation(freq);
      const filteredMag = rawMag * att;
      harmonics.push({
        order: n,
        label: n === 1 ? 'h1 (Fund)' : `h${n}`,
        freq,
        rawMagnitude: rawMag,
        filteredMagnitude: filteredMag,
        percentageOfFund: 0, // filled below
      });
    }
  } else if (waveformMode === 'modified_sine') {
    // 3-Level Modified Square Wave with dead angle alpha = 30 deg:
    // v(t) = (4*Vdc/pi) * sum( (cos(n*alpha)/n) * sin(n*w*t) )
    // Notice 3rd harmonic cos(3*30) = cos(90) = 0!
    const alphaRad = (30 * Math.PI) / 180;
    vFund = ((4 * dcBusVoltage) / Math.PI) * Math.cos(alphaRad) * (ma / 1.0);
    const orders = [1, 3, 5, 7, 9, 11, 13, 15];
    for (const n of orders) {
      const freq = n * fundamentalFreq;
      const rawMag = ((4 * dcBusVoltage) / Math.PI) * (Math.abs(Math.cos(n * alphaRad)) / n);
      const att = getFilterAttenuation(freq);
      const filteredMag = rawMag * att;
      harmonics.push({
        order: n,
        label: n === 1 ? 'h1 (Fund)' : `h${n}`,
        freq,
        rawMagnitude: rawMag,
        filteredMagnitude: filteredMag,
        percentageOfFund: 0,
      });
    }
  } else {
    // SPWM (Sinusoidal PWM):
    // Fundamental: V_1 = ma * Vdc (linear region)
    vFund = Math.min(1.0, ma) * dcBusVoltage;

    // In overmodulation (ma > 1.0), low-order odd harmonics appear!
    const overmodFactor = Math.max(0, ma - 1.0);
    const h3_amp = overmodFactor > 0 ? (vFund * 0.22 * overmodFactor) / 0.25 : vFund * 0.005;
    const h5_amp = overmodFactor > 0 ? (vFund * 0.12 * overmodFactor) / 0.25 : vFund * 0.003;
    const h7_amp = overmodFactor > 0 ? (vFund * 0.06 * overmodFactor) / 0.25 : vFund * 0.002;

    const baseOrders = [
      { n: 1, raw: vFund, label: 'h1 (Fund)' },
      { n: 3, raw: h3_amp, label: 'h3' },
      { n: 5, raw: h5_amp, label: 'h5' },
      { n: 7, raw: h7_amp, label: 'h7' },
    ];

    for (const b of baseOrders) {
      const freq = b.n * fundamentalFreq;
      const att = getFilterAttenuation(freq);
      harmonics.push({
        order: b.n,
        label: b.label,
        freq,
        rawMagnitude: b.raw,
        filteredMagnitude: b.raw * att,
        percentageOfFund: 0,
      });
    }

    // High frequency switching sidebands around fsw:
    // Sidebands: fsw - 2*f0, fsw + 2*f0, 2*fsw - f0, 2*fsw + f0
    const carrierHarmonics = [
      { label: 'f_sw-2', freq: Math.max(100, fsw - 2 * fundamentalFreq), raw: vFund * 0.38 },
      { label: 'f_sw', freq: fsw, raw: vFund * 0.45 },
      { label: 'f_sw+2', freq: fsw + 2 * fundamentalFreq, raw: vFund * 0.38 },
      { label: '2f_sw', freq: 2 * fsw, raw: vFund * 0.22 },
    ];

    carrierHarmonics.forEach((ch, idx) => {
      const att = getFilterAttenuation(ch.freq);
      harmonics.push({
        order: 100 + idx,
        label: ch.label,
        freq: ch.freq,
        rawMagnitude: ch.raw,
        filteredMagnitude: ch.raw * att,
        percentageOfFund: 0,
        isCarrier: true,
      });
    });
  }

  // Calculate THD: THD = sqrt( sum(V_n^2 for n >= 2) ) / V_1 * 100%
  const fundamental = harmonics.find((h) => h.order === 1) || harmonics[0];
  const v1Filtered = Math.max(1, fundamental.filteredMagnitude);

  let sumHarmonicSquares = 0;
  harmonics.forEach((h) => {
    h.percentageOfFund = (h.filteredMagnitude / v1Filtered) * 100;
    if (h.order !== 1) {
      sumHarmonicSquares += Math.pow(h.filteredMagnitude, 2);
    }
  });

  const rawThd = (Math.sqrt(sumHarmonicSquares) / v1Filtered) * 100;
  const thdPercent = Math.max(0.4, Number(rawThd.toFixed(2)));

  // Output fundamental RMS voltage
  const vFundamentalPeak = v1Filtered;
  const vOutRms = vFundamentalPeak / Math.SQRT2;

  // Power and Efficiency Calculation:
  // Harmonics create counter-torque, eddy currents, and core heating.
  // Motor Harmonic degradation factor: LossFactor = 1 + 2.2 * (THD/100)^2
  // Filter copper/core losses: slightly increases with L and higher fsw
  const filterLossPercent = (L * 1000 * 0.05) + ((fsw / 10000) * 0.15); // ~0.5% to 1.5%
  const motorThrustEff = 1 / (1 + 2.4 * Math.pow(thdPercent / 100, 2));
  const overallEff = Math.max(0.1, Math.min(0.998, motorThrustEff * (1 - filterLossPercent / 100)));

  const usefulThrustPowerKw = fixedPowerCoreKw * overallEff;
  const harmonicLossPowerKw = Math.max(0.1, fixedPowerCoreKw - usefulThrustPowerKw);
  const thrustEfficiency = Number((overallEff * 100).toFixed(1));

  // Thruster temperature: ambient in space is ~20°C, increases with harmonic loss
  const thrusterTempC = Math.round(25 + harmonicLossPowerKw * 1.85);

  // Flight Distance:
  // With fixed 100 kW power core, theoretical maximum distance is ~2.2 Billion km (Alpha Centauri Gate)
  // Distance scales strongly with thrust efficiency and drops exponentially if THD > 25%
  const maxTheoreticalDistance = 2_200_000_000; // km
  const flightDistanceKm = Math.round(
    maxTheoreticalDistance * Math.pow(overallEff, 2.2) * (1 / (1 + Math.pow(thdPercent / 20, 2)))
  );

  // Find farthest waypoint reached
  let highestWaypointId = CELESTIAL_WAYPOINTS[0].id;
  for (const wp of CELESTIAL_WAYPOINTS) {
    if (flightDistanceKm >= wp.distanceKm) {
      highestWaypointId = wp.id;
    }
  }

  return {
    vOutRms,
    vFundamentalPeak,
    thdPercent,
    filterCutoffFreq: Math.round(filterCutoffFreq),
    usefulThrustPowerKw,
    harmonicLossPowerKw,
    thrustEfficiency,
    thrusterTempC,
    flightDistanceKm,
    highestWaypointId,
    harmonics,
    isOvermodulated,
  };
}

/**
 * Generates high-resolution time-domain waveform points for Oscilloscope plotting.
 */
export function generateAcWaveforms(
  params: AcCircuitParams,
  simResult: AcSimulationResult,
  numCycles: number = 2
): WaveformPoint[] {
  const points: WaveformPoint[] = [];
  const N = 300;
  const f0 = params.fundamentalFreq || 400;
  const T = 1 / f0;
  const totalTime = numCycles * T;
  const dt = totalTime / N;

  const { waveformMode, modulationIndex, switchingFreq, dcBusVoltage } = params;
  const { vFundamentalPeak, thdPercent, harmonics } = simResult;

  for (let i = 0; i <= N; i++) {
    const t = i * dt;
    const phase = 2 * Math.PI * f0 * t;

    // Ideal pure sine reference wave
    const vRef = vFundamentalPeak * Math.sin(phase);

    // Raw PWM/Square pulse signal
    let vPwm = 0;
    if (waveformMode === 'square') {
      vPwm = Math.sin(phase) >= 0 ? dcBusVoltage : -dcBusVoltage;
    } else if (waveformMode === 'modified_sine') {
      const sinVal = Math.sin(phase);
      if (sinVal > 0.5) vPwm = dcBusVoltage;
      else if (sinVal < -0.5) vPwm = -dcBusVoltage;
      else vPwm = 0;
    } else {
      // SPWM comparator: sine wave vs high-frequency triangle carrier
      const carrier = Math.sin(2 * Math.PI * switchingFreq * t);
      const modWave = modulationIndex * Math.sin(phase);
      vPwm = modWave >= carrier ? dcBusVoltage : -dcBusVoltage;
    }

    // Synthesized actual output voltage after LC filter:
    // v_actual(t) = vFund * sin(w*t) + sum( v_n * sin(n*w*t) ) + carrier ripples
    let vActual = vFundamentalPeak * Math.sin(phase);

    if (waveformMode === 'square') {
      for (const h of harmonics) {
        if (h.order > 1) {
          vActual += h.filteredMagnitude * Math.sin(h.order * phase);
        }
      }
    } else if (waveformMode === 'modified_sine') {
      for (const h of harmonics) {
        if (h.order > 1) {
          vActual += h.filteredMagnitude * Math.sin(h.order * phase);
        }
      }
    } else {
      // SPWM low-order harmonics if overmodulated
      const h3 = harmonics.find((h) => h.order === 3)?.filteredMagnitude || 0;
      const h5 = harmonics.find((h) => h.order === 5)?.filteredMagnitude || 0;
      vActual += h3 * Math.sin(3 * phase);
      vActual += h5 * Math.sin(5 * phase);

      // Add carrier ripple envelope
      const carrierHarmonic = harmonics.find((h) => h.isCarrier);
      const rippleAmp = carrierHarmonic ? carrierHarmonic.filteredMagnitude * 0.85 : (vFundamentalPeak * thdPercent) / 100;
      vActual += rippleAmp * Math.sin(2 * Math.PI * switchingFreq * t);
    }

    points.push({ t, vRef, vActual, vPwm });
  }

  return points;
}

/**
 * Format large distances into human-friendly km, Million km, or Astronomical Units (AU).
 */
export function formatDistance(km: number, lang: 'zh' | 'en' = 'zh'): string {
  if (km >= 1_000_000_000) {
    const au = (km / 149_597_870.7).toFixed(2);
    return lang === 'zh'
      ? `${(km / 1_000_000_000).toFixed(2)} 億公里 (${au} AU)`
      : `${(km / 1_000_000_000).toFixed(2)} Billion km (${au} AU)`;
  }
  if (km >= 1_000_000) {
    return lang === 'zh'
      ? `${(km / 1_000_000).toFixed(1)} 百萬公里`
      : `${(km / 1_000_000).toFixed(1)} Million km`;
  }
  if (km >= 1_000) {
    return `${km.toLocaleString()} km`;
  }
  return `${km} km`;
}
