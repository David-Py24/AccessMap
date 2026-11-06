/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationPin } from '../types/accessibility';
import { getRatingColor } from '../utils/storage';
import { useA11y } from '../context/A11yContext';
import { MapFloatingCard } from './MapFloatingCard';
import {
  Crosshair,
  Locate,
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  Search,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  isAddingLocation: boolean;
  newPinCoords: { lat: number; lng: number } | null;
  onNewPinCoordsChange: (coords: { lat: number; lng: number }) => void;
}

// Center of Cagayan de Oro City
const CDO_CENTER: [number, number] = [8.4822, 124.6473];
const DEFAULT_ZOOM = 14;

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  isAddingLocation,
  newPinCoords,
  onNewPinCoordsChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const newPinMarkerRef = useRef<L.Marker | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  const { highContrast, announce } = useA11y();
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CDO_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // Custom controls
    });

    mapInstanceRef.current = map;

    // Clean light Carto Positron tiles matching reference UI
    const tileUrl = highContrast
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Markers group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // User location group
    const userLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLayer;

    // Map click handler for adding location
    map.on('click', (e: L.LeafletMouseEvent) => {
      onNewPinCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when High Contrast mode toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const tileUrl = highContrast
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [highContrast]);

  // Render Location Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    locations.forEach((loc) => {
      const colorMeta = getRatingColor(loc.averageRating, loc.totalReviews);
      const isSelected = selectedLocation?.id === loc.id;
      const ratingText = loc.averageRating > 0 ? loc.averageRating.toFixed(1) : '–';

      // Custom Accessible Pin HTML
      const pinHtml = `
        <div 
          class="pin-bubble ${isSelected ? 'ring-4 ring-slate-900 scale-125 z-50' : ''}" 
          style="
            background: ${colorMeta.hex}; 
            color: #ffffff; 
            width: 38px; 
            height: 38px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            font-weight: 700; 
            font-size: 11px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          "
          title="${loc.name} (${colorMeta.label}: ${ratingText}★)"
          aria-label="${loc.name}, Rating: ${ratingText} out of 5 stars"
        >
          <span style="line-height: 1; font-size: 11px;">★</span>
          <span style="line-height: 1; font-size: 10px;">${ratingText}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: pinHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker([loc.lat, loc.lng], {
        icon: customIcon,
        title: loc.name,
      });

      marker.on('click', () => {
        onSelectLocation(loc);
        setShowSummaryCard(true);
        announce(`Selected location: ${loc.name}, rated ${ratingText} stars.`);
      });

      marker.addTo(layer);
    });
  }, [locations, selectedLocation]);

  // Center on selected location if changed
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedLocation.lat, selectedLocation.lng],
        Math.max(mapInstanceRef.current.getZoom(), 16),
        { duration: 0.8 }
      );
      setShowSummaryCard(true);
    }
  }, [selectedLocation]);

  // Handle draggable placement pin when adding location
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (isAddingLocation && newPinCoords) {
      const goldIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            background: #f59e0b; 
            color: #ffffff; 
            width: 44px; 
            height: 44px; 
            border-radius: 9999px;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 4px #d97706, 0 8px 16px rgba(0,0,0,0.4);
            animation: bounce 1s infinite alternate;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!newPinMarkerRef.current) {
        const marker = L.marker([newPinCoords.lat, newPinCoords.lng], {
          icon: goldIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onNewPinCoordsChange({ lat: pos.lat, lng: pos.lng });
          announce(`Pin placed at lat ${pos.lat.toFixed(4)}, lng ${pos.lng.toFixed(4)}`);
        });

        newPinMarkerRef.current = marker;
      } else {
        newPinMarkerRef.current.setLatLng([newPinCoords.lat, newPinCoords.lng]);
      }
    } else {
      if (newPinMarkerRef.current) {
        newPinMarkerRef.current.remove();
        newPinMarkerRef.current = null;
      }
    }
  }, [isAddingLocation, newPinCoords]);

  // Locate User Action
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      announce('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    announce('Detecting current GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && userLocationLayerRef.current) {
          const map = mapInstanceRef.current;
          userLocationLayerRef.current.clearLayers();

          const userIcon = L.divIcon({
            className: 'custom-pin-marker',
            html: `
              <div style="position: relative; width: 24px; height: 24px;">
                <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #0284c7; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 18px; height: 18px; margin: 3px; border-radius: 9999px; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          L.marker([latitude, longitude], { icon: userIcon, title: 'Your Current Location' }).addTo(
            userLocationLayerRef.current
          );

          map.flyTo([latitude, longitude], 15, { duration: 1.2 });
          announce('Map centered on your current location.');
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        announce('Unable to retrieve location. Defaulting to Cagayan de Oro center.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(CDO_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
      announce('Map recentered to Cagayan de Oro city center.');
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const activeCardLocation = selectedLocation || (locations.length > 0 ? locations[0] : null);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#e5e5e5] overflow-hidden select-none">
      {/* Interactive Leaflet container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        tabIndex={0}
        aria-label="Interactive Accessibility Map of Cagayan de Oro"
      />

      {/* Prominent City Header Title Watermark (Matching 📍 Stockholm in Reference UI) */}
      <div className="absolute top-5 left-5 sm:left-7 z-[500] pointer-events-none select-none flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-lg pointer-events-auto">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 drop-shadow-xs">
            Cagayan de Oro
          </h2>
        </div>
      </div>

      {/* Floating Map Controls in Top Right (Matching Reference UI buttons) */}
      <div className="absolute top-5 right-5 sm:right-7 z-[500] flex items-center gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Locate me (GPS)"
          aria-label="Locate me using GPS"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-600' : 'text-slate-700'}`} />
        </button>

        <button
          type="button"
          onClick={handleResetCenter}
          className="w-10 h-10 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Center on Cagayan de Oro"
          aria-label="Reset map view"
        >
          <Crosshair className="w-4 h-4 text-slate-700" />
        </button>

        <div className="flex items-center bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 hover:bg-slate-50 text-slate-800 flex items-center justify-center border-r border-slate-200/80 transition-colors cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-slate-700" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 hover:bg-slate-50 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Adding pin guide banner */}
      {isAddingLocation && (
        <div className="absolute top-20 left-6 z-[500] bg-amber-500 text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-600 flex items-center gap-3 animate-fade-in">
          <MapPin className="w-5 h-5 shrink-0 text-amber-950 animate-bounce" />
          <p className="text-xs sm:text-sm font-bold">
            Click anywhere on the map or drag the gold marker to position your new location pin.
          </p>
        </div>
      )}

      {/* Floating Bottom Details Card (Recreating bottom card from Reference UI) */}
      {showSummaryCard && activeCardLocation && !isAddingLocation && (
        <MapFloatingCard
          location={activeCardLocation}
          onOpenDetails={onOpenDetails}
          onClose={() => setShowSummaryCard(false)}
          userCoords={userCoords}
        />
      )}
    </div>
  );
};
