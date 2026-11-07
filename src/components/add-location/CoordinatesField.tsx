/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Locate } from 'lucide-react';

interface CoordinatesFieldProps {
  coords: { lat: number; lng: number };
  isLocating: boolean;
  onUseMyLocation: () => void;
}

export const CoordinatesField: React.FC<CoordinatesFieldProps> = ({
  coords,
  isLocating,
  onUseMyLocation,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
        1. Pin Location Coordinates
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-mono text-slate-700">
          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
          </span>
        </div>
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={isLocating}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Locate
            className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : ''}`}
          />
          <span>Use My Location</span>
        </button>
      </div>
      <p className="text-[11px] text-slate-600">
        Tip: You can also drag the gold pin on the map or click anywhere on Cagayan de Oro.
      </p>
    </div>
  );
};

