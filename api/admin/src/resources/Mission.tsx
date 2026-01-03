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
  ShowButton,
  CreateButton,
  TopToolbar,
  useNotify,
  useRefresh,
  useRecordContext,
  TabbedForm,
  FormTab,
  SaveButton,
  Toolbar,
  useDataProvider,
  useGetOne,
  Loading,
  Error
} from 'react-admin';
import { Box, Typography, Paper, Divider, Grid, Card, CardContent, Button } from '@mui/material';
import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

// Mission Content List/Edit (singleton - always edit id=1)
export const MissionContentList = () => {
  return <MissionContentEdit />;
};

export const MissionContentEdit = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/mission/content`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        notify('Error loading mission content', { type: 'error' });
      }
    } catch (error) {
      notify('Error loading mission content', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/mission/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        notify('Mission content saved successfully!', { type: 'success' });
        await fetchContent();
        refresh();
      } else {
        const error = await response.json();
        notify(error.error || 'Failed to save', { type: 'error' });
      }
    } catch (error: any) {
      notify('Error saving: ' + error.message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><Loading /></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Edit Mission Page Content</Typography>
      <MissionContentForm initialValues={content} onSave={handleSave} saving={saving} />
    </Box>
  );
};

// Mission Content Form
const MissionContentForm = ({ initialValues, onSave, saving }: any) => {
  const [formData, setFormData] = useState(initialValues || {});

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  const handleSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <TabbedForm onSubmit={handleSubmit} defaultValues={formData}>
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
            <TextInput 
              source="hero_background_image_url" 
              label="Background Image URL" 
              fullWidth 
            />
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
            <TextInput 
              source="lander_image_url" 
              label="Lander Image URL" 
              fullWidth 
            />
          </FormTab>
        </TabbedForm>
        <Toolbar>
          <SaveButton label="Save Changes" disabled={saving} />
        </Toolbar>
      </Paper>
  );
};

// Mission Updates List
export const MissionUpdateList = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/mission/updates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUpdates(data);
      }
    } catch (error) {
      notify('Error loading updates', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const ListActions = () => (
    <TopToolbar>
      <CreateButton label="Add Update" />
    </TopToolbar>
  );

  if (loading) {
    return <Box sx={{ p: 3 }}><Loading /></Box>;
  }

  return (
    <List actions={<ListActions />} title="Mission Updates">
      <Datagrid rowClick="edit">
        <TextField source="id" />
        <TextField source="title" />
        <DateField source="date" />
        <TextField source="description" />
        <NumberInput source="display_order" />
        <EditButton />
        <DeleteButton mutationOptions={{ onSuccess: () => fetchUpdates() }} />
      </Datagrid>
    </List>
  );
};

// Mission Update Create
export const MissionUpdateCreate = () => {
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/mission/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        notify('Update created!', { type: 'success' });
        refresh();
      } else {
        notify('Failed to create', { type: 'error' });
      }
    } catch (error: any) {
      notify('Error: ' + error.message, { type: 'error' });
    }
  };

  return (
    <Create title="Create Mission Update">
      <SimpleForm onSubmit={handleSave}>
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
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  const handleSave = async (data: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/mission/updates/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        notify('Update saved!', { type: 'success' });
        refresh();
      } else {
        notify('Failed to save', { type: 'error' });
      }
    } catch (error: any) {
      notify('Error: ' + error.message, { type: 'error' });
    }
  };

  if (!record) {
    return <Loading />;
  }

  return (
    <Edit title="Edit Mission Update">
      <SimpleForm onSubmit={handleSave} defaultValues={record}>
        <TextInput source="title" fullWidth required />
        <TextInput source="date" label="Date (YYYY-MM-DD)" fullWidth />
        <TextInput source="description" fullWidth multiline rows={4} />
        <NumberInput source="display_order" label="Display Order" />
      </SimpleForm>
    </Edit>
  );
};

export const MissionContentShow = MissionContentEdit;
