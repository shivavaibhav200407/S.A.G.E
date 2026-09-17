import React, { useState } from 'react';
import { Brain, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const NeuralNetworkAnimation: React.FC = () => {
  const [epoch, setEpoch] = useState<number>(1);
  const [loss, setLoss] = useState<number>(0.642);
  const [accuracy, setAccuracy] = useState<number>(68.5);
  const [isPropagating, setIsPropagating] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'input' | 'hidden' | 'output' | 'none'>('none');
  const [logText, setLogText] = useState<string>(
    'Multilayer Perceptron initialized: 3 inputs, 4 hidden ReLU neurons, Softmax output.'
  );

  const handleForwardPass = () => {
    setIsPropagating(true);
    setActiveLayer('input');
    setLogText('Layer 1 (Input): Fed normalized feature vector [0.85, 0.42, 0.91].');

    setTimeout(() => {
      setActiveLayer('hidden');
      setLogText('Layer 2 (Hidden): Applied affine transform z = Wx + b and ReLU activation max(0, z).');
    }, 400);

    setTimeout(() => {
      setActiveLayer('output');
      const newLoss = Math.max(0.045, loss * 0.82);
      const newAcc = Math.min(99.2, accuracy + (100 - accuracy) * 0.18);
      setLoss(parseFloat(newLoss.toFixed(3)));
      setAccuracy(parseFloat(newAcc.toFixed(1)));
      setEpoch((e) => e + 1);
      setLogText(`Layer 3 (Output): Softmax cross-entropy loss computed: ${newLoss.toFixed(3)}. Backpropagation updated weights.`);
      setIsPropagating(false);
    }, 800);
  };

  const handleReset = () => {
    setEpoch(1);
    setLoss(0.642);
    setAccuracy(68.5);
    setActiveLayer('none');
    setLogText('Model parameters reset to initial He Normal weight distribution.');
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/90 p-5 space-y-4 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Deep Learning & Neural Network Activation Flow</span>
              <Badge variant="cyan" size="sm">PyTorch / Autograd</Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Forward propagation, ReLU activation, Softmax output & gradient descent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-slate-400">Epoch: <strong className="text-white">{epoch}</strong></span>
          <span className="text-slate-400">Loss: <strong className="text-rose-400">{loss}</strong></span>
          <span className="text-slate-400">Acc: <strong className="text-emerald-400">{accuracy}%</strong></span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="primary"
          onClick={handleForwardPass}
          disabled={isPropagating}
          icon={<Play className="w-3.5 h-3.5" />}
        >
          {isPropagating ? 'Propagating...' : 'Forward Pass + Backprop'}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleReset} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Reset Model
        </Button>
      </div>

      {/* Neural Layers Visualizer */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#090d16] flex items-center justify-around relative min-h-[160px]">
        {/* Layer 1: Input */}
        <div className="flex flex-col items-center space-y-3 z-10">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Inputs (3)</span>
          {[1, 2, 3].map((node) => (
            <div
              key={node}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                activeLayer === 'input'
                  ? 'bg-cyan-500 text-black ring-4 ring-cyan-500/30 scale-110 shadow-lg shadow-cyan-500/50'
                  : 'bg-slate-800 border border-slate-700 text-cyan-300'
              }`}
            >
              x{node}
            </div>
          ))}
        </div>

        {/* Synapse Connection Arrow */}
        <div className="text-slate-700 font-mono text-xs select-none">⟶</div>

        {/* Layer 2: Hidden */}
        <div className="flex flex-col items-center space-y-2 z-10">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Hidden ReLU (4)</span>
          {[1, 2, 3, 4].map((node) => (
            <div
              key={node}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                activeLayer === 'hidden'
                  ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-800 border border-slate-700 text-indigo-300'
              }`}
            >
              h{node}
            </div>
          ))}
        </div>

        {/* Synapse Connection Arrow */}
        <div className="text-slate-700 font-mono text-xs select-none">⟶</div>

        {/* Layer 3: Output */}
        <div className="flex flex-col items-center space-y-4 z-10">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Output (Softmax)</span>
          {[1, 2].map((node) => (
            <div
              key={node}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                activeLayer === 'output'
                  ? 'bg-emerald-500 text-black ring-4 ring-emerald-500/30 scale-110 shadow-lg shadow-emerald-500/50'
                  : 'bg-slate-800 border border-slate-700 text-emerald-300'
              }`}
            >
              y{node}
            </div>
          ))}
        </div>
      </div>

      {/* Live Log */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 p-2.5 text-xs text-slate-300 flex items-start gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Training & Activation Log
          </span>
          <p className="font-mono text-[11px] text-emerald-300">{logText}</p>
        </div>
      </div>
    </div>
  );
};
