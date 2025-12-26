
import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { AppState, HandLandmark } from '../types';

interface SceneProps {
  appState: AppState;
  onStateChange: React.Dispatch<React.SetStateAction<AppState>>;
  selectedDecoration: string;
}

export const Scene: React.FC<SceneProps> = ({ appState, onStateChange, selectedDecoration }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    halo: THREE.Mesh;
    star: THREE.Group;
    composer: EffectComposer;
    decorations: THREE.Group;
    gifts: THREE.Group;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    treeFormed: boolean;
  } | null>(null);

  const PARTICLE_COUNT = 8000;
  const TREE_HEIGHT = 10;
  const TREE_RADIUS = 4;

  // --- 3D DECORATION BUILDERS ---

  const create3DStar = useCallback(() => {
    const group = new THREE.Group();
    const starMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, side: THREE.DoubleSide });
    const starShape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.35;
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      if (i === 0) starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    
    const starGeom = new THREE.ShapeGeometry(starShape);
    const starMesh = new THREE.Mesh(starGeom, starMat);
    group.add(starMesh);

    // Add a glowing core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
    group.add(core);

    return group;
  }, []);

  const create3DWestie = useCallback(() => {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), whiteMat);
    body.scale.set(1, 0.9, 1.2);
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 20), whiteMat);
    head.position.set(0, 0.22, 0.22);
    group.add(head);

    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), whiteMat);
    earL.position.set(-0.16, 0.45, 0.22);
    earL.rotation.z = 0.15;
    group.add(earL);

    const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), whiteMat);
    earR.position.set(0.16, 0.45, 0.22);
    earR.rotation.z = -0.15;
    group.add(earR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), blackMat);
    eyeL.position.set(-0.09, 0.28, 0.43);
    group.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), blackMat);
    eyeR.position.set(0.09, 0.28, 0.43);
    group.add(eyeR);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), blackMat);
    nose.position.set(0, 0.19, 0.45);
    group.add(nose);

    group.scale.setScalar(0.7); // Scaled down globally
    return group;
  }, []);

  const create3DBell = useCallback(() => {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 0.45, 24), goldMat);
    group.add(body);

    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
    bottom.position.y = -0.22;
    group.add(bottom);

    const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    clapper.position.y = -0.25;
    group.add(clapper);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 12, 24), goldMat);
    ring.position.y = 0.28;
    group.add(ring);

    group.scale.setScalar(0.65);
    return group;
  }, []);

  const create3DOrnament = useCallback(() => {
    const group = new THREE.Group();
    const colors = [0xEE0000, 0x0088EE, 0x00AA44, 0xFFCC00, 0xFF44AA];
    const mainColor = colors[Math.floor(Math.random() * colors.length)];
    const detailColor = 0xFFFFFF;

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshBasicMaterial({ color: mainColor }));
    group.add(sphere);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.06, 32), new THREE.MeshBasicMaterial({ color: detailColor }));
    group.add(band);

    for (let i = 0; i < 6; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.57), new THREE.MeshBasicMaterial({ color: detailColor }));
        stripe.rotation.y = (Math.PI / 3) * i;
        group.add(stripe);
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), new THREE.MeshBasicMaterial({ color: 0xCCAA00 }));
    cap.position.y = 0.3;
    group.add(cap);

    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 16), new THREE.MeshBasicMaterial({ color: 0xCCAA00 }));
    loop.position.y = 0.4;
    group.add(loop);

    group.scale.setScalar(0.7);
    return group;
  }, []);

  const create3DSnowflake = useCallback(() => {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xF0FDFF });
    
    for (let i = 0; i < 6; i++) {
      const armGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.03), mat);
      arm.position.x = 0.35;
      armGroup.add(arm);

      for (let j = 1; j <= 2; j++) {
        const vPos = 0.2 * j + 0.1;
        const v1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), mat);
        v1.position.set(vPos, 0.06, 0);
        v1.rotation.z = Math.PI / 4;
        armGroup.add(v1);

        const v2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), mat);
        v2.position.set(vPos, -0.06, 0);
        v2.rotation.z = -Math.PI / 4;
        armGroup.add(v2);
      }

      armGroup.rotation.z = (Math.PI / 3) * i;
      group.add(armGroup);
    }
    group.scale.setScalar(0.6);
    return group;
  }, []);

  const create3DCandyCane = useCallback(() => {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16), whiteMat);
    group.add(stem);

    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 12, 24, Math.PI), whiteMat);
    hook.position.set(0.15, 0.35, 0);
    group.add(hook);

    for (let i = 0; i < 7; i++) {
        const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.06, 16), redMat);
        stripe.position.y = -0.3 + i * 0.12;
        stripe.rotation.z = 0.3;
        group.add(stripe);
    }

    group.scale.setScalar(0.65);
    return group;
  }, []);

  const createGift = (color: number, ribbonColor: number, size: number, ribbonThickness: number) => {
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color }));
    group.add(box);

    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(size + 0.01, size * ribbonThickness, size + 0.01), new THREE.MeshBasicMaterial({ color: ribbonColor }));
    group.add(ribbonH);

    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(size * ribbonThickness, size + 0.01, size + 0.01), new THREE.MeshBasicMaterial({ color: ribbonColor }));
    group.add(ribbonV);

    const bowPart1 = new THREE.Mesh(new THREE.TorusGeometry(size * 0.18, size * (ribbonThickness * 0.4), 8, 16), new THREE.MeshBasicMaterial({ color: ribbonColor }));
    bowPart1.position.y = size * 0.5;
    bowPart1.rotation.x = Math.PI / 2;
    group.add(bowPart1);

    const bowPart2 = bowPart1.clone();
    bowPart2.rotation.y = Math.PI / 2;
    group.add(bowPart2);

    return group;
  };

  const addGifts = (targetGroup: THREE.Group) => {
    const colors = [0xCC0000, 0x00AA55, 0x0066CC, 0xDDCC00, 0x9933CC, 0xFF66AA, 0xFFFFFF, 0x333333];
    const ribbonColors = [0xFFD700, 0xFFFFFF, 0xFF0000, 0x00CCFF, 0xCC00AA];

    for (let i = 0; i < 90; i++) {
        const size = 0.25 + Math.random() * 0.8;
        const ribbonThickness = 0.15 + Math.random() * 0.25; // Varied ribbon thickness
        const gift = createGift(
            colors[i % colors.length],
            ribbonColors[Math.floor(Math.random() * ribbonColors.length)],
            size,
            ribbonThickness
        );
        
        const angle = Math.random() * Math.PI * 2;
        const dist = 1.0 + Math.random() * 4.5;
        const heightStackFactor = Math.max(0, 1 - (dist / 5)) * 2.5;
        const heightOffset = -5 + (Math.random() * heightStackFactor);
        
        gift.position.set(Math.cos(angle) * dist, heightOffset, Math.sin(angle) * dist);
        gift.rotation.y = Math.random() * Math.PI;
        gift.rotation.x = (Math.random() - 0.5) * 0.3;
        gift.rotation.z = (Math.random() - 0.5) * 0.3;
        
        gift.scale.setScalar(0);
        targetGroup.add(gift);
        
        gsap.to(gift.scale, { 
            x: 1, y: 1, z: 1, 
            duration: 0.8, 
            delay: 1.2 + (i * 0.03), 
            ease: "back.out(1.4)" 
        });
    }
  };

  // --- LOGIC ---

  useEffect(() => {
    const videoElement = document.getElementById('input-video') as HTMLVideoElement;
    if (!videoElement) return;

    // @ts-ignore
    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const wrist = landmarks[0];
        const fingers = [8, 12, 16, 20];
        let totalDist = 0;
        fingers.forEach(i => {
          const tip = landmarks[i];
          const dx = tip.x - wrist.x;
          const dy = tip.y - wrist.y;
          totalDist += Math.sqrt(dx * dx + dy * dy);
        });
        onStateChange(prev => ({ ...prev, isFist: totalDist < 0.6 }));
      } else {
        onStateChange(prev => ({ ...prev, isFist: false }));
      }
    });

    // @ts-ignore
    const mpCamera = new window.Camera(videoElement, {
      onFrame: async () => { await hands.send({ image: videoElement }); },
      width: 640, height: 480,
    });

    mpCamera.start().then(() => onStateChange(prev => ({ ...prev, cameraActive: true })));
    return () => { mpCamera.stop(); hands.close(); };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.maxDistance = 30;
    controls.minDistance = 5;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.7)); // Higher bloom for star

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const iceBlue = new THREE.Color(0xA5F3FC);
    const white = new THREE.Color(0xFFFFFF);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const isHelix1 = i < PARTICLE_COUNT / 2;
      const t = (i / (PARTICLE_COUNT / 2)) % 1.0;
      const height = t * TREE_HEIGHT;
      const angle = t * Math.PI * 10 + (isHelix1 ? 0 : Math.PI);
      const radius = TREE_RADIUS * (1 - t) + 0.2;

      targetPositions[i * 3] = Math.cos(angle) * radius;
      targetPositions[i * 3 + 1] = height - TREE_HEIGHT / 2;
      targetPositions[i * 3 + 2] = Math.sin(angle) * radius;

      const finalColor = iceBlue.clone().lerp(white, Math.random());
      colors[i * 3] = finalColor.r; colors[i * 3 + 1] = finalColor.g; colors[i * 3 + 2] = finalColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('targetPos', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.035, vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending,
    }));
    scene.add(particles);

    const haloGeom = new THREE.TorusGeometry(TREE_RADIUS * 1.0, 0.05, 16, 100);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xA5F3FC, transparent: true, opacity: 0 });
    const halo = new THREE.Mesh(haloGeom, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -4;
    scene.add(halo);

    const star = create3DStar();
    star.position.y = TREE_HEIGHT / 2 + 0.5;
    star.scale.setScalar(0);
    scene.add(star);

    const decorations = new THREE.Group();
    scene.add(decorations);

    const gifts = new THREE.Group();
    scene.add(gifts);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneRef.current = { scene, camera, renderer, particles, halo, star, composer, decorations, gifts, raycaster, mouse, treeFormed: false };

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (haloMat.opacity > 0) haloMat.opacity = 0.15 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
      if (star.scale.x > 0) {
        star.rotation.y += 0.01;
      }
      composer.render();
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (appState.isFist && !appState.isFormed && !appState.isWakingUp && sceneRef.current) {
      onStateChange(prev => ({ ...prev, isWakingUp: true }));
      const { particles, halo, star, gifts } = sceneRef.current;
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const targets = (particles.geometry.attributes as any).targetPos.array as Float32Array;
      
      gsap.to(positions, {
        duration: 2.2, ease: "expo.inOut",
        onUpdate: () => { particles.geometry.attributes.position.needsUpdate = true; },
        endArray: Array.from(targets),
        onComplete: () => {
          onStateChange(prev => ({ ...prev, isFormed: true, isWakingUp: false }));
          sceneRef.current!.treeFormed = true;
          addGifts(gifts);
          gsap.to(star.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "back.out(2)" });
        }
      });
      gsap.to(halo.material, { opacity: 0.25, duration: 2, delay: 0.8 });
    }
  }, [appState.isFist, appState.isFormed, appState.isWakingUp]);

  const handleClick = (e: React.MouseEvent) => {
    if (!appState.isFormed || !sceneRef.current) return;
    const { camera, raycaster, mouse, scene, decorations } = sceneRef.current;
    
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const coneGeom = new THREE.ConeGeometry(TREE_RADIUS, TREE_HEIGHT, 16);
    const coneMesh = new THREE.Mesh(coneGeom, new THREE.MeshBasicMaterial({ visible: false }));
    scene.add(coneMesh);

    const intersects = raycaster.intersectObject(coneMesh);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      let item;
      switch(selectedDecoration) {
        case 'westie': item = create3DWestie(); break;
        case 'bell': item = create3DBell(); break;
        case 'ornament': item = create3DOrnament(); break;
        case 'snowflake': item = create3DSnowflake(); break;
        case 'candycane': item = create3DCandyCane(); break;
        default: item = create3DWestie();
      }
      
      item.position.copy(point);
      item.lookAt(point.x * 2, point.y, point.z * 2);
      decorations.add(item);

      // Adjusted Scale (Redesigned smaller to fit the tree better)
      const randomScale = 0.4 + Math.random() * 0.8; 
      item.scale.setScalar(0);
      gsap.to(item.scale, { 
        x: randomScale, y: randomScale, z: randomScale, 
        duration: 0.7, 
        ease: "back.out(2.0)" 
      });
      
      gsap.to(item.rotation, { 
        z: `+=${0.15 + Math.random() * 0.25}`, 
        duration: 1.2 + Math.random(), 
        repeat: -1, 
        yoyo: true, 
        ease: "sine.inOut" 
      });
    }
    scene.remove(coneMesh);
  };

  return <div ref={mountRef} className="w-full h-full cursor-pointer" onClick={handleClick} />;
};
