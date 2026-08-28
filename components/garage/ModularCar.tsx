// components/garage/ModularCar.tsx
// Redline Garage - High-Polish Modular 3D Vehicle Renderer with Rich PBR Details

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

  // 1. 高阶 PBR 材质配置 (提升明亮度与反射层次)
  const carPaintMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(config.paintColor || "#e62117"),
      metalness: config.paintFinish === "matte" ? 0.15 : 0.88,
      roughness: config.paintFinish === "matte" ? 0.75 : 0.14,
      clearcoat: config.paintFinish === "matte" ? 0.0 : 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
      envMapIntensity: 1.6,
    });
  }, [config.paintColor, config.paintFinish]);

  const carbonFiberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#25282f"), // 提亮暗部细节，避免死黑
      roughness: 0.35,
      metalness: 0.45,
      envMapIntensity: 1.2,
    });
  }, []);

  const chromeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f8fafc"),
      roughness: 0.08,
      metalness: 0.98,
      envMapIntensity: 2.0,
    });
  }, []);

  const titaniumBurnMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3b82f6"),
      roughness: 0.2,
      metalness: 0.85,
      emissive: new THREE.Color("#1d4ed8"),
      emissiveIntensity: 0.2,
    });
  }, []);

  const brakeRotorMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#cbd5e1"),
      roughness: 0.25,
      metalness: 0.9,
    });
  }, []);

  const brakeCaliperMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ef4444"),
      roughness: 0.3,
      metalness: 0.5,
    });
  }, []);

  const rubberMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#22242a"), // 提亮轮胎胶质灰度
      roughness: 0.85,
      metalness: 0.08,
    });
  }, []);

  const glassMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1e293b"),
      roughness: 0.05,
      metalness: 0.2,
      transmission: 0.65,
      transparent: true,
      opacity: 0.88,
      reflectivity: 0.9,
    });
  }, []);

  const glowingFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ff5500"),
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  const nosBlueFlameMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00e5ff"),
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  // 烟雾粒子系统 (Procedural Tire Smoke)
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
    const wheelRadius = 0.34;
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

  const isMuscle = chassis?.style === "muscle" || !chassis?.style;
  const isTuner = chassis?.style === "tuner";
  const isHyper = chassis?.style === "hyper";
  const isDragster = chassis?.style === "dragster";

  const isWideRearTire = tires?.tireType === "drag_radial";

  return (
    <group ref={rootRef} position={[0, 0.34, 0]}>
      {/* 1. 碳纤维底盘大梁 */}
      <mesh position={[0, 0.15, 0]} material={carbonFiberMat} castShadow receiveShadow>
        <boxGeometry args={[1.52, 0.18, 4.2]} />
      </mesh>

      {/* 2. 车体造型 */}
      {isMuscle && (
        <group>
          {/* 肌肉引擎舱 */}
          <mesh position={[0, 0.44, 0.9]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.54, 0.46, 1.8]} />
          </mesh>
          {/* 机盖力量感中轴隆起 */}
          <mesh position={[0, 0.68, 0.9]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[0.7, 0.06, 1.4]} />
          </mesh>
          {/* 座舱 */}
          <mesh position={[0, 0.68, -0.4]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.44, 0.46, 1.6]} />
          </mesh>
          <mesh position={[0, 0.74, -0.4]} material={glassMat}>
            <boxGeometry args={[1.46, 0.46, 1.4]} />
          </mesh>
          {/* 车尾箱 */}
          <mesh position={[0, 0.46, -1.6]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.52, 0.44, 1.0]} />
          </mesh>
          {/* 镀铬中网格栅 */}
          <mesh position={[0, 0.42, 1.81]} material={chromeMat}>
            <boxGeometry args={[1.48, 0.34, 0.05]} />
          </mesh>
          {/* 经典双圆大灯 (明亮 LED 质感) */}
          <mesh position={[-0.55, 0.42, 1.84]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff2d6" emissiveIntensity={3.0} />
          </mesh>
          <mesh position={[0.55, 0.42, 1.84]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff2d6" emissiveIntensity={3.0} />
          </mesh>
        </group>
      )}

      {isTuner && (
        <group>
          {/* JDM 战神流线车身 */}
          <mesh position={[0, 0.4, 0.8]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.56, 0.42, 1.9]} />
          </mesh>
          <mesh position={[0, 0.64, -0.3]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.4, 0.44, 1.7]} />
          </mesh>
          <mesh position={[0, 0.68, -0.3]} material={glassMat}>
            <boxGeometry args={[1.42, 0.44, 1.5]} />
          </mesh>
          <mesh position={[0, 0.44, -1.6]} material={carPaintMaterial} castShadow receiveShadow>
            <boxGeometry args={[1.54, 0.4, 1.1]} />
          </mesh>
          {/* 竞技中冷器 */}
          <mesh position={[0, 0.28, 1.78]} material={chromeMat}>
            <boxGeometry args={[0.95, 0.26, 0.1]} />
          </mesh>
          {/* 赛道透镜大灯 */}
          <mesh position={[-0.6, 0.46, 1.74]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.26, 0.09, 0.05]} />
            <meshStandardMaterial color="#ffffff" emissive="#00f2fe" emissiveIntensity={3.5} />
          </mesh>
          <mesh position={[0.6, 0.46, 1.74]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.26, 0.09, 0.05]} />
            <meshStandardMaterial color="#ffffff" emissive="#00f2fe" emissiveIntensity={3.5} />
          </mesh>
        </group>
      )}

      {isHyper && (
        <group>
          {/* 超跑楔形低趴车体 */}
          <mesh position={[0, 0.34, 0.9]} rotation={[0.08, 0, 0]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.68, 0.34, 1.8]} />
          </mesh>
          <mesh position={[0, 0.54, -0.2]} material={glassMat} castShadow>
            <sphereGeometry args={[0.84, 16, 16]} />
          </mesh>
          <mesh position={[-0.82, 0.38, -0.5]} material={carbonFiberMat}>
            <boxGeometry args={[0.16, 0.3, 0.9]} />
          </mesh>
          <mesh position={[0.82, 0.38, -0.5]} material={carbonFiberMat}>
            <boxGeometry args={[0.16, 0.3, 0.9]} />
          </mesh>
          {/* 贯穿式高亮尾灯 */}
          <mesh position={[0, 0.44, -2.06]}>
            <boxGeometry args={[1.52, 0.06, 0.04]} />
            <meshStandardMaterial color="#ff1133" emissive="#ff1133" emissiveIntensity={4.0} />
          </mesh>
        </group>
      )}

      {isDragster && (
        <group>
          {/* Pro-Mod 管阵车架 */}
          <mesh position={[0, 0.3, 0.5]} material={carPaintMaterial} castShadow>
            <boxGeometry args={[1.42, 0.34, 2.6]} />
          </mesh>
          <mesh position={[0, 0.58, -1.0]} material={carbonFiberMat}>
            <boxGeometry args={[1.12, 0.42, 1.2]} />
          </mesh>
          {/* 红色强化防滚架 */}
          <mesh position={[-0.48, 0.58, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.1, 8]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0.48, 0.58, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 1.1, 8]} />
            <meshStandardMaterial color="#ff2200" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* 3. 引擎与进气歧管 */}
      {engine?.engineType === "v8_blower" && (
        <group position={[0, 0.68, 0.9]}>
          <mesh material={chromeMat} castShadow>
            <boxGeometry args={[0.5, 0.32, 0.72]} />
          </mesh>
          <mesh position={[0, 0.24, 0.16]} material={chromeMat}>
            <boxGeometry args={[0.58, 0.2, 0.46]} />
          </mesh>
          {/* 三联红色进气蝶阀 */}
          {[-0.16, 0, 0.16].map((xOffset, idx) => (
            <mesh key={idx} position={[xOffset, 0.24, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.065, 16]} />
              <meshStandardMaterial color="#ff1100" emissive="#ff2200" emissiveIntensity={1.5} />
            </mesh>
          ))}
          <mesh position={[0, -0.05, 0.38]} rotation={[Math.PI / 2, 0, 0]} material={carbonFiberMat}>
            <cylinderGeometry args={[0.13, 0.13, 0.09, 16]} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v6_twin_turbo" && (
        <group position={[0, 0.52, 0.9]}>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.68, 0.26, 0.62]} />
          </mesh>
          <mesh position={[-0.44, 0.06, 0.1]} material={chromeMat} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.13, 0.065, 8, 16]} />
          </mesh>
          <mesh position={[0.44, 0.06, 0.1]} material={chromeMat} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.13, 0.065, 8, 16]} />
          </mesh>
          <mesh position={[0, 0.14, 0.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.055, 0.055, 0.72, 12]} />
            <meshStandardMaterial color="#0077ff" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      )}

      {engine?.engineType === "v12_quad" && (
        <group position={[0, 0.54, -0.8]}>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[0.88, 0.34, 0.92]} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.62, 0.06, 0.72]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
          </mesh>
          {[-0.46, 0.46].map((x) =>
            [-0.22, 0.22].map((z, idx) => (
              <mesh key={`${x}-${idx}`} position={[x, 0.09, z]} material={chromeMat}>
                <cylinderGeometry args={[0.085, 0.085, 0.24, 12]} />
              </mesh>
            ))
          )}
        </group>
      )}

      {engine?.engineType === "dual_ev" && (
        <group position={[0, 0.3, 0]}>
          <mesh material={carbonFiberMat}>
            <boxGeometry args={[1.42, 0.16, 2.85]} />
          </mesh>
          <mesh position={[0, 0.09, 1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.72, 16]} />
            <meshStandardMaterial color="#ea580c" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.09, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.78, 16]} />
            <meshStandardMaterial color="#ea580c" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0.26, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 2.25, 8]} />
            <meshStandardMaterial color="#ff6b00" emissive="#ff6b00" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* 4. 氮气瓶 */}
      {nos?.nosCapacitySec && nos.nosCapacitySec > 0 && (
        <group position={[0, 0.58, -0.6]}>
          <mesh position={[-0.2, 0, 0]} rotation={[0.4, 0, 0.3]} castShadow>
            <cylinderGeometry args={[0.085, 0.085, 0.46, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.15} />
          </mesh>
          {nos.id !== "nos_single_50" && (
            <mesh position={[0.2, 0, 0]} rotation={[0.4, 0, -0.3]} castShadow>
              <cylinderGeometry args={[0.085, 0.085, 0.46, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.15} />
            </mesh>
          )}
        </group>
      )}

      {/* 5. 空力套件 */}
      {aero?.id === "aero_gt_wing" && (
        <group position={[0, 0.86, -1.86]}>
          <mesh position={[-0.46, -0.16, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.36, 0.12]} />
          </mesh>
          <mesh position={[0.46, -0.16, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.04, 0.36, 0.12]} />
          </mesh>
          <mesh material={carbonFiberMat} castShadow>
            <boxGeometry args={[1.74, 0.045, 0.34]} />
          </mesh>
          <mesh position={[-0.88, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.2, 0.36]} />
          </mesh>
          <mesh position={[0.88, 0, 0]} material={carbonFiberMat}>
            <boxGeometry args={[0.02, 0.2, 0.36]} />
          </mesh>
        </group>
      )}

      {aero?.hasWheelieBar && (
        <group position={[0, 0.05, -2.1]}>
          <mesh position={[-0.35, 0.05, -0.6]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.025, 0.025, 1.25, 8]} />
          </mesh>
          <mesh position={[0.35, 0.05, -0.6]} rotation={[0.15 + Math.PI / 2, 0, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.025, 0.025, 1.25, 8]} />
          </mesh>
          <mesh position={[-0.35, -0.06, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          <mesh position={[0.35, -0.06, -1.2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.05, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 6. 排气系统与火舌 */}
      {exhaust?.id === "exhaust_side_exit" ? (
        <group>
          <mesh position={[-0.82, 0.14, 0.4]} rotation={[0, 0, Math.PI / 2]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.13, 12]} />
          </mesh>
          <mesh position={[0.82, 0.14, 0.4]} rotation={[0, 0, Math.PI / 2]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.13, 12]} />
          </mesh>
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.94, 0.14, 0.4]} rotation={[0, 0, -Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.5, 8]} />
            </mesh>
            <mesh position={[0.94, 0.14, 0.4]} rotation={[0, 0, Math.PI / 2]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.09, 0.5, 8]} />
            </mesh>
          </group>
        </group>
      ) : (
        <group>
          <mesh position={[-0.38, 0.16, -2.12]} rotation={[Math.PI / 2, 0, 0]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.16, 12]} />
          </mesh>
          <mesh position={[0.38, 0.16, -2.12]} rotation={[Math.PI / 2, 0, 0]} material={titaniumBurnMat}>
            <cylinderGeometry args={[0.065, 0.065, 0.16, 12]} />
          </mesh>
          <group ref={flameRef} visible={false}>
            <mesh position={[-0.38, 0.16, -2.38]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.095, 0.6, 8]} />
            </mesh>
            <mesh position={[0.38, 0.16, -2.38]} rotation={[-Math.PI / 2, 0, 0]} material={nosActive ? nosBlueFlameMat : glowingFlameMat}>
              <coneGeometry args={[0.095, 0.6, 8]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. 四轮总成 (带钻孔刹车盘与红色卡钳) */}
      {/* 左前轮 */}
      <group ref={(el) => { wheelsRef.current.fl = el; }} position={[-0.82, 0, 1.25]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.22, 0.22, 0.23, 16]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={brakeRotorMat}>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
        </mesh>
        <mesh position={[0.06, 0.08, 0]} material={brakeCaliperMat}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
        </mesh>
      </group>

      {/* 右前轮 */}
      <group ref={(el) => { wheelsRef.current.fr = el; }} position={[0.82, 0, 1.25]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.22, 0.22, 0.23, 16]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={brakeRotorMat}>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
        </mesh>
        <mesh position={[-0.06, 0.08, 0]} material={brakeCaliperMat}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
        </mesh>
      </group>

      {/* 左后轮 */}
      <group ref={(el) => { wheelsRef.current.rl = el; }} position={[-0.85, 0.03, -1.25]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.38 : 0.26, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.2, 0.2, isWideRearTire ? 0.39 : 0.27, 16]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={brakeRotorMat}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 16]} />
        </mesh>
      </group>

      {/* 右后轮 */}
      <group ref={(el) => { wheelsRef.current.rr = el; }} position={[0.85, 0.03, -1.25]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={rubberMat} castShadow>
          <cylinderGeometry args={[isWideRearTire ? 0.37 : 0.37, isWideRearTire ? 0.37 : 0.34, isWideRearTire ? 0.38 : 0.26, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={chromeMat}>
          <cylinderGeometry args={[0.2, 0.2, isWideRearTire ? 0.39 : 0.27, 16]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={brakeRotorMat}>
          <cylinderGeometry args={[0.16, 0.16, 0.02, 16]} />
        </mesh>
      </group>

      {/* 8. 白烟粒子 */}
      <points ref={smokeParticlesRef} visible={false}>
        <bufferGeometry attach="geometry" {...smokeGeo} />
        <pointsMaterial attach="material" size={0.5} color="#f1f5f9" transparent opacity={0.65} depthWrite={false} />
      </points>
    </group>
  );
};
