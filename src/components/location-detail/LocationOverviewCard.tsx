/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../../types/accessibility';
import { getRatingColor } from '../../utils/storage';
import { StarRating } from '../ui/StarRating';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationOverviewCardProps {
  location: LocationPin;
}

export const LocationOverviewCard: React.FC<LocationOverviewCardProps> = ({ location }) => {
  const ratingMeta = getRatingColor(location.averageRating, location.totalReviews);

  return (
    <div className="space-y-4">
      {/* Photos Carousel / Thumbnail */}
      {location.photos && location.photos.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative aspect-video bg-slate-100">
          <img
            src={location.photos[0]}
            alt={`Entrance view of ${location.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-xs rounded-lg font-medium">
            Verified Entrance View
          </div>
        </div>
      )}

      {/* Address & Navigation */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-700">
            <p className="font-medium text-slate-900">{location.address}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-sky-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
        >
          <span>Directions</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Overall Accessibility Score Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">
            Overall Accessibility Rating
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {location.averageRating > 0 ? location.averageRating.toFixed(1) : '–'}
            </span>
            <span className="text-sm text-slate-500">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-amber-500">
            <StarRating value={location.averageRating} size="sm" />
            <span className="text-xs text-slate-500 ml-1.5">
              ({location.totalReviews} {location.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        <div
          className={`px-3 py-2 rounded-xl text-center font-bold text-xs ${ratingMeta.bgClass} text-white shadow-xs max-w-[140px]`}
        >
          {ratingMeta.label}
        </div>
      </div>
    </div>
  );
};

