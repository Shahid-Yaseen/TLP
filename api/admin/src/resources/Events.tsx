import { List, Create, Edit, Show, SimpleForm, TextInput, DateTimeInput, SelectInput, ReferenceInput, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, FunctionField } from 'react-admin';

const eventTypeChoices = [
  { id: 'launch', name: 'Launch' },
  { id: 'landing', name: 'Landing' },
  { id: 'conference', name: 'Conference' },
  { id: 'milestone', name: 'Milestone' },
];

const statusChoices = [
  { id: 'TBD', name: 'TBD' },
  { id: 'confirmed', name: 'Confirmed' },
  { id: 'cancelled', name: 'Cancelled' },
  { id: 'completed', name: 'Completed' },
  { id: 'never', name: 'Never' },
];

export const EventList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <FunctionField
        source="event_type"
        render={(record: any) => {
          const choice = eventTypeChoices.find(c => c.id === record.event_type);
          return choice ? choice.name : record.event_type;
        }}
      />
      <FunctionField
        source="status"
        render={(record: any) => {
          const choice = statusChoices.find(c => c.id === record.status);
          return choice ? choice.name : record.status;
        }}
      />
      <DateField source="event_date" showTime />
      <DateField source="end_date" showTime />
      <TextField source="location" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const EventCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" required />
      <SelectInput source="event_type" choices={eventTypeChoices} />
      <SelectInput source="status" choices={statusChoices} />
      <DateTimeInput source="event_date" />
      <DateTimeInput source="end_date" />
      <TextInput source="location" />
      <ReferenceInput source="related_launch_id" reference="launches">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="description" multiline />
    </SimpleForm>
  </Create>
);

export const EventEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <SelectInput source="event_type" choices={eventTypeChoices} />
      <SelectInput source="status" choices={statusChoices} />
      <DateTimeInput source="event_date" />
      <DateTimeInput source="end_date" />
      <TextInput source="location" />
      <ReferenceInput source="related_launch_id" reference="launches">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="description" multiline />
    </SimpleForm>
  </Edit>
);

export const EventShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="event_type" />
    <TextField source="status" />
    <DateField source="event_date" showTime />
    <DateField source="end_date" showTime />
    <TextField source="location" />
    <TextField source="description" />
    <TextField source="related_launch_id" label="Related Launch ID" />
    <DateField source="created_at" />
  </Show>
);
