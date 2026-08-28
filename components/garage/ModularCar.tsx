// components/garage/ModularCar.tsx
// Redline Garage - High-Detail Procedural Modular 3D Car System

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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
}

export const ModularCar: React.FC<ModularCarProps> = ({
  config,
  speedMs = 0,
  rpm = 1000,
  exhaustFlame = false,
  nosActive = false,
  wheelieAngleDeg = 0,
  tireSmokeIntensity = 0,
  isGarageView = false,
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

  // 材质配置
  const carPaintMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.paintColor || "#e62117"),
      metalness: config.paintFinish === "matte" ? 0.1 : 0.85,
      roughness: config.paintFinish === "matte" ? 0.8 : 0.18,
      clearcoat: config.paintFinish === "matte" ? 0.0 : 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });
  }, [config.paintColor, config.paintFinish]);

  const carbonFiberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a1a1c"),
      roughness: 0.35,
      metalness: 0.4,
    });
  }, []);

  const chromeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f0f2f5"),
      roughness: 0.1,
      metalness: 0.95,
    });
  }, []);

  const rubberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#181818"),
      roughness: 0.9,
      metalness: 0.05,
    });
  }, []);

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#111822"),
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });
  }, []);

  const glowingFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ff6600"),
      transparent: true,
      opacity: 0.9,
    });
  }, []);

  const nosBlueFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00ccff"),
      transparent: true,
      opacity: 0.85,
    });
  }, []);

  // 烟雾粒子系统 (Procedural Tire Smoke)
  const smokeCount = 80;
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

  // 动画帧循环：车轮旋转、粒子散布与排气火舌闪烁
  useFrame((_, delta) => {
    // 1. 车轮自转 (根据线速度计算角速度 omega = v / r)
    const wheelRadius = 0.34;
    const rotSpeed = isGarageView ? 0 : (speedMs / wheelRadius) * delta;
    if (wheelsRef.current.fl) wheelsRef.current.fl.rotation.x += rotSpeed;
    if (wheelsRef.current.fr) wheelsRef.current.fr.rotation.x += rotSpeed;
    if (wheelsRef.current.rl) wheelsRef.current.rl.rotation.x += rotSpeed;
    if (wheelsRef.current.rr) wheelsRef.current.rr.rotation.x += rotSpeed;

    // 2. 翘头角度平滑过渡
    if (rootRef.current) {
      const targetPitch = THREE.MathUtils.degToRad(wheelieAngleDeg);
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, -targetPitch, 0.2);
    }

    // 3. 排气火焰随机缩放
    if (flameRef.current) {
      if (exhaustFlame || nosActive) {
        flameRef.current.visible = true;
        const scale = 0.8 + Math.random() * 0.7;
        flameRef.current.scale.set(scale, scale, scale * (nosActive ? 1.8 : 1.2));
      } else {
        flameRef.current.visible = false;
      }
    }

    // 4. 轮胎白烟粒子更新
    if (smokeParticlesRef.current) {
      if (tireSmokeIntensity > 0.05) {
        smokeParticlesRef.current.visible = true;
        const posAttr = smokeParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < smokeCount; i++) {
          arr[i * 3 + 2] -= (speedMs * 0.6 + 5.0) * delta; // 向后扩散
          arr[i * 3 + 1] += (1.2 + Math.random() * 1.5) * delta; // 向上漂浮
          arr[i * 3] += (Math.random() - 0.5) * 1.2 * delta; // 横向散开

          // 循环重置
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

  // 获取各组件信息
  const chassis = PARTS_CATALOG.chassis.find((c) => c.id === config.chassisId);
  const engine = PARTS_CATALOG.engine.find((e) => e.id === config.engineId);
  const tires = PARTS_CATALOG.tires.find((t) => t.id === config.tiresId);
  const aero = PARTS_CATALOG.aero.find((a) => a.id === config.aeroId);
  const exhaust = PARTS_CATALOG.exhaust.find((ex) => ex.id === config.exhaustId);
  const nos = PARTS_CATALOG.nos.find((n) => n.id === config.nosId);

  const isMuscle = chassis?.style === "muscle" || !chassis?.style;
  const isTuner = chassis?.style === "tuner";
  const isHyper = chassis?.style === "hyper";
  const isDragster = chassis?.style === "dragster";

  const isWideRearTire = tires?.tireType === "drag_radial";

  return (
    <group ref={rootRef} position={[0, 0.34, 0]}>
      {/* ================= 车身与底盘 ================= */}
      {/* 1. 基础主底盘 */}
      <mesh position={[0, 0.15, 0]} material={carbonFiberMat} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.18, 4.2]} />
      </mesh>

      {/* 2. 车身主体结构根据风格适配 */}
      {isMuscle && (
        <group>
          {/* 肌肉车前引擎舱 */}
          <mesh position={[0, 0.42, 0.9]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.52, 0.45, 1.8]} />
          </mesh>
          {/* 肌肉车座舱 */}
          <mesh position={[0, 0.65, -0.4]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.42, 0.45, 1.6]} />
          </mesh>
          {/* 车顶与玻璃 */}
          <mesh position={[0, 0.72, -0.4]} material={glassMat}>
            <boxGeometry args={[1.44, 0.46, 1.4]} />
          </mesh>
          {/* 车尾箱 */}
          <mesh position={[0, 0.45, -1.6]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.42, 1.0]} />
          </mesh>
          {/* 前格栅与圆灯 */}
          <mesh position={[0, 0.4, 1.81]} material={carbonFiberMat}>
            <boxGeometry args={[1.48, 0.32, 0.05]} />
          </mesh>
          <mesh position={[-0.55, 0.4, 1.83]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffeecc" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.55, 0.4, 1.83]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffeecc" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {isTuner && (
        <group>
          {/* JDM 战神流线车身 */}
          <mesh position={[0, 0.38, 0.8]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.55, 0.4, 1.9]} />
          </mesh>
          <mesh position={[0, 0.62, -0.3]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.38, 0.42, 1.7]} />
          </mesh>
          <mesh position={[0, 0.66, -0.3]} material={glassMat}>
            <boxGeometry args={[1.4, 0.42, 1.5]} />
          </mesh>
          <mesh position={[0, 0.42, -1.6]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.52, 0.38, 1.1]} />
          </mesh>
          {/* 前中冷器 (Intercooler) */}
          <mesh position={[0, 0.25, 1.78]} material={chromeMat}>
            <boxGeometry args={[0.9, 0.24, 0.1]} />
          </mesh>
          {/* 犀利大灯 */}
          <mesh position={[-0.6, 0.45, 1.72]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.05]} />
            <meshStandardMaterial color="#ffffff" emissive="#00d2ff" emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[0.6, 0.45, 1.72]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.05]} />
            <meshStandardMaterial color="#ffffff" emissive="#00d2ff" emissiveIntensity={2.0} />
          </mesh>
        </group>
      )}

      {isHyper && (
        <group>
          {/* 超跑楔形低趴车体 */}
          <mesh position={[0, 0.32, 0.9]} rotation={[0.08, 0, 0]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.65, 0.32, 1.8]} />
          </mesh>
          {/* 水滴型全碳座舱 */}
          <mesh position={[0, 0.52, -0.2]} material={glassMat} castShadow>
            <sphereGeometry args={[0.82, 16, 16]} />
          </mesh>
          {/* 侧面大导风口 */}
          <mesh position={[-0.8, 0.35, -0.5]} material={carbonFiberMat}>
            <boxGeometry args={[0.15, 0.28, 0.9]} />
          </mesh>
          <mesh position={[0.8, 0.35, -0.5]} material={carbonFiberMat}>
            <boxGeometry args={[0.15, 0.28, 0.9]} />
          </mesh>
          {/* 贯穿式尾灯 */}
          <mesh position={[0, 0.42, -2.05]}>
            <boxGeometry args={[1.5, 0.05, 0.04]} />
            <meshStandardMaterial color="#ff0022" emissive="#ff0022" emissiveIntensity={2.5} />
          </mesh>
        </group>
      )}

      {isDragster && (
        <group>
          {/* 直线加速 Pro-Mod 管架底盘 */}
          <mesh position={[0, 0.28, 0.5]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.4, 0.32, 2.6]} />
          </mesh>
          {/* 极低单座防滚架座舱 */}
          <mesh position={[0, 0.55, -1.0]} material={carbonFiberMat}>
            <boxGeometry args={[1.1, 0.4, 1.2]} />
          </mesh>
          {/* 红色防滚笼外露结构 */}
          <mesh position={[-0.48, 0.55, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0.48, 0.55, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* ================= 引擎模块可视化 ================= */}
      {engine?.engineType === "v8_blower" && (
        <group position={[0, 0.65, 0.9]}>
          {/* 经典 V8 顶置机械增压器 (Supercharger Blower) */}
          <mesh material={chromeMat} castShadow>
            <boxGeometry args={[0.48, 0.3, 0.7]} />
          </mesh>
          {/* 红色三联节气门进气勺 (Birdcatcher Scoop) */}
          <mesh position={[0, 0.22, 0.15]} material={chromeMat}>
            <boxGeometry args={[0.55, 0.18, 0.45]} />
          </mesh>
          <mesh position={[-0.15, 0.22, 0.39]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 0.22, 0.39]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0.15, 0.22, 0.39]}>
            <circleGeometry args={[0.06, 16]} />
            <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.8} />
          </mesh>
          {/* 增压皮带轮 */}
          <mesh position={[0, -0.05, 0.36]} rotation={[Math.PI / 2, 0, 0]} material={carbonFiberMat}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 16]} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v6_twin_turbo" && (
        <group position={[0, 0.5, 0.9]}>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.65, 0.25, 0.6]} />
          </mesh>
          {/* 双涡轮蜗牛壳 */}
          <mesh position={[-0.42, 0.05, 0.1]} material={chromeMat} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.12, 0.06, 8, 16]} />
          </mesh>
          <mesh position={[0.42, 0.05, 0.1]} material={chromeMat} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.12, 0.06, 8, 16]} />
          </mesh>
          {/* 蓝色进气硅胶管 */}
          <mesh position={[0, 0.12, 0.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 12]} />
            <meshStandardMaterial color="#0066ff" roughness={0.3} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v12_quad" && (
        <group position={[0, 0.52, -0.8]}>
          {/* 中后置 W12 狂暴引擎总成 */}
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.85, 0.32, 0.9]} />
          </mesh>
          {/* 金色隔热层金箔装饰 */}
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.6, 0.05, 0.7]} />
            <meshStandardMaterial color="#e5a93b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* 4 颗涡轮增压进气筒 */}
          <mesh position={[-0.45, 0.08, -0.2]} material={chromeMat}>
            <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
          </mesh>
          <mesh position={[0.45, 0.08, -0.2]} material={chromeMat}>
            <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
          </mesh>
          <mesh position={[-0.45, 0.08, 0.2]} material={chromeMat}>
            <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
          </mesh>
          <mesh position={[0.45, 0.08, 0.2]} material={chromeMat}>
            <cylinderGeometry args={[0.08, 0.08, 0.22, 12]} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "dual_ev" && (
        <group position={[0, 0.28, 0]}>
          {/* 纯电高压电池包底板与橙色动力线 */}
          <mesh material={carbonFiberMat}>
            <boxGeometry args={[1.4, 0.15, 2.8]} />
          </mesh>
          {/* 前后双电机铜壳 */}
          <mesh position={[0, 0.08, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.7, 16]} />
            <meshStandardMaterial color="#c87533" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.75, 16]} />
            <meshStandardMaterial color="#c87533" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* 橙色高压线束 */}
          <mesh position={[0.25, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 2.2, 8]} />
            <meshStandardMaterial color="#ff5500" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* ================= 氮气气瓶 (NOS Bottles) ================= */}
      {nos?.nosCapacitySec && nos.nosCapacitySec > 0 && (
        <group position={[0, 0.55, -0.6]}>
          {/* 蓝色阳极氧化氮气瓶 */}
          <mesh position={[-0.2, 0, 0]} rotation={[0.4, 0, 0.3]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.45, 16]} />
            <meshStandardMaterial color="#0055ff" metalness={0.85} roughness={0.2} />
          </mesh>
          {nos.id !== "nos_single_50" && (
            <mesh position={[0.2, 0, 0]} rotation={[0.4, 0, -0.3]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.45, 16]} />
              <meshStandardMaterial color="#0055ff" metalness={0.85} roughness={0.2} />
            </mesh>
          )}
          {/* 气压表 */}
          <mesh position={[-0.2, 0.25, -0.05]} material={chromeMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
          </mesh>
        </group>
      )}

      {/* ================= 空力套件 (Aero Kit) ================= */}
      {aero?.id === "aero_gt_wing" && (
        <group position={[0, 0.82, -1.85]}>
          {/* 双天鹅颈碳纤维支架 */}
          <mesh position={[-0.45, -0.15, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.35, 0.12]} />
          </mesh>
          <mesh position={[0.45, -0.15, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.35, 0.12]} />
          </mesh>
          {/* 主翼板 */}
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[1.7, 0.04, 0.32]} />
          </mesh>
          {/* 两侧端板 */}
          <mesh position={[-0.85, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.18, 0.34]} />
          </mesh>
          <mesh position={[0.85, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.18, 0.34]} />
          </mesh>
        </group>
      )}

      {aero?.hasWheelieBar && (
        <group position={[0, 0.05, -2.1]}>
          {/* 防翘头支撑管架 */}
          <mesh position={[-0.35, 0.05, -0.6]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
          </mesh>
          <mesh position={[0.35, 0.05, -0.6]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
          </mesh>
          {/* 两个红色防撞小滚轮 */}
          <mesh position={[-0.35, -0.06, -1.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} />
          </mesh>
          <mesh position={[0.35, -0.06, -1.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} />
          </mesh>
          {/* 红色减速降落伞包 */}
          <mesh position={[0, 0.35, -0.1]} material={carbonFiberMat}>
            <boxGeometry args={[0.32, 0.22, 0.18]} />
          </mesh>
          <mesh position={[0, 0.35, -0.2]}>
            <boxGeometry args={[0.26, 0.16, 0.05]} />
            <meshStandardMaterial color="#ff3300" roughness={0.6} />
          </mesh>
        </group>
      )}

      {aero?.id === "aero_widebody" && (
        <group>
          {/* 宽体铆钉翼子板 */}
          <mesh position={[-0.85, 0.32, 1.2]} material={carPaintMaterial}>
            <boxGeometry args={[0.18, 0.36, 0.8]} />
          </mesh>
          <mesh position={[0.85, 0.32, 1.2]} material={carPaintMaterial}>
            <boxGeometry args={[0.18, 0.36, 0.8]} />
          </mesh>
          <mesh position={[-0.88, 0.35, -1.2]} material={carPaintMaterial}>
            <boxGeometry args={[0.22, 0.42, 0.9]} />
          </mesh>
          <mesh position={[0.88, 0.35, -1.2]} material={carPaintMaterial}>
            <boxGeometry args={[0.22, 0.42, 0.9]} />
          </mesh>
          {/* 前唇风刀 */}
          <mesh position={[0, 0.08, 2.05]} material={carbonFiberMat}>
            <boxGeometry args={[1.7, 0.04, 0.25]} />
          </mesh>
        </group>
      )}

      {/* ================= 排气系统与排气火舌 ================= */}
      {exhaust?.id === "exhaust_side_exit" ? (
        <group>
          {/* 车身侧出排气 */}
          <mesh position={[-0.82, 0.12, 0.4]} rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
          </mesh>
          <mesh position={[0.82, 0.12, 0.4]} rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
          </mesh>
          {/* 侧出火舌 */}
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.92, 0.12, 0.4]} rotation={[0, 0, -Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.08, 0.45, 8]} />
            </mesh>
            <mesh position={[0.92, 0.12, 0.4]} rotation={[0, 0, Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.08, 0.45, 8]} />
            </mesh>
          </group>
        </group>
      ) : (
        <group>
          {/* 车尾排气管 */}
          <mesh position={[-0.38, 0.16, -2.12]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 12]} />
          </mesh>
          <mesh position={[0.38, 0.16, -2.12]} rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 12]} />
          </mesh>
          {/* 尾部喷火 */}
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.38, 0.16, -2.35]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.55, 8]} />
            </mesh>
            <mesh position={[0.38, 0.16, -2.35]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.55, 8]} />
            </mesh>
          </group>
        </group>
      )}

      {/* ================= 四轮与轮胎轮毂 ================= */}
      {/* 左前轮 */}
      <group
        ref={(el) => {
          wheelsRef.current.fl = el;
        }}
        position={[-0.82, 0, 1.25]}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.22, 0.22, 0.23, 16]} />
        </mesh>
      </group>

      {/* 右前轮 */}
      <group
        ref={(el) => {
          wheelsRef.current.fr = el;
        }}
        position={[0.82, 0, 1.25]}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.22, 0.22, 0.23, 16]} />
        </mesh>
      </group>

      {/* 左后轮 (大肥胎 / 宽胎) */}
      <group
        ref={(el) => {
          wheelsRef.current.rl = el;
        }}
        position={[-0.85, 0.03, -1.25]}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.38 : 0.26, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.2, 0.2, isWideRearTire ? 0.39 : 0.27, 16]} />
        </mesh>
      </group>

      {/* 右后轮 */}
      <group
        ref={(el) => {
          wheelsRef.current.rr = el;
        }}
        position={[0.85, 0.03, -1.25]}
      >
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[isWideRearTire ? 0.37 : 0.37, isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.38 : 0.26, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.2, 0.2, isWideRearTire ? 0.39 : 0.27, 16]} />
        </mesh>
      </group>

      {/* ================= 烧胎与打滑烟雾粒子 ================= */}
      <points ref={smokeParticlesRef} visible={false}>
        <bufferGeometry attach="geometry" {...smokeGeo} />
        <pointsMaterial attach="material" size={0.45} color="#e6eaee" transparent opacity={0.65} depthWrite={false} />
      </points>
    </group>
  );
};
