import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { theme } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { scale, getResponsiveFontSize, getResponsivePadding, isSmallDevice, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../utils/responsive';

const LaunchDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const [launch, setLaunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  const tabs = ['OVERVIEW', 'LAUNCH SERVICE PROVIDER', 'ROCKET', 'MISSION', 'PAD', 'PAYLOADS', 'CREW', 'RECOVERY', 'HAZARDS', 'UPDATES', 'TIMELINE', 'MEDIA', 'STATISTICS', 'PROGRAM', 'PATCHES'];

  useEffect(() => {
    fetchLaunch();
  }, [id]);

  useEffect(() => {
    if (launch?.launch_date) {
      startCountdown(launch.launch_date);
    }
  }, [launch]);

  const fetchLaunch = async () => {
    try {
      const response = await api.get(`/launches/${id}`);
      const launchData = response.data;
      
      // Log received data for debugging
      console.log(`[Mobile] Launch Detail: Received launch data for ${launchData.name || 'Unknown'}`);
      console.log(`[Mobile] Array data counts - Updates: ${launchData.updates?.length || 0}, Timeline: ${launchData.timeline?.length || 0}, Patches: ${launchData.mission_patches?.length || 0}, Info URLs: ${launchData.info_urls?.length || 0}, Vid URLs: ${launchData.vid_urls?.length || 0}`);
      console.log(`[Mobile] Major objects - LSP: ${!!launchData.launch_service_provider}, Rocket: ${!!launchData.rocket}, Mission: ${!!launchData.mission}, Pad: ${!!launchData.pad}, Status: ${!!launchData.status}`);
      
      // Warn about empty arrays
      if (!launchData.updates || launchData.updates.length === 0) {
        console.warn(`[Mobile] Launch ${id}: No updates available`);
      }
      if (!launchData.timeline || launchData.timeline.length === 0) {
        console.warn(`[Mobile] Launch ${id}: No timeline available`);
      }
      if (!launchData.mission_patches || launchData.mission_patches.length === 0) {
        console.warn(`[Mobile] Launch ${id}: No mission patches available`);
      }
      
      // Log cache status
      if (launchData._cache) {
        console.log(`[Mobile] Cache status - Cached: ${launchData._cache.cached}, Age: ${launchData._cache.age_hours}h, Next refresh: ${launchData._cache.next_refresh}`);
      }
      
      setLaunch(launchData);
    } catch (error) {
      console.error('[Mobile] Error fetching launch:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (targetDate) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getImageUrl = () => {
    if (!launch) return null;
    // Use Space Devs API format (image object with image_url)
    if (launch.image?.image_url) return launch.image.image_url;
    if (launch.image_json?.image_url) return launch.image.image_url;
    if (launch.media?.image?.image_url) return launch.media.image.image_url;
    if (launch.mission?.image?.image_url) return launch.mission.image.image_url;
    if (launch.rocket?.configuration?.image_url) return launch.rocket.configuration.image_url;
    if (launch.mission_image_url) return launch.mission_image_url;
    if (launch.infographic?.image_url) return launch.infographic.image_url;
    if (launch.infographic_url) return launch.infographic_url;
    return null;
  };

  const getProviderName = () => {
    // Use Space Devs API format (launch_service_provider object)
    return launch?.launch_service_provider?.name || 
           launch?.launch_service_provider?.abbrev || 
           launch?.provider || 
           launch?.provider_abbrev || 
           launch?.launch_service_provider_json?.name || 
           'Unknown Provider';
  };

  const getLaunchName = () => {
    const name = launch?.name || 'Launch Name TBD';
    if (name.includes('|')) {
      const parts = name.split('|').map(part => part.trim());
      return {
        firstLine: parts[0] || '',
        secondLine: parts.slice(1).join(' | ') || '',
      };
    }
    return {
      firstLine: name,
      secondLine: '',
    };
  };

  const getLocation = () => {
    // Use Space Devs API format (pad.location object)
    const pad = launch?.pad?.name || launch?.pad_name || launch?.pad_json?.name || '';
    const location = launch?.pad?.location?.name || launch?.site || launch?.site_name || launch?.launch_site?.name || '';
    const country = launch?.pad?.location?.country_code || launch?.site_country || launch?.country_name || launch?.launch_site?.country || '';
    
    if (pad && location) {
      return `${pad} | ${location}${country ? `, ${country}` : ''}`;
    }
    return location || country || 'Location TBD';
  };

  const openUrl = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!launch) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Launch not found</Text>
        </View>
      </View>
    );
  }

  const imageUrl = getImageUrl();
  const dateTime = formatDate(launch.launch_date || launch.net);
  const launchName = getLaunchName();
  const countdownString = `${String(countdown.days).padStart(2, '0')}:${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`;
  const isUpcoming = launch.launch_date && new Date(launch.launch_date) > new Date();
  
  // Use Space Devs API format - these are already proper objects from the API
  const missionJson = launch.mission || launch.mission_json || {};
  const rocketJson = launch.rocket || launch.rocket_json || {};
  const padJson = launch.pad || launch.pad_json || {};
  const providerJson = launch.launch_service_provider || launch.launch_service_provider_json || {};

  // Helper function to safely convert values to strings (prevents React object rendering errors)
  const safeString = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      // If it's an object, try to get name, id, abbrev, or stringify
      return value.name || value.id || value.abbrev || JSON.stringify(value);
    }
    return String(value);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'OVERVIEW':
        const status = launch.status || launch.status_json || {};
        const mission = launch.mission || missionJson || {};
        
        return (
          <View style={styles.tabContent}>
            {/* Launch Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Launch Information</Text>
              
              {launch.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Launch ID:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.id)}</Text>
                </View>
              )}
              
              {launch.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.name)}</Text>
                </View>
              )}
              
              {launch.slug && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Slug:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.slug)}</Text>
                </View>
              )}
              
              {launch.launch_designator && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Launch Designator:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.launch_designator)}</Text>
                </View>
              )}
              
              {launch.url && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Launch URL:</Text>
                  <TouchableOpacity onPress={() => openUrl(launch.url)}>
                    <Text style={styles.linkText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {launch.response_mode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Response Mode:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.response_mode)}</Text>
                </View>
              )}
              
              {launch.last_updated && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Last Updated:</Text>
                  <Text style={styles.infoValue}>{formatDate(launch.last_updated)}</Text>
                </View>
              )}
              
              {status.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status ID:</Text>
                  <Text style={styles.infoValue}>{safeString(status.id)}</Text>
                </View>
              )}
              
              {status.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValue}>{safeString(status.name)}</Text>
                </View>
              )}
              
              {status.abbrev && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status Abbreviation:</Text>
                  <Text style={styles.infoValue}>{safeString(status.abbrev)}</Text>
                </View>
              )}
              
              {status.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status Description:</Text>
                  <Text style={styles.infoValue}>{safeString(status.description)}</Text>
                </View>
              )}
              
              {launch.net && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Launch Date (NET):</Text>
                  <Text style={styles.infoValue}>{formatDate(launch.net)}</Text>
                </View>
              )}
              
              {launch.net_precision && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>NET Precision:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.net_precision)}</Text>
                </View>
              )}
              
              {launch.window_start && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Window Start:</Text>
                  <Text style={styles.infoValue}>{formatDate(launch.window_start)}</Text>
                </View>
              )}
              
              {launch.window_end && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Window End:</Text>
                  <Text style={styles.infoValue}>{formatDate(launch.window_end)}</Text>
                </View>
              )}
              
              {launch.probability !== null && launch.probability !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Probability:</Text>
                  <Text style={styles.infoValue}>{launch.probability}%</Text>
                </View>
              )}
              
              {launch.webcast_live !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Webcast Live:</Text>
                  <Text style={styles.infoValue}>{launch.webcast_live ? 'Yes' : 'No'}</Text>
                </View>
              )}
              
              {launch.flightclub_url && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Flight Club URL:</Text>
                  <TouchableOpacity onPress={() => openUrl(launch.flightclub_url)}>
                    <Text style={styles.linkText}>View on Flight Club</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {launch.pad_turnaround && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pad Turnaround:</Text>
                  <Text style={styles.infoValue}>{safeString(launch.pad_turnaround)}</Text>
                </View>
              )}
            </View>

            {/* Launch Statistics */}
            {(launch.orbital_launch_attempt_count !== null || 
              launch.location_launch_attempt_count !== null ||
              launch.pad_launch_attempt_count !== null ||
              launch.agency_launch_attempt_count !== null ||
              launch.orbital_launch_attempt_count_year !== null ||
              launch.location_launch_attempt_count_year !== null ||
              launch.pad_launch_attempt_count_year !== null ||
              launch.agency_launch_attempt_count_year !== null) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Statistics</Text>
                
                {launch.orbital_launch_attempt_count !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Orbital Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.orbital_launch_attempt_count}</Text>
                  </View>
                )}
                
                {launch.location_launch_attempt_count !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.location_launch_attempt_count}</Text>
                  </View>
                )}
                
                {launch.pad_launch_attempt_count !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pad Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.pad_launch_attempt_count}</Text>
                  </View>
                )}
                
                {launch.agency_launch_attempt_count !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Agency Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.agency_launch_attempt_count}</Text>
                  </View>
                )}
                
                {launch.orbital_launch_attempt_count_year !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Orbital Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.orbital_launch_attempt_count_year}</Text>
                  </View>
                )}
                
                {launch.location_launch_attempt_count_year !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Location Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.location_launch_attempt_count_year}</Text>
                  </View>
                )}
                
                {launch.pad_launch_attempt_count_year !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Pad Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.pad_launch_attempt_count_year}</Text>
                  </View>
                )}
                
                {launch.agency_launch_attempt_count_year !== null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Agency Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.agency_launch_attempt_count_year}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Mission Description */}
            {(mission.description || launch.mission_description) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission Description</Text>
                <Text style={styles.sectionText}>
                  {mission.description || launch.mission_description}
                </Text>
              </View>
            )}

            {/* Mission Information Links */}
            {(mission.info_urls && mission.info_urls.length > 0) || (launch.info_urls && launch.info_urls.length > 0) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission Information</Text>
                {(mission.info_urls || launch.info_urls || []).map((urlObj, idx) => {
                  const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                  const label = typeof urlObj === 'object' ? (urlObj.description || urlObj.title || 'Information Link') : url;
                  return (
                  <TouchableOpacity key={idx} onPress={() => openUrl(url)}>
                      <Text style={styles.linkText}>{label}</Text>
                  </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Mission Videos */}
            {(mission.vid_urls && mission.vid_urls.length > 0) || (launch.vid_urls && launch.vid_urls.length > 0) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission Videos</Text>
                {(mission.vid_urls || launch.vid_urls || []).map((urlObj, idx) => {
                  const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                  const label = typeof urlObj === 'object' ? (urlObj.description || urlObj.title || 'Video Link') : url;
                  return (
                  <TouchableOpacity key={idx} onPress={() => openUrl(url)}>
                      <Text style={styles.linkText}>{label}</Text>
                  </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            {/* Programs */}
            {(launch.program && Array.isArray(launch.program) && launch.program.length > 0) || 
             (launch.program_json && Array.isArray(launch.program_json) && launch.program_json.length > 0) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Programs</Text>
                {(launch.program || launch.program_json || []).map((program, idx) => (
                  <View key={idx} style={styles.programItem}>
                    {program.name && <Text style={styles.programName}>{program.name}</Text>}
                    {program.description && <Text style={styles.programDesc}>{program.description}</Text>}
                  </View>
                ))}
              </View>
            ) : null}

            {/* Weather Concerns */}
            {(launch.weather_concerns || launch.weather_concerns_json) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weather Concerns</Text>
                <Text style={styles.sectionText}>
                  {typeof launch.weather_concerns === 'string' 
                    ? launch.weather_concerns 
                    : launch.weather_concerns_json?.description || 
                      (typeof launch.weather_concerns === 'object' ? JSON.stringify(launch.weather_concerns) : 'N/A')}
                </Text>
              </View>
            )}

            {/* Hashtag */}
            {(launch.hashtag || launch.hashtag_json) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Hashtag</Text>
                <Text style={styles.sectionText}>
                  {typeof launch.hashtag === 'string' 
                    ? launch.hashtag 
                    : launch.hashtag_json?.name || 
                      (typeof launch.hashtag === 'object' ? JSON.stringify(launch.hashtag) : 'N/A')}
                </Text>
              </View>
            )}

            {/* Launch Success Probability */}
            {launch.probability !== null && launch.probability !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Success Probability</Text>
                <View style={styles.probabilityContainer}>
                  <View style={styles.probabilityBar}>
                    <View style={[styles.probabilityFill, { width: `${launch.probability}%` }]} />
                  </View>
                  <Text style={styles.probabilityText}>{launch.probability}%</Text>
                </View>
              </View>
            )}

            {/* Failure Reason */}
            {launch.failreason && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Failure Reason</Text>
                <Text style={styles.sectionText}>{launch.failreason}</Text>
              </View>
            )}
          </View>
        );

      case 'UPDATES':
        return (
          <View style={styles.tabContent}>
            {launch.updates && launch.updates.length > 0 ? (
              launch.updates.map((update, idx) => (
                <View key={idx} style={styles.updateItem}>
                  <View style={styles.updateHeader}>
                    {update.profile_image && (
                      <Image 
                        source={{ uri: update.profile_image }} 
                        style={styles.updateAvatar}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.updateMeta}>
                      {update.created_by && (
                        <Text style={styles.updateAuthor}>{update.created_by}</Text>
                      )}
                      {update.created_on && (
                        <Text style={styles.updateDate}>
                          {new Date(update.created_on).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                  {update.comment && (
                    <Text style={styles.updateComment}>{update.comment}</Text>
                  )}
                  {update.info_url && (
                    <TouchableOpacity onPress={() => openUrl(update.info_url)}>
                      <Text style={styles.linkText}>Read more →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No updates available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'TIMELINE':
        return (
          <View style={styles.tabContent}>
            {launch.timeline && launch.timeline.length > 0 ? (
              launch.timeline.map((event, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    {event.type ? (
                      <>
                        {event.type.abbrev && (
                          <Text style={styles.timelineType}>{event.type.abbrev}</Text>
                        )}
                        {event.type.description && (
                          <Text style={styles.timelineDescription}>{event.type.description}</Text>
                        )}
                        {event.type.id && (
                          <Text style={styles.timelineDate}>Type ID: {safeString(event.type.id)}</Text>
                        )}
                      </>
                    ) : (
                      <Text style={styles.timelineType}>Timeline Event</Text>
                    )}
                    {event.title && (
                      <Text style={styles.timelineTitle}>{event.title}</Text>
                    )}
                    {event.description && (
                      <Text style={styles.timelineDescription}>{event.description}</Text>
                    )}
                    {event.net && (
                      <Text style={styles.timelineDate}>
                        {new Date(event.net).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                    {event.relative_time && (
                      <Text style={styles.timelineDate}>{event.relative_time}</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No timeline data available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'PATCHES':
        return (
          <View style={styles.tabContent}>
            {launch.mission_patches && launch.mission_patches.length > 0 ? (
              <View style={styles.patchesGrid}>
                {launch.mission_patches.map((patch, idx) => (
                  <View key={idx} style={styles.patchItem}>
                    {patch.image_url && (
                      <Image 
                        source={{ uri: patch.image_url }} 
                        style={styles.patchImage}
                        resizeMode="contain"
                      />
                    )}
                    {patch.name && (
                      <Text style={styles.patchName}>{patch.name}</Text>
                    )}
                    {patch.agency && (
                      <Text style={styles.patchAgency}>
                        {safeString(patch.agency.name) || safeString(patch.agency.abbrev)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="image-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No mission patches available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'MEDIA':
        const image = launch.image || {};
        const infographic = launch.infographic || {};
        const missionImage = missionJson?.image || {};
        const padImage = padJson?.image || {};
        
        return (
          <View style={styles.tabContent}>
            {/* Launch Image */}
            {image.image_url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Image</Text>
                <Image 
                  source={{ uri: image.image_url }} 
                  style={styles.infographicImage}
                  resizeMode="contain"
                />
                {image.credit && (
                  <Text style={styles.imageCredit}>Credit: {image.credit}</Text>
                )}
              </View>
            )}

            {/* Mission Image */}
            {missionImage.image_url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission Image</Text>
                <Image 
                  source={{ uri: missionImage.image_url }} 
                  style={styles.infographicImage}
                  resizeMode="contain"
                />
                {missionImage.credit && (
                  <Text style={styles.imageCredit}>Credit: {missionImage.credit}</Text>
                )}
              </View>
            )}

            {/* Pad Image */}
            {padImage.image_url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Pad Image</Text>
                <Image 
                  source={{ uri: padImage.image_url }} 
                  style={styles.infographicImage}
                  resizeMode="contain"
                />
                {padImage.credit && (
                  <Text style={styles.imageCredit}>Credit: {padImage.credit}</Text>
                )}
              </View>
            )}

            {/* Infographic */}
            {infographic.image_url && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Infographic</Text>
                <Image 
                  source={{ uri: infographic.image_url }} 
                  style={styles.infographicImage}
                  resizeMode="contain"
                />
                {infographic.credit && (
                  <Text style={styles.imageCredit}>Credit: {infographic.credit}</Text>
                )}
              </View>
            )}

            {/* Video URLs */}
            {launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Videos</Text>
                {launch.vid_urls.map((urlObj, idx) => {
                  const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                  const title = typeof urlObj === 'object' ? urlObj.title : null;
                  const description = typeof urlObj === 'object' ? urlObj.description : null;
                  const publisher = typeof urlObj === 'object' ? urlObj.publisher : null;
                  const featureImage = typeof urlObj === 'object' ? urlObj.feature_image : null;
                  const live = typeof urlObj === 'object' ? urlObj.live : false;
                  const source = typeof urlObj === 'object' ? urlObj.source : null;
                  const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                  const type = typeof urlObj === 'object' ? urlObj.type : null;
                  const language = typeof urlObj === 'object' ? urlObj.language : null;
                  
                  return (
                    <View key={idx} style={styles.payloadItem}>
                      {featureImage && (
                        <Image 
                          source={{ uri: featureImage }} 
                          style={styles.infographicImage}
                          resizeMode="contain"
                        />
                      )}
                      <TouchableOpacity onPress={() => openUrl(url)}>
                        <Text style={[styles.linkText, { fontSize: getResponsiveFontSize(theme.fontSizes.md), marginBottom: getResponsivePadding(theme.spacing.xs) }]}>
                          {title || url}
                        </Text>
                      </TouchableOpacity>
                      {description && (
                        <Text style={styles.descriptionText}>{description}</Text>
                      )}
                      <View style={styles.infoRow}>
                        {publisher && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Publisher:</Text>
                            <Text style={styles.infoValue}>{safeString(publisher)}</Text>
                          </View>
                        )}
                        {source && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Source:</Text>
                            <Text style={styles.infoValue}>{safeString(source)}</Text>
                          </View>
                        )}
                        {priority !== null && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Priority:</Text>
                            <Text style={styles.infoValue}>{priority}</Text>
                          </View>
                        )}
                        {type && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Type:</Text>
                            <Text style={styles.infoValue}>{safeString(type)}</Text>
                          </View>
                        )}
                        {language && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Language:</Text>
                            <Text style={styles.infoValue}>{safeString(language)}</Text>
                          </View>
                        )}
                        {live && (
                          <View style={styles.infoItem}>
                            <Text style={[styles.infoValue, { color: '#EF4444', fontWeight: 'bold' }]}>LIVE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Info URLs */}
            {launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Information Links</Text>
                {launch.info_urls.map((urlObj, idx) => {
                  const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                  const title = typeof urlObj === 'object' ? urlObj.title : null;
                  const description = typeof urlObj === 'object' ? urlObj.description : null;
                  const source = typeof urlObj === 'object' ? urlObj.source : null;
                  const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                  const type = typeof urlObj === 'object' ? urlObj.type : null;
                  const language = typeof urlObj === 'object' ? urlObj.language : null;
                  
                  return (
                    <View key={idx} style={styles.payloadItem}>
                      <TouchableOpacity onPress={() => openUrl(url)}>
                        <Text style={[styles.linkText, { fontSize: getResponsiveFontSize(theme.fontSizes.md), marginBottom: getResponsivePadding(theme.spacing.xs) }]}>
                          {title || url}
                        </Text>
                      </TouchableOpacity>
                      {description && (
                        <Text style={styles.descriptionText}>{description}</Text>
                      )}
                      <View style={styles.infoRow}>
                        {source && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Source:</Text>
                            <Text style={styles.infoValue}>{safeString(source)}</Text>
                          </View>
                        )}
                        {priority !== null && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Priority:</Text>
                            <Text style={styles.infoValue}>{priority}</Text>
                          </View>
                        )}
                        {type && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Type:</Text>
                            <Text style={styles.infoValue}>{safeString(type)}</Text>
                          </View>
                        )}
                        {language && (
                          <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Language:</Text>
                            <Text style={styles.infoValue}>{safeString(language)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {!image.image_url && !missionImage.image_url && !padImage.image_url && !infographic.image_url && 
             (!launch.vid_urls || launch.vid_urls.length === 0) && 
             (!launch.info_urls || launch.info_urls.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="albums-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No media available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'PROGRAM':
        return (
          <View style={styles.tabContent}>
            {launch.program && Array.isArray(launch.program) && launch.program.length > 0 ? (
              launch.program.map((program, idx) => (
                <View key={idx} style={styles.programCard}>
                  {program.image_url && (
                    <Image 
                      source={{ uri: program.image_url }} 
                      style={styles.programImage}
                      resizeMode="cover"
                    />
                  )}
                  {program.name && (
                    <Text style={styles.programCardName}>{program.name}</Text>
                  )}
                  {program.description && (
                    <Text style={styles.programCardDesc}>{program.description}</Text>
                  )}
                  {program.agencies && program.agencies.length > 0 && (
                    <View style={styles.programAgencies}>
                      <Text style={styles.programAgenciesTitle}>Agencies:</Text>
                      {program.agencies.map((agency, agIdx) => (
                        <Text key={agIdx} style={styles.programAgencyName}>
                          • {agency.name}
                        </Text>
                      ))}
                    </View>
                  )}
                  {program.start_date && (
                    <Text style={styles.programDate}>
                      Started: {new Date(program.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  )}
                  {program.end_date && (
                    <Text style={styles.programDate}>
                      Ended: {new Date(program.end_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  )}
                  {program.info_url && (
                    <TouchableOpacity onPress={() => openUrl(program.info_url)}>
                      <Text style={styles.linkText}>More Information →</Text>
                    </TouchableOpacity>
                  )}
                  {program.url && (
                    <TouchableOpacity onPress={() => openUrl(program.url)}>
                      <Text style={styles.linkText}>Program URL →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="rocket-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>This launch is not part of any program</Text>
              </View>
            )}
          </View>
        );

      case 'PAYLOADS':
        return (
          <View style={styles.tabContent}>
            {launch.payloads && launch.payloads.length > 0 ? (
              launch.payloads.map((payload, idx) => (
                <View key={idx} style={styles.payloadItem}>
                  <Text style={styles.itemTitle}>{payload.name || 'Unnamed Payload'}</Text>
                  <View style={styles.infoRow}>
                    {payload.type && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Type:</Text>
                        <Text style={styles.infoValue}>{payload.type}</Text>
                      </View>
                    )}
                    {payload.mass_kg && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Mass:</Text>
                        <Text style={styles.infoValue}>{payload.mass_kg} kg</Text>
                      </View>
                    )}
                    {payload.orbit && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Orbit:</Text>
                        <Text style={styles.infoValue}>{payload.orbit}</Text>
                      </View>
                    )}
                    {payload.nationality && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Nationality:</Text>
                        <Text style={styles.infoValue}>{payload.nationality}</Text>
                      </View>
                    )}
                    {payload.manufacturer && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Manufacturer:</Text>
                        <Text style={styles.infoValue}>{payload.manufacturer}</Text>
                      </View>
                    )}
                    {payload.customers && Array.isArray(payload.customers) && payload.customers.length > 0 && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Customers:</Text>
                        <Text style={styles.infoValue}>{payload.customers.join(', ')}</Text>
                      </View>
                    )}
                  </View>
                  {payload.description && (
                    <Text style={styles.descriptionText}>{payload.description}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No payload information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'CREW':
        return (
          <View style={styles.tabContent}>
            {launch.crew && launch.crew.length > 0 ? (
              launch.crew.map((member, idx) => (
                <View key={idx} style={styles.crewItem}>
                  <Text style={styles.itemTitle}>{member.name || 'Unknown'}</Text>
                  <View style={styles.infoRow}>
                    {member.role && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Role:</Text>
                        <Text style={styles.infoValue}>{member.role}</Text>
                      </View>
                    )}
                    {member.nationality && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Nationality:</Text>
                        <Text style={styles.infoValue}>{member.nationality}</Text>
                      </View>
                    )}
                    {member.date_of_birth && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Date of Birth:</Text>
                        <Text style={styles.infoValue}>{member.date_of_birth}</Text>
                      </View>
                    )}
                    {member.flights_count !== null && member.flights_count !== undefined && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Flights:</Text>
                        <Text style={styles.infoValue}>{member.flights_count}</Text>
                      </View>
                    )}
                  </View>
                  {member.bio && (
                    <Text style={styles.descriptionText}>{member.bio}</Text>
                  )}
                  {member.wiki_url && (
                    <TouchableOpacity onPress={() => openUrl(member.wiki_url)}>
                      <Text style={styles.linkText}>Learn More →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No crew information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'ROCKET':
        const rocket = rocketJson || {};
        const rocketConfig = rocket.configuration || {};
        const rocketManufacturer = rocketConfig.manufacturer || {};
        
        return (
          <View style={styles.tabContent}>
            {rocketConfig && Object.keys(rocketConfig).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rocket Information</Text>
                
                {/* Configuration Image */}
                {rocketConfig.image?.image_url && (
                  <View style={styles.imageSection}>
                    <Image 
                      source={{ uri: rocketConfig.image.image_url }} 
                      style={styles.rocketImage}
                      resizeMode="contain"
                    />
                    {rocketConfig.image.credit && (
                      <Text style={styles.imageCredit}>Credit: {rocketConfig.image.credit}</Text>
                    )}
                  </View>
                )}

                <Text style={styles.subSectionTitle}>Rocket Configuration</Text>
                <View style={styles.infoRow}>
                  {rocket.id && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Rocket ID:</Text>
                      <Text style={styles.infoValue}>{safeString(rocket.id)}</Text>
                    </View>
                  )}
                  {(rocketConfig.name || rocket.name) && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.name || rocket.name)}</Text>
                    </View>
                  )}
                  {rocketConfig.id && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Configuration ID:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.id)}</Text>
                    </View>
                  )}
                  {rocketConfig.full_name && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Full Name:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.full_name)}</Text>
                    </View>
                  )}
                  {rocketConfig.url && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Configuration URL:</Text>
                      <TouchableOpacity onPress={() => openUrl(rocketConfig.url)}>
                        <Text style={styles.linkText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {rocketConfig.response_mode && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Response Mode:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.response_mode)}</Text>
                    </View>
                  )}
                </View>

                {/* Manufacturer Section */}
                {rocketManufacturer && Object.keys(rocketManufacturer).length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Manufacturer</Text>
                    {(rocketManufacturer.logo?.image_url || rocketManufacturer.image?.image_url) && (
                      <View style={styles.imageSection}>
                        {rocketManufacturer.logo?.image_url && (
                          <View style={styles.imageContainer}>
                            <Text style={styles.imageLabel}>Logo</Text>
                            <Image 
                              source={{ uri: rocketManufacturer.logo.image_url }} 
                              style={styles.providerImage}
                              resizeMode="contain"
                            />
                            {rocketManufacturer.logo.credit && (
                              <Text style={styles.imageCredit}>Credit: {rocketManufacturer.logo.credit}</Text>
                            )}
                          </View>
                        )}
                        {rocketManufacturer.image?.image_url && (
                          <View style={styles.imageContainer}>
                            <Text style={styles.imageLabel}>Image</Text>
                            <Image 
                              source={{ uri: rocketManufacturer.image.image_url }} 
                              style={styles.providerImage}
                              resizeMode="contain"
                            />
                            {rocketManufacturer.image.credit && (
                              <Text style={styles.imageCredit}>Credit: {rocketManufacturer.image.credit}</Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                    <View style={styles.infoRow}>
                      {rocketManufacturer.name && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Name:</Text>
                          <Text style={styles.infoValue}>{safeString(rocketManufacturer.name)}</Text>
                        </View>
                      )}
                      {rocketManufacturer.abbrev && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Abbreviation:</Text>
                          <Text style={styles.infoValue}>{safeString(rocketManufacturer.abbrev)}</Text>
                        </View>
                      )}
                      {rocketManufacturer.type && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Type:</Text>
                          <Text style={styles.infoValue}>{safeString(rocketManufacturer.type)}</Text>
                        </View>
                      )}
                      {rocketManufacturer.country && Array.isArray(rocketManufacturer.country) && rocketManufacturer.country.length > 0 && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Country:</Text>
                          <Text style={styles.infoValue}>
                            {rocketManufacturer.country.map(c => safeString(c.name) || safeString(c.alpha_2_code) || safeString(c)).filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      )}
                      {rocketManufacturer.founding_year && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Founded:</Text>
                          <Text style={styles.infoValue}>{String(rocketManufacturer.founding_year)}</Text>
                        </View>
                      )}
                      {rocketManufacturer.administrator && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Administrator:</Text>
                          <Text style={styles.infoValue}>{safeString(rocketManufacturer.administrator)}</Text>
                        </View>
                      )}
                    </View>
                    {rocketManufacturer.description && (
                      <Text style={styles.descriptionText}>{safeString(rocketManufacturer.description)}</Text>
                    )}
                    {(rocketManufacturer.url || rocketManufacturer.info_url || rocketManufacturer.wiki_url) && (
                      <View style={styles.urlSection}>
                        {rocketManufacturer.url && (
                          <TouchableOpacity onPress={() => openUrl(rocketManufacturer.url)}>
                            <Text style={styles.linkText}>Manufacturer URL →</Text>
                          </TouchableOpacity>
                        )}
                        {rocketManufacturer.info_url && (
                          <TouchableOpacity onPress={() => openUrl(rocketManufacturer.info_url)}>
                            <Text style={styles.linkText}>More Information →</Text>
                          </TouchableOpacity>
                        )}
                        {rocketManufacturer.wiki_url && (
                          <TouchableOpacity onPress={() => openUrl(rocketManufacturer.wiki_url)}>
                            <Text style={styles.linkText}>Wikipedia →</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Families Array */}
                {rocketConfig.families && Array.isArray(rocketConfig.families) && rocketConfig.families.length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Families</Text>
                    {rocketConfig.families.map((family, idx) => (
                      <View key={idx} style={styles.familyItem}>
                        <Text style={styles.familyName}>{safeString(family.name) || 'Unknown Family'}</Text>
                        {family.manufacturer && Array.isArray(family.manufacturer) && family.manufacturer.length > 0 && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Manufacturers: </Text>
                            {family.manufacturer.map((m, mIdx) => (
                              <Text key={mIdx}>
                                {safeString(m.name) || safeString(m.abbrev) || safeString(m)}
                                {mIdx < family.manufacturer.length - 1 ? ', ' : ''}
                              </Text>
                            ))}
                          </Text>
                        )}
                        {family.parent && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Parent: </Text>
                            {safeString(family.parent.name) || safeString(family.parent)}
                          </Text>
                        )}
                        {family.description && (
                          <Text style={styles.familyDetail}>{safeString(family.description)}</Text>
                        )}
                        {family.active !== undefined && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Active: </Text>
                            {family.active ? 'Yes' : 'No'}
                          </Text>
                        )}
                        {family.maiden_flight && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Maiden Flight: </Text>
                            {safeString(family.maiden_flight)}
                          </Text>
                        )}
                        {family.total_launch_count !== null && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Total Launches: </Text>
                            {family.total_launch_count}
                          </Text>
                        )}
                        {family.successful_launches !== null && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Successful: </Text>
                            {family.successful_launches}
                          </Text>
                        )}
                        {family.failed_launches !== null && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Failed: </Text>
                            {family.failed_launches}
                          </Text>
                        )}
                        {family.consecutive_successful_launches !== null && (
                          <Text style={styles.familyDetail}>
                            <Text style={styles.familyLabel}>Consecutive Successful: </Text>
                            {family.consecutive_successful_launches}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Configuration Fields */}
                {!rocketConfig.families && rocketConfig.family && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Family:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.family)}</Text>
                    </View>
                    </View>
                  )}
                <View style={styles.infoRow}>
                  {rocketConfig.variant && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Variant:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.variant)}</Text>
                    </View>
                  )}
                  {rocketConfig.length && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Length:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.length)} m</Text>
                    </View>
                  )}
                  {rocketConfig.diameter && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Diameter:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.diameter)} m</Text>
                    </View>
                  )}
                  {rocketConfig.maiden_flight && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Maiden Flight:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.maiden_flight)}</Text>
                    </View>
                  )}
                  {rocketConfig.launch_cost && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Launch Cost:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.launch_cost)}</Text>
                </View>
                  )}
                  {rocketConfig.launch_mass && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Launch Mass:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.launch_mass)} kg</Text>
                    </View>
                  )}
                  {rocketConfig.leo_capacity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>LEO Capacity:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.leo_capacity)} kg</Text>
                    </View>
                  )}
                  {rocketConfig.gto_capacity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>GTO Capacity:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.gto_capacity)} kg</Text>
                    </View>
                  )}
                  {rocketConfig.geo_capacity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>GEO Capacity:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.geo_capacity)} kg</Text>
                    </View>
                  )}
                  {rocketConfig.sso_capacity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>SSO Capacity:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.sso_capacity)} kg</Text>
                    </View>
                  )}
                  {rocketConfig.active !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Active:</Text>
                      <Text style={styles.infoValue}>{rocketConfig.active ? 'Yes' : 'No'}</Text>
                    </View>
                  )}
                  {rocketConfig.is_placeholder !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Is Placeholder:</Text>
                      <Text style={styles.infoValue}>{rocketConfig.is_placeholder ? 'Yes' : 'No'}</Text>
                    </View>
                  )}
                  {rocketConfig.fastest_turnaround && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Fastest Turnaround:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.fastest_turnaround)}</Text>
                    </View>
                  )}
                  {rocketConfig.reusable !== null && rocketConfig.reusable !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Reusable:</Text>
                      <Text style={styles.infoValue}>{rocketConfig.reusable ? 'Yes' : 'No'}</Text>
                    </View>
                  )}
                  {rocketConfig.alias && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Alias:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.alias)}</Text>
                    </View>
                  )}
                  {rocketConfig.min_stage !== null && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Min Stages:</Text>
                      <Text style={styles.infoValue}>{rocketConfig.min_stage}</Text>
                    </View>
                  )}
                  {rocketConfig.max_stage !== null && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Max Stages:</Text>
                      <Text style={styles.infoValue}>{rocketConfig.max_stage}</Text>
                    </View>
                  )}
                  {rocketConfig.to_thrust && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Thrust:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.to_thrust)}</Text>
                    </View>
                  )}
                  {rocketConfig.apogee && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Apogee:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.apogee)}</Text>
                    </View>
                  )}
                  {rocketConfig.vehicle_range && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Vehicle Range:</Text>
                      <Text style={styles.infoValue}>{safeString(rocketConfig.vehicle_range)}</Text>
                    </View>
                  )}
                </View>

                {/* Statistics Section */}
                {(rocketConfig.total_launch_count !== null || rocketConfig.successful_launches !== null || rocketConfig.failed_launches !== null || rocketConfig.pending_launches !== null || rocketConfig.consecutive_successful_launches !== null) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Launch Statistics</Text>
                    <View style={styles.infoRow}>
                      {rocketConfig.total_launch_count !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Total Launches:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.total_launch_count}</Text>
                        </View>
                      )}
                      {rocketConfig.successful_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful Launches:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.successful_launches}</Text>
                        </View>
                      )}
                      {rocketConfig.failed_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed Launches:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.failed_launches}</Text>
                        </View>
                      )}
                      {rocketConfig.pending_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Pending Launches:</Text>
                          <Text style={[styles.infoValue, { color: '#F59E0B' }]}>{rocketConfig.pending_launches}</Text>
                        </View>
                      )}
                      {rocketConfig.consecutive_successful_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Consecutive Successful:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.consecutive_successful_launches}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Landing Statistics */}
                {(rocketConfig.attempted_landings !== null || rocketConfig.successful_landings !== null || rocketConfig.failed_landings !== null || rocketConfig.consecutive_successful_landings !== null) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Landing Statistics</Text>
                    <View style={styles.infoRow}>
                      {rocketConfig.attempted_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Attempted:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.attempted_landings}</Text>
                        </View>
                      )}
                      {rocketConfig.successful_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful:</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{rocketConfig.successful_landings}</Text>
                        </View>
                      )}
                      {rocketConfig.failed_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed:</Text>
                          <Text style={[styles.infoValue, { color: '#EF4444' }]}>{rocketConfig.failed_landings}</Text>
                        </View>
                      )}
                      {rocketConfig.consecutive_successful_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Consecutive Successful:</Text>
                          <Text style={styles.infoValue}>{rocketConfig.consecutive_successful_landings}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Program Array */}
                {rocketConfig.program && Array.isArray(rocketConfig.program) && rocketConfig.program.length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Programs</Text>
                    {rocketConfig.program.map((prog, idx) => (
                      <Text key={idx} style={styles.programName}>
                        {safeString(prog.name) || safeString(prog.id) || 'Program'}
                      </Text>
                    ))}
                  </View>
                )}

                {rocketConfig.description && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{safeString(rocketConfig.description)}</Text>
                  </View>
                )}

                {/* Stage Information */}
                {(rocket.launcher_stage || rocket.spacecraft_stage) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Stage Information</Text>
                    <View style={styles.infoRow}>
                      {rocket.launcher_stage && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Launcher Stage:</Text>
                          <Text style={styles.infoValue}>
                            {typeof rocket.launcher_stage === 'object' 
                              ? JSON.stringify(rocket.launcher_stage) 
                              : safeString(rocket.launcher_stage)}
                          </Text>
                        </View>
                      )}
                      {rocket.spacecraft_stage && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Spacecraft Stage:</Text>
                          <Text style={styles.infoValue}>
                            {typeof rocket.spacecraft_stage === 'object' 
                              ? JSON.stringify(rocket.spacecraft_stage) 
                              : safeString(rocket.spacecraft_stage)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* URLs */}
                {(rocketConfig.url || rocketConfig.info_url || rocketConfig.image_url) && (
                  <View style={styles.urlSection}>
                    {rocketConfig.url && (
                      <TouchableOpacity onPress={() => openUrl(rocketConfig.url)}>
                        <Text style={styles.linkText}>Configuration URL →</Text>
                      </TouchableOpacity>
                    )}
                    {rocketConfig.info_url && (
                      <TouchableOpacity onPress={() => openUrl(rocketConfig.info_url)}>
                    <Text style={styles.linkText}>More Information →</Text>
                  </TouchableOpacity>
                    )}
                    {rocketConfig.image_url && (
                      <TouchableOpacity onPress={() => openUrl(rocketConfig.image_url)}>
                        <Text style={styles.linkText}>View Image →</Text>
                  </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : launch.rocket ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rocket</Text>
                <Text style={styles.infoValue}>{safeString(launch.rocket)}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="rocket-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No rocket information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'MISSION':
        const missionData = missionJson || {};
        const missionOrbit = missionData.orbit || {};
        const missionCelestialBody = missionOrbit.celestial_body || {};
        
        return (
          <View style={styles.tabContent}>
            {missionData.name || missionData.id || missionData.description || Object.keys(missionData).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Mission Information</Text>
                
                {/* Mission Image */}
                {missionData.image?.image_url && (
                  <View style={styles.imageSection}>
                    <Image 
                      source={{ uri: missionData.image.image_url }} 
                      style={styles.rocketImage}
                      resizeMode="contain"
                    />
                    {missionData.image.credit && (
                      <Text style={styles.imageCredit}>Credit: {missionData.image.credit}</Text>
                    )}
              </View>
            )}

            <View style={styles.infoRow}>
                  {missionData.id && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Mission ID:</Text>
                      <Text style={styles.infoValue}>{safeString(missionData.id)}</Text>
                    </View>
                  )}
                  {missionData.name && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Mission Name:</Text>
                      <Text style={styles.infoValue}>{safeString(missionData.name)}</Text>
                    </View>
                  )}
                  {missionData.type && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mission Type:</Text>
                      <Text style={styles.infoValue}>{safeString(missionData.type)}</Text>
                </View>
              )}
                  {missionOrbit.id && (
                <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Orbit ID:</Text>
                      <Text style={styles.infoValue}>{safeString(missionOrbit.id)}</Text>
                </View>
              )}
                  {missionOrbit.name && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Orbit Name:</Text>
                      <Text style={styles.infoValue}>{safeString(missionOrbit.name)}</Text>
                </View>
              )}
                  {missionOrbit.abbrev && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Orbit Code:</Text>
                      <Text style={styles.infoValue}>{safeString(missionOrbit.abbrev)}</Text>
                </View>
              )}
                  {missionCelestialBody.name && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Celestial Body:</Text>
                      <Text style={styles.infoValue}>{safeString(missionCelestialBody.name)}</Text>
            </View>
                  )}
                  {missionCelestialBody.type && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Body Type:</Text>
                      <Text style={styles.infoValue}>
                        {typeof missionCelestialBody.type === 'object' 
                          ? safeString(missionCelestialBody.type.name) || safeString(missionCelestialBody.type)
                          : safeString(missionCelestialBody.type)}
                      </Text>
                    </View>
                  )}
                </View>

                {missionData.description && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Mission Description</Text>
                    <Text style={styles.descriptionText}>{safeString(missionData.description)}</Text>
                  </View>
                )}

                {/* Mission Agencies */}
                {missionData.agencies && Array.isArray(missionData.agencies) && missionData.agencies.length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Mission Agencies</Text>
                    {missionData.agencies.map((agency, idx) => (
                  <View key={idx} style={styles.agencyItem}>
                        {/* Agency Logo/Image */}
                        {(agency.logo?.image_url || agency.image?.image_url) && (
                          <View style={styles.imageSection}>
                            {agency.logo?.image_url && (
                              <View style={styles.imageContainer}>
                                <Text style={styles.imageLabel}>Logo</Text>
                                <Image 
                                  source={{ uri: agency.logo.image_url }} 
                                  style={styles.providerImage}
                                  resizeMode="contain"
                                />
                                {agency.logo.credit && (
                                  <Text style={styles.imageCredit}>Credit: {agency.logo.credit}</Text>
                                )}
                              </View>
                            )}
                            {agency.image?.image_url && (
                              <View style={styles.imageContainer}>
                                <Text style={styles.imageLabel}>Image</Text>
                                <Image 
                                  source={{ uri: agency.image.image_url }} 
                                  style={styles.providerImage}
                                  resizeMode="contain"
                                />
                                {agency.image.credit && (
                                  <Text style={styles.imageCredit}>Credit: {agency.image.credit}</Text>
                                )}
                              </View>
                            )}
                          </View>
                        )}

                        <View style={styles.infoRow}>
                          {agency.id && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Agency ID:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.id)}</Text>
                            </View>
                          )}
                          {agency.name && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Name:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.name)}</Text>
                            </View>
                          )}
                          {agency.abbrev && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Abbreviation:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.abbrev)}</Text>
                            </View>
                          )}
                          {agency.type && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Type:</Text>
                              <Text style={styles.infoValue}>
                                {typeof agency.type === 'object' 
                                  ? safeString(agency.type.name) || safeString(agency.type)
                                  : safeString(agency.type)}
                              </Text>
                            </View>
                          )}
                          {agency.country && Array.isArray(agency.country) && agency.country.length > 0 && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Country:</Text>
                              <Text style={styles.infoValue}>
                                {agency.country.map(c => safeString(c.name) || safeString(c.alpha_2_code) || safeString(c)).filter(Boolean).join(', ')}
                              </Text>
                            </View>
                          )}
                          {agency.founding_year && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Founded:</Text>
                              <Text style={styles.infoValue}>{String(agency.founding_year)}</Text>
                            </View>
                          )}
                          {agency.administrator && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Administrator:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.administrator)}</Text>
                            </View>
                          )}
                          {agency.launchers && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Launchers:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.launchers)}</Text>
                            </View>
                          )}
                          {agency.spacecraft && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Spacecraft:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.spacecraft)}</Text>
                            </View>
                          )}
                          {agency.featured !== undefined && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Featured:</Text>
                              <Text style={styles.infoValue}>{agency.featured ? 'Yes' : 'No'}</Text>
                            </View>
                          )}
                          {agency.response_mode && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Response Mode:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.response_mode)}</Text>
                            </View>
                          )}
                          {agency.parent && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Parent Agency:</Text>
                              <Text style={styles.infoValue}>
                                {typeof agency.parent === 'object' 
                                  ? (safeString(agency.parent.name) || safeString(agency.parent.abbrev) || 'N/A')
                                  : safeString(agency.parent)}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Agency Statistics */}
                        {(agency.total_launch_count !== null || agency.successful_launches !== null || agency.failed_launches !== null || agency.pending_launches !== null || agency.consecutive_successful_launches !== null) && (
                          <View style={styles.subSection}>
                            <Text style={styles.subSectionTitle}>Statistics</Text>
                            <View style={styles.infoRow}>
                              {agency.total_launch_count !== null && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Total Launches:</Text>
                                  <Text style={styles.infoValue}>{agency.total_launch_count}</Text>
                                </View>
                              )}
                              {agency.successful_launches !== null && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Successful:</Text>
                                  <Text style={[styles.infoValue, { color: '#10B981' }]}>{agency.successful_launches}</Text>
                                </View>
                              )}
                              {agency.failed_launches !== null && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Failed:</Text>
                                  <Text style={[styles.infoValue, { color: '#EF4444' }]}>{agency.failed_launches}</Text>
                                </View>
                              )}
                              {agency.pending_launches !== null && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Pending:</Text>
                                  <Text style={[styles.infoValue, { color: '#F59E0B' }]}>{agency.pending_launches}</Text>
                                </View>
                              )}
                              {agency.consecutive_successful_launches !== null && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Consecutive Successful:</Text>
                                  <Text style={styles.infoValue}>{agency.consecutive_successful_launches}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        )}

                        {agency.description && (
                          <Text style={styles.descriptionText}>{safeString(agency.description)}</Text>
                        )}

                        {/* Agency URLs */}
                        {(agency.url || agency.info_url || agency.wiki_url) && (
                          <View style={styles.urlSection}>
                            {agency.url && (
                              <TouchableOpacity onPress={() => openUrl(agency.url)}>
                                <Text style={styles.linkText}>Agency URL →</Text>
                              </TouchableOpacity>
                            )}
                            {agency.info_url && (
                              <TouchableOpacity onPress={() => openUrl(agency.info_url)}>
                                <Text style={styles.linkText}>More Information →</Text>
                              </TouchableOpacity>
                            )}
                            {agency.wiki_url && (
                              <TouchableOpacity onPress={() => openUrl(agency.wiki_url)}>
                                <Text style={styles.linkText}>Wikipedia →</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                  </View>
                ))}
              </View>
            )}

                {/* Mission Information URLs */}
                {((launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0) || 
                  (missionData.info_urls && Array.isArray(missionData.info_urls) && missionData.info_urls.length > 0)) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Mission Information URLs</Text>
                    {[
                      ...(launch.info_urls && Array.isArray(launch.info_urls) && launch.info_urls.length > 0 ? launch.info_urls : []),
                      ...(missionData.info_urls && Array.isArray(missionData.info_urls) && missionData.info_urls.length > 0 ? missionData.info_urls : [])
                    ].map((urlObj, idx) => {
                      const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                      const title = typeof urlObj === 'object' ? urlObj.title : null;
                      const description = typeof urlObj === 'object' ? urlObj.description : null;
                      const source = typeof urlObj === 'object' ? urlObj.source : null;
                      const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                      const type = typeof urlObj === 'object' ? urlObj.type : null;
                      const language = typeof urlObj === 'object' ? urlObj.language : null;
                      
                      return (
                        <View key={idx} style={styles.payloadItem}>
                          <TouchableOpacity onPress={() => openUrl(url)}>
                            <Text style={[styles.linkText, { fontSize: getResponsiveFontSize(theme.fontSizes.md), marginBottom: getResponsivePadding(theme.spacing.xs) }]}>
                              {title || url}
                            </Text>
                          </TouchableOpacity>
                          {description && (
                            <Text style={styles.descriptionText}>{description}</Text>
                          )}
                          <View style={styles.infoRow}>
                            {source && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Source:</Text>
                                <Text style={styles.infoValue}>{safeString(source)}</Text>
                              </View>
                            )}
                            {priority !== null && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Priority:</Text>
                                <Text style={styles.infoValue}>{priority}</Text>
                              </View>
                            )}
                            {type && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Type:</Text>
                                <Text style={styles.infoValue}>{safeString(type)}</Text>
                              </View>
                            )}
                            {language && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Language:</Text>
                                <Text style={styles.infoValue}>{safeString(language)}</Text>
                              </View>
                            )}
                          </View>
          </View>
        );
                    })}
                  </View>
                )}

                {/* Mission Video URLs */}
                {((launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0) || 
                  (missionData.vid_urls && Array.isArray(missionData.vid_urls) && missionData.vid_urls.length > 0)) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Mission Video URLs</Text>
                    {[
                      ...(launch.vid_urls && Array.isArray(launch.vid_urls) && launch.vid_urls.length > 0 ? launch.vid_urls : []),
                      ...(missionData.vid_urls && Array.isArray(missionData.vid_urls) && missionData.vid_urls.length > 0 ? missionData.vid_urls : [])
                    ].map((urlObj, idx) => {
                      const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
                      const title = typeof urlObj === 'object' ? urlObj.title : null;
                      const description = typeof urlObj === 'object' ? urlObj.description : null;
                      const source = typeof urlObj === 'object' ? urlObj.source : null;
                      const priority = typeof urlObj === 'object' ? urlObj.priority : null;
                      const type = typeof urlObj === 'object' ? urlObj.type : null;
                      const language = typeof urlObj === 'object' ? urlObj.language : null;
                      
                      return (
                        <View key={idx} style={styles.payloadItem}>
                          <TouchableOpacity onPress={() => openUrl(url)}>
                            <Text style={[styles.linkText, { fontSize: getResponsiveFontSize(theme.fontSizes.md), marginBottom: getResponsivePadding(theme.spacing.xs) }]}>
                              {title || url}
                            </Text>
                          </TouchableOpacity>
                          {description && (
                            <Text style={styles.descriptionText}>{description}</Text>
                          )}
                          <View style={styles.infoRow}>
                            {source && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Source:</Text>
                                <Text style={styles.infoValue}>{safeString(source)}</Text>
                              </View>
                            )}
                            {priority !== null && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Priority:</Text>
                                <Text style={styles.infoValue}>{priority}</Text>
                              </View>
                            )}
                            {type && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Type:</Text>
                                <Text style={styles.infoValue}>{safeString(type)}</Text>
                              </View>
                            )}
                            {language && (
                              <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>Language:</Text>
                                <Text style={styles.infoValue}>{safeString(language)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="planet-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No mission information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'LAUNCH SERVICE PROVIDER':
        const providerName = safeString(providerJson.name);
        const providerAbbrev = safeString(providerJson.abbrev);
        const providerType = safeString(providerJson.type);
        const providerFounded = providerJson.founding_year ? String(providerJson.founding_year) : null;
        const providerDescription = safeString(providerJson.description);
        const providerId = safeString(providerJson.id);
        const providerCountry = providerJson.country && Array.isArray(providerJson.country) && providerJson.country.length > 0
          ? providerJson.country.map(c => safeString(c.name) || safeString(c.alpha_2_code) || safeString(c)).filter(Boolean).join(', ')
          : (providerJson.country_code ? safeString(providerJson.country_code) : null);
        const providerAdministrator = safeString(providerJson.administrator);
        const providerLaunchers = safeString(providerJson.launchers);
        const providerSpacecraft = safeString(providerJson.spacecraft);
        const providerFeatured = providerJson.featured !== undefined ? (providerJson.featured ? 'Yes' : 'No') : null;
        const providerResponseMode = safeString(providerJson.response_mode);
        const providerParent = providerJson.parent 
          ? (typeof providerJson.parent === 'object' ? (safeString(providerJson.parent.name) || safeString(providerJson.parent.abbrev) || 'N/A') : safeString(providerJson.parent))
          : null;
        const providerUrl = typeof providerJson.url === 'string' ? providerJson.url : null;
        const providerInfoUrl = typeof providerJson.info_url === 'string' ? providerJson.info_url : null;
        const providerWikiUrl = typeof providerJson.wiki_url === 'string' ? providerJson.wiki_url : null;

        return (
          <View style={styles.tabContent}>
            {providerName || Object.keys(providerJson).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Service Provider</Text>
                
                {/* Logo/Image Display */}
                {(providerJson.logo?.image_url || providerJson.image?.image_url || providerJson.social_logo?.image_url) && (
                  <View style={styles.imageSection}>
                    {providerJson.logo?.image_url && (
                      <View style={styles.imageContainer}>
                        <Text style={styles.imageLabel}>Logo</Text>
                        <Image 
                          source={{ uri: providerJson.logo.image_url }} 
                          style={styles.providerImage}
                          resizeMode="contain"
                        />
                        {providerJson.logo.credit && (
                          <Text style={styles.imageCredit}>Credit: {providerJson.logo.credit}</Text>
                        )}
                      </View>
                    )}
                    {providerJson.image?.image_url && (
                      <View style={styles.imageContainer}>
                        <Text style={styles.imageLabel}>Image</Text>
                        <Image 
                          source={{ uri: providerJson.image.image_url }} 
                          style={styles.providerImage}
                          resizeMode="contain"
                        />
                        {providerJson.image.credit && (
                          <Text style={styles.imageCredit}>Credit: {providerJson.image.credit}</Text>
                        )}
                      </View>
                    )}
                    {providerJson.social_logo?.image_url && (
                      <View style={styles.imageContainer}>
                        <Text style={styles.imageLabel}>Social Logo</Text>
                        <Image 
                          source={{ uri: providerJson.social_logo.image_url }} 
                          style={styles.providerImage}
                          resizeMode="contain"
                        />
                        {providerJson.social_logo.credit && (
                          <Text style={styles.imageCredit}>Credit: {providerJson.social_logo.credit}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.infoRow}>
                  {providerId && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>ID:</Text>
                      <Text style={styles.infoValue}>{providerId}</Text>
                    </View>
                  )}
                  {providerName && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Name:</Text>
                      <Text style={styles.infoValue}>{providerName}</Text>
                    </View>
                  )}
                  {providerAbbrev && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Abbreviation:</Text>
                      <Text style={styles.infoValue}>{providerAbbrev}</Text>
                    </View>
                  )}
                  {providerType && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Type:</Text>
                      <Text style={styles.infoValue}>{providerType}</Text>
                    </View>
                  )}
                  {providerCountry && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Country:</Text>
                      <Text style={styles.infoValue}>{providerCountry}</Text>
                    </View>
                  )}
                  {providerFounded && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Founded:</Text>
                      <Text style={styles.infoValue}>{providerFounded}</Text>
                    </View>
                  )}
                  {providerAdministrator && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Administrator:</Text>
                      <Text style={styles.infoValue}>{providerAdministrator}</Text>
                </View>
                  )}
                  {providerLaunchers && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Launchers:</Text>
                      <Text style={styles.infoValue}>{providerLaunchers}</Text>
                    </View>
                  )}
                  {providerSpacecraft && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Spacecraft:</Text>
                      <Text style={styles.infoValue}>{providerSpacecraft}</Text>
                    </View>
                  )}
                  {providerFeatured && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Featured:</Text>
                      <Text style={styles.infoValue}>{providerFeatured}</Text>
                    </View>
                  )}
                  {providerResponseMode && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Response Mode:</Text>
                      <Text style={styles.infoValue}>{providerResponseMode}</Text>
                    </View>
                  )}
                  {providerParent && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Parent Agency:</Text>
                      <Text style={styles.infoValue}>{providerParent}</Text>
                    </View>
                  )}
                </View>

                {/* Statistics Section */}
                {(providerJson.total_launch_count !== null || providerJson.successful_launches !== null || providerJson.failed_launches !== null || providerJson.pending_launches !== null || providerJson.consecutive_successful_launches !== null) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Launch Statistics</Text>
                    <View style={styles.infoRow}>
                      {providerJson.total_launch_count !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Total Launches:</Text>
                          <Text style={styles.infoValue}>{providerJson.total_launch_count}</Text>
                        </View>
                      )}
                      {providerJson.successful_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful Launches:</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{providerJson.successful_launches}</Text>
                        </View>
                      )}
                      {providerJson.failed_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed Launches:</Text>
                          <Text style={[styles.infoValue, { color: '#EF4444' }]}>{providerJson.failed_launches}</Text>
                        </View>
                      )}
                      {providerJson.pending_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Pending Launches:</Text>
                          <Text style={[styles.infoValue, { color: '#F59E0B' }]}>{providerJson.pending_launches}</Text>
                        </View>
                      )}
                      {providerJson.consecutive_successful_launches !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Consecutive Successful:</Text>
                          <Text style={styles.infoValue}>{providerJson.consecutive_successful_launches}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Landing Statistics Section */}
                {(providerJson.attempted_landings !== null || providerJson.successful_landings !== null || providerJson.failed_landings !== null || providerJson.consecutive_successful_landings !== null || providerJson.successful_landings_spacecraft !== null || providerJson.failed_landings_spacecraft !== null || providerJson.attempted_landings_spacecraft !== null || providerJson.successful_landings_payload !== null || providerJson.failed_landings_payload !== null || providerJson.attempted_landings_payload !== null) && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Landing Statistics</Text>
                    <View style={styles.infoRow}>
                      {providerJson.attempted_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Attempted Landings:</Text>
                          <Text style={styles.infoValue}>{providerJson.attempted_landings}</Text>
                        </View>
                      )}
                      {providerJson.successful_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{providerJson.successful_landings}</Text>
                        </View>
                      )}
                      {providerJson.failed_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#EF4444' }]}>{providerJson.failed_landings}</Text>
                        </View>
                      )}
                      {providerJson.consecutive_successful_landings !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Consecutive Successful Landings:</Text>
                          <Text style={styles.infoValue}>{providerJson.consecutive_successful_landings}</Text>
                        </View>
                      )}
                      {providerJson.successful_landings_spacecraft !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful Spacecraft Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{providerJson.successful_landings_spacecraft}</Text>
                        </View>
                      )}
                      {providerJson.failed_landings_spacecraft !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed Spacecraft Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#EF4444' }]}>{providerJson.failed_landings_spacecraft}</Text>
                        </View>
                      )}
                      {providerJson.attempted_landings_spacecraft !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Attempted Spacecraft Landings:</Text>
                          <Text style={styles.infoValue}>{providerJson.attempted_landings_spacecraft}</Text>
                        </View>
                      )}
                      {providerJson.successful_landings_payload !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Successful Payload Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#10B981' }]}>{providerJson.successful_landings_payload}</Text>
                        </View>
                      )}
                      {providerJson.failed_landings_payload !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Failed Payload Landings:</Text>
                          <Text style={[styles.infoValue, { color: '#EF4444' }]}>{providerJson.failed_landings_payload}</Text>
                        </View>
                      )}
                      {providerJson.attempted_landings_payload !== null && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Attempted Payload Landings:</Text>
                          <Text style={styles.infoValue}>{providerJson.attempted_landings_payload}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {providerDescription && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{providerDescription}</Text>
                  </View>
                )}

                {/* URLs */}
                {(providerUrl || providerInfoUrl || providerWikiUrl) && (
                  <View style={styles.urlSection}>
                    {providerUrl && (
                      <TouchableOpacity onPress={() => openUrl(providerUrl)}>
                        <Text style={styles.linkText}>Provider URL →</Text>
                      </TouchableOpacity>
                    )}
                    {providerInfoUrl && (
                      <TouchableOpacity onPress={() => openUrl(providerInfoUrl)}>
                    <Text style={styles.linkText}>More Information →</Text>
                  </TouchableOpacity>
                    )}
                    {providerWikiUrl && (
                      <TouchableOpacity onPress={() => openUrl(providerWikiUrl)}>
                        <Text style={styles.linkText}>Wikipedia →</Text>
                  </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (launch.provider || launch.provider_abbrev) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Provider</Text>
                <Text style={styles.infoValue}>{safeString(launch.provider) || safeString(launch.provider_abbrev)}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No launch service provider information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'PAD':
        const pad = padJson || {};
        const padLocation = pad.location || {};
        const padCountryObj = pad.country || padLocation.country || {};
        const padLocationCountry = padLocation.country || {};
        const padLocationCelestialBody = padLocation.celestial_body || {};
        
        return (
          <View style={styles.tabContent}>
            {pad.name || pad.id || Object.keys(pad).length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Pad Information</Text>
                
                {/* Pad Image */}
                {pad.image?.image_url && (
                  <View style={styles.imageSection}>
                    <Image 
                      source={{ uri: pad.image.image_url }} 
                      style={styles.rocketImage}
                      resizeMode="contain"
                    />
                    {pad.image.credit && (
                      <Text style={styles.imageCredit}>Credit: {pad.image.credit}</Text>
                    )}
                    {pad.image.thumbnail_url && (
                      <View style={styles.imageContainer}>
                        <Text style={styles.imageLabel}>Thumbnail</Text>
                        <Image 
                          source={{ uri: pad.image.thumbnail_url }} 
                          style={styles.providerImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.infoRow}>
                  {pad.id && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Pad ID:</Text>
                      <Text style={styles.infoValue}>{safeString(pad.id)}</Text>
                    </View>
                  )}
                  {pad.name && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Pad Name:</Text>
                      <Text style={styles.infoValue}>{safeString(pad.name)}</Text>
                    </View>
                  )}
                  {pad.url && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Pad URL:</Text>
                      <TouchableOpacity onPress={() => openUrl(pad.url)}>
                        <Text style={styles.linkText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {pad.active !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Active:</Text>
                      <Text style={[styles.infoValue, { color: pad.active ? '#10B981' : '#EF4444' }]}>
                        {pad.active ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  )}
                  {pad.agency_id && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Agency ID:</Text>
                      <Text style={styles.infoValue}>{safeString(pad.agency_id)}</Text>
                    </View>
                  )}
                  {(padCountryObj.alpha_2_code || pad.country_code) && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Country Code:</Text>
                      <Text style={styles.infoValue}>{safeString(padCountryObj.alpha_2_code || pad.country_code)}</Text>
                    </View>
                  )}
                  {padCountryObj.name && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Country:</Text>
                      <Text style={styles.infoValue}>{safeString(padCountryObj.name)}</Text>
                    </View>
                  )}
                  {pad.latitude && pad.longitude && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Coordinates:</Text>
                      <Text style={styles.infoValue}>{String(pad.latitude)}, {String(pad.longitude)}</Text>
                    </View>
                  )}
                  {pad.total_launch_count !== null && pad.total_launch_count !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Total Launches:</Text>
                      <Text style={styles.infoValue}>{pad.total_launch_count}</Text>
                    </View>
                  )}
                  {pad.orbital_launch_attempt_count !== null && pad.orbital_launch_attempt_count !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Orbital Launch Attempts:</Text>
                      <Text style={styles.infoValue}>{pad.orbital_launch_attempt_count}</Text>
                </View>
                  )}
                  {pad.fastest_turnaround && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Fastest Turnaround:</Text>
                      <Text style={styles.infoValue}>{safeString(pad.fastest_turnaround)}</Text>
                    </View>
                  )}
                </View>

                {pad.description && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{safeString(pad.description)}</Text>
                  </View>
                )}

                {/* Pad Agencies */}
                {pad.agencies && Array.isArray(pad.agencies) && pad.agencies.length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Pad Agencies</Text>
                    {pad.agencies.map((agency, idx) => (
                      <View key={idx} style={styles.agencyItem}>
                        <View style={styles.infoRow}>
                          {agency.id && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Agency ID:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.id)}</Text>
                            </View>
                          )}
                          {agency.name && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Name:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.name)}</Text>
                            </View>
                          )}
                          {agency.abbrev && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Abbreviation:</Text>
                              <Text style={styles.infoValue}>{safeString(agency.abbrev)}</Text>
                            </View>
                          )}
                          {agency.type && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Type:</Text>
                              <Text style={styles.infoValue}>
                                {typeof agency.type === 'object' 
                                  ? safeString(agency.type.name) || safeString(agency.type)
                                  : safeString(agency.type)}
                              </Text>
                            </View>
                          )}
                        </View>
                        {agency.url && (
                          <TouchableOpacity onPress={() => openUrl(agency.url)}>
                            <Text style={styles.linkText}>Agency URL →</Text>
                  </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Location Information */}
                {padLocation && Object.keys(padLocation).length > 0 && (
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Location Information</Text>
                    
                    {/* Location Image */}
                    {padLocation.image?.image_url && (
                      <View style={styles.imageSection}>
                        <Image 
                          source={{ uri: padLocation.image.image_url }} 
                          style={styles.rocketImage}
                          resizeMode="contain"
                        />
                        {padLocation.image.credit && (
                          <Text style={styles.imageCredit}>Credit: {padLocation.image.credit}</Text>
                        )}
                        {padLocation.image.thumbnail_url && (
                          <View style={styles.imageContainer}>
                            <Text style={styles.imageLabel}>Thumbnail</Text>
                            <Image 
                              source={{ uri: padLocation.image.thumbnail_url }} 
                              style={styles.providerImage}
                              resizeMode="contain"
                            />
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.infoRow}>
                      {padLocation.id && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Location ID:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocation.id)}</Text>
                        </View>
                      )}
                      {padLocation.name && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Location Name:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocation.name)}</Text>
                        </View>
                      )}
                      {padLocation.url && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Location URL:</Text>
                          <TouchableOpacity onPress={() => openUrl(padLocation.url)}>
                            <Text style={styles.linkText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {padLocation.active !== undefined && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Active:</Text>
                          <Text style={[styles.infoValue, { color: padLocation.active ? '#10B981' : '#EF4444' }]}>
                            {padLocation.active ? 'Yes' : 'No'}
                          </Text>
                        </View>
                      )}
                      {padLocationCountry.name && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Country:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocationCountry.name)}</Text>
                        </View>
                      )}
                      {padLocationCountry.alpha_2_code && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Country Code:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocationCountry.alpha_2_code)}</Text>
                        </View>
                      )}
                      {padLocation.latitude && padLocation.longitude && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Coordinates:</Text>
                          <Text style={styles.infoValue}>{String(padLocation.latitude)}, {String(padLocation.longitude)}</Text>
                        </View>
                      )}
                      {padLocation.timezone_name && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Timezone:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocation.timezone_name)}</Text>
                        </View>
                      )}
                      {padLocation.total_launch_count !== null && padLocation.total_launch_count !== undefined && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Total Launches:</Text>
                          <Text style={styles.infoValue}>{padLocation.total_launch_count}</Text>
                        </View>
                      )}
                      {padLocation.total_landing_count !== null && padLocation.total_landing_count !== undefined && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Total Landings:</Text>
                          <Text style={styles.infoValue}>{padLocation.total_landing_count}</Text>
                        </View>
                      )}
                      {padLocation.response_mode && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoLabel}>Response Mode:</Text>
                          <Text style={styles.infoValue}>{safeString(padLocation.response_mode)}</Text>
                        </View>
                      )}
                    </View>

                    {/* Celestial Body */}
                    {padLocationCelestialBody && Object.keys(padLocationCelestialBody).length > 0 && (
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Celestial Body</Text>
                        <View style={styles.infoRow}>
                          {padLocationCelestialBody.name && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Name:</Text>
                              <Text style={styles.infoValue}>{safeString(padLocationCelestialBody.name)}</Text>
                            </View>
                          )}
                          {padLocationCelestialBody.type && (
                            <View style={styles.infoItem}>
                              <Text style={styles.infoLabel}>Type:</Text>
                              <Text style={styles.infoValue}>
                                {typeof padLocationCelestialBody.type === 'object' 
                                  ? safeString(padLocationCelestialBody.type.name) || safeString(padLocationCelestialBody.type)
                                  : safeString(padLocationCelestialBody.type)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Location Agencies */}
                    {padLocation.agencies && Array.isArray(padLocation.agencies) && padLocation.agencies.length > 0 && (
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Location Agencies</Text>
                        {padLocation.agencies.map((agency, idx) => (
                          <View key={idx} style={styles.agencyItem}>
                            <View style={styles.infoRow}>
                              {agency.id && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Agency ID:</Text>
                                  <Text style={styles.infoValue}>{safeString(agency.id)}</Text>
                                </View>
                              )}
                              {agency.name && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Name:</Text>
                                  <Text style={styles.infoValue}>{safeString(agency.name)}</Text>
                                </View>
                              )}
                              {agency.abbrev && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Abbreviation:</Text>
                                  <Text style={styles.infoValue}>{safeString(agency.abbrev)}</Text>
                                </View>
                              )}
                              {agency.type && (
                                <View style={styles.infoItem}>
                                  <Text style={styles.infoLabel}>Type:</Text>
                                  <Text style={styles.infoValue}>
                                    {typeof agency.type === 'object' 
                                      ? safeString(agency.type.name) || safeString(agency.type)
                                      : safeString(agency.type)}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {agency.url && (
                              <TouchableOpacity onPress={() => openUrl(agency.url)}>
                                <Text style={styles.linkText}>Agency URL →</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {padLocation.description && (
                      <View style={styles.subSection}>
                        <Text style={styles.subSectionTitle}>Location Description</Text>
                        <Text style={styles.descriptionText}>{safeString(padLocation.description)}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (launch.pad_name || launch.site) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Launch Pad</Text>
                {launch.pad_name && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pad Name:</Text>
                    <Text style={styles.infoValue}>{safeString(launch.pad_name)}</Text>
                  </View>
                )}
                {launch.site && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Launch Site:</Text>
                    <Text style={styles.infoValue}>{safeString(launch.site)}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={styles.emptyStateText}>No pad information available for this launch</Text>
              </View>
            )}
          </View>
        );

      case 'RECOVERY':
  return (
          <View style={styles.tabContent}>
            {launch.recovery ? (
              <View style={styles.section}>
                <View style={styles.infoRow}>
                  {launch.recovery.landing_location && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Landing Location:</Text>
                      <Text style={styles.infoValue}>{launch.recovery.landing_location}</Text>
                    </View>
                  )}
                  {launch.recovery.landing_type && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Landing Type:</Text>
                      <Text style={styles.infoValue}>{launch.recovery.landing_type}</Text>
                    </View>
                  )}
                  {launch.recovery.landed !== null && launch.recovery.landed !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Landed:</Text>
                      <Text style={[styles.infoValue, { color: launch.recovery.landed ? '#4ADE80' : '#EF4444' }]}>
                        {launch.recovery.landed ? 'Yes' : 'No'}
          </Text>
                    </View>
                  )}
                  {launch.recovery.landing_attempt !== null && launch.recovery.landing_attempt !== undefined && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Landing Attempt:</Text>
                      <Text style={styles.infoValue}>{launch.recovery.landing_attempt ? 'Yes' : 'No'}</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No recovery information available.</Text>
            )}
          </View>
        );

      case 'HAZARDS':
        return (
          <View style={styles.tabContent}>
            {launch.hazards && launch.hazards.length > 0 ? (
              launch.hazards.map((hazard, idx) => (
                <View key={idx} style={styles.hazardItem}>
                  <Text style={[styles.itemTitle, { color: '#FBBF24' }]}>{hazard.name || 'Hazard'}</Text>
                  {hazard.description && (
                    <Text style={styles.descriptionText}>{hazard.description}</Text>
                  )}
                  {hazard.severity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Severity:</Text>
                      <Text style={styles.infoValue}>{hazard.severity}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hazard information available.</Text>
            )}
          </View>
        );

      case 'STATISTICS':
        return (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Launch Statistics</Text>
              <View style={styles.infoRow}>
                {launch.orbital_launch_attempt_count !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Orbital Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.orbital_launch_attempt_count}</Text>
                  </View>
                )}
                {launch.location_launch_attempt_count !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Location Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.location_launch_attempt_count}</Text>
                  </View>
                )}
                {launch.pad_launch_attempt_count !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pad Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.pad_launch_attempt_count}</Text>
                  </View>
                )}
                {launch.agency_launch_attempt_count !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Agency Launch Attempt Count:</Text>
                    <Text style={styles.infoValue}>{launch.agency_launch_attempt_count}</Text>
                  </View>
                )}
                {launch.orbital_launch_attempt_count_year !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Orbital Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.orbital_launch_attempt_count_year}</Text>
                  </View>
                )}
                {launch.location_launch_attempt_count_year !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Location Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.location_launch_attempt_count_year}</Text>
                  </View>
                )}
                {launch.pad_launch_attempt_count_year !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pad Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.pad_launch_attempt_count_year}</Text>
                  </View>
                )}
                {launch.agency_launch_attempt_count_year !== null && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Agency Launches This Year:</Text>
                    <Text style={styles.infoValue}>{launch.agency_launch_attempt_count_year}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Launch Status</Text>
              <View style={styles.infoRow}>
                {launch.status_name && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>{launch.status_name}</Text>
                  </View>
                )}
                {launch.status_abbrev && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Status Code:</Text>
                    <Text style={styles.infoValue}>{launch.status_abbrev}</Text>
                  </View>
                )}
                {launch.outcome && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Outcome:</Text>
                    <Text style={[
                      styles.infoValue,
                      launch.outcome === 'success' ? { color: '#4ADE80' } :
                      launch.outcome === 'failure' ? { color: '#EF4444' } :
                      launch.outcome === 'partial' ? { color: '#FBBF24' } :
                      {}
                    ]}>
                      {launch.outcome.toUpperCase()}
                    </Text>
                  </View>
                )}
                {launch.launch_designator && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Launch Designator:</Text>
                    <Text style={styles.infoValue}>{launch.launch_designator}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      {imageUrl ? (
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay} />
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.companyName}>{getProviderName()}</Text>
            <View style={styles.launchNameContainer}>
              <Text style={styles.launchNameFirst} numberOfLines={2}>{launchName.firstLine}</Text>
              {launchName.secondLine ? (
                <Text style={[styles.launchName, styles.launchNameSecond]} numberOfLines={2}>{launchName.secondLine}</Text>
              ) : null}
            </View>
            <Text style={styles.location}>{getLocation()}</Text>
            <Text style={styles.dateTime}>{dateTime}</Text>
            {launch.status_name && (
              <View style={[
                styles.statusBadge,
                launch.outcome === 'success' ? styles.statusSuccess :
                launch.outcome === 'failure' ? styles.statusFailure :
                launch.outcome === 'partial' ? styles.statusPartial :
                styles.statusDefault
              ]}>
                <Text style={styles.statusText}>{launch.status_name.toUpperCase()}</Text>
              </View>
            )}
            {isUpcoming && (
              <View style={styles.countdownWrapper}>
                <Text style={styles.countdownValue}>{countdownString}</Text>
                <View style={styles.countdownLabels}>
                  <Text style={styles.countdownLabel}>DAYS</Text>
                  <Text style={styles.countdownLabel}>HOURS</Text>
                  <Text style={styles.countdownLabel}>MINUTES</Text>
                  <Text style={styles.countdownLabel}>SECONDS</Text>
                </View>
              </View>
            )}
          </View>
        </ImageBackground>
      ) : (
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.companyName}>{getProviderName()}</Text>
            <View style={styles.launchNameContainer}>
              <Text style={styles.launchNameFirst} numberOfLines={2}>{launchName.firstLine}</Text>
              {launchName.secondLine ? (
                <Text style={[styles.launchName, styles.launchNameSecond]} numberOfLines={2}>{launchName.secondLine}</Text>
              ) : null}
            </View>
            <Text style={styles.location}>{getLocation()}</Text>
            <Text style={styles.dateTime}>{dateTime}</Text>
            {launch.status_name && (
              <View style={[
                styles.statusBadge,
                launch.outcome === 'success' ? styles.statusSuccess :
                launch.outcome === 'failure' ? styles.statusFailure :
                launch.outcome === 'partial' ? styles.statusPartial :
                styles.statusDefault
              ]}>
                <Text style={styles.statusText}>{launch.status_name.toUpperCase()}</Text>
              </View>
            )}
            {isUpcoming && (
              <View style={styles.countdownWrapper}>
                <Text style={styles.countdownValue}>{countdownString}</Text>
                <View style={styles.countdownLabels}>
                  <Text style={styles.countdownLabel}>DAYS</Text>
                  <Text style={styles.countdownLabel}>HOURS</Text>
                  <Text style={styles.countdownLabel}>MINUTES</Text>
                  <Text style={styles.countdownLabel}>SECONDS</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Mission Image */}
      {(launch.mission_image_url || launch.infographic_url) && (
        <View style={styles.missionImageContainer}>
          <Image 
            source={{ uri: launch.mission_image_url || launch.infographic_url }}
            style={styles.missionImage}
            resizeMode="contain"
          />
        </View>
      )}

          {/* Tabs */}
      <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive
              ]}
              >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
      </View>

          {/* Tab Content */}
      <ScrollView 
        style={styles.contentScroll} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const isSmall = isSmallDevice();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: isSmall ? scale(350) : scale(420),
  },
  heroImageStyle: {
    opacity: 0.7,
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  heroSection: {
    width: SCREEN_WIDTH,
    height: isSmall ? scale(350) : scale(420),
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: isSmall ? scale(40) : scale(50),
    left: getResponsivePadding(theme.spacing.md),
    zIndex: 10,
    padding: getResponsivePadding(theme.spacing.sm),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroContent: {
    flex: 1,
    paddingTop: isSmall ? scale(50) : scale(60),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    justifyContent: 'center',
  },
  companyName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    fontFamily: 'System',
  },
  launchNameContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  launchNameFirst: {
    fontSize: getResponsiveFontSize(isSmall ? 20 : 28),
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'Nasalization',
    marginBottom: 4,
    flexShrink: 1,
  },
  launchName: {
    fontSize: getResponsiveFontSize(isSmall ? 20 : 28),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: 'System',
    marginBottom: 4,
    flexShrink: 1,
  },
  launchNameSecond: {
    marginBottom: 0,
  },
  location: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    opacity: 0.9,
    fontFamily: 'System',
  },
  dateTime: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    opacity: 0.8,
    fontFamily: 'System',
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.xs),
    borderRadius: scale(4),
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  statusSuccess: {
    backgroundColor: '#4ADE80',
  },
  statusFailure: {
    backgroundColor: '#EF4444',
  },
  statusPartial: {
    backgroundColor: '#FBBF24',
  },
  statusDefault: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    fontWeight: 'bold',
  },
  countdownWrapper: {
    alignItems: 'center',
    marginTop: getResponsivePadding(theme.spacing.sm),
  },
  countdownValue: {
    fontSize: getResponsiveFontSize(isSmall ? 28 : 36),
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    letterSpacing: scale(2),
    marginBottom: getResponsivePadding(theme.spacing.xs),
  },
  countdownLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(6),
    flexWrap: 'wrap',
  },
  countdownLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '600',
    fontFamily: 'System',
    minWidth: scale(50),
    textAlign: 'center',
  },
  missionImageContainer: {
    width: SCREEN_WIDTH,
    height: isSmall ? scale(200) : scale(280),
    backgroundColor: '#000',
    padding: getResponsivePadding(theme.spacing.md),
  },
  missionImage: {
    width: '100%',
    height: '100%',
  },
  tabsContainer: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tabsContent: {
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
    paddingVertical: scale(4),
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
    paddingVertical: scale(4),
    marginRight: getResponsivePadding(theme.spacing.sm),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
    borderBottomWidth: 3,
  },
  tabText: {
    color: '#6B7280',
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.xl),
  },
  tabContent: {
    width: '100%',
  },
  section: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.md) * 1.6,
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  infoRow: {
    flexDirection: 'column',
    gap: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  infoItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    paddingVertical: getResponsivePadding(theme.spacing.xs),
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(8),
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
  },
  infoLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#9CA3AF',
    marginRight: getResponsivePadding(theme.spacing.sm),
    minWidth: scale(100),
    fontWeight: '500',
  },
  infoValue: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  descriptionText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.sm) * 1.6,
    marginTop: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  linkText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: theme.colors.primary,
    marginTop: getResponsivePadding(theme.spacing.sm),
    textDecorationLine: 'underline',
    fontWeight: '600',
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  emptyText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: getResponsivePadding(theme.spacing.lg),
  },
  itemTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
    letterSpacing: 0.3,
  },
  payloadItem: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    padding: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crewItem: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    padding: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hazardItem: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    padding: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
    borderLeftWidth: 3,
    borderLeftColor: '#FBBF24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  programItem: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(8),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  programName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    letterSpacing: 0.3,
  },
  programDesc: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.sm) * 1.5,
  },
  agencyItem: {
    marginBottom: getResponsivePadding(theme.spacing.sm),
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(8),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  agencyName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
  },
  agencyAbbrev: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#9CA3AF',
  },
  probabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsivePadding(theme.spacing.sm),
    marginTop: getResponsivePadding(theme.spacing.sm),
  },
  probabilityBar: {
    flex: 1,
    height: scale(8),
    backgroundColor: '#333',
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  probabilityText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#FFFFFF',
    fontWeight: '600',
    minWidth: scale(50),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xl),
    color: '#FFFFFF',
  },
  // UPDATES Tab Styles
  updateItem: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    padding: getResponsivePadding(theme.spacing.md),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  updateAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#2a2a2a',
  },
  updateMeta: {
    flex: 1,
  },
  updateAuthor: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scale(2),
  },
  updateDate: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#9CA3AF',
  },
  updateComment: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.md) * 1.5,
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  // TIMELINE Tab Styles
  timelineItem: {
    flexDirection: 'row',
    marginBottom: getResponsivePadding(theme.spacing.lg),
    paddingLeft: getResponsivePadding(theme.spacing.sm),
  },
  timelineDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: theme.colors.primary,
    marginRight: getResponsivePadding(theme.spacing.md),
    marginTop: scale(4),
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: getResponsivePadding(theme.spacing.md),
    borderLeftWidth: 2,
    borderLeftColor: '#2a2a2a',
    marginLeft: scale(-6),
    paddingLeft: getResponsivePadding(theme.spacing.md) + scale(6),
  },
  timelineType: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: theme.colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: scale(4),
  },
  timelineTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: scale(4),
  },
  timelineDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.sm) * 1.5,
    marginBottom: scale(6),
  },
  timelineDate: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // PATCHES Tab Styles
  patchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
  },
  patchItem: {
    width: (SCREEN_WIDTH - getResponsivePadding(theme.spacing.lg) * 2 - scale(12)) / 2,
    marginBottom: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patchImage: {
    width: scale(100),
    height: scale(100),
    marginBottom: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#2a2a2a',
    borderRadius: scale(8),
  },
  patchName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: scale(4),
  },
  patchAgency: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // MEDIA Tab Styles
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(8),
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  mediaLinkText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: theme.colors.primary,
    marginLeft: getResponsivePadding(theme.spacing.sm),
    flex: 1,
  },
  infographicImage: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5,
    borderRadius: scale(12),
    backgroundColor: '#2a2a2a',
  },
  // PROGRAM Tab Styles
  programCard: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  programImage: {
    width: '100%',
    height: scale(150),
    backgroundColor: '#2a2a2a',
  },
  programCardName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: getResponsivePadding(theme.spacing.md),
    marginHorizontal: getResponsivePadding(theme.spacing.md),
  },
  // New styles for enhanced tabs
  imageSection: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  imageContainer: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#9CA3AF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    fontWeight: '600',
  },
  imageCredit: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: '#6B7280',
    marginTop: getResponsivePadding(theme.spacing.xs),
    fontStyle: 'italic',
  },
  providerImage: {
    width: scale(200),
    height: scale(200),
    borderRadius: scale(8),
    backgroundColor: '#2a2a2a',
  },
  rocketImage: {
    width: '100%',
    height: scale(300),
    borderRadius: scale(8),
    backgroundColor: '#2a2a2a',
  },
  subSection: {
    marginTop: getResponsivePadding(theme.spacing.md),
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingTop: getResponsivePadding(theme.spacing.md),
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  subSectionTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    letterSpacing: 0.3,
  },
  familyItem: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#1a1a1a',
    borderRadius: scale(8),
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
  },
  familyName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
  },
  familyDetail: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    marginBottom: scale(4),
    lineHeight: getResponsiveFontSize(theme.fontSizes.sm) * 1.4,
  },
  familyLabel: {
    fontWeight: '600',
    color: '#9CA3AF',
  },
  urlSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsivePadding(theme.spacing.md),
    marginTop: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.xs),
  },
  programCardDesc: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    lineHeight: getResponsiveFontSize(theme.fontSizes.sm) * 1.5,
    marginTop: getResponsivePadding(theme.spacing.sm),
    marginHorizontal: getResponsivePadding(theme.spacing.md),
  },
  programAgencies: {
    marginTop: getResponsivePadding(theme.spacing.md),
    marginHorizontal: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.sm),
    backgroundColor: '#2a2a2a',
    borderRadius: scale(8),
  },
  programAgenciesTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: scale(4),
  },
  programAgencyName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#D1D5DB',
    marginLeft: getResponsivePadding(theme.spacing.sm),
    marginTop: scale(2),
  },
  programDate: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    color: '#9CA3AF',
    marginTop: getResponsivePadding(theme.spacing.sm),
    marginHorizontal: getResponsivePadding(theme.spacing.md),
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(theme.spacing.xl) * 2,
  },
  emptyStateText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.xl),
  },
});

export default LaunchDetail;
