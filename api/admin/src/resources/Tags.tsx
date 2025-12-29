import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const TagList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const TagCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="tags" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="slug" />
    </SimpleForm>
  </Create>
);

export const TagEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="tags" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="slug" />
    </SimpleForm>
  </Edit>
);

export const TagShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="tags" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="slug" />
    <TextField source="created_at" />
  </Show>
);
