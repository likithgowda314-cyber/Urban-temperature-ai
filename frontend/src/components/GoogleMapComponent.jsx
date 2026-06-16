import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Rectangle, InfoWindow } from '@react-google-maps/api';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { RefreshCw } from 'lucide-react';

const libraries = ['visualization'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px'
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#212121" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
    { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
    { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
    { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
    { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
  ]
};

export default function GoogleMapComponent({ cityCenter, gridData, selectedCell, onSelectCell, onMapClick }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  
  const overlayRef = useRef(null);
  
  const heatPoints = useMemo(() => {
    if (!gridData) return [];
    return gridData.map(cell => {
      const lat = (cell.bounds[0][0] + cell.bounds[1][0]) / 2;
      const lng = (cell.bounds[0][1] + cell.bounds[1][1]) / 2;
      let intensity = (cell.lst - 25) / 20;
      if (intensity < 0) intensity = 0;
      if (intensity > 1) intensity = 1;
      return {
        coordinates: [lng, lat],
        weight: intensity
      };
    });
  }, [gridData]);

  useEffect(() => {
    if (!map) return;

    const heatmapLayer = new HeatmapLayer({
      id: 'thermal-heatmap',
      data: heatPoints,
      getPosition: d => d.coordinates,
      getWeight: d => d.weight,
      radiusPixels: 80,
      intensity: 1.5,
      threshold: 0.05,
      colorRange: [
        [0, 255, 255, 0],
        [16, 185, 129, 255], // emerald-500
        [234, 179, 8, 255],  // yellow-500
        [249, 115, 22, 255], // orange-500
        [239, 68, 68, 255]   // red-500
      ]
    });

    if (!overlayRef.current) {
      overlayRef.current = new GoogleMapsOverlay({
        layers: [heatmapLayer]
      });
      overlayRef.current.setMap(map);
    } else {
      overlayRef.current.setProps({
        layers: [heatmapLayer]
      });
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, heatPoints]);

  const onLoad = React.useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && cityCenter) {
      map.panTo({ lat: cityCenter[0], lng: cityCenter[1] });
    }
  }, [cityCenter, map]);

  if (!isLoaded) return <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-700/50"><div className="text-sky-400 flex flex-col items-center gap-3"><RefreshCw className="animate-spin" size={32} /><span className="tracking-widest font-mono text-sm">INITIALIZING MAPS ENGINE...</span></div></div>;

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl group border border-slate-700/50 shadow-2xl">
      {/* Radar scanning animation layer */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-20 rounded-2xl">
        <div className="w-full h-[3px] bg-sky-400 absolute top-0 left-0 animate-radar-scan shadow-[0_0_15px_3px_rgba(56,189,248,0.5)]" />
      </div>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: cityCenter[0], lng: cityCenter[1] }}
        zoom={12}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(e) => onMapClick(e.latLng.lat(), e.latLng.lng())}
      >
        {gridData.map((cell) => {
          const { bounds, id, severity } = cell;
          const isSelected = selectedCell && selectedCell.id === id;
          
          let color = '#10b981';
          if (severity === 'Moderate') color = '#eab308';
          else if (severity === 'High') color = '#f97316';
          else if (severity === 'Severe') color = '#ef4444';

          return (
            <Rectangle
              key={id}
              bounds={{
                north: bounds[1][0],
                south: bounds[0][0],
                east: bounds[1][1],
                west: bounds[0][1]
              }}
              options={{
                fillColor: 'transparent',
                fillOpacity: 0,
                strokeColor: isSelected ? '#38bdf8' : (hoveredCell === id ? color : '#334155'),
                strokeOpacity: isSelected || hoveredCell === id ? 0.9 : 0.2,
                strokeWeight: isSelected ? 3 : (hoveredCell === id ? 2 : 1),
                clickable: true
              }}
              onClick={() => onSelectCell(cell)}
              onMouseOver={() => setHoveredCell(id)}
              onMouseOut={() => setHoveredCell(null)}
            />
          );
        })}

        {hoveredCell && gridData.find(c => c.id === hoveredCell) && (
          <InfoWindow
            position={{
              lat: (gridData.find(c => c.id === hoveredCell).bounds[0][0] + gridData.find(c => c.id === hoveredCell).bounds[1][0]) / 2,
              lng: (gridData.find(c => c.id === hoveredCell).bounds[0][1] + gridData.find(c => c.id === hoveredCell).bounds[1][1]) / 2
            }}
            options={{ disableAutoPan: true }}
          >
            <div style={{ color: '#f8fafc', background: 'rgba(15, 23, 42, 0.9)', padding: '6px', borderRadius: '4px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: '500', minWidth: '120px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '4px', marginBottom: '4px', color: '#38bdf8' }}>
                Zone {hoveredCell}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>LST:</span> <span>{gridData.find(c => c.id === hoveredCell).lst.toFixed(1)}°C</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NDVI:</span> <span>{gridData.find(c => c.id === hoveredCell).ndvi.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>LULC:</span> <span>{gridData.find(c => c.id === hoveredCell).lulc}</span></div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Visual map legend overlay with Glassmorphism */}
      <div className="absolute bottom-6 left-6 glass-panel rounded-xl p-4 shadow-2xl z-10 font-sans text-xs min-w-[200px]">
        <h4 className="font-bold text-slate-200 mb-3 font-display uppercase tracking-widest text-[10px] border-b border-slate-700/50 pb-2">Severity Index</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 opacity-90 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-slate-300 font-medium">Low (&lt; 32°C)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-90 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            <span className="text-slate-300 font-medium">Moderate (32°C - 36°C)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-500 opacity-90 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <span className="text-slate-300 font-medium">High (36°C - 40°C)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 opacity-90 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="text-slate-300 font-medium">Severe (&gt; 40°C)</span>
          </div>
          <div className="flex items-center gap-3 border-t border-slate-700/50 pt-2 mt-2">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-sky-400 bg-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
            <span className="text-slate-300 font-medium">Simulated Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
