/**
 * Advanced Orbit Scene Component
 * Renders Earth with thousands of satellite points using instanced rendering
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getSatelliteColor } from '../../utils/satelliteCalculations';

export default function AdvancedOrbitScene({
  satellites = [],
  selectedSatellite = null,
  onSatelliteClick = null,
  autoRotate = false,
  earthTextureUrl = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const satellitesGroupRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;

    // Cleanup
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

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.01,
      10000
    );
    camera.position.set(0, 0, 50);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 1000;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
    const starsVertices = [];
    
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(6.371, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4d80 });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.userData.isEarth = true;
    scene.add(earth);

    // Load Earth texture
    if (earthTextureUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        earthTextureUrl,
        (texture) => {
          earthMaterial.map = texture;
          earthMaterial.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.warn('Failed to load Earth texture:', error);
        }
      );
    }

    // Satellites group
    const satellitesGroup = new THREE.Group();
    satellitesGroup.userData.isSatellitesGroup = true;
    scene.add(satellitesGroup);
    satellitesGroupRef.current = satellitesGroup;

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // Mouse move handler
    const handleMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Click handler
    const handleClick = (event) => {
      if (!onSatelliteClick) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(satellitesGroup.children, false);

      if (intersects.length > 0) {
        const clickedSatellite = intersects[0].object.userData.satellite;
        if (clickedSatellite) {
          onSatelliteClick(clickedSatellite);
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleClick);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Cleanup scene
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(mat => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [earthTextureUrl, onSatelliteClick]);

  // Update autoRotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Update satellites
  useEffect(() => {
    if (!sceneRef.current || !satellitesGroupRef.current) return;

    const satellitesGroup = satellitesGroupRef.current;

    // Remove existing satellites
    while (satellitesGroup.children.length > 0) {
      const child = satellitesGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      satellitesGroup.remove(child);
    }

    // Create satellite points
    satellites.forEach((satellite, index) => {
      if (!satellite.position || !satellite.position.x) return;

      const isSelected = selectedSatellite && selectedSatellite.norad_id === satellite.norad_id;
      const color = isSelected ? '#4A90E2' : getSatelliteColor(satellite);

      const geometry = new THREE.SphereGeometry(0.03, 8, 8);
      const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: isSelected ? 1.0 : 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(satellite.position.x, satellite.position.y, satellite.position.z);
      mesh.userData.satellite = satellite;
      mesh.userData.isSatellite = true;

      satellitesGroup.add(mesh);
    });
  }, [satellites, selectedSatellite]);

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

