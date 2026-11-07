/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  labelSuffix?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  size = 'md',
  showLabel = false,
  labelSuffix = '',
  className = '',
}) => {
  const isInteractive = Boolean(onChange);
  const iconSize = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const isFilled = star <= Math.round(value);

        if (isInteractive && onChange) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-0.5 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
              aria-label={`Rate ${star} of ${max} stars`}
            >
              <Star
                className={`${iconSize} ${
                  isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`}
              />
            </button>
          );
        }

        return (
          <Star
            key={star}
            className={`${iconSize} ${
              isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
            }`}
          />
        );
      })}

      {showLabel && (
        <span className="text-xs font-bold text-slate-700 ml-1">
          {value > 0 ? value.toFixed(size === 'sm' ? 1 : 0) : '–'}
          {labelSuffix}
        </span>
      )}
    </div>
  );
};

