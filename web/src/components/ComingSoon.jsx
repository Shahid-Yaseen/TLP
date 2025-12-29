import { useState, useEffect } from 'react';

const ComingSoon = () => {
  const [currentSaying, setCurrentSaying] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [stars, setStars] = useState([]);

  const sayings = [
    'Systems Still Powering Up',
    'Assembly in Progress — Please Stand Clear',
    'Payload Integration Ongoing',
    'This Module Is Still in the Clean Room',
    'Hold, Hold, Hold — Greatness Incoming',
    'This Page Missed the Launch Window',
    'In Beta — Check Back Soon'
  ];

  useEffect(() => {
    // Randomly select a saying on component mount
    const randomIndex = Math.floor(Math.random() * sayings.length);
    setCurrentSaying(sayings[randomIndex]);
    
    // Generate stars for space background
    const generatedStars = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
    setStars(generatedStars);
    
    // Trigger logo animation
    setIsVisible(true);
    
    // Trigger text animation after logo
    setTimeout(() => {
      setTextVisible(true);
    }, 600);
  }, []);

  return (
    <>
      <style>{`
        @keyframes logoEnter {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          60% {
            transform: scale(1.1) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes logoSpin {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(139, 26, 26, 0.5), 0 0 60px rgba(139, 26, 26, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(139, 26, 26, 0.7), 0 0 80px rgba(139, 26, 26, 0.5);
          }
        }

        @keyframes ringPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes textEnter {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.4;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes astronautFloat {
          0% {
            transform: translate(0vw, 0vh) rotate(0deg) scale(1);
          }
          12.5% {
            transform: translate(15vw, -10vh) rotate(45deg) scale(0.9);
          }
          25% {
            transform: translate(30vw, 5vh) rotate(90deg) scale(1.1);
          }
          37.5% {
            transform: translate(50vw, -15vh) rotate(135deg) scale(0.95);
          }
          50% {
            transform: translate(70vw, 10vh) rotate(180deg) scale(1);
          }
          62.5% {
            transform: translate(85vw, -5vh) rotate(225deg) scale(0.9);
          }
          75% {
            transform: translate(90vw, 20vh) rotate(270deg) scale(1.05);
          }
          87.5% {
            transform: translate(60vw, 40vh) rotate(315deg) scale(0.95);
          }
          100% {
            transform: translate(0vw, 0vh) rotate(360deg) scale(1);
          }
        }

        @keyframes astronautRotate {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(90deg);
          }
          50% {
            transform: rotate(180deg);
          }
          75% {
            transform: rotate(270deg);
          }
        }

        @keyframes astronautDrift {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          20% {
            transform: translate(20vw, -15vh) rotate(72deg);
          }
          40% {
            transform: translate(-10vw, -25vh) rotate(144deg);
          }
          60% {
            transform: translate(-25vw, 10vh) rotate(216deg);
          }
          80% {
            transform: translate(15vw, 20vh) rotate(288deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }

        @keyframes spaceDrift {
          0% {
            transform: translateX(0) translateY(0);
          }
          33% {
            transform: translateX(50px) translateY(-30px);
          }
          66% {
            transform: translateX(-30px) translateY(50px);
          }
          100% {
            transform: translateX(0) translateY(0);
          }
        }

        .animate-logo-enter {
          animation: logoEnter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-logo-spin {
          animation: logoSpin 4s ease-in-out infinite;
        }

        .animate-ring-pulse {
          animation: ringPulse 2s ease-in-out infinite;
        }

        .animate-text-enter {
          animation: textEnter 1s ease-out forwards;
        }

        .animate-pulse-glow {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .animate-astronaut-float {
          animation: astronautFloat 40s ease-in-out infinite;
        }

        .animate-astronaut-rotate {
          animation: astronautRotate 20s linear infinite;
        }

        .animate-astronaut-drift {
          animation: astronautDrift 35s ease-in-out infinite;
        }

        .animate-space-drift {
          animation: spaceDrift 25s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-black via-purple-900/20 to-black text-white flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#000000', zIndex: 1 }}>
        {/* Space background with stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
              }}
            />
          ))}
          
          {/* Distant stars layer */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`distant-${i}`}
              className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Astronaut - Moving across entire page */}
        <div className="absolute inset-0 overflow-visible pointer-events-none z-5">
          <div className="absolute top-0 left-0 animate-astronaut-float" style={{ willChange: 'transform' }}>
            <div className="relative">
              {/* Astronaut SVG/Icon */}
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                className="drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                style={{ filter: 'drop-shadow(0 0 30px rgba(135, 206, 250, 0.6))' }}
              >
                {/* Astronaut Helmet */}
                <circle
                  cx="50"
                  cy="35"
                  r="25"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* Visor reflection */}
                <ellipse
                  cx="50"
                  cy="35"
                  rx="20"
                  ry="15"
                  fill="rgba(135, 206, 250, 0.3)"
                />
                {/* Body */}
                <rect
                  x="40"
                  y="55"
                  width="20"
                  height="30"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* Arms */}
                <line
                  x1="30"
                  y1="60"
                  x2="20"
                  y2="75"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                <line
                  x1="70"
                  y1="60"
                  x2="80"
                  y2="75"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* Legs */}
                <line
                  x1="45"
                  y1="85"
                  x2="40"
                  y2="100"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                <line
                  x1="55"
                  y1="85"
                  x2="60"
                  y2="100"
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
                {/* Oxygen tank */}
                <rect
                  x="65"
                  y="50"
                  width="8"
                  height="20"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.7"
                />
                {/* Glow effect */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="rgba(135, 206, 250, 0.3)"
                  strokeWidth="1"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>
          
          {/* Second Astronaut - Different path */}
          <div className="absolute bottom-0 right-0 animate-astronaut-drift" style={{ willChange: 'transform', animationDelay: '10s' }}>
            <div className="relative opacity-70">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
              >
                <circle
                  cx="50"
                  cy="35"
                  r="20"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <ellipse
                  cx="50"
                  cy="35"
                  rx="15"
                  ry="12"
                  fill="rgba(135, 206, 250, 0.2)"
                />
                <rect
                  x="42"
                  y="55"
                  width="16"
                  height="25"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <line
                  x1="32"
                  y1="60"
                  x2="25"
                  y2="72"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <line
                  x1="68"
                  y1="60"
                  x2="75"
                  y2="72"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <line
                  x1="47"
                  y1="80"
                  x2="43"
                  y2="92"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <line
                  x1="53"
                  y1="80"
                  x2="57"
                  y2="92"
                  stroke="white"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              </svg>
            </div>
          </div>
          
          {/* Additional floating space elements */}
          <div className="absolute top-1/3 left-1/5 animate-space-drift opacity-30">
            <div className="w-2 h-2 bg-blue-400 rounded-full blur-sm" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-space-drift opacity-20" style={{ animationDelay: '5s' }}>
            <div className="w-3 h-3 bg-purple-400 rounded-full blur-sm" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-8 relative z-10">
          {/* Logo with animations */}
          <div className="mb-12">
            <div 
              className={`w-24 h-24 md:w-32 md:h-32 bg-black flex items-center justify-center overflow-hidden border-2 border-[#8B1A1A] relative ${
                isVisible ? 'animate-logo-enter animate-pulse-glow' : 'opacity-0 scale-0'
              }`}
            >
              <img 
                src="/TLP Helmet.png" 
                alt="TLP Logo" 
                className="w-20 h-20 md:w-28 md:h-28 object-contain animate-logo-spin"
              />
              {/* Glowing ring effect */}
              <div 
                className="absolute inset-0 border-2 border-[#8B1A1A] rounded-full animate-ring-pulse"
                style={{
                  boxShadow: '0 0 20px rgba(139, 26, 26, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Saying with typewriter/fade effect */}
          <div className="text-center max-w-2xl">
            <h2 
              className={`text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide text-[#8B1A1A] mb-4 ${
                textVisible ? 'animate-text-enter' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                fontFamily: 'Nasalization, sans-serif',
                textShadow: '0 0 20px rgba(139, 26, 26, 0.5)',
              }}
            >
              {currentSaying || 'Systems Still Powering Up'}
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default ComingSoon;

