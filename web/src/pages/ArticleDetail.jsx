import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
import CommentItem from '../components/CommentItem';
import { useAuth } from '../contexts/AuthContext';
import RedDotLoader from '../components/common/RedDotLoader';

const ArticleDetail = () => {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedLaunches, setRelatedLaunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [authorImageError, setAuthorImageError] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentSort, setCommentSort] = useState('newest');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(/\s/g, '');
      setCurrentTime(timeString);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const categories = ['NEWS', 'LAUNCH', 'IN SPACE', 'TECHNOLOGY', 'MILITARY', 'FINANCE'];

  // Dummy article data with full content
  const dummyArticles = {
    'live-coverage-china-shenzhou-20-crew-launch': {
      id: 1,
      slug: 'live-coverage-china-shenzhou-20-crew-launch',
      title: 'LIVE COVERAGE! China Shenzhou 20 Crew Launch',
      subtitle: 'The Shenzhou 20 mission will lift off aboard a Long March 2F rocket from the Jiuquan Satellite Launch Center in northwest China at 5:17 a.m. EDT (0917 GMT; 5:17 p.m. Beijing time).',
      content: `<p>WASHINGTON — The Space Development Agency (SDA) wants to give commercial space companies a chance to prove their mettle for future military satellite contracts. The agency on May 31 released a solicitation for its "Hybrid Acquisition for Proliferated LEO" (HALO) program, which aims to establish a pool of pre-approved vendors eligible to compete for upcoming demonstration projects.</p>
        <p>The Space Development Agency (SDA), a U.S. Space Force organization tasked with deploying a military low-Earth orbit (LEO) satellite constellation, is looking to bring in new blood from the commercial space industry.</p>
        <p>Through HALO, selected vendors will be eligible to compete for future demonstration prototype projects. According to a solicitation, SDA plans to award multiple contracts annually.</p>
        <h3>Seeking new players</h3>
        <p>While established defense contractors have scooped up the lion's share of SDA's contracts for its planned LEO constellation, the HALO program is designed specifically to attract newer commercial players to try their hand at rapid prototyping and spaceflight demonstrations.</p>
        <p>Proposals are due July 11, with an industry briefing scheduled for June 17.</p>
        <p>The agency said HALO intends to provide opportunities for companies to gain valuable experience working with SDA on experimental projects and give them opportunities to demonstrate and mature their technologies so they're better prepared to bid for larger procurements of satellites that the agency calls 'tranches.'</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=800&fit=crop',
      category: { name: 'Launch' },
      tags: ['ARTEMIS', 'SLS', 'SPACEX', 'NASA', 'MOON'],
      summary: [
        'NASA TO CANCEL SPACE LAUNCH SYSTEM AND ARTEMIS PROGRAM',
        'NASA BLOWS UP ROCKET AT NASA KSC MUSEUM BY MISTAKE',
        'SLS TRIPS ON NSF VAN DURING ROLLOUT',
        'PRESS SITE FALLS INTO MASSIVE SINK HOLE TLP CREW WERE NOT ON SITE'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    'atmos-phoenix-1-reaches-orbit': {
      id: 2,
      slug: 'atmos-phoenix-1-reaches-orbit',
      title: 'ATMOS PHOENIX 1 Reaches Orbit; Conducts Critical Inflatable ReEntry Test',
      subtitle: 'The innovative inflatable reentry vehicle successfully completed its orbital test, marking a significant milestone in reusable spacecraft technology.',
      content: `<p>WASHINGTON — The innovative ATMOS PHOENIX 1 mission has successfully reached orbit and completed its critical inflatable reentry test, marking a significant milestone in the development of reusable spacecraft technology.</p>
        <p>The mission, launched from Vandenberg Space Force Base, demonstrated the viability of inflatable heat shield technology that could revolutionize how spacecraft return to Earth from orbit.</p>
        <p>During the test, the vehicle deployed its inflatable heat shield at an altitude of 120 kilometers, successfully protecting the payload during atmospheric reentry at speeds exceeding Mach 25.</p>
        <h3>Revolutionary Technology</h3>
        <p>This technology represents a breakthrough in space exploration, potentially reducing the cost and complexity of returning payloads from space. Traditional rigid heat shields are heavy and take up significant space, but inflatable systems can be compact during launch and expand when needed.</p>
        <p>The successful test opens the door for future missions that could use this technology for returning samples from Mars, delivering cargo from the International Space Station, or even enabling crewed missions with more efficient reentry systems.</p>
        <p>NASA and commercial partners are closely watching these developments, as the technology could significantly impact future space exploration missions.</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop',
      category: { name: 'In Space' },
      tags: ['IN SPACE', 'TECHNOLOGY', 'NASA', 'REUSABLE', 'ORBIT'],
      summary: [
        'ATMOS PHOENIX 1 SUCCESSFULLY COMPLETES ORBITAL TEST',
        'INFLATABLE HEAT SHIELD TECHNOLOGY PROVES VIABLE',
        'MISSION DEMONSTRATES REUSABLE SPACECRAFT CAPABILITIES',
        'BREAKTHROUGH COULD REDUCE SPACE MISSION COSTS'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    'spacex-starship-successful-test-flight': {
      id: 3,
      slug: 'spacex-starship-successful-test-flight',
      title: 'SpaceX Starship Completes Successful Test Flight to Orbit',
      subtitle: 'Elon Musk\'s Starship achieves milestone with successful orbital test, bringing humanity one step closer to Mars colonization.',
      content: `<p>BOCA CHICA, Texas — SpaceX's Starship has successfully completed its first orbital test flight, marking a historic milestone in the company's ambitious plan to colonize Mars.</p>
        <p>The massive rocket, standing 120 meters tall, lifted off from SpaceX's Starbase facility in South Texas, successfully reaching orbit before completing a controlled reentry and splashdown in the Pacific Ocean.</p>
        <p>This test flight represents years of development and testing, with SpaceX iterating through multiple prototypes to reach this point. The successful mission validates the company's approach to rapid development and testing.</p>
        <h3>Mars Mission Progress</h3>
        <p>Starship is designed to be fully reusable, capable of carrying up to 100 people or 100 tons of cargo to Mars. This successful test brings SpaceX significantly closer to its goal of establishing a permanent human presence on the Red Planet.</p>
        <p>Elon Musk has stated that the first crewed mission to Mars could happen as early as 2029, though many experts believe this timeline is optimistic. Regardless, today's success demonstrates that the technology is progressing rapidly.</p>
        <p>The successful orbital test also opens up possibilities for other missions, including point-to-point travel on Earth, lunar missions, and deep space exploration.</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop',
      category: { name: 'Launch' },
      tags: ['SPACEX', 'STARSHIP', 'MARS', 'ORBIT', 'ELON MUSK'],
      summary: [
        'SPACEX STARSHIP REACHES ORBIT FOR FIRST TIME',
        'HISTORIC MILESTONE FOR MARS COLONIZATION EFFORTS',
        'FULLY REUSABLE ROCKET VALIDATES TECHNOLOGY',
        'CREWED MARS MISSION NOW CLOSER TO REALITY'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date(Date.now() - 172800000).toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    'nasa-artemis-2-mission-update': {
      id: 4,
      slug: 'nasa-artemis-2-mission-update',
      title: 'NASA Artemis 2 Mission: Astronauts Prepare for Lunar Return',
      subtitle: 'The Artemis 2 crew continues training for humanity\'s return to the Moon, with launch scheduled for next year.',
      content: `<p>HOUSTON — The four astronauts selected for NASA's Artemis 2 mission are deep into their training regimen as they prepare to become the first humans to travel to the Moon in over 50 years.</p>
        <p>The mission, scheduled for launch in 2025, will see the crew orbit the Moon before returning to Earth, paving the way for the Artemis 3 mission that will land astronauts on the lunar surface.</p>
        <p>Commander Reid Wiseman, Pilot Victor Glover, Mission Specialist Christina Koch, and Mission Specialist Jeremy Hansen have been training together for months, practicing every aspect of the mission from launch to splashdown.</p>
        <h3>Training Intensifies</h3>
        <p>The crew has been working with the Orion spacecraft simulators, practicing emergency procedures, and learning to work with the Space Launch System (SLS) rocket that will carry them to the Moon.</p>
        <p>This mission represents a new era of lunar exploration, with plans to establish a permanent presence on the Moon and use it as a stepping stone for future missions to Mars.</p>
        <p>The Artemis program aims to land the first woman and first person of color on the Moon, while also establishing sustainable lunar operations that will support future deep space exploration.</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
      category: { name: 'Launch' },
      tags: ['ARTEMIS', 'NASA', 'MOON', 'SLS', 'ORION'],
      summary: [
        'ARTEMIS 2 CREW TRAINING FOR LUNAR MISSION',
        'FIRST HUMANS TO MOON IN OVER 50 YEARS',
        'MISSION SCHEDULED FOR 2025 LAUNCH',
        'PIONEERING NEW ERA OF LUNAR EXPLORATION'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date(Date.now() - 259200000).toISOString(),
      created_at: new Date(Date.now() - 259200000).toISOString()
    },
    'mars-sample-return-mission-progress': {
      id: 5,
      slug: 'mars-sample-return-mission-progress',
      title: 'Mars Sample Return Mission Makes Significant Progress',
      subtitle: 'NASA and ESA collaboration advances with successful sample collection on the Red Planet.',
      content: `<p>PASADENA, Calif. — The Mars Sample Return mission has reached a critical milestone as NASA's Perseverance rover successfully collected and cached its first set of rock samples from the Jezero Crater.</p>
        <p>These samples, carefully selected by scientists, represent some of the most promising locations for finding evidence of ancient Martian life. The rover has been exploring the crater for over two years, analyzing rocks and soil for signs of past microbial life.</p>
        <p>The mission is a collaboration between NASA and the European Space Agency (ESA), with plans to retrieve these samples and return them to Earth for detailed analysis in laboratories around the world.</p>
        <h3>Sample Collection Success</h3>
        <p>Perseverance has collected over 20 samples so far, each carefully sealed in titanium tubes and cached at designated locations on the Martian surface. These samples will be retrieved by a future mission that will launch a rocket from the surface of Mars.</p>
        <p>This ambitious mission represents the first time humans will attempt to return samples from another planet, requiring unprecedented coordination between multiple spacecraft and agencies.</p>
        <p>The samples could provide definitive answers about whether life ever existed on Mars, and could help scientists understand the planet's geological history and potential for future human exploration.</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=800&h=600&fit=crop',
      category: { name: 'Technology' },
      tags: ['MARS', 'NASA', 'ESA', 'PERSEVERANCE', 'SAMPLES'],
      summary: [
        'PERSEVERANCE COLLECTS FIRST MARS SAMPLES',
        'HISTORIC MISSION TO RETURN SAMPLES TO EARTH',
        'COLLABORATION BETWEEN NASA AND ESA',
        'SAMPLES COULD REVEAL EVIDENCE OF ANCIENT LIFE'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date(Date.now() - 345600000).toISOString(),
      created_at: new Date(Date.now() - 345600000).toISOString()
    },
    'darpa-lunar-orbiter-water-prospecting': {
      id: 6,
      slug: 'darpa-lunar-orbiter-water-prospecting',
      title: 'DARPA Seeks Proposals for Lunar Orbiter to Prospect Water Ice',
      subtitle: 'Defense Advanced Research Projects Agency announces new initiative to map and prospect lunar water resources.',
      content: `<p>ARLINGTON, Va. — The Defense Advanced Research Projects Agency (DARPA) has announced a new initiative to develop a lunar orbiter capable of prospecting for water ice and testing low orbit operations around the Moon.</p>
        <p>The program, called "Lunar Water Prospecting and Low Orbit Operations" (LWPLO), aims to demonstrate technologies that could support future lunar operations and resource utilization.</p>
        <p>Water ice on the Moon is considered a critical resource for future space exploration, as it can be converted into rocket fuel, breathable air, and drinking water for astronauts. Finding and mapping these resources is essential for establishing a sustainable presence on the Moon.</p>
        <h3>Strategic Importance</h3>
        <p>DARPA's interest in lunar water prospecting reflects the growing recognition that space resources will play a crucial role in future space operations. The agency is seeking proposals from commercial and academic partners to develop the orbiter and its instruments.</p>
        <p>The mission would demonstrate the ability to operate in low lunar orbit, which presents unique challenges due to the Moon's irregular gravity field and the need for precise navigation.</p>
        <p>This initiative comes as multiple nations and companies are planning lunar missions, making the Moon an increasingly important strategic location for space operations.</p>`,
      hero_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1920&h=800&fit=crop',
      featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
      category: { name: 'Military' },
      tags: ['DARPA', 'MOON', 'WATER', 'ORBITER', 'MILITARY'],
      summary: [
        'DARPA ANNOUNCES LUNAR WATER PROSPECTING PROGRAM',
        'ORBITER TO MAP LUNAR WATER ICE RESOURCES',
        'CRITICAL FOR FUTURE SPACE OPERATIONS',
        'COMMERCIAL AND ACADEMIC PARTNERS SOUGHT'
      ],
      author: {
        id: 1,
        full_name: 'ZACHARY AUBERT',
        first_name: 'Zac',
        last_name: 'Aubert',
        title: 'SPACE NEWS JOURNALIST',
        bio: 'Zac Aubert is the founder and ceo of The Launch pad, covering everything from rocket launches, space tech, and off planet mission.',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      published_at: new Date(Date.now() - 432000000).toISOString(),
      created_at: new Date(Date.now() - 432000000).toISOString()
    }
  };

  // Dummy related articles
  const dummyRelatedArticles = [
    {
      id: 7,
      slug: 'rocketlab-electron-launch-success',
      title: 'RocketLab Electron Successfully Deploys 30 Satellites',
      featured_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      slug: 'james-webb-telescope-new-discovery',
      title: 'James Webb Telescope Discovers Ancient Galaxy Formation',
      featured_image_url: 'https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?w=400&h=300&fit=crop'
    },
    {
      id: 9,
      slug: 'space-tourism-blue-origin-flight',
      title: 'Blue Origin Completes 25th Suborbital Tourism Flight',
      featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop'
    },
    {
      id: 10,
      slug: 'international-space-station-expansion',
      title: 'International Space Station Receives New Science Module',
      featured_image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop'
    }
  ];

  // Dummy related launches
  const dummyRelatedLaunches = [
    {
      id: 1,
      name: 'UNITED LAUNCH ALLIANCE',
      subtitle: 'CREWED FLIGHT TEST',
      featured_image_url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400&h=300&fit=crop',
      launch_site: { name: 'Cape Canaveral, FL, USA' }
    },
    {
      id: 2,
      name: 'SPACEX FALCON 9',
      subtitle: 'STARLINK MISSION',
      featured_image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=300&fit=crop',
      launch_site: { name: 'Kennedy Space Center, FL, USA' }
    },
    {
      id: 3,
      name: 'BLUE ORIGIN NEW SHEPARD',
      subtitle: 'NS-25 TOURISM FLIGHT',
      featured_image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop',
      launch_site: { name: 'West Texas, USA' }
    }
  ];

  const fetchArticle = async () => {
    try {
      const articleRes = await axios.get(`${API_URL}/api/news/${slug}`);
      
      // Use API data if available, otherwise use dummy data
      if (articleRes.data) {
        setArticle(articleRes.data);
        
        // Fetch related articles from same category
        const categorySlug = articleRes.data.category_slug || articleRes.data.category?.slug;
        try {
          const relatedRes = await axios.get(`${API_URL}/api/news`, { 
            params: { 
              limit: 4, 
              status: 'published',
              ...(categorySlug ? { category: categorySlug } : {})
            } 
          });
          
          const relatedData = Array.isArray(relatedRes.data) 
            ? relatedRes.data 
            : relatedRes.data?.data || [];
          
          // Filter out current article
          const filteredRelated = relatedData.filter(a => a.id !== articleRes.data.id && a.slug !== slug);
          if (filteredRelated.length > 0) {
            setRelatedArticles(filteredRelated.slice(0, 4));
          } else {
            setRelatedArticles(dummyRelatedArticles);
          }
        } catch (relatedError) {
          console.error('Error fetching related articles:', relatedError);
          setRelatedArticles(dummyRelatedArticles);
        }
        
        // Fetch related launches
        try {
          const launchesRes = await axios.get(`${API_URL}/api/launches?limit=3&offset=0`);
          const launchesData = Array.isArray(launchesRes.data) 
            ? launchesRes.data 
            : launchesRes.data?.data || [];
          if (launchesData.length > 0) {
            setRelatedLaunches(launchesData.slice(0, 3));
          } else {
            setRelatedLaunches(dummyRelatedLaunches);
          }
        } catch (launchesError) {
          console.error('Error fetching related launches:', launchesError);
          setRelatedLaunches(dummyRelatedLaunches);
        }
      } else {
        const dummyArticle = dummyArticles[slug] || dummyArticles['live-coverage-china-shenzhou-20-crew-launch'];
        setArticle(dummyArticle);
        setRelatedArticles(dummyRelatedArticles);
        setRelatedLaunches(dummyRelatedLaunches);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      // Use dummy data on error
      const dummyArticle = dummyArticles[slug] || dummyArticles['live-coverage-china-shenzhou-20-crew-launch'];
      setArticle(dummyArticle);
      setRelatedArticles(dummyRelatedArticles);
      setRelatedLaunches(dummyRelatedLaunches);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!article?.id) return;
    
    setCommentsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/news/${article.id}/comments`, {
        params: { sort: commentSort, limit: 100, offset: 0, approved: 'true' }
      });
      setComments(response.data.comments || []);
      setCommentsTotal(response.data.total || 0);
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
      const currentUrl = window.location.href;
      const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return;
    }

    if (!newComment.trim() || !article?.id) return;

    try {
      await axios.post(
        `${API_URL}/api/news/${article.id}/comments`,
        { content: newComment.trim() }
      );
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error.response?.status === 401) {
        const currentUrl = window.location.href;
        const returnUrl = encodeURIComponent(`${currentUrl}#comments`);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }
  };

  const handleReply = async () => {
    if (!user || !replyContent.trim() || !replyingTo || !article?.id) return;

    try {
      await axios.post(
        `${API_URL}/api/news/${article.id}/comments`,
        { content: replyContent.trim(), parent_comment_id: replyingTo.id }
      );
      setReplyContent('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const handleCommentUpdate = async (commentId, content) => {
    try {
      await axios.patch(`${API_URL}/api/news/comments/${commentId}`, { content });
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/news/comments/${commentId}`);
      await fetchComments();
      setCommentsTotal(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-400">
          Loading article...
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Link to="/news" className="text-orange-500 hover:text-orange-400">
            Return to News
          </Link>
        </div>
      </Layout>
    );
  }

  const sectionNav = (
    <div className="bg-orange-500 border-t-2 border-white">
      <div className="max-w-full mx-auto px-6 flex items-center justify-between py-0">
        <div className="flex items-center gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative" style={{ overflow: 'visible', marginTop: '12px' }}>
              <div className="w-14 h-14 bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src="/TLP Helmet.png" 
                  alt="TLP Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="absolute top-full left-0 bg-orange-500 px-2 py-0.5 text-[10px] text-white font-semibold whitespace-nowrap z-50">
                {currentTime}
              </div>
            </div>
            <h1 className="text-4xl font-bold uppercase tracking-tight text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>NEWS</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-0 text-xs uppercase">
            {categories.slice(1).map((cat, idx) => {
              const categorySlugMap = {
                'LAUNCH': '/launches/news',
                'IN SPACE': '/news/in-space',
                'TECHNOLOGY': '/news/technology',
                'MILITARY': '/news/military',
                'FINANCE': '/news/finance',
                'NEWS': '/news'
              };
              const route = categorySlugMap[cat] || '/news';
              const isActive = article?.category_name === cat;
              
              return (
                <div key={cat} className="flex items-center">
                  {idx > 0 && <span className="mx-1 font-bold text-white">|</span>}
                  <Link
                    to={route}
                    className={`px-2 py-1 text-white ${isActive ? 'border-b-2 border-white font-bold' : 'font-normal hover:text-gray-200'}`}
                  >
                    {cat}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Extract summary points from article content or use defaults
  const summaryPoints = article.summary || [
    'NASA TO CANCEL SPACE LAUNCH SYSTEM AND ARTEMIS PROGRAM',
    'NASA BLOWS UP ROCKET AT NASA KSC MUSEUM BY MISTAKE',
    'SLS TRIPS ON NSF VAN DURING ROLLOUT',
    'PRESS SITE FALLS INTO MASSIVE SINK HOLE TLP CREW WERE NOT ON SITE'
  ];

  // Extract tags from article - API returns array of tag objects
  const tags = article.tags && Array.isArray(article.tags) && article.tags.length > 0
    ? article.tags.map(tag => typeof tag === 'string' ? tag : tag.name || tag.slug?.toUpperCase())
    : article.category_name 
      ? [article.category_name.toUpperCase()]
      : ['NEWS'];

  const currentPageUrl = window.location.href;
  const shareText = `${article.title} - ${article.excerpt || ''}`;

  return (
    <Layout sectionNav={sectionNav}>
      {/* Hero Section with Background Image */}
      <div
        className="relative h-[60vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(${article.hero_image_url || article.featured_image_url || 'https://via.placeholder.com/1920x800/1a1a1a/ffffff?text=No+Image'})`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 h-full flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-12 w-full">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 text-white" style={{ fontFamily: 'Nasalization, sans-serif' }}>
              {article.title || 'NASA CANCELS SLS AND ARTEMIS PROGRAM'}
            </h1>
            {article.subtitle && (
              <p className="text-xl md:text-2xl text-white max-w-4xl">
                {article.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Article Content */}
            <div className="mb-8">
              <div
                className="prose prose-invert max-w-none text-white text-base leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: article.content 
                    ? article.content.split('\n\n').map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`).join('')
                    : article.body || '<p>No content available.</p>' 
                }}
                style={{
                  color: 'white',
                }}
              />
            </div>

            {/* Tags */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-yellow-500 text-black px-4 py-2 text-sm font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Author Information Section */}
            <div className="bg-[#121212] p-6 mt-6 border-t-4 border-[#8B1A1A]">
              <div className="flex items-start gap-4">
                {/* Profile Picture with red border */}
                <div className="w-20 h-20 rounded-full shrink-0 border-4 border-[#8B1A1A] overflow-hidden">
                  {!authorImageError && (article.author_image || article.author?.profile_image_url) ? (
                    <img
                      src={article.author_image || article.author.profile_image_url}
                      alt={article.author_name || article.author?.full_name || 'Author'}
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
                    <h3 className="text-xl font-bold inline text-[#8B1A1A] uppercase tracking-wide">
                      {article.author_name || article.author?.full_name || 'ZACHARY AUBERT'}
                    </h3>
                    <span className="text-xl italic text-white uppercase tracking-wide ml-2">
                      {article.author_title || article.author?.title || 'SPACE NEWS JOURNALIST'}
                    </span>
                  </div>
                  {article.author_bio || article.author?.bio ? (
                    <p className="text-sm text-white italic mb-3 leading-relaxed">
                      {article.author_bio || article.author.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-white italic mb-3 leading-relaxed">
                      {article.author_name || 'Zac Aubert'} is a space news journalist covering everything from rocket launches, space tech, and off planet missions.
                    </p>
                  )}
                  <p className="text-sm text-white italic mb-3 leading-relaxed">
                    He doesn't have a book yet but is working on the <span className="italic">Astro Guide: An UnOfficial Guide To The America Space Coast</span>
                  </p>
                  <Link
                    to={`/news?author=${article.author_id || article.author?.id || 'zac-aubert'}`}
                    className="text-[#8B1A1A] hover:text-[#A02A2A] text-sm mt-2 inline-block font-semibold transition-colors"
                  >
                    More by {article.author_first_name || article.author?.first_name || article.author_name?.split(' ')[0] || 'Zac'} {article.author_last_name || article.author?.last_name || article.author_name?.split(' ').slice(1).join(' ') || 'Aubert'}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Sharing Icons */}
            <div className="bg-black p-3 flex gap-2 justify-center">
              <button
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on X (Twitter)"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentPageUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">X</span>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on Facebook"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentPageUrl)}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="text-sm font-bold">f</span>
              </button>
              <button 
                className="w-10 h-10 rounded-full bg-[#8B1A1A] flex items-center justify-center hover:opacity-90 text-white transition-opacity"
                title="Share on LinkedIn"
                onClick={() => {
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentPageUrl)}`, '_blank', 'noopener,noreferrer');
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
                      title: article.title,
                      text: shareText,
                      url: currentPageUrl
                    }).catch(err => console.log('Error sharing:', err));
                  } else {
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
                  window.location.href = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(currentPageUrl)}`;
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

            {/* Summary */}
            <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
              <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">SUMMARY</h3>
              <div className="p-4 space-y-3">
                <ul className="space-y-3">
                  {summaryPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#8B1A1A] text-lg mt-0.5">●</span>
                      <span className="text-sm text-white">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related Launches */}
            {relatedLaunches.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
                <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED LAUNCHES</h3>
                <div className="p-4 space-y-4">
                  {relatedLaunches.map((launch) => (
                    <Link
                      key={launch.id}
                      to={`/launches/${launch.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      {launch.featured_image_url ? (
                        <img
                          src={launch.featured_image_url}
                          alt={launch.name}
                          className="w-full h-32 object-cover mb-2"
                        />
                      ) : (
                        <div className="h-32 bg-gray-800 mb-2"></div>
                      )}
                      <div className="text-sm font-semibold text-white mb-1">
                        {launch.name || 'UNITED LAUNCH ALLIANCE'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {launch.launch_site?.name || launch.location || 'Cape Canaveral, FL, USA'}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Stories */}
            {relatedArticles.length > 0 && (
              <div className="bg-[#121212] border-t-4 border-[#8B1A1A]">
                <h3 className="text-lg sm:text-xl font-bold py-3 px-4 text-center text-white uppercase">RELATED STORIES</h3>
                <div className="p-4 space-y-4">
                  {relatedArticles
                    .filter((a) => a.id !== article.id)
                    .slice(0, 4)
                    .map((related) => (
                      <Link
                        key={related.id}
                        to={`/news/${related.slug || related.id}`}
                        className="block hover:opacity-80 transition-opacity"
                      >
                        {related.featured_image_url ? (
                          <img
                            src={related.featured_image_url}
                            alt={related.title}
                            className="w-full h-24 object-cover mb-2"
                          />
                        ) : (
                          <div className="h-24 bg-gray-800 mb-2"></div>
                        )}
                        <div className="text-sm font-semibold text-white line-clamp-2">
                          {related.title || 'SpaceX To Move StarHopper To NASA Kennedy Space Center'}
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ArticleDetail;
