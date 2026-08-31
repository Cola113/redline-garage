// components/garage/ModularCar.tsx
// Redline Garage - High-Polish Sculpted Sports Car & Dragster Procedural 3D Model

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { CarConfig } from "@/lib/garage/types";
import { PARTS_CATALOG } from "@/lib/garage/catalog";

interface ModularCarProps {
  config: CarConfig;
  speedMs?: number;
  rpm?: number;
  exhaustFlame?: boolean;
  nosActive?: boolean;
  wheelieAngleDeg?: number;
  tireSmokeIntensity?: number;
  isGarageView?: boolean;
  isGhost?: boolean;
  ghostColor?: string;
  ghostOpacity?: number;
  isBraking?: boolean;
}

// 独立高精度车轮总成 (High-Precision Deep Dish Forged Wheel Assembly)
const WheelAssembly: React.FC<{
  isRightSide: boolean;
  isRear: boolean;
  isWideRear: boolean;
  rubberMat: THREE.Material;
  rimMat: THREE.Material;
  lipMat: THREE.Material;
  rotorMat: THREE.Material;
  caliperMat: THREE.Material;
  wheelRef?: (el: THREE.Group | null) => void;
}> = ({
  isRightSide,
  isRear,
  isWideRear,
  rubberMat,
  rimMat,
  lipMat,
  rotorMat,
  caliperMat,
  wheelRef,
}) => {
  const radius = isRear ? (isWideRear ? 0.38 : 0.35) : 0.33;
  const width = isRear ? (isWideRear ? 0.40 : 0.28) : 0.24;
  const rimRadius = radius * 0.70;
  const rimDepth = width * 0.82;

  // 5 辐条径向排列角度
  const spokeAngles = [0, 72, 144, 216, 288];

  return (
    <group ref={wheelRef}>
      {/* 1. 轮胎外圈橡胶 (含圆角倒角) */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
        <cylinderGeometry args={[radius, radius, width, 32]} />
      </mesh>

      {/* 2. 轮毂深凹抛光桶身 (Deep Dish Rim Barrel & Polished Lip) */}
      <mesh
        position={[isRightSide ? width * 0.05 : -width * 0.05, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={lipMat}
      >
        <cylinderGeometry args={[rimRadius, rimRadius * 0.90, rimDepth, 24]} />
      </mesh>

      {/* 3. 轮毂中央五辐星型锻造盘面 (朝向外侧) */}
      <group position={[isRightSide ? width * 0.48 : -width * 0.48, 0, 0]}>
        {/* 中心轮毂盖与钛合金螺栓 */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={rimMat}>
          <cylinderGeometry args={[rimRadius * 0.28, rimRadius * 0.28, 0.03, 16]} />
        </mesh>
        {spokeAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh
              key={i}
              position={[0, Math.sin(rad) * (rimRadius * 0.52), Math.cos(rad) * (rimRadius * 0.52)]}
              rotation={[rad, 0, 0]}
              material={rimMat}
            >
              <boxGeometry args={[0.025, rimRadius * 0.65, 0.04]} />
            </mesh>
          );
        })}
      </group>

      {/* 4. 刹车系统 (内部固定不随轮滚动) */}
      <group position={[isRightSide ? -width * 0.12 : width * 0.12, 0, 0]}>
        {/* 钻孔通风钢制刹车盘 */}
        <mesh rotation={[0, 0, Math.PI / 2]} material={rotorMat}>
          <cylinderGeometry args={[rimRadius * 0.84, rimRadius * 0.84, 0.02, 24]} />
        </mesh>
        {/* 红色六活塞 Brembo 刹车卡钳 (固定在斜上方) */}
        <mesh
          position={[0, rimRadius * 0.58, isRear ? 0.06 : -0.06]}
          rotation={[0, 0, isRightSide ? 0.15 : -0.15]}
          material={caliperMat}
        >
          <boxGeometry args={[0.05, 0.08, 0.13]} />
        </mesh>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// 剪影挤出成型：用侧面轮廓 (z,y) 一次拉出整车体积 + 倒角——代替方块拼接
// ---------------------------------------------------------------------------
function extrudeProfile(
  pts: Array<[number, number]>,
  width: number,
  bevel = 0.045
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.translate(0, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

/** 车壳组件：下部车体（车漆剪影）+ 玻璃座舱罩 + 四轮拱外扩 */
const CarShell: React.FC<{
  lower: Array<[number, number]>;
  canopy: Array<[number, number]>;
  bodyWidth: number;
  canopyWidth: number;
  frontFenderY: number;
  rearFenderY: number;
  paintMat: THREE.Material;
  glassMat: THREE.Material;
  carbonMat: THREE.Material;
}> = ({ lower, canopy, bodyWidth, canopyWidth, frontFenderY, rearFenderY, paintMat, glassMat, carbonMat }) => (
  <group>
    {/* 主车体：一次成型的侧面轮廓 */}
    <mesh geometry={extrudeProfile(lower, bodyWidth)} material={paintMat} castShadow receiveShadow />
    {/* 玻璃座舱罩 */}
    <mesh geometry={extrudeProfile(canopy, canopyWidth, 0.035)} material={glassMat} castShadow />
    {/* 前轮拱外扩 */}
    <RoundedBox args={[0.20, 0.30, 0.98]} radius={0.07} smoothness={4} position={[-0.82, frontFenderY, 1.25]} material={paintMat} castShadow />
    <RoundedBox args={[0.20, 0.30, 0.98]} radius={0.07} smoothness={4} position={[0.82, frontFenderY, 1.25]} material={paintMat} castShadow />
    {/* 后宽体轮拱（包裹直线加速大胎） */}
    <RoundedBox args={[0.24, 0.36, 1.32]} radius={0.08} smoothness={4} position={[-0.88, rearFenderY, -1.25]} material={paintMat} castShadow receiveShadow />
    <RoundedBox args={[0.24, 0.36, 1.32]} radius={0.08} smoothness={4} position={[0.88, rearFenderY, -1.25]} material={paintMat} castShadow receiveShadow />
    {/* 门槛碳纤裙边 */}
    <RoundedBox args={[0.06, 0.10, 2.2]} radius={0.03} smoothness={3} position={[-0.84, 0.02, 0]} material={carbonMat} />
    <RoundedBox args={[0.06, 0.10, 2.2]} radius={0.03} smoothness={3} position={[0.84, 0.02, 0]} material={carbonMat} />
  </group>
);

export const ModularCar: React.FC<ModularCarProps> = ({
  config,
  speedMs = 0,
  rpm = 1000,
  exhaustFlame = false,
  nosActive = false,
  wheelieAngleDeg = 0,
  tireSmokeIntensity = 0,
  isGarageView = false,
  isGhost = false,
  ghostColor = "#38bdf8",
  ghostOpacity = 0.82,
  isBraking = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<{
    fl: THREE.Group | null;
    fr: THREE.Group | null;
    rl: THREE.Group | null;
    rr: THREE.Group | null;
  }>({ fl: null, fr: null, rl: null, rr: null });

  const flameRef = useRef<THREE.Group>(null);
  const smokeParticlesRef = useRef<THREE.Points>(null);

  // 1. 高级 PBR 材质库
  const carPaintMaterial = useMemo(() => {
    if (isGhost) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(ghostColor || config.paintColor || "#38bdf8"),
        metalness: 0.85,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: ghostOpacity,
        transmission: 0.2,
        emissive: new THREE.Color("#0284c7"),
        emissiveIntensity: 0.35,
        reflectivity: 0.95,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.paintColor || "#dc2626"),
      metalness: config.paintFinish === "matte" ? 0.1 : 0.88,
      roughness: config.paintFinish === "matte" ? 0.8 : 0.10,
      clearcoat: config.paintFinish === "matte" ? 0.0 : 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95,
      envMapIntensity: 2.0,
    });
  }, [config.paintColor, config.paintFinish, isGhost, ghostColor, ghostOpacity]);

  const carbonFiberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(isGhost ? "#1e293b" : "#181b22"),
      roughness: 0.35,
      metalness: 0.7,
      transparent: isGhost,
      opacity: isGhost ? 0.85 : 1.0,
    });
  }, [isGhost]);

  const chromeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(isGhost ? "#bae6fd" : "#ffffff"),
      roughness: 0.06,
      metalness: 0.98,
      transparent: isGhost,
      opacity: isGhost ? 0.9 : 1.0,
    });
  }, [isGhost]);

  const titaniumBurnMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#334155"),
      roughness: 0.25,
      metalness: 0.85,
      transparent: isGhost,
      opacity: isGhost ? 0.85 : 1.0,
    });
  }, [isGhost]);

  const brakeRotorMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#cbd5e1"),
      roughness: 0.2,
      metalness: 0.92,
      transparent: isGhost,
      opacity: isGhost ? 0.85 : 1.0,
    });
  }, [isGhost]);

  const brakeCaliperMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(isGhost ? "#0ea5e9" : "#dc2626"),
      roughness: 0.2,
      metalness: 0.5,
      transparent: isGhost,
      opacity: isGhost ? 0.9 : 1.0,
    });
  }, [isGhost]);

  const rubberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(isGhost ? "#0f172a" : "#13151b"),
      roughness: 0.88,
      metalness: 0.05,
      transparent: isGhost,
      opacity: isGhost ? 0.88 : 1.0,
    });
  }, [isGhost]);

  const rimMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(isGhost ? "#bae6fd" : "#e2e8f0"),
      roughness: 0.12,
      metalness: 0.94,
      transparent: isGhost,
      opacity: isGhost ? 0.9 : 1.0,
    });
  }, [isGhost]);

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(isGhost ? "#0284c7" : "#090d16"),
      roughness: 0.04,
      metalness: 0.1,
      transmission: 0.82,
      transparent: true,
      opacity: isGhost ? 0.7 : 0.88,
    });
  }, [isGhost]);

  const interiorMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#111318"),
      roughness: 0.8,
      metalness: 0.2,
    });
  }, []);

  const glowingFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ff4500"),
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  const nosBlueFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00d2ff"),
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  // 烟雾粒子
  const smokeCount = 75;
  const [smokePositions, smokeGeo] = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.8;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = -1.2 - Math.random() * 2.5;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return [pos, geo];
  }, []);

  // 动画帧循环
  useFrame((_, delta) => {
    const wheelRadius = 0.35;
    const rotSpeed = isGarageView ? 0 : (speedMs / wheelRadius) * delta;
    if (wheelsRef.current.fl) wheelsRef.current.fl.rotation.x += rotSpeed;
    if (wheelsRef.current.fr) wheelsRef.current.fr.rotation.x += rotSpeed;
    if (wheelsRef.current.rl) wheelsRef.current.rl.rotation.x += rotSpeed;
    if (wheelsRef.current.rr) wheelsRef.current.rr.rotation.x += rotSpeed;

    if (rootRef.current) {
      const targetPitch = THREE.MathUtils.degToRad(wheelieAngleDeg);
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, -targetPitch, 0.2);
    }

    if (flameRef.current) {
      if (exhaustFlame || nosActive) {
        flameRef.current.visible = true;
        const scale = 0.85 + Math.random() * 0.6;
        flameRef.current.scale.set(scale, scale, scale * (nosActive ? 2.0 : 1.3));
      } else {
        flameRef.current.visible = false;
      }
    }

    if (smokeParticlesRef.current) {
      if (tireSmokeIntensity > 0.05) {
        smokeParticlesRef.current.visible = true;
        const posAttr = smokeParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < smokeCount; i++) {
          arr[i * 3 + 2] -= (speedMs * 0.6 + 5.0) * delta;
          arr[i * 3 + 1] += (1.2 + Math.random() * 1.5) * delta;
          arr[i * 3] += (Math.random() - 0.5) * 1.2 * delta;

          if (arr[i * 3 + 2] < -6.0 || arr[i * 3 + 1] > 2.5) {
            arr[i * 3] = (Math.random() > 0.5 ? 0.75 : -0.75) + (Math.random() - 0.5) * 0.3;
            arr[i * 3 + 1] = 0.1 + Math.random() * 0.2;
            arr[i * 3 + 2] = -1.2 - Math.random() * 0.3;
          }
        }
        posAttr.needsUpdate = true;
      } else {
        smokeParticlesRef.current.visible = false;
      }
    }
  });

  const chassis = PARTS_CATALOG.chassis.find((c) => c.id === config.chassisId);
  const engine = PARTS_CATALOG.engine.find((e) => e.id === config.engineId);
  const tires = PARTS_CATALOG.tires.find((t) => t.id === config.tiresId);
  const aero = PARTS_CATALOG.aero.find((a) => a.id === config.aeroId);
  const exhaust = PARTS_CATALOG.exhaust.find((ex) => ex.id === config.exhaustId);
  const nos = PARTS_CATALOG.nos.find((n) => n.id === config.nosId);

  const isWideRearTire = tires?.tireType === "drag_radial";
  const isMuscle = chassis?.style === "muscle" || !chassis?.style;
  const isTuner = chassis?.style === "tuner";
  const isHyper = chassis?.style === "hyper";
  const isDragster = chassis?.style === "dragster";

  return (
    <group ref={rootRef} position={[0, 0.34, 0]}>
      {/* =========================================================================
          1. 一体化雕塑级车身框架 (Sculpted Continuous Sports Car Body)
          ========================================================================= */}
      
      {/* 碳纤维平整化底盘 */}
      <mesh position={[0, -0.02, 0]} material={carbonFiberMat} castShadow receiveShadow>
        <boxGeometry args={[1.68, 0.06, 4.35]} />
      </mesh>

      {/* 左右碳纤侧裙 (连接前后轮拱) */}
      <mesh position={[-0.82, 0.10, 0]} material={carbonFiberMat} castShadow>
        <boxGeometry args={[0.08, 0.12, 2.3]} />
      </mesh>
      <mesh position={[0.82, 0.10, 0]} material={carbonFiberMat} castShadow>
        <boxGeometry args={[0.08, 0.12, 2.3]} />
      </mesh>

      {/* 座舱内部底板与赛车桶椅 */}
      <group position={[0, 0.22, -0.3]}>
        <mesh material={interiorMat}>
          <boxGeometry args={[1.35, 0.12, 1.8]} />
        </mesh>
        {/* 赛车主驾桶椅 */}
        <mesh position={[-0.32, 0.22, 0.05]} material={carbonFiberMat}>
          <boxGeometry args={[0.42, 0.45, 0.45]} />
        </mesh>
        {/* 方向盘柱 */}
        <mesh position={[-0.32, 0.36, 0.42]} rotation={[0.4, 0, 0]} material={chromeMat}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
      </group>

      {/* =========================================================================
          A. 经典美式肌肉跑车 (Muscle Fastback 1969)
          ========================================================================= */}
      {isMuscle && (
        <group>
          {/* 一次成型车壳：长鼻肌肉快背剪影 */}
          <CarShell
            lower={[
              [2.14, -0.04], [2.14, 0.36], [2.04, 0.50], [0.58, 0.58],
              [-1.42, 0.60], [-2.02, 0.56], [-2.12, 0.42], [-2.12, -0.04],
            ]}
            canopy={[
              [0.55, 0.565], [-0.02, 0.87], [-0.72, 0.895], [-1.46, 0.60],
            ]}
            bodyWidth={1.56}
            canopyWidth={1.22}
            frontFenderY={0.30}
            rearFenderY={0.34}
            paintMat={carPaintMaterial}
            glassMat={glassMat}
            carbonMat={carbonFiberMat}
          />

          {/* 镀铬中网与 LED 双圆前大灯 */}
          <RoundedBox args={[1.50, 0.22, 0.05]} radius={0.02} smoothness={3} position={[0, 0.32, 2.13]} material={chromeMat} />
          {[-0.58, 0.58].map((x, i) => (
            <group key={i} position={[x, 0.30, 2.16]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
                <meshStandardMaterial color="#ffffff" emissive="#fffbeb" emissiveIntensity={4.0} />
              </mesh>
            </group>
          ))}

          {/* 尾部贯穿式经典尾灯 */}
          {[-0.55, 0.55].map((x, i) => (
            <mesh key={i} position={[x, 0.42, -2.15]}>
              <boxGeometry args={[0.42, 0.09, 0.03]} />
              <meshStandardMaterial
                color="#990000"
                emissive="#ff0022"
                emissiveIntensity={isBraking ? 9.5 : 4.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          <pointLight position={[0, 0.42, -2.25]} color="#ff0814" intensity={isBraking ? 4.2 : 2.0} distance={4.5} />
        </group>
      )}

      {/* =========================================================================
          B. 战神日系赛道轻量化底盘 (Tuner R-Spec)
          ========================================================================= */}
      {isTuner && (
        <group>
          {/* 一次成型车壳：低伏楔形赛道剪影 */}
          <CarShell
            lower={[
              [2.04, -0.04], [2.04, 0.30], [1.94, 0.44], [0.72, 0.50],
              [-1.20, 0.56], [-2.04, 0.48], [-2.10, 0.36], [-2.10, -0.04],
            ]}
            canopy={[
              [0.68, 0.49], [-0.08, 0.80], [-0.72, 0.82], [-1.52, 0.56],
            ]}
            bodyWidth={1.58}
            canopyWidth={1.24}
            frontFenderY={0.28}
            rearFenderY={0.32}
            paintMat={carPaintMaterial}
            glassMat={glassMat}
            carbonMat={carbonFiberMat}
          />

          {/* 竞技中冷进气大口 */}
          <RoundedBox args={[1.02, 0.18, 0.06]} radius={0.02} smoothness={3} position={[0, 0.26, 2.09]} material={chromeMat} />
          {/* 细长 LED 前大灯 */}
          {[-0.60, 0.60].map((x, i) => (
            <mesh key={i} position={[x, 0.36, 2.06]} rotation={[0, i === 0 ? 0.25 : -0.25, 0]}>
              <boxGeometry args={[0.34, 0.06, 0.04]} />
              <meshStandardMaterial color="#ffffff" emissive="#38bdf8" emissiveIntensity={4.5} />
            </mesh>
          ))}
          {/* 经典四圆尾灯 */}
          {[-0.55, -0.35, 0.35, 0.55].map((x, i) => (
            <mesh key={i} position={[x, 0.38, -2.13]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.02, 16]} />
              <meshStandardMaterial
                color="#990000"
                emissive="#ff0022"
                emissiveIntensity={isBraking ? 9.5 : 4.8}
                roughness={0.2}
              />
            </mesh>
          ))}
          <pointLight position={[0, 0.38, -2.25]} color="#ff0814" intensity={isBraking ? 4.2 : 2.0} distance={4.5} />
        </group>
      )}

      {/* =========================================================================
          C. 幽灵极速碳纤维单体壳 (Hyper Apex)
          ========================================================================= */}
      {isHyper && (
        <group>
          {/* 一次成型车壳：贴地水滴单体壳剪影 */}
          <CarShell
            lower={[
              [2.10, -0.04], [2.10, 0.30], [1.98, 0.40], [0.86, 0.46],
              [0.78, 0.52], [-1.62, 0.54], [-2.12, 0.48], [-2.12, -0.04],
            ]}
            canopy={[
              [0.80, 0.50], [0.06, 0.82], [-0.62, 0.84], [-1.68, 0.53],
            ]}
            bodyWidth={1.62}
            canopyWidth={1.18}
            frontFenderY={0.26}
            rearFenderY={0.30}
            paintMat={carPaintMaterial}
            glassMat={glassMat}
            carbonMat={carbonFiberMat}
          />
          {/* 贯穿式尾灯条 */}
          <mesh position={[0, 0.42, -2.16]}>
            <boxGeometry args={[1.58, 0.05, 0.04]} />
            <meshStandardMaterial
              color="#990000"
              emissive="#ff0022"
              emissiveIntensity={isBraking ? 11.0 : 5.8}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 0.42, -2.25]} color="#ff0814" intensity={isBraking ? 4.5 : 2.2} distance={5.0} />
        </group>
      )}

      {/* =========================================================================
          D. 地狱火 Pro-Mod 直线特装架 (Pro-Mod Dragster)
          ========================================================================= */}
      {isDragster && (
        <group>
          {/* 一次成型车壳：Pro-Mod 长鼻座舱后移剪影 */}
          <CarShell
            lower={[
              [2.16, -0.04], [2.16, 0.28], [2.08, 0.40], [0.30, 0.46],
              [0.18, 0.54], [-0.70, 0.60], [-1.10, 0.58], [-2.14, 0.54],
              [-2.16, -0.04],
            ]}
            canopy={[
              [0.22, 0.52], [-0.28, 0.84], [-0.85, 0.86], [-1.12, 0.58],
            ]}
            bodyWidth={1.46}
            canopyWidth={1.10}
            frontFenderY={0.24}
            rearFenderY={0.36}
            paintMat={carPaintMaterial}
            glassMat={glassMat}
            carbonMat={carbonFiberMat}
          />
          {/* 超宽后轮舱碳纤护罩 */}
          <RoundedBox args={[0.26, 0.42, 1.38]} radius={0.08} smoothness={4} position={[-0.94, 0.36, -1.28]} material={carbonFiberMat} castShadow />
          <RoundedBox args={[0.26, 0.42, 1.38]} radius={0.08} smoothness={4} position={[0.94, 0.36, -1.28]} material={carbonFiberMat} castShadow />
          {/* 尾部高位刹车警示灯 */}
          <mesh position={[0, 0.46, -2.17]}>
            <boxGeometry args={[0.62, 0.06, 0.04]} />
            <meshStandardMaterial
              color="#990000"
              emissive="#ff0022"
              emissiveIntensity={isBraking ? 11.0 : 5.8}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 0.46, -2.25]} color="#ff0814" intensity={isBraking ? 4.5 : 2.2} distance={5.0} />
        </group>
      )}

      {/* =========================================================================
          2. 引擎与进气系统 (Engine Blower Scoop & Turbos)
          ========================================================================= */}
      {engine?.engineType === "v8_blower" && (
        <group position={[0, 0.48, 1.05]}>
          {/* 机械增压器机体 */}
          <mesh material={chromeMat} castShadow>
            <boxGeometry args={[0.48, 0.24, 0.68]} />
          </mesh>
          {/* 凸出机盖的镀铬大进气铲 */}
          <mesh position={[0, 0.18, 0.12]} material={chromeMat} castShadow>
            <boxGeometry args={[0.54, 0.16, 0.50]} />
          </mesh>
          {/* 三联红色进气蝶阀 */}
          {[-0.15, 0, 0.15].map((xOffset, idx) => (
            <mesh key={idx} position={[xOffset, 0.18, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.062, 16]} />
              <meshStandardMaterial color="#ff1100" emissive="#ff2200" emissiveIntensity={2.5} />
            </mesh>
          ))}
          {/* 正时皮带与滑轮 */}
          <mesh position={[0, -0.06, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={carbonFiberMat}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v6_twin_turbo" && (
        <group position={[0, 0.38, 1.05]}>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.68, 0.20, 0.60]} />
          </mesh>
          {/* 双涡轮增压蜗壳 */}
          {[-0.42, 0.42].map((x, i) => (
            <mesh key={i} position={[x, 0.08, 0.1]} material={chromeMat} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.12, 0.06, 8, 16]} />
            </mesh>
          ))}
          {/* 蓝色进气管 */}
          <mesh position={[0, 0.10, 0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.70, 12]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v12_quad" && (
        <group position={[0, 0.40, -0.75]}>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.82, 0.26, 0.88]} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <boxGeometry args={[0.60, 0.05, 0.70]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* 4 支进气喇叭口 */}
          {[-0.42, 0.42].map((x) =>
            [-0.2, 0.2].map((z, idx) => (
              <mesh key={`${x}-${idx}`} position={[x, 0.08, z]} material={chromeMat}>
                <cylinderGeometry args={[0.075, 0.075, 0.2, 12]} />
              </mesh>
            ))
          )}
        </group>
      )}

      {engine?.engineType === "dual_ev" && (
        <group position={[0, 0.20, 0]}>
          <mesh material={carbonFiberMat}>
            <boxGeometry args={[1.38, 0.14, 2.8]} />
          </mesh>
          {/* 橙色高压电缆与电机 */}
          <mesh position={[0, 0.08, 1.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.68, 16]} />
            <meshStandardMaterial color="#ea580c" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.08, -1.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.74, 16]} />
            <meshStandardMaterial color="#ea580c" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          3. 氮气钢瓶 (NOS Bottle - 置于座舱内部副驾位置，透过玻璃可见，严禁悬空穿门)
          ========================================================================= */}
      {nos?.nosCapacitySec && nos.nosCapacitySec > 0 && (
        <group position={[0.28, 0.32, -0.32]} rotation={[0.3, 0, 0.1]}>
          {/* 蓝色高压 NOS 钢瓶 */}
          <mesh castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.36, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* 镀铬减压阀 */}
          <mesh position={[0, 0.20, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.024, 0.024, 0.05, 8]} />
          </mesh>
          <mesh position={[0.02, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.014, 0.014, 0.04, 8]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          4. 空力尾翼与防翘头轮 (Aero GT Wing & Wheelie Bar)
          ========================================================================= */}
      {aero?.id === "aero_gt_wing" && (
        <group position={[0, 0.74, -1.94]}>
          {/* 双碳纤维支架 */}
          <mesh position={[-0.45, -0.15, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.32, 0.1]} />
          </mesh>
          <mesh position={[0.45, -0.15, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.32, 0.1]} />
          </mesh>
          {/* 大尾翼主翼板 */}
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[1.78, 0.04, 0.32]} />
          </mesh>
          {/* 左右端板 */}
          <mesh position={[-0.9, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.18, 0.34]} />
          </mesh>
          <mesh position={[0.9, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.18, 0.34]} />
          </mesh>
        </group>
      )}

      {aero?.hasWheelieBar && (
        <group position={[0, -0.02, -2.15]}>
          {/* 镀铬桁架支撑杆 */}
          <mesh position={[-0.32, 0.06, -0.55]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.02, 0.02, 1.15, 8]} />
          </mesh>
          <mesh position={[0.32, 0.06, -0.55]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.02, 0.02, 1.15, 8]} />
          </mesh>
          {/* 红色防翘头小轮 */}
          <mesh position={[-0.32, -0.06, -1.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0.32, -0.06, -1.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* =========================================================================
          5. 钛合金排气管与火舌 (Exhaust Pipes & Flame Emitters)
          ========================================================================= */}
      {exhaust?.id === "exhaust_side_exit" ? (
        <group>
          {/* 侧出排气口：内嵌于侧裙内部，深色钛合金金属套筒 */}
          <mesh position={[-0.84, 0.10, 0.35]} rotation={[0, 0, Math.PI / 2]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
          </mesh>
          <mesh position={[0.84, 0.10, 0.35]} rotation={[0, 0, Math.PI / 2]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 12]} />
          </mesh>
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.92, 0.10, 0.35]} rotation={[0, 0, -Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.07, 0.45, 8]} />
            </mesh>
            <mesh position={[0.92, 0.10, 0.35]} rotation={[0, 0, Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.07, 0.45, 8]} />
            </mesh>
          </group>
        </group>
      ) : (
        <group>
          {/* 后置双出大口径钛合金尾喉 */}
          <mesh position={[-0.38, 0.12, -2.15]} rotation={[Math.PI / 2, 0, 0]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.12, 12]} />
          </mesh>
          <mesh position={[0.38, 0.12, -2.15]} rotation={[Math.PI / 2, 0, 0]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.12, 12]} />
          </mesh>
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.38, 0.12, -2.36]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.55, 8]} />
            </mesh>
            <mesh position={[0.38, 0.12, -2.36]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.55, 8]} />
            </mesh>
          </group>
        </group>
      )}

      {/* =========================================================================
          6. 四只精细锻造车轮总成 (Four Detailed Wheel Assemblies)
          ========================================================================= */}
      {/* 左前轮 */}
      <group position={[-0.82, 0, 1.25]}>
        <WheelAssembly
          isRightSide={false}
          isRear={false}
          isWideRear={false}
          rubberMat={rubberMat}
          rimMat={rimMat}
          lipMat={chromeMat}
          rotorMat={brakeRotorMat}
          caliperMat={brakeCaliperMat}
          wheelRef={(el) => { wheelsRef.current.fl = el; }}
        />
      </group>

      {/* 右前轮 */}
      <group position={[0.82, 0, 1.25]}>
        <WheelAssembly
          isRightSide={true}
          isRear={false}
          isWideRear={false}
          rubberMat={rubberMat}
          rimMat={rimMat}
          lipMat={chromeMat}
          rotorMat={brakeRotorMat}
          caliperMat={brakeCaliperMat}
          wheelRef={(el) => { wheelsRef.current.fr = el; }}
        />
      </group>

      {/* 左后轮 (大肥胎外扩包裹) */}
      <group position={[isWideRearTire ? -0.88 : -0.84, 0.02, -1.25]}>
        <WheelAssembly
          isRightSide={false}
          isRear={true}
          isWideRear={isWideRearTire}
          rubberMat={rubberMat}
          rimMat={rimMat}
          lipMat={chromeMat}
          rotorMat={brakeRotorMat}
          caliperMat={brakeCaliperMat}
          wheelRef={(el) => { wheelsRef.current.rl = el; }}
        />
      </group>

      {/* 右后轮 (大肥胎外扩包裹) */}
      <group position={[isWideRearTire ? 0.88 : 0.84, 0.02, -1.25]}>
        <WheelAssembly
          isRightSide={true}
          isRear={true}
          isWideRear={isWideRearTire}
          rubberMat={rubberMat}
          rimMat={rimMat}
          lipMat={chromeMat}
          rotorMat={brakeRotorMat}
          caliperMat={brakeCaliperMat}
          wheelRef={(el) => { wheelsRef.current.rr = el; }}
        />
      </group>

      {/* =========================================================================
          7. 烧胎白烟粒子系统 (Tire Smoke Particles)
          ========================================================================= */}
      <points ref={smokeParticlesRef} visible={false}>
        <bufferGeometry attach="geometry" {...smokeGeo} />
        <pointsMaterial attach="material" size={0.5} color="#f8fafc" transparent opacity={0.65} depthWrite={false} />
      </points>
    </group>
  );
};
