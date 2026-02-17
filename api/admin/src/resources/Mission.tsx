import {
  List,
  Edit,
  Show,
  Create,
  SimpleForm,
  TextInput,
  Datagrid,
  TextField,
  DateField,
  NumberInput,
  EditButton,
  DeleteButton,
  CreateButton,
  TopToolbar,
  TabbedForm,
  FormTab,
  useGetOne,
  Loading,
  ImageInput,
  ImageField,
  SimpleShowLayout,
  FunctionField
} from 'react-admin';
import { Box, Typography, Divider, Grid, Alert } from '@mui/material';

// Mission Content List/Edit (singleton - always edit id=1)
export const MissionContentList = () => {
  return <MissionContentEdit />;
};

export const MissionContentEdit = () => {
  const { isLoading, error } = useGetOne('mission_content', { id: 1 });

  if (isLoading) {
    return <Box sx={{ p: 3 }}><Loading /></Box>;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error.message || 'Failed to load mission content'}
        </Alert>
      </Box>
    );
  }

  return (
    <Edit resource="mission_content" id={1} title="Edit Mission Page Content">
      <TabbedForm>
        <FormTab label="Hero Section">
          <TextInput
            source="hero_title"
            label="Hero Title"
            fullWidth
          />
          <TextInput
            source="hero_subtitle"
            label="Hero Subtitle"
            fullWidth
          />
          <TextInput
            source="hero_mission_statement"
            label="Mission Statement"
            fullWidth
            multiline
            rows={3}
          />
          <Box sx={{ mb: 2 }}>
            <ImageInput source="hero_background_image_url" label="Background Image">
              <ImageField source="src" title="title" />
            </ImageInput>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              Main background image for the mission hero section. Upload an image or enter a URL below.
            </Typography>
            <TextInput
              source="hero_background_image_url"
              label="Background Image URL (optional)"
              fullWidth
              sx={{ mt: 1 }}
              helperText="Or enter a direct image URL instead of uploading"
              format={(v: any) => (v && typeof v === 'object' ? v.src : v)}
              parse={(v: any) => v}
            />
          </Box>
        </FormTab>

        <FormTab label="CTA Buttons">
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Button 1</Typography>
              <TextInput
                source="button1_text"
                label="Button Text"
                fullWidth
              />
              <TextInput
                source="button1_status_text"
                label="Status Text"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Button 2</Typography>
              <TextInput
                source="button2_text"
                label="Button Text"
                fullWidth
              />
              <TextInput
                source="button2_status_text"
                label="Status Text"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Button 3</Typography>
              <TextInput
                source="button3_text"
                label="Button Text"
                fullWidth
              />
              <TextInput
                source="button3_status_text"
                label="Status Text"
                fullWidth
              />
            </Grid>
          </Grid>
        </FormTab>

        <FormTab label="Mission Overview">
          <TextInput
            source="lift_off_time"
            label="Lift Off Time"
            fullWidth
          />
          <TextInput
            source="launch_facility"
            label="Launch Facility"
            fullWidth
          />
          <TextInput
            source="launch_pad"
            label="Launch Pad"
            fullWidth
          />
          <TextInput
            source="launch_provider"
            label="Launch Provider"
            fullWidth
          />
          <TextInput
            source="rocket"
            label="Rocket"
            fullWidth
          />
        </FormTab>

        <FormTab label="Lander Overview">
          <TextInput
            source="lander_provider"
            label="Lander Provider"
            fullWidth
          />
          <TextInput
            source="lunar_lander"
            label="Lunar Lander"
            fullWidth
          />
          <Box sx={{ mb: 2 }}>
            <ImageInput source="lander_image_url" label="Lander Image">
              <ImageField source="src" title="title" />
            </ImageInput>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              Image of the lunar lander. Upload an image or enter a URL below.
            </Typography>
            <TextInput
              source="lander_image_url"
              label="Lander Image URL (optional)"
              fullWidth
              sx={{ mt: 1 }}
              helperText="Or enter a direct image URL instead of uploading"
              format={(v: any) => (v && typeof v === 'object' ? v.src : v)}
              parse={(v: any) => v}
            />
          </Box>
        </FormTab>
      </TabbedForm>
    </Edit>
  );
};

// Mission Updates List
export const MissionUpdateList = () => {
  const ListActions = () => (
    <TopToolbar>
      <CreateButton label="Add Update" />
    </TopToolbar>
  );

  return (
    <List resource="mission_updates" actions={<ListActions />} title="Mission Updates">
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="title" />
        <DateField source="date" />
        <TextField source="description" />
        <TextField source="display_order" />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

// Mission Update Create
export const MissionUpdateCreate = () => {
  return (
    <Create resource="mission_updates" title="Create Mission Update">
      <SimpleForm>
        <TextInput source="title" fullWidth required />
        <TextInput source="date" label="Date (YYYY-MM-DD)" fullWidth />
        <TextInput source="description" fullWidth multiline rows={4} />
        <NumberInput source="display_order" label="Display Order" />
      </SimpleForm>
    </Create>
  );
};

// Mission Update Edit
export const MissionUpdateEdit = () => {
  return (
    <Edit resource="mission_updates" title="Edit Mission Update">
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="title" fullWidth required />
        <TextInput source="date" label="Date (YYYY-MM-DD)" fullWidth />
        <TextInput source="description" fullWidth multiline rows={4} />
        <NumberInput source="display_order" label="Display Order" />
      </SimpleForm>
    </Edit>
  );
};

// Mission Content Show
export const MissionContentShow = () => {
  return (
    <Show resource="mission_content" id={1} title="Mission Page Content">
      <SimpleShowLayout>
        <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>Hero Section</Typography>
        <TextField source="hero_title" label="Hero Title" />
        <TextField source="hero_subtitle" label="Hero Subtitle" />
        <TextField source="hero_mission_statement" label="Mission Statement" />
        <FunctionField
          label="Background Image"
          render={(record: any) => {
            const src = typeof record.hero_background_image_url === 'object' ? record.hero_background_image_url?.src : record.hero_background_image_url;
            return src ? (
              <Box sx={{ mt: 1, mb: 1, maxWidth: '500px', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <img src={src} alt="Hero Background" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </Box>
            ) : <Typography variant="body2" color="textSecondary">No background image</Typography>;
          }}
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>CTA Buttons</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Button 1</Typography>
            <TextField source="button1_text" label="Button Text" />
            <TextField source="button1_status_text" label="Status Text" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Button 2</Typography>
            <TextField source="button2_text" label="Button Text" />
            <TextField source="button2_status_text" label="Status Text" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>Button 3</Typography>
            <TextField source="button3_text" label="Button Text" />
            <TextField source="button3_status_text" label="Status Text" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>Mission Overview</Typography>
        <TextField source="lift_off_time" label="Lift Off Time" />
        <TextField source="launch_facility" label="Launch Facility" />
        <TextField source="launch_pad" label="Launch Pad" />
        <TextField source="launch_provider" label="Launch Provider" />
        <TextField source="rocket" label="Rocket" />

        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" gutterBottom>Lander Overview</Typography>
        <TextField source="lander_provider" label="Lander Provider" />
        <TextField source="lunar_lander" label="Lunar Lander" />
        <FunctionField
          label="Lander Image"
          render={(record: any) => {
            const src = typeof record.lander_image_url === 'object' ? record.lander_image_url?.src : record.lander_image_url;
            return src ? (
              <Box sx={{ mt: 1, mb: 1, maxWidth: '500px', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                <img src={src} alt="Lander" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </Box>
            ) : <Typography variant="body2" color="textSecondary">No lander image</Typography>;
          }}
        />
      </SimpleShowLayout>
    </Show>
  );
};
