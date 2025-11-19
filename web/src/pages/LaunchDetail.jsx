import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
import CommentItem from '../components/CommentItem';
import { getLaunchComments, createLaunchComment } from '../services/comments';
import { useAuth } from '../contexts/AuthContext';
import { getLaunchSlug } from '../utils/slug';
import { IoRocket } from 'react-icons/io5';
import RedDotLoader from '../components/common/RedDotLoader';
const HERO_BG_IMAGE = 'https://i.imgur.com/3kPqWvM.jpeg';

const LaunchDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [launch, setLaunch] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeTab, setActiveTab] = useState('ROCKET');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('newest');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [authorImageError, setAuthorImageError] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const tabs = ['PAYLOAD', 'CREW', 'ROCKET', 'ENGINE', 'PROVIDER', 'PAD', 'HAZARDS', 'STATS'];

  useEffect(() => {
    fetchLaunch();
  }, [slug]);

  useEffect(() => {
    if (launch?.net) {
      startCountdown(launch.net);
    }
  }, [launch]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'pm' : 'am';
      setCurrentTime(`${hours}:${minutes}${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchComments = async () => {
    // Use database_id (numeric) for API calls
    // If database_id is not available, try to extract numeric ID from id field
    let launchId = launch?.database_id;
    
    // If database_id is not set, check if id is numeric
    if (!launchId && launch?.id) {
      const idStr = launch.id.toString();
      if (/^\d+$/.test(idStr)) {
        launchId = parseInt(idStr);
      }
    }
    
    if (!launchId) {
      console.warn('No numeric launch ID available for comments API');
      return;
    }
    
    setCommentsLoading(true);
    try {
      const response = await getLaunchComments(launchId, commentSort);
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

  // Fetch comments when launch or sort changes
  useEffect(() => {
    const launchId = launch?.database_id || launch?.id;
    if (launchId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch?.database_id, launch?.id, commentSort]);

  // Scroll to comments section if hash is present in URL
  useEffect(() => {
    if (location.hash === '#comments' && !loading) {
      setTimeout(() => {
        const commentsElement = document.getElementById('comments');
        if (commentsElement) {
          commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [location.hash, loading]);


  const fetchLaunch = async () => {
    try {
      let launchId;
      let launchData;
      
      // Check if slug is numeric (old ID format) - if so, use ID directly
      const isNumericSlug = /^\d+$/.test(slug);
      
      if (isNumericSlug) {
        // If slug is numeric, use it as ID
        launchId = parseInt(slug);
      } else {
        // For non-numeric slug, try multiple approaches
        try {
          // First, try fetching by slug directly
          try {
            const slugRes = await axios.get(`${API_URL}/api/launches/${slug}`);
            const slugData = slugRes.data;
            
            if (slugData) {
              launchData = slugData;
              // Extract numeric database ID
              if (slugData.database_id) {
                launchId = slugData.database_id;
              } else if (slugData.id && /^\d+$/.test(slugData.id.toString())) {
                launchId = parseInt(slugData.id);
              }
            }
          } catch (directSlugError) {
            // If direct slug fetch fails, try using the list endpoint to find the launch
            console.log('Direct slug fetch failed, trying list endpoint...');
            try {
              const listRes = await axios.get(`${API_URL}/api/launches?slug=${encodeURIComponent(slug)}`);
              const listData = listRes.data;
              
              if (listData && listData.data && listData.data.length > 0) {
                const foundLaunch = listData.data[0];
                // Found the launch via list endpoint
                // The list response has numeric id field (database ID)
                if (foundLaunch.id && /^\d+$/.test(foundLaunch.id.toString())) {
                  launchId = parseInt(foundLaunch.id);
                  // Fetch complete data by numeric ID to get full formatted response
                  try {
                    const idRes = await axios.get(`${API_URL}/api/launches/${launchId}`);
                    launchData = idRes.data;
                    // Ensure database_id is set
                    if (!launchData.database_id && launchId) {
                      launchData.database_id = launchId;
                    }
                  } catch (idError) {
                    // If fetching by ID fails, use list data and add database_id
                    launchData = foundLaunch;
                    launchData.database_id = launchId;
                  }
                } else {
                  // Use the list data directly if we can't get numeric ID
                  launchData = foundLaunch;
                }
              } else {
                throw directSlugError;
              }
            } catch (listError) {
              console.error('List endpoint also failed:', listError);
              throw directSlugError;
            }
          }
          
          if (!launchData) {
            throw new Error('Launch not found - no data in response');
          }
        } catch (slugError) {
          console.error('Error fetching launch by slug:', slugError);
          throw new Error('Launch not found');
        }
      }
      
      // If we don't have launchData yet (numeric slug case), fetch it
      if (!launchData && isNumericSlug) {
        const launchRes = await axios.get(`${API_URL}/api/launches/${launchId}`);
        launchData = launchRes.data;
      }
      
      if (!launchData) {
        throw new Error('Launch data not found');
      }
      
      // Update URL to use slug if we accessed via numeric ID
      if (isNumericSlug) {
        const launchSlug = getLaunchSlug(launchData);
        if (launchSlug && launchSlug !== slug) {
          window.history.replaceState(null, '', `/launches/${launchSlug}`);
        }
      }
      
      setLaunch(launchData);
      
      // Fetch related stories
      const storiesRes = await axios.get(`${API_URL}/api/news?limit=4&status=published`);
      const storiesData = Array.isArray(storiesRes.data) 
        ? storiesRes.data 
        : storiesRes.data?.data || [];
      setRelatedStories(storiesData.slice(0, 4));
    } catch (error) {
      console.error('Error fetching launch:', error);
      setLaunch(null);
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

  const handleSubmitComment = async () => {
    if (!user) {
      // Redirect to login with returnUrl pointing to comments section
      const currentUrl = location.pathname + location.search;
      const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const launchId = launch?.database_id || launch?.id;
      const comment = await createLaunchComment(launchId, newComment.trim());
      setNewComment('');
      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      alert(error.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleReply = async () => {
    if (!user) {
      // Redirect to login with returnUrl pointing to comments section
      const currentUrl = location.pathname + location.search;
      const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      const launchId = launch?.database_id || launch?.id;
      await createLaunchComment(launchId, replyContent.trim(), replyingTo.id);
      setReplyContent('');
      setReplyingTo(null);
      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
      alert(error.response?.data?.error || 'Failed to post reply');
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    // Update comment in the list
    const updateCommentInTree = (comments) => {
      return comments.map(comment => {
        if (comment.id === updatedComment.id) {
          return { ...comment, ...updatedComment };
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
    // Remove comment from the list
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

  const getLaunchImageUrl = (launch) => {
    if (!launch) return HERO_BG_IMAGE;
    // Try image object first (new API structure)
    if (launch.image?.image_url) return launch.image.image_url;
    // Fallback to old structure
    if (launch.image_json?.image_url) return launch.image_json.image_url;
    if (launch.media?.image?.image_url) return launch.media.image.image_url;
    if (launch.mission_image_url) return launch.mission_image_url;
    if (launch.infographic_url) return launch.infographic_url;
    return HERO_BG_IMAGE;
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

  if (loading) {
    return (
      <Layout>
        <RedDotLoader fullScreen={true} size="large" />
      </Layout>
    );
  }

  if (!launch) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Launch Not Found</h1>
          <Link to="/launches/upcoming" className="text-[#8B1A1A] hover:text-[#A02A2A]">
            Return to Launch Center
          </Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  };

  const formatDateTimeLine = (dateString, launchPad = null) => {
    if (!dateString) return 'TBD';
    
    // Parse the date string - handle ISO format strings
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'TBD';
    }
    
    // Format: "Tuesday, April 29, 2025"
    const datePart = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Determine timezone based on launch location
    // Default to America/Denver (MDT) for US launches
    let timeZone = 'America/Denver'; // Default to MDT
    if (launchPad && launchPad.location) {
      // Map common launch locations to timezones
      const locationName = launchPad.location.name || '';
      if (locationName.includes('Kennedy') || locationName.includes('Florida') || locationName.includes('Cape Canaveral')) {
        timeZone = 'America/New_York'; // EDT/EST
      } else if (locationName.includes('Vandenberg') || locationName.includes('California')) {
        timeZone = 'America/Los_Angeles'; // PDT/PST
      } else if (locationName.includes('Texas')) {
        timeZone = 'America/Chicago'; // CDT/CST
      }
    }
    
    // Format: "7:37am"
    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone,
    }).toLowerCase().replace(/\s/g, '');
    
    // Get timezone abbreviation (MDT, EST, etc.)
    const timezonePart = date.toLocaleTimeString('en-US', {
      timeZoneName: 'short',
      timeZone: timeZone,
    }).split(' ').pop();
    
    // Format UTC: "23:23" - get UTC hours and minutes directly
    // The date object stores time in UTC internally, so getUTCHours/getUTCMinutes should work
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    const utcPart = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
    
    return `${datePart} | ${timePart} ${timezonePart} (${utcPart} UTC)`;
  };

  // Format window time with timezone (matching mobile app format)
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
      console.error('Error formatting window time:', error);
      return { local: 'TBD', utc: 'TBD' };
    }
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

  const launchImageUrl = getLaunchImageUrl(launch);
  const isUpcoming = launch.net && new Date(launch.net) > new Date();
  const launchName = getLaunchName();
  
  // Helper to safely parse JSONB fields
  const parseJsonb = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return null;
      }
    }
    return value;
  };

  // Handle both transformed format (launch_service_provider) and raw format (launch_service_provider_json)
  const launchServiceProvider = launch.launch_service_provider || parseJsonb(launch.launch_service_provider_json) || {};
  
  // Handle rocket data - check if it's already an object or needs parsing
  let rocketRaw = null;
  if (launch.rocket) {
    // If rocket is already an object (from formatLaunchResponse), use it
    if (typeof launch.rocket === 'object' && launch.rocket !== null) {
      rocketRaw = launch.rocket;
    } else if (typeof launch.rocket === 'string') {
      // If it's a string (old database format), try to parse it or create a basic object
      try {
        rocketRaw = JSON.parse(launch.rocket);
      } catch (e) {
        // If parsing fails, it's just a name string, create a basic object
        rocketRaw = { name: launch.rocket };
      }
    }
  }
  
  // If rocket wasn't found or parsed, try rocket_json
  if (!rocketRaw || (typeof rocketRaw === 'object' && Object.keys(rocketRaw).length === 0)) {
    rocketRaw = parseJsonb(launch.rocket_json) || {};
  }
  
  // Ensure rocket has configuration if it exists in the raw data
  // The rocket object from API should have configuration nested inside it
  // If rocketRaw is a string, convert it to an object with a name
  if (typeof rocketRaw === 'string') {
    rocketRaw = { name: rocketRaw };
  }
  
  const rocket = rocketRaw && typeof rocketRaw === 'object' && (rocketRaw.configuration || rocketRaw.id || rocketRaw.name || Object.keys(rocketRaw).length > 0) ? rocketRaw : {};
  const mission = launch.mission || parseJsonb(launch.mission_json) || {};
  const pad = launch.pad || parseJsonb(launch.pad_json) || {};
  const status = launch.status || parseJsonb(launch.status_json) || {};
  const image = launch.image || parseJsonb(launch.image_json) || {};
  const infographic = launch.infographic || parseJsonb(launch.infographic_json) || {};
  const program = launch.program || parseJsonb(launch.program_json) || [];

  // Format date/time line with pad information for timezone
  const formattedDateTimeLine = formatDateTimeLine(launch.net, pad);

  // Debug: Log data structure
  if (launch && Object.keys(launch).length > 0) {
    console.log('[LaunchDetail] Received launch data:', {
      id: launch.id,
      database_id: launch.database_id,
      name: launch.name,
      hasLaunchServiceProvider: !!(launch.launch_service_provider || launch.launch_service_provider_json),
      launchServiceProvider: launchServiceProvider,
      hasRocket: !!(launch.rocket || launch.rocket_json),
      rocketRaw: rocketRaw,
      rocket: rocket,
      hasRocketConfiguration: !!(rocket && rocket.configuration),
      hasPad: !!(launch.pad || launch.pad_json),
      hasMission: !!(launch.mission || launch.mission_json),
      rawFormat: !!launch.launch_service_provider_json,
      arrays: {
        updates: `${launch.updates ? launch.updates.length : 0} items`,
        timeline: `${launch.timeline ? launch.timeline.length : 0} items`,
        vid_urls: `${launch.vid_urls ? launch.vid_urls.length : 0} items`,
        info_urls: `${launch.info_urls ? launch.info_urls.length : 0} items`,
        mission_patches: `${launch.mission_patches ? launch.mission_patches.length : 0} items`,
        payloads: `${launch.payloads ? launch.payloads.length : 0} items`,
        crew: `${launch.crew ? launch.crew.length : 0} items`,
        hazards: `${launch.hazards ? launch.hazards.length : 0} items`
      },
      payloadsSample: launch.payloads && launch.payloads.length > 0 ? launch.payloads[0] : null,
      statistics: {
        orbital_launch_attempt_count: launch.orbital_launch_attempt_count,
        pad_launch_attempt_count: launch.pad_launch_attempt_count,
        agency_launch_attempt_count: launch.agency_launch_attempt_count,
        pad_turnaround: launch.pad_turnaround
      }
    });
    
    // Log array data in detail if empty
    if (!launch.timeline || launch.timeline.length === 0) {
      console.warn('[LaunchDetail] Timeline is empty or missing');
    }
    if (!launch.updates || launch.updates.length === 0) {
      console.warn('[LaunchDetail] Updates is empty or missing');
    }
    if (!launch.mission_patches || launch.mission_patches.length === 0) {
      console.warn('[LaunchDetail] Mission patches is empty or missing');
    }
  }

  // Get YouTube URL and video ID
  const youtubeUrl = launch ? getYouTubeUrl() : null;
  const youtubeVideoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;

  // Helper function to extract social media links from launch data
  const getSocialMediaLinks = () => {
    const links = {
      twitter: null,
      facebook: null,
      linkedin: null,
      url: null
    };

    // Check launch_service_provider for social media links
    if (launchServiceProvider) {
      // Check if social_media_links array exists
      if (launchServiceProvider.social_media_links && Array.isArray(launchServiceProvider.social_media_links)) {
        launchServiceProvider.social_media_links.forEach(link => {
          const url = typeof link === 'string' ? link : link.url;
          if (url) {
            if (url.includes('twitter.com') || url.includes('x.com')) {
              links.twitter = url;
            } else if (url.includes('facebook.com')) {
              links.facebook = url;
            } else if (url.includes('linkedin.com')) {
              links.linkedin = url;
            }
          }
        });
      }
      
      // Check for direct URL field
      if (launchServiceProvider.url) {
        links.url = launchServiceProvider.url;
      }
    }

    // Check launch URL field
    if (launch.url) {
      links.url = launch.url;
    }

    return links;
  };

  // Get social media links
  const socialLinks = getSocialMediaLinks();
  const currentPageUrl = window.location.href;
  const shareText = `${launch.name} - The Launch Pad`;

  // Generate share URLs
  const getTwitterShareUrl = () => {
    if (socialLinks.twitter) {
      return socialLinks.twitter;
    }
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentPageUrl)}&text=${encodeURIComponent(shareText)}`;
  };

  const getFacebookShareUrl = () => {
    if (socialLinks.facebook) {
      return socialLinks.facebook;
    }
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPageUrl)}`;
  };

  const getLinkedInShareUrl = () => {
    if (socialLinks.linkedin) {
      return socialLinks.linkedin;
    }
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentPageUrl)}`;
  };

  const sectionNav = (
    <div className="max-w-full mx-auto px-3 sm:px-6 py-2 sm:py-0">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative" style={{ overflow: 'visible' }}>
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black flex items-center justify-center overflow-hidden">
            <img 
              src="/TLP Helmet.png" 
              alt="TLP Logo" 
              className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
            />
      </div>
          <div className="absolute top-full left-0 bg-[#8B1A1A] px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
            {currentTime}
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>LAUNCH</h1>
      </div>

        {/* Desktop Navigation - Left Side */}
        <div className="hidden lg:flex items-center gap-0 text-xs uppercase flex-1 ml-6">
          <Link
            to="/launches/upcoming"
            className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            UPCOMING
          </Link>
          <span className="mx-1 font-bold text-white">|</span>
          <Link
            to="/launches/previous"
            className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
          >
            PREVIOUS
          </Link>
          <span className="mx-1 font-bold text-white">|</span>
          <button className="px-3 py-2 text-gray-400 hover:text-white transition-colors">EVENTS</button>
          <span className="mx-1 font-bold text-white">|</span>
          <button className="px-3 py-2 text-gray-400 hover:text-white transition-colors">STATISTICS</button>
        </div>

        {/* Desktop YouTube Button - Right Side */}
      {youtubeUrl && (
          <div className="hidden lg:block">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-white text-black hover:bg-gray-100 transition uppercase text-[10px] sm:text-xs font-semibold whitespace-nowrap"
        >
          Watch On Youtube
        </a>
          </div>
      )}
      </div>
    </div>
  );

  return (
    <Layout sectionNav={sectionNav}>
      {/* Hero Section with Image - Single Background Container */}
      <div 
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${launchImageUrl}')`,
          backgroundPosition: 'center 30%',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-black/80"></div>

        {/* Hero Content - Centered */}
        <div className="relative z-10 min-h-[450px] sm:min-h-[500px] md:min-h-[550px] flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
            <div className="flex flex-col items-center text-center">
              <div className="text-xs sm:text-sm text-white mb-2">
                {formattedDateTimeLine}
              </div>
            <div className="mb-3 sm:mb-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white">{launchName.firstLine}</h1>
              {launchName.secondLine && (
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-300 mt-2">{launchName.secondLine}</h2>
              )}
            </div>
              <div className="text-sm sm:text-base lg:text-lg text-gray-300 mb-6 sm:mb-8">
                {pad.name || 'Launch Pad TBD'} | {pad.location?.name || 'Location TBD'}, {pad.country_code || pad.location?.country_code || 'Country TBD'}
            </div>

              {/* Countdown Timer - Centered */}
        {isUpcoming && (
                <div className="mt-6 sm:mt-8">
                  <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">
                <div className="text-center">
                  <div className="text-white">{String(countdown.days).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">DAYS</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.hours).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">HOURS</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.minutes).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">MINUTES</div>
                </div>
                <div className="text-white self-start -mt-1 sm:-mt-1.5">:</div>
                <div className="text-center">
                  <div className="text-white">{String(countdown.seconds).padStart(2, '0')}</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1 sm:mt-2">SECONDS</div>
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player and Sidebar - Side by Side */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-8">
            <div className="bg-[#121212] p-4 sm:p-6">
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                {/* Red Border - Inside container, left border extends to top, top border has gap from left border */}
                {/* Left border - extends to top */}
                <div className="absolute top-0 left-4 sm:left-5 bottom-4 sm:bottom-5 w-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                {/* Top border - starts after left border with gap, increased padding for visibility */}
                <div className="absolute top-8 sm:top-10 left-12 sm:left-14 right-4 sm:right-5 h-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                {/* Right border */}
                <div className="absolute top-8 sm:top-10 right-4 sm:right-5 bottom-4 sm:bottom-5 w-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                {/* Bottom border */}
                <div className="absolute bottom-4 sm:bottom-5 left-4 sm:left-5 right-4 sm:right-5 h-0.5 bg-[#8B1A1A] z-30 pointer-events-none"></div>
                
                {/* Background Image */}
                <div 
                  className="absolute top-0 left-0 w-full h-full bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('${launchImageUrl}')`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                  }}
                >
                  {/* Dark Overlay - Full Image - Hide when video is playing */}
                  {!isVideoPlaying && (
                    <div className="absolute top-0 left-0 w-full h-full bg-black/85 z-10"></div>
                  )}
                  
                  {/* YouTube Video - Only render when playing to improve performance */}
                  {youtubeVideoId && isVideoPlaying && (
                    <iframe
                      className="absolute top-0 left-0 w-full h-full z-20"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                      title="Launch Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  )}
                  
                  {/* Branding - Top Left - Above border */}
                  <div className="absolute top-0 left-4 sm:left-5 z-20 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black flex items-center justify-center overflow-hidden">
                      <img 
                        src="/TLP Helmet.png" 
                        alt="TLP Logo" 
                        className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </div>
                    <div className="text-white text-sm sm:text-base md:text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: 'Nasalization, sans-serif' }}>THE LAUNCH PAD</div>
                </div>

                  {/* Website - Top Right - Outside border */}
                  <div className="absolute top-1 sm:top-2 right-0 z-20 text-white text-[10px] sm:text-xs font-semibold uppercase pr-1 sm:pr-2" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                    TLPNETWORK.COM
                  </div>

                  {/* Pause/Close Button - Show when video is playing */}
                  {isVideoPlaying && youtubeVideoId && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsVideoPlaying(false);
                      }}
                      className="absolute top-4 sm:top-5 right-4 sm:right-5 z-50 bg-black/80 hover:bg-black/90 text-white p-2 sm:p-3 rounded-full transition-all shadow-lg backdrop-blur-sm"
                      aria-label="Stop video"
                      title="Stop video"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z"/>
                      </svg>
                    </button>
                  )}

                  {/* Launch Name with Play Button - Centered - Hide when video is playing */}
                  {!isVideoPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                      <div className="text-center relative">
                        {(() => {
                          const fullName = launchName.firstLine.toUpperCase();
                          // Try to extract prefix (like "CFT" from "CFT STARLINER")
                          const parts = fullName.split(' ');
                          let mainName = fullName;
                          let prefix = '';
                          
                          if (parts.length > 1 && parts[0].length <= 5) {
                            // Likely a prefix like "CFT", "ISS", etc.
                            prefix = parts[0];
                            mainName = parts.slice(1).join(' ');
                          }
                          
                          return (
                            <>
                              {/* Background prefix text (semi-transparent, larger) */}
                              {prefix && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-[#222222]/60 text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-bold leading-none" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                                    {prefix}
                      </div>
                      </div>
                    )}

                              {/* Complete Launch Name */}
                              <div className="relative flex flex-col items-center justify-center">
                                {/* Title with Play Button Overlay */}
                                <div className="relative">
                                  <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-none drop-shadow-lg" style={{ fontFamily: 'Nasalization, sans-serif' }}>
                                    {mainName}
                      </div>
                                  
                                  {/* Rectangular Play Button - On Top of Title */}
                                  {youtubeVideoId && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsVideoPlaying(true);
                                      }}
                                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 bg-black/80 hover:bg-black/90 flex items-center justify-center shadow-lg backdrop-blur-sm transition-all cursor-pointer z-40"
                                      style={{ borderRadius: '4px' }}
                                      aria-label="Play video"
                                    >
                                      <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </button>
                                  )}
                      </div>

                                {/* Countdown to Launch - Under Title */}
                                <div className="mt-4 sm:mt-6 z-20 relative">
                                  <div 
                                    className="bg-[#8B1A1A] px-6 sm:px-8 md:px-10 py-2 sm:py-2.5 text-white text-sm sm:text-base md:text-lg font-bold uppercase text-center tracking-wider"
                                    style={{ 
                                      fontFamily: 'Nasalization, sans-serif',
                                      clipPath: 'polygon(5% 0%, 100% 0%, 95% 100%, 0% 100%)',
                                      boxShadow: '0 0 10px rgba(139, 26, 26, 0.5)'
                                    }}
                                  >
                                    COUNTDOWN TO LAUNCH
                      </div>
                      </div>
                      </div>
                            </>
                          );
                        })()}
                      </div>
                      </div>
                    )}
                      </div>
                      </div>
                      </div>
                  
            {/* Tabs */}
            <div className="bg-[#8B1A1A] flex flex-wrap mb-4 sm:mb-6 mt-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-black'
                      : 'text-white hover:bg-[#A02A2A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
                  </div>
                  
            {/* Tab Content */}
            <div className="bg-[#121212] p-6 sm:p-8 min-h-[400px]">
              {activeTab === 'PAYLOAD' && (
                <div className="space-y-4">
                  {(() => {
                    // Debug: Log payloads
                    console.log('[LaunchDetail] PAYLOAD tab - launch.payloads:', launch.payloads);
                    console.log('[LaunchDetail] PAYLOAD tab - Array check:', Array.isArray(launch.payloads));
                    console.log('[LaunchDetail] PAYLOAD tab - Length:', launch.payloads?.length);
                    
                    const payloads = launch.payloads;
                    if (payloads && Array.isArray(payloads) && payloads.length > 0) {
                      return payloads.map((payload, idx) => (
                        <div key={payload.id || idx} className="border-b border-[#222222] pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-3">{payload.name || 'Unnamed Payload'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {payload.type && (
                            <div>
                              <span className="text-gray-400">Type:</span>{' '}
                              <span className="font-semibold text-white">{payload.type}</span>
                            </div>
                          )}
                          {payload.mass_kg && (
                            <div>
                              <span className="text-gray-400">Mass:</span>{' '}
                              <span className="font-semibold text-white">{payload.mass_kg} kg</span>
                            </div>
                          )}
                            {payload.mass_lb && (
                              <div>
                                <span className="text-gray-400">Mass (lb):</span>{' '}
                                <span className="font-semibold text-white">{payload.mass_lb} lb</span>
                            </div>
                          )}
                          {payload.orbit && (
                            <div>
                              <span className="text-gray-400">Orbit:</span>{' '}
                              <span className="font-semibold text-white">{payload.orbit}</span>
                            </div>
                          )}
                          {payload.nationality && (
                            <div>
                              <span className="text-gray-400">Nationality:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof payload.nationality === 'string' 
                                  ? payload.nationality 
                                  : payload.nationality?.name || payload.nationality?.nationality_name || JSON.stringify(payload.nationality)}
                              </span>
                            </div>
                          )}
                          {payload.manufacturer && (
                            <div>
                              <span className="text-gray-400">Manufacturer:</span>{' '}
                              <span className="font-semibold text-white">{payload.manufacturer}</span>
                            </div>
                          )}
                          {payload.customers && Array.isArray(payload.customers) && payload.customers.length > 0 && (
                            <div>
                              <span className="text-gray-400">Customers:</span>{' '}
                              <span className="font-semibold text-white">{payload.customers.join(', ')}</span>
                            </div>
                          )}
                            {payload.destination && (
                              <div>
                                <span className="text-gray-400">Destination:</span>{' '}
                                <span className="font-semibold text-white">{payload.destination}</span>
                            </div>
                          )}
                        </div>
                        {payload.description && (
                          <p className="text-sm text-gray-400 mt-3 leading-relaxed">{payload.description}</p>
                        )}
                      </div>
                      ));
                    } else {
                      return <p className="text-gray-400">No payload information available.</p>;
                    }
                  })()}
              </div>
              )}
              
              {activeTab === 'CREW' && (
                <div className="space-y-4">
                  {launch.crew && launch.crew.length > 0 ? (
                    launch.crew.map((member, idx) => (
                      <div key={idx} className="border-b border-[#222222] pb-4 last:border-0">
                        <h4 className="text-lg font-bold mb-3">{member.name || 'Unknown'}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {member.role && (
                            <div>
                              <span className="text-gray-400">Role:</span>{' '}
                              <span className="font-semibold text-white">{member.role}</span>
            </div>
                          )}
                          {member.nationality && (
                            <div>
                              <span className="text-gray-400">Nationality:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof member.nationality === 'string' 
                                  ? member.nationality 
                                  : member.nationality?.name || member.nationality?.nationality_name || JSON.stringify(member.nationality)}
                              </span>
                            </div>
                          )}
                          {member.date_of_birth && (
                            <div>
                              <span className="text-gray-400">Date of Birth:</span>{' '}
                              <span className="font-semibold text-white">{member.date_of_birth}</span>
                            </div>
                          )}
                          {member.flights_count !== null && member.flights_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Flights:</span>{' '}
                              <span className="font-semibold text-white">{member.flights_count}</span>
                            </div>
                          )}
                        </div>
                        {member.bio && (
                          <p className="text-sm text-gray-400 mt-3 leading-relaxed">{member.bio}</p>
                        )}
                        {member.wiki_url && (
                          <a 
                            href={member.wiki_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block"
                          >
                            Learn More →
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No crew information available.</p>
                  )}
                </div>
              )}
              
              {activeTab === 'ROCKET' && (
                <div className="space-y-6">
                  {/* Article-style content */}
                  {mission.description && (
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {mission.description.split('\n').map((paragraph, idx) => (
                          paragraph.trim() && (
                            <p key={idx} className="mb-4 text-base">
                              {paragraph.split(' ').map((word, wordIdx, words) => {
                                // Add tooltip for specific terms
                                const tooltipTerms = {
                                  'solicitation': 'Solicitation: The act to get something that benefits you and nobody else.',
                                  'HALO': 'Hybrid Acquisition for Proliferated LEO',
                                  'SDA': 'Space Development Agency',
                                  'LEO': 'Low Earth Orbit'
                                };
                                
                                const lowerWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
                                if (tooltipTerms[lowerWord]) {
                                  return (
                                    <span key={wordIdx} className="relative group inline-block">
                                      <span className="underline decoration-dotted cursor-help text-[#8B1A1A]">
                                        {word}
                        </span>
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700">
                                        {tooltipTerms[lowerWord]}
                                        <span className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></span>
                                      </span>
                                    </span>
                                  );
                                }
                                return <span key={wordIdx}>{word} </span>;
                              })}
                            </p>
                          )
                        ))}
                      </div>
                      </div>
                    )}
                  
                  <h4 className="text-lg font-bold mb-3 mt-6">Rocket Information</h4>
                  {rocket && (rocket.configuration || rocket.id || rocket.name || (typeof rocket === 'object' && Object.keys(rocket).length > 0)) ? (
                    <>
                      {rocket.configuration ? (
                        <div className="space-y-4">
                          <h5 className="text-md font-semibold mb-3 text-gray-300">Rocket Configuration</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {rocket.id && (
                            <div>
                              <span className="text-gray-400">Rocket ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.id}</span>
                            </div>
                          )}
                          {(rocket.configuration.name || rocket.name) && (
                            <div>
                              <span className="text-gray-400">Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.name || rocket.name}</span>
                            </div>
                          )}
                          {rocket.configuration.id && (
                            <div>
                              <span className="text-gray-400">Configuration ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.id}</span>
                            </div>
                          )}
                          {rocket.configuration.full_name && (
                            <div>
                              <span className="text-gray-400">Full Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.full_name}</span>
                            </div>
                          )}
                            {rocket.configuration.variant && (
                            <div>
                                <span className="text-gray-400">Variant:</span>{' '}
                                <span className="font-semibold text-white">{rocket.configuration.variant}</span>
                            </div>
                          )}
                            {rocket.configuration.family && (
                            <div>
                              <span className="text-gray-400">Family:</span>{' '}
                              <span className="font-semibold text-white">{rocket.configuration.family}</span>
                          </div>
                        )}
                        {rocket.configuration.length && (
                          <div>
                            <span className="text-gray-400">Length:</span>{' '}
                                <span className="font-semibold text-white">{rocket.configuration.length}m</span>
                          </div>
                        )}
                        {rocket.configuration.diameter && (
                          <div>
                            <span className="text-gray-400">Diameter:</span>{' '}
                                <span className="font-semibold text-white">{rocket.configuration.diameter}m</span>
                          </div>
                        )}
                        {rocket.configuration.launch_mass && (
                          <div>
                            <span className="text-gray-400">Launch Mass:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.launch_mass} kg</span>
                          </div>
                        )}
                        {rocket.configuration.leo_capacity && (
                          <div>
                            <span className="text-gray-400">LEO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.leo_capacity} kg</span>
                          </div>
                        )}
                        {rocket.configuration.gto_capacity && (
                          <div>
                            <span className="text-gray-400">GTO Capacity:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.gto_capacity} kg</span>
                          </div>
                        )}
                            {rocket.configuration.to_thrust && (
                          <div>
                                <span className="text-gray-400">Takeoff Thrust:</span>{' '}
                                <span className="font-semibold text-white">{rocket.configuration.to_thrust} kN</span>
                          </div>
                        )}
                        {rocket.configuration.reusable !== null && rocket.configuration.reusable !== undefined && (
                          <div>
                            <span className="text-gray-400">Reusable:</span>{' '}
                            <span className="font-semibold text-white">{rocket.configuration.reusable ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                          </div>
                          {(rocket.configuration.total_launch_count !== null && rocket.configuration.total_launch_count !== undefined) ||
                           (rocket.configuration.successful_launches !== null && rocket.configuration.successful_launches !== undefined) ||
                           (rocket.configuration.failed_launches !== null && rocket.configuration.failed_launches !== undefined) ? (
                            <div className="mt-4">
                              <h6 className="text-md font-semibold mb-3 text-gray-300">Launch Statistics</h6>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        {rocket.configuration.total_launch_count !== null && rocket.configuration.total_launch_count !== undefined && (
                                  <div className="bg-[#222222] p-3 rounded">
                                    <span className="text-gray-400 block mb-1">Total Launches</span>
                                    <span className="text-xl font-bold text-white">{rocket.configuration.total_launch_count}</span>
                          </div>
                        )}
                        {rocket.configuration.successful_launches !== null && rocket.configuration.successful_launches !== undefined && (
                                  <div className="bg-[#222222] p-3 rounded">
                                    <span className="text-gray-400 block mb-1">Successful</span>
                                    <span className="text-xl font-bold text-green-400">{rocket.configuration.successful_launches}</span>
                          </div>
                        )}
                        {rocket.configuration.failed_launches !== null && rocket.configuration.failed_launches !== undefined && (
                                  <div className="bg-[#222222] p-3 rounded">
                                    <span className="text-gray-400 block mb-1">Failed</span>
                                    <span className="text-xl font-bold text-red-400">{rocket.configuration.failed_launches}</span>
                          </div>
                        )}
                          </div>
                          </div>
                          ) : null}
                          {(rocket.configuration.info_url || rocket.configuration.wiki_url) && (
                        <div className="mt-4">
                              <h6 className="text-md font-semibold mb-3 text-gray-300">Links</h6>
                              <div className="flex flex-wrap gap-3">
                        {rocket.configuration.info_url && (
                          <a 
                            href={rocket.configuration.info_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                                    className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                          >
                                    More Info →
                          </a>
                        )}
                        {rocket.configuration.wiki_url && (
                          <a 
                            href={rocket.configuration.wiki_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                                    className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                          >
                            Wikipedia →
                          </a>
                        )}
                      </div>
                            </div>
                          )}
                          {rocket.configuration.description && (
                            <div className="mt-4">
                              <h6 className="text-md font-semibold mb-3 text-gray-300">Description</h6>
                              <p className="text-gray-300 leading-relaxed">{rocket.configuration.description}</p>
                            </div>
                          )}
                    </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {rocket.id && (
                            <div>
                              <span className="text-gray-400">Rocket ID:</span>{' '}
                              <span className="font-semibold text-white">{rocket.id}</span>
                            </div>
                          )}
                          {rocket.name && (
                            <div>
                              <span className="text-gray-400">Name:</span>{' '}
                              <span className="font-semibold text-white">{rocket.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400">No rocket information available.</p>
                  )}
                </div>
              )}

              {activeTab === 'ENGINE' && (
                <div className="space-y-4">
                  {(() => {
                    // Use engines from API response if available, otherwise fallback to rocket.launcher_stage
                    let engines = [];
                    
                    // Primary: Check launch.engines (from API response)
                    if (launch.engines && Array.isArray(launch.engines) && launch.engines.length > 0) {
                      engines = launch.engines;
                      console.log('[LaunchDetail] Using engines from launch.engines:', engines.length);
                    }
                    // Fallback 1: Check rocket.launcher_stage
                    else if (rocket && rocket.launcher_stage && Array.isArray(rocket.launcher_stage) && rocket.launcher_stage.length > 0) {
                      engines = rocket.launcher_stage.flatMap((stage, stageIdx) => 
                        (stage.engines || []).map((engine, engineIdx) => ({
                          ...engine,
                          stage: stageIdx + 1,
                          stage_type: stage.type || `Stage ${stageIdx + 1}`,
                          reusable: stage.reusable || false
                        }))
                      );
                      console.log('[LaunchDetail] Using engines from rocket.launcher_stage:', engines.length);
                    }
                    // Fallback 2: Check rocket.configuration.launcher_stage
                    else if (rocket && rocket.configuration && rocket.configuration.launcher_stage && Array.isArray(rocket.configuration.launcher_stage) && rocket.configuration.launcher_stage.length > 0) {
                      engines = rocket.configuration.launcher_stage.flatMap((stage, stageIdx) => 
                        (stage.engines || []).map((engine, engineIdx) => ({
                          ...engine,
                          stage: stageIdx + 1,
                          stage_type: stage.type || `Stage ${stageIdx + 1}`,
                          reusable: stage.reusable || false
                        }))
                      );
                      console.log('[LaunchDetail] Using engines from rocket.configuration.launcher_stage:', engines.length);
                    }
                    
                    if (engines.length === 0) {
                      console.warn('[LaunchDetail] No engines found. Launch data:', {
                        hasLaunchEngines: !!(launch.engines && Array.isArray(launch.engines)),
                        launchEnginesLength: launch.engines?.length || 0,
                        hasRocket: !!rocket,
                        hasRocketLauncherStage: !!(rocket?.launcher_stage),
                        hasRocketConfigLauncherStage: !!(rocket?.configuration?.launcher_stage),
                        rocketKeys: rocket ? Object.keys(rocket) : []
                      });
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
                        <div key={stageIdx} className="border-b border-[#222222] pb-6 last:border-0">
                          <h4 className="text-xl font-bold mb-4">
                            {stageGroup.stage_type}
                            {stageGroup.reusable && <span className="ml-2 text-sm text-green-400">(Reusable)</span>}
                          </h4>
                          <div className="space-y-4">
                            {stageGroup.engines.map((engine, engineIdx) => (
                              <div key={engineIdx} className="bg-[#222222] p-4 rounded-lg">
                                <h5 className="text-lg font-semibold mb-3">{engine.engine_name || engine.name || engine.type || engine.engine_type || engine.configuration || 'Engine'}</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  {engine.engine_type && (
                                    <div>
                                      <span className="text-gray-400">Type:</span>{' '}
                                      <span className="font-semibold text-white">{engine.engine_type}</span>
                                    </div>
                                  )}
                                  {engine.engine_configuration && (
                                    <div>
                                      <span className="text-gray-400">Configuration:</span>{' '}
                                      <span className="font-semibold text-white">{engine.engine_configuration}</span>
                                    </div>
                                  )}
                                  {engine.engine_layout && (
                                    <div>
                                      <span className="text-gray-400">Layout:</span>{' '}
                                      <span className="font-semibold text-white">{engine.engine_layout}</span>
                                    </div>
                                  )}
                                  {engine.engine_version && (
                                    <div>
                                      <span className="text-gray-400">Version:</span>{' '}
                                      <span className="font-semibold text-white">{engine.engine_version}</span>
                                    </div>
                                  )}
                                  {(engine.isp_sea_level || engine.isp_vacuum) && (
                                    <div>
                                      <span className="text-gray-400">ISP:</span>{' '}
                                      <span className="font-semibold text-white">
                                        {engine.isp_sea_level ? `Sea Level: ${engine.isp_sea_level}s` : ''}
                                        {engine.isp_sea_level && engine.isp_vacuum ? ' | ' : ''}
                                        {engine.isp_vacuum ? `Vacuum: ${engine.isp_vacuum}s` : ''}
                                      </span>
                                    </div>
                                  )}
                                  {engine.thrust_sea_level_kn && (
                                    <div>
                                      <span className="text-gray-400">Thrust (Sea Level):</span>{' '}
                                      <span className="font-semibold text-white">{engine.thrust_sea_level_kn} kN</span>
                                    </div>
                                  )}
                                  {engine.thrust_vacuum_kn && (
                                    <div>
                                      <span className="text-gray-400">Thrust (Vacuum):</span>{' '}
                                      <span className="font-semibold text-white">{engine.thrust_vacuum_kn} kN</span>
                                    </div>
                                  )}
                                  {engine.number_of_engines && (
                                    <div>
                                      <span className="text-gray-400">Number of Engines:</span>{' '}
                                      <span className="font-semibold text-white">{engine.number_of_engines}</span>
                                    </div>
                                  )}
                                  {engine.propellant_1 && (
                                    <div>
                                      <span className="text-gray-400">Propellant 1:</span>{' '}
                                      <span className="font-semibold text-white">{engine.propellant_1}</span>
                                    </div>
                                  )}
                                  {engine.propellant_2 && (
                                    <div>
                                      <span className="text-gray-400">Propellant 2:</span>{' '}
                                      <span className="font-semibold text-white">{engine.propellant_2}</span>
                                    </div>
                                  )}
                                  {engine.engine_loss_max && (
                                    <div>
                                      <span className="text-gray-400">Engine Loss Max:</span>{' '}
                                      <span className="font-semibold text-white">{engine.engine_loss_max}</span>
                                    </div>
                                  )}
                                  {engine.stage_thrust_kn && (
                                    <div>
                                      <span className="text-gray-400">Stage Thrust:</span>{' '}
                                      <span className="font-semibold text-white">{engine.stage_thrust_kn} kN</span>
                                    </div>
                                  )}
                                  {engine.stage_fuel_amount_tons && (
                                        <div>
                                      <span className="text-gray-400">Fuel Amount:</span>{' '}
                                      <span className="font-semibold text-white">{engine.stage_fuel_amount_tons} tons</span>
                                        </div>
                                      )}
                                  {engine.stage_burn_time_sec && (
                                        <div>
                                      <span className="text-gray-400">Burn Time:</span>{' '}
                                      <span className="font-semibold text-white">{engine.stage_burn_time_sec} seconds</span>
                                        </div>
                                      )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    } else {
                      return <div className="text-gray-400">Engine information not available for this launch.</div>;
                    }
                  })()}
                                  </div>
              )}
              {activeTab === 'PROVIDER' && (
                <div className="space-y-4">
                  {launchServiceProvider && (launchServiceProvider.name || launchServiceProvider.id) ? (
                    <>
                      <h3 className="text-2xl font-bold mb-4">{launchServiceProvider.name || 'Launch Service Provider'}</h3>
                      {launchServiceProvider.description && (
                        <p className="text-gray-300 leading-relaxed mb-6">{launchServiceProvider.description}</p>
                      )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {launchServiceProvider.abbrev && (
                            <div>
                              <span className="text-gray-400">Abbreviation:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.abbrev}</span>
                            </div>
                          )}
                          {launchServiceProvider.type && (
                            <div>
                              <span className="text-gray-400">Type:</span>{' '}
                              <span className="font-semibold text-white">
                                {typeof launchServiceProvider.type === 'object' 
                                ? launchServiceProvider.type.name || JSON.stringify(launchServiceProvider.type)
                                  : launchServiceProvider.type}
                              </span>
                            </div>
                          )}
                        {launchServiceProvider.founding_year && (
                            <div>
                            <span className="text-gray-400">Founded:</span>{' '}
                            <span className="font-semibold text-white">{launchServiceProvider.founding_year}</span>
                            </div>
                          )}
                        {launchServiceProvider.country_code && (
                            <div>
                            <span className="text-gray-400">Country:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.country_code}</span>
                            </div>
                          )}
                          {launchServiceProvider.administrator && (
                            <div>
                              <span className="text-gray-400">Administrator:</span>{' '}
                              <span className="font-semibold text-white">{launchServiceProvider.administrator}</span>
                            </div>
                          )}
                            </div>
                      {(launchServiceProvider.url || launchServiceProvider.wiki_url || launchServiceProvider.info_url) && (
                        <div className="mt-6 space-y-2">
                          <h4 className="text-lg font-semibold mb-3">Links</h4>
                          <div className="flex flex-wrap gap-3">
                          {launchServiceProvider.url && (
                            <a 
                              href={launchServiceProvider.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                            >
                                Official Website →
                            </a>
                          )}
                          {launchServiceProvider.wiki_url && (
                            <a 
                              href={launchServiceProvider.wiki_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                            >
                              Wikipedia →
                            </a>
                          )}
                            {launchServiceProvider.info_url && (
                            <a 
                                href={launchServiceProvider.info_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                            >
                                More Info →
                            </a>
                    )}
                  </div>
                </div>
              )}
                      {launchServiceProvider.logo_url && (
                        <div className="mt-6">
                          <img 
                            src={launchServiceProvider.logo_url} 
                            alt={`${launchServiceProvider.name} logo`}
                            className="max-w-xs h-auto"
                                />
                              </div>
                            )}
                    </>
                  ) : (
                    <div className="text-gray-400">Provider information not available.</div>
                  )}
                            </div>
                          )}
              {activeTab === 'PAD' && (
                <div className="space-y-4">
                  {pad && (pad.name || pad.id) ? (
                    <>
                      <h3 className="text-2xl font-bold mb-4">{pad.name || 'Launch Pad'}</h3>
                      {pad.description && (
                        <p className="text-gray-300 leading-relaxed mb-6">{pad.description}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                        {pad.location && pad.location.name && (
                            <div>
                            <span className="text-gray-400">Location:</span>{' '}
                            <span className="font-semibold text-white">{pad.location.name}</span>
                            </div>
                          )}
                        {pad.country_code && (
                            <div>
                            <span className="text-gray-400">Country:</span>{' '}
                              <span className="font-semibold text-white">{pad.country_code}</span>
                            </div>
                          )}
                        {pad.latitude && pad.longitude && (
                          <>
                            <div>
                              <span className="text-gray-400">Latitude:</span>{' '}
                              <span className="font-semibold text-white">{pad.latitude}°</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Longitude:</span>{' '}
                              <span className="font-semibold text-white">{pad.longitude}°</span>
                            </div>
                          </>
                          )}
                          {pad.total_launch_count !== null && pad.total_launch_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Total Launches:</span>{' '}
                              <span className="font-semibold text-white">{pad.total_launch_count}</span>
                            </div>
                          )}
                          {pad.orbital_launch_attempt_count !== null && pad.orbital_launch_attempt_count !== undefined && (
                            <div>
                              <span className="text-gray-400">Orbital Launch Attempts:</span>{' '}
                              <span className="font-semibold text-white">{pad.orbital_launch_attempt_count}</span>
                            </div>
                          )}
                            </div>
                      {(pad.info_url || pad.wiki_url || pad.map_url) && (
                        <div className="mt-6 space-y-2">
                          <h4 className="text-lg font-semibold mb-3">Links</h4>
                          <div className="flex flex-wrap gap-3">
                          {pad.info_url && (
                            <a 
                              href={pad.info_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                                    >
                                More Info →
                                    </a>
                                  )}
                          {pad.wiki_url && (
                            <a 
                              href={pad.wiki_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                            >
                              Wikipedia →
                            </a>
                          )}
                          {pad.map_url && (
                            <a 
                              href={pad.map_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm"
                                      >
                                View Map →
                                      </a>
                                  )}
                                    </div>
                                    </div>
                                  )}
                        {pad.map_image && (
                        <div className="mt-6">
                            <img 
                              src={pad.map_image} 
                            alt={`Map of ${pad.name}`}
                            className="max-w-full h-auto rounded"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                    <div className="text-gray-400">Pad information not available.</div>
                    )}
                </div>
              )}
              {activeTab === 'HAZARDS' && (
                <div className="space-y-4">
                  {launch.hazards && Array.isArray(launch.hazards) && launch.hazards.length > 0 ? (
                    launch.hazards.map((hazard, idx) => (
                      <div key={idx} className="border-b border-[#222222] pb-4 last:border-0">
                        <div className="bg-[#222222] p-4 rounded-lg">
                        {hazard.description && (
                            <p className="text-gray-300 leading-relaxed mb-3">{hazard.description}</p>
                          )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {hazard.type && (
                          <div>
                                <span className="text-gray-400">Type:</span>{' '}
                                <span className="font-semibold text-white">{hazard.type}</span>
                          </div>
                        )}
                            {hazard.severity && (
                          <div>
                                <span className="text-gray-400">Severity:</span>{' '}
                                <span className="font-semibold text-white">{hazard.severity}</span>
                          </div>
                        )}
                            {hazard.source && (
                          <div>
                                <span className="text-gray-400">Source:</span>{' '}
                                <span className="font-semibold text-white">{hazard.source}</span>
                          </div>
                        )}
                          </div>
                      </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400">No hazards reported for this launch.</div>
                  )}
                </div>
              )}
              {activeTab === 'STATS' && (
                <div className="space-y-4">
                  {(launch.orbital_launch_attempt_count !== null && launch.orbital_launch_attempt_count !== undefined) ||
                   (launch.location_launch_attempt_count !== null && launch.location_launch_attempt_count !== undefined) ||
                   (launch.pad_launch_attempt_count !== null && launch.pad_launch_attempt_count !== undefined) ||
                   (launch.agency_launch_attempt_count !== null && launch.agency_launch_attempt_count !== undefined) ||
                   (launch.orbital_launch_attempt_count_year !== null && launch.orbital_launch_attempt_count_year !== undefined) ||
                   (launch.location_launch_attempt_count_year !== null && launch.location_launch_attempt_count_year !== undefined) ||
                   (launch.pad_launch_attempt_count_year !== null && launch.pad_launch_attempt_count_year !== undefined) ||
                   (launch.agency_launch_attempt_count_year !== null && launch.agency_launch_attempt_count_year !== undefined) ||
                   launch.pad_turnaround ? (
                    <>
                      <h3 className="text-2xl font-bold mb-4">Launch Statistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {launch.orbital_launch_attempt_count !== null && launch.orbital_launch_attempt_count !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Orbital Launch Attempt Count</span>
                            <span className="text-2xl font-bold text-white">{launch.orbital_launch_attempt_count.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.location_launch_attempt_count !== null && launch.location_launch_attempt_count !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Location Launch Attempt Count</span>
                            <span className="text-2xl font-bold text-white">{launch.location_launch_attempt_count.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.pad_launch_attempt_count !== null && launch.pad_launch_attempt_count !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Pad Launch Attempt Count</span>
                            <span className="text-2xl font-bold text-white">{launch.pad_launch_attempt_count.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.agency_launch_attempt_count !== null && launch.agency_launch_attempt_count !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Agency Launch Attempt Count</span>
                            <span className="text-2xl font-bold text-white">{launch.agency_launch_attempt_count.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.orbital_launch_attempt_count_year !== null && launch.orbital_launch_attempt_count_year !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Orbital Launch Attempts (This Year)</span>
                            <span className="text-2xl font-bold text-white">{launch.orbital_launch_attempt_count_year.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.location_launch_attempt_count_year !== null && launch.location_launch_attempt_count_year !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Location Launch Attempts (This Year)</span>
                            <span className="text-2xl font-bold text-white">{launch.location_launch_attempt_count_year.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.pad_launch_attempt_count_year !== null && launch.pad_launch_attempt_count_year !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Pad Launch Attempts (This Year)</span>
                            <span className="text-2xl font-bold text-white">{launch.pad_launch_attempt_count_year.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.agency_launch_attempt_count_year !== null && launch.agency_launch_attempt_count_year !== undefined && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Agency Launch Attempts (This Year)</span>
                            <span className="text-2xl font-bold text-white">{launch.agency_launch_attempt_count_year.toLocaleString()}</span>
                        </div>
                      )}
                      {launch.pad_turnaround && (
                          <div className="bg-[#222222] p-4 rounded-lg">
                            <span className="text-gray-400 block mb-1">Pad Turnaround</span>
                            <span className="text-2xl font-bold text-white">{launch.pad_turnaround}</span>
                        </div>
                      )}
                    </div>
                    </>
                  ) : (
                    <div className="text-gray-400">Statistics not available for this launch.</div>
                  )}
                </div>
              )}
                        </div>

            {/* Author Information Section */}
            <div className="bg-[#121212] p-6 mt-6 border-t-4 border-[#8B1A1A]">
              
              <div className="flex items-start gap-4">
                {/* Profile Picture with red border */}
                <div className="w-20 h-20 rounded-full shrink-0 border-4 border-[#8B1A1A] overflow-hidden">
                  {!authorImageError ? (
                    <img
                      src="https://i.imgur.com/zachary-aubert-profile.jpg"
                      alt="Zachary Aubert"
                      className="w-full h-full object-cover"
                      onError={() => setAuthorImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#222222] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                              </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold inline text-[#8B1A1A] uppercase tracking-wide">ZACHARY AUBERT</h3>
                    <span className="text-xl italic text-white uppercase tracking-wide ml-2">SPACE NEWS JOURNALIST</span>
                  </div>
                  <p className="text-sm text-white italic mb-3 leading-relaxed">
                    Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.
                  </p>
                  <p className="text-sm text-white italic mb-3 leading-relaxed">
                    He doesn't have a book yet but is working on the <span className="italic">Astro Guide: An UnOfficial Guide To The America Space Coast</span>
                  </p>
                  <Link
                    to="/news?author=zac-aubert"
                    className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block font-semibold transition-colors"
                  >
                    More by Zac Aubert
                  </Link>
                          </div>
                        </div>
                      </div>

            {/* Comments Section */}
            <div id="comments" className="bg-[#121212] p-6 mt-6 border-t-4 border-[#8B1A1A]">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  {commentsTotal} {commentsTotal === 1 ? 'Comment' : 'Comments'}
                </h3>
                {user && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-white">{user.full_name || user.username || 'User'}</span>
                  </div>
                )}
                    </div>

            {/* Comment Input */}
              {user ? (
                <>
                  {replyingTo ? (
                    <div className="mb-4 p-3 bg-[#222222] rounded border border-[#383838]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Replying to {replyingTo.username || 'comment'}</span>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                        </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0 border border-[#383838]">
                          {user.profile_image_url ? (
                            <img 
                              src={user.profile_image_url} 
                              alt={user.username} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            )}
                          </div>
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-[#222222] text-white p-3 rounded focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] border border-[#383838] resize-none"
                            rows={3}
                          />
                          <button
                            onClick={handleReply}
                            disabled={!replyContent.trim()}
                            className="mt-2 px-4 py-2 bg-[#8B1A1A] text-white rounded hover:bg-[#A02A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center shrink-0 border border-[#383838]">
                        {user.profile_image_url ? (
                          <img 
                            src={user.profile_image_url} 
                            alt={user.username} 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                      )}
                    </div>
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Join the discussion..."
                          className="w-full bg-[#222222] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] border border-[#383838] resize-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Share</span>
                          </div>
                        <button
                          onClick={handleSubmitComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-[#8B1A1A] text-white rounded hover:bg-[#A02A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Post Comment
                        </button>
                        </div>
                          </div>
                    </div>
                  )}
                              </>
                            ) : (
                <div className="mb-4 p-4 bg-[#222222] rounded border border-[#383838] text-center">
                  <p className="text-gray-400 mb-2">Please log in to join the discussion.</p>
                  <Link
                    to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search + '#comments')}`}
                    className="text-[#8B1A1A] hover:text-[#A02A2A] font-semibold"
                  >
                    Log In
                  </Link>
                    </div>
                  )}

              {/* Sort Options */}
              <div className="flex items-center justify-end gap-4 mb-4 pb-4 border-b border-[#222222]">
                <button
                  onClick={() => setCommentSort('best')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'best'
                      ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Best
                </button>
                <button
                  onClick={() => setCommentSort('newest')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'newest'
                      ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setCommentSort('oldest')}
                  className={`text-sm transition-colors px-1 pb-1 ${
                    commentSort === 'oldest'
                      ? 'font-semibold text-[#8B1A1A] border-b-2 border-[#8B1A1A]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Oldest
                </button>
                            </div>

              {/* Comments List */}
              {commentsLoading ? (
                <div className="text-center py-8">
                  <RedDotLoader size="medium" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No comments yet. Be the first to comment!</div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUser={user}
                      onReply={setReplyingTo}
                      onUpdate={handleCommentUpdate}
                      onDelete={handleCommentDelete}
                    />
                  ))}
                    </div>
                  )}
                    </div>
                    </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Social Sharing Icons */}
            <div className="bg-black p-3 flex gap-2 justify-center">
                <button
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on X (Twitter)"
                onClick={() => {
                  window.open(getTwitterShareUrl(), '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">X</span>
                </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on Facebook"
                onClick={() => {
                  window.open(getFacebookShareUrl(), '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">f</span>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on LinkedIn"
                onClick={() => {
                  window.open(getLinkedInShareUrl(), '_blank', 'noopener,noreferrer');
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: launch.name,
                      text: shareText,
                      url: currentPageUrl
                    }).catch(err => console.log('Error sharing:', err));
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard.writeText(currentPageUrl);
                    alert('Link copied to clipboard!');
                  }
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Email"
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(launch.name)}&body=${encodeURIComponent(currentPageUrl)}`;
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Copy link"
                onClick={() => {
                  navigator.clipboard.writeText(currentPageUrl);
                  alert('Link copied to clipboard!');
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
                            </div>

            {/* Launch Overview */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">LAUNCH OVERVIEW</h3>
              <div className="p-4 space-y-4">
                {/* Launch Window Bar */}
                {(launch.window_start || launch.window_end || launch.launch_date || launch.net) && (
                  <div className="my-4">
                    {/* Progress Bar with Rocket Icon */}
                  <div className="mb-4">
                      <div className="relative w-full h-2">
                        {/* Background bar (dark gray) */}
                        <div className="absolute inset-0 bg-[#333333] rounded"></div>
                        {/* Foreground bar (dark red) */}
                        <div className="absolute inset-0 bg-[#8B1A1A] rounded"></div>
                        {/* Rocket Icon - positioned on the left, rotated -45deg like mobile app */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10">
                          <IoRocket 
                            size={20} 
                            color="#FFFFFF" 
                            style={{ transform: 'rotate(-45deg)' }}
                          />
                      </div>
                    </div>
                </div>

                    {/* Window Open and Close Boxes */}
                    <div className="flex gap-2 justify-between">
                      <div className="bg-[#1a1a1a] rounded-lg p-3 w-fit">
                        <div className="text-[10px] text-white mb-1 font-normal">Window Open</div>
                        <div className="text-[10px] text-white font-bold mb-0.5">
                          {formatWindowTimeWithTimezone(
                            launch.window_start || launch.launch_date || launch.net,
                            pad.location?.timezone_name || pad.timezone || null
                          ).local}
                        </div>
                        <div className="text-[10px] text-white font-normal">
                          {formatWindowTimeWithTimezone(
                            launch.window_start || launch.launch_date || launch.net,
                            pad.location?.timezone_name || pad.timezone || null
                          ).utc}
                        </div>
                      </div>
                      
                      <div className="bg-[#1a1a1a] rounded-lg p-3 w-fit">
                        <div className="text-[10px] text-white mb-1 font-normal">Window Close</div>
                        <div className="text-[10px] text-white font-bold mb-0.5">
                          {formatWindowTimeWithTimezone(
                            launch.window_end || launch.launch_date || launch.net,
                            pad.location?.timezone_name || pad.timezone || null
                          ).local}
                        </div>
                        <div className="text-[10px] text-white font-normal">
                          {formatWindowTimeWithTimezone(
                            launch.window_end || launch.launch_date || launch.net,
                            pad.location?.timezone_name || pad.timezone || null
                          ).utc}
                        </div>
                          </div>
                      </div>
                    </div>
                  )}

                {/* Launch Facility and Pad */}
                <div className="space-y-3 text-sm">
                  {(pad.name || pad.location) && (
                  <div className="flex items-start">
                    <span className="text-white font-semibold w-32 shrink-0">LAUNCH FACILITY:</span>
                    <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                      <div className="text-white whitespace-normal">
                        {pad.location?.name ? (
                          pad.location.name.toUpperCase().split(' ').map((word, idx, arr) => {
                            // Break "NASA KENNEDY SPACE CENTER" into "NASA KENNEDY" and "SPACE CENTER"
                            if (word === 'SPACE' && arr[idx - 1] === 'KENNEDY') {
                              return <div key={idx}>{word}</div>;
                            }
                            return <span key={idx}>{idx > 0 ? ' ' : ''}{word}</span>;
                          })
                        ) : (
                          <div>TBD</div>
                  )}
                </div>
            </div>
          </div>
                  )}
                  {pad.name && (
                  <div className="flex items-start">
                    <span className="text-white font-semibold w-32 shrink-0">LAUNCH PAD:</span>
                    <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                      <div className="text-white">
                        {pad.name?.toUpperCase() || 'TBD'}
              </div>
              </div>
            </div>
                  )}
              </div>
              </div>
            </div>

            {/* Payload Overview */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">PAYLOAD OVERVIEW</h3>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">CUSTOMER:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white">
                      {launch.payloads && launch.payloads.length > 0 && launch.payloads[0]?.customers && Array.isArray(launch.payloads[0].customers) && launch.payloads[0].customers.length > 0
                        ? launch.payloads[0].customers.join(', ').toUpperCase()
                        : (launchServiceProvider?.name || 'TBD').toUpperCase()}
                </div>
                </div>
                </div>
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">PAYLOAD:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white">
                      {launch.payloads && launch.payloads.length > 0 ? (
                        launch.payloads.map((p, idx) => (
                          <div key={idx}>{p.name?.toUpperCase() || 'UNNAMED PAYLOAD'}</div>
                    ))
                  ) : (
                        <div>TBD</div>
                )}
              </div>
            </div>
                </div>
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">PAYLOAD MASS:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white">
                      {launch.payloads && launch.payloads.length > 0 ? (() => {
                        const totalMassKg = launch.payloads.reduce((sum, p) => sum + (parseFloat(p.mass_kg) || 0), 0);
                        if (totalMassKg === 0) return 'TBD';
                        const totalMassLb = Math.round(totalMassKg * 2.20462);
                        const formattedKg = totalMassKg.toLocaleString();
                        const formattedLb = totalMassLb.toLocaleString();
                        // Format with space after comma: "36, 000lb"
                        const formattedLbWithSpace = formattedLb.replace(/,(\d{3})/g, ', $1');
                        return `${formattedKg}kg (${formattedLbWithSpace}lb)`;
                      })() : 'TBD'}
                  </div>
                  </div>
              </div>
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">DESTINATION:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white">
                      {((launch.payloads && launch.payloads.length > 0 && launch.payloads[0]?.orbit?.abbrev) || mission?.orbit?.abbrev || 'TBD').toUpperCase()}
            </div>
                </div>
                </div>
              </div>
            </div>

            {/* Recovery Overview */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RECOVERY OVERVIEW</h3>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">LANDING LOCATION:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white whitespace-normal">
                      {(() => {
                        const location = (launch.recovery?.landing_location || 'TBD').toUpperCase();
                        // Split "JUST READ THE INSTRUCTIONS" into "JUST READ THE" and "INSTRUCTIONS"
                        if (location.includes('JUST READ THE INSTRUCTIONS')) {
                          return (
                            <>
                              <div>JUST READ THE</div>
                              <div>INSTRUCTIONS</div>
                            </>
                          );
                        }
                        // For other locations, try to split intelligently
                        const words = location.split(' ');
                        if (words.length > 3) {
                          // Split into two lines if it's long
                          const midPoint = Math.ceil(words.length / 2);
                          return (
                            <>
                              <div>{words.slice(0, midPoint).join(' ')}</div>
                              <div>{words.slice(midPoint).join(' ')}</div>
                            </>
                          );
                        }
                        return <div>{location}</div>;
                      })()}
                  </div>
                </div>
              </div>
                <div className="flex items-start">
                  <span className="text-white font-semibold w-32 shrink-0">LANDING TYPE:</span>
                  <div className="flex-1 border-l-2 border-[#8B1A1A] pl-3">
                    <div className="text-white">
                      {(launch.recovery?.landing_type || 'TBD').toUpperCase()}
                    </div>
                </div>
              </div>
              </div>
                    </div>

            {/* Related Stories */}
            <div className="bg-[#121212]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED STORIES</h3>
              <div className="h-0.5 bg-[#8B1A1A]"></div>
              <div className="p-4 space-y-4">
                {relatedStories.length > 0 ? (
                  relatedStories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/news/${story.slug || story.id}`}
                      className="block hover:opacity-80 transition-opacity group"
                    >
                      <div className="w-full h-24 bg-[#222222] mb-2 overflow-hidden rounded">
                        {story.featured_image_url || story.hero_image_url ? (
                          <img 
                            src={story.featured_image_url || story.hero_image_url} 
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                            No Image
                </div>
                        )}
              </div>
                      <div className="text-sm text-white leading-tight line-clamp-2">
                        {story.title}
                      </div>
                    </Link>
                    ))
                  ) : (
                  <div className="text-sm text-gray-400 text-center py-4">No related stories available.</div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LaunchDetail;
