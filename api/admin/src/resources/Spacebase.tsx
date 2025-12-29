import { List, Create, Edit, Show, SimpleForm, TextInput, DateInput, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, FunctionField, ArrayField } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

// ==================== ASTRONAUTS ====================

const astronautStatusChoices = [
  { id: 'active', name: 'Active' },
  { id: 'retired', name: 'Retired' },
  { id: 'deceased', name: 'Deceased' },
];

export const AstronautList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="full_name" />
      <TextField source="nationality" />
      <FunctionField
        source="status"
        render={(record: any) => {
          const choice = astronautStatusChoices.find(c => c.id === record.status);
          return choice ? choice.name : record.status;
        }}
      />
      <TextField source="agency_name" label="Agency" />
      <ShowButton />
    </Datagrid>
  </List>
);

export const AstronautShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="astronauts" showActions />}>
    <TextField source="id" />
    <TextField source="full_name" />
    <TextField source="first_name" />
    <TextField source="last_name" />
    <TextField source="astronaut_number" />
    <TextField source="nationality" />
    <TextField source="hometown" />
    <TextField source="gender" />
    <TextField source="age" />
    <DateField source="birth_date" />
    <TextField source="status" />
    <TextField source="type" />
    <TextField source="agency_name" label="Agency" />
    <TextField source="biography" />
    <TextField source="days_in_space" />
    <TextField source="missions_count" />
    <TextField source="spacewalks_count" />
    <DateField source="created_at" />
  </Show>
);

// ==================== AGENCIES ====================

export const AgencyList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="abbreviation" />
      <TextField source="country" />
      <DateField source="founded_date" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const AgencyCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="agencies" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="abbreviation" />
      <TextInput source="country" />
      <DateInput source="founded_date" />
      <TextInput source="description" multiline rows={5} />
      <TextInput source="logo_url" label="Logo URL" />
      <TextInput source="website_url" label="Website URL" />
      <TextInput source="headquarters_location" label="Headquarters Location" />
    </SimpleForm>
  </Create>
);

export const AgencyEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="agencies" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="abbreviation" />
      <TextInput source="country" />
      <DateInput source="founded_date" />
      <TextInput source="description" multiline rows={5} />
      <TextInput source="logo_url" label="Logo URL" />
      <TextInput source="website_url" label="Website URL" />
      <TextInput source="headquarters_location" label="Headquarters Location" />
    </SimpleForm>
  </Edit>
);

export const AgencyShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="agencies" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="abbreviation" />
    <TextField source="country" />
    <DateField source="founded_date" />
    <TextField source="description" />
    <TextField source="logo_url" label="Logo URL" />
    <TextField source="website_url" label="Website URL" />
    <TextField source="headquarters_location" label="Headquarters Location" />
    <DateField source="created_at" />
  </Show>
);

// ==================== ROCKETS ====================

export const RocketList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="provider_name" label="Provider" />
      <ShowButton />
    </Datagrid>
  </List>
);

export const RocketShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="rockets" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="provider_name" label="Provider" />
    <TextField source="spec" label="Specifications" />
    <ArrayField source="engines" label="Engines">
      <Datagrid>
        <TextField source="name" />
        <TextField source="stage_number" />
        <TextField source="engine_count" />
      </Datagrid>
    </ArrayField>
    <DateField source="created_at" />
  </Show>
);
