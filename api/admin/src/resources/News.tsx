import { List, Create, Edit, Show, Datagrid, TextField, DateField, ShowButton, EditButton, DeleteButton, FunctionField, TabbedShowLayout, TopToolbar, useRedirect, useListContext, CreateButton } from 'react-admin';
import { ArticleForm } from '../components/ArticleForm';
import { Box, Typography, Grid, Chip, Card, CardContent, CardMedia, CardActions, ButtonGroup, Button, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useState, useEffect } from 'react';
import { BackButtonActions } from '../components/BackButtonActions';

const statusChoices = [
  { id: 'draft', name: 'Draft' },
  { id: 'published', name: 'Published' },
  { id: 'archived', name: 'Archived' },
];

// Card View Component
const ArticleCardView = () => {
  const { data, isLoading } = useListContext();
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  const redirect = useRedirect();

  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const linkColor = theme?.palette?.primary?.main || '#1976d2';

  if (isLoading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  if (!data || data.length === 0) {
    return <Box sx={{ p: 3 }}>No articles found</Box>;
  }

  return (
    <Grid container spacing={3} sx={{ p: 2 }}>
      {data.map((record: any) => {
        const status = record?.status || 'draft';
        const statusChoice = statusChoices.find(c => c.id === status);
        const statusName = statusChoice ? statusChoice.name : status;

        const statusColors: any = {
          published: { bg: '#4caf50', color: '#fff' },
          draft: { bg: '#ff9800', color: '#fff' },
          archived: { bg: '#9e9e9e', color: '#fff' }
        };
        const colors = statusColors[status] || statusColors.draft;

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={record.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: bgCard,
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => redirect(`/articles/${record.id}/show`)}
            >
              {record?.hero_image_url && (
                <CardMedia
                  component="img"
                  height="200"
                  image={typeof record.hero_image_url === 'object' ? record.hero_image_url.src : record.hero_image_url}
                  alt={record.title || 'Article'}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: textPrimary,
                    fontSize: '1.1rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {record.title || 'Untitled Article'}
                </Typography>

                {record.subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      color: textSecondary,
                      fontStyle: 'italic',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {record.subtitle}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={statusName.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: colors.bg,
                      color: colors.color,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: '24px'
                    }}
                  />
                  {record?.is_featured && (
                    <Chip
                      label="FEATURED"
                      size="small"
                      sx={{
                        backgroundColor: linkColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                  {record?.is_trending && (
                    <Chip
                      label="TRENDING"
                      size="small"
                      sx={{
                        backgroundColor: '#f44336',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '24px'
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {record.author_name && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Author:</strong> {record.author_name}
                    </Typography>
                  )}
                  {record.category_name && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Category:</strong> {record.category_name}
                    </Typography>
                  )}
                  {record.published_at && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Published:</strong> {new Date(record.published_at).toLocaleString()}
                    </Typography>
                  )}
                  {record.views_count !== null && record.views_count !== undefined && (
                    <Typography variant="body2" sx={{ color: textSecondary, fontSize: '0.85rem' }}>
                      <strong>Views:</strong> {record.views_count.toLocaleString()}
                    </Typography>
                  )}
                </Box>

                {record.excerpt && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1.5,
                      color: textSecondary,
                      fontSize: '0.85rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: 'italic'
                    }}
                  >
                    {record.excerpt}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ p: 1.5, pt: 0, gap: 1 }} onClick={(e) => e.stopPropagation()}>
                <Button
                  size="small"
                  onClick={() => redirect(`/articles/${record.id}/show`)}
                  sx={{ color: linkColor }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  onClick={() => redirect(`/articles/${record.id}`)}
                  sx={{ color: linkColor }}
                >
                  Edit
                </Button>
                <DeleteButton record={record} />
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export const ArticleList = (props: any) => {
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');

  useEffect(() => {
    const saved = localStorage.getItem('articleListViewMode');
    if (saved === 'cards' || saved === 'list') {
      setViewMode(saved);
    }
  }, []);

  const handleViewChange = (mode: 'list' | 'cards') => {
    setViewMode(mode);
    localStorage.setItem('articleListViewMode', mode);
  };

  return (
    <List
      {...props}
      actions={
        <TopToolbar>
          <CreateButton />
          <ButtonGroup size="small" variant="outlined" sx={{ ml: 2 }}>
            <Button
              onClick={() => handleViewChange('list')}
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              startIcon={<ViewListIcon />}
            >
              List
            </Button>
            <Button
              onClick={() => handleViewChange('cards')}
              variant={viewMode === 'cards' ? 'contained' : 'outlined'}
              startIcon={<ViewModuleIcon />}
            >
              Cards
            </Button>
          </ButtonGroup>
        </TopToolbar>
      }
    >
      {viewMode === 'list' ? (
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
      ) : (
        <ArticleCardView />
      )}
    </List>
  );
};

export const ArticleCreate = (props: any) => (
  <Create {...props} actions={<BackButtonActions resource="articles" />}>
    <ArticleForm />
  </Create>
);

export const ArticleEdit = (props: any) => (
  <Edit {...props} actions={<BackButtonActions resource="articles" />}>
    <ArticleForm />
  </Edit>
);

const ArticleTitle = (props: any) => {
  const { record } = props;
  return record ? (
    <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
      {record.title || `Article #${record.id}`}
    </span>
  ) : null;
};

const ArticleShowActions = () => {
  return <BackButtonActions resource="articles" showActions />;
};

export const ArticleShow = (props: any) => {
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;

  // Theme-aware colors
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const textDisabled = isDark ? '#808080' : '#999';
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const bgPaper = isDark ? '#1e1e1e' : '#f8f9fa';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const linkColor = theme?.palette?.primary?.main || '#1976d2';

  return (
    <Show {...props} title={<ArticleTitle />} actions={<ArticleShowActions />}>
      <TabbedShowLayout>
        <TabbedShowLayout.Tab label="Overview">
          {/* Hero Section */}
          <FunctionField
            label=""
            render={(record: any) => (
              <Box sx={{ mb: 3 }}>
                {record?.hero_image_url && (
                  <Box sx={{
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2
                  }}>
                    <img
                      src={record.hero_image_url}
                      alt={record.title}
                      style={{
                        width: '100%',
                        maxHeight: '400px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  </Box>
                )}

                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    mb: 1,
                    fontWeight: 700,
                    color: textPrimary,
                    lineHeight: 1.2
                  }}
                >
                  {record?.title || 'Untitled Article'}
                </Typography>

                {record?.subtitle && (
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      mb: 2,
                      color: textSecondary,
                      fontWeight: 400,
                      fontStyle: 'italic'
                    }}
                  >
                    {record.subtitle}
                  </Typography>
                )}

                {/* Status and Meta Info */}
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 3,
                  alignItems: 'center'
                }}>
                  <FunctionField
                    render={(record: any) => {
                      const status = record?.status || 'draft';
                      const statusColors: any = {
                        published: { bg: '#4caf50', color: '#fff' },
                        draft: { bg: '#ff9800', color: '#fff' },
                        archived: { bg: '#9e9e9e', color: '#fff' }
                      };
                      const colors = statusColors[status] || statusColors.draft;
                      return (
                        <Chip
                          label={status.toUpperCase()}
                          sx={{
                            backgroundColor: colors.bg,
                            color: colors.color,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '28px'
                          }}
                        />
                      );
                    }}
                  />

                  {record?.is_featured && (
                    <Chip
                      label="FEATURED"
                      sx={{
                        backgroundColor: linkColor,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '28px'
                      }}
                    />
                  )}

                  {record?.is_trending && (
                    <Chip
                      label="TRENDING"
                      sx={{
                        backgroundColor: '#f44336',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: '28px'
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          />

          {/* Key Information Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}
                >
                  Author
                </Typography>
                <FunctionField
                  render={(record: any) => (
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {record?.author_name || 'Unknown'}
                    </Typography>
                  )}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}
                >
                  Category
                </Typography>
                <FunctionField
                  render={(record: any) => (
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 600,
                        color: textPrimary
                      }}
                    >
                      {record?.category_name || 'Uncategorized'}
                    </Typography>
                  )}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}
                >
                  Views
                </Typography>
                <FunctionField
                  render={(record: any) => (
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 600,
                        color: linkColor,
                        fontSize: '1.25rem'
                      }}
                    >
                      {record?.views_count || 0}
                    </Typography>
                  )}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  height: '100%'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.5px',
                    fontWeight: 600
                  }}
                >
                  Published
                </Typography>
                <DateField
                  source="published_at"
                  showTime
                  sx={{
                    mt: 0.5,
                    '& .RaDateField-root': {
                      fontWeight: 600,
                      color: textPrimary
                    }
                  }}
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Excerpt */}
          <FunctionField
            label="Excerpt"
            render={(record: any) => {
              if (!record?.excerpt) return null;
              return (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    backgroundColor: bgPaper,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    mb: 3
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: textPrimary,
                      lineHeight: 1.7,
                      fontStyle: 'italic',
                      fontSize: '1rem'
                    }}
                  >
                    {record.excerpt}
                  </Typography>
                </Paper>
              );
            }}
          />

          {/* Content */}
          <FunctionField
            label="Content"
            render={(record: any) => {
              if (!record?.content) return null;
              return (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: bgCard,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    mb: 3
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: textPrimary,
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.95rem'
                    }}
                  >
                    {record.content}
                  </Typography>
                </Paper>
              );
            }}
          />

          {/* Tags */}
          <FunctionField
            label="Tags"
            render={(record: any) => {
              if (!record?.tags || record.tags.length === 0) return null;
              return (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      color: textSecondary,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {record.tags.map((tag: any) => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        sx={{
                          backgroundColor: bgPaper,
                          color: textPrimary,
                          border: `1px solid ${borderColor}`,
                          fontWeight: 500
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            }}
          />
        </TabbedShowLayout.Tab>

        <TabbedShowLayout.Tab label="Media">
          <FunctionField
            render={(record: any) => (
              <Grid container spacing={2}>
                {record?.featured_image_url && (
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: bgCard,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 2
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          color: textSecondary,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Featured Image
                      </Typography>
                      <Box sx={{
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: 1
                      }}>
                        <img
                          src={typeof record.featured_image_url === 'object' ? record.featured_image_url.src : record.featured_image_url}
                          alt="Featured"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </Box>
                      <TextField
                        source="featured_image_url"
                        sx={{ mt: 1.5 }}
                      />
                    </Paper>
                  </Grid>
                )}

                {record?.hero_image_url && (
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: bgCard,
                        border: `1px solid ${borderColor}`,
                        borderRadius: 2
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          color: textSecondary,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        Hero Image
                      </Typography>
                      <Box sx={{
                        borderRadius: 1,
                        overflow: 'hidden',
                        boxShadow: 1
                      }}>
                        <img
                          src={typeof record.hero_image_url === 'object' ? record.hero_image_url.src : record.hero_image_url}
                          alt="Hero"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </Box>
                      <TextField
                        source="hero_image_url"
                        sx={{ mt: 1.5 }}
                      />
                    </Paper>
                  </Grid>
                )}

                {(!record?.featured_image_url && !record?.hero_image_url) && (
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        backgroundColor: bgPaper,
                        border: `1px dashed ${borderColor}`,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: textDisabled }}
                      >
                        No images available
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          />
        </TabbedShowLayout.Tab>

        <TabbedShowLayout.Tab label="Details">
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Article Information
                </Typography>

                <FunctionField
                  render={(record: any) => (
                    <Box>
                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Article ID
                        </Typography>
                        <Typography variant="body1" sx={{ color: textPrimary, fontWeight: 600 }}>
                          #{record?.id || 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Slug
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: linkColor,
                            fontFamily: 'monospace',
                            wordBreak: 'break-all'
                          }}
                        >
                          {record?.slug || 'N/A'}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <FunctionField
                            render={(record: any) => {
                              const status = record?.status || 'draft';
                              const statusColors: any = {
                                published: { bg: '#4caf50', color: '#fff' },
                                draft: { bg: '#ff9800', color: '#fff' },
                                archived: { bg: '#9e9e9e', color: '#fff' }
                              };
                              const colors = statusColors[status] || statusColors.draft;
                              return (
                                <Chip
                                  label={status.toUpperCase()}
                                  sx={{
                                    backgroundColor: colors.bg,
                                    color: colors.color,
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: '28px'
                                  }}
                                />
                              );
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Created At
                        </Typography>
                        <DateField
                          source="created_at"
                          showTime
                          sx={{
                            mt: 0.5,
                            '& .RaDateField-root': {
                              color: textPrimary,
                              fontWeight: 500
                            }
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Last Updated
                        </Typography>
                        <DateField
                          source="updated_at"
                          showTime
                          sx={{
                            mt: 0.5,
                            '& .RaDateField-root': {
                              color: textPrimary,
                              fontWeight: 500
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Flags & Settings
                </Typography>

                <FunctionField
                  render={(record: any) => (
                    <Box>
                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 1,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Featured
                        </Typography>
                        <Chip
                          label={record?.is_featured ? 'Yes' : 'No'}
                          sx={{
                            backgroundColor: record?.is_featured ? linkColor : bgPaper,
                            color: record?.is_featured ? '#fff' : textSecondary,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '28px'
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 1,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Trending
                        </Typography>
                        <Chip
                          label={record?.is_trending ? 'Yes' : 'No'}
                          sx={{
                            backgroundColor: record?.is_trending ? '#f44336' : bgPaper,
                            color: record?.is_trending ? '#fff' : textSecondary,
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: '28px'
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: `1px solid ${borderColor}` }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Views
                        </Typography>
                        <Typography variant="body1" sx={{ color: linkColor, fontWeight: 600, fontSize: '1.25rem' }}>
                          {record?.views_count || 0}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.5,
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                            fontWeight: 600
                          }}
                        >
                          Published Date
                        </Typography>
                        {record?.published_at ? (
                          <DateField
                            source="published_at"
                            showTime
                            sx={{
                              mt: 0.5,
                              '& .RaDateField-root': {
                                color: textPrimary,
                                fontWeight: 500
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: textDisabled, fontStyle: 'italic' }}>
                            Not published yet
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: bgCard,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 2
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    color: textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  Metadata
                </Typography>

                <FunctionField
                  render={(record: any) => {
                    if (!record?.metadata || Object.keys(record.metadata).length === 0) {
                      return (
                        <Typography variant="body2" sx={{ color: textDisabled, fontStyle: 'italic' }}>
                          No metadata available
                        </Typography>
                      );
                    }

                    return (
                      <Box>
                        {Object.entries(record.metadata).map(([key, value]: [string, any]) => (
                          <Box
                            key={key}
                            sx={{
                              mb: 2,
                              pb: 2,
                              borderBottom: `1px solid ${borderColor}`,
                              '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 }
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: textSecondary,
                                display: 'block',
                                mb: 0.5,
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                                letterSpacing: '0.5px',
                                fontWeight: 600
                              }}
                            >
                              {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: textPrimary,
                                fontFamily: typeof value === 'object' ? 'monospace' : 'inherit',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {typeof value === 'object'
                                ? JSON.stringify(value, null, 2)
                                : String(value)
                              }
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    );
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </TabbedShowLayout.Tab>
      </TabbedShowLayout>
    </Show>
  );
};
