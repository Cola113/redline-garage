// components/garage/GarageScene.tsx
// Redline Garage - High-Polish Industrial Midnight Workshop with Rich Three-Point Studio Lighting

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

  // 吊灯呼吸摇曳感
  useFrame((state) => {
    if (lampRef.current) {
      const t = state.clock.getElapsedTime();
      lampRef.current.rotation.z = Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <>
      {/* 1. 全局明亮环境光与多路主补光 (杜绝死黑与阴暗) */}
      <ambientLight intensity={1.6} color="#f8fafc" />

      {/* 主摄影射灯 (Key Light) */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={3.8}
        color="#ffffff"
        castShadow={isHigh}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      {/* 侧向青蓝冷调轮廓反光 (Rim Fill Light) */}
      <directionalLight position={[-7, 5, -4]} intensity={2.6} color="#7dd3fc" />

      {/* 后方暖色轮廓反光 (Backlight) */}
      <directionalLight position={[0, 6, -8]} intensity={2.8} color="#fdba74" />

      {/* 底部向上微光补亮底盘 (Floor Bounce Light) */}
      <directionalLight position={[0, -3, 0]} intensity={0.9} color="#cbd5e1" />

      {/* 2. 车库工业内景墙体 (给金属漆面提供逼真的光影反光环境) */}
      <group position={[0, 4, -7.5]}>
        {/* 后墙 */}
        <mesh>
          <planeGeometry args={[26, 12]} />
          <meshStandardMaterial color="#2d3342" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* 墙面白色照明发光板 */}
        {[-8, -4, 0, 4, 8].map((x, i) => (
          <mesh key={i} position={[x, 2.5, 0.05]}>
            <planeGeometry args={[1.8, 0.35]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* 3. 顶置工业摇臂吊灯 */}
      <group ref={lampRef} position={[0, 5.8, 0]}>
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.9, 0.45, 24, 1, true]} />
          <meshStandardMaterial color="#1e222a" roughness={0.4} metalness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color="#fffbeb" />
        </mesh>
        <spotLight
          position={[0, -0.1, 0]}
          target-position={[0, 0, 0]}
          intensity={6.5}
          angle={0.95}
          penumbra={0.6}
          color="#fffdf5"
          distance={18}
          castShadow={isHigh}
        />
        {/* 柔和透光光锥 */}
        {!isLow && (
          <mesh position={[0, -2.4, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[2.5, 4.8, 32, 1, true]} />
            <meshBasicMaterial
              color="#fff4cc"
              transparent
              opacity={0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* 4. 后墙霓虹招牌 "REDLINE GARAGE" */}
      <group position={[0, 3.6, -7.4]}>
        <mesh>
          <boxGeometry args={[7.6, 1.5, 0.1]} />
          <meshStandardMaterial color="#14171f" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[7.4, 1.3, 0.02]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <boxGeometry args={[6.8, 0.4, 0.02]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 5. 车库工矿地坪 (镜面高光质感) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[45, 45]} />
        {!isLow ? (
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={isHigh ? 1024 : 512}
            mirror={0.8}
            mixBlur={0.5}
            mixStrength={2.2}
            roughness={0.2}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#282d38"
            metalness={0.7}
          />
        ) : (
          <meshStandardMaterial color="#282d38" roughness={0.3} metalness={0.5} />
        )}
      </mesh>

      {/* 6. 地面工位警示黄斑马线 */}
      <group position={[0, 0.005, 0]}>
        {[-2.2, 2.2].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 5.8]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
        {[-2.9, 2.9].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.6, 0.2]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
      </group>

      {/* 7. 周边工矿陈设 */}
      <group position={[-4.5, 1.1, -3.5]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 2.2, 0.8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      <group position={[4.2, 0.4, -3.0]}>
        {[0, 0.35, 0.7].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.32, 20]} />
            <meshStandardMaterial color="#2d3340" roughness={0.7} />
          </mesh>
        ))}
      </group>

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
      camera={{ position: [4.6, 2.2, 4.8], fov: 45 }}
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
          maxDistance={9.5}
          target={[0, 0.45, 0]}
        />
      </Suspense>
    </Canvas>
  );
};
