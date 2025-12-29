import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const CategoryList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="slug" />
      <TextField source="description" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const CategoryCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="categories" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="slug" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const CategoryEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="categories" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="slug" />
      <TextInput source="description" multiline />
    </SimpleForm>
  </Edit>
);

export const CategoryShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="categories" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="slug" />
    <TextField source="description" />
    <TextField source="articles_count" label="Articles Count" />
    <TextField source="created_at" />
  </Show>
);
