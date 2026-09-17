import React, { useState } from 'react';
import { Send, Server, Database, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface RequestPacket {
  id: string;
  targetPod: number;
  isCacheHit: boolean;
  latencyMs: number;
}

export const SystemDesignAnimation: React.FC = () => {
  const [activePodIdx, setActivePodIdx] = useState<number>(0);
  const [totalRequests, setTotalRequests] = useState<number>(1240);
  const [cacheHits, setCacheHits] = useState<number>(1012);
  const [recentPackets, setRecentPackets] = useState<RequestPacket[]>([]);
  const [logText, setLogText] = useState<string>(
    'System Design Ingress: NGINX Layer-7 reverse proxy distributing requests across 3 container replicas.'
  );

  const handleSendRequest = () => {
    const nextPod = (activePodIdx + 1) % 3;
    setActivePodIdx(nextPod);
    setTotalRequests((t) => t + 1);

    const isHit = Math.random() > 0.25; // 75% cache hit rate
    if (isHit) setCacheHits((c) => c + 1);

    const latency = isHit ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 25) + 35;

    const packet: RequestPacket = {
      id: `req_${Date.now().toString().slice(-4)}`,
      targetPod: nextPod + 1,
      isCacheHit: isHit,
      latencyMs: latency,
    };

    setRecentPackets((prev) => [packet, ...prev.slice(0, 4)]);
    setLogText(
      `Handled ${packet.id}: Routed to Pod-${nextPod + 1} -> ${
        isHit ? 'REDIS CACHE HIT (sub-5ms)' : 'CACHE MISS -> Fetched from PostgreSQL Primary (42ms)'
      }`
    );
  };

  const handleSimulateTrafficSpike = () => {
    setTotalRequests((t) => t + 250);
    setCacheHits((c) => c + 210);
    setLogText('Horizontal Pod Autoscaler (HPA) triggered: Simulated spike of 250 req/sec handled gracefully via Redis Cache.');
  };

  const cacheHitRatio = totalRequests > 0 ? ((cacheHits / totalRequests) * 100).toFixed(1) : '85.0';

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400">
            ☁️
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Distributed Architecture & Load Balancing Flow</span>
              <Badge variant="cyan" size="sm">Microservices</Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Client requests, Round-Robin routing, Redis Cache-Aside & Database persistence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-400">Cache Hit Rate:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
            {cacheHitRatio}%
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button size="sm" variant="primary" onClick={handleSendRequest} icon={<Send className="w-3.5 h-3.5" />}>
          Send Request
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSimulateTrafficSpike} icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}>
          Simulate Spike (+250 Req)
        </Button>
      </div>

      {/* System Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
        {/* Step 1: Clients */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#090d16] flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Clients / Edge</span>
            <span className="text-[10px] text-slate-500 font-mono">Cloudflare CDN</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span>Total Reqs:</span>
              <strong className="text-white">{totalRequests}</strong>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span>Protocol:</span>
              <strong className="text-cyan-400">HTTP/2 + TLS</strong>
            </div>
          </div>
        </div>

        {/* Step 2: Load Balancer */}
        <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              API Gateway
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Round-Robin</span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-900/30 border border-indigo-500/30 text-[11px] text-slate-300 font-mono text-center">
            Active Routing Target:
            <div className="text-sm font-bold text-white mt-1">Pod #{activePodIdx + 1}</div>
          </div>
        </div>

        {/* Step 3: Microservice Pods */}
        <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Kubernetes Cluster
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">3 Pods</span>
          </div>
          <div className="space-y-1">
            {[1, 2, 3].map((pod) => {
              const isActive = activePodIdx + 1 === pod;
              return (
                <div
                  key={pod}
                  className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-400'
                  }`}
                >
                  <span>app-pod-0{pod}</span>
                  <span className="text-[9px] text-emerald-400">HEALTHY</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Cache & Database */}
        <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Persistence Tier
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Cache-Aside</span>
          </div>
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="p-2 rounded bg-slate-900 border border-amber-500/30 flex justify-between">
              <span className="text-amber-300 font-semibold">Redis Cache:</span>
              <span className="text-emerald-400 font-bold">~2ms</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <span className="text-slate-400">PostgreSQL:</span>
              <span className="text-slate-200 font-bold">~35ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Packets Stream */}
      {recentPackets.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto text-[10px] font-mono py-1">
          <span className="text-slate-500 uppercase shrink-0">Recent Packets:</span>
          {recentPackets.map((pkt) => (
            <span
              key={pkt.id}
              className={`px-2 py-0.5 rounded border shrink-0 ${
                pkt.isCacheHit
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
              }`}
            >
              {pkt.id} ➔ Pod-{pkt.targetPod} ({pkt.latencyMs}ms)
            </span>
          ))}
        </div>
      )}

      {/* Live Log */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Gateway Telemetry Log
          </span>
          <p className="font-mono text-[11px] text-emerald-300">{logText}</p>
        </div>
      </div>
    </div>
  );
};
