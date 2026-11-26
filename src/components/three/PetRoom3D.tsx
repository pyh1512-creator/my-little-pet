import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { RoomSettings } from '../../types/game';

interface PetRoom3DProps {
  room: RoomSettings;
  children?: React.ReactNode;
}

const WALL_COLORS: Record<RoomSettings['wallpaper'], { wall: string; accent: string; floor: string }> = {
  cream: { wall: '#F8F1E7', accent: '#EDE0D1', floor: '#E8D5C0' },
  mint: { wall: '#E5F0EA', accent: '#CFE3D8', floor: '#E3D4C3' },
  lavender: { wall: '#EAEFF8', accent: '#CFDDF2', floor: '#E5D8CC' },
  peach: { wall: '#FCECE8', accent: '#FAD7D0', floor: '#E8D3C2' },
};

export const PetRoom3D: React.FC<PetRoom3DProps> = ({ room, children }) => {
  const palette = WALL_COLORS[room.wallpaper] || WALL_COLORS.cream;
  const has = (id: string) => room.placedFurniture.includes(id);

  return (
    <group position={[0, -0.7, 0]}>
      {/* COZY DIORAMA FLOOR */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[7.2, 7.2, 0.25]} />
        <meshStandardMaterial color={palette.floor} roughness={0.82} />
      </mesh>

      {/* BACK WALL */}
      <mesh position={[0, 2.2, -3.48]} receiveShadow>
        <boxGeometry args={[7.2, 4.6, 0.24]} />
        <meshStandardMaterial color={palette.wall} roughness={0.9} />
      </mesh>

      {/* LEFT WALL */}
      <mesh position={[-3.48, 2.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[7.2, 4.6, 0.24]} />
        <meshStandardMaterial color={palette.accent} roughness={0.9} />
      </mesh>

      {/* BASEBOARD TRIM */}
      <mesh position={[0, 0.2, -3.34]}>
        <boxGeometry args={[7.0, 0.22, 0.08]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
      </mesh>
      <mesh position={[-3.34, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[7.0, 0.22, 0.08]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
      </mesh>

      {/* SUNLIT PASTEL WINDOW ON BACK WALL */}
      <group position={[-0.9, 2.4, -3.32]}>
        <mesh>
          <boxGeometry args={[1.9, 1.5, 0.12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.65, 1.25]} />
          <meshBasicMaterial color="#CFE9FF" />
        </mesh>
        {/* Window crossbars */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[1.7, 0.07, 0.06]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[0.07, 1.3, 0.06]} />
          <meshStandardMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* CUTE FRAMED WALL ART */}
      <group position={[1.4, 2.45, -3.33]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.9, 0.08]} />
          <meshStandardMaterial color="#D9B99B" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.92, 0.72]} />
          <meshStandardMaterial color="#FFF8F0" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial color="#F4B9AE" />
        </mesh>
      </group>

      {/* === PLACED FURNITURE & DECOR === */}

      {/* MINT CIRCULAR RUG */}
      {has('decor_rug') && (
        <mesh position={[0, 0.135, 0.1]} receiveShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.04, 36]} />
          <meshStandardMaterial color="#A8CBB9" roughness={0.95} />
        </mesh>
      )}

      {/* PASTEL VELVET SOFA */}
      {has('furn_pastel_sofa') && (
        <group position={[-0.2, 0.12, -2.35]}>
          {/* Seat */}
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.45, 0.95]} />
            <meshStandardMaterial color="#F4B9AE" roughness={0.85} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.85, -0.35]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.72, 0.28]} />
            <meshStandardMaterial color="#F4B9AE" roughness={0.85} />
          </mesh>
          {/* Armrests */}
          <mesh position={[-1.02, 0.56, 0]} castShadow>
            <boxGeometry args={[0.26, 0.55, 0.95]} />
            <meshStandardMaterial color="#EDA698" roughness={0.85} />
          </mesh>
          <mesh position={[1.02, 0.56, 0]} castShadow>
            <boxGeometry args={[0.26, 0.55, 0.95]} />
            <meshStandardMaterial color="#EDA698" roughness={0.85} />
          </mesh>
          {/* Cute Cushion */}
          <mesh position={[0.55, 0.72, -0.08]} rotation={[0.1, 0, -0.15]} castShadow>
            <boxGeometry args={[0.42, 0.38, 0.16]} />
            <meshStandardMaterial color="#FFF8F0" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* CLOUD BED */}
      {has('furn_cloud_bed') && (
        <group position={[-2.15, 0.14, 1.1]}>
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.92, 0.96, 0.3, 28]} />
            <meshStandardMaterial color="#FBF7F2" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.33, 0]} receiveShadow>
            <cylinderGeometry args={[0.74, 0.76, 0.08, 24]} />
            <meshStandardMaterial color="#CFDDF2" roughness={0.95} />
          </mesh>
          {/* Pillow */}
          <mesh position={[-0.25, 0.42, -0.25]} rotation={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.48, 0.16, 0.32]} />
            <meshStandardMaterial color="#FAD7D0" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* EXECUTIVE BOSS CHAIR & MINI DESK */}
      {has('furn_boss_chair') && (
        <group position={[2.05, 0.12, -1.75]} rotation={[0, -0.45, 0]}>
          {/* Swivel Base */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.45, 0.08, 12]} />
            <meshStandardMaterial color="#4A4441" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.38, 12]} />
            <meshStandardMaterial color="#706965" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Seat */}
          <mesh position={[0, 0.54, 0]} castShadow>
            <boxGeometry args={[0.82, 0.16, 0.76]} />
            <meshStandardMaterial color="#544C48" roughness={0.45} />
          </mesh>
          {/* Tall Executive Backrest */}
          <mesh position={[0, 1.15, -0.32]} castShadow>
            <boxGeometry args={[0.78, 1.15, 0.16]} />
            <meshStandardMaterial color="#544C48" roughness={0.45} />
          </mesh>
          {/* Gold Trim */}
          <mesh position={[0, 1.68, -0.23]}>
            <boxGeometry args={[0.32, 0.08, 0.04]} />
            <meshStandardMaterial color="#FFD166" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* WOODEN DINING TABLE & FOOD BOWL */}
      {has('furn_dining_table') && (
        <group position={[2.1, 0.12, 1.1]}>
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.68, 0.09, 24]} />
            <meshStandardMaterial color="#D6B18D" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 0.5, 16]} />
            <meshStandardMaterial color="#C19A74" roughness={0.75} />
          </mesh>
          {/* Cute Ceramic Bowl */}
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.2, 0.14, 20]} />
            <meshStandardMaterial color="#F4B9AE" roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* FULL MOON MOOD LAMP */}
      {has('furn_mood_lamp') && (
        <group position={[-2.45, 0.12, -2.35]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.3, 0.1, 16]} />
            <meshStandardMaterial color="#D6B18D" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.7, 12]} />
            <meshStandardMaterial color="#D6B18D" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              color="#FFF2CC"
              emissive="#FFE199"
              emissiveIntensity={0.85}
              roughness={0.3}
            />
          </mesh>
          <pointLight position={[0, 1.85, 0.3]} intensity={1.1} distance={5} color="#FFE7B3" />
        </group>
      )}

      {/* MONSTERA PLANT */}
      {has('decor_plant') && (
        <group position={[-2.55, 0.12, -0.7]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.22, 0.52, 18]} />
            <meshStandardMaterial color="#FFF8F0" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <dodecahedronGeometry args={[0.34, 1]} />
            <meshStandardMaterial color="#7FAE96" roughness={0.75} />
          </mesh>
          <mesh position={[0.18, 0.96, 0.1]} castShadow>
            <dodecahedronGeometry args={[0.22, 1]} />
            <meshStandardMaterial color="#A8CBB9" roughness={0.75} />
          </mesh>
        </group>
      )}

      {/* PET CHARACTER SLOT */}
      <group position={[0, 0.14, 0.1]}>{children}</group>

      <ContactShadows
        position={[0, 0.15, 0]}
        opacity={0.32}
        scale={7}
        blur={2.2}
        far={3}
        color="#544C48"
      />
    </group>
  );
};
