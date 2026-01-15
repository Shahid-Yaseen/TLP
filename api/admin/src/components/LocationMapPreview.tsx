import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Component to center map on marker
const MapCenter: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, 10);
  }, [map, position]);
  
  return null;
};

// Custom red marker icon
const createRedMarker = () => {
  if (typeof window === 'undefined' || !L) return null;
  return L.divIcon({
    className: 'custom-red-marker',
    html: `<div style="
      width: 20px;
      height: 20px;
      background-color: #ef4444;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface LocationMapPreviewProps {
  coordinates?: any;
  location?: string;
}

const LocationMapPreview: React.FC<LocationMapPreviewProps> = ({ coordinates, location }) => {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Parse coordinates
  let lat: number | null = null;
  let lng: number | null = null;

  if (coordinates) {
    if (typeof coordinates === 'object') {
      const latStr = coordinates.lat;
      const lngStr = coordinates.lng;
      
      if (latStr && lngStr) {
        lat = parseFloat(latStr);
        lng = parseFloat(lngStr);
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          lat = null;
          lng = null;
          setMapError('Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.');
        } else {
          setMapError(null);
        }
      }
    }
  }

  if (!isClient) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading map...
        </Typography>
      </Paper>
    );
  }

  if (!lat || !lng) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Enter latitude and longitude coordinates to see the location on the map.
        </Typography>
        {location && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Location: {location}
          </Typography>
        )}
        {mapError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {mapError}
          </Alert>
        )}
      </Paper>
    );
  }

  const position: [number, number] = [lat, lng];
  const marker = createRedMarker();

  if (!marker) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading map...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        Location Preview
      </Typography>
      {location && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {location}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
      </Typography>
      <Box
        sx={{
          height: '300px',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          mt: 1
        }}
      >
        <MapContainer
          center={position}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter position={position} />
          <Marker position={position} icon={marker} />
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default LocationMapPreview;
