'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ThreeDGuruCanvasProps {
    isSpeaking: boolean;
    isListening?: boolean;
    mood?: 'meditating' | 'greeting' | 'talking' | 'thinking';
    className?: string;
    onCanvasClick?: () => void;
}

export default function ThreeDGuruCanvas({
    isSpeaking,
    isListening = false,
    mood = 'meditating',
    className = 'w-full h-64',
    onCanvasClick
}: ThreeDGuruCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const animFrameRef = useRef<number | null>(null);

    // References for dynamic animated meshes
    const guruGroupRef = useRef<THREE.Group | null>(null);
    const headGroupRef = useRef<THREE.Group | null>(null);
    const jawMeshRef = useRef<THREE.Mesh | null>(null);
    const leftEyeRef = useRef<THREE.Mesh | null>(null);
    const rightEyeRef = useRef<THREE.Mesh | null>(null);
    const haloMeshRef = useRef<THREE.Mesh | null>(null);
    const haloInnerRef = useRef<THREE.Mesh | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const lotusRef = useRef<THREE.Group | null>(null);
    const thirdEyeLightRef = useRef<THREE.PointLight | null>(null);

    const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const isSpeakingRef = useRef(isSpeaking);
    isSpeakingRef.current = isSpeaking;

    const moodRef = useRef(mood);
    moodRef.current = mood;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 260;

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0.4, 4.2);

        // 2. Renderer
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 3. Lighting
        const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.2);
        scene.add(ambientLight);

        // Golden Warm Key Light
        const keyLight = new THREE.DirectionalLight(0xffd59e, 2.2);
        keyLight.position.set(2, 4, 3);
        scene.add(keyLight);

        // Violet-Rose Rim/Back Light for divine aura
        const rimLight = new THREE.DirectionalLight(0xe066ff, 2.0);
        rimLight.position.set(-3, 2, -2);
        scene.add(rimLight);

        // Soft Cyan Fill Light
        const fillLight = new THREE.DirectionalLight(0x66ccff, 0.8);
        fillLight.position.set(0, -2, 2);
        scene.add(fillLight);

        // Third Eye Glowing Point Light
        const thirdEyeLight = new THREE.PointLight(0xffaa00, 1.5, 4);
        thirdEyeLight.position.set(0, 0.9, 0.7);
        scene.add(thirdEyeLight);
        thirdEyeLightRef.current = thirdEyeLight;

        // 4. Guru Root Group
        const guruGroup = new THREE.Group();
        guruGroup.position.y = -0.2;
        scene.add(guruGroup);
        guruGroupRef.current = guruGroup;

        // Materials with rich spiritual palette
        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xdeb887,
            roughness: 0.65,
            metalness: 0.1
        });

        const saffronMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.7,
            metalness: 0.05
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x442200,
            emissiveIntensity: 0.2
        });

        const whiteClothMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.0
        });

        const rubyMat = new THREE.MeshStandardMaterial({
            color: 0xcc0033,
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0xaa0022,
            emissiveIntensity: 0.6
        });

        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a0f00 });
        const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });

        // ── 5. Meditating Body (Torso & Draped Silk Robe) ──
        const bodyGroup = new THREE.Group();

        // Chest / Torso
        const chestGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.9, 16);
        const chestMesh = new THREE.Mesh(chestGeo, saffronMat);
        chestMesh.position.y = -0.15;
        bodyGroup.add(chestMesh);

        // Draped Saffron Shawl (Angavastram across shoulder)
        const shawlCurve = new THREE.TorusGeometry(0.68, 0.16, 12, 24, Math.PI * 1.3);
        const shawlMesh = new THREE.Mesh(shawlCurve, saffronMat);
        shawlMesh.rotation.x = Math.PI / 4;
        shawlMesh.rotation.z = -Math.PI / 6;
        shawlMesh.position.set(-0.05, -0.05, 0.1);
        bodyGroup.add(shawlMesh);

        // Crossed Legs (Lotus Posture Base)
        const legsGeo = new THREE.CylinderGeometry(0.95, 1.05, 0.4, 20);
        const legsMesh = new THREE.Mesh(legsGeo, whiteClothMat);
        legsMesh.position.y = -0.7;
        bodyGroup.add(legsMesh);

        // Rudraksha Spiritual Mala Necklace
        const malaCurve = new THREE.TorusGeometry(0.48, 0.045, 8, 32);
        const malaMat = new THREE.MeshStandardMaterial({ color: 0x6e3713, roughness: 0.9 });
        const malaMesh = new THREE.Mesh(malaCurve, malaMat);
        malaMesh.rotation.x = Math.PI / 2.3;
        malaMesh.position.set(0, 0.2, 0.35);
        bodyGroup.add(malaMesh);

        // Golden Locket on Mala
        const locketGeo = new THREE.OctahedronGeometry(0.08, 0);
        const locketMesh = new THREE.Mesh(locketGeo, goldMat);
        locketMesh.position.set(0, -0.15, 0.62);
        bodyGroup.add(locketMesh);

        // Arms in Gyan Mudra (Wisdom Hand Gesture)
        const leftArmGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 12);
        const leftArm = new THREE.Mesh(leftArmGeo, saffronMat);
        leftArm.position.set(-0.68, -0.3, 0.2);
        leftArm.rotation.z = Math.PI / 4;
        leftArm.rotation.x = Math.PI / 6;
        bodyGroup.add(leftArm);

        const rightArmGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 12);
        const rightArm = new THREE.Mesh(rightArmGeo, saffronMat);
        rightArm.position.set(0.68, -0.3, 0.2);
        rightArm.rotation.z = -Math.PI / 4;
        rightArm.rotation.x = Math.PI / 6;
        bodyGroup.add(rightArm);

        // Hands with Gyan Mudra circles
        const handGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const leftHand = new THREE.Mesh(handGeo, skinMat);
        leftHand.position.set(-0.55, -0.6, 0.45);
        bodyGroup.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, skinMat);
        rightHand.position.set(0.55, -0.6, 0.45);
        bodyGroup.add(rightHand);

        guruGroup.add(bodyGroup);

        // ── 6. Head Group (Rotates and tracks cursor) ──
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.58, 0);
        headGroupRef.current = headGroup;

        // Head Base
        const headGeo = new THREE.SphereGeometry(0.42, 24, 24);
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        headGroup.add(headMesh);

        // Royal Golden / Amber Turban (Layered coils)
        const turbanGroup = new THREE.Group();
        const coil1Geo = new THREE.TorusGeometry(0.44, 0.16, 12, 24);
        const coil1 = new THREE.Mesh(coil1Geo, goldMat);
        coil1.rotation.x = Math.PI / 2;
        coil1.position.y = 0.22;
        turbanGroup.add(coil1);

        const coil2Geo = new THREE.TorusGeometry(0.38, 0.15, 12, 24);
        const coil2 = new THREE.Mesh(coil2Geo, saffronMat);
        coil2.rotation.x = Math.PI / 2;
        coil2.rotation.y = 0.1;
        coil2.position.y = 0.38;
        turbanGroup.add(coil2);

        const coilTopGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const coilTop = new THREE.Mesh(coilTopGeo, goldMat);
        coilTop.position.y = 0.52;
        coilTop.scale.set(1, 0.7, 1);
        turbanGroup.add(coilTop);

        // Turban Gemstone Jewel (Ruby Crest)
        const gemGeo = new THREE.DodecahedronGeometry(0.09, 0);
        const gemMesh = new THREE.Mesh(gemGeo, rubyMat);
        gemMesh.position.set(0, 0.32, 0.48);
        turbanGroup.add(gemMesh);

        headGroup.add(turbanGroup);

        // Sacred Tilak / Third Eye Mark on Forehead
        const tilakGeo = new THREE.BoxGeometry(0.04, 0.14, 0.02);
        const tilakMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        const tilakMesh = new THREE.Mesh(tilakGeo, tilakMat);
        tilakMesh.position.set(0, 0.18, 0.42);
        headGroup.add(tilakMesh);

        const bindiGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const bindiMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
        const bindiMesh = new THREE.Mesh(bindiGeo, bindiMat);
        bindiMesh.position.set(0, 0.26, 0.42);
        headGroup.add(bindiMesh);

        // Eyes (Left & Right)
        const eyeSocketGeo = new THREE.SphereGeometry(0.07, 12, 12);

        const leftEyeSclera = new THREE.Mesh(eyeSocketGeo, scleraMat);
        leftEyeSclera.position.set(-0.16, 0.05, 0.36);
        leftEyeSclera.scale.set(1, 0.6, 0.5);
        headGroup.add(leftEyeSclera);

        const rightEyeSclera = new THREE.Mesh(eyeSocketGeo, scleraMat);
        rightEyeSclera.position.set(0.16, 0.05, 0.36);
        rightEyeSclera.scale.set(1, 0.6, 0.5);
        headGroup.add(rightEyeSclera);

        const pupilGeo = new THREE.SphereGeometry(0.04, 10, 10);

        const leftPupil = new THREE.Mesh(pupilGeo, eyeMat);
        leftPupil.position.set(-0.16, 0.05, 0.39);
        leftEyeRef.current = leftPupil;
        headGroup.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeo, eyeMat);
        rightPupil.position.set(0.16, 0.05, 0.39);
        rightEyeRef.current = rightPupil;
        headGroup.add(rightPupil);

        // Spiritual Beard & Mustache
        const mustacheGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 16, Math.PI);
        const beardMat = new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.9 });
        const mustache = new THREE.Mesh(mustacheGeo, beardMat);
        mustache.position.set(0, -0.1, 0.4);
        mustache.rotation.z = Math.PI;
        headGroup.add(mustache);

        // Stylized Beard Mesh
        const beardGeo = new THREE.ConeGeometry(0.24, 0.45, 12);
        const beardMesh = new THREE.Mesh(beardGeo, beardMat);
        beardMesh.position.set(0, -0.32, 0.32);
        beardMesh.rotation.x = -Math.PI / 10;
        headGroup.add(beardMesh);

        // Animated Jaw / Mouth for speech sync
        const mouthGeo = new THREE.SphereGeometry(0.07, 12, 8);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x4a1200 });
        const jawMesh = new THREE.Mesh(mouthGeo, mouthMat);
        jawMesh.position.set(0, -0.14, 0.39);
        jawMesh.scale.set(1, 0.3, 0.6);
        headGroup.add(jawMesh);
        jawMeshRef.current = jawMesh;

        guruGroup.add(headGroup);

        // ── 7. Floating Sacred Lotus Throne ──
        const lotusGroup = new THREE.Group();
        lotusGroup.position.set(0, -0.95, 0);

        const petalMat = new THREE.MeshStandardMaterial({
            color: 0xff66aa,
            roughness: 0.5,
            metalness: 0.1,
            emissive: 0x660033,
            emissiveIntensity: 0.3
        });

        // 12 Outer Lotus Petals
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const petalGeo = new THREE.ConeGeometry(0.18, 0.55, 6);
            const petal = new THREE.Mesh(petalGeo, petalMat);
            petal.position.set(Math.cos(angle) * 0.9, -0.05, Math.sin(angle) * 0.9);
            petal.rotation.x = Math.PI / 3;
            petal.rotation.y = 0;
            petal.rotation.z = -angle;
            lotusGroup.add(petal);
        }

        // Inner glowing golden lotus disc
        const lotusCenterGeo = new THREE.CylinderGeometry(0.85, 0.75, 0.12, 24);
        const lotusCenter = new THREE.Mesh(lotusCenterGeo, goldMat);
        lotusGroup.add(lotusCenter);

        guruGroup.add(lotusGroup);
        lotusRef.current = lotusGroup;

        // ── 8. Cosmic Halo & Sacred Geometry Wheel ──
        const haloGroup = new THREE.Group();
        haloGroup.position.set(0, 0.6, -0.3);

        // Outer Ring
        const haloOuterGeo = new THREE.TorusGeometry(0.85, 0.035, 12, 48);
        const haloOuterMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            wireframe: false
        });
        const haloOuter = new THREE.Mesh(haloOuterGeo, haloOuterMat);
        haloGroup.add(haloOuter);
        haloMeshRef.current = haloOuter;

        // Inner Sacred Mandalic Geometry
        const haloInnerGeo = new THREE.RingGeometry(0.4, 0.75, 12, 1);
        const haloInnerMat = new THREE.MeshBasicMaterial({
            color: 0xff9900,
            wireframe: true,
            transparent: true,
            opacity: 0.6
        });
        const haloInner = new THREE.Mesh(haloInnerGeo, haloInnerMat);
        haloGroup.add(haloInner);
        haloInnerRef.current = haloInner;

        guruGroup.add(haloGroup);

        // ── 9. Swirling Cosmic Stardust Particles ──
        const particleCount = 140;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const pColor1 = new THREE.Color(0xffd700); // Gold
        const pColor2 = new THREE.Color(0xff66cc); // Pink

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.8 + Math.random() * 1.6;
            const y = -1.0 + Math.random() * 2.4;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            const mixedColor = pColor1.clone().lerp(pColor2, Math.random());
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);
        particlesRef.current = particles;

        // ── 10. Pointer Tracking Event ──
        const handlePointerMove = (e: MouseEvent | TouchEvent) => {
            const rect = container.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

            // Normalized device coordinates (-1 to 1)
            const x = ((clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
            mousePosRef.current = { x, y };
        };

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('touchmove', handlePointerMove, { passive: true });

        // ── 11. Render / Animation Loop ──
        const clock = new THREE.Clock();
        let blinkTimer = 0;
        let isBlinking = false;

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();
            const delta = clock.getDelta();

            // A. Levitation & Floating Breathing
            if (guruGroupRef.current) {
                guruGroupRef.current.position.y = -0.15 + Math.sin(elapsedTime * 1.6) * 0.08;
                guruGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.4) * 0.05;
            }

            // B. Head tracking cursor with smooth lerping
            if (headGroupRef.current) {
                const targetRotY = mousePosRef.current.x * 0.35;
                const targetRotX = -mousePosRef.current.y * 0.25;

                headGroupRef.current.rotation.y += (targetRotY - headGroupRef.current.rotation.y) * 0.08;
                headGroupRef.current.rotation.x += (targetRotX - headGroupRef.current.rotation.x) * 0.08;

                // Speech head nod
                if (isSpeakingRef.current) {
                    headGroupRef.current.position.y = 0.58 + Math.sin(elapsedTime * 8) * 0.025;
                    headGroupRef.current.rotation.x += Math.sin(elapsedTime * 6) * 0.02;
                } else {
                    headGroupRef.current.position.y = 0.58;
                }
            }

            // C. Realistic Talking Mouth Animation
            if (jawMeshRef.current) {
                if (isSpeakingRef.current) {
                    // Rhythmic mouth morphing in sync with speaking frequencies
                    const openAmount = 0.3 + Math.abs(Math.sin(elapsedTime * 12)) * 0.8;
                    const widthAmount = 1.0 + Math.sin(elapsedTime * 8) * 0.2;
                    jawMeshRef.current.scale.set(widthAmount, openAmount, 0.6);
                } else {
                    // Gentle closed smile
                    jawMeshRef.current.scale.set(1.0, 0.25, 0.6);
                }
            }

            // D. Natural Eye Blinking
            blinkTimer += 0.016;
            if (blinkTimer > 3.5 + Math.sin(elapsedTime) * 1.5) {
                isBlinking = true;
                blinkTimer = 0;
            }
            if (isBlinking) {
                if (leftEyeRef.current && rightEyeRef.current) {
                    leftEyeRef.current.scale.y = 0.1;
                    rightEyeRef.current.scale.y = 0.1;
                }
                setTimeout(() => {
                    isBlinking = false;
                    if (leftEyeRef.current && rightEyeRef.current) {
                        leftEyeRef.current.scale.y = 1;
                        rightEyeRef.current.scale.y = 1;
                    }
                }, 140);
            }

            // E. Rotating Halo and Sacred Geometry
            if (haloMeshRef.current) {
                haloMeshRef.current.rotation.z += 0.008;
            }
            if (haloInnerRef.current) {
                haloInnerRef.current.rotation.z -= 0.012;
            }

            // F. Rotating Lotus Petals Base
            if (lotusRef.current) {
                lotusRef.current.rotation.y = Math.sin(elapsedTime * 0.8) * 0.08;
            }

            // G. Swirling Cosmic Particles
            if (particlesRef.current) {
                particlesRef.current.rotation.y = elapsedTime * 0.12;
                const positionsAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
                for (let i = 0; i < particleCount; i++) {
                    let y = positionsAttr.getY(i);
                    y += 0.005;
                    if (y > 1.8) y = -1.2;
                    positionsAttr.setY(i, y);
                }
                positionsAttr.needsUpdate = true;
            }

            // H. Pulsing Third Eye Divine Glow
            if (thirdEyeLightRef.current) {
                thirdEyeLightRef.current.intensity = 1.2 + Math.sin(elapsedTime * 3) * 0.6;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            if (!container || !rendererRef.current) return;
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            rendererRef.current.setSize(newW, newH);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
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
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
            title="3D LifePartner AI Guru — Move cursor to interact!"
        >
            {/* Ambient Cosmic Aura Background */}
            <div className="absolute inset-0 pointer-events-none bg-radial from-amber-500/10 via-purple-600/5 to-transparent blur-xl"></div>
        </div>
    );
}
