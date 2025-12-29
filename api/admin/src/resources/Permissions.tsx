import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const PermissionList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="resource" />
      <TextField source="action" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const PermissionCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="permissions" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="resource" />
      <TextInput source="action" />
    </SimpleForm>
  </Create>
);

export const PermissionEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="permissions" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="resource" />
      <TextInput source="action" />
    </SimpleForm>
  </Edit>
);

export const PermissionShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="permissions" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="resource" />
    <TextField source="action" />
    <DateField source="created_at" />
  </Show>
);
