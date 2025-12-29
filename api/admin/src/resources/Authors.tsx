import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton, EmailField, useRecordContext } from 'react-admin';
import { Box, Typography, Avatar, Link } from '@mui/material';
import { BackButtonActions } from '../components/BackButtonActions';

export const AuthorList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="full_name" />
      <EmailField source="email" />
      <TextField source="title" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const AuthorCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="authors" />}>
    <SimpleForm>
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <TextInput source="email" type="email" />
      <TextInput source="title" />
      <TextInput source="bio" multiline rows={4} />
      <TextInput source="book_info" multiline rows={3} label="Book Information" helperText="e.g., He doesn't have a book yet but is working on the Astro Guide: An UnOfficial Guide To The America Space Coast" />
      <TextInput source="profile_image_url" label="Profile Image URL" />
    </SimpleForm>
  </Create>
);

export const AuthorEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="authors" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <TextInput source="email" type="email" />
      <TextInput source="title" />
      <TextInput source="bio" multiline rows={4} />
      <TextInput source="book_info" multiline rows={3} label="Book Information" helperText="e.g., He doesn't have a book yet but is working on the Astro Guide: An UnOfficial Guide To The America Space Coast" />
      <TextInput source="profile_image_url" label="Profile Image URL" />
    </SimpleForm>
  </Edit>
);

const AuthorShowContent = () => {
  const record = useRecordContext();
  
  if (!record) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#000000',
        borderTop: '4px solid #8B1A1A',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
      }}
    >
      {/* Profile Picture */}
      <Avatar
        src={record.profile_image_url}
        alt={record.full_name}
        sx={{
          width: 120,
          height: 120,
          border: '4px solid #8B1A1A',
          flexShrink: 0,
        }}
      >
        {record.full_name?.charAt(0) || 'A'}
      </Avatar>

      {/* Text Content */}
      <Box sx={{ flex: 1 }}>
        {/* Name */}
        <Typography
          sx={{
            color: '#8B1A1A',
            fontSize: '24px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontFamily: 'Nasalization, sans-serif',
            marginBottom: '8px',
          }}
        >
          {record.full_name || 'AUTHOR NAME'}
        </Typography>

        {/* Title */}
        <Typography
          sx={{
            color: '#ffffff',
            fontSize: '16px',
            textTransform: 'uppercase',
            fontFamily: 'Nasalization, sans-serif',
            marginBottom: '16px',
          }}
        >
          {record.title || 'TITLE'}
        </Typography>

        {/* Biography */}
        {record.bio && (
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '14px',
              fontStyle: 'italic',
              marginBottom: '12px',
              lineHeight: 1.6,
            }}
          >
            {record.bio}
          </Typography>
        )}

        {/* Book Information */}
        {record.book_info && (
          <Typography
            sx={{
              color: '#ffffff',
              fontSize: '14px',
              fontStyle: 'italic',
              marginBottom: '16px',
              lineHeight: 1.6,
            }}
          >
            {record.book_info}
          </Typography>
        )}

        {/* More by Link */}
        <Link
          href={`#/articles?filter=${encodeURIComponent(JSON.stringify({ author_id: record.id }))}`}
          sx={{
            color: '#8B1A1A',
            fontSize: '14px',
            fontWeight: 'semibold',
            textDecoration: 'none',
            '&:hover': {
              color: '#A02A2A',
              textDecoration: 'underline',
            },
          }}
        >
          More by {record.first_name || record.full_name?.split(' ')[0] || 'Author'} {record.last_name || record.full_name?.split(' ').slice(1).join(' ') || ''}
        </Link>
      </Box>
    </Box>
  );
};

export const AuthorShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="authors" showActions />}>
    <AuthorShowContent />
    <Box sx={{ padding: '24px', backgroundColor: '#1a1a1a' }}>
      <TextField source="id" sx={{ color: '#ffffff' }} />
      <EmailField source="email" sx={{ color: '#ffffff' }} />
      <TextField source="articles_count" label="Articles Count" sx={{ color: '#ffffff' }} />
      <TextField source="created_at" sx={{ color: '#ffffff' }} />
    </Box>
  </Show>
);
