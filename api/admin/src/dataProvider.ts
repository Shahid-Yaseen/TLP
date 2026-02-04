import { DataProvider, fetchUtils } from 'react-admin';
import { getApiUrl } from './config/api';

// Centralized resource endpoint mapping (categories/tags used by Articles ReferenceInput/ReferenceArrayInput)
const getResourceEndpoint = (resource: string): string => {
  const resourceMap: Record<string, string> = {
    launches: 'launches',
    articles: 'news',
    authors: 'authors',
    categories: 'news/categories',
    tags: 'news/tags',
    astronauts: 'spacebase/astronauts',
    agencies: 'spacebase/agencies',
    rockets: 'spacebase/rockets',
    users: 'users',
    roles: 'roles',
    permissions: 'permissions',
    events: 'events',
    crew: 'crew',
    providers: 'providers',
    orbits: 'orbits',
    launch_sites: 'launch-sites',
    countries: 'countries',
    stock_tickers: 'stock-tickers',
    subscriptions: 'subscribers',
    mission_content: 'mission/content',
    mission_updates: 'mission/updates',
  };
  return resourceMap[resource] || resource;
};

const httpClient = (url: string, options: any = {}) => {
  const token = localStorage.getItem('access_token');

  if (!options.headers) {
    options.headers = new Headers();
  }

  if (token && !options.headers.get('Authorization')) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }

  if (!options.headers.get('Content-Type')) {
    options.headers.set('Content-Type', 'application/json');
  }

  return fetchUtils.fetchJson(url, options);
};

// Helper function to flatten nested JSON objects for form fields
const flattenJsonObject = (obj: any, prefix: string = ''): any => {
  const flattened: any = {};
  if (!obj || typeof obj !== 'object') {
    return flattened;
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenJsonObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }

  return flattened;
};

export const dataProvider: DataProvider = {
  getList: async (resource: string, params: any) => {
    // Handle mission_content singleton - always return single object wrapped in array
    if (resource === 'mission_content') {
      const endpoint = getResourceEndpoint(resource);
      const url = `${getApiUrl()}/api/${endpoint}`;
      const { json } = await httpClient(url);
      
      // Transform image URLs to objects for ImageInput/ImageField
      if (json.hero_background_image_url && typeof json.hero_background_image_url === 'string') {
        json.hero_background_image_url = {
          src: json.hero_background_image_url,
          title: 'Hero Background Image'
        };
      }
      if (json.lander_image_url && typeof json.lander_image_url === 'string') {
        json.lander_image_url = {
          src: json.lander_image_url,
          title: 'Lander Image'
        };
      }
      
      // Ensure id is set to 1 for singleton
      json.id = 1;
      
      return {
        data: [json],
        total: 1,
      };
    }

    const pagination = params.pagination || { page: 1, perPage: 10 };
    const sort = params.sort || { field: 'id', order: 'ASC' };
    const { page, perPage } = pagination;
    const { field, order } = sort;

    const endpoint = getResourceEndpoint(resource);
    const query: any = {
      ...fetchUtils.flattenObject(params.filter || {}),
      limit: perPage,
      offset: (page - 1) * perPage,
    };

    // Handle sorting
    if (field) {
      query.sort = field;
      query.order = order?.toLowerCase() || 'asc';
    }

    const url = `${getApiUrl()}/api/${endpoint}?${new URLSearchParams(query as any).toString()}`;
    const { json } = await httpClient(url);

    // Handle different response formats
    let data = json;
    let total = 0;

    if (Array.isArray(json)) {
      data = json;
      total = json.length;
    } else if (json.data) {
      data = json.data;
      total = json.total || json.pagination?.total || data.length;
    } else {
      data = [];
      total = 0;
    }

    return {
      data,
      total,
    };
  },

  getOne: async (resource: string, params: any) => {
    // Handle mission_content singleton - always use id=1, fetch from /api/mission/content (no id in URL)
    if (resource === 'mission_content') {
      const endpoint = getResourceEndpoint(resource);
      const url = `${getApiUrl()}/api/${endpoint}`;
      const { json } = await httpClient(url);
      
      // Ensure id is set to 1 for singleton
      json.id = 1;
      
      // Transform image URLs to objects for ImageInput/ImageField
      if (json.hero_background_image_url && typeof json.hero_background_image_url === 'string') {
        json.hero_background_image_url = {
          src: json.hero_background_image_url,
          title: 'Hero Background Image'
        };
      }
      if (json.lander_image_url && typeof json.lander_image_url === 'string') {
        json.lander_image_url = {
          src: json.lander_image_url,
          title: 'Lander Image'
        };
      }
      
      return { data: json };
    }

    const endpoint = getResourceEndpoint(resource);
    const url = `${getApiUrl()}/api/${endpoint}/${params.id}`;
    const { json } = await httpClient(url);

    // Fix ID mapping for launches - API returns external_id as id, but we need database_id
    if (resource === 'launches' && json.database_id) {
      json.id = json.database_id;
    }

    // Transform image URLs to objects for ImageInput/ImageField
    if (resource === 'crew' && json.profile_image_url && typeof json.profile_image_url === 'string') {
      // Clean malformed URLs when reading from API
      let cleanedUrl = json.profile_image_url;
      
      // Remove any server IP addresses that might be prepended
      cleanedUrl = cleanedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
      cleanedUrl = cleanedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
      cleanedUrl = cleanedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
      
      // Also handle cases where IP might be in the middle
      cleanedUrl = cleanedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
      cleanedUrl = cleanedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
      cleanedUrl = cleanedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
      
      // Fix malformed protocols
      cleanedUrl = cleanedUrl.replace(/https\/\//g, 'https://');
      cleanedUrl = cleanedUrl.replace(/http\/\//g, 'http://');
      
      // Remove any remaining IP addresses
      cleanedUrl = cleanedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
      cleanedUrl = cleanedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
      
      json.profile_image_url = {
        src: cleanedUrl,
        title: json.full_name || 'Profile Image'
      };
    }

    // Transform article image URLs to objects for ImageInput/ImageField
    if (resource === 'articles') {
      const cleanImageUrl = (url: string): string => {
        if (!url || typeof url !== 'string') return url;
        let cleaned = url;
        // Remove any server IP addresses that might be prepended
        cleaned = cleaned.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
        cleaned = cleaned.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
        cleaned = cleaned.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
        cleaned = cleaned.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
        cleaned = cleaned.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
        cleaned = cleaned.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
        cleaned = cleaned.replace(/https\/\//g, 'https://');
        cleaned = cleaned.replace(/http\/\//g, 'http://');
        cleaned = cleaned.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
        cleaned = cleaned.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
        return cleaned;
      };

      if (json.hero_image_url && typeof json.hero_image_url === 'string') {
        json.hero_image_url = {
          src: cleanImageUrl(json.hero_image_url),
          title: json.title || 'Hero Image'
        };
      }
      if (json.featured_image_url && typeof json.featured_image_url === 'string') {
        json.featured_image_url = {
          src: cleanImageUrl(json.featured_image_url),
          title: json.title || 'Featured Image'
        };
      }
    }

    // Transform coordinates for form fields (coordinates.lat/lng)
    if (resource === 'crew' && json.coordinates) {
      let coords = json.coordinates;
      if (typeof coords === 'string') {
        try {
          coords = JSON.parse(coords);
        } catch (e) {
          coords = null;
        }
      }
      if (coords && typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
        // Keep as is for form fields
        json.coordinates = {
          lat: coords.lat.toString(),
          lng: coords.lng.toString()
        };
      } else {
        json.coordinates = { lat: '', lng: '' };
      }
    }

    // Handle JSONB fields for launches - ensure they're objects, not strings
    // Also map API response fields to database field names
    if (resource === 'launches' || resource === 'articles') {
      // Map API response fields to database field names
      if (json.status && !json.status_json) {
        json.status_json = json.status;
      }
      if (json.image && !json.image_json) {
        json.image_json = json.image;
      }
      if (json.infographic && !json.infographic_json) {
        json.infographic_json = json.infographic;
      }
      if (json.launch_service_provider && !json.launch_service_provider_json) {
        json.launch_service_provider_json = json.launch_service_provider;
      }
      if (json.rocket && !json.rocket_json) {
        json.rocket_json = json.rocket;
      }
      if (json.mission && !json.mission_json) {
        json.mission_json = json.mission;
      }
      if (json.pad && !json.pad_json) {
        json.pad_json = json.pad;
      }
      if (json.program && !json.program_json) {
        json.program_json = json.program;
      }

      const jsonbFields = [
        'status_json', 'image_json', 'infographic_json', 'weather_concerns_json',
        'hashtag_json', 'launch_service_provider_json', 'rocket_json', 'mission_json',
        'pad_json', 'program_json', 'net_precision', 'media',
        'updates', 'timeline', 'vid_urls', 'info_urls', 'mission_patches',
        'payloads', 'crew', 'hazards'
      ];

      jsonbFields.forEach(field => {
        if (json[field] && typeof json[field] === 'string') {
          try {
            json[field] = JSON.parse(json[field]);
          } catch (e) {
            // If parsing fails, keep as string (will be handled by form)
          }
        }
      });

      // Flatten JSON objects into nested form fields for editing
      const jsonFieldsToFlatten = [
        'status_json', 'rocket_json', 'mission_json', 'pad_json',
        'launch_service_provider_json', 'image_json', 'infographic_json',
        'weather_concerns_json', 'hashtag_json', 'net_precision'
      ];

      jsonFieldsToFlatten.forEach(field => {
        if (json[field] && typeof json[field] === 'object' && !Array.isArray(json[field])) {
          const flattened = flattenJsonObject(json[field], field);
          Object.assign(json, flattened);
          // Keep original for reference, but form will use flattened fields
        }
      });

      // Extract mission_json arrays to top-level for ArrayInput components
      if (json.mission_json && typeof json.mission_json === 'object') {
        if (Array.isArray(json.mission_json.agencies)) {
          json['mission_json.agencies'] = json.mission_json.agencies;
        }
        if (Array.isArray(json.mission_json.info_urls)) {
          json['mission_json.info_urls'] = json.mission_json.info_urls;
        }
        if (Array.isArray(json.mission_json.vid_urls)) {
          json['mission_json.vid_urls'] = json.mission_json.vid_urls;
        }
      }

      // Map net to launch_date if needed
      if (json.net && !json.launch_date) {
        json.launch_date = json.net;
      }

      // Extract video data and country from metadata for articles
      if (resource === 'articles' && json.metadata) {
        let metadata = json.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            // If parsing fails, keep as is
          }
        }
        if (metadata && typeof metadata === 'object') {
          if (metadata.video) {
            json.video_youtube_url = metadata.video.youtube_url || '';
            json.video_url = metadata.video.video_url || '';
            json.video_title = metadata.video.title || '';
            json.video_thumbnail = metadata.video.thumbnail || '';
            json.video_countdown_text = metadata.video.countdown_text || '';
          }
          // country_id is already in the main json object
        }
      }
    }

    return { data: json };
  },

  getMany: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const ids = params.ids.join(',');
    const url = `${getApiUrl()}/api/${endpoint}?ids=${ids}`;
    const { json } = await httpClient(url);

    const data = Array.isArray(json) ? json : json.data || [];
    return { data };
  },

  getManyReference: async (resource: string, params: any) => {
    const pagination = params.pagination || { page: 1, perPage: 10 };
    const { page, perPage } = pagination;
    const endpoint = getResourceEndpoint(resource);
    const query: any = {
      ...fetchUtils.flattenObject(params.filter || {}),
      [params.target]: params.id,
      limit: perPage,
      offset: (page - 1) * perPage,
    };

    const url = `${getApiUrl()}/api/${endpoint}?${new URLSearchParams(query as any).toString()}`;
    const { json } = await httpClient(url);

    const data = Array.isArray(json) ? json : json.data || [];
    const total = json.total || json.pagination?.total || data.length;

    return {
      data,
      total,
    };
  },

  create: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const url = `${getApiUrl()}/api/${endpoint}`;

    // Handle file uploads
    let data = { ...params.data };

    // Transform article data: move custom fields to metadata
    if (resource === 'articles') {
      const metadata: any = {};

      if (data.is_breaking !== undefined) {
        metadata.is_breaking = data.is_breaking;
      }
      if (data.is_developing !== undefined) {
        metadata.is_developing = data.is_developing;
      }
      if (data.sub_category) {
        metadata.sub_category = data.sub_category;
      }
      if (data.summary) {
        metadata.summary = data.summary;
      }
      // country_id is handled separately as a direct column

      // Handle video data
      if (data.video_youtube_url || data.video_url || data.video_title || data.video_thumbnail || data.video_countdown_text) {
        metadata.video = {};
        if (data.video_youtube_url) {
          metadata.video.youtube_url = data.video_youtube_url;
        }
        if (data.video_url) {
          metadata.video.video_url = data.video_url;
        }
        if (data.video_title) {
          metadata.video.title = data.video_title;
        }
        if (data.video_thumbnail) {
          metadata.video.thumbnail = data.video_thumbnail;
        }
        if (data.video_countdown_text) {
          metadata.video.countdown_text = data.video_countdown_text;
        }
      }

      // Remove custom fields and add metadata
      const { is_breaking, is_developing, sub_category, summary, video_youtube_url, video_url, video_title, video_thumbnail, video_countdown_text, ...rest } = data;

      // Ensure tag_ids is an array or undefined (not empty array)
      const tagIds = rest.tag_ids && Array.isArray(rest.tag_ids) && rest.tag_ids.length > 0
        ? rest.tag_ids
        : undefined;

      // Keep is_featured, is_trending, and country_id as they need to be saved to database columns
      // Note: hero_image_url and featured_image_url are extracted here but will be handled separately for uploads
      const { hero_image_url, featured_image_url, author_id, category_id, country_id, ...cleanRest } = rest;

      // Only include author_id and category_id if they have valid values
      const finalData: any = {
        ...cleanRest,
        tag_ids: tagIds,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      };

      // Include is_featured, is_trending, is_interview, and is_top_story if they exist
      if (data.is_featured !== undefined) {
        finalData.is_featured = Boolean(data.is_featured);
      }
      if (data.is_trending !== undefined) {
        finalData.is_trending = Boolean(data.is_trending);
      }
      if (data.is_interview !== undefined) {
        finalData.is_interview = Boolean(data.is_interview);
      }
      if (data.is_top_story !== undefined) {
        finalData.is_top_story = Boolean(data.is_top_story);
      }

      // Ensure status is always sent so admin "Published" checkbox is respected
      finalData.status = (data.status === 'published' || data.status === 'archived') ? data.status : 'draft';

      // Explicitly remove author_id and category_id from the data object
      // Only add them back if they have valid, non-empty values
      delete finalData.author_id;
      delete finalData.category_id;

      // Only add author_id if it's a valid number (not null, undefined, empty string, or 0)
      // Also handle the case where it might be sent as an empty string from the form
      const authorIdValue = author_id === '' || author_id === null || author_id === undefined ? null : author_id;
      if (authorIdValue && !isNaN(Number(authorIdValue)) && Number(authorIdValue) > 0) {
        finalData.author_id = Number(authorIdValue);
      }

      // Only add category_id if it's a valid number
      // Also handle the case where it might be sent as an empty string from the form
      const categoryIdValue = category_id === '' || category_id === null || category_id === undefined ? null : category_id;
      if (categoryIdValue && !isNaN(Number(categoryIdValue)) && Number(categoryIdValue) > 0) {
        finalData.category_id = Number(categoryIdValue);
      }

      // Only add country_id if it's a valid number
      const countryIdValue = country_id === '' || country_id === null || country_id === undefined ? null : country_id;
      if (countryIdValue && !isNaN(Number(countryIdValue)) && Number(countryIdValue) > 0) {
        finalData.country_id = Number(countryIdValue);
      }

      data = finalData;

      // Final safety check: ensure author_id and category_id are not in the data if they're invalid
      if (data.author_id === null || data.author_id === undefined || data.author_id === '' || data.author_id === 0) {
        delete data.author_id;
      }
      if (data.category_id === null || data.category_id === undefined || data.category_id === '' || data.category_id === 0) {
        delete data.category_id;
      }

      // Handle article image uploads (hero_image_url and featured_image_url)
      const handleArticleImageUpload = async (imageField: any) => {
        // If it's already a string URL (from TextInput), use it directly
        if (typeof imageField === 'string' && imageField.trim() !== '') {
          return imageField.trim();
        }
        
        // If it's a file upload (from ImageInput file picker)
        if (imageField && imageField.rawFile) {
          const formData = new FormData();
          formData.append('image', imageField.rawFile);

          const token = localStorage.getItem('access_token');
          const uploadResponse = await fetch(`${getApiUrl()}/api/upload/article`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            let uploadedUrl = uploadData.url;
            
            // Clean the URL - remove any server IP addresses
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
            uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
            uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
            
            return (uploadedUrl.match(/^https?:\/\//)) 
              ? uploadedUrl 
              : `${getApiUrl()}${uploadedUrl}`;
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
          }
        }
        
        // If it's an object with src property (from ImageInput displaying existing image)
        if (typeof imageField === 'object' && imageField !== null && imageField.src) {
          return imageField.src;
        }
        
        // Return undefined for empty/null values
        return undefined;
      };

      // Handle hero_image_url upload
      if (data.hero_image_url) {
        data.hero_image_url = await handleArticleImageUpload(data.hero_image_url);
      }

      // Handle featured_image_url upload
      if (data.featured_image_url) {
        data.featured_image_url = await handleArticleImageUpload(data.featured_image_url);
      }

      console.log('Article data being sent:', JSON.stringify(data, null, 2));
    }
    if (data.profile_image_url) {
      // Check if it's a file object (has rawFile property)
      if (data.profile_image_url.rawFile) {
        const formData = new FormData();
        formData.append('image', data.profile_image_url.rawFile);

        const token = localStorage.getItem('access_token');
        const uploadResponse = await fetch(`${getApiUrl()}/api/upload/crew`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          // Use full URL for the image - check if it's already an absolute URL
          let uploadedUrl = uploadData.url;
          
          // Aggressively clean the URL - remove any server IP addresses
          // Pattern: http://IP_ADDRESShttps://domain or http://IP_ADDRESShttps//domain
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
          
          // Also handle cases where IP might be in the middle: http://IPhttps://domain
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
          
          // Fix malformed URLs (missing colon in https://) - replace anywhere in string
          uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
          uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
          
          // Remove any remaining IP addresses that might be prepended
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
          
          // Only prepend API base URL if it's not already an absolute URL
          data.profile_image_url = (uploadedUrl.match(/^https?:\/\//)) 
            ? uploadedUrl 
            : `${getApiUrl()}${uploadedUrl}`;
        } else {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
        }
      } else if (typeof data.profile_image_url === 'object' && data.profile_image_url.src) {
        // If it's an object with src, use the src
        data.profile_image_url = data.profile_image_url.src;
      }
      // If it's already a string URL, keep it as is
    }

    // Handle mission image uploads
    if (resource === 'mission_content') {
      const handleImageUpload = async (imageField: any, uploadEndpoint: string) => {
        if (imageField && imageField.rawFile) {
          const formData = new FormData();
          formData.append('image', imageField.rawFile);

          const token = localStorage.getItem('access_token');
          const uploadResponse = await fetch(`${getApiUrl()}/api/upload/${uploadEndpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            let uploadedUrl = uploadData.url;
            
            // Aggressively clean the URL - remove any server IP addresses
            // Pattern: http://IP_ADDRESShttps://domain or http://IP_ADDRESShttps//domain
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
            
            // Also handle cases where IP might be in the middle: http://IPhttps://domain
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
            
            // Fix malformed URLs (missing colon in https://) - replace anywhere in string
            uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
            uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
            
            // Remove any remaining IP addresses that might be prepended
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
            
            // Only prepend API base URL if it's not already an absolute URL
            return (uploadedUrl.match(/^https?:\/\//)) 
              ? uploadedUrl 
              : `${getApiUrl()}${uploadedUrl}`;
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
          }
        } else if (typeof imageField === 'object' && imageField.src) {
          return imageField.src;
        }
        return imageField; // Already a string URL or undefined
      };

      if (data.hero_background_image_url) {
        data.hero_background_image_url = await handleImageUpload(data.hero_background_image_url, 'mission');
      }
      if (data.lander_image_url) {
        data.lander_image_url = await handleImageUpload(data.lander_image_url, 'mission');
      }
    }

    // Handle coordinates - convert nested coordinates.lat/lng to coordinates object
    if (data.coordinates && (data.coordinates.lat !== undefined || data.coordinates.lng !== undefined)) {
      const lat = data.coordinates.lat ? parseFloat(data.coordinates.lat) : null;
      const lng = data.coordinates.lng ? parseFloat(data.coordinates.lng) : null;
      if (lat !== null && lng !== null) {
        data.coordinates = { lat, lng };
      } else {
        data.coordinates = null;
      }
    }

    // Ensure author_id and category_id are explicitly not included if they're null/undefined/empty
    if (data.author_id === null || data.author_id === undefined || data.author_id === '') {
      delete data.author_id;
    }
    if (data.category_id === null || data.category_id === undefined || data.category_id === '') {
      delete data.category_id;
    }

    try {
      const { json } = await httpClient(url, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { data: json };
    } catch (error: any) {
      console.error('Error creating article:', error);
      console.error('Data being sent:', JSON.stringify(data, null, 2));
      // Try to get the error message from the response
      if (error.body) {
        console.error('Error body:', error.body);
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  update: async (resource: string, params: any) => {
    // Handle mission_content singleton - PUT to /api/mission/content (no id in URL)
    if (resource === 'mission_content') {
      const endpoint = getResourceEndpoint(resource);
      const url = `${getApiUrl()}/api/${endpoint}`;
      
      // Handle file uploads
      let data = { ...params.data };
      
      // Handle mission image uploads
      const handleImageUpload = async (imageField: any, uploadEndpoint: string) => {
        if (imageField && imageField.rawFile) {
          const formData = new FormData();
          formData.append('image', imageField.rawFile);

          const token = localStorage.getItem('access_token');
          const uploadResponse = await fetch(`${getApiUrl()}/api/upload/${uploadEndpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            let uploadedUrl = uploadData.url;
            
            // Remove any incorrectly prepended server IP first
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
            
            // Fix malformed URLs (missing colon in https://) - replace anywhere in string
            uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
            uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
            
            // Only prepend API base URL if it's not already an absolute URL
            return (uploadedUrl.match(/^https?:\/\//)) 
              ? uploadedUrl 
              : `${getApiUrl()}${uploadedUrl}`;
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
          }
        } else if (typeof imageField === 'object' && imageField.src) {
          return imageField.src;
        }
        return imageField; // Already a string URL or undefined
      };

      if (data.hero_background_image_url) {
        data.hero_background_image_url = await handleImageUpload(data.hero_background_image_url, 'mission');
      }
      if (data.lander_image_url) {
        data.lander_image_url = await handleImageUpload(data.lander_image_url, 'mission');
      }

      const { json } = await httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { data: json };
    }

    const endpoint = getResourceEndpoint(resource);
    const url = `${getApiUrl()}/api/${endpoint}/${params.id}`;

    // Handle file uploads
    let data = { ...params.data };

    // Transform article data: move custom fields to metadata
    if (resource === 'articles') {
      const metadata: any = {};

      // Preserve existing metadata if it exists
      if (data.metadata && typeof data.metadata === 'object') {
        Object.assign(metadata, data.metadata);
      }

      if (data.is_breaking !== undefined) {
        metadata.is_breaking = data.is_breaking;
      }
      if (data.is_developing !== undefined) {
        metadata.is_developing = data.is_developing;
      }
      if (data.sub_category) {
        metadata.sub_category = data.sub_category;
      }
      if (data.summary) {
        metadata.summary = data.summary;
      }
      // country_id is handled separately as a direct column

      // Handle video data
      if (data.video_youtube_url || data.video_url || data.video_title || data.video_thumbnail || data.video_countdown_text) {
        if (!metadata.video) {
          metadata.video = {};
        }
        if (data.video_youtube_url) {
          metadata.video.youtube_url = data.video_youtube_url;
        }
        if (data.video_url) {
          metadata.video.video_url = data.video_url;
        }
        if (data.video_title) {
          metadata.video.title = data.video_title;
        }
        if (data.video_thumbnail) {
          metadata.video.thumbnail = data.video_thumbnail;
        }
        if (data.video_countdown_text) {
          metadata.video.countdown_text = data.video_countdown_text;
        }
      }

      // Remove custom fields and add metadata
      const { is_breaking, is_developing, sub_category, summary, video_youtube_url, video_url, video_title, video_thumbnail, video_countdown_text, ...rest } = data;

      // Ensure tag_ids is an array or undefined (not empty array)
      const tagIds = rest.tag_ids && Array.isArray(rest.tag_ids) && rest.tag_ids.length > 0
        ? rest.tag_ids
        : undefined;

      // Keep is_featured, is_trending, and country_id as they need to be saved to database columns
      // Note: hero_image_url and featured_image_url are extracted here but will be handled separately for uploads
      const { hero_image_url, featured_image_url, country_id, ...cleanRest } = rest;
      const finalData: any = {
        ...cleanRest,
        tag_ids: tagIds,
        metadata: Object.keys(metadata).length > 0 ? metadata : {},
      };

      // Include is_featured, is_trending, is_interview, and is_top_story if they exist
      if (data.is_featured !== undefined) {
        finalData.is_featured = Boolean(data.is_featured);
      }
      if (data.is_trending !== undefined) {
        finalData.is_trending = Boolean(data.is_trending);
      }
      if (data.is_interview !== undefined) {
        finalData.is_interview = Boolean(data.is_interview);
      }
      if (data.is_top_story !== undefined) {
        finalData.is_top_story = Boolean(data.is_top_story);
      }

      // Ensure status is sent so admin "Published" checkbox is respected on update
      if (data.status !== undefined) {
        finalData.status = (data.status === 'published' || data.status === 'archived') ? data.status : 'draft';
      }

      // Handle author_id and category_id
      if (data.author_id !== undefined) {
        const authorIdValue = data.author_id === '' || data.author_id === null || data.author_id === undefined ? null : data.author_id;
        if (authorIdValue && !isNaN(Number(authorIdValue)) && Number(authorIdValue) > 0) {
          finalData.author_id = Number(authorIdValue);
        } else {
          finalData.author_id = null;
        }
      }

      if (data.category_id !== undefined) {
        const categoryIdValue = data.category_id === '' || data.category_id === null || data.category_id === undefined ? null : data.category_id;
        if (categoryIdValue && !isNaN(Number(categoryIdValue)) && Number(categoryIdValue) > 0) {
          finalData.category_id = Number(categoryIdValue);
        } else {
          finalData.category_id = null;
        }
      }

      if (data.country_id !== undefined) {
        const countryIdValue = data.country_id === '' || data.country_id === null || data.country_id === undefined ? null : data.country_id;
        if (countryIdValue && !isNaN(Number(countryIdValue)) && Number(countryIdValue) > 0) {
          finalData.country_id = Number(countryIdValue);
        } else {
          finalData.country_id = null;
        }
      }

      // Handle article image uploads (hero_image_url and featured_image_url)
      const handleArticleImageUpload = async (imageField: any) => {
        // If it's already a string URL (from TextInput), use it directly
        if (typeof imageField === 'string' && imageField.trim() !== '') {
          return imageField.trim();
        }
        
        // If it's a file upload (from ImageInput file picker)
        if (imageField && imageField.rawFile) {
          const formData = new FormData();
          formData.append('image', imageField.rawFile);

          const token = localStorage.getItem('access_token');
          const uploadResponse = await fetch(`${getApiUrl()}/api/upload/article`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            let uploadedUrl = uploadData.url;
            
            // Clean the URL - remove any server IP addresses
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
            uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
            uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
            uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
            uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
            
            return (uploadedUrl.match(/^https?:\/\//)) 
              ? uploadedUrl 
              : `${getApiUrl()}${uploadedUrl}`;
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
          }
        }
        
        // If it's an object with src property (from ImageInput displaying existing image)
        if (typeof imageField === 'object' && imageField !== null && imageField.src) {
          return imageField.src;
        }
        
        // Return undefined for empty/null values
        return undefined;
      };

      // Handle hero_image_url upload
      if (hero_image_url !== undefined && hero_image_url !== null && hero_image_url !== '') {
        const processedHeroImage = await handleArticleImageUpload(hero_image_url);
        if (processedHeroImage) {
          finalData.hero_image_url = processedHeroImage;
        } else {
          // Explicitly set to null if processing returns undefined (image was cleared)
          finalData.hero_image_url = null;
        }
      } else {
        // Explicitly set to null if field is empty
        finalData.hero_image_url = null;
      }

      // Handle featured_image_url upload
      if (featured_image_url !== undefined && featured_image_url !== null && featured_image_url !== '') {
        const processedFeaturedImage = await handleArticleImageUpload(featured_image_url);
        if (processedFeaturedImage) {
          finalData.featured_image_url = processedFeaturedImage;
        } else {
          // Explicitly set to null if processing returns undefined (image was cleared)
          finalData.featured_image_url = null;
        }
      } else {
        // Explicitly set to null if field is empty
        finalData.featured_image_url = null;
      }

      data = finalData;
    }
    if (data.profile_image_url) {
      // Check if it's a file object (has rawFile property)
      if (data.profile_image_url.rawFile) {
        const formData = new FormData();
        formData.append('image', data.profile_image_url.rawFile);

        const token = localStorage.getItem('access_token');
        const uploadResponse = await fetch(`${getApiUrl()}/api/upload/crew`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          // Use full URL for the image - check if it's already an absolute URL
          let uploadedUrl = uploadData.url;
          
          // Aggressively clean the URL - remove any server IP addresses
          // Pattern: http://IP_ADDRESShttps://domain or http://IP_ADDRESShttps//domain
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?:\/\/)/, '$1');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(https?\/\/)/, 'https://');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d.]+(http?\/\/)/, 'http://');
          
          // Also handle cases where IP might be in the middle: http://IPhttps://domain
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?:\/\/)/, '$2');
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(https?\/\/)/, 'https://');
          uploadedUrl = uploadedUrl.replace(/(https?:\/\/)[\d.]+(http?\/\/)/, 'http://');
          
          // Fix malformed URLs (missing colon in https://) - replace anywhere in string
          uploadedUrl = uploadedUrl.replace(/https\/\//g, 'https://');
          uploadedUrl = uploadedUrl.replace(/http\/\//g, 'http://');
          
          // Remove any remaining IP addresses that might be prepended
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?:\/\/)/, '$1');
          uploadedUrl = uploadedUrl.replace(/^https?:\/\/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}(https?\/\/)/, 'https://');
          
          // Only prepend API base URL if it's not already an absolute URL
          data.profile_image_url = (uploadedUrl.match(/^https?:\/\//)) 
            ? uploadedUrl 
            : `${getApiUrl()}${uploadedUrl}`;
        } else {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Failed to upload image: ${errorData.error || uploadResponse.statusText}`);
        }
      } else if (typeof data.profile_image_url === 'object' && data.profile_image_url.src) {
        // If it's an object with src, use the src
        data.profile_image_url = data.profile_image_url.src;
      }
      // If it's already a string URL, keep it as is
    }

    // Handle coordinates - convert nested coordinates.lat/lng to coordinates object
    if (data.coordinates && (data.coordinates.lat !== undefined || data.coordinates.lng !== undefined)) {
      const lat = data.coordinates.lat ? parseFloat(data.coordinates.lat) : null;
      const lng = data.coordinates.lng ? parseFloat(data.coordinates.lng) : null;
      if (lat !== null && lng !== null) {
        data.coordinates = { lat, lng };
      } else {
        data.coordinates = null;
      }
    }

    const { json } = await httpClient(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return { data: json };
  },

  updateMany: async (resource: string, params: any) => {
    const promises = params.ids.map(async (id: any) => {
      const existing = await dataProvider.getOne(resource, { id });
      return dataProvider.update(resource, {
        id,
        data: params.data,
        previousData: existing.data,
      });
    });
    const results = await Promise.all(promises);
    return { data: results.map(result => result.data) };
  },

  delete: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const url = `${getApiUrl()}/api/${endpoint}/${params.id}`;

    // Get existing record before deletion for return value
    const existing = await dataProvider.getOne(resource, { id: params.id });

    await httpClient(url, {
      method: 'DELETE',
    });

    return { data: existing.data };
  },

  deleteMany: async (resource: string, params: any) => {
    const promises = params.ids.map(async (id: any) => {
      await dataProvider.delete(resource, { id });
      return { id };
    });
    await Promise.all(promises);
    return { data: params.ids };
  },
};

// Custom method to fetch launch statistics
export const fetchLaunchStatistics = async () => {
  const url = `${getApiUrl()}/api/statistics/launches/detailed`;
  const { json } = await httpClient(url);
  return json;
};
