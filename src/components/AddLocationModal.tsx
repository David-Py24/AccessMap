/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { CategoryType, LocationPin, LocationTag, Review } from '../types/accessibility';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  X,
  MapPin,
  Locate,
  Star,
  Plus,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Upload,
} from 'lucide-react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords: { lat: number; lng: number } | null;
  initialTags?: string[];
  initialPhotoUrl?: string;
  initialAiSummary?: string;
  initialAiBarriers?: string[];
  onSaveLocation: (newPin: LocationPin) => void;
  onOpenStorefrontScanner: () => void;
}

const CATEGORIES: CategoryType[] = [
  'Shopping',
  'Dining & Cafe',
  'Healthcare',
  'Education',
  'Public Space',
  'Hotel & Lodging',
  'Service',
  'Other',
];

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  initialCoords,
  initialTags = [],
  initialPhotoUrl,
  initialAiSummary,
  initialAiBarriers,
  onSaveLocation,
  onOpenStorefrontScanner,
}) => {
  const { announce } = useA11y();

  // Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 8.4822, lng: 124.6473 }
  );

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Dining & Cafe');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [initialOverallRating, setInitialOverallRating] = useState(4);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl || '');

  // Tag selection and 1-5 star ratings
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [tagRatings, setTagRatings] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    initialTags.forEach((t) => {
      init[t] = 5;
    });
    return init;
  });

  // Custom tag input
  const [customTagInput, setCustomTagInput] = useState('');
  const [customTagsList, setCustomTagsList] = useState<string[]>([]);

  // GPS locating state
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      announce('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    announce('Detecting your GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        announce('Pin placed at your current coordinates.');
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        announce('Unable to detect location. Using Cagayan de Oro downtown default.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
      const nextRatings = { ...tagRatings };
      delete nextRatings[tagName];
      setTagRatings(nextRatings);
    } else {
      setSelectedTags([...selectedTags, tagName]);
      setTagRatings({ ...tagRatings, [tagName]: 4 });
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!customTagsList.includes(trimmed) && !STANDARD_ACCESSIBILITY_TAGS.includes(trimmed as any)) {
      setCustomTagsList([...customTagsList, trimmed]);
      setSelectedTags([...selectedTags, trimmed]);
      setTagRatings({ ...tagRatings, [trimmed]: 4 });
      setCustomTagInput('');
      announce(`Added custom accessibility tag: ${trimmed}`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
      announce('Storefront photo attached.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      announce('Please enter the place name.');
      return;
    }

    if (selectedTags.length === 0) {
      announce('Please select at least one accessibility tag for this location.');
      return;
    }

    // Build LocationTag items
    const locationTags: LocationTag[] = selectedTags.map((tName) => {
      const ratingVal = tagRatings[tName] || initialOverallRating;
      const isFromAI = Boolean(initialAiSummary && initialTags.includes(tName));
      return {
        name: tName,
        rating: ratingVal,
        ratingCount: 1,
        confirmations: 1, // User adding it counts as first confirmation
        disputes: 0,
        isAiSuggested: isFromAI,
      };
    });

    const newId = `pin-${Date.now()}`;
    const initialReview: Review = {
      id: `rev-${Date.now()}`,
      authorName: authorName.trim() || 'Community Member',
      rating: initialOverallRating,
      comment: comment.trim() || `Added new accessible pin for ${name.trim()}.`,
      date: new Date().toISOString().split('T')[0],
      tagRatings,
      photos: photoUrl ? [photoUrl] : [],
    };

    const newPin: LocationPin = {
      id: newId,
      name: name.trim(),
      category,
      address: address.trim() || 'Cagayan de Oro City',
      lat: coords.lat,
      lng: coords.lng,
      averageRating: initialOverallRating,
      totalReviews: 1,
      tags: locationTags,
      photos: photoUrl ? [photoUrl] : [],
      reviews: [initialReview],
      description: description.trim() || undefined,
      aiSummary: initialAiSummary,
      aiBarriers: initialAiBarriers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLocation(newPin);
    announce(`Location ${newPin.name} successfully added to AccessMap!`);
    onClose();
  };

  const allAvailableTags = [...STANDARD_ACCESSIBILITY_TAGS, ...customTagsList];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add an accessible location pin"
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Add New Accessible Location
            </h2>
            <p className="text-xs text-slate-500">
              Drop a pin, rate accessibility features, or scan storefront with AI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close add location dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* AI Storefront Callout */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-sky-50 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Have a storefront photo?
                </h3>
                <p className="text-xs text-slate-600">
                  Let Gemini inspect ramps, steps, and doors to auto-fill accessibility tags.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenStorefrontScanner}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer transition-transform active:scale-95"
            >
              Analyze with AI
            </button>
          </div>

          {/* Section 1: Coordinates / Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Pin Location Coordinates
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 text-xs font-mono text-slate-700">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}</span>
              </div>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : ''}`} />
                <span>Use My Location</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              Tip: You can also drag the gold pin on the map or click anywhere on Cagayan de Oro.
            </p>
          </div>

          {/* Section 2: Place Info */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Place Information
            </label>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Place Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Centrio Ayala Mall, Cafe Demitasse, Barangay Hall"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Street Address or Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Corrales Ave, Divisoria, CDO"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Accessibility Tags & Individual Ratings */}
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
                    onClick={() => handleToggleTag(tagName)}
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
                      handleAddCustomTag(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
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
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setTagRatings({ ...tagRatings, [tName]: s })}
                            className="p-0.5 text-amber-500 cursor-pointer hover:scale-110"
                            aria-label={`Rate ${tName} ${s} stars`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                (tagRatings[tName] || 4) >= s
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-700 w-5 text-right">
                          {tagRatings[tName] || 4}★
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Initial Review & Photo */}
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
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setInitialOverallRating(star)}
                      className="p-1 text-amber-500 hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= initialOverallRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
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
                  onChange={(e) => setAuthorName(e.target.value)}
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
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Mention entrance doors, ramp condition, restrooms, sensory environment, assistance..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optional Storefront / Entrance Photo
                </label>
                {photoUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={photoUrl}
                      alt="Uploaded storefront"
                      className="w-20 h-16 object-cover rounded-xl border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Upload entrance photo from your device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <span>Pin Location on AccessMap</span>
          </button>
        </div>
      </div>
    </div>
  );
};
