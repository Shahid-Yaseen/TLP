import { List, Create, Edit, Show, SimpleForm, TextInput, SelectInput, Datagrid, TextField, BooleanField, ShowButton, EditButton, DeleteButton, useRecordContext, ImageInput, ImageField } from 'react-admin';
import { Box, Card, CardContent, Typography, Avatar, Chip, Grid, Divider, Stack } from '@mui/material';
import { Person, Work, LocationOn, Description, CheckCircle, Cancel, CalendarToday, Image as ImageIcon } from '@mui/icons-material';
import { BackButtonActions } from '../components/BackButtonActions';

const categoryChoices = [
  { id: 'ADVISOR', name: 'Advisor' },
  { id: 'PRODUCTION', name: 'Production' },
  { id: 'JOURNALIST', name: 'Journalist' },
  { id: 'SPACE HISTORY WRITER', name: 'Space History Writer' },
  { id: 'ROCKETCHASER', name: 'Rocketchaser' },
  { id: 'MODERATOR', name: 'Moderator' },
];

export const CrewList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="full_name" />
      <TextField source="category" />
      <TextField source="title" />
      <TextField source="location" />
      <BooleanField source="is_active" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const CrewCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="crew" />}>
    <SimpleForm>
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <SelectInput source="category" choices={categoryChoices} />
      <TextInput source="title" />
      <TextInput source="location" />
      <TextInput source="bio" multiline />
      <ImageInput source="profile_image_url" label="Profile Image">
        <ImageField source="src" />
      </ImageInput>
      <SelectInput source="is_active" choices={[{ id: true, name: 'Active' }, { id: false, name: 'Inactive' }]} defaultValue={true} />
    </SimpleForm>
  </Create>
);

export const CrewEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="crew" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <SelectInput source="category" choices={categoryChoices} />
      <TextInput source="title" />
      <TextInput source="location" />
      <TextInput source="bio" multiline />
      <ImageInput source="profile_image_url" label="Profile Image">
        <ImageField source="src" />
      </ImageInput>
      <SelectInput source="is_active" choices={[{ id: true, name: 'Active' }, { id: false, name: 'Inactive' }]} />
    </SimpleForm>
  </Edit>
);

const CrewShowContent = () => {
  const record = useRecordContext();
  
  if (!record) return null;

  // Handle profile_image_url - could be string or object (from dataProvider transformation)
  const getImageUrl = () => {
    if (!record.profile_image_url) return null;
    if (typeof record.profile_image_url === 'string') return record.profile_image_url;
    if (typeof record.profile_image_url === 'object' && record.profile_image_url.src) {
      return record.profile_image_url.src;
    }
    return null;
  };

  const imageUrl = getImageUrl();

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

  return (
    <Box sx={{ p: 3 }}>
      {/* Hero Section */}
      <Card 
        elevation={3}
        sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={imageUrl || undefined}
                alt={record.full_name}
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}
              >
                {!imageUrl && (
                  <Person sx={{ fontSize: 60 }} />
                )}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                {record.full_name || 'Unknown'}
              </Typography>
              {record.title && (
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  <Work sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
                  {record.title}
                </Typography>
              )}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {record.category && (
                  <Chip
                    label={record.category}
                    sx={{
                      backgroundColor: getCategoryColor(record.category),
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 32
                    }}
                  />
                )}
                <Chip
                  icon={record.is_active ? <CheckCircle /> : <Cancel />}
                  label={record.is_active ? 'Active' : 'Inactive'}
                  color={record.is_active ? 'success' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Information Card */}
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1, color: 'primary.main' }} />
                Biography
              </Typography>
              {record.bio ? (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8,
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {record.bio}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No biography available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Details Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                {record.location && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {record.location}
                    </Typography>
                  </Box>
                )}

                {record.category && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Work sx={{ fontSize: 16, mr: 0.5 }} />
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {record.category}
                    </Typography>
                  </Box>
                )}

                {record.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                      Created At
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {new Date(record.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Box>
                )}

                {record.profile_image_url && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <ImageIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      Profile Image
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="a" 
                      href={record.profile_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      View Image
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export const CrewShow = (props: any) => (
  <Show {...props} title=" " actions={<BackButtonActions resource="crew" showActions />}>
    <CrewShowContent />
  </Show>
);
