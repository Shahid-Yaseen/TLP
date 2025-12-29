import { List, Create, Edit, Show, SimpleForm, TextInput, Datagrid, TextField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const CountryList = (props: any) => (
  <List {...props} perPage={50}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="alpha_2_code" label="Code (2)" />
      <TextField source="alpha_3_code" label="Code (3)" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const CountryCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="countries" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="alpha_2_code" label="ISO 3166-1 Alpha-2 Code" />
      <TextInput source="alpha_3_code" label="ISO 3166-1 Alpha-3 Code" />
    </SimpleForm>
  </Create>
);

export const CountryEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="countries" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="alpha_2_code" label="ISO 3166-1 Alpha-2 Code" />
      <TextInput source="alpha_3_code" label="ISO 3166-1 Alpha-3 Code" />
    </SimpleForm>
  </Edit>
);

export const CountryShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="countries" showActions />}>
    <SimpleForm>
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="alpha_2_code" label="ISO 3166-1 Alpha-2 Code" />
      <TextField source="alpha_3_code" label="ISO 3166-1 Alpha-3 Code" />
    </SimpleForm>
  </Show>
);

