// components/garage/DragStripScene.tsx
// Redline Garage - High-Polish 1/4 Mile Drag Strip with Stadium Floodlights & Illuminated Gantry

import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CarConfig, QualitySetting, RaceTelemetry } from "@/lib/garage/types";
import { ModularCar } from "./ModularCar";

interface DragStripSceneProps {
  config: CarConfig;
  telemetry: RaceTelemetry;
  countdownStep: number;
  cameraMode: "chase" | "hood" | "side";
  quality: QualitySetting;
  opponentConfig?: CarConfig;
  opponentDistance?: number;
}

// 圣诞树起跑信号塔 (Christmas Tree Starting Tower)
const ChristmasTreeTower: React.FC<{ countdownStep: number }> = ({ countdownStep }) => {
  const isStaged = countdownStep >= 0;
  const isAmber1 = countdownStep >= 2;
  const isAmber2 = countdownStep >= 3;
  const isAmber3 = countdownStep >= 4;
  const isGreen = countdownStep === 5;

  return (
    <group position={[0, 0, 5.0]}>
      {/* 黑色立柱 */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[0.22, 4.4, 0.22]} />
        <meshStandardMaterial color="#1a1c23" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 顶端 STAGED 准备灯 */}
      <mesh position={[-0.22, 3.8, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={isStaged ? "#ffffff" : "#333333"} />
      </mesh>
      <mesh position={[0.22, 3.8, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={isStaged ? "#ffffff" : "#333333"} />
      </mesh>

      {/* 黄灯 1 */}
      <mesh position={[-0.22, 3.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber1 ? "#fbbf24" : "#332200"} />
      </mesh>
      <mesh position={[0.22, 3.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber1 ? "#fbbf24" : "#332200"} />
      </mesh>

      {/* 黄灯 2 */}
      <mesh position={[-0.22, 2.7, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber2 ? "#fbbf24" : "#332200"} />
      </mesh>
      <mesh position={[0.22, 2.7, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber2 ? "#fbbf24" : "#332200"} />
      </mesh>

      {/* 黄灯 3 */}
      <mesh position={[-0.22, 2.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber3 ? "#fbbf24" : "#332200"} />
      </mesh>
      <mesh position={[0.22, 2.2, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isAmber3 ? "#fbbf24" : "#332200"} />
      </mesh>

      {/* 绿灯 (GO!) */}
      <mesh position={[-0.22, 1.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={isGreen ? "#22c55e" : "#052e16"} />
      </mesh>
      <mesh position={[0.22, 1.6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={isGreen ? "#22c55e" : "#052e16"} />
      </mesh>

      {/* 绿灯泛光 */}
      {isGreen && <pointLight position={[0, 1.6, 0.4]} color="#22c55e" intensity={4.0} distance={12} />}
      {isAmber3 && <pointLight position={[0, 2.2, 0.4]} color="#fbbf24" intensity={3.0} distance={10} />}
    </group>
  );
};

// 动态赛道环境 (450米高亮沥青路面、胶痕、路肩、终点龙门架、高杆探照灯)
const DragStripTrack: React.FC<{ playerZ: number; quality: QualitySetting }> = ({
  playerZ,
  quality,
}) => {
  const isHigh = quality === "high";

  // 沿途高杆探照灯塔 (每 40 米一座，全场高亮度)
  const lightPoles = useMemo(() => {
    const poles = [];
    for (let z = -20; z <= 460; z += 40) {
      poles.push(z);
    }
    return poles;
  }, []);

  return (
    <group>
      {/* 1. 环境光底座与黄昏天光 (暗部饱满) */}
      <ambientLight intensity={0.8} color="#e2e8f0" />
      <directionalLight position={[20, 30, -50]} intensity={1.8} color="#fed7aa" />
      <directionalLight position={[-20, 20, 50]} intensity={1.2} color="#93c5fd" />

      {/* 2. 主沥青赛道 (宽 18米，长 520米) */}
      <mesh position={[0, -0.01, 220]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 560]} />
        <meshStandardMaterial color="#262930" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* 赛道中央分道线与双车道起跑胶印 */}
      <mesh position={[0, 0.002, 220]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 560]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 起跑线双胎黑胶痕 (Rubber Groove) */}
      {[-2.2, 2.2].map((laneX, laneIdx) => (
        <group key={laneIdx} position={[laneX, 0.003, 25]}>
          <mesh position={[-0.8, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.45, 75]} />
            <meshBasicMaterial color="#111317" />
          </mesh>
          <mesh position={[0.8, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.45, 75]} />
            <meshBasicMaterial color="#111317" />
          </mesh>
        </group>
      ))}

      {/* 起跑白线 (0米) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 0.6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 左右两侧混凝土防撞墙与广告发光板 */}
      {[-9.2, 9.2].map((x, idx) => (
        <mesh key={idx} position={[x, 0.6, 220]}>
          <boxGeometry args={[0.6, 1.2, 560]} />
          <meshStandardMaterial color="#374151" roughness={0.6} />
        </mesh>
      ))}

      {/* 左右防撞墙顶部警示黄线 */}
      {[-9.2, 9.2].map((x, idx) => (
        <mesh key={idx} position={[x, 1.21, 220]}>
          <boxGeometry args={[0.62, 0.04, 560]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* 高杆探照灯群 */}
      {lightPoles.map((poleZ, idx) => (
        <group key={idx}>
          {/* 左侧灯柱 */}
          <group position={[-11, 0, poleZ]}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 10, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[1.5, 9.8, 0]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[2.8, 0.4, 0.8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* 4 颗高亮发光灯泡 */}
            <mesh position={[1.5, 9.6, 0]}>
              <boxGeometry args={[2.6, 0.05, 0.6]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight position={[2, 9.2, 0]} intensity={isHigh ? 3.2 : 2.0} distance={45} color="#fff8ea" />
          </group>

          {/* 右侧灯柱 */}
          <group position={[11, 0, poleZ]}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 10, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[-1.5, 9.8, 0]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[2.8, 0.4, 0.8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-1.5, 9.6, 0]}>
              <boxGeometry args={[2.6, 0.05, 0.6]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight position={[-2, 9.2, 0]} intensity={isHigh ? 3.2 : 2.0} distance={45} color="#fff8ea" />
          </group>
        </group>
      ))}

      {/* 3. 终点龙门架 (402.33 米 / 1/4 英里) */}
      <group position={[0, 0, 402.33]}>
        {/* 跨道桁架 */}
        <mesh position={[0, 7.5, 0]}>
          <boxGeometry args={[22, 1.6, 1.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* 左立柱 */}
        <mesh position={[-10.5, 3.8, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 7.6, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* 右立柱 */}
        <mesh position={[10.5, 3.8, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 7.6, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* 终点发光大标语 "1/4 MILE FINISH" */}
        <mesh position={[0, 7.5, 0.65]}>
          <boxGeometry args={[12, 1.1, 0.05]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <pointLight position={[0, 6.5, 1.5]} color="#ef4444" intensity={6.0} distance={25} />

        {/* 终点地面黑白方格旗终点线 */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 1.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  );
};

// 动态赛道镜头控制器 (Dynamic Chase Camera with Speed-FOV Stretch & Shake)
const CameraRig: React.FC<{
  playerZ: number;
  speedMs: number;
  cameraMode: "chase" | "hood" | "side";
}> = ({ playerZ, speedMs, cameraMode }) => {
  const { camera } = useThree();

  useFrame(() => {
    const speedRatio = Math.min(1.0, speedMs / 100);
    const shake = speedRatio > 0.3 ? (Math.random() - 0.5) * speedRatio * 0.04 : 0;

    if (cameraMode === "chase") {
      // 追尾视角：根据速度动态后拉并加大广角
      const targetZ = playerZ - 6.2 - speedRatio * 1.5;
      const targetY = 1.9 + speedRatio * 0.3;
      const targetX = -2.2 + shake;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.15);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.15);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.2);

      camera.lookAt(-2.2, 0.7, playerZ + 12.0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 55 + speedRatio * 15, 0.1);
        camera.updateProjectionMatrix();
      }
    } else if (cameraMode === "hood") {
      // 贴地机盖视角
      camera.position.set(-2.2, 0.9 + shake, playerZ + 0.6);
      camera.lookAt(-2.2, 0.75, playerZ + 35.0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 75;
        camera.updateProjectionMatrix();
      }
    } else if (cameraMode === "side") {
      // 侧方并排特写追焦
      camera.position.set(-6.8, 1.4 + shake, playerZ - 1.0);
      camera.lookAt(-2.2, 0.6, playerZ + 3.0);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 60;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
};

export const DragStripScene: React.FC<DragStripSceneProps> = ({
  config,
  telemetry,
  countdownStep,
  cameraMode,
  quality,
  opponentConfig,
  opponentDistance = 0,
}) => {
  const playerZ = telemetry.distanceMeters;
  const oppZ = opponentDistance;

  return (
    <Canvas
      shadows={quality === "high"}
      camera={{ position: [-2.2, 2.0, -6.5], fov: 55 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.35,
        antialias: true,
        powerPreference: "high-performance",
      }}
      className="h-full w-full"
    >
      <Suspense fallback={null}>
        {/* 赛道与灯光 */}
        <DragStripTrack playerZ={playerZ} quality={quality} />

        {/* 圣诞树起跑信号塔 */}
        <ChristmasTreeTower countdownStep={countdownStep} />

        {/* 玩家赛车 (左车道 X = -2.2) */}
        <group position={[-2.2, 0, playerZ]}>
          <ModularCar
            config={config}
            speedMs={telemetry.speedMs}
            rpm={telemetry.rpm}
            exhaustFlame={telemetry.isShifting || telemetry.nosActive}
            nosActive={telemetry.nosActive}
            wheelieAngleDeg={telemetry.wheelieAngleDeg}
            tireSmokeIntensity={telemetry.tireSlipRatio}
          />
        </group>

        {/* 对手幽灵赛车 (右车道 X = 2.2) */}
        {opponentConfig && (
          <group position={[2.2, 0, oppZ]}>
            <ModularCar
              config={opponentConfig}
              speedMs={telemetry.speedMs * 0.98}
              rpm={telemetry.rpm * 0.95}
              exhaustFlame={telemetry.isShifting}
              wheelieAngleDeg={0}
              tireSmokeIntensity={oppZ < 20 && countdownStep === 5 ? 0.3 : 0}
              isGhost={true}
              ghostColor="#38bdf8"
              ghostOpacity={0.82}
            />
          </group>
        )}

        {/* 动态赛车机位 */}
        <CameraRig playerZ={playerZ} speedMs={telemetry.speedMs} cameraMode={cameraMode} />
      </Suspense>
    </Canvas>
  );
};
