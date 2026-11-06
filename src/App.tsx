/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { A11yProvider, useA11y } from './context/A11yContext';
import { Navbar, ViewMode } from './components/Navbar';
import { FilterBar, MatchMode, SortOption } from './components/FilterBar';
import { MapView } from './components/MapView';
import { LocationCard } from './components/LocationCard';
import { LocationDetailDrawer } from './components/LocationDetailDrawer';
import { AddLocationModal } from './components/AddLocationModal';
import { AIStorefrontModal } from './components/AIStorefrontModal';
import {
  LocationPin,
  CategoryType,
  Review,
  StorefrontAnalysisResult,
  LocationTag,
} from './types/accessibility';
import {
  loadLocations,
  saveLocations,
  resetToSeedData,
  getStoredUserVotes,
  saveStoredUserVote,
  calculateDistanceKm,
} from './utils/storage';
import {
  MapPin,
  Sparkles,
  Plus,
  ShieldCheck,
  RotateCcw,
  Info,
} from 'lucide-react';

function AccessMapApp() {
  const { announce } = useA11y();

  // Core locations state
  const [locations, setLocations] = useState<LocationPin[]>(() => {
    const loaded = loadLocations();
    const storedVotes = getStoredUserVotes();
    // Hydrate user votes
    return loaded.map((loc) => ({
      ...loc,
      tags: loc.tags.map((tag) => {
        const key = `${loc.id}__${tag.name}`;
        return {
          ...tag,
          userVoted: storedVotes[key] || undefined,
        };
      }),
    }));
  });

  // Selected Location for details drawer
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<MatchMode>('and');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Add Location Flow State
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // AI Storefront Analyzer State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTargetLocation, setAiTargetLocation] = useState<LocationPin | null>(null);

  // Pre-filled data for new pin from AI Analyzer
  const [aiNewPinData, setAiNewPinData] = useState<{
    tags: string[];
    photoUrl?: string;
    summary?: string;
    barriers?: string[];
  } | null>(null);

  // Save locations to localStorage whenever modified
  const updateAndSaveLocations = (updater: (prev: LocationPin[]) => LocationPin[]) => {
    setLocations((prev) => {
      const next = updater(prev);
      saveLocations(next);
      return next;
    });
  };

  // Sync selectedLocation if it was updated in locations array
  useEffect(() => {
    if (selectedLocation) {
      const fresh = locations.find((l) => l.id === selectedLocation.id);
      if (fresh) setSelectedLocation(fresh);
    }
  }, [locations]);

  // Community Voting (Confirm / Dispute)
  const handleVoteTag = (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => {
    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== pinId) return loc;
        return {
          ...loc,
          tags: loc.tags.map((tag) => {
            if (tag.name !== tagName) return tag;

            let conf = tag.confirmations;
            let disp = tag.disputes;
            const prevVote = tag.userVoted;

            if (prevVote === vote) {
              // Toggling off the current vote
              if (vote === 'confirm') conf = Math.max(0, conf - 1);
              if (vote === 'dispute') disp = Math.max(0, disp - 1);
              saveStoredUserVote(pinId, tagName, null);
              return { ...tag, confirmations: conf, disputes: disp, userVoted: undefined };
            }

            // Switching vote or new vote
            if (prevVote === 'confirm') conf = Math.max(0, conf - 1);
            if (prevVote === 'dispute') disp = Math.max(0, disp - 1);

            if (vote === 'confirm') conf += 1;
            if (vote === 'dispute') disp += 1;

            saveStoredUserVote(pinId, tagName, vote);
            return { ...tag, confirmations: conf, disputes: disp, userVoted: vote };
          }),
        };
      })
    );
  };

  // Add Review
  const handleAddReview = (pinId: string, reviewInput: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewInput,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== pinId) return loc;

        const updatedReviews = [newReview, ...loc.reviews];
        const newTotalReviews = loc.totalReviews + 1;
        const totalRatingSum =
          loc.averageRating * loc.totalReviews + reviewInput.rating;
        const newAvg = Math.round((totalRatingSum / newTotalReviews) * 10) / 10;

        // Also update specific tag ratings if provided in the review
        const updatedTags = loc.tags.map((tag) => {
          if (reviewInput.tagRatings && reviewInput.tagRatings[tag.name]) {
            const given = reviewInput.tagRatings[tag.name];
            const prevCount = tag.ratingCount || 1;
            const updatedTagAvg =
              Math.round(((tag.rating * prevCount + given) / (prevCount + 1)) * 10) / 10;
            return {
              ...tag,
              rating: updatedTagAvg,
              ratingCount: prevCount + 1,
            };
          }
          return tag;
        });

        return {
          ...loc,
          totalReviews: newTotalReviews,
          averageRating: newAvg,
          reviews: updatedReviews,
          tags: updatedTags,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Apply AI Storefront tags to an existing location
  const handleApplyTagsToLocation = (
    locationId: string,
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult
  ) => {
    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;

        const existingTagNames = new Set(loc.tags.map((t) => t.name));
        const newTags: LocationTag[] = acceptedTags
          .filter((tName) => !existingTagNames.has(tName))
          .map((tName) => ({
            name: tName,
            rating: 4.5,
            ratingCount: 1,
            confirmations: 1,
            disputes: 0,
            isAiSuggested: true,
          }));

        const updatedPhotos =
          analysis.imagePreviewUrl && !loc.photos.includes(analysis.imagePreviewUrl)
            ? [analysis.imagePreviewUrl, ...loc.photos]
            : loc.photos;

        return {
          ...loc,
          tags: [...loc.tags, ...newTags],
          photos: updatedPhotos,
          aiSummary: analysis.summary,
          aiBarriers: analysis.possible_barriers,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Start new location pin flow pre-populated with AI scan findings
  const handleStartNewPinFromAnalysis = (
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult,
    photoDataUrl: string
  ) => {
    setAiNewPinData({
      tags: acceptedTags,
      photoUrl: photoDataUrl,
      summary: analysis.summary,
      barriers: analysis.possible_barriers,
    });
    setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
    setIsAddModalOpen(true);
  };

  // Save brand new location pin
  const handleSaveLocation = (newPin: LocationPin) => {
    updateAndSaveLocations((prev) => [newPin, ...prev]);
    setSelectedLocation(newPin);
    setIsAddingLocation(false);
    setNewPinCoords(null);
    setAiNewPinData(null);
  };

  // Filter & Search Logic
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    // Search query filter (matches name, address, category, or tag names)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q) ||
          loc.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((loc) => loc.category === selectedCategory);
    }

    // Accessibility tags filter (AND / OR match mode)
    if (selectedTags.length > 0) {
      if (matchMode === 'and') {
        result = result.filter((loc) => {
          const locTagNames = loc.tags.map((t) => t.name);
          return selectedTags.every((t) => locTagNames.includes(t));
        });
      } else {
        result = result.filter((loc) => {
          const locTagNames = loc.tags.map((t) => t.name);
          return selectedTags.some((t) => locTagNames.includes(t));
        });
      }
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((loc) => loc.averageRating >= minRating);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating_desc') {
        return b.averageRating - a.averageRating;
      }
      if (sortBy === 'rating_asc') {
        return a.averageRating - b.averageRating;
      }
      if (sortBy === 'reviews_desc') {
        return b.totalReviews - a.totalReviews;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'distance') {
        const refLat = userCoords ? userCoords.lat : 8.4822;
        const refLng = userCoords ? userCoords.lng : 124.6473;
        const distA = calculateDistanceKm(refLat, refLng, a.lat, a.lng);
        const distB = calculateDistanceKm(refLat, refLng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
    });

    return result;
  }, [
    locations,
    searchQuery,
    selectedCategory,
    selectedTags,
    matchMode,
    minRating,
    sortBy,
    userCoords,
  ]);

  const handleResetData = () => {
    if (window.confirm('Reset all AccessMap pins to initial Cagayan de Oro sample seed data?')) {
      const reset = resetToSeedData();
      setLocations(reset);
      setSelectedLocation(null);
      announce('AccessMap database reset to initial seed locations.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => {
          setIsAddingLocation(true);
          setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
          setIsAddModalOpen(true);
        }}
        onOpenAIAnalyzer={() => {
          setAiTargetLocation(null);
          setIsAIModalOpen(true);
        }}
        onResetData={handleResetData}
        totalLocations={locations.length}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTags={selectedTags}
        onToggleTag={(tag) => {
          setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
          );
        }}
        onClearTags={() => setSelectedTags([])}
        matchMode={matchMode}
        onMatchModeChange={setMatchMode}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalFiltered={filteredLocations.length}
        totalTotal={locations.length}
      />

      {/* Main Workspace Area (Split / Map / List) */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Left Side List View (Visible in 'split' or 'list' mode) */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <section
            aria-label="Location listings"
            className={`${
              viewMode === 'list' ? 'w-full' : 'w-full md:w-[420px] lg:w-[460px]'
            } h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 z-10`}
          >
            {/* Header info */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-800">
                {filteredLocations.length} Location{filteredLocations.length === 1 ? '' : 's'} Found
              </span>
              <button
                type="button"
                onClick={handleResetData}
                className="hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                title="Reset to Cagayan de Oro seed places"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>

            {/* Scrollable Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      No locations match current filters
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing selected accessibility tags or widening your search terms.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedTags([]);
                      setMinRating(0);
                    }}
                    className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    location={loc}
                    isSelected={selectedLocation?.id === loc.id}
                    onSelect={(selected) => {
                      setSelectedLocation(selected);
                      // On mobile list mode, switch to split or map to view pin
                      if (window.innerWidth < 768 && viewMode === 'list') {
                        setViewMode('split');
                      }
                    }}
                    userCoords={userCoords}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Right Side Map View (Visible in 'split' or 'map' mode) */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1 h-full relative">
            <MapView
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              isAddingLocation={isAddingLocation}
              newPinCoords={newPinCoords}
              onNewPinCoordsChange={(coords) => {
                setNewPinCoords(coords);
                if (isAddingLocation) {
                  setIsAddModalOpen(true);
                }
              }}
            />
          </div>
        )}

        {/* Location Detail Drawer (Slide-out panel) */}
        <LocationDetailDrawer
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onVoteTag={handleVoteTag}
          onAddReview={handleAddReview}
          onRunAIScanOnPin={(loc) => {
            setAiTargetLocation(loc);
            setIsAIModalOpen(true);
          }}
        />

        {/* Add Location Modal */}
        <AddLocationModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setIsAddingLocation(false);
          }}
          initialCoords={newPinCoords}
          initialTags={aiNewPinData?.tags}
          initialPhotoUrl={aiNewPinData?.photoUrl}
          initialAiSummary={aiNewPinData?.summary}
          initialAiBarriers={aiNewPinData?.barriers}
          onSaveLocation={handleSaveLocation}
          onOpenStorefrontScanner={() => {
            setIsAddModalOpen(false);
            setAiTargetLocation(null);
            setIsAIModalOpen(true);
          }}
        />

        {/* AI Storefront Analyzer Modal */}
        <AIStorefrontModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          targetLocation={aiTargetLocation}
          locations={locations}
          onApplyTagsToLocation={handleApplyTagsToLocation}
          onStartNewPinFromAnalysis={handleStartNewPinFromAnalysis}
        />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <A11yProvider>
      <AccessMapApp />
    </A11yProvider>
  );
}
