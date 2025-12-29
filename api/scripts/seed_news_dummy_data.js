/**
 * Seed Dummy News Articles
 * Creates comprehensive dummy data for testing the news page
 */

const { getPool } = require('../config/database');
require('dotenv').config();

const pool = getPool();

const dummyArticles = [
  // Featured Article
  {
    title: "BREAKING: SPACEX LAUNCHES HISTORIC MISSION TO MARS",
    subtitle: "First crewed mission marks new era in interplanetary travel",
    slug: "breaking-spacex-launches-historic-mission-to-mars",
    excerpt: "SpaceX makes history with first crewed mission to Mars, marking a new era in interplanetary travel and space exploration.",
    content: `SpaceX has successfully launched its first crewed mission to Mars, marking a historic milestone in human space exploration. The mission, which departed from Kennedy Space Center earlier today, carries a crew of four astronauts who will spend the next six months traveling to the Red Planet.

This groundbreaking mission represents years of preparation and technological innovation. The Starship spacecraft, which has undergone extensive testing and development, is now carrying humans beyond Earth's orbit for the first time in SpaceX's history.

The crew includes mission commander Sarah Chen, pilot Marcus Rodriguez, mission specialist Dr. James Wilson, and engineer Priya Patel. They will conduct scientific experiments during the journey and upon arrival on Mars.

"This is a momentous day for humanity," said SpaceX CEO Elon Musk in a statement. "We're taking the first steps toward making life multiplanetary."

The mission is expected to arrive at Mars in approximately six months, where the crew will establish a research base and conduct experiments for up to two years before returning to Earth.`,
    status: 'published',
    is_featured: true,
    is_trending: true,
    is_top_story: true,
    is_interview: false,
    views_count: 1250,
    category: 'LAUNCH',
    tags: ['SPACEX', 'MARS', 'CREWED MISSION']
  },
  // Top Stories
  {
    title: "NASA ANNOUNCES ARTEMIS 2 CREW SELECTION",
    subtitle: "Four astronauts selected for historic lunar mission",
    slug: "nasa-announces-artemis-2-crew-selection",
    excerpt: "NASA has officially announced the crew for Artemis 2, the first crewed mission to orbit the Moon since Apollo 17.",
    content: `NASA Administrator Bill Nelson today announced the four astronauts who will fly aboard the Artemis 2 mission, scheduled for launch in 2024. The crew includes Commander Reid Wiseman, Pilot Victor Glover, Mission Specialist Christina Koch, and Mission Specialist Jeremy Hansen.

Artemis 2 will be the first crewed mission of NASA's Artemis program and will test the Space Launch System (SLS) rocket and Orion spacecraft with humans on board. The mission will orbit the Moon before returning to Earth, paving the way for future lunar landings.

"This crew represents the best of humanity," said Nelson. "They will carry the hopes and dreams of millions as they journey around the Moon."

The mission is expected to last approximately 10 days, with the crew spending several days in lunar orbit conducting experiments and testing systems before returning to Earth.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: true,
    is_interview: false,
    views_count: 980,
    category: 'LAUNCH',
    tags: ['NASA', 'ARTEMIS 2', 'MOON']
  },
  {
    title: "CHINA LAUNCHES SHENZHOU 20 MISSION TO SPACE STATION",
    subtitle: "Three astronauts begin six-month mission aboard Tiangong",
    slug: "china-launches-shenzhou-20-mission-to-space-station",
    excerpt: "China successfully launches Shenzhou 20 mission, sending three astronauts to the Tiangong space station for a six-month stay.",
    content: `China has successfully launched the Shenzhou 20 spacecraft, carrying three astronauts to the Tiangong space station. The mission, launched from the Jiuquan Satellite Launch Center, marks another milestone in China's ambitious space program.

The crew, consisting of mission commander Wang Yaping, pilot Ye Guangfu, and mission specialist Gui Haichao, will spend six months aboard the space station conducting scientific experiments and maintenance work.

During their stay, the crew will perform spacewalks, conduct biological experiments, and test new technologies for future deep space missions. The mission also includes educational activities, with the crew conducting live science lessons for students across China.

"This mission demonstrates China's growing capabilities in human spaceflight," said a spokesperson for the China Manned Space Agency. "We are committed to peaceful exploration and international cooperation in space."`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: false,
    views_count: 750,
    category: 'IN SPACE',
    tags: ['CHINA', 'SPACE STATION', 'SHENZHOU']
  },
  {
    title: "BLUE ORIGIN ANNOUNCES NEW GLENN ROCKET FIRST FLIGHT",
    subtitle: "Heavy-lift rocket set for debut launch in 2024",
    slug: "blue-origin-announces-new-glenn-rocket-first-flight",
    excerpt: "Blue Origin reveals plans for the first flight of its New Glenn heavy-lift rocket, capable of carrying large payloads to orbit.",
    content: `Blue Origin has announced that its New Glenn heavy-lift rocket will make its first flight in late 2024. The rocket, named after astronaut John Glenn, is designed to be reusable and capable of carrying large payloads to low Earth orbit and beyond.

New Glenn stands 95 meters tall and features seven BE-4 engines on its first stage, making it one of the most powerful rockets currently in development. The rocket is designed to be reusable, with the first stage capable of landing on a sea-based platform similar to SpaceX's approach.

"The first flight of New Glenn represents a major milestone for Blue Origin," said CEO Bob Smith. "This rocket will enable a new generation of space missions and commercial opportunities."

The rocket is already booked for several missions, including launches for NASA and commercial satellite operators. Blue Origin plans to conduct extensive testing before the first operational flight.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: true,
    is_interview: false,
    views_count: 620,
    category: 'TECHNOLOGY',
    tags: ['BLUE ORIGIN', 'NEW GLENN', 'ROCKET']
  },
  {
    title: "EUROPEAN SPACE AGENCY UNVEILS NEW MARS ROVER",
    subtitle: "Rosalind Franklin rover prepares for 2028 launch",
    slug: "european-space-agency-unveils-new-mars-rover",
    excerpt: "ESA reveals the completed Rosalind Franklin rover, designed to search for signs of past life on Mars.",
    content: `The European Space Agency has unveiled the completed Rosalind Franklin rover, which will search for signs of past life on Mars when it launches in 2028. The rover, named after the pioneering scientist who helped discover DNA's structure, is equipped with advanced instruments to analyze Martian soil and rock samples.

The rover features a drill capable of reaching two meters below the surface, where evidence of past life might be preserved. It also carries a suite of scientific instruments including spectrometers, cameras, and a life-detection experiment.

"Rosalind Franklin represents the culmination of years of work by scientists and engineers across Europe," said ESA Director General Josef Aschbacher. "This mission will help answer one of humanity's greatest questions: did life ever exist on Mars?"

The rover will be launched aboard a Russian Proton rocket and will land in Oxia Planum, a region of Mars that scientists believe once contained water and may have been habitable.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 450,
    category: 'IN SPACE',
    tags: ['ESA', 'MARS', 'ROVER']
  },
  // Interviews
  {
    title: "EXCLUSIVE INTERVIEW: NASA ASTRONAUT DISCUSSES FUTURE OF SPACE EXPLORATION",
    subtitle: "Veteran astronaut shares insights on upcoming missions",
    slug: "exclusive-interview-nasa-astronaut-discusses-future-of-space-exploration",
    excerpt: "In an exclusive interview, veteran NASA astronaut discusses the future of human spaceflight and upcoming missions to the Moon and Mars.",
    content: `In an exclusive interview with TLP News, veteran NASA astronaut Dr. Samantha Martinez discusses her experiences in space and the future of human spaceflight. Dr. Martinez, who has spent over 300 days in space across multiple missions, shares her insights on upcoming missions to the Moon and Mars.

"Space exploration is entering a new golden age," says Dr. Martinez. "With the Artemis program and commercial spaceflight, we're seeing unprecedented opportunities for discovery and innovation."

Dr. Martinez discusses the challenges of long-duration spaceflight, the importance of international cooperation, and her hopes for the future of space exploration. She also shares personal anecdotes from her time aboard the International Space Station.

The interview covers topics ranging from the technical challenges of space travel to the psychological aspects of living in space for extended periods. Dr. Martinez emphasizes the importance of preparation and teamwork in successful space missions.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: true,
    views_count: 380,
    category: 'NEWS',
    tags: ['NASA', 'INTERVIEW', 'ASTRONAUT']
  },
  {
    title: "SPACEX ENGINEER REVEALS SECRETS OF STARSHIP DEVELOPMENT",
    subtitle: "Behind the scenes look at revolutionary spacecraft",
    slug: "spacex-engineer-reveals-secrets-of-starship-development",
    excerpt: "SpaceX engineer provides exclusive insights into the development of the Starship spacecraft and the challenges of building a reusable interplanetary vehicle.",
    content: `In an exclusive interview, SpaceX senior engineer David Chen reveals the behind-the-scenes story of developing the Starship spacecraft. Chen, who has worked on the project since its inception, discusses the technical challenges, breakthroughs, and future plans for the revolutionary vehicle.

"Building Starship has been the most challenging and rewarding project of my career," says Chen. "We're not just building a rocket—we're building the foundation for humanity's future in space."

The interview covers the development of the Raptor engines, the challenges of creating a fully reusable spacecraft, and the testing process that led to successful flights. Chen also discusses SpaceX's plans for future missions, including trips to Mars and beyond.

Chen emphasizes the importance of rapid iteration and learning from failures, a philosophy that has been central to SpaceX's approach. He also shares insights into the company's culture and the collaborative effort required to build such an ambitious project.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: true,
    views_count: 520,
    category: 'TECHNOLOGY',
    tags: ['SPACEX', 'INTERVIEW', 'STARSHIP']
  },
  {
    title: "FORMER ASTRONAUT REFLECTS ON APOLLO LEGACY",
    subtitle: "Veteran astronaut shares memories of Moon landing era",
    slug: "former-astronaut-reflects-on-apollo-legacy",
    excerpt: "Former Apollo astronaut reflects on the legacy of the Moon landing program and its impact on modern space exploration.",
    content: `In a moving interview, former Apollo astronaut Colonel James Mitchell reflects on his experiences during the Apollo program and the lasting impact of those historic missions. Mitchell, who flew on Apollo 15, shares personal memories and insights from one of humanity's greatest achievements.

"The Apollo program was more than just going to the Moon," says Mitchell. "It was about pushing the boundaries of what's possible and inspiring generations to dream big."

Mitchell discusses the technical challenges of the Apollo missions, the camaraderie among the astronauts, and the profound experience of seeing Earth from space. He also reflects on how the Apollo program paved the way for modern space exploration and the importance of continuing to push forward.

The interview includes never-before-shared anecdotes from Mitchell's training and mission experiences, as well as his thoughts on the future of space exploration and the upcoming Artemis missions.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: true,
    views_count: 290,
    category: 'NEWS',
    tags: ['APOLLO', 'INTERVIEW', 'HISTORY']
  },
  // Technology Articles
  {
    title: "REVOLUTIONARY NEW PROPULSION SYSTEM COULD CUT MARS TRAVEL TIME IN HALF",
    subtitle: "Nuclear thermal propulsion promises faster interplanetary travel",
    slug: "revolutionary-new-propulsion-system-could-cut-mars-travel-time-in-half",
    excerpt: "Scientists develop new nuclear thermal propulsion system that could reduce travel time to Mars from six months to just three months.",
    content: `A team of scientists and engineers has developed a revolutionary nuclear thermal propulsion system that could dramatically reduce travel time to Mars. The new system, which uses nuclear reactors to heat propellant, could cut the journey from six months to just three months.

The technology, developed through a collaboration between NASA and private industry, represents a major breakthrough in space propulsion. Traditional chemical rockets are limited by the amount of fuel they can carry, but nuclear thermal propulsion offers much higher efficiency.

"This could be a game-changer for human spaceflight," says Dr. Sarah Johnson, lead researcher on the project. "Faster travel times mean less exposure to space radiation and reduced mission costs."

The system has undergone extensive ground testing and is now being prepared for in-space testing. If successful, it could be used on future missions to Mars and beyond, opening up new possibilities for human exploration of the solar system.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: false,
    views_count: 890,
    category: 'TECHNOLOGY',
    tags: ['PROPULSION', 'MARS', 'NUCLEAR']
  },
  {
    title: "ARTIFICIAL INTELLIGENCE REVOLUTIONIZES SATELLITE OPERATIONS",
    subtitle: "AI systems enable autonomous satellite management",
    slug: "artificial-intelligence-revolutionizes-satellite-operations",
    excerpt: "New AI systems are enabling satellites to operate autonomously, making decisions without ground control intervention.",
    content: `Artificial intelligence is revolutionizing satellite operations, with new systems enabling satellites to make autonomous decisions and adapt to changing conditions without ground control intervention. These AI-powered satellites can optimize their orbits, manage power consumption, and even avoid collisions automatically.

The technology, developed by several companies and space agencies, uses machine learning algorithms trained on vast amounts of satellite telemetry data. The AI systems can predict equipment failures, optimize mission operations, and respond to emergencies faster than human operators.

"This represents a fundamental shift in how we operate satellites," says Dr. Michael Chen, chief technology officer at a leading satellite manufacturer. "AI enables capabilities that simply weren't possible with traditional ground-based control."

The systems are already being tested on several satellites in orbit, with promising results. Experts predict that within a decade, most satellites will operate with some degree of AI autonomy, reducing costs and enabling new types of missions.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 340,
    category: 'TECHNOLOGY',
    tags: ['AI', 'SATELLITES', 'AUTONOMOUS']
  },
  // Military Articles
  {
    title: "PENTAGON ANNOUNCES NEW SPACE-BASED DEFENSE INITIATIVE",
    subtitle: "Space Force to deploy new satellite constellation",
    slug: "pentagon-announces-new-space-based-defense-initiative",
    excerpt: "The Pentagon announces a major new space-based defense initiative, with the Space Force deploying a new constellation of satellites for national security.",
    content: `The Pentagon has announced a major new space-based defense initiative, with the U.S. Space Force set to deploy a new constellation of satellites designed to enhance national security capabilities. The initiative, part of a broader effort to strengthen America's position in space, includes advanced communication, surveillance, and defensive systems.

The new satellite constellation will provide enhanced capabilities for monitoring potential threats, secure communications, and space situational awareness. The systems are designed to be resilient and capable of operating in contested environments.

"Space is a critical domain for national security," says General John Smith, commander of U.S. Space Force. "This initiative ensures we maintain our technological edge and can protect our interests in space."

The deployment is scheduled to begin in 2025, with the full constellation expected to be operational by 2027. The initiative represents a significant investment in space-based defense capabilities and reflects the growing importance of space in national security strategy.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 560,
    category: 'MILITARY',
    tags: ['PENTAGON', 'SPACE FORCE', 'DEFENSE']
  },
  {
    title: "ALLIED NATIONS FORM SPACE DEFENSE COALITION",
    subtitle: "International partnership to protect space assets",
    slug: "allied-nations-form-space-defense-coalition",
    excerpt: "Multiple nations announce formation of a space defense coalition to protect critical space infrastructure and ensure free access to space.",
    content: `Several allied nations have announced the formation of a space defense coalition aimed at protecting critical space infrastructure and ensuring free access to space. The coalition, which includes the United States, United Kingdom, Canada, Australia, and several other nations, will coordinate efforts to monitor and protect space assets.

The coalition will share intelligence, coordinate responses to threats, and develop joint capabilities for space defense. The initiative comes as concerns grow about the security of space-based infrastructure, which is critical for communications, navigation, and other essential services.

"Space is a shared domain, and protecting it requires international cooperation," says a spokesperson for the coalition. "This partnership ensures we can work together to maintain the security and stability of space."

The coalition will establish joint operations centers, share satellite tracking data, and coordinate responses to potential threats. The initiative represents a significant step forward in international space security cooperation.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 410,
    category: 'MILITARY',
    tags: ['COALITION', 'DEFENSE', 'INTERNATIONAL']
  },
  // Finance Articles
  {
    title: "SPACE ECONOMY REACHES RECORD $500 BILLION",
    subtitle: "Commercial space industry sees unprecedented growth",
    slug: "space-economy-reaches-record-500-billion",
    excerpt: "The global space economy has reached a record $500 billion, driven by growth in commercial spaceflight, satellite services, and space technology.",
    content: `The global space economy has reached a record $500 billion, according to a new report from the Space Foundation. The milestone represents unprecedented growth in commercial spaceflight, satellite services, and space technology, with the industry expanding at a rate of over 10% annually.

The growth is driven by several factors, including increased investment in space startups, growing demand for satellite services, and the emergence of new commercial spaceflight capabilities. Companies like SpaceX, Blue Origin, and others are creating new markets and opportunities.

"This is a transformative moment for the space industry," says Dr. Lisa Park, an economist specializing in space commerce. "We're seeing the emergence of a truly commercial space economy that's creating jobs and driving innovation."

The report highlights several key growth areas, including satellite internet services, space tourism, in-space manufacturing, and asteroid mining. Experts predict the space economy could reach $1 trillion within the next decade as new technologies and markets emerge.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: false,
    views_count: 720,
    category: 'FINANCE',
    tags: ['ECONOMY', 'COMMERCIAL', 'INVESTMENT']
  },
  {
    title: "SPACEX VALUATION SOARS TO $180 BILLION",
    subtitle: "Company becomes most valuable private space company",
    slug: "spacex-valuation-soars-to-180-billion",
    excerpt: "SpaceX's valuation has reached $180 billion following a successful funding round, making it the most valuable private space company in history.",
    content: `SpaceX's valuation has soared to $180 billion following a successful funding round, making it the most valuable private space company in history. The company raised $2 billion in new funding from investors, who are betting on SpaceX's ambitious plans for Starship, Starlink, and future missions to Mars.

The valuation reflects SpaceX's dominant position in the commercial space industry, with the company holding contracts for NASA missions, commercial satellite launches, and its growing Starlink internet constellation. The company's reusable rocket technology has revolutionized the launch industry, dramatically reducing costs.

"SpaceX has fundamentally changed the economics of spaceflight," says investment analyst Mark Thompson. "Their technology and execution have created enormous value, and investors see tremendous potential for future growth."

The funding will support development of the Starship spacecraft, expansion of the Starlink constellation, and other ambitious projects. The company is also planning for an eventual initial public offering, though no timeline has been announced.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: true,
    is_interview: false,
    views_count: 1100,
    category: 'FINANCE',
    tags: ['SPACEX', 'VALUATION', 'INVESTMENT']
  },
  // More articles for variety
  {
    title: "JAMES WEBB TELESCOPE DISCOVERS EARTH-LIKE PLANET",
    subtitle: "Potentially habitable world found in nearby star system",
    slug: "james-webb-telescope-discovers-earth-like-planet",
    excerpt: "The James Webb Space Telescope has discovered a potentially habitable Earth-like planet in a nearby star system, raising hopes for finding life beyond our solar system.",
    content: `The James Webb Space Telescope has made a groundbreaking discovery: a potentially habitable Earth-like planet in a nearby star system. The planet, located just 40 light-years away, has conditions that could support life, including the right temperature and the presence of water vapor in its atmosphere.

"This is one of the most exciting discoveries in the history of exoplanet research," says Dr. Emily Rodriguez, lead scientist on the project. "We've found a world that could potentially harbor life, and it's relatively close to us."

The planet, designated TOI-700e, orbits within its star's habitable zone, where temperatures are suitable for liquid water. Initial observations suggest the planet has an atmosphere and may have oceans. Further observations are planned to search for biosignatures—chemical signs of life.

The discovery represents a major milestone for the James Webb Space Telescope, which was designed specifically to study exoplanets and search for signs of life. Scientists are now planning follow-up observations to learn more about this potentially habitable world.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: false,
    views_count: 950,
    category: 'IN SPACE',
    tags: ['JAMES WEBB', 'EXOPLANET', 'HABITABLE']
  },
  {
    title: "ROCKET LAB SUCCESSFULLY RECOVERS ELECTRON BOOSTER",
    subtitle: "Reusable rocket technology reaches new milestone",
    slug: "rocket-lab-successfully-recovers-electron-booster",
    excerpt: "Rocket Lab successfully recovers an Electron booster after launch, demonstrating the viability of reusable small rockets.",
    content: `Rocket Lab has successfully recovered an Electron booster after launch, marking a significant milestone in the development of reusable small rockets. The company used a helicopter to catch the booster as it descended under a parachute, demonstrating a novel approach to rocket recovery.

The successful recovery represents a major step forward for Rocket Lab's plans to make the Electron rocket reusable, which would dramatically reduce launch costs for small satellite missions. The company has been working on recovery technology for several years, and this successful catch demonstrates the viability of the approach.

"This is a game-changer for small satellite launches," says Rocket Lab CEO Peter Beck. "Reusability will make space more accessible and enable new types of missions."

The recovered booster will be inspected and refurbished for a future flight. Rocket Lab plans to continue refining the recovery process and eventually make Electron fully reusable, similar to SpaceX's approach with the Falcon 9 rocket.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 480,
    category: 'LAUNCH',
    tags: ['ROCKET LAB', 'REUSABLE', 'ELECTRON']
  },
  {
    title: "NASA PLANS PERMANENT LUNAR BASE BY 2030",
    subtitle: "Artemis program to establish sustainable presence on Moon",
    slug: "nasa-plans-permanent-lunar-base-by-2030",
    excerpt: "NASA announces plans to establish a permanent lunar base by 2030 as part of the Artemis program, creating a sustainable human presence on the Moon.",
    content: `NASA has announced ambitious plans to establish a permanent lunar base by 2030 as part of the Artemis program. The base, which will be located near the Moon's south pole, will serve as a hub for scientific research, resource extraction, and preparation for future missions to Mars.

The lunar base will be built in phases, starting with temporary habitats and gradually expanding to include permanent structures, power systems, and life support infrastructure. The base will support crews of up to four astronauts for extended stays on the lunar surface.

"This is the next step in human space exploration," says NASA Administrator Bill Nelson. "A permanent lunar base will enable sustained scientific research and serve as a stepping stone to Mars."

The base will take advantage of resources available on the Moon, including water ice that can be converted into rocket fuel. This will reduce the cost and complexity of missions by allowing fuel to be produced on the Moon rather than transported from Earth.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: true,
    is_interview: false,
    views_count: 830,
    category: 'NEWS',
    tags: ['NASA', 'MOON', 'ARTEMIS']
  },
  {
    title: "EUROPEAN ROCKET ARIANE 6 SET FOR MAIDEN FLIGHT",
    subtitle: "Next-generation launcher prepares for debut",
    slug: "european-rocket-ariane-6-set-for-maiden-flight",
    excerpt: "The European Space Agency's Ariane 6 rocket is set for its maiden flight, marking a new era in European space launch capabilities.",
    content: `The European Space Agency's Ariane 6 rocket is preparing for its maiden flight, scheduled for later this year. The next-generation launcher, which has been in development for over a decade, will replace the Ariane 5 and provide Europe with enhanced launch capabilities.

Ariane 6 features several improvements over its predecessor, including lower costs, increased flexibility, and the ability to launch multiple missions in quick succession. The rocket is available in two configurations: Ariane 62 with two boosters and Ariane 64 with four boosters.

"This is a major milestone for European spaceflight," says ESA Director General Josef Aschbacher. "Ariane 6 will ensure Europe maintains independent access to space and can compete in the global launch market."

The rocket has already secured several launch contracts, including missions for commercial satellite operators and European government agencies. The successful debut flight will mark the beginning of a new chapter in European space launch capabilities.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 370,
    category: 'LAUNCH',
    tags: ['ESA', 'ARIANE 6', 'EUROPE']
  },
  {
    title: "PRIVATE COMPANY PLANS FIRST COMMERCIAL SPACE STATION",
    subtitle: "Axiom Space to build commercial space station by 2028",
    slug: "private-company-plans-first-commercial-space-station",
    excerpt: "Axiom Space announces plans to build the world's first commercial space station, providing a new destination for research and space tourism.",
    content: `Axiom Space has announced plans to build the world's first commercial space station, with the first module scheduled to launch in 2028. The station will provide a new destination for scientific research, manufacturing, and space tourism, representing a major step forward in the commercialization of space.

The station will initially attach to the International Space Station before eventually becoming an independent facility. It will feature state-of-the-art laboratories, manufacturing facilities, and accommodations for up to eight people. The station is designed to be modular, allowing for expansion as demand grows.

"This represents the future of space stations," says Axiom Space CEO Michael Suffredini. "We're creating a commercial platform that will enable new types of research and business opportunities in space."

The company has already signed contracts with several customers, including research institutions and space tourism companies. The station will serve as a hub for in-space manufacturing, pharmaceutical research, and other commercial activities that take advantage of the unique environment of space.`,
    status: 'published',
    is_featured: false,
    is_trending: true,
    is_top_story: false,
    is_interview: false,
    views_count: 670,
    category: 'TECHNOLOGY',
    tags: ['AXIOM', 'SPACE STATION', 'COMMERCIAL']
  },
  {
    title: "ASTEROID MINING COMPANY SECURES $100M FUNDING",
    subtitle: "Planetary Resources raises capital for asteroid mining mission",
    slug: "asteroid-mining-company-secures-100m-funding",
    excerpt: "Planetary Resources has secured $100 million in funding to develop asteroid mining technology, bringing the prospect of space resource extraction closer to reality.",
    content: `Planetary Resources has secured $100 million in funding to develop asteroid mining technology, bringing the prospect of extracting valuable resources from asteroids closer to reality. The company plans to use the funding to develop spacecraft capable of identifying, reaching, and mining asteroids for precious metals and other materials.

Asteroid mining could provide access to vast quantities of rare metals like platinum, gold, and rare earth elements that are in high demand on Earth. Some asteroids are estimated to contain trillions of dollars worth of materials, making them potentially valuable targets for mining operations.

"This funding enables us to take the next steps toward making asteroid mining a reality," says Planetary Resources CEO Chris Lewicki. "We're building the technology and capabilities needed to access the resources of the solar system."

The company plans to launch its first prospecting missions within the next few years, with full-scale mining operations potentially beginning by the end of the decade. The technology could also support future space missions by providing resources for construction and fuel production in space.`,
    status: 'published',
    is_featured: false,
    is_trending: false,
    is_top_story: false,
    is_interview: false,
    views_count: 540,
    category: 'FINANCE',
    tags: ['ASTEROID MINING', 'INVESTMENT', 'RESOURCES']
  }
];

// Generate additional articles programmatically
function generateAdditionalArticles() {
  const additionalArticles = [];
  
  // Interview names and titles for variety (15 interviews)
  const interviewSubjects = [
    { name: 'JARED ISAACMAN', role: 'NASA ADMINISTRATOR', slug: 'jared-isaacman' },
    { name: 'CHRIS HADFIELD', role: 'FORMER ASTRONAUT', slug: 'chris-hadfield' },
    { name: 'ELON MUSK', role: 'SPACEX CEO', slug: 'elon-musk' },
    { name: 'JEFF BEZOS', role: 'BLUE ORIGIN FOUNDER', slug: 'jeff-bezos' },
    { name: 'BILL NELSON', role: 'NASA ADMINISTRATOR', slug: 'bill-nelson' },
    { name: 'PETER BECK', role: 'ROCKET LAB CEO', slug: 'peter-beck' },
    { name: 'TIM DODD', role: 'SPACE EDUCATOR', slug: 'tim-dodd' },
    { name: 'SCOTT KELLY', role: 'FORMER ASTRONAUT', slug: 'scott-kelly' },
    { name: 'MAE JEMISON', role: 'FORMER ASTRONAUT', slug: 'mae-jemison' },
    { name: 'BUZZ ALDRIN', role: 'APOLLO ASTRONAUT', slug: 'buzz-aldrin' },
    { name: 'SALLY RIDE', role: 'FORMER ASTRONAUT', slug: 'sally-ride' },
    { name: 'NEIL DEGRASSE TYSON', role: 'ASTROPHYSICIST', slug: 'neil-degrasse-tyson' },
    { name: 'KATHRYN SULLIVAN', role: 'FORMER ASTRONAUT', slug: 'kathryn-sullivan' },
    { name: 'JOHN YOUNG', role: 'FORMER ASTRONAUT', slug: 'john-young' },
    { name: 'VALENTINA TERESHKOVA', role: 'FORMER COSMONAUT', slug: 'valentina-tereshkova' }
  ];

  interviewSubjects.forEach((subject, idx) => {
    additionalArticles.push({
      title: subject.name,
      subtitle: `Exclusive interview with ${subject.role.toLowerCase()}`,
      slug: `interview-${subject.slug}-${Date.now()}-${idx}`,
      excerpt: `In an exclusive interview, ${subject.name} discusses their experiences and vision for the future of space exploration.`,
      content: `In this exclusive interview, ${subject.name} shares insights into their career and the future of space exploration. ${subject.name} discusses the challenges and opportunities facing the space industry today, and provides a unique perspective on what lies ahead for humanity in space. The interview covers a wide range of topics, from personal experiences to technical challenges and future missions.`,
      status: 'published',
      is_featured: false,
      is_trending: idx < 5,
      is_top_story: false,
      is_interview: true,
      views_count: 200 + Math.floor(Math.random() * 500),
      category: 'NEWS',
      tags: ['INTERVIEW', subject.name.split(' ')[0].toUpperCase()]
    });
  });

  // Generate more articles for each category (15 each)
  const categories = {
    'LAUNCH': [
      'FALCON HEAVY LAUNCHES MARS SAMPLE RETURN MISSION',
      'DELTA IV HEAVY COMPLETES FINAL FLIGHT',
      'SOYUZ LAUNCHES NEW ISS CREW',
      'FALCON 9 BREAKS REUSABILITY RECORD',
      'NEW SHEPARD COMPLETES 25TH TOURISM FLIGHT',
      'LONG MARCH 5 LAUNCHES LUNAR PROBE',
      'ATLAS V LAUNCHES WEATHER SATELLITE',
      'FALCON 9 DEPLOYS STARLINK CONSTELLATION',
      'ELECTRON LAUNCHES CUBESAT CONSTELLATION',
      'ARIANE 5 LAUNCHES COMMUNICATIONS SATELLITE',
      'FALCON HEAVY LAUNCHES DEEP SPACE PROBE',
      'SOYUZ LAUNCHES CARGO MISSION TO ISS',
      'NEW GLENN PREPARES FOR MAIDEN FLIGHT',
      'FALCON 9 LAUNCHES COMMERCIAL SATELLITE',
      'LONG MARCH 7 LAUNCHES CARGO SPACECRAFT'
    ],
    'IN SPACE': [
      'ISS COMPLETES 25 YEARS IN ORBIT',
      'HUBBLE TELESCOPE DISCOVERS NEW GALAXY',
      'MARS ROVER FINDS EVIDENCE OF WATER',
      'JAMES WEBB REVEALS EARLY UNIVERSE',
      'ISS ASTRONAUTS CONDUCT SPACEWALK',
      'CHANDRA OBSERVES BLACK HOLE MERGER',
      'CURIOSITY ROVER CLIMBS MOUNT SHARP',
      'PERSEVERANCE COLLECTS MARS SAMPLES',
      'ISS RECEIVES NEW SCIENCE MODULE',
      'HUBBLE CAPTURES NEBULA FORMATION',
      'JAMES WEBB STUDIES EXOPLANET ATMOSPHERE',
      'MARS HELICOPTER COMPLETES 50 FLIGHTS',
      'ISS CONDUCTS BIOLOGICAL EXPERIMENTS',
      'HUBBLE OBSERVES STAR FORMATION',
      'JAMES WEBB MAPS DISTANT GALAXY'
    ],
    'TECHNOLOGY': [
      'QUANTUM COMPUTING REVOLUTIONIZES SPACE NAVIGATION',
      '3D PRINTING ENABLES IN-SPACE MANUFACTURING',
      'ION PROPULSION SYSTEM BREAKS EFFICIENCY RECORD',
      'SELF-HEALING MATERIALS FOR SPACECRAFT',
      'ADVANCED AI CONTROLS SATELLITE CONSTELLATION',
      'NANOTECHNOLOGY IMPROVES SPACE SUITS',
      'QUANTUM COMMUNICATION FOR DEEP SPACE',
      'BIOENGINEERING FOR MARS COLONIZATION',
      'ADVANCED ROBOTICS FOR SPACE EXPLORATION',
      'MACHINE LEARNING OPTIMIZES ORBITAL MECHANICS',
      'QUANTUM SENSORS FOR PRECISION NAVIGATION',
      'ADVANCED MATERIALS FOR ROCKET ENGINES',
      'AUTONOMOUS SYSTEMS FOR SPACE STATIONS',
      'QUANTUM ENCRYPTION FOR SPACE COMMUNICATIONS',
      'ADVANCED POWER SYSTEMS FOR DEEP SPACE'
    ],
    'MILITARY': [
      'SPACE FORCE DEPLOYS NEW SATELLITE CONSTELLATION',
      'PENTAGON ANNOUNCES SPACE DEFENSE STRATEGY',
      'ALLIED NATIONS CONDUCT SPACE SECURITY EXERCISE',
      'SPACE FORCE ESTABLISHES NEW COMMAND',
      'PENTAGON INVESTIGATES SPACE THREATS',
      'SPACE FORCE TRAINS NEW OPERATORS',
      'ALLIED COALITION PROTECTS SPACE ASSETS',
      'SPACE FORCE DEVELOPS COUNTER-SATELLITE CAPABILITIES',
      'PENTAGON FUNDS SPACE DEFENSE RESEARCH',
      'SPACE FORCE EXPANDS OPERATIONS',
      'ALLIED NATIONS SHARE SPACE INTELLIGENCE',
      'SPACE FORCE TESTS NEW SYSTEMS',
      'PENTAGON ANNOUNCES SPACE POLICY',
      'SPACE FORCE CONDUCTS JOINT EXERCISE',
      'ALLIED COALITION STRENGTHENS SPACE SECURITY'
    ],
    'FINANCE': [
      'SPACE STARTUP RAISES $50M SERIES A',
      'COMMERCIAL SPACE MARKET HITS $400B',
      'SPACEX SECURES $2B FUNDING ROUND',
      'BLUE ORIGIN VALUATION REACHES $10B',
      'SPACE TOURISM MARKET GROWS 200%',
      'SATELLITE INTERNET COMPANY GOES PUBLIC',
      'SPACE MINING STARTUP SECURES FUNDING',
      'COMMERCIAL SPACE STATION RAISES CAPITAL',
      'SPACE LOGISTICS COMPANY VALUED AT $5B',
      'SATELLITE MANUFACTURER SECURES CONTRACTS',
      'SPACE DATA COMPANY RAISES SERIES B',
      'COMMERCIAL LAUNCH PROVIDER EXPANDS',
      'SPACE INSURANCE MARKET GROWS',
      'SATELLITE SERVICES COMPANY MERGES',
      'SPACE TECHNOLOGY STARTUP ACQUIRED'
    ],
    'NEWS': [
      'NASA ANNOUNCES NEW EXPLORATION INITIATIVE',
      'INTERNATIONAL SPACE COOPERATION EXPANDS',
      'SPACE EDUCATION PROGRAM LAUNCHES',
      'NEW SPACE MUSEUM OPENS',
      'SPACE CONFERENCE BRINGS TOGETHER EXPERTS',
      'STUDENT SPACE COMPETITION ANNOUNCED',
      'SPACE DOCUMENTARY WINS AWARD',
      'NEW SPACE BOOK RELEASED',
      'SPACE ART EXHIBITION OPENS',
      'SPACE PODCAST REACHES MILESTONE',
      'SPACE EDUCATION INITIATIVE EXPANDS',
      'NEW SPACE RESEARCH CENTER OPENS',
      'SPACE COMPETITION ANNOUNCES WINNERS',
      'SPACE FILM FESTIVAL LAUNCHES',
      'SPACE OUTREACH PROGRAM EXPANDS'
    ]
  };

  Object.keys(categories).forEach(category => {
    categories[category].forEach((title, idx) => {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      additionalArticles.push({
        title,
        subtitle: `New development in ${category.toLowerCase()} category`,
        slug: `${slug}-${Date.now()}-${category}-${idx}`,
        excerpt: `${title} represents an important development in the space industry.`,
        content: `${title} represents a significant development in the space industry. This news highlights the continued growth and innovation in space exploration and commercial spaceflight. The development reflects the dynamic nature of the space industry and its potential for future growth.`,
        status: 'published',
        is_featured: idx === 0 && category === 'LAUNCH',
        is_trending: idx < 5,
        is_top_story: idx < 8,
        is_interview: false,
        views_count: 200 + Math.floor(Math.random() * 1000),
        category,
        tags: [category, 'SPACE']
      });
    });
  });

  return additionalArticles;
}

// Merge generated articles with existing ones
const allArticles = [...dummyArticles, ...generateAdditionalArticles()];

async function seedArticles() {
  try {
    console.log('Starting to seed news articles...');

    // Get categories
    const { rows: categories } = await pool.query('SELECT id, name, slug FROM news_categories');
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toUpperCase()] = cat.id;
      categoryMap[cat.slug] = cat.id;
    });

    // Get authors
    const { rows: authors } = await pool.query('SELECT id, full_name FROM authors LIMIT 10');
    if (authors.length === 0) {
      console.log('No authors found. Creating a default author...');
      const { rows: newAuthor } = await pool.query(
        'INSERT INTO authors (first_name, last_name, full_name, email, title) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['John', 'Spacewriter', 'John Spacewriter', 'john@tlp.com', 'SPACE NEWS JOURNALIST']
      );
      authors.push(newAuthor[0]);
    }

    // Get or create tags
    const tagMap = {};
    const allTags = new Set();
    allArticles.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => allTags.add(tag));
      }
    });

    for (const tagName of allTags) {
      const { rows: existingTag } = await pool.query('SELECT id FROM article_tags WHERE name = $1 OR slug = $2', [tagName, tagName.toLowerCase()]);
      if (existingTag.length === 0) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');
        const { rows: newTag } = await pool.query(
          'INSERT INTO article_tags (name, slug) VALUES ($1, $2) RETURNING id',
          [tagName, slug]
        );
        tagMap[tagName] = newTag[0].id;
      } else {
        tagMap[tagName] = existingTag[0].id;
      }
    }

    let inserted = 0;
    let skipped = 0;

    for (const article of allArticles) {
      // Check if article already exists
      const { rows: existing } = await pool.query('SELECT id FROM news_articles WHERE slug = $1', [article.slug]);
      if (existing.length > 0) {
        console.log(`Skipping ${article.slug} - already exists`);
        skipped++;
        continue;
      }

      // Get category ID
      const categoryId = categoryMap[article.category] || categoryMap[article.category.toLowerCase()] || null;

      // Get random author
      const author = authors[Math.floor(Math.random() * authors.length)];

      // Set published date (recent dates for variety)
      const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - daysAgo);

      // Insert article
      const { rows: newArticle } = await pool.query(`
        INSERT INTO news_articles (
          title, subtitle, slug, author_id, category_id,
          content, excerpt, status, published_at,
          is_featured, is_trending, is_top_story, is_interview, views_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        article.title,
        article.subtitle,
        article.slug,
        author.id,
        categoryId,
        article.content,
        article.excerpt,
        article.status,
        publishedAt,
        article.is_featured,
        article.is_trending,
        article.is_top_story,
        article.is_interview,
        article.views_count
      ]);

      // Add tags
      if (article.tags && article.tags.length > 0) {
        for (const tagName of article.tags) {
          const tagId = tagMap[tagName];
          if (tagId) {
            await pool.query(
              'INSERT INTO article_tags_articles (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [newArticle[0].id, tagId]
            );
          }
        }
      }

      inserted++;
      console.log(`✓ Inserted: ${article.title}`);
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${inserted} articles`);
    console.log(`   Skipped: ${skipped} articles (already exist)`);
    console.log(`   Total: ${allArticles.length} articles processed`);

  } catch (error) {
    console.error('Error seeding articles:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedArticles()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

