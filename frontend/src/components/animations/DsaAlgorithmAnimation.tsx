import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const DsaAlgorithmAnimation: React.FC = () => {
  const defaultArray = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const [array, setArray] = useState<number[]>(defaultArray);
  const [target, setTarget] = useState<number>(23);
  const [left, setLeft] = useState<number>(0);
  const [right, setRight] = useState<number>(defaultArray.length - 1);
  const [mid, setMid] = useState<number>(Math.floor((0 + defaultArray.length - 1) / 2));
  const [status, setStatus] = useState<'SEARCHING' | 'FOUND' | 'NOT_FOUND'>('SEARCHING');
  const [stepCount, setStepCount] = useState<number>(0);
  const [logText, setLogText] = useState<string>(
    `Binary Search initialized: Searching for target=${target} in sorted array of ${defaultArray.length} elements.`
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const resetSearch = (newArr = array, newTarget = target) => {
    setIsPlaying(false);
    setLeft(0);
    setRight(newArr.length - 1);
    setMid(Math.floor((0 + newArr.length - 1) / 2));
    setStatus('SEARCHING');
    setStepCount(0);
    setLogText(`Reset search window: L=0, R=${newArr.length - 1}, Mid=${Math.floor((0 + newArr.length - 1) / 2)} for target ${newTarget}.`);
  };

  const stepSearch = () => {
    if (status !== 'SEARCHING') return;

    const currentMid = Math.floor((left + right) / 2);
    setMid(currentMid);
    setStepCount((s) => s + 1);

    if (left > right) {
      setStatus('NOT_FOUND');
      setIsPlaying(false);
      setLogText(`Search exhausted: L (${left}) > R (${right}). Target ${target} not present in array.`);
      return;
    }

    const midVal = array[currentMid];
    if (midVal === target) {
      setStatus('FOUND');
      setIsPlaying(false);
      setLogText(`Target ${target} FOUND at index ${currentMid}! Total comparisons: ${stepCount + 1} (Complexity: O(log n)).`);
    } else if (target < midVal) {
      setRight(currentMid - 1);
      setLogText(`Step ${stepCount + 1}: target (${target}) < arr[Mid] (${midVal}) -> Eliminate right half, new R = ${currentMid - 1}.`);
    } else {
      setLeft(currentMid + 1);
      setLogText(`Step ${stepCount + 1}: target (${target}) > arr[Mid] (${midVal}) -> Eliminate left half, new L = ${currentMid + 1}.`);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isPlaying && status === 'SEARCHING') {
      timer = setTimeout(() => {
        stepSearch();
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, left, right, status, stepCount]);

  const handleShuffleArray = () => {
    const randomSet = new Set<number>();
    while (randomSet.size < 10) {
      randomSet.add(Math.floor(Math.random() * 95) + 3);
    }
    const sorted = Array.from(randomSet).sort((a, b) => a - b);
    const newTarget = sorted[Math.floor(Math.random() * sorted.length)];
    setArray(sorted);
    setTarget(newTarget);
    resetSearch(sorted, newTarget);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            🏆
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Data Structures & Algorithms: Binary Search Partitioning</span>
              <Badge variant="cyan" size="sm">O(log n)</Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Two-pointer divide-and-conquer search window convergence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleShuffleArray} icon={<RefreshCw className="w-3 h-3" />}>
            New Array
          </Button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="primary"
          onClick={stepSearch}
          disabled={status !== 'SEARCHING'}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
        >
          Step Next
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={status !== 'SEARCHING'}
          icon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        >
          {isPlaying ? 'Pause' : 'Auto Play'}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => resetSearch()} icon={<RefreshCw className="w-3 h-3" />}>
          Reset
        </Button>

        <div className="ml-auto flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Target:</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
            {target}
          </span>
          <span className="text-slate-400">Step:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold">{stepCount}</span>
        </div>
      </div>

      {/* Array Elements Visualization */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] space-y-4">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {array.map((val, idx) => {
            const isLeft = idx === left;
            const isRight = idx === right;
            const isMid = idx === mid;
            const inWindow = idx >= left && idx <= right;
            const isMatch = status === 'FOUND' && idx === mid;

            return (
              <div key={idx} className="flex flex-col items-center space-y-1.5">
                {/* Pointer Badges */}
                <div className="h-4 flex items-center justify-center font-mono text-[10px] font-bold">
                  {isMid ? (
                    <span className="text-amber-400 px-1 rounded bg-amber-950/80 border border-amber-500/40 animate-bounce">
                      M
                    </span>
                  ) : isLeft ? (
                    <span className="text-cyan-400 px-1 rounded bg-cyan-950/80 border border-cyan-500/40">
                      L
                    </span>
                  ) : isRight ? (
                    <span className="text-rose-400 px-1 rounded bg-rose-950/80 border border-rose-500/40">
                      R
                    </span>
                  ) : null}
                </div>

                {/* Array Node Box */}
                <div
                  className={`w-full aspect-square rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 ${
                    isMatch
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-110 ring-2 ring-white'
                      : isMid
                      ? 'bg-amber-950/90 border-2 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20'
                      : inWindow
                      ? 'bg-slate-800/90 border border-cyan-500/50 text-white'
                      : 'bg-slate-900/40 border border-slate-800/60 text-slate-600 opacity-40'
                  }`}
                >
                  {val}
                </div>

                {/* Index Label */}
                <span className="text-[10px] font-mono text-slate-500">[{idx}]</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block" /> L (Left Pointer)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> M (Midpoint)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> R (Right Pointer)
            </span>
          </div>
          <span className="font-mono text-slate-500">
            Window Size: {Math.max(0, right - left + 1)} elements
          </span>
        </div>
      </div>

      {/* Live Log */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
          status === 'FOUND' ? 'text-emerald-400' : 'text-cyan-400'
        }`} />
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Algorithm Execution Step
          </span>
          <p className="font-mono text-[11px] text-cyan-300">{logText}</p>
        </div>
      </div>
    </div>
  );
};
