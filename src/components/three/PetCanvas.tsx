import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';

interface PetCanvasProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  enableZoom?: boolean;
  className?: string;
}

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-cream-light p-6 text-center text-cocoa">
          <div className="mb-2 text-4xl">🐾</div>
          <p className="font-bold">3D 렌더링을 불러오는 중 문제가 발생했습니다.</p>
          <p className="mt-1 text-sm text-cocoa-light">
            브라우저의 WebGL 설정을 확인하거나 페이지를 새로고침해 주세요.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const PetCanvas: React.FC<PetCanvasProps> = ({
  children,
  cameraPosition = [0, 1.65, 5.2],
  fov = 38,
  enableZoom = false,
  className = '',
}) => {
  return (
    <WebGLErrorBoundary>
      <div className={`relative h-full w-full ${className}`}>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: cameraPosition, fov }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        >
          <ambientLight intensity={0.85} color="#FFF8F0" />
          <directionalLight
            position={[4, 7, 5]}
            intensity={1.15}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={1}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
            color="#FFF4E6"
          />
          <directionalLight position={[-4, 3, -2]} intensity={0.45} color="#CFDDF2" />
          <Suspense fallback={null}>
            {children}
            <Environment preset="apartment" environmentIntensity={0.35} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={enableZoom}
            minDistance={3.2}
            maxDistance={7.5}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.15}
            minAzimuthAngle={-Math.PI / 3.2}
            maxAzimuthAngle={Math.PI / 3.2}
          />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
};
