/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StarRating } from '../ui/StarRating';
import { PhotoUploader } from '../ui/PhotoUploader';

interface ReviewDetailsSectionProps {
  initialOverallRating: number;
  onOverallRatingChange: (val: number) => void;
  authorName: string;
  onAuthorNameChange: (val: string) => void;
  comment: string;
  onCommentChange: (val: string) => void;
  photoUrl: string;
  onPhotoChange: (val: string) => void;
}

export const ReviewDetailsSection: React.FC<ReviewDetailsSectionProps> = ({
  initialOverallRating,
  onOverallRatingChange,
  authorName,
  onAuthorNameChange,
  comment,
  onCommentChange,
  photoUrl,
  onPhotoChange,
}) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
        4. Overall Accessibility Rating & Details
      </label>

      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Overall Score (1–5 Stars)
          </label>
          <div className="flex items-center gap-2">
            <StarRating
              value={initialOverallRating}
              onChange={onOverallRatingChange}
              size="lg"
            />
            <span className="text-sm font-bold text-slate-800 ml-2">
              {initialOverallRating} / 5 Stars
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Your Name or Display Handle
          </label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => onAuthorNameChange(e.target.value)}
            placeholder="e.g. Alex B."
            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Accessibility Notes / Review Comments
          </label>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Mention entrance doors, ramp condition, restrooms, sensory environment, assistance..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
          />
        </div>

        <PhotoUploader
          value={photoUrl}
          onChange={onPhotoChange}
          label="Optional Storefront / Entrance Photo"
          helperText="Upload entrance photo to help community members verify accessibility"
        />
      </div>
    </div>
  );
};

