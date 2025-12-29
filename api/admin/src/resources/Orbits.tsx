import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const OrbitList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="code" />
      <TextField source="name" />
      <TextField source="description" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const OrbitCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="orbits" />}>
    <SimpleForm>
      <TextInput source="code" required />
      <TextInput source="name" required />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const OrbitEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="orbits" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="code" required />
      <TextInput source="name" required />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Edit>
);

export const OrbitShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="orbits" showActions />}>
    <TextField source="id" />
    <TextField source="code" />
    <TextField source="name" />
    <TextField source="description" />
  </Show>
);
