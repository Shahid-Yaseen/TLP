import { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, StyleSheet, Switch } from 'react-native';
import { theme } from '../styles/theme';
import api from '../services/api';
import { scale, getResponsiveFontSize, getResponsivePadding } from '../utils/responsive';

const LaunchFilters = ({ visible, onClose, filters, onApplyFilters, onReset }) => {
  const [localFilters, setLocalFilters] = useState(filters || {});
  const [options, setOptions] = useState({
    launchSites: [],
    providers: [],
    rockets: [],
    missionTypes: [],
  });
  const [selectedDropdown, setSelectedDropdown] = useState(null);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  useEffect(() => {
    if (visible) {
      fetchFilterOptions();
      setLocalFilters(filters || {});
    }
  }, [visible, filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/launches?limit=1000');
      const launches = response.data?.data || response.data || [];
      
      const sites = [...new Set(launches.map(l => l.site || l.site_name).filter(Boolean))].sort();
      const providers = [...new Set(launches.map(l => l.provider || l.provider_abbrev).filter(Boolean))].sort();
      const rockets = [...new Set(launches.map(l => l.rocket).filter(Boolean))].sort();
      const missionTypes = [...new Set(launches.map(l => l.mission_type).filter(Boolean))].sort();

      setOptions({
        launchSites: sites,
        providers: providers,
        rockets: rockets,
        missionTypes: missionTypes,
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters };
    if (value === null || value === undefined || value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setLocalFilters(newFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>FILTER LAUNCHES</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Search */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Search</Text>
              <TextInput
                style={styles.input}
                placeholder="Launch name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.name || ''}
                onChangeText={(text) => handleFilterChange('name', text || null)}
              />
            </View>

            {/* Launch Site Dropdown */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Launch Site {localFilters.pad__location ? '✓' : ''}
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setSelectedDropdown(selectedDropdown === 'launchSite' ? null : 'launchSite')}
              >
                <Text style={styles.dropdownButtonText}>
                  {localFilters.pad__location || 'All'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {selectedDropdown === 'launchSite' ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {selectedDropdown === 'launchSite' && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleFilterChange('pad__location', null);
                      setSelectedDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All</Text>
                  </TouchableOpacity>
                  {options.launchSites.map((site) => (
                    <TouchableOpacity
                      key={site}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('pad__location', site);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{site}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Launch Provider Dropdown */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Launch Provider {localFilters.lsp__name ? '✓' : ''}
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setSelectedDropdown(selectedDropdown === 'launchProvider' ? null : 'launchProvider')}
              >
                <Text style={styles.dropdownButtonText}>
                  {localFilters.lsp__name || 'All'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {selectedDropdown === 'launchProvider' ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {selectedDropdown === 'launchProvider' && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleFilterChange('lsp__name', null);
                      setSelectedDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All</Text>
                  </TouchableOpacity>
                  {options.providers.map((provider) => (
                    <TouchableOpacity
                      key={provider}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('lsp__name', provider);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{provider}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Rocket Dropdown */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Rocket {localFilters.rocket__configuration__name__icontains ? '✓' : ''}
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setSelectedDropdown(selectedDropdown === 'rocket' ? null : 'rocket')}
              >
                <Text style={styles.dropdownButtonText}>
                  {localFilters.rocket__configuration__name__icontains || 'All'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {selectedDropdown === 'rocket' ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {selectedDropdown === 'rocket' && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleFilterChange('rocket__configuration__name__icontains', null);
                      setSelectedDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All</Text>
                  </TouchableOpacity>
                  {options.rockets.map((rocket) => (
                    <TouchableOpacity
                      key={rocket}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('rocket__configuration__name__icontains', rocket);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{rocket}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Mission Type Dropdown */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>
                Mission Type {localFilters.mission_type ? '✓' : ''}
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setSelectedDropdown(selectedDropdown === 'missionType' ? null : 'missionType')}
              >
                <Text style={styles.dropdownButtonText}>
                  {localFilters.mission_type || 'All'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {selectedDropdown === 'missionType' ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {selectedDropdown === 'missionType' && (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleFilterChange('mission_type', null);
                      setSelectedDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All</Text>
                  </TouchableOpacity>
                  {options.missionTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('mission_type', type);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Orbit */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Orbit</Text>
              <TextInput
                style={styles.input}
                placeholder="LEO, GEO, SSO..."
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.mission__orbit__name || localFilters.orbit || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  mission__orbit__name: text || undefined,
                  orbit: text || undefined
                })}
              />
            </View>

            {/* Year */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="2024"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                value={localFilters.year?.toString() || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  year: text ? parseInt(text) : undefined
                })}
              />
            </View>

            {/* Status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.statusOptions}>
                {['Success', 'Failure', 'Partial', 'TBD'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      localFilters.outcome === status.toLowerCase() && styles.statusChipActive
                    ]}
                    onPress={() => setLocalFilters({
                      ...localFilters,
                      outcome: localFilters.outcome === status.toLowerCase() ? undefined : status.toLowerCase()
                    })}
                  >
                    <Text style={[
                      styles.statusChipText,
                      localFilters.outcome === status.toLowerCase() && styles.statusChipTextActive
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Boolean Filters */}
            <View style={styles.filterSection}>
              <View style={styles.switchRow}>
                <Text style={styles.filterLabel}>Crewed Missions Only</Text>
                <Switch
                  value={localFilters.is_crewed === true}
                  onValueChange={(value) => setLocalFilters({
                    ...localFilters,
                    is_crewed: value ? true : undefined
                  })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.text}
                />
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Date Range</Text>
              <TextInput
                style={styles.input}
                placeholder="Start date (YYYY-MM-DD)"
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.after || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  after: text || undefined,
                  net__gte: text || undefined
                })}
              />
              <TextInput
                style={[styles.input, { marginTop: theme.spacing.sm }]}
                placeholder="End date (YYYY-MM-DD)"
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.before || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  before: text || undefined,
                  net__lte: text || undefined
                })}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>RESET</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: getResponsiveFontSize(theme.fontSizes['2xl']),
    color: theme.colors.textSecondary,
  },
  filterContent: {
    padding: getResponsivePadding(theme.spacing.md),
  },
  filterSection: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  filterLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: getResponsivePadding(theme.spacing.xs),
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scale(8),
    padding: getResponsivePadding(theme.spacing.sm),
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsivePadding(theme.spacing.xs),
  },
  statusChip: {
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
    paddingVertical: getResponsivePadding(theme.spacing.xs),
    borderRadius: scale(20),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusChipText: {
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scale(8),
    padding: getResponsivePadding(theme.spacing.sm),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    flex: 1,
  },
  dropdownArrow: {
    color: theme.colors.textSecondary,
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
  },
  dropdownList: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scale(8),
    marginTop: getResponsivePadding(theme.spacing.xs),
    maxHeight: 200,
  },
  dropdownItem: {
    padding: getResponsivePadding(theme.spacing.sm),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    color: theme.colors.text,
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
  },
  modalFooter: {
    flexDirection: 'row',
    padding: getResponsivePadding(theme.spacing.md),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: getResponsivePadding(theme.spacing.sm),
  },
  resetButton: {
    flex: 1,
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: theme.colors.surface,
    borderRadius: scale(8),
    alignItems: 'center',
  },
  resetButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
  },
  applyButton: {
    flex: 1,
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: theme.colors.primary,
    borderRadius: scale(8),
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
  },
});

export default LaunchFilters;

