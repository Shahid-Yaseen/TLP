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
          <ScrollView 
            style={styles.filterContent}
            contentContainerStyle={styles.filterContentContainer}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FILTER LAUNCHES</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Search */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Search</Text>
              <TextInput
                style={styles.input}
                placeholder="Launch name..."
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.name || ''}
                onChangeText={(text) => handleFilterChange('name', text || null)}
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
            </View>

            {/* Launch Site Dropdown */}
            <View style={[styles.filterSection, selectedDropdown === 'launchSite' && { zIndex: 10000 }]}>
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
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.dropdownList}
                    contentContainerStyle={styles.dropdownListContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('pad__location', null);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>All</Text>
                    </TouchableOpacity>
                    {options.launchSites.map((site, index) => (
                      <View key={`launchSite-${index}`}>
                        <View style={styles.dropdownSeparator} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleFilterChange('pad__location', site);
                            setSelectedDropdown(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{site}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Launch Provider Dropdown */}
            <View style={[styles.filterSection, selectedDropdown === 'launchProvider' && { zIndex: 10000 }]}>
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
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.dropdownList}
                    contentContainerStyle={styles.dropdownListContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('lsp__name', null);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>All</Text>
                    </TouchableOpacity>
                    {options.providers.map((provider, index) => (
                      <View key={`launchProvider-${index}`}>
                        <View style={styles.dropdownSeparator} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleFilterChange('lsp__name', provider);
                            setSelectedDropdown(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{provider}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Rocket Dropdown */}
            <View style={[styles.filterSection, selectedDropdown === 'rocket' && { zIndex: 10000 }]}>
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
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.dropdownList}
                    contentContainerStyle={styles.dropdownListContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('rocket__configuration__name__icontains', null);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>All</Text>
                    </TouchableOpacity>
                    {options.rockets.map((rocket, index) => (
                      <View key={`rocket-${index}`}>
                        <View style={styles.dropdownSeparator} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleFilterChange('rocket__configuration__name__icontains', rocket);
                            setSelectedDropdown(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{rocket}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Mission Type Dropdown */}
            <View style={[styles.filterSection, selectedDropdown === 'missionType' && { zIndex: 10000 }]}>
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
                <View style={styles.dropdownContainer}>
                  <ScrollView 
                    style={styles.dropdownList}
                    contentContainerStyle={styles.dropdownListContent}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        handleFilterChange('mission_type', null);
                        setSelectedDropdown(null);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>All</Text>
                    </TouchableOpacity>
                    {options.missionTypes.map((type, index) => (
                      <View key={`missionType-${index}`}>
                        <View style={styles.dropdownSeparator} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            handleFilterChange('mission_type', type);
                            setSelectedDropdown(null);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
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
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
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
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
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
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
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
                selectionColor={theme.colors.focus}
                underlineColorAndroid={theme.colors.focus}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>RESET</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    zIndex: 1000,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingTop: getResponsivePadding(theme.spacing.lg),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: getResponsivePadding(theme.spacing.md),
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
    zIndex: 100,
  },
  filterContentContainer: {
    paddingBottom: getResponsivePadding(theme.spacing.xl),
  },
  filterSection: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    position: 'relative',
    zIndex: 1,
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
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
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 20,
    marginTop: getResponsivePadding(theme.spacing.xs),
  },
  dropdownList: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#374151',
    borderRadius: scale(8),
    maxHeight: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  dropdownListContent: {
    flexGrow: 1,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginHorizontal: getResponsivePadding(theme.spacing.md),
  },
  dropdownItem: {
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    backgroundColor: '#000000',
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '500',
    lineHeight: getResponsiveFontSize(theme.fontSizes.md) * 1.4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: getResponsivePadding(theme.spacing.md),
    paddingTop: getResponsivePadding(theme.spacing.lg),
    marginTop: getResponsivePadding(theme.spacing.md),
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

