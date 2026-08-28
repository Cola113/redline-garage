// components/garage/DragStripScene.tsx
// Redline Garage - High-Speed 1/4 Mile Drag Strip 3D Environment & Dynamic Camera

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CarConfig, QualitySetting, RaceTelemetry } from "@/lib/garage/types";
import { ModularCar } from "./ModularCar";

interface DragStripSceneProps {
  config: CarConfig;
  telemetry: RaceTelemetry;
  countdownStep: number; // 0=未开始, 1=Stage, 2=Yellow1, 3=Yellow2, 4=Yellow3, 5=Green, -1=Red
  cameraMode: "chase" | "hood" | "side";
  quality: QualitySetting;
  opponentConfig?: CarConfig;
  opponentDistance?: number;
}

// 圣诞树发车灯塔 (Christmas Tree)
function ChristmasTree({ countdownStep }: { countdownStep: number }) {
  const isStaged = countdownStep >= 1;
  const isYellow1 = countdownStep === 2 || countdownStep >= 5;
  const isYellow2 = countdownStep === 3 || countdownStep >= 5;
  const isYellow3 = countdownStep === 4 || countdownStep >= 5;
  const isGreen = countdownStep === 5;
  const isRed = countdownStep === -1;

  return (
    <group position={[3.2, 0, 12]}>
      {/* 黑色立柱 */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[0.3, 5.0, 0.3]} />
        <meshStandardMaterial color="#1a1a1c" metalness={0.8} />
      </mesh>

      {/* 预备蓝色指示灯 (Pre-stage & Stage) */}
      <mesh position={[0, 4.4, 0.2]}>
        <boxGeometry args={[0.7, 0.22, 0.1]} />
        <meshStandardMaterial
          color={isStaged ? "#00ddff" : "#112233"}
          emissive={isStaged ? "#00ddff" : "#000000"}
          emissiveIntensity={isStaged ? 2.5 : 0}
        />
      </mesh>

      {/* 黄灯 1 */}
      <mesh position={[0, 3.8, 0.2]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={isYellow1 ? "#ffb300" : "#332200"}
          emissive={isYellow1 ? "#ffb300" : "#000000"}
          emissiveIntensity={isYellow1 ? 3.0 : 0}
        />
      </mesh>

      {/* 黄灯 2 */}
      <mesh position={[0, 3.2, 0.2]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={isYellow2 ? "#ffb300" : "#332200"}
          emissive={isYellow2 ? "#ffb300" : "#000000"}
          emissiveIntensity={isYellow2 ? 3.0 : 0}
        />
      </mesh>

      {/* 黄灯 3 */}
      <mesh position={[0, 2.6, 0.2]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial
          color={isYellow3 ? "#ffb300" : "#332200"}
          emissive={isYellow3 ? "#ffb300" : "#000000"}
          emissiveIntensity={isYellow3 ? 3.0 : 0}
        />
      </mesh>

      {/* 绿灯 (Go!) */}
      <mesh position={[0, 2.0, 0.2]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={isGreen ? "#00ff44" : "#003311"}
          emissive={isGreen ? "#00ff44" : "#000000"}
          emissiveIntensity={isGreen ? 3.5 : 0}
        />
      </mesh>

      {/* 抢跑红灯 */}
      {isRed && (
        <mesh position={[0, 1.4, 0.2]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3.5} />
        </mesh>
      )}
    </group>
  );
}

// 赛道主体 (沥青、标线、护栏、看台广告牌、路灯)
function TrackEnvironment({ quality }: { quality: QualitySetting }) {
  const lightCount = 14;

  const stadiumLights = useMemo(() => {
    const list = [];
    for (let i = 0; i < lightCount; i++) {
      const z = -i * 36 + 20;
      list.push(z);
    }
    return list;
  }, []);

  return (
    <group>
      {/* 1. 沥青路面 (长 480m) */}
      <mesh position={[0, 0, -220]} receiveShadow>
        <planeGeometry args={[14, 520]} />
        <meshStandardMaterial color="#1a1c20" roughness={0.92} metalness={0.1} />
      </mesh>

      {/* 2. 起跑线与烧胎胶痕印 (Rubber Groove) */}
      <mesh position={[-2.2, 0.005, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 14]} />
        <meshBasicMaterial color="#0c0d10" transparent opacity={0.8} />
      </mesh>
      <mesh position={[2.2, 0.005, 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 14]} />
        <meshBasicMaterial color="#0c0d10" transparent opacity={0.8} />
      </mesh>

      {/* 起跑白线 */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 0.4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 中央虚线隔断 (双车道) */}
      {Array.from({ length: 45 }).map((_, idx) => (
        <mesh key={idx} position={[0, 0.008, -idx * 10 - 5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.25, 4]} />
          <meshBasicMaterial color="#f0b800" />
        </mesh>
      ))}

      {/* 3. 两侧水泥防撞护栏 */}
      <mesh position={[-6.8, 0.5, -220]}>
        <boxGeometry args={[0.5, 1.0, 520]} />
        <meshStandardMaterial color="#555860" roughness={0.7} />
      </mesh>
      <mesh position={[6.8, 0.5, -220]}>
        <boxGeometry args={[0.5, 1.0, 520]} />
        <meshStandardMaterial color="#555860" roughness={0.7} />
      </mesh>

      {/* 4. 赛道两侧高亮探照灯塔 */}
      {stadiumLights.map((zPos, idx) => (
        <group key={idx}>
          {/* 左侧灯塔 */}
          <mesh position={[-7.8, 5, zPos]}>
            <cylinderGeometry args={[0.15, 0.25, 10, 8]} />
            <meshStandardMaterial color="#2a2c32" metalness={0.8} />
          </mesh>
          <pointLight position={[-7.5, 9.8, zPos]} intensity={quality === "low" ? 0.8 : 1.5} distance={38} color="#fff8e8" />

          {/* 右侧灯塔 */}
          <mesh position={[7.8, 5, zPos]}>
            <cylinderGeometry args={[0.15, 0.25, 10, 8]} />
            <meshStandardMaterial color="#2a2c32" metalness={0.8} />
          </mesh>
          <pointLight position={[7.5, 9.8, zPos]} intensity={quality === "low" ? 0.8 : 1.5} distance={38} color="#fff8e8" />
        </group>
      ))}

      {/* 5. 冲线终点门架 (Finish Line Gantry at 402.33m -> Z = -402.33) */}
      <group position={[0, 0, -402.33]}>
        {/* 龙门架立柱 */}
        <mesh position={[-6.5, 4.5, 0]}>
          <boxGeometry args={[0.8, 9, 0.8]} />
          <meshStandardMaterial color="#e62117" metalness={0.6} />
        </mesh>
        <mesh position={[6.5, 4.5, 0]}>
          <boxGeometry args={[0.8, 9, 0.8]} />
          <meshStandardMaterial color="#e62117" metalness={0.6} />
        </mesh>
        {/* 横梁 */}
        <mesh position={[0, 8.5, 0]}>
          <boxGeometry args={[14, 1.2, 1.0]} />
          <meshStandardMaterial color="#1a1a1e" metalness={0.8} />
        </mesh>
        {/* FINISH 霓虹标牌 */}
        <mesh position={[0, 8.5, 0.6]}>
          <boxGeometry args={[7, 0.8, 0.1]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={3.0} />
        </mesh>
        {/* 终点黑白方格旗地标 */}
        <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 1.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 天空与黄昏天际线氛围光 */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[20, 30, -50]} intensity={0.9} color="#ffaa66" />
      <directionalLight position={[-20, 20, 50]} intensity={0.5} color="#4477aa" />
    </group>
  );
}

// 动态跟随镜头控制器 (Chase Camera with FOV Stretch & Screen Shake)
function DynamicCameraController({
  carZ,
  speedKmh,
  gForce,
  cameraMode,
}: {
  carZ: number;
  speedKmh: number;
  gForce: number;
  cameraMode: "chase" | "hood" | "side";
}) {
  useFrame(({ camera }) => {
    // 动态拉伸 FOV (极速感)
    const targetFov = 44 + Math.min(26, (speedKmh / 350) * 26);
    if ("fov" in camera) {
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
        (camera as THREE.PerspectiveCamera).fov,
        targetFov,
        0.05
      );
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }

    // 镜头抖动 (根据 G 值与高时速)
    const shakeIntensity = Math.min(0.04, (speedKmh / 300) * 0.025 + Math.max(0, gForce - 1.0) * 0.02);
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;

    if (cameraMode === "hood") {
      // 贴地机盖视角
      camera.position.set(-2.2 + shakeX, 0.9 + shakeY, carZ + 1.2);
      camera.lookAt(-2.2, 0.8, carZ - 25);
    } else if (cameraMode === "side") {
      // 侧方动态追焦
      camera.position.set(4.8 + shakeX, 1.6 + shakeY, carZ + 4.5);
      camera.lookAt(-2.2, 0.7, carZ - 6);
    } else {
      // 默认经典贴地追尾机位 (Chase Cam)
      const targetCamX = -2.2 + shakeX;
      const targetCamY = 1.35 + Math.min(0.3, speedKmh * 0.0008) + shakeY;
      const targetCamZ = carZ + 4.6 + Math.min(1.2, speedKmh * 0.003);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.15);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.15);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.25);

      camera.lookAt(-2.2, 0.6, carZ - 18);
    }
  });

  return null;
}

export const DragStripScene: React.FC<DragStripSceneProps> = ({
  config,
  telemetry,
  countdownStep,
  cameraMode,
  quality,
  opponentConfig,
  opponentDistance = 0,
}) => {
  // 赛道坐标系：起点 Z=0，向负 Z 轴飞驰
  const carZ = -telemetry.distanceMeters;
  const oppZ = -opponentDistance;

  return (
    <div className="relative h-full w-full select-none">
      <Canvas
        camera={{ position: [-2.2, 1.4, 4.8], fov: 46 }}
        shadows={quality !== "low"}
        gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
        className="h-full w-full"
      >
        <color attach="background" args={["#08080c"]} />
        <fog attach="fog" args={["#08080c", 30, 220]} />

        {/* 赛道与发车灯 */}
        <TrackEnvironment quality={quality} />
        <ChristmasTree countdownStep={countdownStep} />

        {/* 玩家车辆 (左车道 X = -2.2) */}
        <group position={[-2.2, 0, carZ]}>
          <ModularCar
            config={config}
            speedMs={telemetry.speedMs}
            rpm={telemetry.rpm}
            exhaustFlame={telemetry.isShifting || telemetry.nosActive}
            nosActive={telemetry.nosActive}
            wheelieAngleDeg={telemetry.wheelieAngleDeg}
            tireSmokeIntensity={telemetry.tireSlipRatio > 0.1 ? 0.8 : 0}
          />
        </group>

        {/* 对手/幽灵车 (右车道 X = 2.2) */}
        {opponentConfig && (
          <group position={[2.2, 0, oppZ]}>
            <ModularCar
              config={opponentConfig}
              speedMs={telemetry.speedMs * 0.98}
              rpm={7000}
              exhaustFlame={false}
              nosActive={false}
              wheelieAngleDeg={0}
              tireSmokeIntensity={0}
            />
          </group>
        )}

        {/* 动态运镜系统 */}
        <DynamicCameraController
          carZ={carZ}
          speedKmh={telemetry.speedKmh}
          gForce={telemetry.gForce}
          cameraMode={cameraMode}
        />
      </Canvas>
    </div>
  );
};
