// components/garage/GarageScene.tsx
// Redline Garage - High-Polish Industrial Midnight Workshop with Clean Studio Lighting

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  MeshReflectorMaterial,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { CarConfig, QualitySetting } from "@/lib/garage/types";
import { ModularCar } from "./ModularCar";

interface GarageSceneProps {
  config: CarConfig;
  quality: QualitySetting;
  autoRotate?: boolean;
}

const GarageEnvironment: React.FC<{ quality: QualitySetting }> = ({ quality }) => {
  const isHigh = quality === "high";
  const isLow = quality === "low";
  const lampRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (lampRef.current) {
      const t = state.clock.getElapsedTime();
      lampRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <>
      {/* 1. 环境光与摄影棚三点布光 */}
      <ambientLight intensity={1.5} color="#f8fafc" />

      {/* 主摄影射灯 (Key Light) */}
      <directionalLight
        position={[6, 9, 6]}
        intensity={3.6}
        color="#ffffff"
        castShadow={isHigh}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* 侧向冷调青蓝反光 (Rim Fill Light) */}
      <directionalLight position={[-7, 5, -4]} intensity={2.4} color="#7dd3fc" />

      {/* 后方暖色轮廓光 (Backlight) */}
      <directionalLight position={[0, 5, -7]} intensity={2.6} color="#fdba74" />

      {/* 地面漫反射补光 */}
      <directionalLight position={[0, -2, 0]} intensity={0.8} color="#cbd5e1" />

      {/* 2. 背景墙面 (干净大气的工矿墙体，无任何悬空矩形与穿帮红方块) */}
      <group position={[0, 4, -8]}>
        <mesh>
          <planeGeometry args={[32, 14]} />
          <meshStandardMaterial color="#1a1e27" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* 墙面极简水平发光装饰线 */}
        <mesh position={[0, 2.0, 0.05]}>
          <planeGeometry args={[18, 0.12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 3. 顶置工业吊灯 */}
      <group ref={lampRef} position={[0, 5.5, 0]}>
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.85, 0.4, 24, 1, true]} />
          <meshStandardMaterial color="#1e222a" roughness={0.4} metalness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#fffbeb" />
        </mesh>
        <spotLight
          position={[0, -0.1, 0]}
          target-position={[0, 0, 0]}
          intensity={6.0}
          angle={0.9}
          penumbra={0.6}
          color="#fffdf5"
          distance={16}
          castShadow={isHigh}
        />
        {!isLow && (
          <mesh position={[0, -2.2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[2.4, 4.4, 32, 1, true]} />
            <meshBasicMaterial
              color="#fff4cc"
              transparent
              opacity={0.04}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* 4. 高光工矿反光地坪 */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[45, 45]} />
        {!isLow ? (
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={isHigh ? 1024 : 512}
            mirror={0.8}
            mixBlur={0.5}
            mixStrength={2.0}
            roughness={0.2}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#222733"
            metalness={0.7}
          />
        ) : (
          <meshStandardMaterial color="#222733" roughness={0.3} metalness={0.5} />
        )}
      </mesh>

      {/* 5. 地面工位警示黄线 */}
      <group position={[0, 0.005, 0]}>
        {[-2.2, 2.2].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 5.6]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
        {[-2.8, 2.8].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.58, 0.18]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
      </group>

      {/* 6. 接触阴影 */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={9}
        blur={1.8}
        far={3.5}
        resolution={isHigh ? 512 : 256}
        color="#000000"
      />
    </>
  );
};

export const GarageScene: React.FC<GarageSceneProps> = ({
  config,
  quality,
  autoRotate = true,
}) => {
  return (
    <Canvas
      shadows={quality === "high"}
      camera={{ position: [4.4, 1.8, 4.2], fov: 38 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.45,
        antialias: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        <GarageEnvironment quality={quality} />
        <ModularCar config={config} isGarageView={true} />
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3.2}
          maxDistance={8.5}
          target={[0, 0.35, 0]}
        />
      </Suspense>
    </Canvas>
  );
};
