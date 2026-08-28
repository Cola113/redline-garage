// components/garage/GarageScene.tsx
// Redline Garage - Cinematic Industrial Midnight Garage 3D Scene

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Float, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { CarConfig, QualitySetting } from "@/lib/garage/types";
import { ModularCar } from "./ModularCar";

interface GarageSceneProps {
  config: CarConfig;
  quality: QualitySetting;
  autoRotate?: boolean;
}

function GarageEnvironment() {
  const lightRef = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    // 顶部工矿吊灯轻微摇晃感
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <group>
      {/* 深夜车库高亮主吊灯 */}
      <spotLight
        ref={lightRef}
        position={[0, 5.5, 0]}
        angle={0.65}
        penumbra={0.8}
        intensity={3.5}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* 侧面冷色环境轮廓光 */}
      <directionalLight position={[-6, 4, 3]} intensity={0.9} color="#7099cc" />
      <directionalLight position={[6, 4, -3]} intensity={1.2} color="#ffaa55" />
      <ambientLight intensity={0.35} />

      {/* 后方工业墙与霓虹标语 */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <planeGeometry args={[24, 10]} />
        <meshStandardMaterial color="#121316" roughness={0.85} metalness={0.2} />
      </mesh>

      {/* 顶部钢结构桁架 */}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[18, 0.2, 14]} />
        <meshStandardMaterial color="#1a1c22" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* 工具墙与工具柜装饰 */}
      <group position={[-5, 0, -4.5]}>
        {/* 红色双门高大工具柜 */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[1.6, 2.4, 0.8]} />
          <meshStandardMaterial color="#b81d13" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* 抽屉把手 */}
        <mesh position={[0, 1.2, 0.42]}>
          <boxGeometry args={[1.2, 0.05, 0.04]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* 备用大轮胎堆叠 */}
      <group position={[5, 0, -4]}>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
          <meshStandardMaterial color="#18181a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
          <meshStandardMaterial color="#18181a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.35, 16]} />
          <meshStandardMaterial color="#18181a" roughness={0.9} />
        </mesh>
      </group>

      {/* 氮气瓶陈列架 */}
      <group position={[5.2, 0, -1.5]}>
        <mesh position={[-0.3, 0.6, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 1.0, 16]} />
          <meshStandardMaterial color="#0055ff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.3, 0.6, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 1.0, 16]} />
          <meshStandardMaterial color="#0055ff" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* 旋转底座光环 */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.58, 48]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GroundFloor({ quality }: { quality: QualitySetting }) {
  if (quality === "low") {
    return (
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#101114" roughness={0.7} metalness={0.2} />
      </mesh>
    );
  }

  // 高/中画质地坪倒影
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={quality === "high" ? 512 : 256}
        mirror={0.6}
        mixBlur={1}
        mixStrength={2}
        roughness={0.3}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0e1014"
        metalness={0.4}
      />
    </mesh>
  );
}

export const GarageScene: React.FC<GarageSceneProps> = ({ config, quality, autoRotate = false }) => {
  return (
    <div className="relative h-full w-full select-none">
      <Canvas
        camera={{ position: [4.2, 2.2, 4.2], fov: 42 }}
        shadows={quality !== "low"}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        className="h-full w-full"
      >
        <color attach="background" args={["#0a0a0c"]} />
        <fog attach="fog" args={["#0a0a0c", 10, 26]} />

        <GarageEnvironment />
        <GroundFloor quality={quality} />

        {/* 展车模型 */}
        <ModularCar config={config} isGarageView={true} />

        {/* 车辆底部真实接触软阴影 */}
        {quality !== "low" && (
          <ContactShadows
            position={[0, 0.02, 0]}
            opacity={0.85}
            scale={6.0}
            blur={1.8}
            far={1.8}
            resolution={512}
            color="#000000"
          />
        )}

        <OrbitControls
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
          minDistance={2.8}
          maxDistance={8.5}
          maxPolarAngle={Math.PI / 2 - 0.04} // 防止镜头穿入地板
          dampingFactor={0.05}
        />
      </Canvas>

      {/* 底部视角操作温馨提示 */}
      <div className="pointer-events-none absolute bottom-4 left-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-neutral-400 backdrop-blur-md">
        <span className="inline-block h-2 w-2 rounded-full bg-[#ff3b30] animate-pulse" />
        按住鼠标左键可 360° 环视爱车 · 滚轮缩放
      </div>
    </div>
  );
};
