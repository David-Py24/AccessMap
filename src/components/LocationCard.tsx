/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { getRatingColor, calculateDistanceKm } from '../utils/storage';
import { getTagIcon } from '../utils/tagHelpers';
import { ShieldCheck, Sparkles, Star, MapPin } from 'lucide-react';

interface LocationCardProps {
  location: LocationPin;
  isSelected: boolean;
  onSelect: (loc: LocationPin) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
  userCoords,
}) => {
  const ratingMeta = getRatingColor(location.averageRating, location.totalReviews);

  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, location.lat, location.lng)
    : null;

  return (
    <article
      onClick={() => onSelect(location)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(location);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${location.name}, ${location.category}, rated ${
        location.averageRating > 0 ? location.averageRating.toFixed(1) : 'unrated'
      } stars. Click to open details.`}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer text-left focus:outline-2 focus:outline-sky-600 ${
        isSelected
          ? 'bg-sky-50/60 border-sky-400 shadow-md ring-2 ring-sky-300'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Category & Distance */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {location.category}
            </span>
            {distanceKm !== null && (
              <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {distanceKm} km away
              </span>
            )}
          </div>

          {/* Place Name */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
            {location.name}
          </h3>

          <p className="text-xs text-slate-500 truncate mt-0.5">
            {location.address}
          </p>
        </div>

        {/* Rating Badge */}
        <div
          className={`shrink-0 px-2.5 py-1 rounded-xl flex items-center gap-1 font-bold text-xs ${ratingMeta.bgClass} text-white shadow-xs`}
          title={`Average Accessibility: ${ratingMeta.label}`}
        >
          <Star className="w-3 h-3 fill-white" />
          <span>{location.averageRating > 0 ? location.averageRating.toFixed(1) : 'New'}</span>
        </div>
      </div>

      {/* Tags preview */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {location.tags.slice(0, 3).map((tag) => {
          const isVerified = tag.confirmations >= 2 && tag.confirmations > tag.disputes;
          return (
            <span
              key={tag.name}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : tag.isAiSuggested
                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {getTagIcon(tag.name)}
              <span className="truncate max-w-[130px]">{tag.name}</span>
              {isVerified && <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />}
              {tag.isAiSuggested && <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />}
            </span>
          );
        })}
        {location.tags.length > 3 && (
          <span className="text-[11px] text-slate-400 self-center font-medium">
            +{location.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Barriers snippet if any */}
      {location.aiBarriers && location.aiBarriers.length > 0 && (
        <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 truncate">
          ⚠️ Note: {location.aiBarriers[0]}
        </div>
      )}
    </article>
  );
};
