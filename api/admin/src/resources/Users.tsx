import { List, Create, Edit, Show, SimpleForm, TextInput, PasswordInput, BooleanInput, Datagrid, TextField, EmailField, BooleanField, FunctionField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const UserList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="username" />
      <EmailField source="email" />
      <TextField source="full_name" />
      <FunctionField
        source="roles"
        render={(record: any) => {
          if (!record.roles || !Array.isArray(record.roles)) return 'None';
          return record.roles.map((r: any) => typeof r === 'string' ? r : r.name).join(', ');
        }}
        label="Roles"
      />
      <BooleanField source="is_active" />
      <BooleanField source="email_verified" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const UserCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="users" />}>
    <SimpleForm>
      <TextInput source="username" required />
      <TextInput source="email" type="email" required />
      <PasswordInput source="password" required />
      <TextInput source="first_name" />
      <TextInput source="last_name" />
      <TextInput source="bio" multiline />
      <TextInput source="location" />
      <TextInput source="profile_image_url" label="Profile Image URL" />
      <BooleanInput source="is_active" defaultValue={true} />
      <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '8px' }}>
        Note: Users are created via registration. Roles can be assigned after creation.
      </p>
    </SimpleForm>
  </Create>
);

export const UserEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="users" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="username" required />
      <TextInput source="email" type="email" required />
      <TextInput source="first_name" />
      <TextInput source="last_name" />
      <TextInput source="bio" multiline />
      <TextInput source="location" />
      <TextInput source="profile_image_url" label="Profile Image URL" />
      <BooleanInput source="is_active" />
      <BooleanInput source="email_verified" />
      <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '8px' }}>
        Note: Roles must be assigned separately via the Roles resource.
      </p>
    </SimpleForm>
  </Edit>
);

export const UserShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="users" showActions />}>
    <TextField source="id" />
    <TextField source="username" />
    <EmailField source="email" />
    <TextField source="first_name" />
    <TextField source="last_name" />
    <TextField source="full_name" />
    <TextField source="bio" />
    <TextField source="location" />
    <TextField source="profile_image_url" label="Profile Image URL" />
    <BooleanField source="is_active" />
    <BooleanField source="email_verified" />
    <FunctionField
      source="roles"
      render={(record: any) => {
        if (!record.roles || !Array.isArray(record.roles)) return 'None';
        return record.roles.map((r: any) => typeof r === 'string' ? r : r.name).join(', ');
      }}
      label="Roles"
    />
    <TextField source="last_login" />
    <TextField source="created_at" />
  </Show>
);
