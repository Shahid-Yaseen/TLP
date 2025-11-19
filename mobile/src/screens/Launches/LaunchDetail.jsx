import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { theme } from '../../styles/theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CommentItem from '../../components/CommentItem';
import { getLaunchComments, createLaunchComment } from '../../services/comments';
import { useAuth } from '../../contexts/AuthContext';
import { scale, getResponsiveFontSize, getResponsivePadding, isSmallDevice, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../utils/responsive';

const LaunchDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const { user } = useAuth();
  const [launch, setLaunch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeHazardTab, setActiveHazardTab] = useState('LAUNCH');
  const [activeCrewTab, setActiveCrewTab] = useState(0);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const videoSectionRef = useRef(null);
  const [videoSectionY, setVideoSectionY] = useState(0);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('newest');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [commentInputFocused, setCommentInputFocused] = useState(false);
  const [replyInputFocused, setReplyInputFocused] = useState(false);

  const hazardTabs = ['LAUNCH', 'BOOSTER RETURN', '2nd STAGE'];

  useEffect(() => {
    fetchLaunch();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchComments();
    }
  }, [id, commentSort]);

  useEffect(() => {
    // Use image time from launch details if available, otherwise fall back to launch_date or net
    const imageTime = launch?.image?.time || 
                      launch?.image_time || 
                      launch?.image_json?.time;
    
    const targetDate = imageTime || launch?.launch_date || launch?.net;
    
    if (targetDate) {
      startCountdown(targetDate);
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

  const fetchComments = async () => {
    if (!id) return;
    setCommentsLoading(true);
    try {
      const response = await getLaunchComments(id, commentSort);
      setComments(response.comments || []);
      setCommentsTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
      setCommentsTotal(0);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to post a comment', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      await createLaunchComment(id, newComment.trim());
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleReply = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to reply', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!replyContent.trim()) {
      Alert.alert('Error', 'Please enter a reply');
      return;
    }

    try {
      await createLaunchComment(id, replyContent.trim(), replyingTo.id);
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to post reply');
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    const updateCommentInTree = (comments) => {
      return comments.map(comment => {
        if (comment.id === updatedComment.id) {
          return updatedComment;
        }
        if (comment.replies && comment.replies.length > 0) {
          return { ...comment, replies: updateCommentInTree(comment.replies) };
        }
        return comment;
      });
    };
    setComments(updateCommentInTree(comments));
  };

  const handleCommentDelete = (commentId) => {
    const removeCommentFromTree = (comments) => {
      return comments
        .filter(comment => comment.id !== commentId)
        .map(comment => {
          if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: removeCommentFromTree(comment.replies) };
          }
          return comment;
        });
    };
    setComments(removeCommentFromTree(comments));
    setCommentsTotal(prev => Math.max(0, prev - 1));
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const utcTime = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
    return `${day} ${month}, ${year} ${time} (${utcTime} UTC)`;
  };

  const formatLiftOffDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const formatLiftOffTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const time = `${hours}:${minutes}:${seconds}`;
    
    const utcDate = new Date(date.toISOString());
    const utcHours = String(utcDate.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const utcTime = `${utcHours}:${utcMinutes}`;
    
    return `${time} (${utcTime} UTC)`;
  };

  const formatWindowTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatWindowTimeWithTimezone = (dateString, timezone = null) => {
    if (!dateString) return { local: 'TBD', utc: 'TBD' };
    const date = new Date(dateString);
    
    try {
      // Format local time with timezone
      const options = { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      };
      
      if (timezone) {
        options.timeZone = timezone;
      }
      
      const localTime = date.toLocaleTimeString('en-US', options);
      
      // Get timezone abbreviation
      let timeZoneName = '';
      if (timezone) {
        const parts = new Intl.DateTimeFormat('en-US', { 
          timeZone: timezone, 
          timeZoneName: 'short' 
        }).formatToParts(date);
        timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || '';
      } else {
        // Try to get timezone from the date string or use local timezone
        const timeString = date.toLocaleTimeString('en-US', { 
          timeZoneName: 'short', 
          hour12: true 
        });
        const parts = timeString.split(' ');
        timeZoneName = parts[parts.length - 1] || '';
      }
      
      const localTimeWithTZ = timeZoneName ? `${localTime} ${timeZoneName}` : localTime;
      
      // Format UTC time
      const utcTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      });
      
      return {
        local: localTimeWithTZ,
        utc: `(${utcTime} UTC)`
      };
    } catch (error) {
      // Fallback if timezone is invalid
      const localTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const utcTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
      });
      return {
        local: localTime,
        utc: `(${utcTime} UTC)`
      };
    }
  };

  const getImageUrl = () => {
    if (!launch) return 'https://i.imgur.com/3kPqWvM.jpeg';
    // Match web version's getLaunchImageUrl function exactly
    // Try image object first (new API structure)
    if (launch.image?.image_url) return launch.image.image_url;
    // Fallback to old structure
    if (launch.image_json?.image_url) return launch.image_json.image_url;
    if (launch.media?.image?.image_url) return launch.media.image.image_url;
    if (launch.mission_image_url) return launch.mission_image_url;
    if (launch.infographic_url) return launch.infographic_url;
    return 'https://i.imgur.com/3kPqWvM.jpeg';
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

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const urlStr = typeof url === 'string' ? url : url.url || '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = urlStr.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Find first YouTube URL from video URLs
  const getYouTubeUrl = () => {
    if (!launch) return null;
    
    // Check launch vid_urls
    if (launch.vid_urls && Array.isArray(launch.vid_urls)) {
      for (const urlObj of launch.vid_urls) {
        const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
          return url;
        }
      }
    }
    
    // Check mission vid_urls
    if (launch.mission?.vid_urls && Array.isArray(launch.mission.vid_urls)) {
      for (const urlObj of launch.mission.vid_urls) {
        const url = typeof urlObj === 'string' ? urlObj : urlObj.url;
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
          return url;
        }
      }
    }
    
    return null;
  };

  const youtubeUrl = getYouTubeUrl();
  const youtubeVideoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;

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
  
  // Extract objects for easier access (matching web app structure)
  const mission = launch.mission || missionJson || {};
  const rocket = launch.rocket || rocketJson || {};
  const pad = launch.pad || padJson || {};
  const launchServiceProvider = launch.launch_service_provider || providerJson || {};

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

  // Calculate payload mass
  const totalPayloadMass = launch.payloads?.reduce((sum, p) => sum + (p.mass_kg || 0), 0) || 0;
  const totalPayloadMassLb = launch.payloads?.reduce((sum, p) => sum + (p.mass_lb || 0), 0) || 0;
  
  // Get booster info
  const boosterInfo = launch.rocket?.configuration?.launcher_stage?.[0] || {};
  const boosterSerial = launch.rocket?.serial_number || boosterInfo.serial_number || 'TBD';
  const boosterFlights = launch.rocket?.flights || boosterInfo.flights || 0;
        
        return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + scale(10) }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                      </TouchableOpacity>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Title */}
        <ImageBackground
          source={{ uri: imageUrl }}
          style={styles.heroSection}
          imageStyle={styles.heroBackgroundImage}
        >
          {/* Dark Overlay */}
          <View style={styles.heroOverlay} />
          
          {/* Action Buttons - Positioned near top */}
          <View style={[styles.actionButtonsContainer, { top: insets.top + scale(60) }]}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>3D VIEW</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                if (youtubeVideoId) {
                  setIsVideoPlaying(true);
                  // Scroll to video section after a short delay
                  setTimeout(() => {
                    if (videoSectionY > 0 && scrollViewRef.current) {
                      scrollViewRef.current.scrollTo({ y: videoSectionY - scale(20), animated: true });
                    }
                  }, 300);
                }
              }}
            >
              <Text style={styles.actionButtonText}>WATCH</Text>
            </TouchableOpacity>
          </View>
          
          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Text style={styles.missionTitle}>{launchName.firstLine.toUpperCase()}</Text>
            
            {/* Countdown Timer */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{String(countdown.days).padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>DAYS</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{String(countdown.hours).padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>HOURS</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{String(countdown.minutes).padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>MINUTES</Text>
              </View>
              <Text style={styles.countdownSeparator}>:</Text>
              <View style={styles.countdownItem}>
                <Text style={styles.countdownValue}>{String(countdown.seconds).padStart(2, '0')}</Text>
                <Text style={styles.countdownLabel}>SECONDS</Text>
              </View>
            </View>
                  </View>
                </ImageBackground>

        {/* Launch Overview Section */}
        {(launch.launch_date || launch.net || launch.window_start || launch.window_end || pad.name || pad.location) && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>LAUNCH OVERVIEW</Text>
            <View style={styles.redSeparator} />
                
            {(launch.launch_date || launch.net) && (
                  <View style={styles.liftOffTimeRow}>
                <Text style={styles.liftOffTimeLabel}>LIFT OFF TIME:</Text>
                <View style={styles.verticalRedSeparator} />
                <View style={styles.liftOffTimeValueContainer}>
                  <Text style={styles.liftOffTimeValue}>{formatLiftOffDate(launch.launch_date || launch.net)}</Text>
                  <Text style={styles.liftOffTimeValue}>{formatLiftOffTime(launch.launch_date || launch.net)}</Text>
                </View>
                  </View>
                )}
                
            {/* Launch Window Bar */}
            {(launch.window_start || launch.window_end || launch.launch_date || launch.net) && (
              <View style={styles.windowBarContainer}>
                {/* Progress Bar */}
                <View style={styles.windowProgressContainer}>
                  <View style={styles.windowProgressBar}>
                    <View style={styles.windowProgressBarBackground}>
                      <View style={styles.windowProgressBarFill} />
                      <Ionicons name="rocket" size={20} color="#FFFFFF" style={styles.windowRocketIcon} />
                    </View>
                  </View>
                </View>
                
                {/* Window Open and Close Boxes */}
                <View style={styles.windowBoxesContainer}>
                  <View style={[styles.windowBox, { marginRight: getResponsivePadding(theme.spacing.xs) }]}>
                    <Text style={styles.windowBoxLabel}>Window Open</Text>
                    <Text style={styles.windowBoxTime}>
                      {formatWindowTimeWithTimezone(
                        launch.window_start || launch.launch_date || launch.net,
                        pad.location?.timezone || null
                      ).local}
                    </Text>
                    <Text style={styles.windowBoxUTC}>
                      {formatWindowTimeWithTimezone(
                        launch.window_start || launch.launch_date || launch.net,
                        pad.location?.timezone || null
                      ).utc}
                    </Text>
                  </View>
                  
                  <View style={[styles.windowBox, { marginLeft: getResponsivePadding(theme.spacing.xs) }]}>
                    <Text style={styles.windowBoxLabel}>Window Close</Text>
                    <Text style={styles.windowBoxTime}>
                      {formatWindowTimeWithTimezone(
                        launch.window_end || launch.launch_date || launch.net,
                        pad.location?.timezone || null
                      ).local}
                    </Text>
                    <Text style={styles.windowBoxUTC}>
                      {formatWindowTimeWithTimezone(
                        launch.window_end || launch.launch_date || launch.net,
                        pad.location?.timezone || null
                      ).utc}
                    </Text>
                  </View>
                </View>
              </View>
            )}
                
            {(pad.name || pad.location) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>{getLocation()}</Text>
              </View>
            )}
                
            {/* Map - only show if there's a map image */}
            {pad.map_image && (
              <View style={styles.mapContainer}>
                <Image 
                  source={{ uri: pad.map_image }} 
                  style={styles.mapImage}
                  resizeMode="contain"
                />
                  </View>
                )}
              </View>
            )}

        {/* Mission Details Section */}
        {(mission.description || launchServiceProvider.name || getProviderName() || launch.payloads?.length > 0 || totalPayloadMass > 0 || launch.payloads?.[0]?.orbit || mission.orbit) && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>MISSION DETAILS</Text>
            <View style={styles.redSeparator} />
            
            {mission.description && (
              <Text style={styles.missionDescription}>
                {mission.description}
                </Text>
            )}

            {(launchServiceProvider.name || getProviderName() || launch.payloads?.length > 0 || totalPayloadMass > 0 || launch.payloads?.[0]?.orbit || mission.orbit) && (
              <View style={styles.missionDetailsList}>
                {(launchServiceProvider.name || getProviderName()) && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Customer:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>
                      {launchServiceProvider.name || getProviderName()}
                    </Text>
                  </View>
                )}
                {launch.payloads?.length > 0 && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Payload:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>
                      {`${launch.payloads.length} ${launch.payloads[0].name || 'Satellites'}`}
                    </Text>
                  </View>
                )}
                {totalPayloadMass > 0 && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Payload Mass:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>
                      {`${totalPayloadMass.toLocaleString()}kg (${totalPayloadMassLb.toLocaleString()} lbs)`}
                    </Text>
                  </View>
                )}
                {(launch.payloads?.[0]?.orbit || mission.orbit) && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Destination:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>
                      {launch.payloads?.[0]?.orbit || mission.orbit}
                    </Text>
                  </View>
                )}
              </View>
            )}
              </View>
            )}

        {/* Rocket Details Section */}
        {(getProviderName() || rocket.configuration?.name || rocket.configuration?.full_name || rocket.name || rocket.configuration?.reusable !== undefined || rocket.configuration?.fuel_type) && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROCKET DETAILS</Text>
            <View style={styles.redSeparator} />
            
            <View style={styles.missionDetailsList}>
              {getProviderName() && (
                <View style={styles.missionDetailRow}>
                  <Text style={styles.missionDetailLabel}>Launch Provider:</Text>
                  <View style={styles.verticalRedSeparator} />
                  <Text style={styles.missionDetailValue}>{getProviderName()}</Text>
                </View>
              )}
              {(rocket.configuration?.name || rocket.configuration?.full_name || rocket.name) && (
                <View style={styles.missionDetailRow}>
                  <Text style={styles.missionDetailLabel}>Rocket:</Text>
                  <View style={styles.verticalRedSeparator} />
                  <Text style={styles.missionDetailValue}>
                    {rocket.configuration?.name || rocket.configuration?.full_name || rocket.name}
                  </Text>
                </View>
              )}
              {rocket.configuration?.reusable !== undefined && (
                <View style={styles.missionDetailRow}>
                  <Text style={styles.missionDetailLabel}>Reusable:</Text>
                  <View style={styles.verticalRedSeparator} />
                  <Text style={styles.missionDetailValue}>
                    {rocket.configuration.reusable ? 'Yes' : 'No'}
                  </Text>
                </View>
              )}
              {rocket.configuration?.fuel_type && (
                <View style={styles.missionDetailRow}>
                  <Text style={styles.missionDetailLabel}>Fuel Type:</Text>
                  <View style={styles.verticalRedSeparator} />
                  <Text style={styles.missionDetailValue}>
                    {rocket.configuration.fuel_type}
                  </Text>
                </View>
              )}
            </View>
              </View>
            )}

        {/* Booster Section */}
        {(boosterSerial !== 'TBD' || boosterFlights > 0) && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>BOOSTER</Text>
            <View style={styles.redSeparator} />
            
            <View style={styles.missionDetailsList}>
              <View style={styles.missionDetailRow}>
                <Text style={styles.missionDetailLabel}>Booster #:</Text>
                <View style={styles.verticalRedSeparator} />
                <Text style={styles.missionDetailValue}>{boosterSerial}</Text>
              </View>
              <View style={styles.missionDetailRow}>
                <Text style={styles.missionDetailLabel}>Total Flights:</Text>
                <View style={styles.verticalRedSeparator} />
                <Text style={styles.missionDetailValue}>{boosterFlights}</Text>
              </View>
            </View>
              </View>
            )}

        {/* PAYLOAD Section */}
        {launch.payloads && launch.payloads.length > 0 && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAYLOAD</Text>
            <View style={styles.redSeparator} />
            {launch.payloads.map((payload, idx) => (
              <View key={payload.id || idx} style={[styles.payloadCard, idx < launch.payloads.length - 1 && styles.payloadBorder]}>
                <Text style={styles.payloadName}>{payload.name || 'Unnamed Payload'}</Text>
                <View style={styles.missionDetailsList}>
                    {payload.type && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Type:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.type}</Text>
                    </View>
                    )}
                    {payload.mass_kg && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Mass:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.mass_kg} kg</Text>
                    </View>
                  )}
                  {payload.mass_lb && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Mass (lb):</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.mass_lb} lb</Text>
                    </View>
                  )}
                    {payload.orbit && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Orbit:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.orbit}</Text>
                    </View>
                  )}
                    {payload.nationality && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Nationality:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>
                        {typeof payload.nationality === 'string' 
                          ? payload.nationality 
                          : payload.nationality?.name || payload.nationality?.nationality_name || 'N/A'}
                      </Text>
                    </View>
                  )}
                    {payload.manufacturer && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Manufacturer:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.manufacturer}</Text>
                    </View>
                  )}
                    {payload.customers && Array.isArray(payload.customers) && payload.customers.length > 0 && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Customers:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.customers.join(', ')}</Text>
                    </View>
                  )}
                  {payload.destination && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Destination:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{payload.destination}</Text>
                    </View>
                  )}
                </View>
                  {payload.description && (
                  <Text style={styles.payloadDescription}>{payload.description}</Text>
                  )}
                </View>
            ))}
              </View>
            )}

        {/* CREW Section */}
        {launch.crew && launch.crew.length > 0 && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>CREW</Text>
            <View style={styles.redSeparator} />
            
            {/* Crew Tabs */}
            {launch.crew.length > 1 && (
              <View style={styles.crewTabsContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.crewTabsScrollContent}
                >
                  {launch.crew.map((member, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.crewTab,
                        activeCrewTab === idx && styles.crewTabActive
                      ]}
                      onPress={() => setActiveCrewTab(idx)}
                    >
                      <Text 
                        style={[
                          styles.crewTabText,
                          activeCrewTab === idx && styles.crewTabTextActive
                        ]}
                        numberOfLines={1}
                      >
                        {member.name || `Crew ${idx + 1}`}
                        </Text>
                      </TouchableOpacity>
                      ))}
                </ScrollView>
          </View>
                  )}
            
            {/* Crew Member Content */}
            {launch.crew.map((member, idx) => {
              if (launch.crew.length > 1 && activeCrewTab !== idx) {
                return null;
              }
              
        return (
                <View key={idx} style={styles.crewCard}>
                  <Text style={styles.crewName}>{member.name || 'Unknown'}</Text>
                  <View style={styles.missionDetailsList}>
                    {member.role && (
                      <View style={styles.missionDetailRow}>
                        <Text style={styles.missionDetailLabel}>Role:</Text>
                        <View style={styles.verticalRedSeparator} />
                        <Text style={styles.missionDetailValue}>{member.role}</Text>
                      </View>
                    )}
                    {member.nationality && (
                      <View style={styles.missionDetailRow}>
                        <Text style={styles.missionDetailLabel}>Nationality:</Text>
                        <View style={styles.verticalRedSeparator} />
                        <Text style={styles.missionDetailValue}>
                          {typeof member.nationality === 'string' 
                            ? member.nationality 
                            : member.nationality?.name || member.nationality?.nationality_name || 'N/A'}
                        </Text>
                      </View>
                    )}
                    {member.date_of_birth && (
                      <View style={styles.missionDetailRow}>
                        <Text style={styles.missionDetailLabel}>Date of Birth:</Text>
                        <View style={styles.verticalRedSeparator} />
                        <Text style={styles.missionDetailValue}>{member.date_of_birth}</Text>
                      </View>
                    )}
                    {member.flights_count !== null && member.flights_count !== undefined && (
                      <View style={styles.missionDetailRow}>
                        <Text style={styles.missionDetailLabel}>Flights:</Text>
                        <View style={styles.verticalRedSeparator} />
                        <Text style={styles.missionDetailValue}>{member.flights_count}</Text>
                      </View>
                    )}
                  </View>
                  {member.bio && (
                    <Text style={styles.crewBio}>{member.bio}</Text>
                  )}
                  {member.wiki_url && (
                    <TouchableOpacity onPress={() => openUrl(member.wiki_url)}>
                      <Text style={styles.linkText}>Learn More →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
              </View>
            )}

        {/* Detailed ROCKET Section */}
        {(mission.description || (rocket && (rocket.configuration || rocket.id || rocket.name))) && (
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROCKET</Text>
            <View style={styles.redSeparator} />
            
            {/* Mission Description */}
            {mission.description && (
              <View style={styles.missionDescriptionContainer}>
                <Text style={styles.missionDescriptionText}>{mission.description}</Text>
                  </View>
                )}

            {/* Rocket Configuration */}
            {rocket && (rocket.configuration || rocket.id || rocket.name) && (
            <>
                <Text style={styles.subSectionTitle}>Rocket Configuration</Text>
              <View style={styles.missionDetailsList}>
                  {rocket.id && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Rocket ID:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.id}</Text>
                  </View>
                  )}
                {(rocket.configuration?.name || rocket.name) && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Name:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration?.name || rocket.name}</Text>
                  </View>
                  )}
                {rocket.configuration?.id && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Configuration ID:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.id}</Text>
                  </View>
                  )}
                {rocket.configuration?.full_name && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Full Name:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.full_name}</Text>
                  </View>
                  )}
                {rocket.configuration?.variant && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Variant:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.variant}</Text>
                  </View>
                  )}
                {rocket.configuration?.family && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Family:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.family}</Text>
                  </View>
                  )}
                {rocket.configuration?.length && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Length:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.length}m</Text>
                  </View>
                )}
                {rocket.configuration?.diameter && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Diameter:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.diameter}m</Text>
                  </View>
                        )}
                {rocket.configuration?.launch_mass && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Launch Mass:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.launch_mass} kg</Text>
                  </View>
                        )}
                {rocket.configuration?.leo_capacity && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>LEO Capacity:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.leo_capacity} kg</Text>
                  </View>
                    )}
                {rocket.configuration?.gto_capacity && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>GTO Capacity:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.gto_capacity} kg</Text>
                  </View>
                      )}
                {rocket.configuration?.to_thrust && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Takeoff Thrust:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.to_thrust} kN</Text>
                  </View>
                      )}
                {rocket.configuration?.reusable !== null && rocket.configuration?.reusable !== undefined && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Reusable:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{rocket.configuration.reusable ? 'Yes' : 'No'}</Text>
                  </View>
                      )}
                        </View>

              {/* Links */}
              {(rocket.configuration?.info_url || rocket.configuration?.wiki_url) && (
                <View style={styles.linksContainer}>
                  <Text style={styles.subSectionTitle}>Links</Text>
                  <View style={styles.linksRow}>
                    {rocket.configuration?.info_url && (
                      <TouchableOpacity onPress={() => openUrl(rocket.configuration.info_url)}>
                        <Text style={styles.linkText}>More Info →</Text>
                      </TouchableOpacity>
                    )}
                    {rocket.configuration?.wiki_url && (
                      <TouchableOpacity onPress={() => openUrl(rocket.configuration.wiki_url)}>
                        <Text style={styles.linkText}>Wikipedia →</Text>
                      </TouchableOpacity>
                    )}
                    </View>
                  </View>
                )}

              {/* Description */}
              {rocket.configuration?.description && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.subSectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{rocket.configuration.description}</Text>
                  </View>
                )}
            </>
            )}
                  </View>
                )}

        {/* ENGINE Section */}
        {(() => {
            let engines = [];
            
            // Primary: Check launch.engines
            if (launch.engines && Array.isArray(launch.engines) && launch.engines.length > 0) {
              engines = launch.engines;
            }
            // Fallback 1: Check rocket.launcher_stage
            else if (rocket?.launcher_stage && Array.isArray(rocket.launcher_stage)) {
              engines = rocket.launcher_stage.flatMap((stage, stageIdx) => 
                (stage.engines || []).map((engine) => ({
                  ...engine,
                  stage: stageIdx + 1,
                  stage_type: stage.type || `Stage ${stageIdx + 1}`,
                  reusable: stage.reusable || false
                }))
              );
            }
            // Fallback 2: Check rocket.configuration.launcher_stage
            else if (rocket?.configuration?.launcher_stage && Array.isArray(rocket.configuration.launcher_stage)) {
              engines = rocket.configuration.launcher_stage.flatMap((stage, stageIdx) => 
                (stage.engines || []).map((engine) => ({
                  ...engine,
                  stage: stageIdx + 1,
                  stage_type: stage.type || `Stage ${stageIdx + 1}`,
                  reusable: stage.reusable || false
                }))
              );
            }
            
            if (engines.length > 0) {
              // Group engines by stage
              const enginesByStage = engines.reduce((acc, engine) => {
                const stageKey = engine.stage || engine.stage_type || 'Unknown';
                if (!acc[stageKey]) {
                  acc[stageKey] = {
                    stage: engine.stage || null,
                    stage_type: engine.stage_type || stageKey,
                    reusable: engine.reusable || false,
                    engines: []
                  };
                }
                acc[stageKey].engines.push(engine);
                return acc;
              }, {});
              
              return Object.values(enginesByStage).map((stageGroup, stageIdx) => (
                <View key={stageIdx} style={[styles.engineStageGroup, stageIdx < Object.keys(enginesByStage).length - 1 && styles.engineStageBorder]}>
                  <View style={styles.engineStageHeader}>
                    <Text style={styles.engineStageTitle}>{stageGroup.stage_type}</Text>
                    {stageGroup.reusable && (
                      <Text style={styles.reusableBadge}>(Reusable)</Text>
                    )}
              </View>
                  {stageGroup.engines.map((engine, engineIdx) => (
                    <View key={engineIdx} style={styles.engineCard}>
                      <Text style={styles.engineName}>
                        {engine.engine_name || engine.name || engine.type || engine.engine_type || engine.configuration || 'Engine'}
                      </Text>
                      <View style={styles.twoColumnGrid}>
                        {engine.engine_type && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Type:</Text>
                            <Text style={styles.gridValue}>{engine.engine_type}</Text>
                    </View>
                  )}
                        {engine.engine_configuration && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Configuration:</Text>
                            <Text style={styles.gridValue}>{engine.engine_configuration}</Text>
                    </View>
                  )}
                        {engine.engine_layout && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Layout:</Text>
                            <Text style={styles.gridValue}>{engine.engine_layout}</Text>
                </View>
              )}
                        {engine.engine_version && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Version:</Text>
                            <Text style={styles.gridValue}>{engine.engine_version}</Text>
                </View>
              )}
                        {(engine.isp_sea_level || engine.isp_vacuum) && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>ISP:</Text>
                            <Text style={styles.gridValue}>
                              {engine.isp_sea_level ? `Sea Level: ${engine.isp_sea_level}s` : ''}
                              {engine.isp_sea_level && engine.isp_vacuum ? ' | ' : ''}
                              {engine.isp_vacuum ? `Vacuum: ${engine.isp_vacuum}s` : ''}
                      </Text>
                    </View>
                  )}
                        {engine.thrust_sea_level_kn && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Thrust (Sea Level):</Text>
                            <Text style={styles.gridValue}>{engine.thrust_sea_level_kn} kN</Text>
                  </View>
                )}
                        {engine.thrust_vacuum_kn && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Thrust (Vacuum):</Text>
                            <Text style={styles.gridValue}>{engine.thrust_vacuum_kn} kN</Text>
                              </View>
                            )}
                        {engine.number_of_engines && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Number of Engines:</Text>
                            <Text style={styles.gridValue}>{engine.number_of_engines}</Text>
                              </View>
                            )}
                        {engine.propellant_1 && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Propellant 1:</Text>
                            <Text style={styles.gridValue}>{engine.propellant_1}</Text>
                          </View>
                        )}
                        {engine.propellant_2 && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Propellant 2:</Text>
                            <Text style={styles.gridValue}>{engine.propellant_2}</Text>
                            </View>
                          )}
                        {engine.engine_loss_max && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Engine Loss Max:</Text>
                            <Text style={styles.gridValue}>{engine.engine_loss_max}</Text>
                            </View>
                          )}
                        {engine.stage_thrust_kn && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Stage Thrust:</Text>
                            <Text style={styles.gridValue}>{engine.stage_thrust_kn} kN</Text>
                            </View>
                          )}
                        {engine.stage_fuel_amount_tons && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Fuel Amount:</Text>
                            <Text style={styles.gridValue}>{engine.stage_fuel_amount_tons} tons</Text>
                            </View>
                          )}
                        {engine.stage_burn_time_sec && (
                          <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Burn Time:</Text>
                            <Text style={styles.gridValue}>{engine.stage_burn_time_sec} seconds</Text>
                            </View>
                          )}
                            </View>
                            </View>
                  ))}
                            </View>
              ));
            } else {
              return null;
            }
          })()}

        {/* PROVIDER Section */}
        {launchServiceProvider && (launchServiceProvider.name || launchServiceProvider.id) && 
         (launchServiceProvider.name || launchServiceProvider.description || launchServiceProvider.abbrev || 
          launchServiceProvider.type || launchServiceProvider.founding_year || launchServiceProvider.country_code || 
          launchServiceProvider.administrator || launchServiceProvider.url || launchServiceProvider.wiki_url || 
          launchServiceProvider.info_url || launchServiceProvider.logo_url) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROVIDER</Text>
            <View style={styles.redSeparator} />
            {launchServiceProvider.name && (
              <Text style={styles.providerName}>{launchServiceProvider.name}</Text>
            )}
            {launchServiceProvider.description && (
              <Text style={styles.providerDescription}>{launchServiceProvider.description}</Text>
            )}
            {(launchServiceProvider.abbrev || launchServiceProvider.type || launchServiceProvider.founding_year || 
              launchServiceProvider.country_code || launchServiceProvider.administrator) && (
              <View style={styles.missionDetailsList}>
                {launchServiceProvider.abbrev && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Abbreviation:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{launchServiceProvider.abbrev}</Text>
                  </View>
                )}
                {launchServiceProvider.type && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Type:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>
                      {typeof launchServiceProvider.type === 'object' 
                        ? launchServiceProvider.type.name || 'N/A'
                        : launchServiceProvider.type}
                    </Text>
                  </View>
                )}
                {launchServiceProvider.founding_year && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Founded:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{launchServiceProvider.founding_year}</Text>
                  </View>
                )}
                {launchServiceProvider.country_code && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Country:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{launchServiceProvider.country_code}</Text>
                  </View>
                )}
                {launchServiceProvider.administrator && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Administrator:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{launchServiceProvider.administrator}</Text>
                  </View>
                )}
              </View>
            )}
            {(launchServiceProvider.url || launchServiceProvider.wiki_url || launchServiceProvider.info_url) && (
              <View style={styles.linksContainer}>
                <Text style={styles.subSectionTitle}>Links</Text>
                <View style={styles.linksRow}>
                  {launchServiceProvider.url && (
                    <TouchableOpacity onPress={() => openUrl(launchServiceProvider.url)}>
                      <Text style={styles.linkText}>Official Website →</Text>
                    </TouchableOpacity>
                  )}
                  {launchServiceProvider.wiki_url && (
                    <TouchableOpacity onPress={() => openUrl(launchServiceProvider.wiki_url)}>
                      <Text style={styles.linkText}>Wikipedia →</Text>
                    </TouchableOpacity>
                  )}
                  {launchServiceProvider.info_url && (
                    <TouchableOpacity onPress={() => openUrl(launchServiceProvider.info_url)}>
                      <Text style={styles.linkText}>More Info →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            {launchServiceProvider.logo_url && (
              <View style={styles.logoContainer}>
                <Image 
                  source={{ uri: launchServiceProvider.logo_url }} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        {/* PAD Section */}
        {pad && (pad.name || pad.id) && 
         (pad.name || pad.description || pad.location?.name || pad.country_code || pad.latitude || pad.longitude ||
          pad.total_launch_count !== null || pad.orbital_launch_attempt_count !== null || pad.info_url || 
          pad.wiki_url || pad.map_url || pad.map_image) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAD</Text>
            <View style={styles.redSeparator} />
            {pad.name && (
              <Text style={styles.padName}>{pad.name}</Text>
            )}
            {pad.description && (
              <Text style={styles.padDescription}>{pad.description}</Text>
            )}
            {(pad.location?.name || pad.country_code || pad.latitude || pad.longitude || 
              pad.total_launch_count !== null || pad.orbital_launch_attempt_count !== null) && (
              <View style={styles.missionDetailsList}>
                {pad.location?.name && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Location:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{pad.location.name}</Text>
                  </View>
                )}
                {pad.country_code && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Country:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{pad.country_code}</Text>
                  </View>
                )}
                {pad.latitude && pad.longitude && (
                  <>
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Latitude:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{pad.latitude}°</Text>
                    </View>
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Longitude:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{pad.longitude}°</Text>
                    </View>
                  </>
                )}
                {pad.total_launch_count !== null && pad.total_launch_count !== undefined && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Total Launches:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{pad.total_launch_count}</Text>
                  </View>
                )}
                {pad.orbital_launch_attempt_count !== null && pad.orbital_launch_attempt_count !== undefined && (
                  <View style={styles.missionDetailRow}>
                    <Text style={styles.missionDetailLabel}>Orbital Launch Attempts:</Text>
                    <View style={styles.verticalRedSeparator} />
                    <Text style={styles.missionDetailValue}>{pad.orbital_launch_attempt_count}</Text>
                  </View>
                )}
              </View>
            )}
            {(pad.info_url || pad.wiki_url || pad.map_url) && (
              <View style={styles.linksContainer}>
                <Text style={styles.subSectionTitle}>Links</Text>
                <View style={styles.linksRow}>
                  {pad.info_url && (
                    <TouchableOpacity onPress={() => openUrl(pad.info_url)}>
                      <Text style={styles.linkText}>More Info →</Text>
                    </TouchableOpacity>
                  )}
                  {pad.wiki_url && (
                    <TouchableOpacity onPress={() => openUrl(pad.wiki_url)}>
                      <Text style={styles.linkText}>Wikipedia →</Text>
                    </TouchableOpacity>
                  )}
                  {pad.map_url && (
                    <TouchableOpacity onPress={() => openUrl(pad.map_url)}>
                      <Text style={styles.linkText}>View Map →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            {pad.map_image && (
              <View style={styles.mapContainer}>
                <Image 
                  source={{ uri: pad.map_image }} 
                  style={styles.mapImage}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        )}

        {/* HAZARDS Section */}
        {launch.hazards && Array.isArray(launch.hazards) && launch.hazards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HAZARDS</Text>
            <View style={styles.redSeparator} />
            {launch.hazards.map((hazard, idx) => (
              <View key={idx} style={[styles.hazardCard, idx < launch.hazards.length - 1 && styles.hazardBorder]}>
                {hazard.description && (
                  <Text style={styles.hazardDescription}>{hazard.description}</Text>
                )}
                <View style={styles.missionDetailsList}>
                  {hazard.type && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Type:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{hazard.type}</Text>
                    </View>
                  )}
                  {hazard.severity && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Severity:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{hazard.severity}</Text>
                    </View>
                  )}
                  {hazard.source && (
                    <View style={styles.missionDetailRow}>
                      <Text style={styles.missionDetailLabel}>Source:</Text>
                      <View style={styles.verticalRedSeparator} />
                      <Text style={styles.missionDetailValue}>{hazard.source}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Video Player Section - Inline like website */}
        {youtubeVideoId && (
          <View 
            ref={videoSectionRef} 
            style={styles.section}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setVideoSectionY(y);
            }}
          >
            <View style={styles.videoPlayerContainer}>
              <View style={styles.videoPlayerWrapper}>
                {/* Red Borders */}
                <View style={styles.videoBorderLeft} />
                <View style={styles.videoBorderTop} />
                <View style={styles.videoBorderRight} />
                <View style={styles.videoBorderBottom} />
                
                {/* Background Image */}
                <ImageBackground
                  source={{ uri: imageUrl || 'https://i.imgur.com/3kPqWvM.jpeg' }}
                  style={styles.videoBackgroundImage}
                  imageStyle={styles.videoBackgroundImageStyle}
                >
                  {/* Dark Overlay - Hide when video is playing */}
                  {!isVideoPlaying && (
                    <View style={styles.videoOverlay} />
                  )}
                  
                  {/* YouTube Video - Only render when playing */}
                  {isVideoPlaying && (
                    <WebView
                      source={{ uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0` }}
                      style={styles.videoWebView}
                      allowsFullscreenVideo={true}
                      mediaPlaybackRequiresUserAction={false}
                    />
                  )}
                  
                  {/* Branding - Top Left */}
                  <View style={styles.videoBranding}>
                    <View style={styles.videoLogoContainer}>
                            <Image 
                        source={require('../../../assets/tlp-helmet.png')}
                        style={styles.videoLogo}
                              resizeMode="contain"
                            />
                          </View>
                    <Text style={styles.videoBrandingText}>THE LAUNCH PAD</Text>
                      </View>
                  
                  {/* Website - Top Right */}
                  <View style={styles.videoWebsite}>
                    <Text style={styles.videoWebsiteText}>TLPNETWORK.COM</Text>
                        </View>
                  
                  {/* Pause/Close Button - Show when video is playing */}
                  {isVideoPlaying && (
                    <TouchableOpacity
                      style={styles.videoStopButton}
                      onPress={() => setIsVideoPlaying(false)}
                    >
                      <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  
                  {/* Launch Name with Play Button - Centered - Hide when video is playing */}
                  {!isVideoPlaying && (
                    <View style={styles.videoContent}>
                      <View style={styles.videoTitleContainer}>
                        <Text style={styles.videoTitle}>{launchName.firstLine.toUpperCase()}</Text>
                        
                        {/* Play Button Overlay */}
                        {youtubeVideoId && (
                          <TouchableOpacity
                            style={styles.videoPlayButton}
                            onPress={() => setIsVideoPlaying(true)}
                          >
                            <Ionicons name="play" size={32} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        </View>
                        </View>
                      )}
                </ImageBackground>
                        </View>
                        </View>
                        </View>
                      )}

        {/* Hazard Maps Section */}
        {pad.map_image && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HAZARD MAPS</Text>
            
            {/* Hazard Tabs */}
            <View style={styles.hazardTabsContainer}>
              {hazardTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.hazardTab,
                    activeHazardTab === tab && styles.hazardTabActive
                  ]}
                  onPress={() => setActiveHazardTab(tab)}
                >
                  <Text style={[
                    styles.hazardTabText,
                    activeHazardTab === tab && styles.hazardTabTextActive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hazard Map Content */}
            <View style={styles.mapContainer}>
              <Image 
                source={{ uri: pad.map_image }} 
                style={styles.mapImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* STATS Section */}
        {(launch.orbital_launch_attempt_count !== null || 
          launch.location_launch_attempt_count !== null || 
          launch.pad_launch_attempt_count !== null || 
          launch.agency_launch_attempt_count !== null ||
          launch.orbital_launch_attempt_count_year !== null ||
          launch.location_launch_attempt_count_year !== null ||
          launch.pad_launch_attempt_count_year !== null ||
          launch.agency_launch_attempt_count_year !== null ||
          launch.pad_turnaround) && (
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>STATS</Text>
            <View style={styles.redSeparator} />
            <View style={styles.statsGrid}>
                {launch.orbital_launch_attempt_count !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Orbital Launch Attempt Count</Text>
                  <Text style={styles.statValue}>{launch.orbital_launch_attempt_count.toLocaleString()}</Text>
                  </View>
                )}
                {launch.location_launch_attempt_count !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Location Launch Attempt Count</Text>
                  <Text style={styles.statValue}>{launch.location_launch_attempt_count.toLocaleString()}</Text>
                  </View>
                )}
                {launch.pad_launch_attempt_count !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pad Launch Attempt Count</Text>
                  <Text style={styles.statValue}>{launch.pad_launch_attempt_count.toLocaleString()}</Text>
                  </View>
                )}
                {launch.agency_launch_attempt_count !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Agency Launch Attempt Count</Text>
                  <Text style={styles.statValue}>{launch.agency_launch_attempt_count.toLocaleString()}</Text>
                  </View>
                )}
                {launch.orbital_launch_attempt_count_year !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Orbital Launch Attempts (This Year)</Text>
                  <Text style={styles.statValue}>{launch.orbital_launch_attempt_count_year.toLocaleString()}</Text>
                  </View>
                )}
                {launch.location_launch_attempt_count_year !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Location Launch Attempts (This Year)</Text>
                  <Text style={styles.statValue}>{launch.location_launch_attempt_count_year.toLocaleString()}</Text>
                  </View>
                )}
                {launch.pad_launch_attempt_count_year !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pad Launch Attempts (This Year)</Text>
                  <Text style={styles.statValue}>{launch.pad_launch_attempt_count_year.toLocaleString()}</Text>
                  </View>
                )}
                {launch.agency_launch_attempt_count_year !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Agency Launch Attempts (This Year)</Text>
                  <Text style={styles.statValue}>{launch.agency_launch_attempt_count_year.toLocaleString()}</Text>
                  </View>
                )}
              {launch.pad_turnaround && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Pad Turnaround</Text>
                  <Text style={styles.statValue}>{launch.pad_turnaround}</Text>
                  </View>
                )}
                  </View>
                  </View>
                )}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>
              {commentsTotal} {commentsTotal === 1 ? 'Comment' : 'Comments'}
            </Text>
          </View>

          {/* Comment Input */}
          {user ? (
            <>
              {replyingTo ? (
                <View style={styles.replyContainer}>
                  <View style={styles.replyHeader}>
                    <Text style={styles.replyHeaderText}>
                      Replying to {replyingTo.username || 'comment'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                    >
                      <Text style={styles.cancelReplyText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.commentInputRow}>
                    <View style={styles.userAvatar}>
                      {user.profile_image_url ? (
                        <Image 
                          source={{ uri: user.profile_image_url }} 
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons name="person" size={scale(20)} color="#666666" />
                      )}
                    </View>
                    <View style={[styles.commentInputContainer, { marginLeft: getResponsivePadding(theme.spacing.sm) }]}>
                      <TextInput
                        value={replyContent}
                        onChangeText={setReplyContent}
                        placeholder="Write a reply..."
                        placeholderTextColor="#666666"
                        style={[
                          styles.commentTextInput,
                          replyInputFocused && styles.commentTextInputFocused,
                          Platform.OS === 'web' && {
                            outline: 'none',
                            outlineWidth: 0,
                            outlineStyle: 'none',
                            outlineOffset: 0,
                          }
                        ]}
                        multiline
                        numberOfLines={3}
                        selectionColor={theme.colors.focus}
                        underlineColorAndroid="transparent"
                        onFocus={() => setReplyInputFocused(true)}
                        onBlur={() => setReplyInputFocused(false)}
                      />
                      <TouchableOpacity
                        onPress={handleReply}
                        disabled={!replyContent.trim()}
                        style={[styles.postButton, !replyContent.trim() && styles.postButtonDisabled]}
                      >
                        <Text style={styles.postButtonText}>Post Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.commentInputRow}>
                  <View style={styles.userAvatar}>
                    {user.profile_image_url ? (
                      <Image 
                        source={{ uri: user.profile_image_url }} 
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={scale(20)} color="#666666" />
                    )}
                  </View>
                  <View style={[styles.commentInputContainer, { marginLeft: getResponsivePadding(theme.spacing.sm) }]}>
                    <TextInput
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Join the discussion."
                      placeholderTextColor="#666666"
                      style={[
                        styles.commentTextInput,
                        commentInputFocused && styles.commentTextInputFocused,
                        Platform.OS === 'web' && {
                          outline: 'none',
                          outlineWidth: 0,
                          outlineStyle: 'none',
                          outlineOffset: 0,
                        }
                      ]}
                      multiline
                      numberOfLines={3}
                      selectionColor={theme.colors.focus}
                      underlineColorAndroid="transparent"
                      onFocus={() => setCommentInputFocused(true)}
                      onBlur={() => setCommentInputFocused(false)}
                    />
                    <TouchableOpacity
                      onPress={handleSubmitComment}
                      disabled={!newComment.trim()}
                      style={[styles.postButton, !newComment.trim() && styles.postButtonDisabled]}
                    >
                      <Text style={styles.postButtonText}>Post Comment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Please log in to join the discussion.</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              onPress={() => setCommentSort('best')}
              style={[
                styles.sortButton,
                commentSort === 'best' && styles.sortButtonActive
              ]}
            >
              <Text style={[
                styles.sortButtonText,
                commentSort === 'best' && styles.sortButtonTextActive
              ]}>
                Best
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCommentSort('newest')}
              style={[
                styles.sortButton,
                { marginLeft: getResponsivePadding(theme.spacing.md) },
                commentSort === 'newest' && styles.sortButtonActive
              ]}
            >
              <Text style={[
                styles.sortButtonText,
                commentSort === 'newest' && styles.sortButtonTextActive
              ]}>
                Newest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCommentSort('oldest')}
              style={[
                styles.sortButton,
                { marginLeft: getResponsivePadding(theme.spacing.md) },
                commentSort === 'oldest' && styles.sortButtonActive
              ]}
            >
              <Text style={[
                styles.sortButtonText,
                commentSort === 'oldest' && styles.sortButtonTextActive
              ]}>
                Oldest
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {commentsLoading ? (
            <View style={styles.commentsLoading}>
              <Text style={styles.commentsLoadingText}>Loading comments...</Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.commentsEmpty}>
              <Text style={styles.commentsEmptyText}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={setReplyingTo}
                  onUpdate={handleCommentUpdate}
                  onDelete={handleCommentDelete}
                  navigation={navigation}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Video Player Modal */}
      {isVideoPlaying && youtubeVideoId && (
        <View style={styles.videoModal}>
          <TouchableOpacity 
            style={styles.videoCloseButton}
            onPress={() => setIsVideoPlaying(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <WebView
            source={{ uri: `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0` }}
            style={styles.videoModalWebView}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    left: getResponsivePadding(theme.spacing.md),
    zIndex: 100,
    padding: getResponsivePadding(theme.spacing.sm),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroSection: {
    padding: getResponsivePadding(theme.spacing.lg),
    paddingTop: scale(10) + getResponsivePadding(theme.spacing.xs),
    minHeight: scale(400),
    justifyContent: 'center',
    position: 'relative',
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  heroContent: {
    paddingTop: getResponsivePadding(theme.spacing.xl) + scale(40),
    position: 'relative',
    zIndex: 1,
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: getResponsivePadding(theme.spacing.lg),
    right: getResponsivePadding(theme.spacing.lg),
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  actionButton: {
    backgroundColor: '#8B1A1A',
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    borderRadius: scale(4),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '700',
    letterSpacing: 1,
  },
  missionTitle: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: getResponsivePadding(theme.spacing.xl),
    letterSpacing: 1,
    fontFamily: 'System',
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsivePadding(theme.spacing.lg),
    gap: getResponsivePadding(theme.spacing.xs),
  },
  countdownItem: {
    alignItems: 'center',
  },
  countdownValue: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    fontFamily: 'monospace',
  },
  countdownLabel: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    letterSpacing: 1,
    fontWeight: '400',
  },
  countdownSeparator: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: '300',
    color: '#FFFFFF',
    marginHorizontal: getResponsivePadding(theme.spacing.xs),
    marginBottom: getResponsivePadding(theme.spacing.xs) + getResponsiveFontSize(theme.fontSizes.xs),
  },
  section: {
    padding: getResponsivePadding(theme.spacing.lg),
    borderTopWidth: 1,
    borderTopColor: '#222222',
    backgroundColor: '#000000',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
    letterSpacing: 1,
  },
  redSeparator: {
    height: 2,
    backgroundColor: '#8B1A1A',
    width: '100%',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  liftOffTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  liftOffTimeLabel: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: getResponsivePadding(theme.spacing.sm),
  },
  verticalRedSeparator: {
    width: 2,
    height: scale(20),
    backgroundColor: '#8B1A1A',
    marginHorizontal: getResponsivePadding(theme.spacing.sm),
    flexShrink: 0,
  },
  liftOffTimeValueContainer: {
    flexDirection: 'column',
  },
  liftOffTimeValue: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    lineHeight: scale(14),
  },
  infoRow: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#888888',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    fontWeight: '600',
  },
  infoValue: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#FFFFFF',
    lineHeight: scale(20),
    textAlign: 'center',
  },
  windowBarContainer: {
    marginVertical: getResponsivePadding(theme.spacing.md),
  },
  windowProgressContainer: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  windowProgressTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    textAlign: 'left',
  },
  windowProgressBar: {
    width: '100%',
    height: scale(8),
    position: 'relative',
  },
  windowProgressBarBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
    borderRadius: scale(4),
    overflow: 'visible',
    position: 'relative',
  },
  windowProgressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B1A1A',
    borderRadius: scale(4),
    position: 'absolute',
    left: 0,
    top: 0,
  },
  windowRocketIcon: {
    position: 'absolute',
    left: scale(-8),
    top: '50%',
    marginTop: scale(-12),
    zIndex: 10,
    transform: [{ rotate: '-45deg' }],
  },
  windowBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  windowBox: {
    backgroundColor: '#222222',
    borderRadius: scale(8),
    padding: getResponsivePadding(theme.spacing.md),
    alignSelf: 'flex-start',
  },
  windowBoxLabel: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    fontWeight: '400',
  },
  windowBoxTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: scale(2),
  },
  windowBoxUTC: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    fontWeight: '400',
  },
  mapContainer: {
    height: scale(200),
    backgroundColor: '#111111',
    borderRadius: scale(8),
    marginTop: getResponsivePadding(theme.spacing.md),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
  },
  mapNote: {
    color: '#666666',
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    marginTop: getResponsivePadding(theme.spacing.xs),
  },
  missionDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#FFFFFF',
    lineHeight: scale(22),
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  missionDetailsList: {
    marginTop: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
  },
  missionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
    width: '100%',
  },
  missionDetailLabel: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    paddingRight: getResponsivePadding(theme.spacing.sm),
    maxWidth: '45%',
  },
  missionDetailValue: {
    fontSize: getResponsiveFontSize(10),
    color: '#FFFFFF',
    textAlign: 'left',
    flex: 1,
    paddingLeft: getResponsivePadding(theme.spacing.sm),
    maxWidth: '45%',
  },
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: getResponsivePadding(theme.spacing.sm),
  },
  gridItem: {
    width: '50%',
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingRight: getResponsivePadding(theme.spacing.sm),
  },
  gridLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#888888',
    marginBottom: getResponsivePadding(theme.spacing.xs),
    fontWeight: '600',
  },
  gridValue: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hazardTabsContainer: {
    flexDirection: 'row',
    marginBottom: getResponsivePadding(theme.spacing.md),
    gap: getResponsivePadding(theme.spacing.sm),
  },
  hazardTab: {
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: scale(4),
    backgroundColor: '#111111',
  },
  hazardTabActive: {
    borderColor: '#8B1A1A',
    backgroundColor: '#8B1A1A',
  },
  hazardTabText: {
    color: '#666666',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
  },
  hazardTabTextActive: {
    color: '#FFFFFF',
  },
  // Video Player Section - Inline
  videoPlayerContainer: {
    width: '100%',
    backgroundColor: '#000000',
    paddingVertical: getResponsivePadding(theme.spacing.md),
    paddingHorizontal: getResponsivePadding(theme.spacing.sm),
  },
  videoPlayerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  videoBorderLeft: {
    position: 'absolute',
    left: scale(16),
    top: 0,
    bottom: scale(16),
    width: 2,
    backgroundColor: '#8B1A1A',
    zIndex: 30,
  },
  videoBorderTop: {
    position: 'absolute',
    top: scale(32),
    left: scale(48),
    right: scale(16),
    height: 2,
    backgroundColor: '#8B1A1A',
    zIndex: 30,
  },
  videoBorderRight: {
    position: 'absolute',
    right: scale(16),
    top: scale(32),
    bottom: scale(16),
    width: 2,
    backgroundColor: '#8B1A1A',
    zIndex: 30,
  },
  videoBorderBottom: {
    position: 'absolute',
    bottom: scale(16),
    left: scale(16),
    right: scale(16),
    height: 2,
    backgroundColor: '#8B1A1A',
    zIndex: 30,
  },
  videoBackgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBackgroundImageStyle: {
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 10,
  },
  videoWebView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 20,
  },
  videoBranding: {
    position: 'absolute',
    top: scale(8),
    left: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  videoLogoContainer: {
    width: scale(32),
    height: scale(32),
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  videoLogo: {
    width: scale(24),
    height: scale(24),
  },
  videoBrandingText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: scale(8),
    letterSpacing: 1,
    fontFamily: 'System',
  },
  videoWebsite: {
    position: 'absolute',
    top: scale(4),
    right: scale(8),
    zIndex: 20,
  },
  videoWebsiteText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xs),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  videoStopButton: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  videoContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  videoTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoTitle: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'System',
    paddingHorizontal: scale(16),
  },
  videoPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: scale(-24),
    marginLeft: scale(-40),
    width: scale(80),
    height: scale(48),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: scale(4),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    paddingLeft: scale(4),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xl),
    color: '#FFFFFF',
  },
  // PAYLOAD styles
  payloadCard: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  payloadBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: getResponsivePadding(theme.spacing.md),
  },
  payloadName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  payloadDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#CCCCCC',
    lineHeight: scale(20),
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  // CREW styles
  crewTabsContainer: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  crewTabsScrollContent: {
    paddingRight: getResponsivePadding(theme.spacing.md),
  },
  crewTab: {
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: scale(4),
    backgroundColor: '#111111',
    marginRight: getResponsivePadding(theme.spacing.sm),
    minWidth: scale(100),
  },
  crewTabActive: {
    borderColor: '#8B1A1A',
    backgroundColor: '#8B1A1A',
  },
  crewTabText: {
    color: '#666666',
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    fontWeight: '600',
    textAlign: 'center',
  },
  crewTabTextActive: {
    color: '#FFFFFF',
  },
  crewCard: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  crewName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  crewBio: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#CCCCCC',
    lineHeight: scale(20),
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  // ROCKET styles
  missionDescriptionContainer: {
    marginBottom: getResponsivePadding(theme.spacing.lg),
  },
  missionDescriptionText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#CCCCCC',
    lineHeight: scale(22),
  },
  subSectionTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.md),
    fontWeight: '600',
    color: '#CCCCCC',
    marginTop: getResponsivePadding(theme.spacing.md),
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  statsContainer: {
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: getResponsivePadding(theme.spacing.sm),
  },
  statCard: {
    width: '48%',
    backgroundColor: '#111111',
    padding: getResponsivePadding(theme.spacing.md),
    borderRadius: scale(8),
    marginBottom: getResponsivePadding(theme.spacing.sm),
    marginRight: '2%',
  },
  statLabel: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#888888',
    marginBottom: getResponsivePadding(theme.spacing.xs),
  },
  statValue: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linksContainer: {
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsivePadding(theme.spacing.md),
  },
  linkText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#8B1A1A',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: getResponsivePadding(theme.spacing.md),
  },
  descriptionText: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#CCCCCC',
    lineHeight: scale(22),
  },
  // Comments Section Styles
  commentsSection: {
    backgroundColor: '#0a0a0a',
    padding: getResponsivePadding(theme.spacing.lg),
    marginTop: getResponsivePadding(theme.spacing.lg),
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  commentsHeader: {
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  commentsTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  userAvatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
  },
  commentInputContainer: {
    flex: 1,
  },
  commentTextInput: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#8B1A1A',
    borderRadius: scale(8),
    padding: getResponsivePadding(theme.spacing.md),
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(14),
    minHeight: scale(80),
    textAlignVertical: 'top',
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  commentTextInputFocused: {
    borderColor: '#8B1A1A',
    borderWidth: 1.5,
  },
  postButton: {
    backgroundColor: '#8B1A1A',
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.sm),
    borderRadius: scale(8),
    alignSelf: 'flex-start',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  replyContainer: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.md),
    backgroundColor: '#222222',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#333333',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.sm),
  },
  replyHeaderText: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
  },
  cancelReplyText: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
  },
  loginPrompt: {
    marginBottom: getResponsivePadding(theme.spacing.md),
    padding: getResponsivePadding(theme.spacing.md),
    backgroundColor: '#222222',
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: getResponsiveFontSize(14),
    color: '#999999',
    marginBottom: getResponsivePadding(theme.spacing.sm),
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: getResponsivePadding(theme.spacing.md),
    paddingVertical: getResponsivePadding(theme.spacing.sm),
  },
  loginButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: '#8B1A1A',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
    paddingBottom: getResponsivePadding(theme.spacing.md),
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  sortButton: {
    paddingHorizontal: scale(4),
    paddingBottom: scale(4),
  },
  sortButtonText: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
  },
  sortButtonTextActive: {
    color: '#8B1A1A',
    fontWeight: '600',
  },
  sortButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B1A1A',
  },
  commentsLoading: {
    paddingVertical: getResponsivePadding(theme.spacing.xl),
    alignItems: 'center',
  },
  commentsLoadingText: {
    fontSize: getResponsiveFontSize(14),
    color: '#999999',
  },
  commentsEmpty: {
    paddingVertical: getResponsivePadding(theme.spacing.xl),
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: getResponsiveFontSize(14),
    color: '#999999',
    textAlign: 'center',
  },
  commentsList: {
    marginTop: getResponsivePadding(theme.spacing.sm),
  },
  // ENGINE styles
  engineStageGroup: {
    marginBottom: getResponsivePadding(theme.spacing.xl),
  },
  engineStageBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: getResponsivePadding(theme.spacing.xl),
  },
  engineStageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  engineStageTitle: {
    fontSize: getResponsiveFontSize(theme.fontSizes.xl),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reusableBadge: {
    fontSize: getResponsiveFontSize(theme.fontSizes.sm),
    color: '#4ADE80',
    marginLeft: getResponsivePadding(theme.spacing.sm),
  },
  engineCard: {
    backgroundColor: '#111111',
    padding: getResponsivePadding(theme.spacing.md),
    borderRadius: scale(8),
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  engineName: {
    fontSize: getResponsiveFontSize(theme.fontSizes.lg),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  // PROVIDER styles
  providerName: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  providerDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#CCCCCC',
    lineHeight: scale(22),
    marginBottom: getResponsivePadding(theme.spacing.lg),
  },
  logoContainer: {
    marginTop: getResponsivePadding(theme.spacing.md),
    alignItems: 'center',
  },
  logoImage: {
    width: scale(200),
    height: scale(200),
    borderRadius: scale(8),
  },
  // PAD styles
  padName: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  padDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#CCCCCC',
    lineHeight: scale(22),
    marginBottom: getResponsivePadding(theme.spacing.lg),
  },
  // HAZARDS styles
  hazardCard: {
    backgroundColor: '#111111',
    padding: getResponsivePadding(theme.spacing.md),
    borderRadius: scale(8),
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
  hazardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: getResponsivePadding(theme.spacing.md),
  },
  hazardDescription: {
    fontSize: getResponsiveFontSize(theme.fontSizes.base),
    color: '#CCCCCC',
    lineHeight: scale(22),
    marginBottom: getResponsivePadding(theme.spacing.md),
  },
});

export default LaunchDetail;
