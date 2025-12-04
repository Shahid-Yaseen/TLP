import React, { useState, useEffect } from 'react';
import { useDataProvider } from 'react-admin';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Map as MapIcon,
  LocationOn,
  Edit as EditIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon for crew members
const createCrewIcon = (color: string = '#1976d2') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

// Component to fit map bounds to markers
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
};

interface CrewMember {
  id: number;
  full_name: string;
  location: string;
  category: string;
  title: string;
  coordinates: { lat: number; lng: number } | null;
  is_active: boolean;
  profile_image_url?: string;
}

const CrewMap: React.FC = () => {
  const dataProvider = useDataProvider();
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCrewMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dataProvider.getList('crew', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'full_name', order: 'ASC' },
          filter: { is_active: true }
        });
        
        // Parse coordinates from JSONB
        const members = response.data.map((member: any) => ({
          ...member,
          coordinates: member.coordinates && typeof member.coordinates === 'string' 
            ? JSON.parse(member.coordinates)
            : member.coordinates
        }));
        
        setCrewMembers(members);
      } catch (err: any) {
        setError(err.message || 'Failed to load crew members');
      } finally {
        setLoading(false);
      }
    };

    loadCrewMembers();
  }, [dataProvider]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'ADVISOR': '#1976d2',
      'PRODUCTION': '#388e3c',
      'JOURNALIST': '#f57c00',
      'SPACE HISTORY WRITER': '#7b1fa2',
      'ROCKETCHASER': '#c2185b',
      'MODERATOR': '#0288d1',
    };
    return colors[category] || '#757575';
  };

  // Filter members with valid coordinates
  const membersWithCoordinates = crewMembers.filter(
    member => member.coordinates && 
    typeof member.coordinates.lat === 'number' && 
    typeof member.coordinates.lng === 'number'
  );

  const membersWithoutCoordinates = crewMembers.filter(
    member => !member.coordinates || 
    typeof member.coordinates.lat !== 'number' || 
    typeof member.coordinates.lng !== 'number'
  );

  const positions: [number, number][] = membersWithCoordinates.map(member => [
    member.coordinates!.lat,
    member.coordinates!.lng
  ]);

  // Default center (world center) if no coordinates
  const defaultCenter: [number, number] = [20, 0];
  const mapCenter = positions.length > 0 
    ? [positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length,
       positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length] as [number, number]
    : defaultCenter;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <MapIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Crew Location Map
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          View and manage crew member locations on an interactive map
        </Typography>
      </Paper>

      <Box component="div" sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Map */}
        <Box sx={{ flex: membersWithoutCoordinates.length > 0 ? '2' : '1', minWidth: 0 }}>
          <Paper elevation={2} sx={{ height: '600px', overflow: 'hidden', position: 'relative' }}>
            <MapContainer
              center={mapCenter}
              zoom={positions.length > 0 ? 3 : 2}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {membersWithCoordinates.map((member) => (
                <Marker
                  key={member.id}
                  position={[member.coordinates!.lat, member.coordinates!.lng]}
                  icon={createCrewIcon(getCategoryColor(member.category))}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="h6" gutterBottom>
                        {member.full_name}
                      </Typography>
                      {member.title && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {member.title}
                        </Typography>
                      )}
                      {member.category && (
                        <Chip
                          label={member.category}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryColor(member.category),
                            color: 'white',
                            mb: 1,
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                      {member.location && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <LocationOn sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                          {member.location}
                        </Typography>
                      )}
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit Crew Member">
                          <IconButton
                            size="small"
                            onClick={() => window.location.href = `#/crew/${member.id}/edit`}
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Popup>
                </Marker>
              ))}
              
              {positions.length > 0 && <FitBounds positions={positions} />}
            </MapContainer>
          </Paper>
        </Box>

        {/* Members without coordinates */}
        {membersWithoutCoordinates.length > 0 && (
          <Box sx={{ flex: '1', minWidth: 0 }}>
            <Paper elevation={2} sx={{ p: 2, maxHeight: '600px', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Members Without Coordinates
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {membersWithoutCoordinates.length} crew member(s) need location coordinates
              </Typography>
              <Stack spacing={1}>
                {membersWithoutCoordinates.map((member) => (
                  <Card key={member.id} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {member.full_name}
                          </Typography>
                          {member.location && (
                            <Typography variant="caption" color="text.secondary">
                              {member.location}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => window.location.href = `#/crew/${member.id}/edit`}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Summary Stats */}
      <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
        <Stack direction="row" spacing={4} justifyContent="center">
          <Box textAlign="center">
            <Typography variant="h4" color="primary">
              {crewMembers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Crew Members
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="success.main">
              {membersWithCoordinates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              With Coordinates
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4" color="warning.main">
              {membersWithoutCoordinates.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need Coordinates
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default CrewMap;

