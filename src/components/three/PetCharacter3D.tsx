import React, { Suspense, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterId, PetAnimationState } from '../../types/game';
import { CHARACTERS, getEvolutionStage } from '../../data/characters';

interface PetCharacter3DProps {
  characterId: CharacterId;
  animation: PetAnimationState;
  level?: number;
  equippedOutfits?: string[];
  onClick?: () => void;
  interactive?: boolean;
  scale?: number;
}

// Optional GLB/GLTF loader sub-component when a custom model URL is provided
function ExternalGlbModel({ url, scale }: { url: string; scale: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={scale} />;
}

class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const PetCharacter3D: React.FC<PetCharacter3DProps> = ({
  characterId,
  animation,
  level = 1,
  equippedOutfits = [],
  onClick,
  interactive = true,
  scale = 1,
}) => {
  const char = CHARACTERS[characterId];
  const evo = getEvolutionStage(characterId, level);

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);

  const [hovered, setHovered] = useState(false);
  const tapBounceRef = useRef(0);
  const blinkTimerRef = useRef(0);

  const hasGlasses =
    equippedOutfits.includes('outfit_expensive_sunglasses') ||
    evo.accessoryProp === 'suit_glasses';
  const hasNecklace = equippedOutfits.includes('outfit_luxury_necklace');
  const hasPartyHat = equippedOutfits.includes('outfit_party_hat');
  const hasTie = evo.accessoryProp === 'tie' || evo.accessoryProp === 'suit_glasses';
  const hasCrownCape = evo.accessoryProp === 'crown_cape';

  const finalScale = scale * evo.scaleBonus;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const root = rootRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const tail = tailRef.current;
    if (!root || !body || !head) return;

    // Tap squish decay
    if (tapBounceRef.current > 0) {
      tapBounceRef.current = Math.max(0, tapBounceRef.current - delta * 4.5);
    }
    const squish = Math.sin(tapBounceRef.current * Math.PI) * 0.14;

    // Natural eye blinking (every ~3.2s)
    blinkTimerRef.current += delta;
    const blinkCycle = blinkTimerRef.current % 3.4;
    const isBlinking = animation !== 'sleep' && blinkCycle > 3.22;
    const eyeScaleY = animation === 'sleep' ? 0.1 : isBlinking ? 0.12 : animation === 'surprise' ? 1.28 : 1;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, eyeScaleY, 0.35);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, eyeScaleY, 0.35);
    }

    // Defaults
    let targetY = 0;
    let targetZ = 0;
    let targetRotY = Math.sin(t * 0.7) * 0.12;
    let targetRotZ = 0;
    let headRotX = Math.sin(t * 1.4) * 0.04;
    let headRotZ = Math.sin(t * 0.9) * 0.06;
    let earDroop = 0;
    let tailSpeed = 4.5;
    let tailAmp = 0.25;
    let breathY = 1 + Math.sin(t * 2.6) * 0.025;
    let breathX = 1 - Math.sin(t * 2.6) * 0.015;

    switch (animation) {
      case 'idle':
        targetY = Math.abs(Math.sin(t * 1.5)) * 0.03;
        break;
      case 'happy':
        targetY = Math.abs(Math.sin(t * 8.5)) * 0.42;
        targetRotY = t * 4.2;
        headRotZ = Math.sin(t * 10) * 0.16;
        tailSpeed = 16;
        tailAmp = 0.55;
        break;
      case 'play':
        targetY = Math.abs(Math.sin(t * 10)) * 0.36;
        targetRotY = Math.sin(t * 4.5) * 0.85;
        targetRotZ = Math.sin(t * 6) * 0.14;
        headRotZ = Math.sin(t * 8) * 0.2;
        tailSpeed = 14;
        tailAmp = 0.45;
        break;
      case 'eat':
        headRotX = 0.22 + Math.sin(t * 14) * 0.16;
        breathY = 1 + Math.sin(t * 14) * 0.05;
        breathX = 1 - Math.sin(t * 14) * 0.04;
        tailSpeed = 10;
        break;
      case 'sad':
        targetY = -0.08;
        headRotX = 0.32;
        headRotZ = Math.sin(t * 2) * 0.05;
        earDroop = 0.55;
        tailSpeed = 1.2;
        tailAmp = 0.06;
        break;
      case 'sleep':
        targetY = -0.22;
        headRotX = 0.28;
        headRotZ = 0.18;
        breathY = 1 + Math.sin(t * 1.3) * 0.04;
        breathX = 1.08 - Math.sin(t * 1.3) * 0.03;
        earDroop = 0.35;
        tailSpeed = 0.8;
        tailAmp = 0.05;
        break;
      case 'angry':
        targetY = Math.abs(Math.sin(t * 14)) * 0.12;
        targetRotZ = Math.sin(t * 22) * 0.07;
        headRotX = 0.12;
        breathX = 1.12;
        breathY = 1.05;
        tailSpeed = 12;
        tailAmp = 0.35;
        break;
      case 'surprise':
        targetY = 0.22 + Math.sin(t * 10) * 0.05;
        targetZ = -0.25;
        breathY = 1.12;
        breathX = 0.92;
        headRotX = -0.18;
        break;
      case 'levelup':
        targetY = 0.25 + Math.sin(t * 6) * 0.15;
        targetRotY = t * 5.2;
        tailSpeed = 18;
        tailAmp = 0.6;
        break;
    }

    root.position.y = THREE.MathUtils.lerp(root.position.y, targetY, 0.16);
    root.position.z = THREE.MathUtils.lerp(root.position.z, targetZ, 0.14);
    root.rotation.y =
      animation === 'happy' || animation === 'levelup'
        ? targetRotY
        : THREE.MathUtils.lerp(root.rotation.y, targetRotY, 0.1);
    root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, targetRotZ, 0.14);

    body.scale.set(
      (breathX + squish) * (hovered && interactive ? 1.03 : 1),
      (breathY - squish) * (hovered && interactive ? 1.03 : 1),
      (breathX + squish) * (hovered && interactive ? 1.03 : 1)
    );

    head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headRotX, 0.16);
    head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headRotZ, 0.16);

    if (tail) {
      tail.rotation.y = Math.sin(t * tailSpeed) * tailAmp;
      tail.rotation.z = Math.cos(t * tailSpeed * 0.5) * (tailAmp * 0.4);
    }

    if (leftEarRef.current && rightEarRef.current) {
      leftEarRef.current.rotation.z = THREE.MathUtils.lerp(leftEarRef.current.rotation.z, 0.18 + earDroop, 0.14);
      rightEarRef.current.rotation.z = THREE.MathUtils.lerp(rightEarRef.current.rotation.z, -0.18 - earDroop, 0.14);
    }

    // Cute arm & leg motion
    const limbWave =
      animation === 'happy' || animation === 'play' || animation === 'levelup'
        ? Math.sin(t * 12) * 0.55
        : animation === 'angry'
        ? Math.sin(t * 18) * 0.35
        : Math.sin(t * 2) * 0.08;
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = limbWave;
      rightArmRef.current.rotation.x = -limbWave;
    }
    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.x = animation === 'angry' ? Math.abs(Math.sin(t * 16)) * 0.5 : -limbWave * 0.5;
      rightLegRef.current.rotation.x = animation === 'angry' ? Math.abs(Math.cos(t * 16)) * 0.5 : limbWave * 0.5;
    }
  });

  const handlePointerDown = () => {
    if (!interactive) return;
    tapBounceRef.current = 1;
    onClick?.();
  };

  const proceduralPet = (
    <group
      ref={rootRef}
      scale={finalScale}
      onClick={(e) => {
        e.stopPropagation();
        handlePointerDown();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (interactive) {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <group ref={bodyRef}>
        {/* PLUMP CHUBBY TORSO */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.56, 32, 32]} />
          <meshStandardMaterial color={char.colors.primary} roughness={0.62} metalness={0.04} />
        </mesh>

        {/* SOFT BELLY PATCH */}
        <mesh position={[0, 0.5, 0.38]} scale={[0.72, 0.78, 0.45]} castShadow>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={char.colors.secondary} roughness={0.75} />
        </mesh>

        {/* SHORT CUTE ARMS / WINGS */}
        <mesh ref={leftArmRef} position={[-0.5, 0.58, 0.14]} rotation={[0, 0, 0.45]} castShadow>
          <capsuleGeometry args={[0.13, 0.22, 8, 16]} />
          <meshStandardMaterial
            color={characterId === 'duck' ? char.colors.primary : char.colors.primary}
            roughness={0.65}
          />
        </mesh>
        <mesh ref={rightArmRef} position={[0.5, 0.58, 0.14]} rotation={[0, 0, -0.45]} castShadow>
          <capsuleGeometry args={[0.13, 0.22, 8, 16]} />
          <meshStandardMaterial color={char.colors.primary} roughness={0.65} />
        </mesh>

        {/* STUBBY LEGS / FEET */}
        <mesh ref={leftLegRef} position={[-0.24, 0.15, 0.12]} castShadow>
          <capsuleGeometry args={[0.14, 0.14, 8, 16]} />
          <meshStandardMaterial
            color={characterId === 'duck' ? char.colors.accent : char.colors.secondary}
            roughness={0.7}
          />
        </mesh>
        <mesh ref={rightLegRef} position={[0.24, 0.15, 0.12]} castShadow>
          <capsuleGeometry args={[0.14, 0.14, 8, 16]} />
          <meshStandardMaterial
            color={characterId === 'duck' ? char.colors.accent : char.colors.secondary}
            roughness={0.7}
          />
        </mesh>

        {/* SPECIES TAIL */}
        <group ref={tailRef} position={[0, 0.42, -0.5]}>
          {characterId === 'cat' ? (
            <mesh position={[0, 0.24, -0.14]} rotation={[-0.6, 0, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.5, 8, 16]} />
              <meshStandardMaterial color={char.colors.accent} roughness={0.65} />
            </mesh>
          ) : (
            <mesh castShadow>
              <sphereGeometry args={[characterId === 'rabbit' ? 0.19 : 0.15, 16, 16]} />
              <meshStandardMaterial color={char.colors.secondary} roughness={0.75} />
            </mesh>
          )}
        </group>

        {/* EVOLUTION: TIE */}
        {hasTie && (
          <group position={[0, 0.72, 0.52]}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.13, 0.1, 0.08]} />
              <meshStandardMaterial color="#D95D5D" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.18, 0.02]} rotation={[0, 0, Math.PI]} castShadow>
              <coneGeometry args={[0.09, 0.32, 4]} />
              <meshStandardMaterial color="#C84B4B" roughness={0.5} />
            </mesh>
          </group>
        )}

        {/* EVOLUTION: ROYAL CAPE */}
        {hasCrownCape && (
          <mesh position={[0, 0.52, -0.45]} rotation={[0.28, 0, 0]} castShadow>
            <coneGeometry args={[0.62, 0.85, 24, 1, true, -Math.PI * 0.45, Math.PI * 0.9]} />
            <meshStandardMaterial color="#C94A5A" side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
        )}

        {/* SHOP OUTFIT: LUXURY NECKLACE */}
        {hasNecklace && (
          <group position={[0, 0.82, 0.04]} rotation={[Math.PI / 2 + 0.2, 0, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.42, 0.045, 12, 28]} />
              <meshStandardMaterial color="#FFD166" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.44, 0.02]} castShadow>
              <octahedronGeometry args={[0.11]} />
              <meshStandardMaterial color="#8CE6FF" metalness={0.3} roughness={0.1} emissive="#5EC8FF" emissiveIntensity={0.35} />
            </mesh>
          </group>
        )}

        {/* BIG CUTE ROUND HEAD */}
        <group ref={headRef} position={[0, 1.24, 0.04]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.58, 32, 32]} />
            <meshStandardMaterial color={char.colors.primary} roughness={0.58} metalness={0.03} />
          </mesh>

          {/* CORGI / BEAR SNOUT PATCH */}
          {(characterId === 'corgi' || characterId === 'bear') && (
            <mesh position={[0, -0.1, 0.46]} scale={[1.15, 0.85, 0.72]} castShadow>
              <sphereGeometry args={[0.24, 24, 24]} />
              <meshStandardMaterial color={char.colors.secondary} roughness={0.7} />
            </mesh>
          )}

          {/* DUCK CUTE ORANGE BILL */}
          {characterId === 'duck' ? (
            <mesh position={[0, -0.07, 0.55]} scale={[1.35, 0.55, 0.9]} castShadow>
              <sphereGeometry args={[0.19, 20, 20]} />
              <meshStandardMaterial color={char.colors.accent} roughness={0.45} />
            </mesh>
          ) : (
            /* CUTE BUTTON NOSE */
            <mesh position={[0, -0.04, 0.58]} castShadow>
              <sphereGeometry args={[0.065, 16, 16]} />
              <meshStandardMaterial color="#3D3430" roughness={0.3} />
            </mesh>
          )}

          {/* BIG EXPRESSIVE GLOSSY EYES */}
          <group ref={leftEyeRef} position={[-0.21, 0.09, 0.49]}>
            <mesh>
              <sphereGeometry args={[0.095, 20, 20]} />
              <meshStandardMaterial color="#2D2623" roughness={0.15} metalness={0.2} />
            </mesh>
            {/* Eye sparkle */}
            <mesh position={[0.03, 0.035, 0.075]}>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>

          <group ref={rightEyeRef} position={[0.21, 0.09, 0.49]}>
            <mesh>
              <sphereGeometry args={[0.095, 20, 20]} />
              <meshStandardMaterial color="#2D2623" roughness={0.15} metalness={0.2} />
            </mesh>
            <mesh position={[0.03, 0.035, 0.075]}>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>

          {/* ANGRY EYEBROWS */}
          {animation === 'angry' && (
            <>
              <mesh position={[-0.21, 0.22, 0.53]} rotation={[0, 0, -0.35]}>
                <boxGeometry args={[0.18, 0.045, 0.04]} />
                <meshStandardMaterial color="#3D3430" />
              </mesh>
              <mesh position={[0.21, 0.22, 0.53]} rotation={[0, 0, 0.35]}>
                <boxGeometry args={[0.18, 0.045, 0.04]} />
                <meshStandardMaterial color="#3D3430" />
              </mesh>
            </>
          )}

          {/* ROSY CHEEKS (Puffed when angry!) */}
          <mesh
            position={[-0.36, -0.06, 0.42]}
            scale={animation === 'angry' ? [1.45, 1.3, 1.2] : [1.1, 0.75, 0.6]}
          >
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={char.colors.cheek} roughness={0.8} transparent opacity={0.85} />
          </mesh>
          <mesh
            position={[0.36, -0.06, 0.42]}
            scale={animation === 'angry' ? [1.45, 1.3, 1.2] : [1.1, 0.75, 0.6]}
          >
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color={char.colors.cheek} roughness={0.8} transparent opacity={0.85} />
          </mesh>

          {/* CAT WHISKERS */}
          {characterId === 'cat' && (
            <group position={[0, -0.06, 0.5]}>
              {[-1, 1].map((side) => (
                <group key={side}>
                  <mesh position={[side * 0.36, 0.03, 0]} rotation={[0, 0, side * 0.12]}>
                    <boxGeometry args={[0.24, 0.015, 0.015]} />
                    <meshStandardMaterial color="#544C48" />
                  </mesh>
                  <mesh position={[side * 0.36, -0.04, 0]} rotation={[0, 0, -side * 0.08]}>
                    <boxGeometry args={[0.24, 0.015, 0.015]} />
                    <meshStandardMaterial color="#544C48" />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* SPECIES EARS */}
          {characterId === 'corgi' && (
            <>
              <group ref={leftEarRef} position={[-0.34, 0.46, 0.04]} rotation={[0, 0, 0.25]}>
                <mesh castShadow>
                  <coneGeometry args={[0.2, 0.48, 16]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.02, 0.09]} scale={[0.55, 0.7, 0.4]}>
                  <coneGeometry args={[0.18, 0.4, 12]} />
                  <meshStandardMaterial color="#FAD7D0" roughness={0.8} />
                </mesh>
              </group>
              <group ref={rightEarRef} position={[0.34, 0.46, 0.04]} rotation={[0, 0, -0.25]}>
                <mesh castShadow>
                  <coneGeometry args={[0.2, 0.48, 16]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
                </mesh>
                <mesh position={[0, -0.02, 0.09]} scale={[0.55, 0.7, 0.4]}>
                  <coneGeometry args={[0.18, 0.4, 12]} />
                  <meshStandardMaterial color="#FAD7D0" roughness={0.8} />
                </mesh>
              </group>
            </>
          )}

          {characterId === 'cat' && (
            <>
              <group ref={leftEarRef} position={[-0.35, 0.45, 0.02]} rotation={[0, 0, 0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.18, 0.36, 4]} />
                  <meshStandardMaterial color={char.colors.accent} roughness={0.6} />
                </mesh>
              </group>
              <group ref={rightEarRef} position={[0.35, 0.45, 0.02]} rotation={[0, 0, -0.32]}>
                <mesh castShadow>
                  <coneGeometry args={[0.18, 0.36, 4]} />
                  <meshStandardMaterial color={char.colors.accent} roughness={0.6} />
                </mesh>
              </group>
            </>
          )}

          {characterId === 'rabbit' && (
            <>
              <group ref={leftEarRef} position={[-0.22, 0.62, 0.0]} rotation={[0, 0, 0.16]}>
                <mesh castShadow>
                  <capsuleGeometry args={[0.13, 0.56, 8, 16]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0, 0.08]} scale={[0.55, 0.8, 0.5]}>
                  <capsuleGeometry args={[0.12, 0.48, 8, 12]} />
                  <meshStandardMaterial color={char.colors.accent} roughness={0.75} />
                </mesh>
              </group>
              <group ref={rightEarRef} position={[0.22, 0.62, 0.0]} rotation={[0, 0, -0.16]}>
                <mesh castShadow>
                  <capsuleGeometry args={[0.13, 0.56, 8, 16]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0, 0.08]} scale={[0.55, 0.8, 0.5]}>
                  <capsuleGeometry args={[0.12, 0.48, 8, 12]} />
                  <meshStandardMaterial color={char.colors.accent} roughness={0.75} />
                </mesh>
              </group>
            </>
          )}

          {characterId === 'bear' && (
            <>
              <group ref={leftEarRef} position={[-0.42, 0.42, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.19, 20, 20]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.65} />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                  <sphereGeometry args={[0.11, 16, 16]} />
                  <meshStandardMaterial color={char.colors.secondary} roughness={0.75} />
                </mesh>
              </group>
              <group ref={rightEarRef} position={[0.42, 0.42, 0]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.19, 20, 20]} />
                  <meshStandardMaterial color={char.colors.primary} roughness={0.65} />
                </mesh>
                <mesh position={[0, 0, 0.1]}>
                  <sphereGeometry args={[0.11, 16, 16]} />
                  <meshStandardMaterial color={char.colors.secondary} roughness={0.75} />
                </mesh>
              </group>
            </>
          )}

          {characterId === 'duck' && (
            <group ref={leftEarRef} position={[0, 0.58, 0.05]}>
              <mesh rotation={[0.2, 0, 0.2]} castShadow>
                <capsuleGeometry args={[0.06, 0.16, 8, 12]} />
                <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
              </mesh>
              <mesh position={[0.07, -0.02, -0.03]} rotation={[-0.1, 0, -0.3]} castShadow>
                <capsuleGeometry args={[0.05, 0.12, 8, 12]} />
                <meshStandardMaterial color={char.colors.primary} roughness={0.6} />
              </mesh>
            </group>
          )}

          {/* SUNGLASSES (Shop or Evolution) */}
          {hasGlasses && (
            <group position={[0, 0.09, 0.57]}>
              <mesh position={[-0.21, 0, 0]} castShadow>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshStandardMaterial color="#1F1D20" metalness={0.85} roughness={0.12} />
              </mesh>
              <mesh position={[0.21, 0, 0]} castShadow>
                <boxGeometry args={[0.25, 0.15, 0.05]} />
                <meshStandardMaterial color="#1F1D20" metalness={0.85} roughness={0.12} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.16, 0.035, 0.04]} />
                <meshStandardMaterial color="#FFD166" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* PARTY HAT */}
          {hasPartyHat && !hasCrownCape && (
            <group position={[0, 0.72, 0]} rotation={[0, 0, -0.08]}>
              <mesh castShadow>
                <coneGeometry args={[0.2, 0.42, 20]} />
                <meshStandardMaterial color="#A9BCE0" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.23, 0]}>
                <sphereGeometry args={[0.07, 14, 14]} />
                <meshStandardMaterial color="#F4B9AE" roughness={0.6} />
              </mesh>
            </group>
          )}

          {/* EVOLUTION STAGE 3: ROYAL CROWN */}
          {hasCrownCape && (
            <group position={[0, 0.64, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.24, 0.19, 0.2, 8]} />
                <meshStandardMaterial color="#FFD166" metalness={0.75} roughness={0.22} />
              </mesh>
              <mesh position={[0, 0.02, 0.21]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial color="#F26B7A" emissive="#F26B7A" emissiveIntensity={0.4} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* FLOATING ZZZ WHEN SLEEPING */}
      {animation === 'sleep' && (
        <Float speed={2.5} floatIntensity={0.4} position={[0.6, 1.85, 0.2]}>
          <Text fontSize={0.28} color="#7F99CC" anchorX="center" anchorY="middle">
            Zzz...
          </Text>
        </Float>
      )}

      {/* LEVEL UP GOLDEN SPARKLES */}
      {(animation === 'levelup' || animation === 'happy') && (
        <Sparkles
          count={animation === 'levelup' ? 40 : 16}
          scale={2.4}
          size={animation === 'levelup' ? 5 : 3}
          speed={1.2}
          color={animation === 'levelup' ? '#FFD166' : '#F4B9AE'}
          position={[0, 1.1, 0]}
        />
      )}
    </group>
  );

  // If a custom GLB URL is configured on the character, try loading it with seamless procedural fallback
  if (char.glbUrl) {
    return (
      <ModelErrorBoundary fallback={proceduralPet}>
        <Suspense fallback={proceduralPet}>
          <ExternalGlbModel url={char.glbUrl} scale={finalScale} />
        </Suspense>
      </ModelErrorBoundary>
    );
  }

  return proceduralPet;
};
