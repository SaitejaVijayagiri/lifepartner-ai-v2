'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GuruAvatarCanvasProps {
    isSpeaking: boolean;
    isListening?: boolean;
    mood?: 'meditating' | 'greeting' | 'talking' | 'thinking';
    className?: string;
    onCanvasClick?: () => void;
}

export default function GuruAvatarCanvas({
    isSpeaking,
    isListening = false,
    mood = 'meditating',
    className = 'w-full h-64',
    onCanvasClick
}: GuruAvatarCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // References for animated elements
    const guruRootRef = useRef<THREE.Group | null>(null);
    const headGroupRef = useRef<THREE.Group | null>(null);
    const mouthMeshRef = useRef<THREE.Mesh | null>(null);
    const leftEyelidRef = useRef<THREE.Mesh | null>(null);
    const rightEyelidRef = useRef<THREE.Mesh | null>(null);
    const leftPupilRef = useRef<THREE.Mesh | null>(null);
    const rightPupilRef = useRef<THREE.Mesh | null>(null);
    const mandalaOuterRef = useRef<THREE.Group | null>(null);
    const mandalaInnerRef = useRef<THREE.Group | null>(null);
    const lotusGroupRef = useRef<THREE.Group | null>(null);
    const auraRingsRef = useRef<THREE.Mesh[]>([]);
    const thirdEyeGlowRef = useRef<THREE.PointLight | null>(null);
    const heartGlowRef = useRef<THREE.PointLight | null>(null);
    const stardustRef = useRef<THREE.Points | null>(null);

    const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isSpeakingRef = useRef(isSpeaking);
    isSpeakingRef.current = isSpeaking;

    const moodRef = useRef(mood);
    moodRef.current = mood;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 320;
        const height = container.clientHeight || 280;

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0.35, 4.3);

        // 2. High-Performance Anti-Aliased WebGL Renderer
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 3. Divine Celestial Lighting
        const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
        scene.add(ambientLight);

        // Golden Sunrise Key Light
        const sunLight = new THREE.DirectionalLight(0xffd59e, 2.4);
        sunLight.position.set(2.5, 4, 3.5);
        scene.add(sunLight);

        // Ethereal Rose / Amethyst Rim Light for silhouette glow
        const rimLight = new THREE.DirectionalLight(0xf43f5e, 2.2);
        rimLight.position.set(-3.5, 2.5, -2.5);
        scene.add(rimLight);

        // Soft Celestial Sky Blue Fill Light
        const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
        fillLight.position.set(0, -2, 2.5);
        scene.add(fillLight);

        // Glowing Ajna (Third Eye) Chakra Light
        const ajnaLight = new THREE.PointLight(0xffb703, 1.8, 3.5);
        ajnaLight.position.set(0, 0.95, 0.75);
        scene.add(ajnaLight);
        thirdEyeGlowRef.current = ajnaLight;

        // Glowing Anahata (Heart Chakra) Light
        const anahataLight = new THREE.PointLight(0xf43f5e, 1.2, 3);
        anahataLight.position.set(0, 0.05, 0.6);
        scene.add(anahataLight);
        heartGlowRef.current = anahataLight;

        // 4. Guru Root Group
        const guruRoot = new THREE.Group();
        guruRoot.position.y = -0.15;
        scene.add(guruRoot);
        guruRootRef.current = guruRoot;

        // ── Elegant Divine Materials ──
        const silkSaffronMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            roughness: 0.45,
            metalness: 0.1,
            emissive: 0x9a3412,
            emissiveIntensity: 0.15
        });

        const royalSilkWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xfefce8,
            roughness: 0.35,
            metalness: 0.05
        });

        const divineGoldMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            roughness: 0.25,
            metalness: 0.85,
            emissive: 0x854d0e,
            emissiveIntensity: 0.25
        });

        const warmSkinMat = new THREE.MeshStandardMaterial({
            color: 0xf5d0a9,
            roughness: 0.55,
            metalness: 0.05
        });

        const glowingRubyMat = new THREE.MeshStandardMaterial({
            color: 0xe11d48,
            roughness: 0.15,
            metalness: 0.4,
            emissive: 0xbe123c,
            emissiveIntensity: 0.8
        });

        const crystalPetalMat = new THREE.MeshStandardMaterial({
            color: 0xf472b6,
            roughness: 0.3,
            metalness: 0.15,
            emissive: 0x831843,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.92
        });

        // ── 5. Meditating Celestial Body ──
        const bodyGroup = new THREE.Group();

        // Upper Torso in Saffron Silk Robe
        const torsoGeo = new THREE.CylinderGeometry(0.5, 0.62, 0.85, 24);
        const torsoMesh = new THREE.Mesh(torsoGeo, silkSaffronMat);
        torsoMesh.position.y = -0.12;
        bodyGroup.add(torsoMesh);

        // Flowing Golden Stole (Angavastram drape across left shoulder)
        const stoleCurve = new THREE.TorusGeometry(0.66, 0.14, 16, 32, Math.PI * 1.35);
        const stoleMesh = new THREE.Mesh(stoleCurve, divineGoldMat);
        stoleMesh.rotation.x = Math.PI / 3.8;
        stoleMesh.rotation.z = -Math.PI / 5.5;
        stoleMesh.position.set(-0.06, -0.04, 0.12);
        bodyGroup.add(stoleMesh);

        // Lower Lotus Posture (Crossed Silken Garments)
        const crossedLegsGeo = new THREE.CylinderGeometry(0.92, 1.05, 0.4, 28);
        const crossedLegsMesh = new THREE.Mesh(crossedLegsGeo, royalSilkWhiteMat);
        crossedLegsMesh.position.y = -0.68;
        bodyGroup.add(crossedLegsMesh);

        // Sacred Spiritual Rudraksha Mala (Beaded Necklace)
        const malaCurve = new THREE.TorusGeometry(0.48, 0.04, 12, 36);
        const rudrakshaMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
        const malaMesh = new THREE.Mesh(malaCurve, rudrakshaMat);
        malaMesh.rotation.x = Math.PI / 2.3;
        malaMesh.position.set(0, 0.22, 0.36);
        bodyGroup.add(malaMesh);

        // Golden Heart Locket (Anahata Chakra Yantra)
        const heartLocketGeo = new THREE.OctahedronGeometry(0.09, 0);
        const heartLocket = new THREE.Mesh(heartLocketGeo, divineGoldMat);
        heartLocket.position.set(0, -0.12, 0.62);
        bodyGroup.add(heartLocket);

        // Graceful Arms resting in Gyan Mudra
        const leftArmGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.68, 16);
        const leftArm = new THREE.Mesh(leftArmGeo, silkSaffronMat);
        leftArm.position.set(-0.66, -0.28, 0.2);
        leftArm.rotation.z = Math.PI / 4.2;
        leftArm.rotation.x = Math.PI / 7;
        bodyGroup.add(leftArm);

        const rightArmGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.68, 16);
        const rightArm = new THREE.Mesh(rightArmGeo, silkSaffronMat);
        rightArm.position.set(0.66, -0.28, 0.2);
        rightArm.rotation.z = -Math.PI / 4.2;
        rightArm.rotation.x = Math.PI / 7;
        bodyGroup.add(rightArm);

        // Hands in Gyan Mudra (Index touching thumb tip in harmony)
        const handGeo = new THREE.SphereGeometry(0.11, 16, 16);
        const leftHand = new THREE.Mesh(handGeo, warmSkinMat);
        leftHand.position.set(-0.52, -0.58, 0.44);
        bodyGroup.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, warmSkinMat);
        rightHand.position.set(0.52, -0.58, 0.44);
        bodyGroup.add(rightHand);

        // Radiant Light at Gyan Mudra Fingertips
        const fingerGlowGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const fingerGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const leftGlow = new THREE.Mesh(fingerGlowGeo, fingerGlowMat);
        leftGlow.position.set(-0.52, -0.56, 0.52);
        bodyGroup.add(leftGlow);

        const rightGlow = new THREE.Mesh(fingerGlowGeo, fingerGlowMat);
        rightGlow.position.set(0.52, -0.56, 0.52);
        bodyGroup.add(rightGlow);

        guruRoot.add(bodyGroup);

        // ── 6. Sculpted Serene Head & Crown (Smooth & Elegant) ──
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.6, 0);
        headGroupRef.current = headGroup;

        // Smooth Serene Head Mesh
        const headGeo = new THREE.SphereGeometry(0.42, 32, 32);
        headGeo.scale(1, 1.15, 1);
        const headMesh = new THREE.Mesh(headGeo, warmSkinMat);
        headGroup.add(headMesh);

        // Royal Celestial Pagri / Crown (Layered Saffron & Gold Silk)
        const crownGroup = new THREE.Group();
        crownGroup.position.y = 0.24;

        // Base Turban Coil (Gold)
        const coil1Geo = new THREE.TorusGeometry(0.44, 0.15, 16, 32);
        const coil1 = new THREE.Mesh(coil1Geo, divineGoldMat);
        coil1.rotation.x = Math.PI / 2.1;
        crownGroup.add(coil1);

        // Middle Saffron Drape Coil
        const coil2Geo = new THREE.TorusGeometry(0.39, 0.14, 16, 32);
        const coil2 = new THREE.Mesh(coil2Geo, silkSaffronMat);
        coil2.rotation.x = Math.PI / 2.05;
        coil2.rotation.y = 0.12;
        coil2.position.y = 0.15;
        crownGroup.add(coil2);

        // Crown Dome Peak
        const domeGeo = new THREE.SphereGeometry(0.32, 24, 24);
        domeGeo.scale(1, 0.8, 1);
        const domeMesh = new THREE.Mesh(domeGeo, divineGoldMat);
        domeMesh.position.y = 0.32;
        crownGroup.add(domeMesh);

        // Royal Kalgi Crest Jewel (Glowing Ruby Centerpiece)
        const kalgiGeo = new THREE.OctahedronGeometry(0.09, 1);
        const kalgiMesh = new THREE.Mesh(kalgiGeo, glowingRubyMat);
        kalgiMesh.position.set(0, 0.14, 0.49);
        crownGroup.add(kalgiMesh);

        // Golden Filigree Pin for Crest
        const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8);
        const pinMesh = new THREE.Mesh(pinGeo, divineGoldMat);
        pinMesh.position.set(0, 0.25, 0.48);
        crownGroup.add(pinMesh);

        headGroup.add(crownGroup);

        // Sacred Tilak & Third Eye Star
        const tilakMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
        const tilakVertical = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.02), tilakMat);
        tilakVertical.position.set(0, 0.18, 0.43);
        headGroup.add(tilakVertical);

        // Glowing Golden Ajna Star
        const ajnaStarGeo = new THREE.SphereGeometry(0.028, 12, 12);
        const ajnaStarMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const ajnaStar = new THREE.Mesh(ajnaStarGeo, ajnaStarMat);
        ajnaStar.position.set(0, 0.26, 0.435);
        headGroup.add(ajnaStar);

        // Serene Almond Meditative Eyes
        const scleraGeo = new THREE.SphereGeometry(0.065, 16, 16);
        scleraGeo.scale(1.4, 0.55, 0.4);
        const eyeScleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const leftSclera = new THREE.Mesh(scleraGeo, eyeScleraMat);
        leftSclera.position.set(-0.16, 0.06, 0.38);
        headGroup.add(leftSclera);

        const rightSclera = new THREE.Mesh(scleraGeo, eyeScleraMat);
        rightSclera.position.set(0.16, 0.06, 0.38);
        headGroup.add(rightSclera);

        // Luminous Amber Pupils (Track Cursor)
        const pupilGeo = new THREE.SphereGeometry(0.035, 12, 12);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x451a03 });

        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(-0.16, 0.06, 0.41);
        headGroup.add(leftPupil);
        leftPupilRef.current = leftPupil;

        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0.16, 0.06, 0.41);
        headGroup.add(rightPupil);
        rightPupilRef.current = rightPupil;

        // Animated Eyelids for Natural Blinking
        const eyelidGeo = new THREE.SphereGeometry(0.07, 16, 16);
        eyelidGeo.scale(1.45, 0.6, 0.45);
        const eyelidMat = new THREE.MeshStandardMaterial({ color: 0xebb78a, roughness: 0.6 });

        const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
        leftEyelid.position.set(-0.16, 0.08, 0.4);
        leftEyelid.scale.set(1, 0.01, 1); // Open by default
        headGroup.add(leftEyelid);
        leftEyelidRef.current = leftEyelid;

        const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
        rightEyelid.position.set(0.16, 0.08, 0.4);
        rightEyelid.scale.set(1, 0.01, 1);
        headGroup.add(rightEyelid);
        rightEyelidRef.current = rightEyelid;

        // Serene Elegant Smile & Dynamic Talking Mouth
        // Graceful curved lips (no crude cones or blocky shapes!)
        const mouthCurveGeo = new THREE.TorusGeometry(0.07, 0.02, 12, 24, Math.PI * 0.9);
        const lipsMat = new THREE.MeshStandardMaterial({
            color: 0xbe123c,
            roughness: 0.4,
            emissive: 0x881337,
            emissiveIntensity: 0.2
        });
        const mouthMesh = new THREE.Mesh(mouthCurveGeo, lipsMat);
        mouthMesh.rotation.x = Math.PI / 1.3;
        mouthMesh.rotation.z = Math.PI;
        mouthMesh.position.set(0, -0.15, 0.42);
        headGroup.add(mouthMesh);
        mouthMeshRef.current = mouthMesh;

        guruRoot.add(headGroup);

        // ── 7. Blooming Sacred Crystal Lotus Throne ──
        const lotusGroup = new THREE.Group();
        lotusGroup.position.set(0, -0.92, 0);

        // Outer Tier: 14 Curved Crystal Petals
        const outerPetals = 14;
        for (let i = 0; i < outerPetals; i++) {
            const angle = (i / outerPetals) * Math.PI * 2;
            const petalMesh = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.52, 8), crystalPetalMat);
            petalMesh.position.set(Math.cos(angle) * 0.95, -0.06, Math.sin(angle) * 0.95);
            petalMesh.rotation.x = Math.PI / 3.2;
            petalMesh.rotation.z = -angle;
            lotusGroup.add(petalMesh);
        }

        // Inner Tier: 10 Upright Rosy Petals
        const innerPetals = 10;
        for (let i = 0; i < innerPetals; i++) {
            const angle = (i / innerPetals) * Math.PI * 2;
            const innerPetal = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 8), crystalPetalMat);
            innerPetal.position.set(Math.cos(angle) * 0.72, 0.04, Math.sin(angle) * 0.72);
            innerPetal.rotation.x = Math.PI / 4.5;
            innerPetal.rotation.z = -angle;
            lotusGroup.add(innerPetal);
        }

        // Golden Seed Core (Karnika)
        const coreGeo = new THREE.CylinderGeometry(0.82, 0.72, 0.14, 32);
        const coreMesh = new THREE.Mesh(coreGeo, divineGoldMat);
        lotusGroup.add(coreMesh);

        guruRoot.add(lotusGroup);
        lotusGroupRef.current = lotusGroup;

        // ── 8. Sacred Geometry Golden Mandala Halo ──
        const mandalaGroup = new THREE.Group();
        mandalaGroup.position.set(0, 0.62, -0.32);

        // Outer Sacred Ring with Radial Ray Beams
        const outerRingGeo = new THREE.TorusGeometry(0.92, 0.03, 16, 48);
        const haloGoldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, wireframe: false });
        const outerRing = new THREE.Mesh(outerRingGeo, haloGoldMat);
        mandalaGroup.add(outerRing);

        // 16 Golden Sun Rays
        const raysGroup = new THREE.Group();
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const rayGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.24, 6);
            const rayMesh = new THREE.Mesh(rayGeo, haloGoldMat);
            rayMesh.position.set(Math.cos(angle) * 1.05, Math.sin(angle) * 1.05, 0);
            rayMesh.rotation.z = angle - Math.PI / 2;
            raysGroup.add(rayMesh);
        }
        mandalaGroup.add(raysGroup);
        mandalaOuterRef.current = raysGroup;

        // Inner Sacred Mandalic 12-Spoke Star
        const innerMandalaGeo = new THREE.TorusGeometry(0.68, 0.02, 12, 36);
        const innerHaloMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: false });
        const innerRing = new THREE.Mesh(innerMandalaGeo, innerHaloMat);
        mandalaGroup.add(innerRing);
        mandalaInnerRef.current = innerRing;

        scene.add(mandalaGroup);

        // ── 9. Speech Resonance Aura Ripples ──
        const ringsArray: THREE.Mesh[] = [];
        for (let i = 0; i < 3; i++) {
            const ringGeo = new THREE.RingGeometry(0.7 + i * 0.25, 0.74 + i * 0.25, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0xf43f5e,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(0, 0.6, -0.2);
            scene.add(ring);
            ringsArray.push(ring);
        }
        auraRingsRef.current = ringsArray;

        // ── 10. Cosmic Floating Stardust Constellation ──
        const particleCount = 180;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const colorGold = new THREE.Color(0xfacc15);
        const colorRose = new THREE.Color(0xf43f5e);
        const colorCyan = new THREE.Color(0x38bdf8);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const radius = 0.8 + Math.random() * 2.2;
            const y = (Math.random() - 0.5) * 3.2;

            positions[i * 3] = Math.cos(theta) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(theta) * radius;

            const chosen = Math.random() > 0.6 ? colorGold : (Math.random() > 0.3 ? colorRose : colorCyan);
            colors[i * 3] = chosen.r;
            colors[i * 3 + 1] = chosen.g;
            colors[i * 3 + 2] = chosen.b;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending
        });

        const stardust = new THREE.Points(particleGeo, particleMat);
        scene.add(stardust);
        stardustRef.current = stardust;

        // ── Pointer Interaction Tracking ──
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const rect = container.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            // Normalized to -1 .. 1
            const x = ((clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
            mousePosRef.current = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
        };

        window.addEventListener('mousemove', handlePointerMove, { passive: true });
        window.addEventListener('touchmove', handlePointerMove, { passive: true });

        // ── Responsive Resize ──
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const newW = container.clientWidth || 320;
            const newH = container.clientHeight || 280;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener('resize', handleResize);

        // ── Smooth Animation Loop ──
        let clock = new THREE.Clock();
        let blinkTimer = 0;
        let isBlinking = false;

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();
            const delta = clock.getDelta();

            // 1. Natural Sinusoidal Levitation (Breathing Float)
            if (guruRootRef.current) {
                guruRootRef.current.position.y = -0.15 + Math.sin(elapsed * 1.5) * 0.04;
            }

            // 2. Slow Sacred Halo Rotation
            if (mandalaOuterRef.current) {
                mandalaOuterRef.current.rotation.z = elapsed * 0.12;
            }
            if (mandalaInnerRef.current) {
                mandalaInnerRef.current.rotation.z = -elapsed * 0.18;
            }

            // 3. Gentle Lotus Sway
            if (lotusGroupRef.current) {
                lotusGroupRef.current.rotation.y = Math.sin(elapsed * 0.8) * 0.08;
            }

            // 4. Smooth Head & Eye Gaze Damping (tracks cursor smoothly)
            if (headGroupRef.current) {
                const targetRotY = mousePosRef.current.x * 0.32;
                const targetRotX = -mousePosRef.current.y * 0.22;
                headGroupRef.current.rotation.y += (targetRotY - headGroupRef.current.rotation.y) * 0.06;
                headGroupRef.current.rotation.x += (targetRotX - headGroupRef.current.rotation.x) * 0.06;
            }

            // 5. Pupils follow pointer with natural eye motion
            const pupilTargetX = mousePosRef.current.x * 0.018;
            const pupilTargetY = mousePosRef.current.y * 0.014;
            if (leftPupilRef.current && rightPupilRef.current) {
                leftPupilRef.current.position.x = -0.16 + pupilTargetX;
                leftPupilRef.current.position.y = 0.06 + pupilTargetY;
                rightPupilRef.current.position.x = 0.16 + pupilTargetX;
                rightPupilRef.current.position.y = 0.06 + pupilTargetY;
            }

            // 6. Natural Eye Blinking (every 3.8 seconds)
            blinkTimer += 0.016;
            if (blinkTimer > 3.8) {
                isBlinking = true;
                blinkTimer = 0;
            }
            if (isBlinking && leftEyelidRef.current && rightEyelidRef.current) {
                // Quick blink down and up
                leftEyelidRef.current.scale.y = 1;
                rightEyelidRef.current.scale.y = 1;
                setTimeout(() => {
                    if (leftEyelidRef.current && rightEyelidRef.current) {
                        leftEyelidRef.current.scale.y = 0.01;
                        rightEyelidRef.current.scale.y = 0.01;
                    }
                    isBlinking = false;
                }, 140);
            }

            // 7. Dynamic Talking Articulation (Mouth & Aura Waves)
            if (isSpeakingRef.current) {
                const speechCadence = Math.sin(elapsed * 18) * 0.5 + Math.cos(elapsed * 26) * 0.5;
                const mouthOpen = Math.max(0.2, 0.55 + speechCadence * 0.45);

                if (mouthMeshRef.current) {
                    mouthMeshRef.current.scale.y = mouthOpen;
                    mouthMeshRef.current.scale.x = 0.9 + speechCadence * 0.2;
                }

                // Heart and Ajna pulses with voice
                if (thirdEyeGlowRef.current) {
                    thirdEyeGlowRef.current.intensity = 2.2 + Math.sin(elapsed * 14) * 0.8;
                }
                if (heartGlowRef.current) {
                    heartGlowRef.current.intensity = 1.8 + Math.cos(elapsed * 12) * 0.6;
                }

                // Speech Resonance Aura Ripples
                auraRingsRef.current.forEach((ring, idx) => {
                    const wavePhase = (elapsed * 2 + idx * 0.7) % 2.5;
                    ring.scale.setScalar(1 + wavePhase * 0.45);
                    const ringMat = ring.material as THREE.MeshBasicMaterial;
                    ringMat.opacity = Math.max(0, 0.4 - wavePhase * 0.16);
                });
            } else {
                // Peaceful serene resting state
                if (mouthMeshRef.current) {
                    mouthMeshRef.current.scale.y = 0.25;
                    mouthMeshRef.current.scale.x = 1.0;
                }
                if (thirdEyeGlowRef.current) {
                    thirdEyeGlowRef.current.intensity = 1.6 + Math.sin(elapsed * 2) * 0.3;
                }
                if (heartGlowRef.current) {
                    heartGlowRef.current.intensity = 1.0 + Math.cos(elapsed * 2) * 0.2;
                }
                auraRingsRef.current.forEach(ring => {
                    (ring.material as THREE.MeshBasicMaterial).opacity = 0;
                });
            }

            // 8. Orbiting Cosmic Stardust Particles
            if (stardustRef.current) {
                stardustRef.current.rotation.y = elapsed * 0.05;
                stardustRef.current.rotation.x = Math.sin(elapsed * 0.03) * 0.08;
            }

            renderer.render(scene, camera);
        };

        animate();

        // ── Teardown ──
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('touchmove', handlePointerMove);
            window.removeEventListener('resize', handleResize);
            if (renderer.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            onClick={onCanvasClick}
            className={`relative cursor-pointer select-none overflow-hidden ${className}`}
            style={{ touchAction: 'none' }}
        >
            {/* Subtle Divine Background Radiance */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(244,63,94,0.18),rgba(245,158,11,0.08),transparent_70%)]" />

            {/* Speaking Status Pill */}
            {isSpeaking && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 backdrop-blur-md text-rose-300 text-[11px] font-semibold animate-pulse shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>Speaking...</span>
                </div>
            )}
        </div>
    );
}
