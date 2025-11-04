import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';

export const LaunchSiteList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="location" />
      <TextField source="country" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const LaunchSiteCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="location" />
      <TextInput source="country" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const LaunchSiteEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="location" />
      <TextInput source="country" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Edit>
);

export const LaunchSiteShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="location" />
    <TextField source="country" />
    <TextField source="description" />
  </Show>
);
