/**
 * Launch Filter Utilities
 * Builds query parameters for the comprehensive launch filters API
 */

export const buildLaunchFilters = (filters) => {
  const params = {};

  // Basic filters
  if (filters.id) params.id = filters.id;
  if (filters.slug) params.slug = filters.slug;
  if (filters.name) params.name = filters.name;
  if (filters.serial_number) params.serial_number = filters.serial_number;
  if (filters.launch_designator) params.launch_designator = filters.launch_designator;

  // Date/Time filters
  if (filters.net) params.net = filters.net;
  if (filters.net__gt) params.net__gt = filters.net__gt;
  if (filters.net__gte) params.net__gte = filters.net__gte;
  if (filters.net__lt) params.net__lt = filters.net__lt;
  if (filters.net__lte) params.net__lte = filters.net__lte;

  if (filters.window_start) params.window_start = filters.window_start;
  if (filters.window_start__gt) params.window_start__gt = filters.window_start__gt;
  if (filters.window_start__gte) params.window_start__gte = filters.window_start__gte;
  if (filters.window_start__lt) params.window_start__lt = filters.window_start__lt;
  if (filters.window_start__lte) params.window_start__lte = filters.window_start__lte;

  if (filters.window_end) params.window_end = filters.window_end;
  if (filters.window_end__gt) params.window_end__gt = filters.window_end__gt;
  if (filters.window_end__gte) params.window_end__gte = filters.window_end__gte;
  if (filters.window_end__lt) params.window_end__lt = filters.window_end__lt;
  if (filters.window_end__lte) params.window_end__lte = filters.window_end__lte;

  // Date components
  if (filters.year) params.year = filters.year;
  if (filters.month) params.month = filters.month;
  if (filters.day) params.day = filters.day;

  // Status filters
  if (filters.status) params.status = filters.status;
  if (filters.status__ids) {
    params.status__ids = Array.isArray(filters.status__ids) 
      ? filters.status__ids.join(',') 
      : filters.status__ids;
  }

  // Launch Service Provider (LSP)
  if (filters.lsp__id) params.lsp__id = filters.lsp__id;
  if (filters.lsp__name) params.lsp__name = filters.lsp__name;
  if (filters.related_lsp__id) params.related_lsp__id = filters.related_lsp__id;
  if (filters.related_lsp__name) params.related_lsp__name = filters.related_lsp__name;

  // Rocket Configuration
  if (filters.rocket__configuration__id) params.rocket__configuration__id = filters.rocket__configuration__id;
  if (filters.rocket__configuration__name) params.rocket__configuration__name = filters.rocket__configuration__name;
  if (filters.rocket__configuration__name__icontains) params.rocket__configuration__name__icontains = filters.rocket__configuration__name__icontains;
  if (filters.rocket__configuration__full_name) params.rocket__configuration__full_name = filters.rocket__configuration__full_name;
  if (filters.rocket__configuration__full_name__icontains) params.rocket__configuration__full_name__icontains = filters.rocket__configuration__full_name__icontains;
  if (filters.launcher_config__id) params.launcher_config__id = filters.launcher_config__id;

  // Mission filters
  if (filters.mission__agency__ids) {
    params.mission__agency__ids = Array.isArray(filters.mission__agency__ids)
      ? filters.mission__agency__ids.join(',')
      : filters.mission__agency__ids;
  }
  if (filters.mission__orbit__name) params.mission__orbit__name = filters.mission__orbit__name;
  if (filters.mission__orbit__name__icontains) params.mission__orbit__name__icontains = filters.mission__orbit__name__icontains;
  if (filters.mission__orbit__celestial_body__id) params.mission__orbit__celestial_body__id = filters.mission__orbit__celestial_body__id;

  // Location and Pad
  if (filters.location__ids) {
    params.location__ids = Array.isArray(filters.location__ids)
      ? filters.location__ids.join(',')
      : filters.location__ids;
  }
  if (filters.pad) params.pad = filters.pad;
  if (filters.pad__location) params.pad__location = filters.pad__location;

  // Country filters
  if (filters.country__id) params.country__id = filters.country__id;
  if (filters.country__name) params.country__name = filters.country__name;
  if (filters.country__code) params.country__code = filters.country__code;
  if (filters.location__country) params.location__country = filters.location__country;

  // Program
  if (filters.program) params.program = filters.program;

  // Boolean filters
  if (filters.is_crewed !== undefined) params.is_crewed = filters.is_crewed;
  if (filters.include_suborbital !== undefined) params.include_suborbital = filters.include_suborbital;

  // Launch attempt counts
  if (filters.orbital_launch_attempt_count !== undefined) params.orbital_launch_attempt_count = filters.orbital_launch_attempt_count;
  if (filters.orbital_launch_attempt_count__gt !== undefined) params.orbital_launch_attempt_count__gt = filters.orbital_launch_attempt_count__gt;
  if (filters.orbital_launch_attempt_count__gte !== undefined) params.orbital_launch_attempt_count__gte = filters.orbital_launch_attempt_count__gte;
  if (filters.orbital_launch_attempt_count__lt !== undefined) params.orbital_launch_attempt_count__lt = filters.orbital_launch_attempt_count__lt;
  if (filters.orbital_launch_attempt_count__lte !== undefined) params.orbital_launch_attempt_count__lte = filters.orbital_launch_attempt_count__lte;

  // Legacy/compatibility filters
  if (filters.provider) params.provider = filters.provider;
  if (filters.rocket) params.rocket = filters.rocket;
  if (filters.site) params.site = filters.site;
  if (filters.orbit) params.orbit = filters.orbit;
  if (filters.after) params.after = filters.after;
  if (filters.before) params.before = filters.before;
  if (filters.outcome) params.outcome = filters.outcome;
  if (filters.featured) params.featured = filters.featured;
  if (filters.mission_type) params.mission_type = filters.mission_type;

  // Pagination
  if (filters.limit) params.limit = filters.limit;
  if (filters.offset) params.offset = filters.offset;

  return params;
};

