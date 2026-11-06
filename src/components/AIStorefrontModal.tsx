/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SAMPLE_STOREFRONTS, SampleStorefront } from '../data/initialLocations';
import {
  LocationPin,
  StorefrontAnalysisResult,
  DetectedFeature,
} from '../types/accessibility';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';

interface AIStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLocation?: LocationPin | null;
  locations: LocationPin[];
  onApplyTagsToLocation: (
    locationId: string,
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult
  ) => void;
  onStartNewPinFromAnalysis: (
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult,
    photoDataUrl: string
  ) => void;
}

export const AIStorefrontModal: React.FC<AIStorefrontModalProps> = ({
  isOpen,
  onClose,
  targetLocation,
  locations,
  onApplyTagsToLocation,
  onStartNewPinFromAnalysis,
}) => {
  const { announce } = useA11y();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StorefrontAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accepted tags state: map of tagName -> boolean
  const [acceptedTagsMap, setAcceptedTagsMap] = useState<Record<string, boolean>>({});

  // Target location selection if none pre-selected
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    targetLocation ? targetLocation.id : ''
  );

  if (!isOpen) return null;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setAnalysisResult(null);
      setErrorMsg(null);
      announce('Photo uploaded. Ready to analyze.');
    };
    reader.readAsDataURL(file);
  };

  // Preset sample photo handler
  const handleSelectSample = (sample: SampleStorefront) => {
    setSelectedImage(sample.imageUrl);
    setAnalysisResult(null);
    setErrorMsg(null);
    announce(`Selected sample: ${sample.title}`);
  };

  // Run Gemini analysis API call
  const handleAnalyzePhoto = async () => {
    if (!selectedImage) {
      setErrorMsg('Please upload a storefront photo or select a sample image first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    announce('Analyzing storefront accessibility with Gemini AI. Please wait a moment.');

    try {
      const isDataUrl = selectedImage.startsWith('data:');
      const payload = isDataUrl
        ? { image: selectedImage }
        : { imageUrl: selectedImage };

      const res = await fetch('/api/analyze-storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with status ${res.status}: ${res.statusText}`
        );
      }

      const data: StorefrontAnalysisResult = await res.json();
      data.imagePreviewUrl = selectedImage;
      data.analysisDate = new Date().toISOString();

      setAnalysisResult(data);

      // Pre-select all suggested tags as accepted by default
      const initialMap: Record<string, boolean> = {};
      if (Array.isArray(data.suggested_tags)) {
        data.suggested_tags.forEach((tag) => {
          initialMap[tag] = true;
        });
      }
      setAcceptedTagsMap(initialMap);
      announce(
        `Analysis complete! Detected ${data.detected_features?.length || 0} features and ${
          data.possible_barriers?.length || 0
        } potential barriers.`
      );
    } catch (err: any) {
      console.error('Storefront analysis error:', err);
      setErrorMsg(
        err.message ||
          'Could not analyze photo. The image may be blurry, lack architectural context, or the AI service encountered an error.'
      );
      announce('Analysis failed. Please check the photo or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTagAcceptance = (tagName: string) => {
    setAcceptedTagsMap((prev) => {
      const next = { ...prev, [tagName]: !prev[tagName] };
      announce(
        next[tagName]
          ? `Accepted tag ${tagName}`
          : `Rejected tag ${tagName}`
      );
      return next;
    });
  };

  const getAcceptedTagsList = (): string[] => {
    return Object.keys(acceptedTagsMap).filter((tag) => acceptedTagsMap[tag]);
  };

  const handleApplyToExisting = () => {
    const locId = targetLocation ? targetLocation.id : selectedLocationId;
    if (!locId) {
      setErrorMsg('Please select a location to update.');
      return;
    }
    if (!analysisResult) return;

    const accepted = getAcceptedTagsList();
    onApplyTagsToLocation(locId, accepted, analysisResult);
    announce('Accessibility tags applied to location.');
    onClose();
  };

  const handleCreateNewPin = () => {
    if (!analysisResult || !selectedImage) return;
    const accepted = getAcceptedTagsList();
    onStartNewPinFromAnalysis(accepted, analysisResult, selectedImage);
    announce('Opening Add Location pin flow with accepted AI tags.');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Storefront Accessibility Analyzer"
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI Storefront Accessibility Analyzer
              </h2>
              <p className="text-xs text-slate-500">
                Powered by Gemini Vision • Automatic Entrance & Barrier Detection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close analyzer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step 1: Upload or Choose Sample */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Provide a Storefront or Entrance Photograph
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
                >
                  Change Photo
                </button>
              )}
            </div>

            {!selectedImage ? (
              <div className="space-y-3">
                {/* Drag and Drop / File Input Box */}
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    Click to upload storefront photo
                  </span>
                  <span className="text-xs text-slate-500">
                    Supports JPG, PNG, WebP up to 15MB • Shows doors, steps, and ramps
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                {/* Preset sample photo quick picker */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-2">
                    Or select a pre-loaded test storefront:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SAMPLE_STOREFRONTS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 text-left transition-all hover:shadow-md cursor-pointer aspect-4/3 bg-slate-100"
                      >
                        <img
                          src={sample.imageUrl}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
                          <span className="text-[11px] font-bold line-clamp-1">
                            {sample.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Photo Preview & Analysis Trigger */
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden border border-slate-300 relative shrink-0 bg-black">
                  <img
                    src={selectedImage}
                    alt="Selected storefront for AI analysis"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-900">
                    Storefront Photo Ready
                  </h4>
                  <p className="text-xs text-slate-500">
                    Gemini will inspect doors, steps, thresholds, ramps, signage, and pathway clearance.
                  </p>

                  <button
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Inspecting Features with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Run AI Accessibility Analysis</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Analysis notice: </span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Step 2: AI Review Card */}
          {analysisResult && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>AI Storefront Review Results</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {getAcceptedTagsList().length} tags accepted
                </span>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900">
                  Architectural Assessment:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Detected Physical Features with Confidence & Visual Evidence */}
              {analysisResult.detected_features && analysisResult.detected_features.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Observed Accessibility Features & Evidence
                  </span>
                  <div className="space-y-2">
                    {analysisResult.detected_features.map((feat, idx) => {
                      const confidencePct = Math.round((feat.confidence || 0.8) * 100);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              {getTagIcon(feat.tag)}
                              <span>{feat.tag}</span>
                            </span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                              {confidencePct}% Confidence
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">
                            <strong className="text-slate-800">Visual Evidence:</strong>{' '}
                            {feat.evidence}
                          </p>

                          {/* Progress gauge */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${confidencePct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Barriers Box */}
              {analysisResult.possible_barriers && analysisResult.possible_barriers.length > 0 && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Identified Physical Obstacles & Barriers</span>
                  </div>
                  <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
                    {analysisResult.possible_barriers.map((barrier, bIdx) => (
                      <li key={bIdx} className="font-medium">
                        {barrier}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Tags to Accept or Reject */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Accept or Reject Suggested Tags:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Check the tags you want to apply
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysisResult.suggested_tags?.map((tag) => {
                    const isAccepted = Boolean(acceptedTagsMap[tag]);
                    return (
                      <label
                        key={tag}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isAccepted
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isAccepted}
                            onChange={() => toggleTagAcceptance(tag)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {tag}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isAccepted
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isAccepted ? 'Accepted' : 'Rejected'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* AI Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Disclaimer:</strong> AI analysis is based on photographic visual inspection only and may be inaccurate or incomplete. All AI-suggested tags will display an "AI-suggested" badge on AccessMap until confirmed on-site by community members.
                </p>
              </div>

              {/* Location Target Selection (if not launched from an existing location) */}
              {!targetLocation && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Select Existing Location Pin to Update:
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
                  >
                    <option value="">-- Choose a location in Cagayan de Oro --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>

          {analysisResult && (
            <div className="flex items-center gap-2">
              {/* Option A: Create New Location Pin */}
              <button
                type="button"
                onClick={handleCreateNewPin}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Pin</span>
              </button>

              {/* Option B: Apply to Existing Pin */}
              <button
                type="button"
                onClick={handleApplyToExisting}
                disabled={!targetLocation && !selectedLocationId}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <span>Apply to Pin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
