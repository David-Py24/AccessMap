/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface AiAnalysisSectionProps {
  summary?: string;
  barriers?: string[];
}

export const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({
  summary,
  barriers,
}) => {
  if (!summary && (!barriers || barriers.length === 0)) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 p-4 rounded-2xl border border-indigo-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            AI Storefront Visual Analysis
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
          Gemini Vision
        </span>
      </div>

      {summary && (
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {summary}
        </p>
      )}

      {barriers && barriers.length > 0 && (
        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reported Potential Barriers</span>
          </div>
          <ul className="text-xs text-rose-700 list-disc list-inside space-y-0.5">
            {barriers.map((barrier, i) => (
              <li key={i}>{barrier}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[11px] text-slate-600 italic">
        Note: AI visual assessments are photographic estimates. Community verification is recommended.
      </div>
    </div>
  );
};

