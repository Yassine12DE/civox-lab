import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function FloatingOrb({ position, color, scale = 1, speed = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(t) * 0.12;
    ref.current.rotation.x += 0.003;
    ref.current.rotation.y += 0.004;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        metalness={0.55}
      />
    </mesh>
  );
}

function RingShape({ position, color, speed = 1 }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.25;
    ref.current.rotation.y += 0.01;
    ref.current.rotation.z = Math.cos(t * 0.35) * 0.2;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[1.2, 0.16, 24, 100]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

function ParticleField() {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const count = 180;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#9D4EDD"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function CivoxScene() {
  return (
    <>
      <color attach="background" args={["#fbf9fd"]} />
      <fog attach="fog" args={["#fbf9fd", 8, 18]} />

      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 5, 3]} intensity={2} color="#ffffff" />
      <pointLight position={[-4, 1, 2]} intensity={18} color="#7B2CBF" />
      <pointLight position={[3, -1, 2]} intensity={14} color="#FF6B35" />

      <ParticleField />

      <Float speed={1.5} rotationIntensity={0.45} floatIntensity={0.8}>
        <FloatingOrb position={[-1.9, 0.4, 0]} color="#7B2CBF" scale={0.95} speed={0.9} />
      </Float>

      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.9}>
        <FloatingOrb position={[1.8, -0.15, -0.6]} color="#FF6B35" scale={0.72} speed={1.15} />
      </Float>

      <Float speed={1.3} rotationIntensity={0.35} floatIntensity={0.75}>
        <FloatingOrb position={[0, 1.1, -1.5]} color="#9D4EDD" scale={0.55} speed={1} />
      </Float>

      <Float speed={0.95} rotationIntensity={0.3} floatIntensity={0.55}>
        <RingShape position={[0.1, 0.02, -0.2]} color="#5A189A" speed={0.8} />
      </Float>

      <mesh position={[0, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.4, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0.05} />
      </mesh>
    </>
  );
}

export default function CivoxHero3D() {
  return (
    <div className="home-hero-3d">
      <div className="home-hero-3d-bg home-hero-3d-bg--one" />
      <div className="home-hero-3d-bg home-hero-3d-bg--two" />
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 42 }}
        dpr={[1, 1.8]}
      >
        <CivoxScene />
      </Canvas>
    </div>
  );
}