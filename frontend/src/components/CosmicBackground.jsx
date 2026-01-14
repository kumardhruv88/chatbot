import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CosmicBackground = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000; // Reduced count for better performance
        const posArray = new Float32Array(particlesCount * 3);
        const colorsArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15; // Spread out more
            colorsArray[i] = Math.random();
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

        // Material with slight glow effect
        const material = new THREE.PointsMaterial({
            size: 0.015,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        // Mesh
        const particlesMesh = new THREE.Points(particlesGeometry, material);
        scene.add(particlesMesh);



        camera.position.z = 3;

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;

        const animate = () => {
            requestAnimationFrame(animate);

            // Gentle rotation
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0002;



            // Mouse parallax
            particlesMesh.rotation.x += mouseY * 0.00005;
            particlesMesh.rotation.y += mouseX * 0.00005;

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        const handleMouseMove = (event) => {
            mouseX = event.clientX - window.innerWidth / 2;
            mouseY = event.clientY - window.innerHeight / 2;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            particlesGeometry.dispose();
            material.dispose();

        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
                background: 'radial-gradient(circle at center, #0a0a1a 0%, #000000 100%)'
            }}
        />
    );
};

export default CosmicBackground;
