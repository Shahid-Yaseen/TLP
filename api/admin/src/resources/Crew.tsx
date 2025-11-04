import { List, Create, Edit, Show, SimpleForm, TextInput, SelectInput, Datagrid, TextField, BooleanField, ShowButton, EditButton, DeleteButton, DateField } from 'react-admin';

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
  <Create {...props}>
    <SimpleForm>
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <SelectInput source="category" choices={categoryChoices} />
      <TextInput source="title" />
      <TextInput source="location" />
      <TextInput source="bio" multiline />
      <TextInput source="profile_image_url" label="Profile Image URL" />
      <SelectInput source="is_active" choices={[{ id: true, name: 'Active' }, { id: false, name: 'Inactive' }]} defaultValue={true} />
    </SimpleForm>
  </Create>
);

export const CrewEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <SelectInput source="category" choices={categoryChoices} />
      <TextInput source="title" />
      <TextInput source="location" />
      <TextInput source="bio" multiline />
      <TextInput source="profile_image_url" label="Profile Image URL" />
      <SelectInput source="is_active" choices={[{ id: true, name: 'Active' }, { id: false, name: 'Inactive' }]} />
    </SimpleForm>
  </Edit>
);

export const CrewShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="full_name" />
    <TextField source="category" />
    <TextField source="title" />
    <TextField source="location" />
    <TextField source="bio" />
    <TextField source="profile_image_url" label="Profile Image URL" />
    <BooleanField source="is_active" />
    <DateField source="created_at" />
  </Show>
);
