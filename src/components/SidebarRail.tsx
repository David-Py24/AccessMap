/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useA11y, TextSize } from '../context/A11yContext';
import {
  Accessibility,
  MapPin,
  Sparkles,
  PlusCircle,
  Eye,
  Type,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SidebarRailProps {
  activeTab: 'map' | 'saved';
  onTabChange: (tab: 'map' | 'saved') => void;
  onOpenAIAnalyzer: () => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onToggleFilterPanel: () => void;
  isFilterPanelOpen: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  onOpenAIAnalyzer,
  onOpenAddModal,
  onResetData,
  onToggleFilterPanel,
  isFilterPanelOpen,
}) => {
  const { textSize, setTextSize, highContrast, toggleHighContrast, announce } = useA11y();

  const handleCycleTextSize = () => {
    let next: TextSize = 'normal';
    if (textSize === 'normal') next = 'large';
    else if (textSize === 'large') next = 'extra-large';
    else next = 'normal';

    setTextSize(next);
    announce(`Text scale changed to ${next}`);
  };

  return (
    <aside
      aria-label="App Navigation Rail"
      className="w-16 sm:w-[72px] bg-white border-r border-slate-200 flex flex-col items-center justify-between py-4 sm:py-5 z-40 shrink-0 select-none shadow-xs"
    >
      {/* Top Brand Squircle (Matching Reference App Logo) */}
      <div className="flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={() => onTabChange('map')}
          className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="AccessMap Cagayan de Oro"
          aria-label="AccessMap Home"
        >
          <Accessibility className="w-6 h-6 text-white group-hover:rotate-6 transition-transform" />
        </button>

        {/* Primary Navigation Icons */}
        <nav className="flex flex-col items-center gap-3" aria-label="Main menu">
          {/* Map & Places (Active) */}
          <button
            type="button"
            onClick={() => onTabChange('map')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Explore Map & Locations"
            aria-label="Explore Map and Locations"
          >
            <MapPin className="w-5 h-5" />
          </button>

          {/* AI Storefront Analyzer */}
          <button
            type="button"
            onClick={onOpenAIAnalyzer}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer relative group"
            title="AI Storefront Photo Scanner (Gemini Vision)"
            aria-label="Open AI Storefront Photo Scanner"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform text-indigo-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
          </button>

          {/* Add Pin */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer group"
            title="Add New Location Pin"
            aria-label="Add New Location Pin"
          >
            <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Toggle Filters Panel */}
          <button
            type="button"
            onClick={onToggleFilterPanel}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isFilterPanelOpen
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
            }`}
            title="Toggle Accessibility Filters"
            aria-label="Toggle Accessibility Filters"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Bottom Accessibility & Settings Tools */}
      <div className="flex flex-col items-center gap-3">
        {/* Text Scaling Toggle */}
        <button
          type="button"
          onClick={handleCycleTextSize}
          className="w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-50"
          title={`Cycle text scale (current: ${textSize})`}
          aria-label={`Cycle text scale, currently ${textSize}`}
        >
          <Type className="w-4 h-4" />
          <span className="text-[9px] font-bold text-sky-600 font-mono leading-none mt-0.5">
            {textSize === 'normal' ? '1x' : textSize === 'large' ? '1.15x' : '1.3x'}
          </span>
        </button>

        {/* High Contrast Mode Toggle */}
        <button
          type="button"
          onClick={toggleHighContrast}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            highContrast
              ? 'bg-amber-400 text-black border-amber-500 font-bold'
              : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
          title={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
          aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Reset Demo Data */}
        <button
          type="button"
          onClick={onResetData}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all cursor-pointer"
          title="Reset to Cagayan de Oro seed data"
          aria-label="Reset demo data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
