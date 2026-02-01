import React, { useState } from 'react';
import {
  SimpleForm,
  TextInput,
  ReferenceInput,
  SelectInput,
  ReferenceArrayInput,
  SelectArrayInput,
  SaveButton,
  Toolbar,
  BooleanInput,
  ImageInput,
  ImageField,
} from 'react-admin';
import { useFormContext } from 'react-hook-form';
import { Box, Grid, Typography, Switch, FormControlLabel, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const CustomToolbar = (props: any) => (
  <Toolbar {...props} sx={{ display: 'none' }}>
    <SaveButton />
  </Toolbar>
);

const ArticleFormContent = () => {
  const { watch, setValue } = useFormContext();
  const theme = useTheme();
  const isDark = theme?.palette?.mode === 'dark' || false;
  
  // Theme-aware colors
  const textPrimary = isDark ? '#e0e0e0' : '#1a1a1a';
  const textSecondary = isDark ? '#b0b0b0' : '#666';
  const bgCard = isDark ? '#2a2a2a' : '#ffffff';
  const bgPaper = isDark ? '#1e1e1e' : '#f8f9fa';
  const borderColor = isDark ? '#404040' : '#e0e0e0';
  const linkColor = theme?.palette?.primary?.main || '#1976d2';
  const textDisabled = isDark ? '#808080' : '#999';
  
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const heroImageUrl = watch('hero_image_url');
  const featuredImageUrl = watch('featured_image_url');
  const youtubeUrl = watch('video_youtube_url');
  const isBreaking = watch('is_breaking') || false;
  const isDeveloping = watch('is_developing') || false;
  const isFeatured = watch('is_featured') || false;
  const isTrending = watch('is_trending') || false;
  const isInterview = watch('is_interview') || false;
  const isTopStory = watch('is_top_story') || false;
  const status = watch('status');
  const isPublished = status === 'published';

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
        // In a real implementation, you'd upload this to a server
        // For now, we'll just set a placeholder URL
        setValue('video_url', URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract YouTube video ID from URL for preview
  const getYouTubeVideoId = (url: string | undefined) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const youtubeVideoId = getYouTubeVideoId(youtubeUrl);

  return (
    <Box sx={{ p: 3 }}>
      {/* Image Upload Areas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <ImageInput source="hero_image_url" label="Hero Image">
            <ImageField source="src" title="title" />
          </ImageInput>
          <Typography variant="caption" sx={{ color: textSecondary, mt: 1, display: 'block' }}>
            Main image displayed at the top of the article. Upload an image or enter a URL below.
          </Typography>
          <TextInput
            source="hero_image_url"
            label="Hero Image URL (optional)"
            fullWidth
            sx={{ mt: 1 }}
            helperText="Or enter a direct image URL instead of uploading"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ImageInput source="featured_image_url" label="Featured Image">
            <ImageField source="src" title="title" />
          </ImageInput>
          <Typography variant="caption" sx={{ color: textSecondary, mt: 1, display: 'block' }}>
            Thumbnail image for article listings. Upload an image or enter a URL below.
          </Typography>
          <TextInput
            source="featured_image_url"
            label="Featured Image URL (optional)"
            fullWidth
            sx={{ mt: 1 }}
            helperText="Or enter a direct image URL instead of uploading"
          />
        </Grid>
      </Grid>

      {/* Author */}
      <Box sx={{ mb: 3 }}>
        <ReferenceInput source="author_id" reference="authors" allowEmpty>
          <SelectInput
            optionText="full_name"
            label="Author"
            helperText="Select the article author/journalist"
          />
        </ReferenceInput>
      </Box>

      {/* Title and Subtitle */}
      <Box sx={{ mb: 2 }}>
        <TextInput
          source="title"
          label="Title"
          fullWidth
          required
          sx={{
            '& .MuiInputBase-root': {
              fontSize: '1.5rem',
              fontWeight: 600,
            },
          }}
        />
      </Box>
      <Box sx={{ mb: 3 }}>
        <TextInput
          source="subtitle"
          label="Subtitle"
          fullWidth
          helperText="Optional subtitle or tagline"
        />
      </Box>

      {/* Metadata Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextInput
            source="slug"
            label="Slug"
            fullWidth
          />
          <TextInput
            source="excerpt"
            label="Excerpt"
            multiline
            rows={3}
            fullWidth
            sx={{ mt: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReferenceInput source="category_id" reference="categories" allowEmpty>
            <SelectInput
              optionText="name"
              label="Category"
              helperText="Select category: NEWS, LAUNCH, IN SPACE, TECHNOLOGY, MILITARY, or FINANCE"
            />
          </ReferenceInput>
          <ReferenceInput source="country_id" reference="countries" allowEmpty>
            <SelectInput
              optionText={(record) => record ? `${record.name} (${record.alpha_2_code || ''})` : ''}
              label="Country"
              sx={{ mt: 2 }}
              helperText="Select country for country-based article filtering"
            />
          </ReferenceInput>
          <TextInput
            source="sub_category"
            label="Sub Category"
            fullWidth
            sx={{ mt: 2 }}
            helperText="Optional sub-category for further classification"
          />
          <ReferenceArrayInput source="tag_ids" reference="tags">
            <SelectArrayInput
              optionText="name"
              label="Tags"
              sx={{ mt: 2 }}
              helperText="Add tags like SPACEX, ARTEMIS, NASA, etc."
            />
          </ReferenceArrayInput>
        </Grid>
      </Grid>

      {/* Status and Visibility Controls */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          border: `1px solid ${borderColor}`,
          backgroundColor: bgCard,
          borderRadius: 2,
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
            letterSpacing: '0.5px',
          }}
        >
          Article Settings
        </Typography>
        
        <Grid container spacing={2}>
          {/* Left Column - Content Flags */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
              }}
            >
              Content Flags
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isBreaking}
                onChange={(e) => setValue('is_breaking', e.target.checked)}
              />
            }
            label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Breaking News
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={isDeveloping}
                onChange={(e) => setValue('is_developing', e.target.checked)}
              />
            }
            label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Developing Story
              </Typography>
            }
          />
        </Box>
          </Grid>

          {/* Right Column - Visibility Settings */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
              }}
            >
              Visibility & Promotion
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isFeatured}
                    onChange={(e) => setValue('is_featured', e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Featured Article
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isTrending}
                    onChange={(e) => setValue('is_trending', e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Trending
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isInterview}
                    onChange={(e) => setValue('is_interview', e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Interview Article
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isTopStory}
                    onChange={(e) => setValue('is_top_story', e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Top Story
                  </Typography>
                }
              />
          <FormControlLabel
            control={
              <Switch
                checked={isPublished}
                onChange={(e) => {
                  const newStatus = e.target.checked ? 'published' : 'draft';
                  setValue('status', newStatus, { shouldDirty: true, shouldTouch: true });
                }}
              />
            }
            label={
                  <Typography sx={{ color: textPrimary, fontSize: '0.875rem', fontWeight: 500 }}>
                    Published
              </Typography>
            }
          />
            </Box>
          </Grid>
        </Grid>

        {/* Hidden fields for form submission */}
          <Box sx={{ display: 'none' }}>
            <SelectInput
              source="status"
              choices={[
                { id: 'draft', name: 'Draft' },
                { id: 'published', name: 'Published' },
                { id: 'archived', name: 'Archived' },
              ]}
              defaultValue="draft"
            />
          <BooleanInput source="is_breaking" />
          <BooleanInput source="is_developing" />
            <BooleanInput source="is_featured" />
            <BooleanInput source="is_trending" />
          <BooleanInput source="is_interview" />
          <BooleanInput source="is_top_story" />
        </Box>
      </Paper>

      {/* Content Sections */}
      <Grid container spacing={2}>
        {/* Left Column - Summary and Main Story */}
        <Grid item xs={12} md={8}>
          {/* Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Summary
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${borderColor}`,
                backgroundColor: bgCard,
                p: 2,
                minHeight: '150px',
                position: 'relative',
                borderRadius: 2,
              }}
            >
              <TextInput
                source="summary"
                multiline
                rows={4}
                fullWidth
                placeholder="Enter summary..."
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                }}
              />
            </Paper>
          </Box>

          {/* Main Story */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Main Story
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${borderColor}`,
                backgroundColor: bgCard,
                p: 2,
                minHeight: '400px',
                borderRadius: 2,
              }}
            >
              <TextInput
                source="content"
                multiline
                rows={20}
                fullWidth
                required
                placeholder="Enter article content..."
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                }}
              />
            </Paper>
          </Box>
        </Grid>

        {/* Right Column - Poll and Related Launch */}
        <Grid item xs={12} md={4}>
          {/* Poll */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Poll
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${borderColor}`,
                backgroundColor: bgCard,
                p: 2,
                minHeight: '200px',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                Place to add a poll question and answers see results
              </Typography>
            </Paper>
          </Box>

          {/* Related Launch */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1.5,
                color: textSecondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              Related Launch
            </Typography>
            <Paper
              elevation={0}
              sx={{
                border: `1px solid ${borderColor}`,
                backgroundColor: bgCard,
                p: 2,
                minHeight: '200px',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                Place to link to previous or upcoming launches from launch calendar
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Video Section */}
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          mb: 3,
          p: 2.5,
          border: `1px solid ${borderColor}`,
          backgroundColor: bgCard,
          borderRadius: 2,
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
            letterSpacing: '0.5px',
          }}
        >
          Video Content
        </Typography>

        <Grid container spacing={2}>
          {/* YouTube URL */}
          <Grid item xs={12} md={6}>
            <TextInput
              source="video_youtube_url"
              label="YouTube URL"
              fullWidth
              helperText="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...) or youtu.be link"
            />
            {youtubeVideoId && (
              <Box sx={{ mt: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    border: `1px solid ${borderColor}`,
                    backgroundColor: bgPaper,
                    p: 2,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mb: 1,
                      color: textSecondary,
                      fontWeight: 600,
                    }}
                  >
                    YouTube Preview
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                      borderRadius: 1,
                    }}
                  >
                    <iframe
                      title="YouTube video player"
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </Box>
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Video Upload */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: textSecondary,
                  fontWeight: 500,
                }}
              >
                Video Upload (Alternative to YouTube)
              </Typography>
              <Paper
                elevation={0}
                onClick={() => document.getElementById('video-upload')?.click()}
                sx={{
                  width: '100%',
                  minHeight: '150px',
                  border: `2px dashed ${borderColor}`,
                  backgroundColor: bgPaper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: isDark ? '#252525' : '#f0f0f0',
                    borderColor: linkColor,
                  },
                }}
              >
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={handleVideoChange}
                />
                {videoPreview ? (
                  <Box sx={{ width: '100%', p: 2 }}>
                    <video
                      src={videoPreview}
                      controls
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography sx={{ color: textSecondary, fontSize: '0.875rem', mb: 1 }}>
                      Click to upload video
                    </Typography>
                    <Typography sx={{ color: textDisabled, fontSize: '0.75rem' }}>
                      MP4, MOV, AVI, etc.
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
            <TextInput
              source="video_url"
              label="Video URL (if uploaded externally)"
              fullWidth
              helperText="Direct URL to video file if uploaded to external hosting"
              sx={{ mt: 2 }}
            />
          </Grid>

          {/* Video Metadata */}
          <Grid item xs={12} md={6}>
            <TextInput
              source="video_title"
              label="Video Title"
              fullWidth
              helperText="Title displayed on video player (e.g., 'STARLINER', 'LIVE COVERAGE')"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextInput
              source="video_thumbnail"
              label="Video Thumbnail URL"
              fullWidth
              helperText="Thumbnail image URL for video player (fallback to featured image if not set)"
            />
          </Grid>
          <Grid item xs={12}>
            <TextInput
              source="video_countdown_text"
              label="Countdown Text"
              fullWidth
              helperText="Text displayed below video title (e.g., 'COUNTDOWN TO LAUNCH', 'LIVE COVERAGE')"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Save Button at the end */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton />
      </Box>
    </Box>
  );
};

export const ArticleForm = (props: any) => {
  return (
    <SimpleForm
      toolbar={<CustomToolbar />}
      defaultValues={{ status: 'draft' }}
      {...props}
    >
      <ArticleFormContent />
    </SimpleForm>
  );
};

