import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';

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
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" required />
    </SimpleForm>
  </Create>
);

export const ProviderEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
    </SimpleForm>
  </Edit>
);

export const ProviderShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="name" />
  </Show>
);
