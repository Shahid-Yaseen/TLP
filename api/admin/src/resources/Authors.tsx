import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton, EmailField } from 'react-admin';

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
  <Create {...props}>
    <SimpleForm>
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <TextInput source="email" type="email" />
      <TextInput source="title" />
      <TextInput source="bio" multiline />
      <TextInput source="profile_image_url" label="Profile Image URL" />
    </SimpleForm>
  </Create>
);

export const AuthorEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="first_name" required />
      <TextInput source="last_name" required />
      <TextInput source="full_name" required />
      <TextInput source="email" type="email" />
      <TextInput source="title" />
      <TextInput source="bio" multiline />
      <TextInput source="profile_image_url" label="Profile Image URL" />
    </SimpleForm>
  </Edit>
);

export const AuthorShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="full_name" />
    <EmailField source="email" />
    <TextField source="title" />
    <TextField source="bio" />
    <TextField source="profile_image_url" label="Profile Image URL" />
    <TextField source="articles_count" label="Articles Count" />
    <TextField source="created_at" />
  </Show>
);
