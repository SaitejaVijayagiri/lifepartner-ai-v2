'use client';

import React, { useEffect, useRef, useState } from 'react';
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

    // References for dynamic animated objects
    const guruGroupRef = useRef<THREE.Group | null>(null);
    const guruMeshRef = useRef<THREE.Mesh | null>(null);
    const haloGroupRef = useRef<THREE.Group | null>(null);
    const haloInnerRef = useRef<THREE.Group | null>(null);
    const blessingAuraRef = useRef<THREE.Mesh | null>(null);
    const bookLightRef = useRef<THREE.PointLight | null>(null);
    const ajnaLightRef = useRef<THREE.PointLight | null>(null);
    const handLightRef = useRef<THREE.PointLight | null>(null);
    const mouthMeshRef = useRef<THREE.Mesh | null>(null);
    const leftEyelidRef = useRef<THREE.Mesh | null>(null);
    const rightEyelidRef = useRef<THREE.Mesh | null>(null);
    const bookParticlesRef = useRef<THREE.Points | null>(null);
    const cosmicParticlesRef = useRef<THREE.Points | null>(null);
    const blessingRingRef = useRef<THREE.Mesh | null>(null);

    const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isSpeakingRef = useRef(isSpeaking);
    isSpeakingRef.current = isSpeaking;

    const moodRef = useRef(mood);
    moodRef.current = mood;

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 320;
        const height = container.clientHeight || 280;

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
        camera.position.set(0, 0.05, 3.8);

        // 2. Anti-Aliased WebGL Renderer with High-Performance Settings
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
        const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.3);
        scene.add(ambientLight);

        // Warm Golden Key Light from upper right
        const sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
        sunLight.position.set(2.5, 3.5, 3);
        scene.add(sunLight);

        // Soft Rose-Amber Rim Light for silhouetting white hair & saffron robe
        const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
        rimLight.position.set(-3, 2, -1.5);
        scene.add(rimLight);

        // Gentle Cool Fill Light from below
        const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
        fillLight.position.set(0, -2, 2);
        scene.add(fillLight);

        // Ajna (Third Eye) Forehead Point Light
        const ajnaLight = new THREE.PointLight(0xfef08a, 1.2, 2.5);
        ajnaLight.position.set(0, 0.62, 0.25);
        scene.add(ajnaLight);
        ajnaLightRef.current = ajnaLight;

        // Raised Blessing Hand Radiant Point Light (Abhaya Mudra)
        const handLight = new THREE.PointLight(0xf59e0b, 1.5, 2.8);
        handLight.position.set(-0.68, 0.38, 0.3);
        scene.add(handLight);
        handLightRef.current = handLight;

        // Sacred Scripture (Vedic Book) Upward Golden Light
        const bookLight = new THREE.PointLight(0xfbbf24, 1.4, 2.2);
        bookLight.position.set(0, -0.92, 0.4);
        scene.add(bookLight);
        bookLightRef.current = bookLight;

        // 4. Guru Master Root Group
        const guruGroup = new THREE.Group();
        guruGroup.position.set(0, 0.05, 0);
        scene.add(guruGroup);
        guruGroupRef.current = guruGroup;

        // ── 5. Texture Loader for the Authentic Maharishi Image ──
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            '/images/guru_master.png',
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = true;

                // Create high-density curved plane mesh for volumetric depth
                const planeGeo = new THREE.PlaneGeometry(2.35, 2.35, 32, 32);

                // Curve the mesh slightly along the vertical/horizontal axis for true depth curvature
                const pos = planeGeo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const y = pos.getY(i);
                    // Gentle spherical curvature: center pops forward, edges recede
                    const distFromCenter = Math.sqrt(x * x + y * y);
                    const zOffset = Math.max(0, 0.12 - distFromCenter * 0.07);
                    pos.setZ(i, zOffset);
                }
                planeGeo.computeVertexNormals();

                const planeMat = new THREE.MeshStandardMaterial({
                    map: texture,
                    transparent: true,
                    roughness: 0.45,
                    metalness: 0.1,
                    alphaTest: 0.05
                });

                const guruMesh = new THREE.Mesh(planeGeo, planeMat);
                guruMesh.position.set(0, 0, 0);
                guruGroup.add(guruMesh);
                guruMeshRef.current = guruMesh;

                setIsLoaded(true);
            },
            undefined,
            (err) => {
                console.warn("Failed to load /images/guru_master.png", err);
            }
        );

        // ── 6. Rotating Golden Sacred Mandala Halo (Surya Chakra) ──
        const haloGroup = new THREE.Group();
        haloGroup.position.set(0, 0.58, -0.25);

        const haloMat = new THREE.MeshBasicMaterial({
            color: 0xfacc15,
            transparent: true,
            opacity: 0.85
        });

        // Outer Mandala Ring with Radiating Sun Rays
        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 16, 48), haloMat);
        haloGroup.add(outerRing);

        // 16 Sacred Surya Sun Rays
        const raysGroup = new THREE.Group();
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const rayGeo = new THREE.CylinderGeometry(0.006, 0.012, 0.22, 6);
            const rayMesh = new THREE.Mesh(rayGeo, haloMat);
            rayMesh.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.85, 0);
            rayMesh.rotation.z = angle - Math.PI / 2;
            raysGroup.add(rayMesh);
        }
        haloGroup.add(raysGroup);
        haloInnerRef.current = raysGroup;

        // Inner Sacred 8-Spoke Wheel
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 12, 36), haloMat);
        haloGroup.add(innerRing);

        guruGroup.add(haloGroup);
        haloGroupRef.current = haloGroup;

        // ── 7. Blessing Hand Sacred Aura (Abhaya Mudra) ──
        // Positioned right behind the raised right hand (viewer's left: x ≈ -0.68, y ≈ 0.38)
        const blessingAuraGeo = new THREE.RingGeometry(0.12, 0.28, 32);
        const blessingAuraMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45
        });
        const blessingAura = new THREE.Mesh(blessingAuraGeo, blessingAuraMat);
        blessingAura.position.set(-0.68, 0.38, -0.05);
        guruGroup.add(blessingAura);
        blessingAuraRef.current = blessingAura;

        // Blessing ripple ring that expands when giving guidance
        const rippleGeo = new THREE.RingGeometry(0.2, 0.24, 32);
        const rippleMat = new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
        rippleMesh.position.set(-0.68, 0.38, 0.05);
        guruGroup.add(rippleMesh);
        blessingRingRef.current = rippleMesh;

        // ── 8. Natural Eye Blinking Overlays ──
        // Coordinates for eyes on the 2.35 unit plane:
        // Center is (0, 0). Head is around y ≈ 0.45 .. 0.75.
        // Left eye (viewer's left) at x ≈ -0.11, y ≈ 0.58. Right eye at x ≈ 0.11, y ≈ 0.58.
        const eyelidGeo = new THREE.PlaneGeometry(0.14, 0.055);
        const eyelidMat = new THREE.MeshStandardMaterial({
            color: 0xe0a97a,
            roughness: 0.6,
            transparent: true,
            opacity: 0.95
        });

        const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
        leftEyelid.position.set(-0.11, 0.58, 0.08);
        leftEyelid.scale.set(1, 0.01, 1); // Open by default
        guruGroup.add(leftEyelid);
        leftEyelidRef.current = leftEyelid;

        const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
        rightEyelid.position.set(0.11, 0.58, 0.08);
        rightEyelid.scale.set(1, 0.01, 1);
        guruGroup.add(rightEyelid);
        rightEyelidRef.current = rightEyelid;

        // ── 9. Animated Talking Mouth / Lip-Sync ──
        // Coordinates for mouth / mustache area: x ≈ 0, y ≈ 0.34
        const mouthGeo = new THREE.PlaneGeometry(0.16, 0.08);
        const mouthMat = new THREE.MeshBasicMaterial({
            color: 0x451a03,
            transparent: true,
            opacity: 0
        });
        const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
        mouthMesh.position.set(0, 0.34, 0.07);
        guruGroup.add(mouthMesh);
        mouthMeshRef.current = mouthMesh;

        // ── 10. Shimmering Golden Wisdom Particles from the Open Scripture ──
        // Positioned at the bottom open book (x ≈ 0, y ≈ -0.88)
        const bookParticleCount = 45;
        const bookParticleGeo = new THREE.BufferGeometry();
        const bookPositions = new Float32Array(bookParticleCount * 3);
        const bookSpeeds: number[] = [];

        for (let i = 0; i < bookParticleCount; i++) {
            bookPositions[i * 3] = (Math.random() - 0.5) * 1.1;     // spread across book width
            bookPositions[i * 3 + 1] = -0.9 + Math.random() * 0.45;  // rising from book
            bookPositions[i * 3 + 2] = 0.15 + Math.random() * 0.25;
            bookSpeeds.push(0.004 + Math.random() * 0.008);
        }
        bookParticleGeo.setAttribute('position', new THREE.BufferAttribute(bookPositions, 3));

        const bookParticleMat = new THREE.PointsMaterial({
            color: 0xfacc15,
            size: 0.035,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const bookParticles = new THREE.Points(bookParticleGeo, bookParticleMat);
        guruGroup.add(bookParticles);
        bookParticlesRef.current = bookParticles;

        // ── 11. Orbiting Cosmic Stardust Field ──
        const cosmicCount = 140;
        const cosmicGeo = new THREE.BufferGeometry();
        const cosmicPos = new Float32Array(cosmicCount * 3);
        const cosmicColors = new Float32Array(cosmicCount * 3);

        const goldCol = new THREE.Color(0xfacc15);
        const roseCol = new THREE.Color(0xf59e0b);
        const cyanCol = new THREE.Color(0x38bdf8);

        for (let i = 0; i < cosmicCount; i++) {
            const rad = 1.0 + Math.random() * 1.8;
            const theta = Math.random() * Math.PI * 2;
            cosmicPos[i * 3] = Math.cos(theta) * rad;
            cosmicPos[i * 3 + 1] = (Math.random() - 0.5) * 2.8;
            cosmicPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2 - 0.2;

            const chosen = Math.random() > 0.5 ? goldCol : (Math.random() > 0.25 ? roseCol : cyanCol);
            cosmicColors[i * 3] = chosen.r;
            cosmicColors[i * 3 + 1] = chosen.g;
            cosmicColors[i * 3 + 2] = chosen.b;
        }

        cosmicGeo.setAttribute('position', new THREE.BufferAttribute(cosmicPos, 3));
        cosmicGeo.setAttribute('color', new THREE.BufferAttribute(cosmicColors, 3));

        const cosmicMat = new THREE.PointsMaterial({
            size: 0.04,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending
        });
        const cosmicParticles = new THREE.Points(cosmicGeo, cosmicMat);
        scene.add(cosmicParticles);
        cosmicParticlesRef.current = cosmicParticles;

        // ── 12. Pointer & Touch Interaction Tracking ──
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const rect = container.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

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

        // ── Animation Loop ──
        const clock = new THREE.Clock();
        let blinkTimer = 0;
        let isBlinking = false;
        let blessingPulse = 0;

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();

            // 1. Sinusoidal Breathing Levitation
            if (guruGroupRef.current) {
                guruGroupRef.current.position.y = 0.05 + Math.sin(elapsed * 1.5) * 0.035;

                // Smooth Perspective Tilt following mouse/touch pointer
                const targetRotY = mousePosRef.current.x * 0.26;
                const targetRotX = -mousePosRef.current.y * 0.18;
                guruGroupRef.current.rotation.y += (targetRotY - guruGroupRef.current.rotation.y) * 0.06;
                guruGroupRef.current.rotation.x += (targetRotX - guruGroupRef.current.rotation.x) * 0.06;
            }

            // 2. Slow Sacred Sun Halo (Surya Chakra) Rotation
            if (haloGroupRef.current) {
                haloGroupRef.current.rotation.z = elapsed * 0.14;
            }
            if (haloInnerRef.current) {
                haloInnerRef.current.rotation.z = -elapsed * 0.22;
            }

            // 3. Blessing Hand Aura Pulsation
            if (blessingAuraRef.current) {
                const auraScale = 1.0 + Math.sin(elapsed * 2.8) * 0.12;
                blessingAuraRef.current.scale.set(auraScale, auraScale, 1);
            }

            // 4. Natural Eye Blinking (every 3.6 seconds)
            blinkTimer += 0.016;
            if (blinkTimer > 3.6) {
                isBlinking = true;
                blinkTimer = 0;
            }
            if (isBlinking && leftEyelidRef.current && rightEyelidRef.current) {
                leftEyelidRef.current.scale.y = 1;
                rightEyelidRef.current.scale.y = 1;
                setTimeout(() => {
                    if (leftEyelidRef.current && rightEyelidRef.current) {
                        leftEyelidRef.current.scale.y = 0.01;
                        rightEyelidRef.current.scale.y = 0.01;
                    }
                    isBlinking = false;
                }, 135);
            }

            // 5. Dynamic Talking & Speech Articulation
            if (isSpeakingRef.current) {
                const speechCadence = Math.sin(elapsed * 18) * 0.5 + Math.cos(elapsed * 28) * 0.5;
                const mouthOpen = Math.max(0.15, 0.55 + speechCadence * 0.45);

                if (mouthMeshRef.current) {
                    mouthMeshRef.current.scale.y = mouthOpen;
                    (mouthMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + speechCadence * 0.2;
                }

                // Blessing Hand radiates extra warmth during speech
                if (handLightRef.current) {
                    handLightRef.current.intensity = 2.0 + Math.sin(elapsed * 12) * 0.6;
                }
                if (ajnaLightRef.current) {
                    ajnaLightRef.current.intensity = 1.6 + Math.cos(elapsed * 10) * 0.5;
                }

                // Expanding Blessing Wave from hand
                blessingPulse = (blessingPulse + 0.02) % 1.0;
                if (blessingRingRef.current) {
                    blessingRingRef.current.scale.setScalar(1 + blessingPulse * 2.2);
                    (blessingRingRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - blessingPulse) * 0.6);
                }
            } else {
                if (mouthMeshRef.current) {
                    mouthMeshRef.current.scale.y = 0.1;
                    (mouthMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
                }
                if (handLightRef.current) {
                    handLightRef.current.intensity = 1.3 + Math.sin(elapsed * 2) * 0.25;
                }
                if (ajnaLightRef.current) {
                    ajnaLightRef.current.intensity = 1.1 + Math.sin(elapsed * 2) * 0.2;
                }
                if (blessingRingRef.current) {
                    (blessingRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
                }
            }

            // 6. Sacred Scripture (Book) Particles rising upward
            if (bookParticlesRef.current) {
                const posArr = bookParticlesRef.current.geometry.attributes.position.array as Float32Array;
                for (let i = 0; i < bookParticleCount; i++) {
                    posArr[i * 3 + 1] += bookSpeeds[i];
                    // Reset when particles rise past chest
                    if (posArr[i * 3 + 1] > -0.35) {
                        posArr[i * 3 + 1] = -0.92;
                        posArr[i * 3] = (Math.random() - 0.5) * 1.1;
                    }
                }
                bookParticlesRef.current.geometry.attributes.position.needsUpdate = true;
            }

            // 7. Swirling Orbiting Cosmic Stardust
            if (cosmicParticlesRef.current) {
                cosmicParticlesRef.current.rotation.y = elapsed * 0.06;
                cosmicParticlesRef.current.rotation.x = Math.sin(elapsed * 0.04) * 0.08;
            }

            renderer.render(scene, camera);
        };

        animate();

        // ── Cleanup ──
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
            {/* Subtle Divine Glow Backdrop */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(245,158,11,0.22),rgba(244,63,94,0.1),transparent_70%)]" />

            {/* Speaking Status Badge */}
            {isSpeaking && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 backdrop-blur-md text-amber-200 text-[11px] font-semibold animate-pulse shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Speaking Wisdom...</span>
                </div>
            )}
        </div>
    );
}
