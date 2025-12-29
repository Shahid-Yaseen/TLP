import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

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
  <Create {...props} actions={<BackButtonActions resource="launch_sites" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="location" />
      <TextInput source="country" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const LaunchSiteEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="launch_sites" />}>
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
  <Show {...props} actions={<BackButtonActions resource="launch_sites" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="location" />
    <TextField source="country" />
    <TextField source="description" />
  </Show>
);
