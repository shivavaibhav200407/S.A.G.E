import React, { useState } from 'react';
import { Play, RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface StreamItem {
  val: number | string;
  yieldLine: number;
  consumed: boolean;
}

export const PythonGeneratorAnimation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'legb'>('generator');

  // Generator State
  const generatorCodeLines = [
    'def number_stream(limit):',
    '    current = 1',
    '    while current <= limit:',
    '        # Execution suspends here until next() is called',
    '        yield current * 10',
    '        current += 1',
  ];

  const [currentLine, setCurrentLine] = useState<number>(1);
  const [currentVal, setCurrentVal] = useState<number>(1);
  const [yieldedStream, setYieldedStream] = useState<StreamItem[]>([]);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);
  const [generatorStatus, setGeneratorStatus] = useState<'GEN_CREATED' | 'GEN_SUSPENDED' | 'GEN_RUNNING' | 'GEN_CLOSED'>('GEN_CREATED');
  const [logMessage, setLogMessage] = useState<string>('Generator created: gen = number_stream(4). Memory footprint: O(1) constant.');

  // LEGB State
  const [legbQuery, setLegbQuery] = useState<string>('count');
  const [legbFoundAt, setLegbFoundAt] = useState<'Local' | 'Enclosing' | 'Global' | 'Built-in' | 'None'>('Local');

  const handleNextStep = () => {
    if (isExhausted) {
      setLogMessage('StopIteration Exception: Generator stream is exhausted. Reset to re-run.');
      setGeneratorStatus('GEN_CLOSED');
      return;
    }

    setGeneratorStatus('GEN_RUNNING');
    setCurrentLine(4); // Yield line

    const producedVal = currentVal * 10;
    const newItem: StreamItem = { val: producedVal, yieldLine: 5, consumed: true };

    setYieldedStream((prev) => [...prev, newItem]);
    setLogMessage(`next(gen) called: Generator resumed at line 3, yielded ${producedVal}, and suspended execution state.`);

    if (currentVal >= 4) {
      setIsExhausted(true);
      setCurrentVal((v) => v + 1);
      setGeneratorStatus('GEN_CLOSED');
    } else {
      setCurrentVal((v) => v + 1);
      setGeneratorStatus('GEN_SUSPENDED');
    }
  };

  const handleResetGenerator = () => {
    setCurrentLine(1);
    setCurrentVal(1);
    setYieldedStream([]);
    setIsExhausted(false);
    setGeneratorStatus('GEN_CREATED');
    setLogMessage('Generator reset. Execution state at entry point def number_stream().');
  };

  // LEGB Lookup
  const handleLegbLookup = (varName: string) => {
    setLegbQuery(varName);
    if (varName === 'count') {
      setLegbFoundAt('Local');
      setLogMessage("LEGB: Resolved 'count' immediately in Local frame scope (O(1)).");
    } else if (varName === 'config') {
      setLegbFoundAt('Enclosing');
      setLogMessage("LEGB: 'config' not in Local -> resolved in Enclosing (closure) outer function scope.");
    } else if (varName === 'DATABASE_URL') {
      setLegbFoundAt('Global');
      setLogMessage("LEGB: 'DATABASE_URL' not in Local or Enclosing -> resolved in module Global scope.");
    } else if (varName === 'len') {
      setLegbFoundAt('Built-in');
      setLogMessage("LEGB: 'len' resolved in Python core Built-in namespace (__builtins__).");
    } else {
      setLegbFoundAt('None');
      setLogMessage(`LEGB: NameError: name '${varName}' is not defined across any scope layer.`);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            🐍
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Python Execution & Generator Stream Engine</span>
              <Badge variant="cyan" size="sm">Interactive</Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive visualization of lazy yield pipelines, suspension frames & LEGB scope resolution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'generator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Generator Yield Flow
          </button>
          <button
            onClick={() => setActiveTab('legb')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'legb'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            LEGB Scope Inspector
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="primary"
              onClick={handleNextStep}
              disabled={isExhausted}
              icon={<Play className="w-3 h-3" />}
            >
              next(stream)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleResetGenerator}
              icon={<RefreshCw className="w-3 h-3" />}
            >
              Reset Stream
            </Button>

            <span className="text-xs text-slate-400 ml-auto font-mono flex items-center gap-1.5">
              Status:
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                generatorStatus === 'GEN_SUSPENDED'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                  : generatorStatus === 'GEN_RUNNING'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                  : generatorStatus === 'GEN_CLOSED'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {generatorStatus}
              </span>
            </span>
          </div>

          {/* Generator Code & Live Stream View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Code Block with Line Highlight */}
            <div className="rounded-xl border border-slate-800 bg-[#090d16] p-3 space-y-1 font-mono text-xs overflow-x-auto">
              <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800 flex justify-between">
                <span>generator_pipeline.py</span>
                <span>Frame: current={currentVal}</span>
              </div>
              {generatorCodeLines.map((line, lIdx) => (
                <div
                  key={lIdx}
                  className={`px-2 py-0.5 rounded flex items-center gap-3 transition-colors ${
                    lIdx === currentLine
                      ? 'bg-indigo-950/80 border-l-2 border-indigo-400 text-cyan-300 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 select-none w-4 text-right text-[10px]">{lIdx + 1}</span>
                  <span className="whitespace-pre">{line}</span>
                  {lIdx === 4 && generatorStatus === 'GEN_SUSPENDED' && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded ml-auto">
                      SUSPENDED (yield)
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Produced Lazy Stream Pipeline */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <span className="text-xs font-semibold text-emerald-300">
                  Lazy Evaluation Stream (Memory: 1 item at a time)
                </span>
                <Badge variant="cyan" size="sm">{yieldedStream.length}/4 Emitted</Badge>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-3">
                {yieldedStream.length === 0 ? (
                  <div className="text-xs text-slate-500 italic text-center w-full py-4">
                    Click next(stream) to pull items through the pipeline.
                  </div>
                ) : (
                  yieldedStream.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 shrink-0 animate-in fade-in slide-in-from-left duration-300"
                    >
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-center shadow-lg shadow-emerald-500/10">
                        <span className="text-[9px] text-slate-400 block font-mono">yield #{idx + 1}</span>
                        <span className="text-base font-bold text-emerald-300 font-mono">{item.val}</span>
                      </div>
                      {idx < yieldedStream.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-emerald-500/60" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                Unlike lists, Python generators do not evaluate all items in memory. Each value is computed only when requested via <code className="text-cyan-300">next()</code>.
              </div>
            </div>
          </div>
        </>
      ) : (
        /* LEGB Scope Inspector */
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-semibold">Inspect Identifier:</span>
            {['count', 'config', 'DATABASE_URL', 'len', 'missing_var'].map((vName) => (
              <Button
                key={vName}
                size="sm"
                variant={legbQuery === vName ? 'primary' : 'secondary'}
                onClick={() => handleLegbLookup(vName)}
              >
                {vName}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            {[
              { tier: 'Local', desc: 'Active function execution body', ex: 'count = 42', icon: '1' },
              { tier: 'Enclosing', desc: 'Outer enclosing closure function', ex: 'config = {"debug": True}', icon: '2' },
              { tier: 'Global', desc: 'Module top-level declarations', ex: 'DATABASE_URL = "postgres://..."', icon: '3' },
              { tier: 'Built-in', desc: 'Python builtins (len, range, dict)', ex: 'len, print, Exception', icon: '4' },
            ].map((tierObj) => {
              const isMatch = legbFoundAt === tierObj.tier;
              return (
                <div
                  key={tierObj.tier}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isMatch
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-900/50 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-300">
                        {tierObj.icon}
                      </span>
                      {tierObj.tier} Scope
                    </span>
                    {isMatch && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                        FOUND
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{tierObj.desc}</p>
                  <div className="p-1.5 rounded bg-slate-950 font-mono text-[10px] text-cyan-300 truncate">
                    {tierObj.ex}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Execution Log */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Runtime Inspector Log
          </span>
          <p className="font-mono text-[11px] text-emerald-300">{logMessage}</p>
        </div>
      </div>
    </div>
  );
};
