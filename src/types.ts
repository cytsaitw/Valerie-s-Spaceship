/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WaveformMode = 'square' | 'modified_sine' | 'spwm';

export type ValerieExpression = 'happy' | 'thinking' | 'surprised' | 'focused' | 'proud' | 'waving';

export type Language = 'zh' | 'en';

export interface AcCircuitParams {
  waveformMode: WaveformMode;
  modulationIndex: number; // m_a (0.2 to 1.25)
  switchingFreq: number;    // f_sw (1,000 to 50,000 Hz)
  filterInductance: number; // L (Henrys, e.g. 0.2mH to 15mH)
  filterCapacitance: number;// C (Farads, e.g. 1µF to 80µF)
  fundamentalFreq: number;  // f_0 (400 Hz standard aerospace AC)
  dcBusVoltage: number;     // V_dc (300 V fixed)
  fixedPowerCoreKw: number; // Fixed Power Budget = 100 kW
}

export interface HarmonicComponent {
  order: number;            // 1, 3, 5, 7, 9, or carrier
  label: string;            // 'h1 (Fund)', 'h3', 'h5', etc.
  freq: number;             // Frequency in Hz
  rawMagnitude: number;     // Volts before filter
  filteredMagnitude: number;// Volts after LC filter
  percentageOfFund: number; // % relative to h1
  isCarrier?: boolean;
}

export interface AcSimulationResult {
  vOutRms: number;           // Fundamental AC RMS voltage (V)
  vFundamentalPeak: number;  // Peak of fundamental sine (V)
  thdPercent: number;        // Total Harmonic Distortion (%)
  filterCutoffFreq: number;  // f_c = 1 / (2*pi*sqrt(L*C)) (Hz)
  usefulThrustPowerKw: number; // Useful propulsion power (kW)
  harmonicLossPowerKw: number; // Energy wasted as heat (kW)
  thrustEfficiency: number;  // % (Useful / Total)
  thrusterTempC: number;     // Coil temperature (°C)
  flightDistanceKm: number;  // Calculated flight distance from fixed power
  highestWaypointId: string; // Farthest waypoint reachable
  harmonics: HarmonicComponent[];
  isOvermodulated: boolean;
}

export interface WaveformPoint {
  t: number;      // Time (seconds)
  vRef: number;   // Target pure sine wave
  vActual: number;// Actual output voltage with harmonics & ripples
  vPwm: number;   // Raw switching pulses
}

export interface CelestialWaypoint {
  id: string;
  nameZh: string;
  nameEn: string;
  distanceKm: number;
  icon: string;
  requiredThd: number;
  descriptionZh: string;
  descriptionEn: string;
  valerieTipsZh: string;
  valerieTipsEn: string;
}

export interface FlightTestRecord {
  timestamp: Date;
  distanceKm: number;
  thdPercent: number;
  waypointReached: string;
  waveformMode: WaveformMode;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'valerie';
  text: string;
  timestamp: Date;
}
