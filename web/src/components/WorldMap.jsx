import { useEffect, useState, useRef } from 'react';

// Sample locations - these should ideally come from crew member data
// Coordinates are in [latitude, longitude] format for Leaflet
const locations = [
  // North America - Using accurate coordinates
  { name: 'TLP Network HQ', coordinates: [39.8283, -98.5795], region: 'north-america' }, // Geographic center of US
  { name: 'TLP Space Coast', coordinates: [28.3922, -80.6077], region: 'north-america' }, // Cape Canaveral, Florida
  { name: 'TLP West Coast', coordinates: [34.0522, -118.2437], region: 'north-america' }, // Los Angeles, California
  { name: 'Alaska', coordinates: [64.2008, -149.4937], region: 'north-america' }, // Fairbanks, Alaska
  { name: 'British Columbia', coordinates: [49.2827, -123.1207], region: 'north-america' }, // Vancouver
  { name: 'Alberta', coordinates: [51.0447, -114.0719], region: 'north-america' }, // Calgary
  { name: 'Ontario', coordinates: [43.6532, -79.3832], region: 'north-america' }, // Toronto
  { name: 'Quebec', coordinates: [46.8139, -71.2080], region: 'north-america' }, // Quebec City
  { name: 'Texas', coordinates: [29.7604, -95.3698], region: 'north-america' }, // Houston, Texas
  { name: 'Washington', coordinates: [47.6062, -122.3321], region: 'north-america' }, // Seattle, Washington
  { name: 'Colorado', coordinates: [39.7392, -104.9903], region: 'north-america' }, // Denver, Colorado
  { name: 'New York', coordinates: [40.7128, -74.0060], region: 'north-america' }, // New York City
  { name: 'Virginia', coordinates: [38.9072, -77.0369], region: 'north-america' }, // Washington DC area

  // Europe - Using accurate coordinates
  { name: 'Netherlands', coordinates: [52.3676, 4.9041], region: 'europe' }, // Amsterdam
  { name: 'United Kingdom', coordinates: [51.5074, -0.1278], region: 'europe' }, // London
  { name: 'Germany', coordinates: [52.5200, 13.4050], region: 'europe' }, // Berlin
  { name: 'France', coordinates: [48.8566, 2.3522], region: 'europe' }, // Paris
  { name: 'Spain', coordinates: [40.4168, -3.7038], region: 'europe' }, // Madrid
  { name: 'Italy', coordinates: [41.9028, 12.4964], region: 'europe' }, // Rome
  { name: 'TLP Europe', coordinates: [50.8503, 4.3528], region: 'europe' }, // Brussels
];

// Component to highlight North America and Europe in white
function GeoJSONHighlight() {
  const [geoData, setGeoData] = useState(null);
  const [LeafletComponents, setLeafletComponents] = useState(null);

  useEffect(() => {
    // Load react-leaflet GeoJSON component
    import('react-leaflet').then((mod) => {
      setLeafletComponents(mod);
    });

    // Fetch world countries GeoJSON
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Error loading GeoJSON:', err));
  }, []);

  // Countries to highlight in white (North America and Europe)
  const highlightedCountries = [
    // North America
    'United States of America', 'United States', 'USA',
    'Canada',
    'Mexico',
    'Greenland',
    // Europe
    'United Kingdom', 'UK',
    'Netherlands',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Belgium',
    'Switzerland',
    'Austria',
    'Portugal',
    'Ireland',
    'Denmark',
    'Sweden',
    'Norway',
    'Finland',
    'Poland',
    'Czech Republic',
    'Greece',
    'Iceland',
    'Luxembourg',
  ];

  if (!geoData || !LeafletComponents) return null;

  const { GeoJSON } = LeafletComponents;

  const styleFeature = (feature) => {
    const name = feature.properties?.name || feature.properties?.NAME || feature.properties?.NAME_LONG || '';
    const isHighlighted = highlightedCountries.some(country =>
      name.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(name.toLowerCase())
    );

    return {
      fillColor: isHighlighted ? '#ffffff' : '#3a3a3a',
      fillOpacity: isHighlighted ? 1.0 : 0.95,
      color: isHighlighted ? '#2a2a2a' : '#5a5a5a',
      weight: 0.5,
      opacity: 0.9,
    };
  };

  return (
    <GeoJSON
      data={geoData}
      style={styleFeature}
      pane="overlayPane"
    />
  );
}

const WorldMap = ({ crewMembers = [] }) => {
  const [isClient, setIsClient] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState(null);
  const [L, setL] = useState(null);

  useEffect(() => {
    setIsClient(true);

    // Dynamically import Leaflet and react-leaflet only on client
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
      import('react-leaflet')
    ]).then(([leaflet, , reactLeaflet]) => {
      const leafletLib = leaflet.default;
      setL(leafletLib);

      // Fix for default marker icons
      delete leafletLib.Icon.Default.prototype._getIconUrl;
      leafletLib.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setLeafletComponents(reactLeaflet);
    });
  }, []);

  // Extract locations from crew members if available, otherwise use default locations
  const mapLocations = crewMembers.length > 0
    ? crewMembers
      .filter(member => {
        // Check if coordinates exist in various possible formats
        const coords = member.coordinates;
        if (!coords) return false;

        // Handle different coordinate formats
        if (typeof coords === 'object') {
          // Object format: {lat, lng} or {latitude, longitude}
          return !!(coords.lat || coords.latitude || coords.lng || coords.longitude);
        }
        if (Array.isArray(coords) && coords.length >= 2) {
          // Array format: [lat, lng]
          return true;
        }
        return false;
      })
      .map(member => {
        const coords = member.coordinates;
        let lat, lng;

        // Parse coordinates from different formats
        // PRIORITY 1: Object format {lat, lng} or {latitude, longitude} (database standard)
        if (typeof coords === 'object' && !Array.isArray(coords)) {
          lat = parseFloat(coords.lat || coords.latitude);
          lng = parseFloat(coords.lng || coords.longitude);

          // Validate we got both values
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`[WorldMap] Invalid coordinates for ${member.full_name}:`, coords);
            return null;
          }
        }
        // PRIORITY 2: Array format [lat, lng] (Leaflet standard)
        else if (Array.isArray(coords) && coords.length >= 2) {
          const [first, second] = coords;

          // Assume [lat, lng] format (Leaflet standard)
          lat = parseFloat(first);
          lng = parseFloat(second);

          // Validate coordinates are within valid ranges
          // Latitude must be between -90 and 90
          // Longitude must be between -180 and 180
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`[WorldMap] Invalid array coordinates for ${member.full_name}:`, coords);
            return null;
          }

          // If values are out of range, they might be swapped
          if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            console.warn(`[WorldMap] Coordinates out of range for ${member.full_name}, attempting swap:`, coords);
            // Try swapping
            [lat, lng] = [lng, lat];

            // If still invalid, reject
            if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
              console.error(`[WorldMap] Cannot fix coordinates for ${member.full_name}:`, coords);
              return null;
            }
          }
        } else {
          console.warn(`[WorldMap] Unknown coordinate format for ${member.full_name}:`, coords);
          return null;
        }

        // Final validation: ensure coordinates are within valid ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.error(`[WorldMap] Coordinates out of valid range for ${member.full_name}: lat=${lat}, lng=${lng}`);
          return null;
        }

        // Debug logging
        console.log(`[WorldMap] Parsed ${member.full_name || member.location}: lat=${lat}, lng=${lng}, creating [${lat}, ${lng}]`);

        return {
          name: member.location || member.full_name || member.name,
          coordinates: [lat, lng], // [latitude, longitude] for Leaflet
          region: 'crew'
        };
      })
      .filter(loc => loc !== null)
    : locations;

  // Determine which locations should show labels
  const locationsWithLabels = mapLocations.filter(location =>
    location.name.includes('TLP') ||
    ['Alaska', 'Netherlands', 'TLP Space Coast', 'TLP West Coast'].includes(location.name)
  );

  // Custom red marker icon
  const createRedMarker = () => {
    if (!L) return null;
    return L.divIcon({
      className: 'custom-red-marker',
      html: `<div style="
        width: 12px;
        height: 12px;
        background-color: #ef4444;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6], // Center of the icon
      popupAnchor: [0, -6], // Position popup above the icon (0 horizontal offset, -6 vertical to account for icon radius)
    });
  };

  if (!isClient || !L || !LeafletComponents) {
    return (
      <div className="w-full h-full bg-black relative flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMap } = LeafletComponents;

  // Component to handle map resize and ensure proper marker alignment
  function MapResizeHandler() {
    const map = useMap();
    const hasInvalidated = useRef(false);

    useEffect(() => {
      // Store map instance globally for access in event handlers
      window.mapInstance = map;

      // Invalidate size when component mounts to ensure proper rendering
      const invalidateSize = () => {
        if (!hasInvalidated.current) {
          map.invalidateSize();
          hasInvalidated.current = true;
        }
      };

      setTimeout(invalidateSize, 100);

      // Also invalidate after tiles load to fix marker alignment
      const timeoutId = setTimeout(() => {
        map.invalidateSize();
      }, 500);

      // Invalidate on window resize
      const handleResize = () => {
        map.invalidateSize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        if (window.mapInstance === map) {
          delete window.mapInstance;
        }
      };
    }, [map]);

    return null;
  }

  return (
    <div className="w-full h-full bg-black relative" style={{ minHeight: '300px' }}>
      <style>{`
        .leaflet-container {
          background-color: #000000 !important;
          font-family: inherit;
        }
        .leaflet-tile-pane {
          filter: grayscale(100%) brightness(0.55) contrast(1.6) !important;
        }
        .leaflet-tile {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          -ms-interpolation-mode: nearest-neighbor !important;
        }
        .leaflet-zoom-animated img {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          -ms-interpolation-mode: nearest-neighbor !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        .leaflet-control-zoom a {
          background-color: white !important;
          color: black !important;
          border: none !important;
          font-weight: bold !important;
          font-size: 18px !important;
          line-height: 30px !important;
          min-width: 44px !important;
          min-height: 44px !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #f0f0f0 !important;
        }
        .leaflet-control-attribution {
          background-color: rgba(0, 0, 0, 0.7) !important;
          color: white !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #4a9eff !important;
        }
        .leaflet-popup-content-wrapper {
          background-color: #1a1a1a !important;
          color: white !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          text-align: center !important;
          white-space: nowrap !important;
        }
        .leaflet-popup-tip {
          background-color: #1a1a1a !important;
        }
        .leaflet-popup-close-button {
          color: white !important;
          font-size: 20px !important;
          padding: 4px 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #ef4444 !important;
        }
        .custom-label {
          background-color: rgba(255, 255, 255, 0.95);
          color: #1a1a1a;
          padding: 4px 8px;
          border-radius: 2px;
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
          border: 1px solid #9ca3af;
          font-weight: 500;
        }
        .leaflet-marker-pane {
          z-index: 650 !important;
        }
        .leaflet-overlay-pane {
          z-index: 400 !important;
        }
        /* FIX: Force markers to be absolutely positioned */
        .leaflet-marker-icon {
          position: absolute !important;
        }
        .custom-red-marker {
          position: absolute !important;
        }
      `}</style>

      <MapContainer
        center={[30, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        minZoom={2}
        maxZoom={2}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={true}
        className="world-map-container"
        whenReady={() => {
          // Ensure map size is correct when ready
          setTimeout(() => {
            if (window.mapInstance) {
              window.mapInstance.invalidateSize();
            }
          }, 100);
        }}
      >
        <MapResizeHandler />
        {/* Grey/dark tile layer - crisp and clear */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.45}
          eventHandlers={{
            loading: () => {
              // Invalidate size when tiles start loading
              setTimeout(() => {
                if (window.mapInstance) {
                  window.mapInstance.invalidateSize();
                }
              }, 50);
            },
            load: () => {
              // Invalidate size when tiles finish loading to fix marker alignment
              setTimeout(() => {
                if (window.mapInstance) {
                  window.mapInstance.invalidateSize();
                }
              }, 100);
            }
          }}
        />

        {/* GeoJSON overlay to highlight North America and Europe in white - Disabled for now */}
        {/* <GeoJSONHighlight /> */}

        {/* Location Markers - Using exact coordinates */}
        {mapLocations.map((location, index) => {
          const icon = createRedMarker();
          if (!icon) return null;

          return (
            <Marker
              key={index}
              position={location.coordinates}
              icon={icon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-white">
                  <strong>{location.name}</strong>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Labels for specific locations - Hidden for now */}
        {/* {locationsWithLabels.map((location, index) => (
          <Marker
            key={`label-${index}`}
            position={location.coordinates}
            icon={L.divIcon({
              className: 'custom-label-marker',
              html: `<div class="custom-label">${location.name}</div>`,
              iconSize: [100, 20],
              iconAnchor: [50, 10],
            })}
          />
        ))} */}
      </MapContainer>
    </div>
  );
};

export default WorldMap;
