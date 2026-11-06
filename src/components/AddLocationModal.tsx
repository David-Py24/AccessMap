/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { CategoryType, LocationPin, LocationTag, Review } from '../types/accessibility';
import { useA11y } from '../context/A11yContext';
import { Modal } from './ui/Modal';
import { CoordinatesField } from './add-location/CoordinatesField';
import { PlaceInfoFields } from './add-location/PlaceInfoFields';
import { TagRatingSection } from './add-location/TagRatingSection';
import { ReviewDetailsSection } from './add-location/ReviewDetailsSection';
import { Sparkles } from 'lucide-react';

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
  const [customTagsList, setCustomTagsList] = useState<string[]>([]);

  // GPS locating state
  const [isLocating, setIsLocating] = useState(false);

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

  const handleRateTag = (tagName: string, rating: number) => {
    setTagRatings((prev) => ({ ...prev, [tagName]: rating }));
  };

  const handleAddCustomTag = (trimmed: string) => {
    const isStandard = (STANDARD_ACCESSIBILITY_TAGS as readonly string[]).includes(trimmed);
    if (!customTagsList.includes(trimmed) && !isStandard) {
      setCustomTagsList([...customTagsList, trimmed]);
      setSelectedTags([...selectedTags, trimmed]);
      setTagRatings({ ...tagRatings, [trimmed]: 4 });
      announce(`Added custom accessibility tag: ${trimmed}`);
    }
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
        confirmations: 1,
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

  const modalFooter = (
    <>
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
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Accessible Location"
      subtitle="Drop a pin, rate accessibility features, or scan storefront with AI"
      footer={modalFooter}
    >
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <CoordinatesField
          coords={coords}
          isLocating={isLocating}
          onUseMyLocation={handleUseMyLocation}
        />

        <PlaceInfoFields
          name={name}
          onNameChange={setName}
          category={category}
          onCategoryChange={setCategory}
          address={address}
          onAddressChange={setAddress}
        />

        <TagRatingSection
          selectedTags={selectedTags}
          tagRatings={tagRatings}
          onToggleTag={handleToggleTag}
          onRateTag={handleRateTag}
          onAddCustomTag={handleAddCustomTag}
          customTagsList={customTagsList}
        />

        <ReviewDetailsSection
          initialOverallRating={initialOverallRating}
          onOverallRatingChange={setInitialOverallRating}
          authorName={authorName}
          onAuthorNameChange={setAuthorName}
          comment={comment}
          onCommentChange={setComment}
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
        />
      </form>
    </Modal>
  );
};
