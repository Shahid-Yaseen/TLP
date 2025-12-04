import { DataProvider, fetchUtils } from 'react-admin';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3007';

// Centralized resource endpoint mapping
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

    const url = `${API_URL}/api/${endpoint}?${new URLSearchParams(query as any).toString()}`;
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
    const endpoint = getResourceEndpoint(resource);
    const url = `${API_URL}/api/${endpoint}/${params.id}`;
    const { json } = await httpClient(url);
    
    // Fix ID mapping for launches - API returns external_id as id, but we need database_id
    if (resource === 'launches' && json.database_id) {
      json.id = json.database_id;
    }
    
    // Transform image URLs to objects for ImageInput/ImageField
    if (resource === 'crew' && json.profile_image_url && typeof json.profile_image_url === 'string') {
      json.profile_image_url = {
        src: json.profile_image_url,
        title: json.full_name || 'Profile Image'
      };
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
    }
    
    return { data: json };
  },

  getMany: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const ids = params.ids.join(',');
    const url = `${API_URL}/api/${endpoint}?ids=${ids}`;
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

    const url = `${API_URL}/api/${endpoint}?${new URLSearchParams(query as any).toString()}`;
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
    const url = `${API_URL}/api/${endpoint}`;
    
    // Handle file uploads
    const data = { ...params.data };
    if (data.profile_image_url) {
      // Check if it's a file object (has rawFile property)
      if (data.profile_image_url.rawFile) {
        const formData = new FormData();
        formData.append('image', data.profile_image_url.rawFile);
        
        const token = localStorage.getItem('access_token');
        const uploadResponse = await fetch(`${API_URL}/api/upload/crew`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          // Use full URL for the image
          data.profile_image_url = `${API_URL}${uploadData.url}`;
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
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { data: json };
  },

  update: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const url = `${API_URL}/api/${endpoint}/${params.id}`;
    
    // Handle file uploads
    const data = { ...params.data };
    if (data.profile_image_url) {
      // Check if it's a file object (has rawFile property)
      if (data.profile_image_url.rawFile) {
        const formData = new FormData();
        formData.append('image', data.profile_image_url.rawFile);
        
        const token = localStorage.getItem('access_token');
        const uploadResponse = await fetch(`${API_URL}/api/upload/crew`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          // Use full URL for the image
          data.profile_image_url = `${API_URL}${uploadData.url}`;
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
    const url = `${API_URL}/api/${endpoint}/${params.id}`;

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
  const url = `${API_URL}/api/statistics/launches/detailed`;
  const { json } = await httpClient(url);
  return json;
};
