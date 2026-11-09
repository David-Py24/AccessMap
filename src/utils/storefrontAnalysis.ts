/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorefrontAnalysisResult } from '../types/accessibility';

const SIMULATED_RESULT: Omit<StorefrontAnalysisResult, 'imagePreviewUrl' | 'analysisDate'> = {
  detected_features: [
    {
      tag: 'Wheelchair-accessible entrance',
      confidence: 0.94,
      evidence: 'Visual inspection shows wide double entry doors with zero-threshold ground clearance.',
    },
    {
      tag: 'Ramp available',
      confidence: 0.88,
      evidence: 'Continuous low-incline concrete access ramp visible alongside the main sidewalk.',
    },
    {
      tag: 'Wide aisles / pathways',
      confidence: 0.82,
      evidence: 'Unobstructed clearance of at least 1.2 meters at the vestibule foyer.',
    },
  ],
  possible_barriers: [
    'Exterior pavement shows mild surface wear; check for slip hazards during rain.',
  ],
  summary:
    'Storefront exhibits strong physical accessibility with step-free entrance and visible ramp access.',
  suggested_tags: [
    'Wheelchair-accessible entrance',
    'Ramp available',
    'Wide aisles / pathways',
  ],
};

export async function analyzeStorefront(
  _image?: string | null
): Promise<StorefrontAnalysisResult> {
  // Simulate network latency for the AI inspection flow.
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    ...SIMULATED_RESULT,
  };
}
