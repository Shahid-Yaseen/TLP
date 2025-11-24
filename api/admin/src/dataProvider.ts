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
    const { json } = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });
    return { data: json };
  },

  update: async (resource: string, params: any) => {
    const endpoint = getResourceEndpoint(resource);
    const url = `${API_URL}/api/${endpoint}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'PATCH',
      body: JSON.stringify(params.data),
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
