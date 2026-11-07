/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../../prompts/storefrontPrompt';
import { getTagIcon } from '../../utils/tagHelpers';
import { StarRating } from '../ui/StarRating';
import { Check, Plus } from 'lucide-react';

interface TagRatingSectionProps {
  selectedTags: string[];
  tagRatings: Record<string, number>;
  onToggleTag: (tagName: string) => void;
  onRateTag: (tagName: string, rating: number) => void;
  onAddCustomTag: (customTag: string) => void;
  customTagsList: string[];
}

export const TagRatingSection: React.FC<TagRatingSectionProps> = ({
  selectedTags,
  tagRatings,
  onToggleTag,
  onRateTag,
  onAddCustomTag,
  customTagsList,
}) => {
  const [customTagInput, setCustomTagInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    onAddCustomTag(trimmed);
    setCustomTagInput('');
  };

  const allAvailableTags = [...STANDARD_ACCESSIBILITY_TAGS, ...customTagsList];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          3. Accessibility Tags & Feature Ratings <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-slate-500">
          {selectedTags.length} selected
        </span>
      </div>

      {/* Tag Selection Chips */}
      <div className="flex flex-wrap gap-2">
        {allAvailableTags.map((tagName) => {
          const isSelected = selectedTags.includes(tagName);
          return (
            <button
              key={tagName}
              type="button"
              onClick={() => onToggleTag(tagName)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {getTagIcon(tagName)}
              <span>{tagName}</span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Custom Tag Input */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            placeholder="Suggest a custom accessibility tag (e.g. Tactile sidewalk, Service dog welcome)..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubmit(e);
              }
            }}
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </button>
        </div>
      </div>

      {/* Rate Selected Tags 1-5 Stars */}
      {selectedTags.length > 0 && (
        <div className="space-y-2 pt-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-800 block">
            Rate each selected feature (1–5 Stars):
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedTags.map((tName) => (
              <div
                key={tName}
                className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200"
              >
                <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[260px]">
                  {getTagIcon(tName)}
                  <span className="font-semibold text-slate-800 truncate">{tName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <StarRating
                    value={tagRatings[tName] || 4}
                    onChange={(val) => onRateTag(tName, val)}
                    size="md"
                  />
                  <span className="text-xs font-bold text-slate-700 w-6 text-right">
                    {tagRatings[tName] || 4}★
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

