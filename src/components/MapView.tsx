/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocationPin } from '../types/accessibility';
import { getRatingColor } from '../utils/storage';
import { useA11y } from '../context/A11yContext';
import { Crosshair, Locate, MapPin, ZoomIn, ZoomOut, Layers, RefreshCw } from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
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

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CDO_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We supply custom accessible controls
    });

    mapInstanceRef.current = map;

    // Add Tile layer
    const tileUrl = highContrast
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const newLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
          class="pin-bubble ${isSelected ? 'ring-4 ring-sky-500 scale-125 z-50' : ''}" 
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
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
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
          announce(`Pin dragged to latitude ${pos.lat.toFixed(4)}, longitude ${pos.lng.toFixed(4)}`);
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

          // User Pulse Ring
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

  // Reset to CDO Center
  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(CDO_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
      announce('Map recentered to Cagayan de Oro city center.');
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Interactive Leaflet container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        tabIndex={0}
        aria-label="Interactive Accessibility Map of Cagayan de Oro. Use arrow keys to pan, plus and minus to zoom."
      />

      {/* Floating Accessible Map Controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center transition-transform active:scale-95 focus:outline-2 focus:outline-sky-600 cursor-pointer"
          title="Locate me (GPS)"
          aria-label="Locate me using GPS"
        >
          <Locate className={`w-5 h-5 ${isLocating ? 'animate-spin text-sky-600' : 'text-slate-700'}`} />
        </button>

        <button
          type="button"
          onClick={handleResetCenter}
          className="w-11 h-11 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center transition-transform active:scale-95 focus:outline-2 focus:outline-sky-600 cursor-pointer"
          title="Center on Cagayan de Oro"
          aria-label="Reset map view to Cagayan de Oro center"
        >
          <Crosshair className="w-5 h-5 text-slate-700" />
        </button>

        <div className="flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-11 h-11 hover:bg-slate-50 text-slate-800 flex items-center justify-center border-b border-slate-200 transition-colors focus:outline-2 focus:outline-sky-600 cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-slate-700" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-11 h-11 hover:bg-slate-50 text-slate-800 flex items-center justify-center transition-colors focus:outline-2 focus:outline-sky-600 cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Adding pin guide banner */}
      {isAddingLocation && (
        <div className="absolute top-4 left-4 right-16 md:right-auto md:max-w-md z-[500] bg-amber-500 text-amber-950 px-4 py-2.5 rounded-xl shadow-lg border border-amber-600 flex items-center gap-3 animate-fade-in">
          <MapPin className="w-5 h-5 shrink-0 text-amber-950 animate-bounce" />
          <p className="text-xs md:text-sm font-semibold">
            Click anywhere on the map or drag the gold marker to position your new location pin.
          </p>
        </div>
      )}

      {/* Accessible Map Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200 text-xs text-slate-700 hidden sm:flex items-center gap-4">
        <span className="font-semibold text-slate-900">Accessibility:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700 inline-block" />
          <span>High (4.0–5.0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 inline-block" />
          <span>Mid (2.5–3.9)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 border border-rose-700 inline-block" />
          <span>Low (&lt;2.5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500 inline-block" />
          <span>Unrated</span>
        </div>
      </div>
    </div>
  );
};
