import React, { useState } from 'react';
import { Layers, RefreshCw, Trash2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface StackVar {
  id: string;
  name: string;
  type: string;
  value: string;
  refAddress?: string;
}

interface HeapObj {
  address: string;
  type: string;
  fields: Record<string, string>;
  isReferenced: boolean;
}

interface StringPoolEntry {
  address: string;
  literal: string;
}

export const JavaMemoryAnimation: React.FC = () => {
  const [stackFrames, setStackFrames] = useState<Array<{ name: string; vars: StackVar[] }>>([
    {
      name: 'main() [Thread-1]',
      vars: [
        { id: 'v1', name: 'id', type: 'int', value: '101' },
        { id: 'v2', name: 's1', type: 'String', value: 'ref 0xSP1', refAddress: '0xSP1' },
        { id: 'v3', name: 'p1', type: 'Person', value: 'ref 0xH1', refAddress: '0xH1' },
      ],
    },
  ]);

  const [heapObjects, setHeapObjects] = useState<HeapObj[]>([
    {
      address: '0xH1',
      type: 'Person',
      fields: { name: '"Alice"', age: '24' },
      isReferenced: true,
    },
  ]);

  const [stringPool, setStringPool] = useState<StringPoolEntry[]>([
    { address: '0xSP1', literal: '"SAGE Engine"' },
  ]);

  const [lastActionLog, setLastActionLog] = useState<string>(
    'JVM initialized: main() frame active, Person object in Heap, "SAGE Engine" stored in String Constant Pool.'
  );

  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  // Allocate new object in Heap
  const handleAllocatePerson = () => {
    const nextIdx = heapObjects.length + 1;
    const newAddr = `0xH${nextIdx}`;
    const newObj: HeapObj = {
      address: newAddr,
      type: 'Person',
      fields: { name: `"Student_${nextIdx}"`, grade: `'A'` },
      isReferenced: true,
    };

    setHeapObjects((prev) => [...prev, newObj]);
    setStackFrames((prev) => {
      const top = { ...prev[0] };
      top.vars = [
        ...top.vars,
        { id: `p_${nextIdx}`, name: `p${nextIdx}`, type: 'Person', value: `ref ${newAddr}`, refAddress: newAddr },
      ];
      return [top, ...prev.slice(1)];
    });

    setActiveHighlight(newAddr);
    setLastActionLog(`Executed: Person p${nextIdx} = new Person(); -> Allocated in Heap at ${newAddr}, ref stored in Stack frame.`);
  };

  // Add String literal vs new String()
  const handleAddStringLiteral = () => {
    // Check if literal already in String Pool
    const existing = stringPool.find((s) => s.literal === '"SAGE Engine"');
    if (existing) {
      setStackFrames((prev) => {
        const top = { ...prev[0] };
        top.vars = [
          ...top.vars,
          { id: `s_${Date.now()}`, name: `s2`, type: 'String', value: `ref ${existing.address}`, refAddress: existing.address },
        ];
        return [top, ...prev.slice(1)];
      });
      setActiveHighlight(existing.address);
      setLastActionLog('Executed: String s2 = "SAGE Engine"; -> Reused existing literal in String Constant Pool (s1 == s2 evaluates to TRUE)!');
    }
  };

  const handleAddNewString = () => {
    const nextIdx = heapObjects.length + 1;
    const newAddr = `0xH${nextIdx}`;
    const newObj: HeapObj = {
      address: newAddr,
      type: 'String',
      fields: { value: '"SAGE Engine"', hash: '0x8F21' },
      isReferenced: true,
    };
    setHeapObjects((prev) => [...prev, newObj]);
    setStackFrames((prev) => {
      const top = { ...prev[0] };
      top.vars = [
        ...top.vars,
        { id: `s3_${Date.now()}`, name: `s3`, type: 'String', value: `ref ${newAddr}`, refAddress: newAddr },
      ];
      return [top, ...prev.slice(1)];
    });
    setActiveHighlight(newAddr);
    setLastActionLog('Executed: String s3 = new String("SAGE Engine"); -> Created new distinct Heap instance (s1 == s3 is FALSE, s1.equals(s3) is TRUE)!');
  };

  // Push / Pop stack frame
  const handlePushFrame = () => {
    if (stackFrames.length >= 3) {
      setLastActionLog('Max stack depth reached for simulation.');
      return;
    }
    const newFrame = {
      name: 'calculateMetrics(p1)',
      vars: [
        { id: 'param1', name: 'target', type: 'Person', value: 'ref 0xH1', refAddress: '0xH1' },
        { id: 'loc1', name: 'delta', type: 'double', value: '14.28' },
      ],
    };
    setStackFrames((prev) => [newFrame, ...prev]);
    setLastActionLog('Pushed new Stack Frame: calculateMetrics(p1) onto call stack. Local execution context active.');
  };

  const handlePopFrame = () => {
    if (stackFrames.length <= 1) {
      setLastActionLog('Cannot pop main() root frame.');
      return;
    }
    const popped = stackFrames[0].name;
    setStackFrames((prev) => prev.slice(1));
    setLastActionLog(`Popped Stack Frame: ${popped}. Local primitive variables destroyed from stack.`);
  };

  // Garbage Collector
  const handleGarbageCollect = () => {
    // Collect active referenced addresses from all stack frames
    const referencedAddrs = new Set<string>();
    stackFrames.forEach((frame) => {
      frame.vars.forEach((v) => {
        if (v.refAddress) referencedAddrs.add(v.refAddress);
      });
    });

    const unreferencedCount = heapObjects.filter((o) => !referencedAddrs.has(o.address)).length;
    setHeapObjects((prev) => prev.filter((o) => referencedAddrs.has(o.address)));
    setLastActionLog(`JVM Mark & Sweep Garbage Collector executed: Reclaimed ${unreferencedCount} unreferenced objects from Heap!`);
  };

  // Reset
  const handleReset = () => {
    setStackFrames([
      {
        name: 'main() [Thread-1]',
        vars: [
          { id: 'v1', name: 'id', type: 'int', value: '101' },
          { id: 'v2', name: 's1', type: 'String', value: 'ref 0xSP1', refAddress: '0xSP1' },
          { id: 'v3', name: 'p1', type: 'Person', value: 'ref 0xH1', refAddress: '0xH1' },
        ],
      },
    ]);
    setHeapObjects([
      {
        address: '0xH1',
        type: 'Person',
        fields: { name: '"Alice"', age: '24' },
        isReferenced: true,
      },
    ]);
    setStringPool([{ address: '0xSP1', literal: '"SAGE Engine"' }]);
    setLastActionLog('Reset JVM memory model to baseline initial state.');
    setActiveHighlight(null);
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
            ☕
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>JVM Memory Architecture & String Pool Simulator</span>
              <Badge variant="cyan" size="sm">Interactive</Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Visualize Call Stack Frames, Heap Object Allocation, and String Pool Immutability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleReset} icon={<RefreshCw className="w-3 h-3" />}>
            Reset
          </Button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={handleAllocatePerson} icon={<Plus className="w-3 h-3 text-emerald-400" />}>
          new Person()
        </Button>
        <Button size="sm" variant="secondary" onClick={handleAddStringLiteral} icon={<Sparkles className="w-3 h-3 text-amber-400" />}>
          s2 = "SAGE Engine" (Literal)
        </Button>
        <Button size="sm" variant="secondary" onClick={handleAddNewString} icon={<Plus className="w-3 h-3 text-cyan-400" />}>
          s3 = new String()
        </Button>
        <Button size="sm" variant="secondary" onClick={handlePushFrame} icon={<Layers className="w-3 h-3 text-indigo-400" />}>
          Push Frame
        </Button>
        <Button size="sm" variant="secondary" onClick={handlePopFrame} icon={<Layers className="w-3 h-3 text-rose-400" />}>
          Pop Frame
        </Button>
        <Button size="sm" variant="accent" onClick={handleGarbageCollect} icon={<Trash2 className="w-3 h-3 text-purple-400" />}>
          Run GC (Mark-Sweep)
        </Button>
      </div>

      {/* Memory Grid Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* 1. Stack Memory */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2.5 flex flex-col">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Call Stack (Frames)
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">{stackFrames.length} Frame(s)</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-1">
            {stackFrames.map((frame, fIdx) => (
              <div
                key={fIdx}
                className={`p-2.5 rounded-lg border text-xs space-y-1.5 transition-all ${
                  fIdx === 0
                    ? 'border-indigo-400/60 bg-indigo-900/30 shadow-md shadow-indigo-600/10'
                    : 'border-slate-800 bg-slate-900/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-indigo-200">
                  <span>{frame.name}</span>
                  {fIdx === 0 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300">ACTIVE</span>}
                </div>

                <div className="space-y-1">
                  {frame.vars.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-[10px] font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-800"
                    >
                      <span className="text-slate-400">
                        <strong className="text-cyan-400">{v.type}</strong> {v.name}
                      </span>
                      <span className={v.refAddress ? 'text-amber-300 font-bold' : 'text-emerald-300'}>
                        {v.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Heap Memory */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2.5 flex flex-col">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <span>📦</span>
              Heap Space (Dynamic Objects)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">{heapObjects.length} Object(s)</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-1">
            {heapObjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">Heap empty</div>
            ) : (
              heapObjects.map((obj) => {
                const isHi = activeHighlight === obj.address;
                return (
                  <div
                    key={obj.address}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                      isHi
                        ? 'border-cyan-400 bg-cyan-900/40 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-cyan-200">{obj.type}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                        {obj.address}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 bg-slate-950/60 p-1.5 rounded space-y-0.5">
                      {Object.entries(obj.fields).map(([k, val]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-200">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. String Constant Pool */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-2.5 flex flex-col">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              String Constant Pool (Intern)
            </span>
            <span className="text-[10px] text-amber-400 font-mono">{stringPool.length} Literal(s)</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-1">
            {stringPool.map((entry) => {
              const isHi = activeHighlight === entry.address;
              return (
                <div
                  key={entry.address}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                    isHi
                      ? 'border-amber-400 bg-amber-900/40 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-200 font-semibold">{entry.literal}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                      {entry.address}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Immutable interned string. All equivalent string literals point here.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Action Inspector Log */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            JVM Execution Log
          </span>
          <p className="font-mono text-[11px] text-emerald-300">{lastActionLog}</p>
        </div>
      </div>
    </div>
  );
};
