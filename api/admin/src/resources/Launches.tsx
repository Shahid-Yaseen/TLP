import { 
  List, Create, Edit, Show, TabbedForm, FormTab, TabbedShowLayout,
  TextInput, DateTimeInput, NumberInput, ReferenceInput, SelectInput, 
  Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, 
  BooleanInput, FunctionField, BooleanField, ImageField, RichTextField,
  useRecordContext, ArrayInput, SimpleFormIterator, ArrayField, UrlField,
  NumberField, ChipField
} from 'react-admin';
import { useTheme } from '@mui/material/styles';

const outcomeChoices = [
  { id: 'success', name: 'Success' },
  { id: 'failure', name: 'Failure' },
  { id: 'partial', name: 'Partial' },
  { id: 'TBD', name: 'TBD' },
];

export const LaunchList = (props: any) => (
  <List {...props}>
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
  </List>
);

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

// Array Field Component for editing arrays
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
  <Create {...props}>
    <TabbedForm>
      <FormTab label="Basic Info">
        <TextInput source="name" required />
        <TextInput source="slug" helperText="URL-friendly identifier" />
        <TextInput source="launch_designator" label="Launch Designator" helperText="e.g., 1957-001" />
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <ReferenceInput source="provider_id" reference="providers">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="rocket_id" reference="rockets">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="orbit_id" reference="orbits">
          <SelectInput optionText="code" />
        </ReferenceInput>
        <SelectInput source="outcome" choices={outcomeChoices} defaultValue="TBD" />
        <TextInput source="mission_description" multiline rows={5} />
        <TextInput source="details" multiline rows={5} />
        <TextInput source="url" label="Launch URL" />
        <BooleanInput source="is_featured" />
        <BooleanInput source="webcast_live" label="Webcast Live" />
      </FormTab>

      <FormTab label="Status & Probability">
        <NumberInput source="probability" helperText="0-100" />
        <TextInput source="weather_concerns" multiline rows={3} />
        <TextInput source="failreason" label="Failure Reason" multiline rows={3} />
        <TextInput source="hashtag" />
        <JsonbInput source="status_json" label="Status (JSON)" helperText="Complete status object" />
        <JsonbInput source="weather_concerns_json" label="Weather Concerns (JSON)" />
        <JsonbInput source="hashtag_json" label="Hashtag (JSON)" />
        <JsonbInput source="net_precision" label="NET Precision (JSON)" />
      </FormTab>

      <FormTab label="Mission">
        <JsonbInput source="mission_json" label="Mission (JSON)" helperText="Complete mission object with orbit, agencies, etc." />
      </FormTab>

      <FormTab label="Rocket">
        <JsonbInput source="rocket_json" label="Rocket (JSON)" helperText="Complete rocket object with configuration" />
      </FormTab>

      <FormTab label="Launch Pad">
        <JsonbInput source="pad_json" label="Pad (JSON)" helperText="Complete pad object with location, coordinates, etc." />
      </FormTab>

      <FormTab label="Provider">
        <JsonbInput source="launch_service_provider_json" label="Launch Service Provider (JSON)" helperText="Complete provider object" />
      </FormTab>

      <FormTab label="Media">
        <TextInput source="youtube_video_id" label="YouTube Video ID" />
        <TextInput source="youtube_channel_id" label="YouTube Channel ID" />
        <TextInput source="flightclub_url" label="FlightClub URL" />
        <JsonbInput source="image_json" label="Image (JSON)" helperText="Image object with URLs, credit, license" />
        <JsonbInput source="infographic_json" label="Infographic (JSON)" />
        <JsonbInput source="media" label="Media (JSON)" helperText="Media links object" />
      </FormTab>

      <FormTab label="Arrays">
        <h3 style={{ marginTop: '0', marginBottom: '0.5rem' }}>Updates</h3>
        <UpdatesArrayInput source="updates" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Timeline</h3>
        <TimelineArrayInput source="timeline" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h3>
        <VidUrlsArrayInput source="vid_urls" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Info URLs</h3>
        <InfoUrlsArrayInput source="info_urls" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Mission Patches</h3>
        <MissionPatchesArrayInput source="mission_patches" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Payloads</h3>
        <PayloadsArrayInput source="payloads" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Crew</h3>
        <CrewArrayInput source="crew" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hazards</h3>
        <HazardsArrayInput source="hazards" />
      </FormTab>

      <FormTab label="Program">
        <ProgramArrayInput source="program_json" />
      </FormTab>

      <FormTab label="Statistics">
        <NumberInput source="orbital_launch_attempt_count" />
        <NumberInput source="location_launch_attempt_count" />
        <NumberInput source="pad_launch_attempt_count" />
        <NumberInput source="agency_launch_attempt_count" />
        <NumberInput source="orbital_launch_attempt_count_year" />
        <NumberInput source="location_launch_attempt_count_year" />
        <NumberInput source="pad_launch_attempt_count_year" />
        <NumberInput source="agency_launch_attempt_count_year" />
        <TextInput source="pad_turnaround" label="Pad Turnaround" />
      </FormTab>

      <FormTab label="Metadata">
        <TextInput source="external_id" label="External ID (UUID)" helperText="From Space Devs API" />
        <TextInput source="response_mode" label="Response Mode" defaultValue="normal" />
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
  return (
    <Edit {...props} transform={transformLaunchData}>
    <TabbedForm>
      <FormTab label="Basic Info">
        <TextInput source="id" disabled />
        <TextInput source="name" required />
        <TextInput source="slug" helperText="URL-friendly identifier" />
        <TextInput source="launch_designator" label="Launch Designator" helperText="e.g., 1957-001" />
        <DateTimeInput source="launch_date" label="Launch Date" required />
        <DateTimeInput source="net" label="NET (No Earlier Than)" helperText="Used for countdown display" />
        <DateTimeInput source="window_start" label="Launch Window Start" />
        <DateTimeInput source="window_end" label="Launch Window End" />
        <ReferenceInput source="provider_id" reference="providers">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="rocket_id" reference="rockets">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="site_id" reference="launch_sites">
          <SelectInput optionText="name" />
        </ReferenceInput>
        <ReferenceInput source="orbit_id" reference="orbits">
          <SelectInput optionText="code" />
        </ReferenceInput>
        <SelectInput source="outcome" choices={outcomeChoices} />
        <TextInput source="mission_description" multiline rows={5} />
        <TextInput source="details" multiline rows={5} />
        <TextInput source="url" label="Launch URL" />
        <BooleanInput source="is_featured" />
        <BooleanInput source="webcast_live" label="Webcast Live" />
      </FormTab>

        <FormTab label="Status">
        <NumberInput source="probability" helperText="0-100" />
        <TextInput source="weather_concerns" multiline rows={3} />
        <TextInput source="failreason" label="Failure Reason" multiline rows={3} />
        <TextInput source="hashtag" />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Status Details</h3>
          <TextInput source="status_json.id" label="Status ID" />
          <TextInput source="status_json.name" label="Status Name" />
          <TextInput source="status_json.abbrev" label="Status Abbreviation" />
          <TextInput source="status_json.description" label="Status Description" multiline rows={3} />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Weather Concerns</h3>
          <TextInput source="weather_concerns_json.id" label="Weather Concerns ID" />
          <TextInput source="weather_concerns_json.name" label="Weather Concerns Name" />
          <TextInput source="weather_concerns_json.description" label="Weather Concerns Description" multiline rows={3} />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hashtag</h3>
          <TextInput source="hashtag_json.id" label="Hashtag ID" />
          <TextInput source="hashtag_json.name" label="Hashtag Name" />
          <TextInput source="hashtag_json.description" label="Hashtag Description" multiline rows={3} />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>NET Precision</h3>
          <TextInput source="net_precision.id" label="NET Precision ID" />
          <TextInput source="net_precision.name" label="NET Precision Name" />
          <TextInput source="net_precision.abbrev" label="NET Precision Abbreviation" />
          <TextInput source="net_precision.description" label="NET Precision Description" multiline rows={3} />
      </FormTab>

      <FormTab label="Mission">
          <h3>Mission Details</h3>
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

      <FormTab label="Rocket">
          <h3>Rocket Details</h3>
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

      <FormTab label="Launch Pad">
          <h3>Pad Details</h3>
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
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Location</h4>
          <TextInput source="pad_json.location.id" label="Location ID" />
          <TextInput source="pad_json.location.name" label="Location Name" />
          <TextInput source="pad_json.location.country_code" label="Location Country Code" />
          <NumberInput source="pad_json.total_launch_count" label="Total Launch Count" />
      </FormTab>

      <FormTab label="Provider">
          <h3>Launch Service Provider</h3>
          <TextInput source="launch_service_provider_json.id" label="Provider ID" />
          <TextInput source="launch_service_provider_json.url" label="Provider URL" />
          <TextInput source="launch_service_provider_json.name" label="Provider Name" />
          <TextInput source="launch_service_provider_json.abbrev" label="Abbreviation" />
          <TextInput source="launch_service_provider_json.type" label="Type" />
          <TextInput source="launch_service_provider_json.description" label="Description" multiline rows={3} />
          <TextInput source="launch_service_provider_json.country_code" label="Country Code" />
      </FormTab>

      <FormTab label="Media">
        <TextInput source="youtube_video_id" label="YouTube Video ID" />
        <TextInput source="youtube_channel_id" label="YouTube Channel ID" />
        <TextInput source="flightclub_url" label="FlightClub URL" />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Image</h3>
          <TextInput source="image_json.id" label="Image ID" />
          <TextInput source="image_json.name" label="Image Name" />
          <TextInput source="image_json.image_url" label="Image URL" />
          <TextInput source="image_json.thumbnail_url" label="Thumbnail URL" />
          <TextInput source="image_json.credit" label="Credit" />
          <TextInput source="image_json.license" label="License" />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Infographic</h3>
          <TextInput source="infographic_json.id" label="Infographic ID" />
          <TextInput source="infographic_json.name" label="Infographic Name" />
          <TextInput source="infographic_json.image_url" label="Image URL" />
          <TextInput source="infographic_json.thumbnail_url" label="Thumbnail URL" />
          <TextInput source="infographic_json.credit" label="Credit" />
          <TextInput source="infographic_json.license" label="License" />
        <JsonbInput source="media" label="Media (JSON)" helperText="Media links object" />
      </FormTab>

      <FormTab label="Arrays">
        <h3 style={{ marginTop: '0', marginBottom: '0.5rem' }}>Updates</h3>
        <UpdatesArrayInput source="updates" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Timeline</h3>
        <TimelineArrayInput source="timeline" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Video URLs</h3>
        <VidUrlsArrayInput source="vid_urls" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Info URLs</h3>
        <InfoUrlsArrayInput source="info_urls" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Mission Patches</h3>
        <MissionPatchesArrayInput source="mission_patches" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Payloads</h3>
        <PayloadsArrayInput source="payloads" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Crew</h3>
        <CrewArrayInput source="crew" />
        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Hazards</h3>
        <HazardsArrayInput source="hazards" />
      </FormTab>

      <FormTab label="Program">
        <ProgramArrayInput source="program_json" />
      </FormTab>

      <FormTab label="Statistics">
        <NumberInput source="orbital_launch_attempt_count" />
        <NumberInput source="location_launch_attempt_count" />
        <NumberInput source="pad_launch_attempt_count" />
        <NumberInput source="agency_launch_attempt_count" />
        <NumberInput source="orbital_launch_attempt_count_year" />
        <NumberInput source="location_launch_attempt_count_year" />
        <NumberInput source="pad_launch_attempt_count_year" />
        <NumberInput source="agency_launch_attempt_count_year" />
        <TextInput source="pad_turnaround" label="Pad Turnaround" />
      </FormTab>

      <FormTab label="Metadata">
        <TextInput source="external_id" label="External ID (UUID)" helperText="From Space Devs API" disabled />
        <TextInput source="response_mode" label="Response Mode" />
        <DateField source="created_at" showTime />
        <DateField source="updated_at" showTime />
      </FormTab>
    </TabbedForm>
  </Edit>
);
};

export const LaunchShow = (props: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // Theme-aware colors
  const textPrimary = isDark ? '#e0e0e0' : '#333';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const textDisabled = isDark ? '#808080' : '#999';
  const bgCard = isDark ? '#2a2a2a' : '#f5f5f5';
  const bgPaper = isDark ? '#1e1e1e' : '#fafafa';
  const linkColor = theme.palette.primary.main;
  
  return (
    <Show {...props} title={<LaunchTitle />}>
      <TabbedShowLayout>
      <TabbedShowLayout.Tab label="Basic Info">
        <FunctionField
          label=""
          render={(record: any) => (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: linkColor }}>
                {record?.name || record?.title || 'Unnamed Launch'}
              </h2>
              {record?.launch_designator && (
                <p style={{ margin: '0.25rem 0 0 0', color: textSecondary, fontSize: '0.9rem' }}>
                  Designator: {record.launch_designator}
                </p>
              )}
            </div>
          )}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Launch Date</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.launch_date || record?.net || record?.window_start;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span style={{ fontSize: '1rem', fontWeight: '500' }}>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Status</div>
            <FunctionField
              render={(record: any) => {
                const outcome = record?.outcome || record?.status?.abbrev || 'TBD';
                const colors: any = {
                  success: '#4caf50',
                  failure: '#f44336',
                  partial: '#ff9800',
                  TBD: '#9e9e9e'
                };
                return (
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    backgroundColor: colors[outcome] || colors.TBD,
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {outcome}
                  </span>
                );
              }}
            />
          </div>
          
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Probability</div>
            <FunctionField
              render={(record: any) => (
                <span style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {record?.probability !== null && record?.probability !== undefined ? `${record.probability}%` : 'N/A'}
                </span>
              )}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Mission Description</h3>
          <FunctionField
            render={(record: any) => {
              const desc = record?.mission_description || record?.mission?.description || '';
              if (!desc) return <span style={{ color: textDisabled }}>No description available</span>;
              return (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: bgPaper, 
                  borderRadius: '4px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {desc}
                </div>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Details</h3>
          <FunctionField
            render={(record: any) => {
              const details = record?.details || record?.description || '';
              if (!details) return <span style={{ color: textDisabled }}>No details available</span>;
              return (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: bgPaper, 
                  borderRadius: '4px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {details}
                </div>
              );
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
            <FunctionField render={(record: any) => <span>{record?.id || record?.database_id || 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Slug</div>
            <FunctionField render={(record: any) => <span>{record?.slug || 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Launch Designator</div>
            <FunctionField render={(record: any) => <span>{record?.launch_designator || 'N/A'}</span>} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Provider</div>
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
                return <span style={{ fontSize: '1rem', fontWeight: '500' }}>{provider}</span>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Rocket</div>
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
                return <span style={{ fontSize: '1rem', fontWeight: '500' }}>{rocket}</span>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Launch Site</div>
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
                return <span style={{ fontSize: '1rem', fontWeight: '500' }}>{site}</span>;
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbit</div>
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
                return <span style={{ fontSize: '1rem', fontWeight: '500' }}>{orbit}</span>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Launch URL</h3>
          <FunctionField
            render={(record: any) => {
              const url = record?.url;
              if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>
                  {url} ↗
                </a>
              );
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <FunctionField
            label="Featured"
            render={(record: any) => (
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                backgroundColor: record?.is_featured ? '#4caf50' : '#e0e0e0',
                color: record?.is_featured ? 'white' : '#666'
              }}>
                Featured: {record?.is_featured ? 'Yes' : 'No'}
              </span>
            )}
          />
          <FunctionField
            label="Webcast Live"
            render={(record: any) => (
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                backgroundColor: record?.webcast_live ? '#4caf50' : '#e0e0e0',
                color: record?.webcast_live ? 'white' : '#666'
              }}>
                Webcast Live: {record?.webcast_live ? 'Yes' : 'No'}
              </span>
            )}
          />
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Status">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Probability</div>
            <FunctionField
              render={(record: any) => (
                <span style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {record?.probability !== null && record?.probability !== undefined ? `${record.probability}%` : 'N/A'}
                </span>
              )}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Weather Concerns</h3>
          <FunctionField
            render={(record: any) => {
              const concerns = record?.weather_concerns || '';
                if (!concerns) return <span style={{ color: textDisabled }}>N/A</span>;
                return (
                  <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {concerns}
                </div>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Failure Reason</h3>
          <FunctionField
            render={(record: any) => {
              const reason = record?.failreason || '';
                if (!reason) return <span style={{ color: textDisabled }}>N/A</span>;
                return (
                  <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {reason}
                </div>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Hashtag</h3>
          <FunctionField render={(record: any) => <span>{record?.hashtag || 'N/A'}</span>} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Status Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Status ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.status_json?.id || (typeof record?.status === 'object' && record?.status?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Status Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.status_json?.name || (typeof record?.status === 'object' && record?.status?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Status Abbreviation</div>
              <FunctionField render={(record: any) => {
                const abbrev = record?.status_json?.abbrev || (typeof record?.status === 'object' && record?.status?.abbrev) || null;
                return <span>{abbrev || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Status Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.status_json?.description || record?.status?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Weather Concerns JSON</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
              <FunctionField render={(record: any) => <span>{record?.weather_concerns_json?.id || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Name</div>
              <FunctionField render={(record: any) => <span>{record?.weather_concerns_json?.name || 'N/A'}</span>} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.weather_concerns_json?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Hashtag JSON</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
              <FunctionField render={(record: any) => <span>{record?.hashtag_json?.id || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Name</div>
              <FunctionField render={(record: any) => <span>{record?.hashtag_json?.name || 'N/A'}</span>} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.hashtag_json?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>NET Precision</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>ID</div>
              <FunctionField render={(record: any) => <span>{record?.net_precision?.id || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Name</div>
              <FunctionField render={(record: any) => <span>{record?.net_precision?.name || 'N/A'}</span>} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Abbreviation</div>
              <FunctionField render={(record: any) => <span>{record?.net_precision?.abbrev || 'N/A'}</span>} />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.net_precision?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Mission">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Mission Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Mission ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.mission_json?.id || (typeof record?.mission === 'object' && record?.mission?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Mission Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.mission_json?.name || (typeof record?.mission === 'object' && record?.mission?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Mission Type</div>
              <FunctionField render={(record: any) => {
                const type = record?.mission_json?.type || (typeof record?.mission === 'object' && record?.mission?.type) || null;
                return <span>{type || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Mission Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.mission_json?.description || record?.mission?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Orbit</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbit ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.mission_json?.orbit?.id || (typeof record?.mission?.orbit === 'object' && record?.mission?.orbit?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbit Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.mission_json?.orbit?.name || (typeof record?.mission?.orbit === 'object' && record?.mission?.orbit?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbit Abbreviation</div>
              <FunctionField render={(record: any) => {
                const abbrev = record?.mission_json?.orbit?.abbrev || (typeof record?.mission?.orbit === 'object' && record?.mission?.orbit?.abbrev) || null;
                return <span>{abbrev || 'N/A'}</span>;
              }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Agencies</h4>
          <FunctionField
            render={(record: any) => {
              const agencies = record?.mission_json?.agencies || record?.mission?.agencies || [];
              if (!agencies || agencies.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No agencies available</div>;
              }
              return (
                <ArrayField source="mission_json.agencies">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="ID" render={(item: any) => {
                      const id = typeof item?.id === 'object' ? null : item?.id;
                      return id != null ? String(id) : 'N/A';
                    }} />
                    <FunctionField label="Name" render={(item: any) => {
                      const name = typeof item?.name === 'object' ? null : item?.name;
                      return name || 'N/A';
                    }} />
                    <FunctionField label="Abbreviation" render={(item: any) => {
                      const abbrev = typeof item?.abbrev === 'object' ? null : item?.abbrev;
                      return abbrev || 'N/A';
                    }} />
                    <FunctionField label="Type" render={(item: any) => {
                      const type = typeof item?.type === 'object' ? null : item?.type;
                      return type || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Info URLs</h4>
          <FunctionField
            render={(record: any) => {
              const urls = record?.mission_json?.info_urls || record?.mission?.info_urls || record?.info_urls || [];
              if (!urls || urls.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No info URLs available</div>;
              }
              return (
                <ArrayField source="mission_json.info_urls">
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
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Video URLs</h4>
          <FunctionField
            render={(record: any) => {
              const urls = record?.mission_json?.vid_urls || record?.mission?.vid_urls || record?.vid_urls || [];
              if (!urls || urls.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No video URLs available</div>;
              }
              return (
                <ArrayField source="mission_json.vid_urls">
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
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Rocket">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Rocket Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Rocket ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.rocket_json?.id || (typeof record?.rocket === 'object' && record?.rocket?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Rocket URL</div>
              <FunctionField
                render={(record: any) => {
                  const url = record?.rocket_json?.url || record?.rocket?.url;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor }}>{url} ↗</a>;
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Configuration</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Configuration ID</div>
              <FunctionField render={(record: any) => {
                const id = record?.rocket_json?.configuration?.id || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.id) || null;
                return <span>{id != null ? String(id) : 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Configuration Name</div>
              <FunctionField render={(record: any) => {
                const name = record?.rocket_json?.configuration?.name || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.name) || null;
                return <span>{name || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Full Name</div>
              <FunctionField render={(record: any) => {
                const fullName = record?.rocket_json?.configuration?.full_name || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.full_name) || null;
                return <span>{fullName || 'N/A'}</span>;
              }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Variant</div>
              <FunctionField render={(record: any) => {
                const variant = record?.rocket_json?.configuration?.variant || (typeof record?.rocket?.configuration === 'object' && record?.rocket?.configuration?.variant) || null;
                return <span>{variant || 'N/A'}</span>;
              }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Description</div>
            <FunctionField
              render={(record: any) => {
                const desc = record?.rocket_json?.configuration?.description || record?.rocket?.configuration?.description || '';
                if (!desc) return <span style={{ color: textDisabled }}>N/A</span>;
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{desc}</div>;
              }}
            />
          </div>
        </div>

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
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Launch Pad">
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
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Timing">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Launch Date</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.launch_date || record?.net;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>NET (No Earlier Than)</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.net || record?.launch_date;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Window Start</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.window_start;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
          <div style={{ padding: '1rem', backgroundColor: bgCard, borderRadius: '4px' }}>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.5rem' }}>Window End</div>
            <FunctionField
              render={(record: any) => {
                const date = record?.window_end;
                if (!date) return <span style={{ color: textDisabled }}>N/A</span>;
                return <span>{new Date(date).toLocaleString()}</span>;
              }}
            />
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Media">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>YouTube</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Video ID</div>
              <FunctionField
                render={(record: any) => {
                  const videoId = record?.youtube_video_id;
                  if (!videoId) return <span style={{ color: textDisabled }}>N/A</span>;
                  return (
                    <a 
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: linkColor, textDecoration: 'none' }}
                    >
                      {videoId} ↗
                    </a>
                  );
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Channel ID</div>
              <FunctionField
                render={(record: any) => {
                  const channelId = record?.youtube_channel_id;
                  if (!channelId) return <span style={{ color: textDisabled }}>N/A</span>;
                  return (
                    <a 
                      href={`https://www.youtube.com/channel/${channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: linkColor, textDecoration: 'none' }}
                    >
                      {channelId} ↗
                    </a>
                  );
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Links</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>FlightClub URL</div>
              <FunctionField
                render={(record: any) => {
                  const url = record?.flightclub_url;
                  if (!url) return <span style={{ color: textDisabled }}>N/A</span>;
                  return (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: linkColor, textDecoration: 'none' }}>
                      {url} ↗
                    </a>
                  );
                }}
              />
            </div>
          </div>
        </div>

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
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Arrays">
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Video URLs</h3>
          <FunctionField
            render={(record: any) => {
              const urls = record?.vid_urls || [];
              if (!urls || urls.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No video URLs available</div>;
              }
              return (
                <ArrayField source="vid_urls">
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

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Payloads</h3>
          <FunctionField
            render={(record: any) => {
              const payloads = record?.payloads || [];
              if (!payloads || payloads.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No payloads available</div>;
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
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Crew</h3>
          <FunctionField
            render={(record: any) => {
              const crew = record?.crew || [];
              if (!crew || crew.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No crew members available</div>;
              }
              return (
                <ArrayField source="crew">
                  <Datagrid bulkActionButtons={false}>
                    <FunctionField label="Role" render={(item: any) => {
                      const role = typeof item?.role === 'object' ? null : item?.role;
                      return role || 'N/A';
                    }} />
                    <FunctionField
                      label="Astronaut"
                      render={(item: any) => {
                        if (typeof item?.astronaut === 'object' && item?.astronaut) {
                          return item.astronaut.name || item.astronaut.full_name || 'N/A';
                        }
                        return 'N/A';
                      }}
                    />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', color: textPrimary }}>Hazards</h3>
          <FunctionField
            render={(record: any) => {
              const hazards = record?.hazards || [];
              if (!hazards || hazards.length === 0) {
                return <div style={{ padding: '1rem', backgroundColor: bgPaper, borderRadius: '4px', color: textDisabled }}>No hazards available</div>;
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
                    <FunctionField label="Type" render={(item: any) => {
                      const type = typeof item?.type === 'object' ? null : item?.type;
                      return type || 'N/A';
                    }} />
                  </Datagrid>
                </ArrayField>
              );
            }}
          />
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Program">
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
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Statistics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbital Launch Attempt Count</div>
            <FunctionField render={(record: any) => <span>{record?.orbital_launch_attempt_count ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Location Launch Attempt Count</div>
            <FunctionField render={(record: any) => <span>{record?.location_launch_attempt_count ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Pad Launch Attempt Count</div>
            <FunctionField render={(record: any) => <span>{record?.pad_launch_attempt_count ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Agency Launch Attempt Count</div>
            <FunctionField render={(record: any) => <span>{record?.agency_launch_attempt_count ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Orbital Launch Attempt Count (Year)</div>
            <FunctionField render={(record: any) => <span>{record?.orbital_launch_attempt_count_year ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Location Launch Attempt Count (Year)</div>
            <FunctionField render={(record: any) => <span>{record?.location_launch_attempt_count_year ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Pad Launch Attempt Count (Year)</div>
            <FunctionField render={(record: any) => <span>{record?.pad_launch_attempt_count_year ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Agency Launch Attempt Count (Year)</div>
            <FunctionField render={(record: any) => <span>{record?.agency_launch_attempt_count_year ?? 'N/A'}</span>} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: textSecondary, marginBottom: '0.25rem' }}>Pad Turnaround</div>
            <FunctionField render={(record: any) => <span>{record?.pad_turnaround || 'N/A'}</span>} />
          </div>
        </div>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Metadata">
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
      </TabbedShowLayout>
  </Show>
);
};

const LaunchTitle = () => {
  const record = useRecordContext();
  return record ? <span>{record.name || `Launch #${record.id}`}</span> : null;
};
