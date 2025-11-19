import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { calculateOrbitPath, getOrbitColor } from '../../utils/orbitCalculations';

/**
 * 3D Earth Component
 */
function Earth({ textureUrl }) {
  const earthRef = useRef();
  const [texture, setTexture] = useState(null);
  
  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        textureUrl,
        (loadedTexture) => {
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.warn('Failed to load Earth texture:', error);
          setTexture(null);
        }
      );
    }
  }, [textureUrl]);
  
  useFrame(() => {
    if (earthRef.current) {
      // Slow rotation of Earth
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[6.371, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        color={texture ? undefined : '#1a4d80'}
      />
    </mesh>
  );
}

/**
 * Orbit Path Component
 */
function OrbitPath({ points, color, visible = true }) {
  const orbitRef = useRef();
  
  const geometry = useMemo(() => {
    if (!points || points.length === 0) return null;
    
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, p.y, p.z)),
      true // closed curve
    );
    
    const tubeGeometry = new THREE.TubeGeometry(curve, points.length, 0.05, 8, true);
    return tubeGeometry;
  }, [points]);

  if (!geometry || !visible) return null;

  return (
    <mesh ref={orbitRef} geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
}

/**
 * Orbit Line Component (simpler line version)
 */
function OrbitLine({ points, color, visible = true }) {
  const lineRef = useRef();
  
  const geometry = useMemo(() => {
    if (!points || points.length === 0) return null;
    
    // Create closed loop by adding first point at the end
    const closedPoints = [...points, points[0]];
    const positions = new Float32Array(closedPoints.length * 3);
    closedPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, [points]);

  if (!geometry || !visible) return null;

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.8} />
    </line>
  );
}

/**
 * Main Orbit Scene Component
 */
export default function OrbitScene({ 
  selectedOrbits = [], 
  orbitPaths = {},
  earthTextureUrl = null,
  showStars = true 
}) {
  const sceneRef = useRef();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Stars background */}
      {showStars && <Stars radius={300} depth={50} count={5000} factor={4} fade speed={1} />}
      
      {/* Earth */}
      <Earth textureUrl={earthTextureUrl} />
      
      {/* Orbit Paths */}
      {Object.entries(orbitPaths).map(([orbitCode, pathData]) => {
        const isVisible = selectedOrbits.length === 0 || selectedOrbits.includes(orbitCode);
        const color = pathData.color || getOrbitColor(orbitCode);
        
        return (
          <OrbitLine
            key={orbitCode}
            points={pathData.points}
            color={color}
            visible={isVisible}
          />
        );
      })}
      
      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={15}
        maxDistance={100}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
      
      {/* Helper text (optional) */}
      <Text
        position={[0, -10, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Earth Orbit Navigator
      </Text>
    </>
  );
}

