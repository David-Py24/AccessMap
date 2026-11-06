# AccessMap - Project Documentation & Progress Log

**Application**: AccessMap  
**Purpose**: Crowdsourced Accessibility Mapping Platform with Multimodal Gemini AI Storefront Analysis  
**Region of Focus**: Cagayan de Oro, Northern Mindanao, Philippines  
**Repository & Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, OpenStreetMap, Express, Google GenAI SDK (`gemini-3.8-flash`)  

---

## 1. Executive Summary

AccessMap is an open-source, crowdsourced urban accessibility platform designed to catalog, rate, and verify physical and sensory accessibility features for buildings, venues, and public spaces in Cagayan de Oro, Philippines. The platform incorporates:
- **Zero-Cost Open-Source Mapping**: Powered by Leaflet and OpenStreetMap (no paid Google Maps API keys required).
- **Gemini Multimodal AI Storefront Analyzer**: Automatic computer vision inspection of doors, ramps, thresholds, and stairs with strict JSON output.
- **Community Verification Engine**: Dual "Confirm" / "Dispute" consensus voting with automated trust badging.
- **Accessible WCAG AA Design**: Text scaling (`1x`, `1.15x`, `1.3x`), high-contrast dark mode, ARIA live regions, and keyboard-first navigability.

---

## 2. Chronological Progress Log (Hourly Format)

### `2026-11-05 22:55:00` — Project Initialization & Architecture Planning
- **Event**: Core requirements analysis based on prompt specification.
- **Decisions**:
  - Selected Leaflet + OpenStreetMap Carto tiles for zero-cost, open-source cartography without API keys or usage quotas.
  - Selected `gemini-3.8-flash` via `@google/genai` (Node.js Express backend) to avoid client-side API key exposure.
  - Pre-seeded 10 realistic locations across Cagayan de Oro (Centrio Mall, SM CDO Downtown Premier, NMMC Hospital, Xavier University, Cafe Laguna, Cogon Market, etc.) to establish realistic demonstration data.
- **Changes**:
  - Updated `metadata.json` with app title, description, permissions, and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
  - Updated `index.html` with accessibility metadata and Leaflet stylesheet.
  - Configured `package.json` with `"dev": "tsx server.ts"` and `"start": "tsx server.ts"`.

### `2026-11-05 23:15:00` — Server & Gemini AI Multimodal Analyzer
- **Event**: Backend creation and multimodal prompt engineering.
- **Decisions**:
  - Implemented `/server.ts` running Express on port 3000 mounting Vite middleware in dev mode.
  - Created `/src/prompts/storefrontPrompt.ts` with strict system instructions and user prompt constants.
  - Configured `responseSchema` with:
    - `detected_features`: array of `{ tag, confidence, evidence }`
    - `possible_barriers`: array of strings (e.g. stairs, high curbs, narrow turnstiles)
    - `summary`: plain-language assessment
    - `suggested_tags`: standardized tags
  - Built graceful offline / simulation fallback with visual progress indicators.

### `2026-11-05 23:35:00` — Leaflet Map Engine & Community Verification
- **Event**: Interactive mapping, rating color coding, and community consensus logic.
- **Decisions**:
  - Implemented custom SVG pin markers color-coded by accessibility tier:
    - Green (`#059669`): High Accessibility (4.0–5.0★)
    - Yellow (`#d97706`): Moderate Accessibility (2.5–3.9★)
    - Red (`#e11d48`): Low Accessibility / Barriers (< 2.5★)
    - Grey (`#94a3b8`): Unrated / Community Review Pending
  - Implemented community voting logic in `/src/utils/storage.ts`:
    - "Confirm" and "Dispute" counters per tag.
    - Tags with net confirmations >= 2 receive the `Community verified` badge.
    - AI-suggested tags retain the `AI-suggested` badge until verified on-site.
  - Added GPS "Locate Me" tracking and draggable coordinate placement marker.

### `2026-11-05 23:45:00` — UI Reference Adaptation (Main Interface)
- **Event**: Redesigning the main application shell according to `UI_Referrence_8c48ae05.jpg`.
- **Decisions**:
  - Built `/src/components/SidebarRail.tsx`: Far-left vertical icon navigation rail with brand squircle, navigation triggers, and accessibility toggles.
  - Built `/src/components/PlacesPanel.tsx`: Floating / docked sidebar recreating the "Packages" panel with segmented pill control (`[All Places]`, `Verified`, `Barriers`), search input, and tag filter accordion.
  - Redesigned `/src/components/LocationCard.tsx`:
    - **Active Card**: Recreates the expanded `Norra Nynäshamn → Stockholm` card featuring dark border, vivid status badge (`VERIFIED ACCESS`), progress indicator, 4-column metric grid (Category, Score, Distance, Verified Tags), and auditor/contributor profile row.
    - **Inactive Card**: Clean row with subtitle, distance, and status badge.
  - Enhanced `/src/components/MapView.tsx`:
    - Added bold header watermark **"📍 Cagayan de Oro"** matching `📍 Stockholm`.
    - Added `/src/components/MapFloatingCard.tsx`: Floating bottom quick-status card matching the reference UI order card with 5-column metric breakdown.

### `2026-11-06 00:30:00` — OpenStreetMap & Leaflet Layer Switcher Integration
- **Event**: User inquiry regarding OpenStreetMap + Leaflet services.
- **Decisions**:
  - Clarified that AccessMap already runs on 100% free OpenStreetMap & Leaflet with no Google Maps billing.
  - Added interactive **Map Layer Switcher** button in floating map controls with choices:
    1. **OpenStreetMap (Standard)** (official vibrant tiles)
    2. **OpenStreetMap Humanitarian (HOT)** (optimized for infrastructure & accessibility)
    3. **Carto Positron (Clean Light)** (minimalist light gray)
    4. **Carto Dark Matter (High Contrast)** (dark mode style)
  - Added an active service badge on the map: `OpenStreetMap + Leaflet | Free & Active`.

### `2026-11-06 00:45:00` — Form Reference UI Adaptation (`Form_Referrence_e36981fe.jpg`)
- **Event**: Recreating the Add Location Modal according to the user's form reference attachment.
- **Decisions**:
  - Redesigned `/src/components/AddLocationModal.tsx`:
    - **Card Header**: Clean folder icon with bold title `Create New Location` and descriptive subtitle.
    - **Dashed Upload Dropzone**: Recreated file upload rectangle with cloud icon, drag-and-drop trigger, file specifications (`JPG, PNG or PDF, max 10MB`), and thumbnail preview.
    - **2-Column Row**: `Location Name *` and `Category or Date` with calendar/folder icon.
    - **Description Area**: `Description *` multiline text area with subtle border.
    - **Tags Input & Removable Pills**: Input field with `+` action button, displaying removable tag chips with `×` cross buttons (e.g. `[Wheelchair-accessible entrance ×]`, `[Ramp available ×]`).
    - **Members with Access Section**: Dual checkboxes for community link access and public open crowdsourcing.
    - **Footer Buttons**: Clean `Cancel` button alongside solid black `[💾 Save location]` button.

### `2026-11-06 00:50:00` — Domain Tailoring of Add Location Flow to Real Accessibility Workflow
- **Event**: Refined the form reference recreation so that it is tailored directly to AccessMap's physical accessibility purpose rather than generic project management terms.
- **Decisions**:
  - **In-Form AI Vision Trigger**: Uploading a photo to the dashed dropzone immediately provides an interactive **"Scan with AI"** button powered by `gemini-3.8-flash`, parsing entrance doors, stairs, and thresholds, and showing immediate architectural summaries and barrier alerts.
  - **Individual Tag Star Ratings (1–5★)**: Each removable tag pill now includes interactive 1–5 star ratings directly inside the chip, enabling users to rate specific features (e.g., 5★ ramp, 4★ doorway).
  - **Venue Context**: Replaced generic "Project Name" with "Place Name" (e.g., malls, clinics, cafes) and categorized by actual venue types (Shopping, Dining, Healthcare, Education, Public Space).
  - **Live GPS Sync**: Added real-time coordinates bar with one-click **"Locate Me (GPS)"** synchronization.
  - **Community Verification Agreement**: Tailored permissions to community dispute and confirmation consensus on the Cagayan de Oro map.

---

## 3. Architecture & File Structure

```
├── .env.example                          # Environment variable template
├── Documentation.md                      # Comprehensive progress log & hourly documentation
├── index.html                            # HTML entry point with Leaflet styles & meta tags
├── metadata.json                         # Project metadata and server capabilities
├── package.json                          # Dependencies & build scripts (tsx server.ts)
├── server.ts                             # Express backend + Gemini multimodal API proxy
├── tsconfig.json                         # TypeScript configuration
├── vite.config.ts                        # Vite configuration
└── src/
    ├── App.tsx                           # Master application shell & state coordinator
    ├── index.css                         # Global CSS, Leaflet styles & animations
    ├── main.tsx                          # React entry point
    ├── components/
    │   ├── AddLocationModal.tsx          # Add Location dialog matching Form Reference UI
    │   ├── AIStorefrontModal.tsx         # Standalone multimodal Gemini storefront scanner
    │   ├── FilterBar.tsx                 # Search & multi-tag filter component
    │   ├── LocationCard.tsx              # Card component with active expanded metric grid
    │   ├── LocationDetailDrawer.tsx      # Slideout panel for reviews & community voting
    │   ├── MapFloatingCard.tsx           # Floating bottom summary card matching reference
    │   ├── MapView.tsx                   # Leaflet map with OpenStreetMap layer switcher
    │   ├── Navbar.tsx                    # Top navigation & view switcher
    │   ├── PlacesPanel.tsx               # Left docked places panel with segmented pill control
    │   └── SidebarRail.tsx               # Leftmost icon navigation rail
    ├── context/
    │   └── A11yContext.tsx               # Text scale, high-contrast, & screen-reader live region
    ├── data/
    │   └── initialLocations.ts           # 10 pre-seeded Cagayan de Oro venues & test storefronts
    ├── prompts/
    │   └── storefrontPrompt.ts           # Standard accessibility tags & Gemini prompt constant
    ├── types/
    │   └── accessibility.ts              # TypeScript interfaces for pins, tags, reviews & AI
    └── utils/
        ├── storage.ts                    # LocalStorage persistence, color coding & distance
        └── tagHelpers.tsx                # Tag Lucide icon mapping
```

---

## 4. Key Functional Specifications

### 4.1 Accessibility Tags
1. `Wheelchair-accessible entrance`
2. `Ramp available`
3. `Accessible restroom`
4. `Quiet / low-sensory zone`
5. `Braille menu / signage`
6. `Elevator access`
7. `Wide aisles / pathways`
8. `Accessible parking`
9. `Staff trained in assistance`
10. Custom community-suggested tags

### 4.2 AI Storefront Analysis Schema
- Endpoint: `POST /api/analyze-storefront`
- Model: `gemini-3.8-flash`
- Payload: Base64 data or remote image URL
- Output JSON Schema:
```json
{
  "detected_features": [
    {
      "tag": "Wheelchair-accessible entrance",
      "confidence": 0.94,
      "evidence": "Visual inspection shows wide double entry doors with zero-threshold ground clearance."
    }
  ],
  "possible_barriers": [
    "Exterior pavement shows mild surface wear; check for slip hazards during rain."
  ],
  "summary": "Storefront exhibits strong physical accessibility with step-free entrance and visible ramp access.",
  "suggested_tags": [
    "Wheelchair-accessible entrance",
    "Ramp available"
  ]
}
```

---

## 5. Summary of Completed Milestones

- [x] Initial full-stack scaffolding with Express and Vite.
- [x] Free OpenStreetMap + Leaflet integration centered on Cagayan de Oro.
- [x] Multimodal Gemini Storefront Analyzer with strict JSON output and sample photos.
- [x] Community verification ("Confirm" / "Dispute") and dynamic trust badges.
- [x] Mobile-responsive UI adapted from `UI_Referrence_8c48ae05.jpg`.
- [x] Map Layer Switcher for OpenStreetMap Standard, Humanitarian, Carto Positron, and Dark Matter.
- [x] Add Location Form adapted from `Form_Referrence_e36981fe.jpg`.
- [x] Full compilation and zero-error TypeScript linting.
