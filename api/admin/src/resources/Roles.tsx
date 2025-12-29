import { List, Create, Edit, Show, SimpleForm, TextInput, ReferenceArrayInput, SelectArrayInput, Datagrid, TextField, ArrayField, FunctionField, ShowButton, EditButton, DeleteButton } from 'react-admin';
import { BackButtonActions } from '../components/BackButtonActions';

export const RoleList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <TextField source="description" />
      <FunctionField
        source="permissions"
        render={(record: any) => {
          if (!record.permissions || !Array.isArray(record.permissions)) return '0';
          return record.permissions.length;
        }}
        label="Permissions Count"
      />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const RoleCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="roles" />}>
    <SimpleForm>
      <TextInput source="name" required />
      <TextInput source="description" multiline />
      <ReferenceArrayInput source="permission_ids" reference="permissions">
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
);

export const RoleEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="roles" />}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="name" required />
      <TextInput source="description" multiline />
      <ReferenceArrayInput source="permission_ids" reference="permissions">
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
);

export const RoleShow = (props: any) => (
  <Show {...props} actions={<BackButtonActions resource="roles" showActions />}>
    <TextField source="id" />
    <TextField source="name" />
    <TextField source="description" />
    <ArrayField source="permissions">
      <Datagrid>
        <TextField source="name" />
        <TextField source="resource" />
        <TextField source="action" />
      </Datagrid>
    </ArrayField>
  </Show>
);
