import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const ProviderList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ProviderCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="providers" />}>
    <SimpleForm>
      <TextInput source="name" required />
    </SimpleForm>
  </Create>
);

export const ProviderEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="providers" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
    </SimpleForm>
  </Edit>
);

export const ProviderShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="providers" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
  </Show>
);
