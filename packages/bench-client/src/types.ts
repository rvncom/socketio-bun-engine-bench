export interface BenchmarkResult {
  connections?: ConnectionResult;
  throughput?: ThroughputResult;
  latency?: LatencyResult;
  meta: ScenarioMeta;
  timeSeries?: TimeSeriesData[];
}

export interface TimeSeriesData {
  timestamp: number;
  connections?: number;
  throughput?: number;
  latency?: number;
}

export interface ScenarioMeta {
  name: string;
  label: string;
  cmd: string[];
  cwd: string;
  color: string;
}

export interface ConnectionResult {
  target: number;
  connected: number;
  failed: number;
  elapsedMs: number;
  rate: number;
}

export interface ThroughputResult {
  clients: number;
  messagesPerClient: number;
  received: number;
  elapsedMs: number;
  throughput: number;
}

export interface LatencyResult {
  clients: number;
  samples: number;
  minMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}
