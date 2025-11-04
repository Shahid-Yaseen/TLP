import { List, Create, Edit, Show, SimpleForm, TextInput, DateTimeInput, ReferenceInput, SelectInput, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, BooleanInput, FunctionField, BooleanField } from 'react-admin';

const outcomeChoices = [
  { id: 'success', name: 'Success' },
  { id: 'failure', name: 'Failure' },
  { id: 'partial', name: 'Partial' },
  { id: 'TBD', name: 'TBD' },
];

export const LaunchList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="provider" />
      <TextField source="rocket" />
      <TextField source="site" />
      <DateField source="launch_date" showTime />
      <FunctionField
        source="outcome"
        render={(record: any) => {
          const choice = outcomeChoices.find(c => c.id === record.outcome);
          return choice ? choice.name : record.outcome || 'TBD';
        }}
      />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const LaunchCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" required />
      <DateTimeInput source="launch_date" required />
      <ReferenceInput source="provider_id" reference="providers">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="rocket_id" reference="rockets">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="site_id" reference="launch_sites">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="orbit_id" reference="orbits">
        <SelectInput optionText="code" />
      </ReferenceInput>
      <SelectInput source="outcome" choices={outcomeChoices} defaultValue="TBD" />
      <TextInput source="mission_description" multiline rows={5} />
      <TextInput source="details" multiline rows={5} />
      <TextInput source="youtube_video_id" label="YouTube Video ID" />
      <TextInput source="youtube_channel_id" label="YouTube Channel ID" />
      <DateTimeInput source="launch_window_open" label="Launch Window Open" />
      <DateTimeInput source="launch_window_close" label="Launch Window Close" />
      <BooleanInput source="is_featured" />
    </SimpleForm>
  </Create>
);

export const LaunchEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <DateTimeInput source="launch_date" required />
      <ReferenceInput source="provider_id" reference="providers">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="rocket_id" reference="rockets">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="site_id" reference="launch_sites">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <ReferenceInput source="orbit_id" reference="orbits">
        <SelectInput optionText="code" />
      </ReferenceInput>
      <SelectInput source="outcome" choices={outcomeChoices} />
      <TextInput source="mission_description" multiline rows={5} />
      <TextInput source="details" multiline rows={5} />
      <TextInput source="youtube_video_id" label="YouTube Video ID" />
      <TextInput source="youtube_channel_id" label="YouTube Channel ID" />
      <DateTimeInput source="launch_window_open" label="Launch Window Open" />
      <DateTimeInput source="launch_window_close" label="Launch Window Close" />
      <BooleanInput source="is_featured" />
    </SimpleForm>
  </Edit>
);

export const LaunchShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="name" />
    <DateField source="launch_date" showTime />
    <TextField source="provider" />
    <TextField source="rocket" />
    <TextField source="site" />
    <TextField source="orbit" />
    <TextField source="outcome" />
    <TextField source="mission_description" />
    <TextField source="details" />
    <TextField source="youtube_video_id" label="YouTube Video ID" />
    <TextField source="youtube_channel_id" label="YouTube Channel ID" />
    <DateField source="launch_window_open" showTime />
    <DateField source="launch_window_close" showTime />
    <BooleanField source="is_featured" />
    <DateField source="created_at" />
  </Show>
);
