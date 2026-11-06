/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, LocationTag, Review } from '../types/accessibility';
import { getRatingColor } from '../utils/storage';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  X,
  Star,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  MessageSquare,
  PlusCircle,
  Share2,
  Calendar,
  Send,
} from 'lucide-react';

interface LocationDetailDrawerProps {
  location: LocationPin | null;
  onClose: () => void;
  onVoteTag: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAddReview: (pinId: string, review: Omit<Review, 'id' | 'date'>) => void;
  onRunAIScanOnPin: (location: LocationPin) => void;
}

export const LocationDetailDrawer: React.FC<LocationDetailDrawerProps> = ({
  location,
  onClose,
  onVoteTag,
  onAddReview,
  onRunAIScanOnPin,
}) => {
  const { announce } = useA11y();
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [comment, setComment] = useState('');
  const [tagRatings, setTagRatings] = useState<Record<string, number>>({});
  const [copySuccess, setCopySuccess] = useState(false);

  if (!location) return null;

  const ratingMeta = getRatingColor(location.averageRating, location.totalReviews);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) {
      announce('Please provide your name and a brief comment');
      return;
    }

    onAddReview(location.id, {
      authorName: authorName.trim(),
      rating: newRating,
      comment: comment.trim(),
      tagRatings,
    });

    setAuthorName('');
    setComment('');
    setTagRatings({});
    setIsAddingReview(false);
    announce('Thank you! Your accessibility review has been submitted.');
  };

  const handleShare = () => {
    const shareText = `Check out the accessibility ratings for ${location.name} in Cagayan de Oro on AccessMap!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
      setCopySuccess(true);
      announce('Location details copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Accessibility details for ${location.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[520px] bg-white shadow-2xl z-[1000] flex flex-col border-l border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {location.category}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {location.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Share location"
            aria-label="Share location"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close details"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="bg-emerald-600 text-white text-xs py-1.5 text-center font-medium">
          ✓ Copied location details to clipboard!
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(location.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
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

        {/* AI Storefront Summary & Barriers (if present) */}
        {(location.aiSummary || (location.aiBarriers && location.aiBarriers.length > 0)) && (
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

            {location.aiSummary && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {location.aiSummary}
              </p>
            )}

            {location.aiBarriers && location.aiBarriers.length > 0 && (
              <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Reported Potential Barriers</span>
                </div>
                <ul className="text-xs text-rose-700 list-disc list-inside space-y-0.5">
                  {location.aiBarriers.map((barrier, i) => (
                    <li key={i}>{barrier}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-[11px] text-slate-600 italic">
              Note: AI visual assessments are photographic estimates. Community verification is recommended.
            </div>
          </div>
        )}

        {/* Accessibility Tags with Community Verification & Voting */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Accessibility Features & Community Verification
            </h3>
            <span className="text-xs text-slate-400">
              {location.tags.length} reported tags
            </span>
          </div>

          <div className="space-y-2.5">
            {location.tags.map((tag) => {
              const isVerified = tag.confirmations >= 2 && tag.confirmations > tag.disputes;
              return (
                <div
                  key={tag.name}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
                        {getTagIcon(tag.name)}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {tag.name}
                      </span>

                      {/* Community verified badge */}
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Community verified</span>
                        </span>
                      )}

                      {/* AI-suggested badge */}
                      {tag.isAiSuggested && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>AI-suggested</span>
                        </span>
                      )}
                    </div>

                    {/* Tag rating preview */}
                    {tag.rating > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {tag.rating.toFixed(1)}★
                        </span>
                        <span>({tag.ratingCount} ratings)</span>
                      </div>
                    )}
                  </div>

                  {/* Confirm & Dispute Voting Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {/* Confirm Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onVoteTag(location.id, tag.name, 'confirm');
                        announce(`You voted to confirm ${tag.name}`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                        tag.userVoted === 'confirm'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Confirm this tag is accurate"
                      aria-label={`Confirm tag ${tag.name}. Currently has ${tag.confirmations} confirmations.`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                      <span className="font-mono text-[11px] opacity-80">
                        ({tag.confirmations})
                      </span>
                    </button>

                    {/* Dispute Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onVoteTag(location.id, tag.name, 'dispute');
                        announce(`You voted to dispute ${tag.name}`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                        tag.userVoted === 'dispute'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title="Dispute this tag (inaccurate or barrier exists)"
                      aria-label={`Dispute tag ${tag.name}. Currently has ${tag.disputes} disputes.`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Dispute</span>
                      <span className="font-mono text-[11px] opacity-80">
                        ({tag.disputes})
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Community Reviews Section */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Community Reviews & Notes ({location.reviews.length})
              </h3>
            </div>
            {!isAddingReview && (
              <button
                type="button"
                onClick={() => setIsAddingReview(true)}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Write Review</span>
              </button>
            )}
          </div>

          {/* Add Review Form */}
          {isAddingReview && (
            <form
              onSubmit={handleReviewSubmit}
              className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-3.5 animate-fade-in"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                Add Your Accessibility Experience
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Name or Handle
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Maria S."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Overall Accessibility Rating (1–5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`${star} stars`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {newRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Optional tag ratings */}
              {location.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Rate Specific Features (Optional):
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-slate-200">
                    {location.tags.map((tag) => (
                      <div key={tag.name} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[200px] text-slate-700">{tag.name}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setTagRatings({ ...tagRatings, [tag.name]: s })
                              }
                              className="text-amber-500 cursor-pointer"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  (tagRatings[tag.name] || 0) >= s
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Detailed Accessibility Comment
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about ramps, door width, bathroom grab bars, sensory conditions, staff assistance..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingReview(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Reviews List */}
          <div className="space-y-3">
            {location.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No written reviews yet. Be the first to share an accessibility review!
              </p>
            ) : (
              location.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{rev.authorName}</span>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(rev.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">
                      {rev.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onRunAIScanOnPin(location)}
          className="flex-1 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Scan Storefront Photo</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
