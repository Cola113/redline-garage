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

      {/* 3. 顶置工作间专业摄影棚柔光箱与射灯 (Clean Studio Ceiling Softbox & Spotlights - No shadow artifacts) */}
      <group position={[0, 6.0, 0]}>
        {/* 顶部极简哑光吊架 */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[4.5, 0.08, 2.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* 柔光漫射发光板 */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 2.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <spotLight
          position={[0, -0.05, 0]}
          target-position={[0, 0, 0]}
          intensity={5.5}
          angle={0.95}
          penumbra={0.7}
          color="#fffdf8"
          distance={18}
          castShadow={false}
        />
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

      {/* 5. 地面精细工位定位角标与警示标线 (Precision Bay Corner Guides & Markings) */}
      <group position={[0, 0.005, 0]}>
        {/* 四角 L 型精准定位折角 */}
        {[
          { x: -2.2, z: -2.8, sx: 1, sz: 1 },
          { x: 2.2, z: -2.8, sx: -1, sz: 1 },
          { x: -2.2, z: 2.8, sx: 1, sz: -1 },
          { x: 2.2, z: 2.8, sx: -1, sz: -1 },
        ].map((corner, i) => (
          <group key={i} position={[corner.x, 0, corner.z]}>
            <mesh position={[corner.sx * 0.45, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.9, 0.06]} />
              <meshBasicMaterial color="#eab308" />
            </mesh>
            <mesh position={[0, 0, corner.sz * 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.06, 0.9]} />
              <meshBasicMaterial color="#eab308" />
            </mesh>
          </group>
        ))}

        {/* 细长前后对齐虚线 */}
        {[-2.2, 2.2].map((x, i) => (
          <mesh key={`guide-${i}`} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 3.2]} />
            <meshBasicMaterial color="#64748b" transparent opacity={0.6} />
          </mesh>
        ))}

        {/* 中央底盘对齐十字标 (Chassis Staging Target) */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.03]} />
          <meshBasicMaterial color="#eab308" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 0.8]} />
          <meshBasicMaterial color="#eab308" transparent opacity={0.7} />
        </mesh>
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
