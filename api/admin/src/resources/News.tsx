import { List, Create, Edit, Show, SimpleForm, TextInput, ReferenceInput, SelectInput, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, ReferenceArrayInput, SelectArrayInput, BooleanInput, FunctionField, BooleanField } from 'react-admin';

const statusChoices = [
  { id: 'draft', name: 'Draft' },
  { id: 'published', name: 'Published' },
  { id: 'archived', name: 'Archived' },
];

export const ArticleList = (props: any) => (
  <List {...props}>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="title" />
      <FunctionField
        source="author_name"
        render={(record: any) => record.author_name || 'Unknown'}
      />
      <FunctionField
        source="category_name"
        render={(record: any) => record.category_name || 'Uncategorized'}
      />
      <FunctionField
        source="status"
        render={(record: any) => {
          const choice = statusChoices.find(c => c.id === record.status);
          return choice ? choice.name : record.status;
        }}
      />
      <DateField source="published_at" showTime />
      <TextField source="views_count" />
      <ShowButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ArticleCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="title" required />
      <TextInput source="subtitle" />
      <TextInput source="slug" />
      <ReferenceInput source="author_id" reference="authors">
        <SelectInput optionText="full_name" />
      </ReferenceInput>
      <ReferenceInput source="category_id" reference="categories">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="featured_image_url" label="Featured Image URL" />
      <TextInput source="hero_image_url" label="Hero Image URL" />
      <TextInput source="content" multiline rows={10} required />
      <TextInput source="excerpt" multiline rows={3} />
      <SelectInput source="status" choices={statusChoices} defaultValue="draft" />
      <BooleanInput source="is_featured" />
      <BooleanInput source="is_trending" />
      <ReferenceArrayInput source="tag_ids" reference="tags">
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
);

export const ArticleEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="title" required />
      <TextInput source="subtitle" />
      <TextInput source="slug" />
      <ReferenceInput source="author_id" reference="authors">
        <SelectInput optionText="full_name" />
      </ReferenceInput>
      <ReferenceInput source="category_id" reference="categories">
        <SelectInput optionText="name" />
      </ReferenceInput>
      <TextInput source="featured_image_url" label="Featured Image URL" />
      <TextInput source="hero_image_url" label="Hero Image URL" />
      <TextInput source="content" multiline rows={10} required />
      <TextInput source="excerpt" multiline rows={3} />
      <SelectInput source="status" choices={statusChoices} />
      <BooleanInput source="is_featured" />
      <BooleanInput source="is_trending" />
      <ReferenceArrayInput source="tag_ids" reference="tags">
        <SelectArrayInput optionText="name" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
);

export const ArticleShow = (props: any) => (
  <Show {...props}>
    <TextField source="id" />
    <TextField source="title" />
    <TextField source="subtitle" />
    <TextField source="slug" />
    <TextField source="author_name" label="Author" />
    <TextField source="category_name" label="Category" />
    <TextField source="featured_image_url" label="Featured Image URL" />
    <TextField source="hero_image_url" label="Hero Image URL" />
    <TextField source="content" />
    <TextField source="excerpt" />
    <TextField source="status" />
    <BooleanField source="is_featured" />
    <BooleanField source="is_trending" />
    <TextField source="views_count" />
    <DateField source="published_at" showTime />
    <DateField source="created_at" />
    <DateField source="updated_at" />
  </Show>
);
