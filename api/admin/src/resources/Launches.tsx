import { 
  List, Create, Edit, Show, TabbedForm, FormTab, TabbedShowLayout,
  TextInput, DateTimeInput, NumberInput, ReferenceInput, SelectInput, 
  Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, 
  BooleanInput, FunctionField, BooleanField,
  useRecordContext, ArrayInput, SimpleFormIterator, ArrayField,
  TopToolbar, useListContext,
  useNotify, useRefresh, ReferenceField
} from 'react-admin';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { Box, Typography, Divider, Paper, Grid, Chip, IconButton, Card, CardContent, CardMedia, CardActions, ButtonGroup, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRedirect } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

const outcomeChoices = [
  { id: 'success', name: 'Success' },
  { id: 'failure', name: 'Failure' },
  { id: 'partial', name: 'Partial' },
  { id: 'TBD', name: 'TBD' },
];

// Card View Component
const LaunchCardView = () => {
  const { data, isLoading } = useListContext();
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const redirect = useRedirect();
  
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const linkColor = theme?.palette?.primary?.main || '#1976d2';
  
  const parseJsonb = (value: any) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return value;
  };
  
  if (isLoading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }
  
  if (!data || data.length === 0) {
    return <Box sx={{ p: 3 }}>No launches found</Box>;
  }
  
  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      {data.map((record: any) => {
        const image = record?.image || parseJsonb(record?.image_json) || {};
        const imageUrl = image?.image_url || 'https://i.imgur.com/3kPqWvM.jpeg';
        const outcome = record?.outcome || 'TBD';
        const outcomeChoice = outcomeChoices.find(c => c.id === outcome);
        const outcomeName = outcomeChoice ? outcomeChoice.name : outcome;
        
        const statusColors: any = {
          success: { bg: '#4caf50', color: '#fff' },
          failure: { bg: '#f44336', color: '#fff' },
          partial: { bg: '#ff9800', color: '#fff' },
          TBD: { bg: '#9e9e9e', color: '#fff' }
        };
        const colors = statusColors[outcome] || statusColors.TBD;
        
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={record.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => redirect(`/launches/${record.id}/show`)}
            >
              <CardMedia
                component="img"
                height="200"
                image={imageUrl}
                alt={record.name || 'Launch'}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: textPrimary,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {record.name || 'Unnamed Launch'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={outcomeName.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: colors.bg,
                      color: colors.color,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '24px'
                    }}
                  />
                  {record?.is_featured && (
                    <Chip
                      label="FEATURED"
                      size="small"
                      sx={{
                        backgroundColor: linkColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {record.provider && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Provider:</strong> {typeof record.provider === 'string' ? record.provider : (record.provider?.name || 'N/A')}
                    </Typography>
                  )}
                  {record.rocket && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Rocket:</strong> {typeof record.rocket === 'string' ? record.rocket : (record.rocket?.name || 'N/A')}
                    </Typography>
                  )}
                  {record.site && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Site:</strong> {typeof record.site === 'string' ? record.site : (record.site?.name || 'N/A')}
                    </Typography>
                  )}
                  {record.launch_date && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Date:</strong> {new Date(record.launch_date).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 1.5, pt: 0, gap: 1 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  onClick={() => redirect(`/launches/${record.id}/show`)}
                  sx={{ color: linkColor }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  onClick={() => redirect(`/launches/${record.id}`)}
                  sx={{ color: linkColor }}
                >
                  Edit
                </Button>
                <DeleteButton record={record} />
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export const LaunchList = (props: any) => {
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  
  useEffect(() => {
    const saved = localStorage.getItem('launchListViewMode');
    if (saved === 'cards' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);
  
  const handleViewChange = (mode: 'list' | 'cards') => {
    setViewMode(mode);
    localStorage.setItem('launchListViewMode', mode);
  };
  
  return (
    <List 
      {...props}
      actions={
        <TopToolbar>
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => handleViewChange('list')}
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ViewListIcon />}
            >
              List
            </Button>
            <Button
              onClick={() => handleViewChange('cards')}
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              startIcon={<ViewModuleIcon />}
            >
              Cards
            </Button>
          </ButtonGroup>
        </TopToolbar>
      }
    >
      {viewMode === 'list' ? (
        <Datagrid rowClick="show">
          <TextField source="id" />
          <TextField source="name" />
          <TextField source="provider" />
          <TextField source="rocket" />
          <TextField source="site" />
          <DateField source="launch_date" showTime />
          <FunctionField
            source="outcome"
            render={(record: any) => {
              const choice = outcomeChoices.find(c => c.id === record.outcome);
              return choice ? choice.name : record.outcome || 'TBD';
            }}
          />
          <ShowButton />
          <EditButton />
          <DeleteButton />
        </Datagrid>
      ) : (
        <LaunchCardView />
      )}
    </List>
  );
};

// JSONB Field Component for editing complex JSON objects
const JsonbInput = ({ source, label, helperText }: any) => {
  return (
    <TextInput 
      source={source} 
      label={label}
      multiline 
      rows={8}
      helperText={helperText || "Enter valid JSON"}
      format={(value: any) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        return JSON.stringify(value, null, 2);
      }}
      parse={(value: string) => {
        if (!value || value.trim() === '') return null;
        try {
          return JSON.parse(value);
        } catch (e) {
          return value; // Return as string if invalid JSON
        }
      }}
    />
  );
};

// Array Field Component for editing arrays (unused - kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ArrayJsonbInput = ({ source, label, helperText }: any) => {
  return (
    <TextInput 
      source={source} 
      label={label}
      multiline 
      rows={10}
      helperText={helperText || "Enter valid JSON array"}
      format={(value: any) => {
        if (!value) return '[]';
        if (typeof value === 'string') return value;
        return JSON.stringify(value, null, 2);
      }}
      parse={(value: string) => {
        if (!value || value.trim() === '') return [];
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return []; // Return empty array if invalid JSON
        }
      }}
    />
  );
};

// Agency Array Editor Component
const AgenciesArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Agencies">
      <SimpleFormIterator>
        <TextInput source="id" label="Agency ID" />
        <TextInput source="name" label="Name" />
        <TextInput source="abbrev" label="Abbreviation" />
        <TextInput source="type" label="Type" />
        <TextInput source="description" label="Description" multiline rows={2} />
        <TextInput source="url" label="URL" />
        <TextInput source="country_code" label="Country Code" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Info URLs Array Editor Component
const InfoUrlsArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Info URLs">
      <SimpleFormIterator>
        <NumberInput source="priority" label="Priority" />
        <TextInput source="source" label="Source" />
        <TextInput source="title" label="Title" />
        <TextInput source="description" label="Description" multiline rows={2} />
        <TextInput source="url" label="URL" />
        <TextInput source="feature_image" label="Feature Image" />
        <TextInput source="type.id" label="Type ID" />
        <TextInput source="type.name" label="Type Name" />
        <TextInput source="language.id" label="Language ID" />
        <TextInput source="language.name" label="Language Name" />
        <TextInput source="language.code" label="Language Code" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Video URLs Array Editor Component
const VidUrlsArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Video URLs">
      <SimpleFormIterator>
        <NumberInput source="priority" label="Priority" />
        <TextInput source="source" label="Source" />
        <TextInput source="publisher" label="Publisher" />
        <TextInput source="title" label="Title" />
        <TextInput source="description" label="Description" multiline rows={2} />
        <TextInput source="url" label="URL" />
        <TextInput source="feature_image" label="Feature Image" />
        <TextInput source="type.id" label="Type ID" />
        <TextInput source="type.name" label="Type Name" />
        <TextInput source="language.id" label="Language ID" />
        <TextInput source="language.name" label="Language Name" />
        <TextInput source="language.code" label="Language Code" />
        <DateTimeInput source="start_time" label="Start Time" />
        <DateTimeInput source="end_time" label="End Time" />
        <BooleanInput source="live" label="Live" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Related Stories Array Editor Component
const RelatedStoriesArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Related Stories">
      <SimpleFormIterator>
        <TextInput source="id" label="Article ID" helperText="ID of the related news article" />
        <TextInput source="title" label="Title" helperText="Article title" />
        <TextInput source="url" label="URL" helperText="Link to the article" />
        <TextInput source="slug" label="Slug" helperText="URL-friendly identifier" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Updates Array Editor Component
const UpdatesArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Updates">
      <SimpleFormIterator>
        <NumberInput source="id" label="Update ID" />
        <TextInput source="profile_image" label="Profile Image" />
        <TextInput source="comment" label="Comment" multiline rows={3} />
        <TextInput source="info_url" label="Info URL" />
        <TextInput source="created_by" label="Created By" />
        <DateTimeInput source="created_on" label="Created On" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Timeline Array Editor Component
const TimelineArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Timeline">
      <SimpleFormIterator>
        <TextInput source="type.id" label="Type ID" />
        <TextInput source="type.abbrev" label="Type Abbreviation" />
        <TextInput source="type.description" label="Type Description" multiline rows={2} />
        <TextInput source="relative_time" label="Relative Time" helperText="ISO 8601 duration format (e.g., PT-1H30M)" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Mission Patches Array Editor Component
const MissionPatchesArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Mission Patches">
      <SimpleFormIterator>
        <NumberInput source="id" label="Patch ID" />
        <TextInput source="name" label="Name" />
        <TextInput source="image_url" label="Image URL" />
        <TextInput source="thumbnail_url" label="Thumbnail URL" />
        <TextInput source="agency.id" label="Agency ID" />
        <TextInput source="agency.name" label="Agency Name" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Payloads Array Editor Component
const PayloadsArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Payloads">
      <SimpleFormIterator>
        <NumberInput source="id" label="Payload ID" />
        <TextInput source="name" label="Name" />
        <TextInput source="description" label="Description" multiline rows={3} />
        <TextInput source="type" label="Type" />
        <NumberInput source="mass_kg" label="Mass (kg)" />
        <NumberInput source="mass_lbs" label="Mass (lbs)" />
        <TextInput source="orbit" label="Orbit" />
        <BooleanInput source="reused" label="Reused" />
        <TextInput source="manufacturer.id" label="Manufacturer ID" />
        <TextInput source="manufacturer.name" label="Manufacturer Name" />
        <JsonbInput source="customers" label="Customers (JSON Array)" helperText="Array of customer objects" />
        <JsonbInput source="nationalities" label="Nationalities (JSON Array)" helperText="Array of nationality strings" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Crew Array Editor Component
const CrewArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Crew">
      <SimpleFormIterator>
        <NumberInput source="id" label="Crew ID" />
        <TextInput source="role" label="Role" />
        <TextInput source="astronaut.id" label="Astronaut ID" />
        <TextInput source="astronaut.name" label="Astronaut Name" />
        <TextInput source="astronaut.status.id" label="Status ID" />
        <TextInput source="astronaut.status.name" label="Status Name" />
        <TextInput source="astronaut.type.id" label="Type ID" />
        <TextInput source="astronaut.type.name" label="Type Name" />
        <TextInput source="astronaut.date_of_birth" label="Date of Birth" />
        <TextInput source="astronaut.date_of_death" label="Date of Death" />
        <TextInput source="astronaut.nationality" label="Nationality" />
        <TextInput source="astronaut.bio" label="Bio" multiline rows={3} />
        <TextInput source="astronaut.profile_image" label="Profile Image" />
        <TextInput source="astronaut.profile_image_thumbnail" label="Profile Image Thumbnail" />
        <TextInput source="astronaut.wiki" label="Wiki URL" />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Hazards Array Editor Component
const HazardsArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Hazards">
      <SimpleFormIterator>
        <NumberInput source="id" label="Hazard ID" />
        <TextInput source="name" label="Name" />
        <TextInput source="description" label="Description" multiline rows={3} />
        <TextInput source="type" label="Type" />
        <TextInput source="severity" label="Severity" />
        <TextInput source="mitigation" label="Mitigation" multiline rows={2} />
      </SimpleFormIterator>
    </ArrayInput>
  );
};

// Program Array Editor Component
const ProgramArrayInput = ({ source }: any) => {
  return (
    <ArrayInput source={source} label="Programs">
      <SimpleFormIterator>
        <NumberInput source="id" label="Program ID" />
        <TextInput source="name" label="Program Name" />
        <TextInput source="description" label="Description" multiline rows={3} />
        <TextInput source="image_url" label="Image URL" />
        <TextInput source="info_url" label="Info URL" />
        <TextInput source="wiki_url" label="Wiki URL" />
        <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Agencies</h4>
        <ArrayInput source="agencies" label="">
          <SimpleFormIterator>
            <NumberInput source="id" label="Agency ID" />
            <TextInput source="name" label="Name" />
            <TextInput source="abbrev" label="Abbreviation" />
            <TextInput source="type" label="Type" />
            <TextInput source="url" label="URL" />
          </SimpleFormIterator>
        </ArrayInput>
        <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mission Patches</h4>
        <ArrayInput source="mission_patches" label="">
          <SimpleFormIterator>
            <NumberInput source="id" label="Patch ID" />
            <TextInput source="name" label="Name" />
            <TextInput source="image_url" label="Image URL" />
            <TextInput source="thumbnail_url" label="Thumbnail URL" />
            <TextInput source="agency.id" label="Agency ID" />
            <TextInput source="agency.name" label="Agency Name" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleFormIterator>
    </ArrayInput>
  );
};

export const LaunchCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="launches" />}>
    <TabbedForm>
      <FormTab label="Hero Section">
        <TextInput source="name" required label="Launch Name" />
        <TextInput source="slug" helperText="URL-friendly identifier" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hero Image</h3>
        <TextInput source="image_json.id" label="Image ID" />
        <TextInput source="image_json.image_url" label="Hero Image URL" />
        <TextInput source="image_json.thumbnail_url" label="Thumbnail URL" />
        <TextInput source="image_json.name" label="Image Name" />
        <TextInput source="image_json.credit" label="Image Credit" />
        <TextInput source="image_json.license" label="Image License" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Launch Timing</h3>
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <BooleanInput source="is_featured" label="Featured Launch" />
      </FormTab>

      <FormTab label="Video Section">
        <TextInput 
          source="youtube_video_id" 
          label="Live Coverage YouTube Video ID" 
          helperText="YouTube video ID for live launch coverage. Leave empty if no live coverage available."
        />
        <TextInput 
          source="youtube_channel_id" 
          label="Live Coverage YouTube Channel ID" 
          helperText="YouTube channel ID for live coverage (optional)"
        />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h3>
        <VidUrlsArrayInput source="vid_urls" />
      </FormTab>

      <FormTab label="Payload">
        <PayloadsArrayInput source="payloads" />
      </FormTab>

      <FormTab label="Crew">
        <CrewArrayInput source="crew" />
      </FormTab>

      <FormTab label="Rocket">
        <ReferenceInput source="rocket_id" reference="rockets">
          <SelectInput optionText="name" label="Rocket Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Rocket Details</h3>
        <TextInput source="rocket_json.id" label="Rocket ID" />
        <TextInput source="rocket_json.url" label="Rocket URL" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Configuration</h4>
        <TextInput source="rocket_json.configuration.id" label="Configuration ID" />
        <TextInput source="rocket_json.configuration.name" label="Configuration Name" />
        <TextInput source="rocket_json.configuration.full_name" label="Full Name" />
        <TextInput source="rocket_json.configuration.variant" label="Variant" />
        <TextInput source="rocket_json.configuration.description" label="Description" multiline rows={3} />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Family</h4>
        <TextInput source="rocket_json.configuration.family.id" label="Family ID" />
        <TextInput source="rocket_json.configuration.family.name" label="Family Name" />
      </FormTab>

      <FormTab label="Engine">
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Engine information is nested in rocket_json.configuration.launcher_stage[].engines[]. 
          For detailed engine editing, use the JSON field below or edit via the Rocket tab.
        </Typography>
        <TextInput source="rocket_json.configuration.launcher_stage" label="Launcher Stages (JSON)" helperText="Array of stages with engines. Format: JSON array of stage objects with engines array" multiline rows={8} />
      </FormTab>

      <FormTab label="Provider">
        <ReferenceInput source="provider_id" reference="providers">
          <SelectInput optionText="name" label="Provider Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Provider Details</h3>
        <TextInput source="launch_service_provider_json.id" label="Provider ID" />
        <TextInput source="launch_service_provider_json.url" label="Provider URL" />
        <TextInput source="launch_service_provider_json.name" label="Provider Name" />
        <TextInput source="launch_service_provider_json.abbrev" label="Abbreviation" />
        <TextInput source="launch_service_provider_json.type" label="Type" />
        <TextInput source="launch_service_provider_json.description" label="Description" multiline rows={3} />
        <TextInput source="launch_service_provider_json.country_code" label="Country Code" />
        <NumberInput source="launch_service_provider_json.founding_year" label="Founding Year" />
        <TextInput source="launch_service_provider_json.administrator" label="Administrator" />
        <TextInput source="launch_service_provider_json.wiki_url" label="Wiki URL" />
        <TextInput source="launch_service_provider_json.info_url" label="Info URL" />
        <TextInput source="launch_service_provider_json.logo_url" label="Logo URL" />
      </FormTab>

      <FormTab label="PAD">
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" label="Launch Site Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Pad Details</h3>
        <TextInput source="pad_json.id" label="Pad ID" />
        <TextInput source="pad_json.url" label="Pad URL" />
        <TextInput source="pad_json.name" label="Pad Name" />
        <BooleanInput source="pad_json.active" label="Active" />
        <TextInput source="pad_json.description" label="Description" multiline rows={3} />
        <TextInput source="pad_json.info_url" label="Info URL" />
        <TextInput source="pad_json.wiki_url" label="Wiki URL" />
        <TextInput source="pad_json.map_url" label="Map URL" />
        <NumberInput source="pad_json.latitude" label="Latitude" />
        <NumberInput source="pad_json.longitude" label="Longitude" />
        <TextInput source="pad_json.country_code" label="Country Code" />
        <TextInput source="pad_json.map_image" label="Map Image URL" />
        <NumberInput source="pad_json.total_launch_count" label="Total Launch Count" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Location</h4>
        <TextInput source="pad_json.location.id" label="Location ID" />
        <TextInput source="pad_json.location.name" label="Location Name" />
        <TextInput source="pad_json.location.country_code" label="Location Country Code" />
      </FormTab>

      <FormTab label="Hazards">
        <HazardsArrayInput source="hazards" />
      </FormTab>

      <FormTab label="Author">
        <ReferenceInput source="author_id" reference="authors" label="Author">
          <SelectInput optionText="full_name" />
        </ReferenceInput>
      </FormTab>

      <FormTab label="Launch Overview">
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" label="Launch Site" />
        </ReferenceInput>
        <SelectInput source="outcome" choices={outcomeChoices} defaultValue="TBD" label="Outcome" />
        <NumberInput source="probability" helperText="0-100" label="Probability (%)" />
        <TextInput source="mission_description" multiline rows={5} label="Mission Description" />
        <TextInput source="details" multiline rows={5} label="Details" />
        <TextInput source="url" label="Launch URL" />
        <TextInput source="launch_designator" label="Launch Designator" helperText="e.g., 1957-001" />
        <ReferenceInput source="orbit_id" reference="orbits">
          <SelectInput optionText="code" label="Orbit" />
        </ReferenceInput>
        <BooleanInput source="webcast_live" label="Webcast Live" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Status</h3>
        <TextInput source="status_json.id" label="Status ID" />
        <TextInput source="status_json.name" label="Status Name" />
        <TextInput source="status_json.abbrev" label="Status Abbreviation" />
        <TextInput source="status_json.description" label="Status Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Weather Concerns</h3>
        <TextInput source="weather_concerns" multiline rows={3} label="Weather Concerns (Text)" />
        <TextInput source="weather_concerns_json.id" label="Weather Concerns ID" />
        <TextInput source="weather_concerns_json.name" label="Weather Concerns Name" />
        <TextInput source="weather_concerns_json.description" label="Weather Concerns Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Failure Reason</h3>
        <TextInput source="failreason" label="Failure Reason" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hashtag</h3>
        <TextInput source="hashtag" label="Hashtag (Text)" />
        <TextInput source="hashtag_json.id" label="Hashtag ID" />
        <TextInput source="hashtag_json.name" label="Hashtag Name" />
        <TextInput source="hashtag_json.description" label="Hashtag Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>NET Precision</h3>
        <TextInput source="net_precision.id" label="NET Precision ID" />
        <TextInput source="net_precision.name" label="NET Precision Name" />
        <TextInput source="net_precision.abbrev" label="NET Precision Abbreviation" />
        <TextInput source="net_precision.description" label="NET Precision Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Mission</h3>
        <TextInput source="mission_json.id" label="Mission ID" />
        <TextInput source="mission_json.name" label="Mission Name" />
        <TextInput source="mission_json.description" label="Mission Description" multiline rows={5} />
        <TextInput source="mission_json.type" label="Mission Type" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Orbit</h4>
        <TextInput source="mission_json.orbit.id" label="Orbit ID" />
        <TextInput source="mission_json.orbit.name" label="Orbit Name" />
        <TextInput source="mission_json.orbit.abbrev" label="Orbit Abbreviation" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Agencies</h4>
        <AgenciesArrayInput source="mission_json.agencies" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Info URLs</h4>
        <InfoUrlsArrayInput source="mission_json.info_urls" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h4>
        <VidUrlsArrayInput source="mission_json.vid_urls" />
      </FormTab>

      <FormTab label="Payload Overview">
        <TextInput source="mission_json.description" label="Payload Description" multiline rows={3} helperText="From mission JSON" />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          See the "Payload" tab for detailed payload editing. This overview shows summary information.
        </Typography>
      </FormTab>

      <FormTab label="Recovery Overview">
        <TextInput source="recovery.landing_location" label="Landing Location" helperText="e.g., JUST READ THE INSTRUCTIONS" />
        <TextInput source="recovery.landing_type" label="Landing Type" helperText="e.g., droneship, land, splashdown, none" />
        <BooleanInput source="recovery.success" label="Recovery Success" />
        <DateTimeInput source="recovery.recovery_date" label="Recovery Date" />
        <TextInput source="recovery.notes" label="Recovery Notes" multiline rows={3} />
      </FormTab>

      <FormTab label="Related Stories">
        <RelatedStoriesArrayInput source="related_stories" />
      </FormTab>

      <FormTab label="Comments">
        <Typography variant="body2" color="textSecondary">
          Comments are managed separately. They will appear in the Show view.
        </Typography>
      </FormTab>

      <FormTab label="Metadata">
        <TextInput source="external_id" label="External ID (UUID)" helperText="From Space Devs API" />
        <TextInput source="response_mode" label="Response Mode" defaultValue="normal" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Statistics</h3>
        <NumberInput source="orbital_launch_attempt_count" />
        <NumberInput source="location_launch_attempt_count" />
        <NumberInput source="pad_launch_attempt_count" />
        <NumberInput source="agency_launch_attempt_count" />
        <NumberInput source="orbital_launch_attempt_count_year" />
        <NumberInput source="location_launch_attempt_count_year" />
        <NumberInput source="pad_launch_attempt_count_year" />
        <NumberInput source="agency_launch_attempt_count_year" />
        <TextInput source="pad_turnaround" label="Pad Turnaround" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Additional Arrays</h3>
        <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Updates</h4>
        <UpdatesArrayInput source="updates" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Timeline</h4>
        <TimelineArrayInput source="timeline" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Info URLs</h4>
        <InfoUrlsArrayInput source="info_urls" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mission Patches</h4>
        <MissionPatchesArrayInput source="mission_patches" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Program</h4>
        <ProgramArrayInput source="program_json" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Infographic</h4>
        <TextInput source="infographic_json.id" label="Infographic ID" />
        <TextInput source="infographic_json.name" label="Infographic Name" />
        <TextInput source="infographic_json.image_url" label="Image URL" />
        <TextInput source="infographic_json.thumbnail_url" label="Thumbnail URL" />
        <TextInput source="infographic_json.credit" label="Credit" />
        <TextInput source="infographic_json.license" label="License" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Media</h4>
        <JsonbInput source="media" label="Media (JSON)" helperText="Media links object - complex structure, use JSON format" />
        <TextInput source="flightclub_url" label="FlightClub URL" />
      </FormTab>
    </TabbedForm>
  </Create>
);

// Transform function to reconstruct JSON objects from nested form fields
const transformLaunchData = (data: any) => {
  const transformed = { ...data };
  
  // Helper to check if any nested field exists
  const hasNestedFields = (prefix: string) => {
    return Object.keys(data).some(key => key.startsWith(prefix + '.'));
  };
  
  // Helper to remove all nested fields with a prefix
  const removeNestedFields = (prefix: string) => {
    Object.keys(transformed).forEach(key => {
      if (key.startsWith(prefix + '.')) {
        delete transformed[key];
      }
    });
  };
  
  // Reconstruct status_json
  if (hasNestedFields('status_json')) {
    transformed.status_json = {
      id: data['status_json.id'] || null,
      name: data['status_json.name'] || null,
      abbrev: data['status_json.abbrev'] || null,
      description: data['status_json.description'] || null,
    };
    removeNestedFields('status_json');
  }
  
  // Reconstruct rocket_json
  if (hasNestedFields('rocket_json')) {
    const config: any = {};
    if (data['rocket_json.configuration.id'] || data['rocket_json.configuration.name']) {
      config.id = data['rocket_json.configuration.id'] || null;
      config.name = data['rocket_json.configuration.name'] || null;
      config.full_name = data['rocket_json.configuration.full_name'] || null;
      config.variant = data['rocket_json.configuration.variant'] || null;
      config.description = data['rocket_json.configuration.description'] || null;
      
      if (data['rocket_json.configuration.family.id'] || data['rocket_json.configuration.family.name']) {
        config.family = {
          id: data['rocket_json.configuration.family.id'] || null,
          name: data['rocket_json.configuration.family.name'] || null,
        };
      }
    }
    
    transformed.rocket_json = {
      id: data['rocket_json.id'] || null,
      url: data['rocket_json.url'] || null,
      ...(Object.keys(config).length > 0 ? { configuration: config } : {}),
    };
    removeNestedFields('rocket_json');
  }
  
  // Reconstruct mission_json
  if (hasNestedFields('mission_json') || data['mission_json.agencies'] || data['mission_json.info_urls'] || data['mission_json.vid_urls']) {
    const orbit = (data['mission_json.orbit.id'] || data['mission_json.orbit.name']) ? {
      id: data['mission_json.orbit.id'] || null,
      name: data['mission_json.orbit.name'] || null,
      abbrev: data['mission_json.orbit.abbrev'] || null,
    } : null;
    
    // Preserve array fields if they exist (from ArrayInput or JsonbInput)
    // ArrayInput sends arrays directly, so check for both array and object formats
    const agencies = data['mission_json.agencies'] !== undefined 
      ? (Array.isArray(data['mission_json.agencies']) ? data['mission_json.agencies'] : null)
      : null;
    const info_urls = data['mission_json.info_urls'] !== undefined 
      ? (Array.isArray(data['mission_json.info_urls']) ? data['mission_json.info_urls'] : null)
      : null;
    const vid_urls = data['mission_json.vid_urls'] !== undefined 
      ? (Array.isArray(data['mission_json.vid_urls']) ? data['mission_json.vid_urls'] : null)
      : null;
    
    transformed.mission_json = {
      id: data['mission_json.id'] || null,
      name: data['mission_json.name'] || null,
      description: data['mission_json.description'] || null,
      type: data['mission_json.type'] || null,
      ...(orbit ? { orbit } : {}),
      ...(agencies !== null && agencies.length > 0 ? { agencies } : {}),
      ...(info_urls !== null && info_urls.length > 0 ? { info_urls } : {}),
      ...(vid_urls !== null && vid_urls.length > 0 ? { vid_urls } : {}),
    };
    removeNestedFields('mission_json');
  }
  
  // Reconstruct pad_json
  if (hasNestedFields('pad_json')) {
    const location = (data['pad_json.location.id'] || data['pad_json.location.name']) ? {
      id: data['pad_json.location.id'] || null,
      name: data['pad_json.location.name'] || null,
      country_code: data['pad_json.location.country_code'] || null,
    } : null;
    
    transformed.pad_json = {
      id: data['pad_json.id'] || null,
      url: data['pad_json.url'] || null,
      name: data['pad_json.name'] || null,
      active: data['pad_json.active'] !== undefined ? data['pad_json.active'] : null,
      description: data['pad_json.description'] || null,
      info_url: data['pad_json.info_url'] || null,
      wiki_url: data['pad_json.wiki_url'] || null,
      map_url: data['pad_json.map_url'] || null,
      latitude: data['pad_json.latitude'] ? parseFloat(String(data['pad_json.latitude'])) : null,
      longitude: data['pad_json.longitude'] ? parseFloat(String(data['pad_json.longitude'])) : null,
      country_code: data['pad_json.country_code'] || null,
      map_image: data['pad_json.map_image'] || null,
      ...(location ? { location } : {}),
      total_launch_count: data['pad_json.total_launch_count'] ? parseInt(String(data['pad_json.total_launch_count'])) : null,
    };
    removeNestedFields('pad_json');
  }
  
  // Reconstruct launch_service_provider_json
  if (hasNestedFields('launch_service_provider_json')) {
    transformed.launch_service_provider_json = {
      id: data['launch_service_provider_json.id'] || null,
      url: data['launch_service_provider_json.url'] || null,
      name: data['launch_service_provider_json.name'] || null,
      abbrev: data['launch_service_provider_json.abbrev'] || null,
      type: data['launch_service_provider_json.type'] || null,
      description: data['launch_service_provider_json.description'] || null,
      country_code: data['launch_service_provider_json.country_code'] || null,
      founding_year: data['launch_service_provider_json.founding_year'] ? parseInt(String(data['launch_service_provider_json.founding_year'])) : null,
      administrator: data['launch_service_provider_json.administrator'] || null,
      wiki_url: data['launch_service_provider_json.wiki_url'] || null,
      info_url: data['launch_service_provider_json.info_url'] || null,
      logo_url: data['launch_service_provider_json.logo_url'] || null,
    };
    removeNestedFields('launch_service_provider_json');
  }
  
  // Reconstruct image_json
  if (hasNestedFields('image_json')) {
    transformed.image_json = {
      id: data['image_json.id'] || null,
      name: data['image_json.name'] || null,
      image_url: data['image_json.image_url'] || null,
      thumbnail_url: data['image_json.thumbnail_url'] || null,
      credit: data['image_json.credit'] || null,
      license: data['image_json.license'] || null,
    };
    removeNestedFields('image_json');
  }
  
  // Reconstruct infographic_json
  if (hasNestedFields('infographic_json')) {
    transformed.infographic_json = {
      id: data['infographic_json.id'] || null,
      name: data['infographic_json.name'] || null,
      image_url: data['infographic_json.image_url'] || null,
      thumbnail_url: data['infographic_json.thumbnail_url'] || null,
      credit: data['infographic_json.credit'] || null,
      license: data['infographic_json.license'] || null,
    };
    removeNestedFields('infographic_json');
  }
  
  // Reconstruct weather_concerns_json
  if (hasNestedFields('weather_concerns_json')) {
    transformed.weather_concerns_json = {
      id: data['weather_concerns_json.id'] || null,
      name: data['weather_concerns_json.name'] || null,
      description: data['weather_concerns_json.description'] || null,
    };
    removeNestedFields('weather_concerns_json');
  }
  
  // Reconstruct hashtag_json
  if (hasNestedFields('hashtag_json')) {
    transformed.hashtag_json = {
      id: data['hashtag_json.id'] || null,
      name: data['hashtag_json.name'] || null,
      description: data['hashtag_json.description'] || null,
    };
    removeNestedFields('hashtag_json');
  }
  
  // Reconstruct net_precision
  if (hasNestedFields('net_precision')) {
    transformed.net_precision = {
      id: data['net_precision.id'] || null,
      name: data['net_precision.name'] || null,
      abbrev: data['net_precision.abbrev'] || null,
      description: data['net_precision.description'] || null,
    };
    removeNestedFields('net_precision');
  }
  
  return transformed;
};

export const LaunchEdit = (props: any) => {
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const linkColor = theme?.palette?.primary?.main || '#1976d2';
  
  return (
    <Edit {...props} transform={transformLaunchData} actions={<BackButtonActions resource="launches" />}>
    <TabbedForm
      sx={{
        '& .MuiTabs-root': {
          flexWrap: 'wrap',
          minHeight: 'auto',
          position: 'relative',
        },
        '& .MuiTabs-flexContainer': {
          flexWrap: 'wrap',
          gap: '4px',
          position: 'relative',
        },
        '& .MuiTabs-indicator': {
          display: 'none', // Hide the default indicator
        },
        '& .MuiTab-root': {
          minWidth: '120px',
          maxWidth: '180px',
          width: 'auto',
          flex: '0 0 auto',
          fontSize: '0.875rem',
          padding: '12px 16px',
          textTransform: 'none',
          fontWeight: 500,
          borderBottom: '2px solid transparent',
          transition: 'border-color 0.3s ease',
          '&.Mui-selected': {
            borderBottom: `2px solid ${linkColor}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          },
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
          }
        }
      }}
    >
      <FormTab label="Hero Section">
        <TextInput source="id" disabled />
        <TextInput source="name" required label="Launch Name" />
        <TextInput source="slug" helperText="URL-friendly identifier" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hero Image</h3>
        <TextInput source="image_json.id" label="Image ID" />
        <TextInput source="image_json.image_url" label="Hero Image URL" fullWidth />
        <TextInput source="image_json.thumbnail_url" label="Thumbnail URL" />
        <TextInput source="image_json.name" label="Image Name" />
        <TextInput source="image_json.credit" label="Image Credit" />
        <TextInput source="image_json.license" label="Image License" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Launch Timing</h3>
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <BooleanInput source="is_featured" label="Featured Launch" />
      </FormTab>

      <FormTab label="Video Section">
        <TextInput 
          source="youtube_video_id" 
          label="Live Coverage YouTube Video ID" 
          helperText="YouTube video ID for live launch coverage. Leave empty if no live coverage available."
        />
        <TextInput 
          source="youtube_channel_id" 
          label="Live Coverage YouTube Channel ID" 
          helperText="YouTube channel ID for live coverage (optional)"
        />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h3>
        <VidUrlsArrayInput source="vid_urls" />
      </FormTab>

      <FormTab label="Payload">
        <PayloadsArrayInput source="payloads" />
      </FormTab>

      <FormTab label="Crew">
        <CrewArrayInput source="crew" />
      </FormTab>

      <FormTab label="Rocket">
        <ReferenceInput source="rocket_id" reference="rockets">
          <SelectInput optionText="name" label="Rocket Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Rocket Details</h3>
          <TextInput source="rocket_json.id" label="Rocket ID" />
          <TextInput source="rocket_json.url" label="Rocket URL" />
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Configuration</h4>
          <TextInput source="rocket_json.configuration.id" label="Configuration ID" />
          <TextInput source="rocket_json.configuration.name" label="Configuration Name" />
          <TextInput source="rocket_json.configuration.full_name" label="Full Name" />
          <TextInput source="rocket_json.configuration.variant" label="Variant" />
          <TextInput source="rocket_json.configuration.description" label="Description" multiline rows={3} />
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Family</h4>
          <TextInput source="rocket_json.configuration.family.id" label="Family ID" />
          <TextInput source="rocket_json.configuration.family.name" label="Family Name" />
      </FormTab>

      <FormTab label="Engine">
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Engine information is nested in rocket_json.configuration.launcher_stage[].engines[]. 
          For detailed engine editing, use the JSON field below or edit via the Rocket tab.
        </Typography>
        <TextInput source="rocket_json.configuration.launcher_stage" label="Launcher Stages (JSON)" helperText="Array of stages with engines. Format: JSON array of stage objects with engines array" multiline rows={8} />
      </FormTab>

      <FormTab label="Provider">
        <ReferenceInput source="provider_id" reference="providers">
          <SelectInput optionText="name" label="Provider Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Provider Details</h3>
        <TextInput source="launch_service_provider_json.id" label="Provider ID" />
        <TextInput source="launch_service_provider_json.url" label="Provider URL" />
        <TextInput source="launch_service_provider_json.name" label="Provider Name" />
        <TextInput source="launch_service_provider_json.abbrev" label="Abbreviation" />
        <TextInput source="launch_service_provider_json.type" label="Type" />
        <TextInput source="launch_service_provider_json.description" label="Description" multiline rows={3} />
        <TextInput source="launch_service_provider_json.country_code" label="Country Code" />
        <NumberInput source="launch_service_provider_json.founding_year" label="Founding Year" />
        <TextInput source="launch_service_provider_json.administrator" label="Administrator" />
        <TextInput source="launch_service_provider_json.wiki_url" label="Wiki URL" />
        <TextInput source="launch_service_provider_json.info_url" label="Info URL" />
        <TextInput source="launch_service_provider_json.logo_url" label="Logo URL" />
      </FormTab>

      <FormTab label="PAD">
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" label="Launch Site Reference" />
        </ReferenceInput>
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Pad Details</h3>
          <TextInput source="pad_json.id" label="Pad ID" />
          <TextInput source="pad_json.url" label="Pad URL" />
          <TextInput source="pad_json.name" label="Pad Name" />
          <BooleanInput source="pad_json.active" label="Active" />
          <TextInput source="pad_json.description" label="Description" multiline rows={3} />
          <TextInput source="pad_json.info_url" label="Info URL" />
          <TextInput source="pad_json.wiki_url" label="Wiki URL" />
          <TextInput source="pad_json.map_url" label="Map URL" />
          <NumberInput source="pad_json.latitude" label="Latitude" />
          <NumberInput source="pad_json.longitude" label="Longitude" />
          <TextInput source="pad_json.country_code" label="Country Code" />
          <TextInput source="pad_json.map_image" label="Map Image URL" />
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Location</h4>
          <TextInput source="pad_json.location.id" label="Location ID" />
          <TextInput source="pad_json.location.name" label="Location Name" />
          <TextInput source="pad_json.location.country_code" label="Location Country Code" />
          <NumberInput source="pad_json.total_launch_count" label="Total Launch Count" />
      </FormTab>

      <FormTab label="Hazards">
        <HazardsArrayInput source="hazards" />
      </FormTab>

      <FormTab label="Author">
        <ReferenceInput source="author_id" reference="authors" label="Author">
          <SelectInput optionText="full_name" />
        </ReferenceInput>
      </FormTab>

      <FormTab label="Launch Overview">
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" label="Launch Site" />
        </ReferenceInput>
        <SelectInput source="outcome" choices={outcomeChoices} label="Outcome" />
        <NumberInput source="probability" helperText="0-100" label="Probability (%)" />
        <TextInput source="mission_description" multiline rows={5} label="Mission Description" />
        <TextInput source="details" multiline rows={5} label="Details" />
        <TextInput source="url" label="Launch URL" />
        <TextInput source="launch_designator" label="Launch Designator" helperText="e.g., 1957-001" />
        <ReferenceInput source="orbit_id" reference="orbits">
          <SelectInput optionText="code" label="Orbit" />
        </ReferenceInput>
        <BooleanInput source="webcast_live" label="Webcast Live" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Status</h3>
        <TextInput source="status_json.id" label="Status ID" />
        <TextInput source="status_json.name" label="Status Name" />
        <TextInput source="status_json.abbrev" label="Status Abbreviation" />
        <TextInput source="status_json.description" label="Status Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Weather Concerns</h3>
        <TextInput source="weather_concerns" multiline rows={3} label="Weather Concerns (Text)" />
        <TextInput source="weather_concerns_json.id" label="Weather Concerns ID" />
        <TextInput source="weather_concerns_json.name" label="Weather Concerns Name" />
        <TextInput source="weather_concerns_json.description" label="Weather Concerns Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Failure Reason</h3>
        <TextInput source="failreason" label="Failure Reason" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hashtag</h3>
        <TextInput source="hashtag" label="Hashtag (Text)" />
        <TextInput source="hashtag_json.id" label="Hashtag ID" />
        <TextInput source="hashtag_json.name" label="Hashtag Name" />
        <TextInput source="hashtag_json.description" label="Hashtag Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>NET Precision</h3>
        <TextInput source="net_precision.id" label="NET Precision ID" />
        <TextInput source="net_precision.name" label="NET Precision Name" />
        <TextInput source="net_precision.abbrev" label="NET Precision Abbreviation" />
        <TextInput source="net_precision.description" label="NET Precision Description" multiline rows={3} />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Mission</h3>
        <TextInput source="mission_json.id" label="Mission ID" />
        <TextInput source="mission_json.name" label="Mission Name" />
        <TextInput source="mission_json.description" label="Mission Description" multiline rows={5} />
        <TextInput source="mission_json.type" label="Mission Type" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Orbit</h4>
        <TextInput source="mission_json.orbit.id" label="Orbit ID" />
        <TextInput source="mission_json.orbit.name" label="Orbit Name" />
        <TextInput source="mission_json.orbit.abbrev" label="Orbit Abbreviation" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Agencies</h4>
        <AgenciesArrayInput source="mission_json.agencies" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Info URLs</h4>
        <InfoUrlsArrayInput source="mission_json.info_urls" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h4>
        <VidUrlsArrayInput source="mission_json.vid_urls" />
      </FormTab>

      <FormTab label="Payload Overview">
        <TextInput source="mission_json.description" label="Payload Description" multiline rows={3} helperText="From mission JSON" />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          See the "Payload" tab for detailed payload editing. This overview shows summary information.
        </Typography>
      </FormTab>

      <FormTab label="Recovery Overview">
        <TextInput source="recovery.landing_location" label="Landing Location" helperText="e.g., JUST READ THE INSTRUCTIONS" />
        <TextInput source="recovery.landing_type" label="Landing Type" helperText="e.g., droneship, land, splashdown, none" />
        <BooleanInput source="recovery.success" label="Recovery Success" />
        <DateTimeInput source="recovery.recovery_date" label="Recovery Date" />
        <TextInput source="recovery.notes" label="Recovery Notes" multiline rows={3} />
      </FormTab>

      <FormTab label="Related Stories">
        <RelatedStoriesArrayInput source="related_stories" />
      </FormTab>

      <FormTab label="Comments">
        <Typography variant="body2" color="textSecondary">
          Comments are managed separately. They will appear in the Show view.
        </Typography>
      </FormTab>

      <FormTab label="Metadata">
        <TextInput source="external_id" label="External ID (UUID)" helperText="From Space Devs API" disabled />
        <TextInput source="response_mode" label="Response Mode" />
        <DateField source="created_at" showTime />
        <DateField source="updated_at" showTime />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Statistics</h3>
        <NumberInput source="orbital_launch_attempt_count" />
        <NumberInput source="location_launch_attempt_count" />
        <NumberInput source="pad_launch_attempt_count" />
        <NumberInput source="agency_launch_attempt_count" />
        <NumberInput source="orbital_launch_attempt_count_year" />
        <NumberInput source="location_launch_attempt_count_year" />
        <NumberInput source="pad_launch_attempt_count_year" />
        <NumberInput source="agency_launch_attempt_count_year" />
        <TextInput source="pad_turnaround" label="Pad Turnaround" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Additional Arrays</h3>
        <h4 style={{ marginTop: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Updates</h4>
        <UpdatesArrayInput source="updates" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Timeline</h4>
        <TimelineArrayInput source="timeline" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Info URLs</h4>
        <InfoUrlsArrayInput source="info_urls" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mission Patches</h4>
        <MissionPatchesArrayInput source="mission_patches" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Program</h4>
        <ProgramArrayInput source="program_json" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Infographic</h4>
        <TextInput source="infographic_json.id" label="Infographic ID" />
        <TextInput source="infographic_json.name" label="Infographic Name" />
        <TextInput source="infographic_json.image_url" label="Image URL" />
        <TextInput source="infographic_json.thumbnail_url" label="Thumbnail URL" />
        <TextInput source="infographic_json.credit" label="Credit" />
        <TextInput source="infographic_json.license" label="License" />
        <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Media</h4>
        <JsonbInput source="media" label="Media (JSON)" helperText="Media links object - complex structure, use JSON format" />
        <TextInput source="flightclub_url" label="FlightClub URL" />
      </FormTab>
    </TabbedForm>
  </Edit>
);
};

// Helper function to extract YouTube video ID from URL
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Helper function to format date/time with timezone (unused - kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatDateTimeLine = (dateStr: string | null, pad: any): string => {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  const timezone = pad?.location?.timezone_name || pad?.timezone || 'UTC';
  return date.toLocaleString('en-US', { timeZone: timezone });
};

// Helper function to format window time with timezone
const formatWindowTimeWithTimezone = (dateStr: string | null, timezone: string | null) => {
  if (!dateStr) return { local: 'TBD', utc: 'TBD' };
  const date = new Date(dateStr);
  const local = timezone 
    ? date.toLocaleString('en-US', { timeZone: timezone })
    : date.toLocaleString('en-US');
  const utc = date.toUTCString();
  return { local, utc };
};

// Helper function to parse JSONB safely
const parseJsonb = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }
  return value;
};

// Comments Component for Launch Show Page
const LaunchCommentsComponent = () => {
  const record = useRecordContext();
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const bgPaper = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const notify = useNotify();
  const refresh = useRefresh();

  useEffect(() => {
    if (record?.id) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  const fetchComments = async () => {
    if (!record?.id) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/launches/${record.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Flatten nested comments structure
        const allComments: any[] = [];
        const flattenComments = (comments: any[]) => {
          comments.forEach(comment => {
            allComments.push(comment);
            if (comment.replies && comment.replies.length > 0) {
              flattenComments(comment.replies);
            }
          });
        };
        flattenComments(data.comments || []);
        setComments(allComments);
      } else {
        notify('Failed to load comments', { type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      notify('Error loading comments', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment: any) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingComment || !editContent.trim()) {
      notify('Comment content cannot be empty', { type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments/${editingComment.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (response.ok) {
        notify('Comment updated successfully', { type: 'success' });
        setEditDialogOpen(false);
        setEditingComment(null);
        setEditContent('');
        fetchComments();
        refresh();
      } else {
        const error = await response.json();
        notify(error.error || 'Failed to update comment', { type: 'error' });
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      notify('Error updating comment', { type: 'error' });
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        notify('Comment deleted successfully', { type: 'success' });
        fetchComments();
        refresh();
      } else {
        const error = await response.json();
        notify(error.error || 'Failed to delete comment', { type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      notify('Error deleting comment', { type: 'error' });
    }
  };

  if (!record?.id) {
    return <Box sx={{ p: 3, color: textSecondary }}>No launch selected</Box>;
  }

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading comments...</Box>;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: textPrimary }}>
        Comments ({comments.length})
      </Typography>
      
      {comments.length === 0 ? (
        <Paper sx={{ p: 3, backgroundColor: bgPaper, border: `1px solid ${borderColor}` }}>
          <Typography sx={{ color: textSecondary }}>No comments yet</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comments.map((comment) => (
            <Paper
              key={comment.id}
              sx={{
                p: 2,
                backgroundColor: bgPaper,
                border: `1px solid ${borderColor}`,
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: textPrimary, fontWeight: 600 }}>
                    {comment.username || comment.user?.username || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>
                    {new Date(comment.created_at).toLocaleString()}
                    {comment.parent_comment_id && ' • Reply'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(comment)}
                    sx={{ color: textSecondary, '&:hover': { color: textPrimary } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(comment.id)}
                    sx={{ color: textSecondary, '&:hover': { color: '#f44336' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography sx={{ color: textPrimary, whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>
              {comment.like_count > 0 && (
                <Typography variant="caption" sx={{ color: textSecondary, mt: 1, display: 'block' }}>
                  {comment.like_count} {comment.like_count === 1 ? 'like' : 'likes'}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <MuiTextField
            autoFocus
            margin="dense"
            label="Comment"
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const LaunchShowActions = () => {
  return <BackButtonActions resource="launches" showActions />;
};

export const LaunchShow = (props: any) => {
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const record = useRecordContext();
  
  // State for countdown timer (unused - kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Theme-aware colors (matching articles style)
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const textDisabled = isDark ? '#808080' : '#999';
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const bgPaper = isDark ? '#1e1e1e' : '#f8f9fa';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const linkColor = theme?.palette?.primary?.main || '#1976d2';
  
  // Countdown timer effect
  useEffect(() => {
    if (!record?.net) return;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const launchDate = new Date(record.net).getTime();
      const distance = Math.abs(launchDate - now); // Use absolute value to continue counting up
      
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [record?.net]);
  
  return (
    <Show {...props} title={<LaunchTitle />} actions={<LaunchShowActions />}>
      <TabbedShowLayout
        sx={{
          '& .MuiTabs-root': {
            flexWrap: 'wrap',
            minHeight: 'auto',
            position: 'relative',
          },
          '& .MuiTabs-flexContainer': {
            flexWrap: 'wrap',
            gap: '4px',
            position: 'relative',
          },
          '& .MuiTabs-indicator': {
            display: 'none', // Hide the default indicator
          },
          '& .MuiTab-root': {
            minWidth: '120px',
            maxWidth: '180px',
            width: 'auto',
            flex: '0 0 auto',
            fontSize: '0.875rem',
            padding: '12px 16px',
            textTransform: 'none',
            fontWeight: 500,
            borderBottom: '2px solid transparent',
            transition: 'border-color 0.3s ease',
            '&.Mui-selected': {
              borderBottom: `2px solid ${linkColor}`,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
            }
          }
        }}
      >
      <TabbedShowLayout.Tab label="Hero Section">
        {/* Hero Section */}
        <FunctionField
          label=""
          render={(record: any) => {
            const image = record?.image || parseJsonb(record?.image_json) || {};
            const imageUrl = image?.image_url;
            
            return (
              <Box sx={{ mb: 3 }}>
                {imageUrl && (
                  <Box sx={{ 
                    mb: 2, 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    boxShadow: 2
                  }}>
                    <img 
                      src={imageUrl} 
                      alt={record?.name || 'Launch'}
                      style={{ 
                        width: '100%', 
                        maxHeight: '400px', 
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </Box>
                )}
                
                <Typography 
                  variant="h4" 
                  component="h1" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 700,
                    color: textPrimary,
                    lineHeight: 1.2
                  }}
                >
                  {record?.name || 'Unnamed Launch'}
                </Typography>
                
              {record?.launch_designator && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2, 
                      color: textSecondary,
                      fontWeight: 400
                    }}
                  >
                  Designator: {record.launch_designator}
                  </Typography>
                )}
                
                {/* Status and Meta Info */}
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1.5, 
                  mb: 3,
                  alignItems: 'center'
                }}>
            <FunctionField
              render={(record: any) => {
                const outcome = record?.outcome || record?.status?.abbrev || 'TBD';
                      const statusColors: any = {
                        success: { bg: '#4caf50', color: '#fff' },
                        failure: { bg: '#f44336', color: '#fff' },
                        partial: { bg: '#ff9800', color: '#fff' },
                        TBD: { bg: '#9e9e9e', color: '#fff' }
                      };
                      const colors = statusColors[outcome] || statusColors.TBD;
                return (
                        <Chip
                          label={outcome.toUpperCase()}
                          sx={{
                            backgroundColor: colors.bg,
                            color: colors.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '28px'
                          }}
                        />
                );
              }}
            />
                  
                  {record?.is_featured && (
                    <Chip
                      label="FEATURED"
                      sx={{
                        backgroundColor: linkColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '28px'
                      }}
                    />
                  )}
                  
                  {record?.webcast_live && (
                    <Chip
                      label="WEBCAST LIVE"
                      sx={{
                        backgroundColor: '#f44336',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '28px'
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          }}
        />
        
        {/* Key Information Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Launch Date
              </Typography>
          <FunctionField
            render={(record: any) => {
                  const date = record?.launch_date || record?.net || record?.window_start;
                  if (!date) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
              return (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5, 
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {new Date(date).toLocaleString()}
                    </Typography>
              );
            }}
          />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Probability
              </Typography>
          <FunctionField
                render={(record: any) => (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mt: 0.5, 
                      fontWeight: 600,
                      color: linkColor,
                      fontSize: '1.25rem'
                    }}
                  >
                    {record?.probability !== null && record?.probability !== undefined ? `${record.probability}%` : 'N/A'}
                  </Typography>
                )}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Provider
              </Typography>
            <FunctionField
              render={(record: any) => {
                let provider = 'N/A';
                if (typeof record?.provider === 'string') {
                  provider = record.provider;
                } else if (record?.launch_service_provider?.name) {
                  provider = record.launch_service_provider.name;
                } else if (record?.provider?.name) {
                  provider = record.provider.name;
                }
                  return (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5, 
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {provider}
                    </Typography>
                  );
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Rocket
              </Typography>
            <FunctionField
              render={(record: any) => {
                let rocket = 'N/A';
                if (typeof record?.rocket === 'string') {
                  rocket = record.rocket;
                } else if (record?.rocket?.configuration?.name) {
                  rocket = record.rocket.configuration.name;
                } else if (record?.rocket?.configuration?.full_name) {
                  rocket = record.rocket.configuration.full_name;
                } else if (record?.rocket?.name) {
                  rocket = record.rocket.name;
                }
                  return (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5, 
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {rocket}
                    </Typography>
                  );
                }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Mission Description */}
        <FunctionField
          label="Mission Description"
          render={(record: any) => {
            const desc = record?.mission_description || record?.mission?.description || '';
            if (!desc) return null;
            return (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2.5, 
                  backgroundColor: bgPaper,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1.5, 
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Mission Description
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: textPrimary,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontSize: '1rem'
                  }}
                >
                  {desc}
                </Typography>
              </Paper>
            );
          }}
        />
        
        {/* Details */}
        <FunctionField
          label="Details"
          render={(record: any) => {
            const details = record?.details || record?.description || '';
            if (!details) return null;
            return (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1.5, 
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Details
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: textPrimary,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.95rem'
                  }}
                >
                  {details}
                </Typography>
              </Paper>
            );
          }}
        />

        {/* Additional Information */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                ID
              </Typography>
              <FunctionField
                render={(record: any) => (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mt: 0.5, 
                      fontWeight: 600,
                      color: textPrimary
                    }}
                  >
                    {record?.id || record?.database_id || 'N/A'}
                  </Typography>
                )}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Slug
              </Typography>
              <FunctionField
                render={(record: any) => (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mt: 0.5, 
                      fontWeight: 600,
                      color: textPrimary
                    }}
                  >
                    {record?.slug || 'N/A'}
                  </Typography>
                )}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Launch Site
              </Typography>
            <FunctionField
              render={(record: any) => {
                let site = 'N/A';
                if (typeof record?.site === 'string') {
                  site = record.site;
                } else if (record?.pad?.location?.name) {
                  site = record.pad.location.name;
                } else if (record?.site?.name) {
                  site = record.site.name;
                }
                  return (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5, 
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {site}
                    </Typography>
                  );
                }}
              />
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                height: '100%'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Orbit
              </Typography>
            <FunctionField
              render={(record: any) => {
                let orbit = 'N/A';
                if (typeof record?.orbit === 'string') {
                  orbit = record.orbit;
                } else if (record?.mission?.orbit?.abbrev) {
                  orbit = record.mission.orbit.abbrev;
                } else if (record?.mission?.orbit?.name) {
                  orbit = record.mission.orbit.name;
                } else if (record?.orbit?.abbrev) {
                  orbit = record.orbit.abbrev;
                } else if (record?.orbit?.name) {
                  orbit = record.orbit.name;
                }
                  return (
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5, 
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {orbit}
                    </Typography>
                  );
                }}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Launch URL */}
          <FunctionField
          label="Launch URL"
            render={(record: any) => {
              const url = record?.url;
            if (!url) return null;
                return (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mb: 1, 
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Launch URL
                </Typography>
                <Typography 
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ 
                    color: linkColor,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {url} ↗
                </Typography>
              </Paper>
              );
            }}
          />

        {/* Hero Image Fields */}
        <Paper 
          elevation={0}
                    sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
                  <Typography 
            variant="subtitle1" 
                    sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Hero Image Details
                  </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Image ID</Typography>
              <TextField source="image_json.id" />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Image URL</Typography>
              <FunctionField render={(record: any) => {
                const url = record?.image_json?.image_url;
                if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                return (
                  <Typography component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5, color: linkColor, textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}>
                    {url} ↗
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Thumbnail URL</Typography>
              <FunctionField render={(record: any) => {
                const url = record?.image_json?.thumbnail_url;
                if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                return (
                  <Typography component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5, color: linkColor, textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}>
                    {url} ↗
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Image Name</Typography>
              <TextField source="image_json.name" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Credit</Typography>
              <TextField source="image_json.credit" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>License</Typography>
              <TextField source="image_json.license" />
            </Grid>
          </Grid>
        </Paper>

        {/* Launch Timing Fields */}
        <Paper 
          elevation={0}
                      sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
                  <Typography 
            variant="subtitle1" 
                    sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
                    }}
                  >
            Launch Timing
                  </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Launch Date</Typography>
              <DateField source="launch_date" showTime />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>NET</Typography>
              <DateField source="net" showTime />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Window Start</Typography>
              <DateField source="window_start" showTime />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Window End</Typography>
              <DateField source="window_end" showTime />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Featured</Typography>
              <BooleanField source="is_featured" />
            </Grid>
          </Grid>
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Video Section">
          <FunctionField
          render={(record: any) => {
            const image = record?.image || parseJsonb(record?.image_json) || {};
            const imageUrl = image?.image_url || 'https://i.imgur.com/3kPqWvM.jpeg';
            const launchName = record?.name || 'Unnamed Launch';
            
            // Get YouTube video ID
            let youtubeVideoId: string | null = null;
            if (record?.youtube_video_id) {
              youtubeVideoId = record.youtube_video_id;
            } else if (record?.vid_urls && Array.isArray(record.vid_urls) && record.vid_urls.length > 0) {
              const firstVideo = record.vid_urls[0];
              const videoUrl = typeof firstVideo === 'string' ? firstVideo : firstVideo?.url;
              if (videoUrl) {
                youtubeVideoId = getYouTubeVideoId(videoUrl);
              }
            }
            
            return (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2, 
                  backgroundColor: bgPaper,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 3
                }}
              >
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%',
                  backgroundColor: '#000',
                  overflow: 'hidden',
                  borderRadius: 2
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url('${imageUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!isVideoPlaying && (
                      <Box sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}>
                        <Box sx={{ textAlign: 'center', color: 'white' }}>
                          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                            {launchName.toUpperCase()}
                          </Typography>
                          {youtubeVideoId && (
                            <IconButton
                              onClick={() => setIsVideoPlaying(true)}
                              sx={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.9)'
                                }
                              }}
                            >
                              ▶ Play Video
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                    )}
                    {isVideoPlaying && youtubeVideoId && (
                      <Box
                        component="iframe"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          border: 'none',
                          zIndex: 20
                        }}
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                        title="Launch Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    )}
                    {isVideoPlaying && youtubeVideoId && (
                      <IconButton
                        onClick={() => setIsVideoPlaying(false)}
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          zIndex: 30,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)'
                          }
                        }}
                      >
                        ✕
                      </IconButton>
                    )}
                  </Box>
                </Box>
                {!youtubeVideoId && (
                  <Typography sx={{ mt: 2, color: textDisabled, textAlign: 'center' }}>
                    No video available for this launch
                  </Typography>
                )}
              </Paper>
            );
          }}
        />
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Payload">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Payloads
          </Typography>
          <FunctionField
            render={(record: any) => {
              const payloads = record?.payloads || [];
              if (!payloads || payloads.length === 0) {
                return <Typography sx={{ color: textDisabled }}>No payloads available</Typography>;
              }
              return (
                <ArrayField source="payloads">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Name" render={(item: any) => {
                      const name = typeof item?.name === 'object' ? null : item?.name;
                      return name || 'N/A';
                    }} />
                    <FunctionField label="Type" render={(item: any) => {
                      const type = typeof item?.type === 'object' ? null : item?.type;
                      return type || 'N/A';
                    }} />
                    <FunctionField label="Description" render={(item: any) => {
                      const desc = typeof item?.description === 'object' ? null : item?.description;
                      return desc || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Crew">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Crew
          </Typography>
          <FunctionField
            render={(record: any) => {
              const crew = record?.crew || [];
              if (!crew || crew.length === 0) {
                return <Typography sx={{ color: textDisabled }}>No crew members available</Typography>;
              }
              return (
                <ArrayField source="crew">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Name" render={(item: any) => {
                      const name = typeof item?.name === 'object' ? null : item?.name;
                      return name || 'N/A';
                    }} />
                    <FunctionField label="Role" render={(item: any) => {
                      const role = typeof item?.role === 'object' ? null : item?.role;
                      return role || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Launch Overview">
        <FunctionField
          render={(record: any) => {
            const pad = record?.pad || parseJsonb(record?.pad_json) || {};
            const mission = record?.mission || parseJsonb(record?.mission_json) || {};
            const payloads = record?.payloads || [];
            const recovery = record?.recovery || {};
            const launchServiceProvider = record?.launch_service_provider || parseJsonb(record?.launch_service_provider_json) || {};
            
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Launch Overview */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    backgroundColor: bgPaper,
                    borderTop: '4px solid #8B1A1A',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    backgroundColor: '#8B1A1A',
                    p: 1.5,
                    textAlign: 'center'
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.875rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      LAUNCH OVERVIEW
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    {(record?.window_start || record?.window_end || record?.launch_date || record?.net) && (
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              backgroundColor: bgCard,
                              borderRadius: 1
                            }}
                          >
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.625rem', display: 'block', mb: 0.5 }}>
                              Window Open
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.625rem', mb: 0.25 }}>
                              {formatWindowTimeWithTimezone(
                                record?.window_start || record?.launch_date || record?.net,
                                pad?.location?.timezone_name || pad?.timezone || null
                              ).local}
                            </Typography>
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.625rem' }}>
                              {formatWindowTimeWithTimezone(
                                record?.window_start || record?.launch_date || record?.net,
                                pad?.location?.timezone_name || pad?.timezone || null
                              ).utc}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              backgroundColor: bgCard,
                              borderRadius: 1
                            }}
                          >
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.625rem', display: 'block', mb: 0.5 }}>
                              Window Close
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: textPrimary, fontSize: '0.625rem', mb: 0.25 }}>
                              {formatWindowTimeWithTimezone(
                                record?.window_end || record?.launch_date || record?.net,
                                pad?.location?.timezone_name || pad?.timezone || null
                              ).local}
                            </Typography>
                            <Typography variant="caption" sx={{ color: textSecondary, fontSize: '0.625rem' }}>
                              {formatWindowTimeWithTimezone(
                                record?.window_end || record?.launch_date || record?.net,
                                pad?.location?.timezone_name || pad?.timezone || null
                              ).utc}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    )}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {(pad?.name || pad?.location) && (
                        <Box sx={{ display: 'flex', alignItems: 'start' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: textPrimary,
                              fontWeight: 600,
                              flex: '1',
                              textAlign: 'right',
                              pr: 1.5
                            }}
                          >
                            LAUNCH FACILITY:
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: textPrimary,
                              flex: '1',
                              pl: 1.5
                            }}
                          >
                            {(pad?.location?.name || 'TBD').toUpperCase()}
                          </Typography>
                        </Box>
                      )}
                      {pad?.name && (
                        <Box sx={{ display: 'flex', alignItems: 'start' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: textPrimary,
                              fontWeight: 600,
                              flex: '1',
                              textAlign: 'right',
                              pr: 1.5
                            }}
                          >
                            LAUNCH PAD:
                          </Typography>
                          <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: textPrimary,
                              flex: '1',
                              pl: 1.5
                            }}
                          >
                            {(pad?.name || 'TBD').toUpperCase()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>

                {/* Payload Overview */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    backgroundColor: bgPaper,
                    borderTop: '4px solid #8B1A1A',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    backgroundColor: '#8B1A1A',
                    p: 1.5,
                    textAlign: 'center'
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.875rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      PAYLOAD OVERVIEW
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            fontWeight: 600,
                            flex: '1',
                            textAlign: 'right',
                            pr: 1.5
                          }}
                        >
                          CUSTOMER:
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            flex: '1',
                            pl: 1.5
                          }}
                        >
                          {payloads.length > 0 && payloads[0]?.customers && Array.isArray(payloads[0].customers) && payloads[0].customers.length > 0
                            ? payloads[0].customers.join(', ').toUpperCase()
                            : (launchServiceProvider?.name || 'TBD').toUpperCase()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            fontWeight: 600,
                            flex: '1',
                            textAlign: 'right',
                            pr: 1.5
                          }}
                        >
                          PAYLOAD:
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                        <Box sx={{ flex: '1', pl: 1.5 }}>
                          {payloads.length > 0 ? (
                            payloads.map((p: any, idx: number) => (
                              <Typography key={idx} variant="body2" sx={{ color: textPrimary }}>
                                {(p?.name || 'UNNAMED PAYLOAD').toUpperCase()}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: textPrimary }}>TBD</Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            fontWeight: 600,
                            flex: '1',
                            textAlign: 'right',
                            pr: 1.5
                          }}
                        >
                          PAYLOAD MASS:
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            flex: '1',
                            pl: 1.5
                          }}
                        >
                          {payloads.length > 0 ? (() => {
                            const totalMassKg = payloads.reduce((sum: number, p: any) => sum + (parseFloat(p?.mass_kg) || 0), 0);
                            if (totalMassKg === 0) return 'TBD';
                            const totalMassLb = Math.round(totalMassKg * 2.20462);
                            return `${totalMassKg.toLocaleString()}kg (${totalMassLb.toLocaleString()}lb)`;
                          })() : 'TBD'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'start' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            fontWeight: 600,
                            flex: '1',
                            textAlign: 'right',
                            pr: 1.5
                          }}
                        >
                          DESTINATION:
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: textPrimary,
                            flex: '1',
                            pl: 1.5
                          }}
                        >
                          {((payloads.length > 0 && payloads[0]?.orbit?.abbrev) || mission?.orbit?.abbrev || 'TBD').toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Recovery Overview */}
                {recovery && (recovery.landing_location || recovery.landing_type) && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      backgroundColor: bgPaper,
                      borderTop: '4px solid #8B1A1A',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ 
                      backgroundColor: '#8B1A1A',
                      p: 1.5,
                      textAlign: 'center'
                    }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.875rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        RECOVERY OVERVIEW
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {recovery.landing_location && (
                          <Box sx={{ display: 'flex', alignItems: 'start' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: textPrimary,
                                fontWeight: 600,
                                flex: '1',
                                textAlign: 'right',
                                pr: 1.5
                              }}
                            >
                              LANDING LOCATION:
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: textPrimary,
                                flex: '1',
                                pl: 1.5
                              }}
                            >
                              {(recovery.landing_location || 'TBD').toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                        {recovery.landing_type && (
                          <Box sx={{ display: 'flex', alignItems: 'start' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: textPrimary,
                                fontWeight: 600,
                                flex: '1',
                                textAlign: 'right',
                                pr: 1.5
                              }}
                            >
                              LANDING TYPE:
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1.5, borderColor: '#8B1A1A' }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: textPrimary,
                                flex: '1',
                                pl: 1.5
                              }}
                            >
                              {(recovery.landing_type || 'TBD').toUpperCase()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                )}

                {/* Related Stories */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    backgroundColor: bgPaper,
                    borderTop: '4px solid #8B1A1A',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    backgroundColor: '#8B1A1A',
                    p: 1.5,
                    textAlign: 'center'
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '0.875rem',
                        letterSpacing: '0.5px'
                      }}
                    >
                      RELATED STORIES
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: '#8B1A1A', borderWidth: 2 }} />
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ color: textDisabled, textAlign: 'center', p: 2 }}>
                      Related stories feature coming soon. This will display news articles related to this launch.
                    </Typography>
                  </Box>
                </Paper>

                {/* Author Section */}
                <Paper 
                  elevation={0}
                  sx={{ 
                    backgroundColor: bgPaper,
                    borderTop: '4px solid #8B1A1A',
                    borderRadius: 2,
                    overflow: 'hidden',
                    p: 3
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'start' }}>
                    <Box sx={{ 
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '4px solid #8B1A1A',
                      overflow: 'hidden',
                      flexShrink: 0,
                      backgroundColor: bgCard,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: textSecondary
                    }}>
                      <Typography sx={{ fontSize: '2rem' }}>👤</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography 
                          variant="h6" 
                          component="h3"
                          sx={{ 
                            fontWeight: 700,
                            color: '#8B1A1A',
                            textTransform: 'uppercase',
                            display: 'inline',
                            mr: 0.5
                          }}
                        >
                          ZACHARY AUBERT
                        </Typography>
                        <Typography 
                          variant="h6" 
                          component="span"
                          sx={{ 
                            fontStyle: 'italic',
                            color: textPrimary,
                            textTransform: 'uppercase'
                          }}
                        >
                          SPACE NEWS JOURNALIST
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: textPrimary,
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          mb: 1.5
                        }}
                      >
                        Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: textPrimary,
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          mb: 1.5
                        }}
                      >
                        He doesn't have a book yet but is working on the <Box component="span" sx={{ fontStyle: 'italic' }}>Astro Guide: An UnOfficial Guide To The America Space Coast</Box>
                      </Typography>
                      <Typography 
                        component="a"
                        href="#"
                        sx={{ 
                          color: '#8B1A1A',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        More by Zac Aubert →
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            );
          }}
        />

        {/* Status Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Status ID</Typography><TextField source="status_json.id" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Status Name</Typography><TextField source="status_json.name" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Status Abbrev</Typography><TextField source="status_json.abbrev" /></Grid>
            <Grid item xs={12}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Status Description</Typography><TextField source="status_json.description" /></Grid>
          </Grid>
        </Paper>

        {/* Weather Concerns Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Weather Concerns</Typography>
          <FunctionField render={(record: any) => {
            const concerns = record?.weather_concerns;
            if (!concerns) return <Typography sx={{ color: textDisabled }}>N/A</Typography>;
            return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{concerns}</Typography>;
          }} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Weather Concerns ID</Typography><TextField source="weather_concerns_json.id" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Weather Concerns Name</Typography><TextField source="weather_concerns_json.name" /></Grid>
            <Grid item xs={12}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Weather Concerns Description</Typography><TextField source="weather_concerns_json.description" /></Grid>
          </Grid>
              </Paper>

        {/* Hashtag Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Hashtag</Typography>
          <TextField source="hashtag" />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Hashtag ID</Typography><TextField source="hashtag_json.id" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Hashtag Name</Typography><TextField source="hashtag_json.name" /></Grid>
            <Grid item xs={12}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Hashtag Description</Typography><TextField source="hashtag_json.description" /></Grid>
          </Grid>
              </Paper>

        {/* NET Precision Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>NET Precision</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>NET Precision ID</Typography><TextField source="net_precision.id" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>NET Precision Name</Typography><TextField source="net_precision.name" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>NET Precision Abbrev</Typography><TextField source="net_precision.abbrev" /></Grid>
            <Grid item xs={12}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>NET Precision Description</Typography><TextField source="net_precision.description" /></Grid>
          </Grid>
        </Paper>

        {/* Mission Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Mission</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Mission ID</Typography><TextField source="mission_json.id" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Mission Name</Typography><TextField source="mission_json.name" /></Grid>
            <Grid item xs={12} sm={6} md={3}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Mission Type</Typography><TextField source="mission_json.type" /></Grid>
            <Grid item xs={12}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Mission Description</Typography><FunctionField source="mission_json.description" render={(record: any) => {
              const desc = record?.mission_json?.description;
              if (!desc) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
              return <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{desc}</Typography>;
            }} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Orbit ID</Typography><TextField source="mission_json.orbit.id" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Orbit Name</Typography><TextField source="mission_json.orbit.name" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Orbit Abbrev</Typography><TextField source="mission_json.orbit.abbrev" /></Grid>
          </Grid>
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Payload Overview">
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Payload Overview</Typography>
          <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 0.5 }}>Payload Description</Typography>
              <FunctionField render={(record: any) => {
            const desc = record?.mission_json?.description;
            if (!desc) return <Typography sx={{ color: textDisabled }}>N/A</Typography>;
            return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{desc}</Typography>;
          }} />
          <Typography variant="body2" sx={{ mt: 2, color: textSecondary }}>See the "Payload" tab for detailed payload editing. This overview shows summary information.</Typography>
                  </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Recovery Overview">
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Recovery Overview</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField source="recovery.landing_location" label="Landing Location" /></Grid>
            <Grid item xs={12} sm={6}><TextField source="recovery.landing_type" label="Landing Type" /></Grid>
            <Grid item xs={12} sm={6}><BooleanField source="recovery.success" label="Recovery Success" /></Grid>
            <Grid item xs={12} sm={6}><DateField source="recovery.recovery_date" showTime label="Recovery Date" /></Grid>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600, display: 'block', mb: 0.5 }}>Recovery Notes</Typography>
              <FunctionField render={(record: any) => {
                const notes = record?.recovery?.notes;
                if (!notes) return <Typography sx={{ color: textDisabled }}>N/A</Typography>;
                return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{notes}</Typography>;
              }} />
            </Grid>
          </Grid>
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Related Stories">
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Related Stories</Typography>
          <FunctionField
            render={(record: any) => {
              const stories = record?.related_stories || [];
              if (!stories || stories.length === 0) {
                return <Typography sx={{ color: textDisabled }}>No related stories available</Typography>;
              }
              return (
                <ArrayField source="related_stories">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Title" render={(item: any) => {
                      const title = typeof item?.title === 'object' ? null : item?.title;
                      return title || 'N/A';
                    }} />
                    <FunctionField label="URL" render={(item: any) => {
                      const url = typeof item?.url === 'object' ? null : item?.url;
                      if (!url) return 'N/A';
                      return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Rocket">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Rocket Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Rocket ID
              </Typography>
              <FunctionField render={(record: any) => {
                const id = record?.rocket_json?.id || (typeof record?.rocket === 'object' && record?.rocket?.id) || null;
                return (
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color: textPrimary }}>
                    {id != null ? String(id) : 'N/A'}
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Rocket URL
              </Typography>
              <FunctionField
                render={(record: any) => {
                  const url = record?.rocket_json?.url || record?.rocket?.url;
                  if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                  return (
                    <Typography 
                      component="a"
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ 
                        mt: 0.5,
                        color: linkColor,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {url} ↗
                    </Typography>
                  );
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Configuration
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Configuration ID
              </Typography>
              <FunctionField render={(record: any) => {
                const id = record?.rocket_json?.configuration?.id || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.id) || null;
                return (
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color: textPrimary }}>
                    {id != null ? String(id) : 'N/A'}
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Configuration Name
              </Typography>
              <FunctionField render={(record: any) => {
                const name = record?.rocket_json?.configuration?.name || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.name) || null;
                return (
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color: textPrimary }}>
                    {name || 'N/A'}
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Full Name
              </Typography>
              <FunctionField render={(record: any) => {
                const fullName = record?.rocket_json?.configuration?.full_name || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.full_name) || null;
                return (
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color: textPrimary }}>
                    {fullName || 'N/A'}
                  </Typography>
                );
              }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Variant
              </Typography>
              <FunctionField render={(record: any) => {
                const variant = record?.rocket_json?.configuration?.variant || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.variant) || null;
                return (
                  <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, color: textPrimary }}>
                    {variant || 'N/A'}
                  </Typography>
                );
              }} />
            </Grid>
          </Grid>
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: textSecondary, 
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.5px',
                fontWeight: 600
              }}
            >
              Description
            </Typography>
            <FunctionField
              render={(record: any) => {
                const desc = record?.rocket_json?.configuration?.description || record?.rocket?.configuration?.description || '';
                if (!desc) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                return (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      mt: 1,
                      backgroundColor: bgPaper, 
                      borderRadius: 1,
                      border: `1px solid ${borderColor}`
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: textPrimary,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.7
                      }}
                    >
                      {desc}
                    </Typography>
                  </Paper>
                );
              }}
            />
          </Box>
        </Paper>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Family</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Family ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.rocket_json?.configuration?.family?.id || (typeof record?.rocket?.configuration?.family === 'object' && record?.rocket?.configuration?.family?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Family Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.rocket_json?.configuration?.family?.name || (typeof record?.rocket?.configuration?.family === 'object' && record?.rocket?.configuration?.family?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Specifications</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Length</div>
              <FunctionField render={(record: any) => {
                const length = record?.rocket_json?.configuration?.length || record?.rocket?.configuration?.length;
                return <span>{length != null ? `${length}m` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Diameter</div>
              <FunctionField render={(record: any) => {
                const diameter = record?.rocket_json?.configuration?.diameter || record?.rocket?.configuration?.diameter;
                return <span>{diameter != null ? `${diameter}m` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Launch Mass</div>
              <FunctionField render={(record: any) => {
                const mass = record?.rocket_json?.configuration?.launch_mass || record?.rocket?.configuration?.launch_mass;
                return <span>{mass != null ? `${mass} kg` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>LEO Capacity</div>
              <FunctionField render={(record: any) => {
                const leo = record?.rocket_json?.configuration?.leo_capacity || record?.rocket?.configuration?.leo_capacity;
                return <span>{leo != null ? `${leo} kg` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>GTO Capacity</div>
              <FunctionField render={(record: any) => {
                const gto = record?.rocket_json?.configuration?.gto_capacity || record?.rocket?.configuration?.gto_capacity;
                return <span>{gto != null ? `${gto} kg` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Takeoff Thrust</div>
              <FunctionField render={(record: any) => {
                const thrust = record?.rocket_json?.configuration?.to_thrust || record?.rocket?.configuration?.to_thrust;
                return <span>{thrust != null ? `${thrust} kN` : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Reusable</div>
              <FunctionField render={(record: any) => {
                const reusable = record?.rocket_json?.configuration?.reusable;
                if (reusable === null || reusable === undefined) return <span style={{ color: textDisabled }}>N/A</span>;
                return (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    backgroundColor: reusable ? '#4caf50' : '#e0e0e0',
                    color: reusable ? 'white' : '#666'
                  }}>
                    {reusable ? 'Yes' : 'No'}
                  </span>
                );
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Launch Statistics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Total Launches</div>
              <FunctionField render={(record: any) => {
                const count = record?.rocket_json?.configuration?.total_launch_count || record?.rocket?.configuration?.total_launch_count;
                return <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textPrimary }}>{count != null ? count : 'N/A'}</span>;
              }} />
            </div>
            <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Successful</div>
              <FunctionField render={(record: any) => {
                const count = record?.rocket_json?.configuration?.successful_launches || record?.rocket?.configuration?.successful_launches;
                return <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>{count != null ? count : 'N/A'}</span>;
              }} />
            </div>
            <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Failed</div>
              <FunctionField render={(record: any) => {
                const count = record?.rocket_json?.configuration?.failed_launches || record?.rocket?.configuration?.failed_launches;
                return <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>{count != null ? count : 'N/A'}</span>;
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Links</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Info URL</div>
              <FunctionField render={(record: any) => {
                const url = record?.rocket_json?.configuration?.info_url || record?.rocket?.configuration?.info_url;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Wiki URL</div>
              <FunctionField render={(record: any) => {
                const url = record?.rocket_json?.configuration?.wiki_url || record?.rocket?.configuration?.wiki_url;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
              }} />
            </div>
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Engine">
        <FunctionField
          render={(record: any) => {
            const rocket = record?.rocket || parseJsonb(record?.rocket_json) || {};
            let engines: any[] = [];
            
            // Primary: Check launch.engines
            if (record?.engines && Array.isArray(record.engines) && record.engines.length > 0) {
              engines = record.engines;
            }
            // Fallback 1: Check rocket.launcher_stage
            else if (rocket?.launcher_stage && Array.isArray(rocket.launcher_stage)) {
              engines = rocket.launcher_stage.flatMap((stage: any, stageIdx: number) => 
                (stage.engines || []).map((engine: any) => ({
                  ...engine,
                  stage: stageIdx + 1,
                  stage_type: stage.type || `Stage ${stageIdx + 1}`,
                  reusable: stage.reusable || false
                }))
              );
            }
            // Fallback 2: Check rocket.configuration.launcher_stage
            else if (rocket?.configuration?.launcher_stage && Array.isArray(rocket.configuration.launcher_stage)) {
              engines = rocket.configuration.launcher_stage.flatMap((stage: any, stageIdx: number) => 
                (stage.engines || []).map((engine: any) => ({
                  ...engine,
                  stage: stageIdx + 1,
                  stage_type: stage.type || `Stage ${stageIdx + 1}`,
                  reusable: stage.reusable || false
                }))
              );
            }
            
            if (engines.length === 0) {
              return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>Engine information not available for this launch.</div>;
            }
            
            // Group engines by stage
            const enginesByStage = engines.reduce((acc: any, engine: any) => {
              const stageKey = engine.stage || engine.stage_type || 'Unknown';
              if (!acc[stageKey]) {
                acc[stageKey] = {
                  stage: engine.stage || null,
                  stage_type: engine.stage_type || stageKey,
                  reusable: engine.reusable || false,
                  engines: []
                };
              }
              acc[stageKey].engines.push(engine);
              return acc;
            }, {});
            
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.values(enginesByStage).map((stageGroup: any, stageIdx: number) => (
                  <div key={stageIdx} style={{ 
                    borderBottom: `1px solid ${isDark ? '#333' : '#e0e0e0'}`,
                    paddingBottom: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ 
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem',
                      color: textPrimary
                    }}>
                      {stageGroup.stage_type}
                      {stageGroup.reusable && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#4caf50' }}>(Reusable)</span>
                      )}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stageGroup.engines.map((engine: any, engineIdx: number) => (
                        <div key={engineIdx} style={{ 
                          backgroundColor: bgCard,
                          padding: '1rem',
                          borderRadius: '4px'
                        }}>
                          <h5 style={{ 
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            marginBottom: '0.75rem',
                            color: textPrimary
                          }}>
                            {engine.engine_name || engine.name || engine.type || engine.engine_type || engine.configuration || 'Engine'}
                          </h5>
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem'
                          }}>
                            {engine.engine_type && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Type: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.engine_type}</span>
                              </div>
                            )}
                            {engine.engine_configuration && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Configuration: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.engine_configuration}</span>
                              </div>
                            )}
                            {engine.engine_layout && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Layout: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.engine_layout}</span>
                              </div>
                            )}
                            {engine.engine_version && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Version: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.engine_version}</span>
                              </div>
                            )}
                            {(engine.isp_sea_level || engine.isp_vacuum) && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>ISP: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>
                                  {engine.isp_sea_level ? `Sea Level: ${engine.isp_sea_level}s` : ''}
                                  {engine.isp_sea_level && engine.isp_vacuum ? ' | ' : ''}
                                  {engine.isp_vacuum ? `Vacuum: ${engine.isp_vacuum}s` : ''}
                                </span>
                              </div>
                            )}
                            {engine.thrust_sea_level_kn && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Thrust (Sea Level): </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.thrust_sea_level_kn} kN</span>
                              </div>
                            )}
                            {engine.thrust_vacuum_kn && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Thrust (Vacuum): </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.thrust_vacuum_kn} kN</span>
                              </div>
                            )}
                            {engine.number_of_engines && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Number of Engines: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.number_of_engines}</span>
                              </div>
                            )}
                            {engine.propellant_1 && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Propellant 1: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.propellant_1}</span>
                              </div>
                            )}
                            {engine.propellant_2 && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Propellant 2: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.propellant_2}</span>
                              </div>
                            )}
                            {engine.engine_loss_max && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Engine Loss Max: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.engine_loss_max}</span>
                              </div>
                            )}
                            {engine.stage_thrust_kn && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Stage Thrust: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.stage_thrust_kn} kN</span>
                              </div>
                            )}
                            {engine.stage_fuel_amount_tons && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Fuel Amount: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.stage_fuel_amount_tons} tons</span>
                              </div>
                            )}
                            {engine.stage_burn_time_sec && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: textSecondary }}>Burn Time: </span>
                                <span style={{ fontWeight: '500', color: textPrimary }}>{engine.stage_burn_time_sec} seconds</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        />
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Hazards">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Hazards
          </Typography>
          <FunctionField
            render={(record: any) => {
              const hazards = record?.hazards || [];
              if (!hazards || hazards.length === 0) {
                return <Typography sx={{ color: textDisabled }}>No hazards available</Typography>;
              }
              return (
                <ArrayField source="hazards">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Name" render={(item: any) => {
                      const name = typeof item?.name === 'object' ? null : item?.name;
                      return name || 'N/A';
                    }} />
                    <FunctionField label="Description" render={(item: any) => {
                      const desc = typeof item?.description === 'object' ? null : item?.description;
                      return desc || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Author">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Author
          </Typography>
          <ReferenceField source="author_id" reference="authors" link="show">
            <TextField source="full_name" />
          </ReferenceField>
        </Paper>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="PAD">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Pad Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Pad ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.pad_json?.id || (typeof record?.pad === 'object' && record?.pad?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Pad Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.pad_json?.name || (typeof record?.pad === 'object' && record?.pad?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Active</div>
              <FunctionField
                render={(record: any) => {
                  const active = record?.pad_json?.active !== undefined ? record.pad_json.active : (record?.pad?.active !== undefined ? record.pad.active : null);
                  if (active === null) return <span style={{ color: textDisabled }}>N/A</span>;
                  return (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      backgroundColor: active ? '#4caf50' : '#e0e0e0',
                      color: active ? 'white' : '#666'
                    }}>
                      {active ? 'Yes' : 'No'}
                    </span>
                  );
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Country Code</div>
              <FunctionField render={(record: any) => <span>{record?.pad_json?.country_code || record?.pad?.country_code || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Latitude</div>
              <FunctionField render={(record: any) => <span>{record?.pad_json?.latitude || record?.pad?.latitude || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Longitude</div>
              <FunctionField render={(record: any) => <span>{record?.pad_json?.longitude || record?.pad?.longitude || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Total Launch Count</div>
              <FunctionField render={(record: any) => <span>{record?.pad_json?.total_launch_count || record?.pad?.total_launch_count || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbital Launch Attempt Count</div>
              <FunctionField render={(record: any) => <span>{record?.pad_json?.orbital_launch_attempt_count || record?.pad?.orbital_launch_attempt_count || 'N/A'}</span>} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.pad_json?.description || record?.pad?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Info URL</div>
              <FunctionField
                render={(record: any) => {
                  const url = record?.pad_json?.info_url || record?.pad?.info_url;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Wiki URL</div>
              <FunctionField
                render={(record: any) => {
                  const url = record?.pad_json?.wiki_url || record?.pad?.wiki_url;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Map URL</div>
              <FunctionField
                render={(record: any) => {
                  const url = record?.pad_json?.map_url || record?.pad?.map_url;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Map Image</h4>
          <FunctionField
            render={(record: any) => {
              const mapImage = record?.pad_json?.map_image || record?.pad?.map_image;
              if (!mapImage) return <span style={{ color: textDisabled }}>N/A</span>;
              return (
                <div>
                  <img 
                    src={mapImage} 
                    alt={`Map of ${record?.pad_json?.name || record?.pad?.name || 'Launch Pad'}`}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px', marginTop: '0.5rem' }}
                  />
                </div>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Location</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Location ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.pad_json?.location?.id || (typeof record?.pad?.location === 'object' && record?.pad?.location?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Location Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.pad_json?.location?.name || (typeof record?.pad?.location === 'object' && record?.pad?.location?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Location Country Code</div>
              <FunctionField render={(record: any) => {
                const code = record?.pad_json?.location?.country_code || (typeof record?.pad?.location === 'object' && record?.pad?.location?.country_code) || null;
                return <span>{code || 'N/A'}</span>;
              }} />
            </div>
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Provider">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Launch Service Provider</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Provider ID</div>
              <FunctionField render={(record: any) => {
                let id = record?.launch_service_provider_json?.id;
                if (id == null && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    id = record.launch_service_provider.id;
                  }
                }
                if (typeof id === 'object') id = null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Provider Name</div>
              <FunctionField render={(record: any) => {
                let name = record?.launch_service_provider_json?.name;
                if (!name && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    name = record.launch_service_provider.name;
                  }
                }
                if (typeof name === 'object') name = null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Abbreviation</div>
              <FunctionField render={(record: any) => {
                let abbrev = record?.launch_service_provider_json?.abbrev;
                if (!abbrev && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    abbrev = record.launch_service_provider.abbrev;
                  }
                }
                if (typeof abbrev === 'object') abbrev = null;
                return <span>{abbrev || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Type</div>
              <FunctionField render={(record: any) => {
                let type = record?.launch_service_provider_json?.type;
                if (!type && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    type = record.launch_service_provider.type;
                  }
                }
                if (typeof type === 'object') type = null;
                return <span>{type || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Country Code</div>
              <FunctionField render={(record: any) => {
                let code = record?.launch_service_provider_json?.country_code;
                if (!code && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    code = record.launch_service_provider.country_code;
                  }
                }
                if (typeof code === 'object') code = null;
                return <span>{code || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Provider URL</div>
            <FunctionField
              render={(record: any) => {
                let url = record?.launch_service_provider_json?.url;
                if (!url && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    url = record.launch_service_provider.url;
                  }
                }
                if (typeof url === 'object') url = null;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                let desc = record?.launch_service_provider_json?.description;
                if (!desc && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    desc = record.launch_service_provider.description;
                  }
                }
                if (typeof desc === 'object') desc = null;
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Additional Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Founding Year</div>
              <FunctionField render={(record: any) => {
                let year = record?.launch_service_provider_json?.founding_year;
                if (!year && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    year = record.launch_service_provider.founding_year;
                  }
                }
                if (typeof year === 'object') year = null;
                return <span>{year || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Administrator</div>
              <FunctionField render={(record: any) => {
                let admin = record?.launch_service_provider_json?.administrator;
                if (!admin && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    admin = record.launch_service_provider.administrator;
                  }
                }
                if (typeof admin === 'object') admin = null;
                return <span>{admin || 'N/A'}</span>;
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Additional Links</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Wiki URL</div>
              <FunctionField render={(record: any) => {
                let url = record?.launch_service_provider_json?.wiki_url;
                if (!url && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    url = record.launch_service_provider.wiki_url;
                  }
                }
                if (typeof url === 'object') url = null;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Info URL</div>
              <FunctionField render={(record: any) => {
                let url = record?.launch_service_provider_json?.info_url;
                if (!url && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    url = record.launch_service_provider.info_url;
                  }
                }
                if (typeof url === 'object') url = null;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Logo URL</div>
              <FunctionField render={(record: any) => {
                let url = record?.launch_service_provider_json?.logo_url;
                if (!url && record?.launch_service_provider) {
                  if (typeof record.launch_service_provider === 'object' && !Array.isArray(record.launch_service_provider)) {
                    url = record.launch_service_provider.logo_url;
                  }
                }
                if (typeof url === 'object') url = null;
                if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return (
                  <div>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, marginBottom: '0.5rem', display: 'block' }}>{url} ↗</a>
                    <img src={url} alt="Provider Logo" style={{ maxWidth: '200px', height: 'auto', marginTop: '0.5rem' }} />
                  </div>
                );
              }} />
            </div>
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Metadata">
        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            YouTube
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Video ID
              </Typography>
              <FunctionField
                render={(record: any) => {
                  const videoId = record?.youtube_video_id;
                  if (!videoId) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                  return (
                    <Typography 
                      component="a"
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        mt: 0.5,
                        color: linkColor,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {videoId} ↗
                    </Typography>
                  );
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                Channel ID
              </Typography>
              <FunctionField
                render={(record: any) => {
                  const channelId = record?.youtube_channel_id;
                  if (!channelId) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                  return (
                    <Typography 
                      component="a"
                      href={`https://www.youtube.com/channel/${channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        mt: 0.5,
                        color: linkColor,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {channelId} ↗
                    </Typography>
                  );
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper 
          elevation={0}
          sx={{ 
            p: 2.5, 
            backgroundColor: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 2,
            mb: 3
          }}
        >
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: textPrimary
            }}
          >
            Links
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: textSecondary, 
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  letterSpacing: '0.5px',
                  fontWeight: 600
                }}
              >
                FlightClub URL
              </Typography>
              <FunctionField
                render={(record: any) => {
                  const url = record?.flightclub_url;
                  if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
                  return (
                    <Typography 
                      component="a"
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      sx={{ 
                        mt: 0.5,
                        color: linkColor,
                        textDecoration: 'none',
                        display: 'block',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {url} ↗
                    </Typography>
                  );
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Image</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Image ID</div>
              <FunctionField render={(record: any) => {
                let id = record?.image_json?.id;
                if (id == null && record?.image) {
                  if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                    id = record.image.id;
                  }
                }
                if (typeof id === 'object') id = null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Image Name</div>
              <FunctionField render={(record: any) => {
                let name = record?.image_json?.name;
                if (!name && record?.image) {
                  if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                    name = record.image.name;
                  }
                }
                if (typeof name === 'object') name = null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Credit</div>
              <FunctionField render={(record: any) => {
                let credit = record?.image_json?.credit;
                if (!credit && record?.image) {
                  if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                    credit = record.image.credit;
                  }
                }
                if (typeof credit === 'object') credit = null;
                return <span>{credit || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>License</div>
              <FunctionField render={(record: any) => {
                let license = record?.image_json?.license;
                if (!license && record?.image) {
                  if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                    license = record.image.license;
                  }
                }
                if (typeof license === 'object') license = null;
                return <span>{license || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Image URL</div>
              <FunctionField
                render={(record: any) => {
                  let url = record?.image_json?.image_url;
                  if (!url && record?.image) {
                    if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                      url = record.image.image_url;
                    }
                  }
                  if (typeof url === 'object') url = null;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Thumbnail URL</div>
              <FunctionField
                render={(record: any) => {
                  let url = record?.image_json?.thumbnail_url;
                  if (!url && record?.image) {
                    if (typeof record.image === 'object' && !Array.isArray(record.image)) {
                      url = record.image.thumbnail_url;
                    }
                  }
                  if (typeof url === 'object') url = null;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Infographic</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Infographic ID</div>
              <FunctionField render={(record: any) => {
                let id = record?.infographic_json?.id;
                if (id == null && record?.infographic) {
                  if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                    id = record.infographic.id;
                  }
                }
                if (typeof id === 'object') id = null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Infographic Name</div>
              <FunctionField render={(record: any) => {
                let name = record?.infographic_json?.name;
                if (!name && record?.infographic) {
                  if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                    name = record.infographic.name;
                  }
                }
                if (typeof name === 'object') name = null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Credit</div>
              <FunctionField render={(record: any) => {
                let credit = record?.infographic_json?.credit;
                if (!credit && record?.infographic) {
                  if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                    credit = record.infographic.credit;
                  }
                }
                if (typeof credit === 'object') credit = null;
                return <span>{credit || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>License</div>
              <FunctionField render={(record: any) => {
                let license = record?.infographic_json?.license;
                if (!license && record?.infographic) {
                  if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                    license = record.infographic.license;
                  }
                }
                if (typeof license === 'object') license = null;
                return <span>{license || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Image URL</div>
              <FunctionField
                render={(record: any) => {
                  let url = record?.infographic_json?.image_url;
                  if (!url && record?.infographic) {
                    if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                      url = record.infographic.image_url;
                    }
                  }
                  if (typeof url === 'object') url = null;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Thumbnail URL</div>
              <FunctionField
                render={(record: any) => {
                  let url = record?.infographic_json?.thumbnail_url;
                  if (!url && record?.infographic) {
                    if (typeof record.infographic === 'object' && !Array.isArray(record.infographic)) {
                      url = record.infographic.thumbnail_url;
                    }
                  }
                  if (typeof url === 'object') url = null;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Media Links</h3>
          <FunctionField
            render={(record: any) => {
              const media = record?.media;
              if (!media) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No media links available</div>;
              }
              
              // Handle array of media objects
              if (Array.isArray(media)) {
                if (media.length === 0) {
                  return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No media links available</div>;
                }
                return (
                  <ArrayField source="media">
                    <Datagrid bulkActionButtons={false}>
                      <FunctionField label="ID" render={(item: any) => {
                        const id = typeof item?.id === 'object' ? null : item?.id;
                        return id != null ? String(id) : 'N/A';
                      }} />
                      <FunctionField label="Name" render={(item: any) => {
                        const name = typeof item?.name === 'object' ? null : item?.name;
                        return name || 'N/A';
                      }} />
                      <FunctionField label="Link" render={(item: any) => {
                        const link = typeof item?.link === 'object' ? null : item?.link;
                        if (!link) return 'N/A';
                        return <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{link} ↗</a>;
                      }} />
                      <FunctionField label="Priority" render={(item: any) => {
                        const priority = typeof item?.priority === 'object' ? null : item?.priority;
                        return priority != null ? String(priority) : 'N/A';
                      }} />
                    </Datagrid>
                  </ArrayField>
                );
              }
              
              // Handle single media object
              if (typeof media === 'object') {
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
                      <span>{typeof media.id === 'object' ? 'N/A' : (media.id != null ? String(media.id) : 'N/A')}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Name</div>
                      <span>{typeof media.name === 'object' ? 'N/A' : (media.name || 'N/A')}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Link</div>
                      {typeof media.link === 'object' || !media.link ? (
                        <span>N/A</span>
                      ) : (
                        <a href={media.link} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{media.link} ↗</a>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Priority</div>
                      <span>{typeof media.priority === 'object' ? 'N/A' : (media.priority != null ? String(media.priority) : 'N/A')}</span>
                    </div>
                  </div>
                );
              }
              
              return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>Invalid media format</div>;
            }}
          />
        </div>

        {/* Infographic Fields */}
        <Paper elevation={0} sx={{ p: 2.5, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: textPrimary }}>Infographic</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Infographic ID</Typography><TextField source="infographic_json.id" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Infographic Name</Typography><TextField source="infographic_json.name" /></Grid>
            <Grid item xs={12} sm={6} md={8}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Image URL</Typography><FunctionField render={(record: any) => {
              const url = record?.infographic_json?.image_url;
              if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
              return <Typography component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5, color: linkColor, textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}>{url} ↗</Typography>;
            }} /></Grid>
            <Grid item xs={12} sm={6} md={8}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Thumbnail URL</Typography><FunctionField render={(record: any) => {
              const url = record?.infographic_json?.thumbnail_url;
              if (!url) return <Typography sx={{ mt: 0.5, color: textDisabled }}>N/A</Typography>;
              return <Typography component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ mt: 0.5, color: linkColor, textDecoration: 'none', display: 'block', '&:hover': { textDecoration: 'underline' } }}>{url} ↗</Typography>;
            }} /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Credit</Typography><TextField source="infographic_json.credit" /></Grid>
            <Grid item xs={12} sm={6} md={4}><Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>License</Typography><TextField source="infographic_json.license" /></Grid>
          </Grid>
        </Paper>

        {/* Arrays Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Updates</h3>
          <FunctionField
            render={(record: any) => {
              const updates = record?.updates || [];
              if (!updates || updates.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No updates available</div>;
              }
              return (
                <ArrayField source="updates">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Comment" render={(item: any) => {
                      const comment = typeof item?.comment === 'object' ? null : item?.comment;
                      return comment || 'N/A';
                    }} />
                    <FunctionField
                      label="Created On"
                      render={(item: any) => {
                        const date = typeof item?.created_on === 'object' ? null : item?.created_on;
                        return date ? new Date(date).toLocaleString() : 'N/A';
                      }}
                    />
                    <FunctionField label="Created By" render={(item: any) => {
                      const createdBy = typeof item?.created_by === 'object' ? null : item?.created_by;
                      return createdBy || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Timeline</h3>
          <FunctionField
            render={(record: any) => {
              const timeline = record?.timeline || [];
              if (!timeline || timeline.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No timeline events available</div>;
              }
              return (
                <ArrayField source="timeline">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField
                      label="Type"
                      render={(item: any) => {
                        if (typeof item?.type === 'object' && item?.type) {
                          return item.type.abbrev || item.type.description || 'N/A';
                        }
                        return item?.type || 'N/A';
                      }}
                    />
                    <FunctionField label="Relative Time" render={(item: any) => {
                      const time = typeof item?.relative_time === 'object' ? null : item?.relative_time;
                      return time != null ? String(time) : 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Info URLs</h3>
          <FunctionField
            render={(record: any) => {
              const urls = record?.info_urls || [];
              if (!urls || urls.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No info URLs available</div>;
              }
              return (
                <ArrayField source="info_urls">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="Priority" render={(item: any) => {
                      const priority = typeof item?.priority === 'object' ? null : item?.priority;
                      return priority != null ? String(priority) : 'N/A';
                    }} />
                    <FunctionField label="Title" render={(item: any) => {
                      const title = typeof item?.title === 'object' ? null : item?.title;
                      return title || 'N/A';
                    }} />
                    <FunctionField label="URL" render={(item: any) => {
                      const url = typeof item?.url === 'object' ? null : item?.url;
                      if (!url) return 'N/A';
                      return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Mission Patches</h3>
          <FunctionField
            render={(record: any) => {
              const patches = record?.mission_patches || [];
              if (!patches || patches.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No mission patches available</div>;
              }
              return (
                <ArrayField source="mission_patches">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Name" render={(item: any) => {
                      const name = typeof item?.name === 'object' ? null : item?.name;
                      return name || 'N/A';
                    }} />
                    <FunctionField label="Image URL" render={(item: any) => {
                      const url = typeof item?.image_url === 'object' ? null : item?.image_url;
                      if (!url) return 'N/A';
                      return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        {/* Program Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Program</h3>
        <FunctionField
          render={(record: any) => {
            const programs = record?.program_json || record?.program || [];
            if (!programs || programs.length === 0) {
              return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No programs available</div>;
            }
            return (
              <ArrayField source="program_json">
                <Datagrid bulkActionButtons={false}>
                  <FunctionField label="ID" render={(item: any) => {
                    const id = typeof item?.id === 'object' ? null : item?.id;
                    return id != null ? String(id) : 'N/A';
                  }} />
                  <FunctionField label="Name" render={(item: any) => {
                    const name = typeof item?.name === 'object' ? null : item?.name;
                    return name || 'N/A';
                  }} />
                  <FunctionField label="Description" render={(item: any) => {
                    const desc = typeof item?.description === 'object' ? null : item?.description;
                    return desc || 'N/A';
                  }} />
                </Datagrid>
              </ArrayField>
            );
          }}
        />
        </div>

        {/* Statistics Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Statistics</h3>
        <FunctionField
          render={(record: any) => {
            const hasStats = 
                record?.orbital_launch_attempt_count != null ||
                record?.location_launch_attempt_count != null ||
                record?.pad_launch_attempt_count != null ||
                record?.agency_launch_attempt_count != null;
            
            if (!hasStats) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No statistics available</div>;
            }
            
            return (
                <Grid container spacing={2}>
                  {record?.orbital_launch_attempt_count != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Orbital Launch Attempt Count</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.orbital_launch_attempt_count}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.location_launch_attempt_count != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Location Launch Attempt Count</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.location_launch_attempt_count}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.pad_launch_attempt_count != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pad Launch Attempt Count</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.pad_launch_attempt_count}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.agency_launch_attempt_count != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Agency Launch Attempt Count</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.agency_launch_attempt_count}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.orbital_launch_attempt_count_year != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Orbital Launch Attempt Count (Year)</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.orbital_launch_attempt_count_year}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.location_launch_attempt_count_year != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Location Launch Attempt Count (Year)</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.location_launch_attempt_count_year}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.pad_launch_attempt_count_year != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pad Launch Attempt Count (Year)</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.pad_launch_attempt_count_year}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.agency_launch_attempt_count_year != null && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Agency Launch Attempt Count (Year)</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.agency_launch_attempt_count_year}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {record?.pad_turnaround && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: bgCard, border: `1px solid ${borderColor}`, borderRadius: 2, height: '100%' }}>
                        <Typography variant="caption" sx={{ color: textSecondary, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px', fontWeight: 600 }}>Pad Turnaround</Typography>
                        <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, color: linkColor }}>{record.pad_turnaround}</Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
            );
          }}
        />
        </div>

        {/* Additional Metadata Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
            <FunctionField render={(record: any) => <span>{record?.id || record?.database_id || 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>External ID</div>
            <FunctionField render={(record: any) => <span>{record?.external_id || record?.id || 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Slug</div>
            <FunctionField render={(record: any) => <span>{record?.slug || 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Response Mode</div>
            <FunctionField render={(record: any) => <span>{record?.response_mode || 'N/A'}</span>} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Created At</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.created_at;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Updated At</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.updated_at || record?.last_updated;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Comments">
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Comments</Typography>
          <LaunchCommentsComponent />
        </Box>
      </TabbedShowLayout.Tab>
      </TabbedShowLayout>
  </Show>
);
};

const LaunchTitle = () => {
  const record = useRecordContext();
  return record ? <span>{record.name || `Launch #${record.id}`}</span> : null;
};
