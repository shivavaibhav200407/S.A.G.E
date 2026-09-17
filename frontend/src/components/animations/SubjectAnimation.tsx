import React, { useState } from 'react';
import { JavaMemoryAnimation } from './JavaMemoryAnimation';
import { PythonGeneratorAnimation } from './PythonGeneratorAnimation';
import { DsaAlgorithmAnimation } from './DsaAlgorithmAnimation';
import { SystemDesignAnimation } from './SystemDesignAnimation';
import { NeuralNetworkAnimation } from './NeuralNetworkAnimation';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SubjectAnimationProps {
  topic?: string;
  domain?: string;
}

export const SubjectAnimation: React.FC<SubjectAnimationProps> = ({ topic = '', domain = '' }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Determine which subject animation best fits the active topic and domain
  const getActiveSubject = (): 'java' | 'python' | 'dsa' | 'system_design' | 'ml' => {
    const tLower = (topic || '').toLowerCase();
    const dLower = (domain || '').toLowerCase();

    // 1. Java check
    if (dLower === 'java' || tLower.includes('java') || tLower.includes('jvm') || tLower.includes('string pool') || tLower.includes('hashmap') || tLower.includes('oop')) {
      return 'java';
    }

    // 2. Python check
    if (dLower === 'python' || tLower.includes('python') || tLower.includes('generator') || tLower.includes('decorator') || tLower.includes('scope') || tLower.includes('legb')) {
      return 'python';
    }

    // 3. System Design & Cloud check
    if (dLower === 'cloud_devops' || dLower === 'cn' || dLower === 'os' || tLower.includes('cloud') || tLower.includes('docker') || tLower.includes('kubernetes') || tLower.includes('microservice') || tLower.includes('network') || tLower.includes('load balancer') || tLower.includes('cache')) {
      return 'system_design';
    }

    // 4. ML / DL / AI / RAG check
    if (dLower === 'ml_dl' || dLower === 'rag_ai' || dLower === 'ml' || dLower === 'dl' || tLower.includes('neural') || tLower.includes('deep learning') || tLower.includes('transformer') || tLower.includes('embedding') || tLower.includes('vector') || tLower.includes('model')) {
      return 'ml';
    }

    // 5. Default to DSA Algorithm (Binary Search / Sorting / Two-Pointers)
    return 'dsa';
  };

  const subjectType = getActiveSubject();

  return (
    <div className="space-y-3">
      {/* Visualizer Toggle Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Interactive Pedagogical Visualizer
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
            {subjectType.toUpperCase()} DOMAIN
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand Simulation'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Rendered Subject Visualizer Component */}
      {isExpanded && (
        <div className="transition-all duration-300">
          {subjectType === 'java' && <JavaMemoryAnimation />}
          {subjectType === 'python' && <PythonGeneratorAnimation />}
          {subjectType === 'dsa' && <DsaAlgorithmAnimation />}
          {subjectType === 'system_design' && <SystemDesignAnimation />}
          {subjectType === 'ml' && <NeuralNetworkAnimation />}
        </div>
      )}
    </div>
  );
};
