import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getOrbitColor } from '../../utils/orbitCalculations';

/**
 * Direct Three.js implementation for Earth Orbit Navigator
 * This version doesn't use React Three Fiber to avoid React 19 compatibility issues
 */
export default function OrbitSceneDirect({ 
  selectedOrbits = [], 
  orbitPaths = {},
  earthTextureUrl = null,
  showStars = true 
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [textureLoaded, setTextureLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    
    // Clean up any existing renderer/dom elements first
    if (rendererRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
      mountRef.current.removeChild(rendererRef.current.domElement);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 30);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 100;
    // Enable touch controls for mobile
    controls.enablePan = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // Stars
    if (showStars) {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
      const starsVertices = [];
      
      for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 600;
        starsVertices.push(x, y, z);
      }
      
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
    }

    // Earth - create only one
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4d80 });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.userData.isEarth = true; // Mark as Earth for identification
    scene.add(earth);

    // Load Earth texture
    if (earthTextureUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        earthTextureUrl,
        (texture) => {
          earthMaterial.map = texture;
          earthMaterial.needsUpdate = true;
          setTextureLoaded(true);
        },
        undefined,
        (error) => {
          console.warn('Failed to load Earth texture:', error);
        }
      );
    }

    // Store references for cleanup and updates
    const earthMeshRef = { current: earth };
    
    // Store scene reference globally for orbit line updates
    sceneRef.current = scene;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Rotate Earth
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.001;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Remove orbit lines (they're managed by separate useEffect)
      const linesToRemove = [];
      scene.children.forEach(child => {
        if (child instanceof THREE.Line && child.userData.isOrbitLine) {
          linesToRemove.push(child);
        }
      });
      linesToRemove.forEach(line => {
        scene.remove(line);
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
      });
      
      // Remove Earth (check by userData marker)
      const earthToRemove = [];
      scene.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.userData.isEarth) {
          earthToRemove.push(child);
        }
      });
      earthToRemove.forEach(earthMesh => {
        scene.remove(earthMesh);
        if (earthMesh.geometry) earthMesh.geometry.dispose();
        if (earthMesh.material) {
          if (earthMesh.material.map) {
            earthMesh.material.map.dispose();
          }
          earthMesh.material.dispose();
        }
      });
      
      // Remove stars
      scene.children.forEach(child => {
        if (child instanceof THREE.Points) {
          scene.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      });
      
      // Remove lights
      scene.children.forEach(child => {
        if (child instanceof THREE.Light) {
          scene.remove(child);
        }
      });
      
      controls.dispose();
      renderer.dispose();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [earthTextureUrl, showStars]);

  // Track orbit lines separately
  const orbitLinesRef = useRef([]);

  // Update orbit paths when selectedOrbits or orbitPaths change
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Cleanup function to remove all orbit lines
    const cleanupOrbitLines = () => {
      // Remove all existing orbit lines from scene
      const linesToRemove = [];
      scene.children.forEach(child => {
        if (child instanceof THREE.Line && child.userData.isOrbitLine) {
          linesToRemove.push(child);
        }
      });
      
      linesToRemove.forEach(line => {
        scene.remove(line);
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
      });
      
      // Also clean up ref
      orbitLinesRef.current.forEach(line => {
        if (scene.children.includes(line)) {
          scene.remove(line);
        }
        if (line.geometry) line.geometry.dispose();
        if (line.material) line.material.dispose();
      });
      orbitLinesRef.current = [];
    };

    // Clean up existing lines first
    cleanupOrbitLines();

    // Add new orbit lines
    Object.entries(orbitPaths).forEach(([orbitCode, pathData]) => {
      const isVisible = selectedOrbits.length === 0 || selectedOrbits.includes(orbitCode);
      
      if (!isVisible || !pathData.points || pathData.points.length === 0) {
        return;
      }

      const color = pathData.color || getOrbitColor(orbitCode);
      const points = pathData.points;
      
      // Create closed loop
      const closedPoints = [...points, points[0]];
      const positions = new Float32Array(closedPoints.length * 3);
      closedPoints.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8
      });

      const line = new THREE.Line(geometry, material);
      // Mark as orbit line for easy identification
      line.userData.isOrbitLine = true;
      line.userData.orbitCode = orbitCode;
      
      scene.add(line);
      orbitLinesRef.current.push(line);
    });

    return () => {
      // Cleanup orbit lines on unmount or dependency change
      cleanupOrbitLines();
    };
  }, [selectedOrbits, orbitPaths]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

