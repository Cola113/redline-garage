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

// 动态赛道环境 (560米程序化沥青路面、胶痕、两侧金属护栏+立柱、距离牌、轮胎墙、广告灯箱、看台剪影+灯串、终点方格旗龙门架)
const DragStripTrack: React.FC<{ playerZ: number; quality: QualitySetting }> = ({
  playerZ,
  quality,
}) => {
  const isHigh = quality === "high";
  const isLow = quality === "low";

  // 1. 程序化沥青纹理 (Procedural Asphalt Texture)
  const asphaltTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#1e2229";
    ctx.fillRect(0, 0, 512, 512);
    // 沥青粗糙碎石与颗粒噪点
    for (let i = 0; i < 35000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const g = Math.floor(18 + Math.random() * 45);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
      ctx.fillRect(x, y, Math.random() > 0.85 ? 2 : 1, Math.random() > 0.85 ? 2 : 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 120);
    return tex;
  }, []);

  // 2. 终点方格旗纹理 (Checkered Flag Banner Texture)
  const checkeredTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const size = 32;
    for (let y = 0; y < 128; y += size) {
      for (let x = 0; x < 512; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#ffffff" : "#111111";
        ctx.fillRect(x, y, size, size);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  // 沿途立柱与高杆探照灯塔
  const lightPoles = useMemo(() => {
    const poles = [];
    for (let z = -20; z <= 480; z += 40) {
      poles.push(z);
    }
    return poles;
  }, []);

  // 护栏立柱 (每 10 米一组立柱，每 100 米一组加固醒目标记)
  const guardrailPosts = useMemo(() => {
    const posts = [];
    for (let z = -25; z <= 520; z += 10) {
      posts.push({ z, isMajor: z % 100 === 0 });
    }
    return posts;
  }, []);

  // 广告灯箱赞助商列表
  const billboards = useMemo(
    () => [
      { z: 40, text: "REDLINE GARAGE", color: "#ff3b30" },
      { z: 120, text: "NITRO FUEL", color: "#00d2ff" },
      { z: 220, text: "APEX FORGED", color: "#facc15" },
      { z: 280, text: "TWIN TURBO BOOST", color: "#ec4899" },
      { z: 360, text: "PRO MOD RACING", color: "#22c55e" },
      { z: 440, text: "CHAMPIONSHIP", color: "#a855f7" },
    ],
    []
  );

  // 轮胎墙簇
  const tireWalls = useMemo(
    () => [
      { z: -10, side: -1 },
      { z: -10, side: 1 },
      { z: 80, side: -1 },
      { z: 80, side: 1 },
      { z: 190, side: -1 },
      { z: 190, side: 1 },
      { z: 390, side: -1 },
      { z: 390, side: 1 },
      { z: 490, side: -1 },
      { z: 490, side: 1 },
    ],
    []
  );

  // 看台灯串微粒子 (非 low 档启用)
  const [lightStringPoints] = useMemo(() => {
    const pts = [];
    for (let z = -20; z <= 480; z += 6) {
      pts.push(-16.5, 9.8 + Math.sin(z * 0.4) * 0.25, z);
      pts.push(16.5, 9.8 + Math.sin(z * 0.4) * 0.25, z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return [geo];
  }, []);

  return (
    <group>
      {/* 1. 赛道环境光与多维补光 */}
      <ambientLight intensity={0.85} color="#e2e8f0" />
      <directionalLight position={[25, 35, -40]} intensity={2.0} color="#fed7aa" />
      <directionalLight position={[-25, 25, 60]} intensity={1.4} color="#93c5fd" />

      {/* 2. 主沥青赛道 (宽 19米，长 580米，程序化沥青质感) */}
      <mesh position={[0, -0.01, 250]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[19, 600]} />
        <meshStandardMaterial
          color="#22252c"
          roughness={0.85}
          metalness={0.12}
          map={asphaltTexture || undefined}
        />
      </mesh>

      {/* 赛道中央分道虚线与实线 */}
      <mesh position={[0, 0.002, 250]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, 600]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 左右两侧车道边缘白线 */}
      {[-8.5, 8.5].map((x, i) => (
        <mesh key={i} position={[x, 0.003, 250]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 600]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* 起跑线 (0米) 与发车格白方块 (Staging Grid Boxes) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 0.6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[-2.2, 2.2].map((x, i) => (
        <group key={i} position={[x, 0.006, 0]}>
          {/* 发车定位框 */}
          <mesh position={[-0.9, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 4.2]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <mesh position={[0.9, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 4.2]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <mesh position={[0, 0, 2.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.9, 0.1]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          <mesh position={[0, 0, -2.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.9, 0.1]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* 起跑线双胎黑胶痕 (Rubber Burnout Grooves) */}
      {[-2.2, 2.2].map((laneX, laneIdx) => (
        <group key={laneIdx} position={[laneX, 0.004, 35]}>
          <mesh position={[-0.8, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.55, 95]} />
            <meshBasicMaterial color="#0d0e12" />
          </mesh>
          <mesh position={[0.8, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.55, 95]} />
            <meshBasicMaterial color="#0d0e12" />
          </mesh>
        </group>
      ))}

      {/* 3. 两侧金属防撞波形护栏 (W-Beam Guardrails) 与立柱 */}
      {[-9.3, 9.3].map((x, idx) => (
        <group key={idx}>
          {/* 连续金属护栏横板 (上下双层) */}
          <mesh position={[x, 0.55, 250]}>
            <boxGeometry args={[0.12, 0.45, 600]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[x, 1.05, 250]}>
            <boxGeometry args={[0.12, 0.35, 600]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* 混凝土基座底台 */}
          <mesh position={[x, 0.15, 250]}>
            <boxGeometry args={[0.45, 0.3, 600]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 护栏立柱 (每 10 米一组，每 100 米一组加固醒目金属牌) */}
      {guardrailPosts.map((post, idx) => (
        <group key={idx}>
          {[-9.3, 9.3].map((x, sIdx) => (
            <group key={sIdx} position={[x, 0.6, post.z]}>
              <mesh>
                <boxGeometry args={[0.18, 1.2, 0.18]} />
                <meshStandardMaterial color={post.isMajor ? "#facc15" : "#475569"} metalness={0.8} />
              </mesh>
              {post.isMajor && (
                <mesh position={[sIdx === 0 ? 0.2 : -0.2, 0.8, 0]}>
                  <boxGeometry args={[0.1, 0.35, 0.6]} />
                  <meshBasicMaterial color="#facc15" />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}

      {/* 4. 直线加速距离标牌 (60ft / 330ft / 660ft / 1000ft / 1/4 MILE) */}
      {/* 60 FT (18.29 米) */}
      {[-9.5, 9.5].map((x, i) => (
        <group key={`60ft-${i}`} position={[x, 1.8, 18.29]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.7, 1.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[i === 0 ? 0.09 : -0.09, 0, 0]}>
            <planeGeometry args={[1.3, 0.6]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        </group>
      ))}

      {/* 330 FT (100.58 米) */}
      {[-9.5, 9.5].map((x, i) => (
        <group key={`330ft-${i}`} position={[x, 1.8, 100.58]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.7, 1.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[i === 0 ? 0.09 : -0.09, 0, 0]}>
            <planeGeometry args={[1.3, 0.6]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* 660 FT / 1/8 MILE (201.17 米) 醒目中途拱门与标牌 */}
      <group position={[0, 0, 201.17]}>
        <mesh position={[-9.5, 2.2, 0]}>
          <boxGeometry args={[0.2, 1.2, 2.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[-9.38, 2.2, 0]}>
          <planeGeometry args={[2.0, 1.0]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <mesh position={[9.5, 2.2, 0]}>
          <boxGeometry args={[0.2, 1.2, 2.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[9.38, 2.2, 0]}>
          <planeGeometry args={[2.0, 1.0]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 0.8]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
      </group>

      {/* 1000 FT (304.8 米) */}
      {[-9.5, 9.5].map((x, i) => (
        <group key={`1000ft-${i}`} position={[x, 1.8, 304.8]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.7, 1.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[i === 0 ? 0.09 : -0.09, 0, 0]}>
            <planeGeometry args={[1.3, 0.6]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        </group>
      ))}

      {/* 5. 赞助商发光广告灯箱 (Billboards) */}
      {billboards.map((b, idx) => (
        <group key={idx}>
          {[-9.6, 9.6].map((x, sIdx) => (
            <group key={sIdx} position={[x, 2.0, b.z]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.15, 1.2, 4.5]} />
                <meshStandardMaterial color="#090d16" roughness={0.4} />
              </mesh>
              <mesh position={[sIdx === 0 ? 0.09 : -0.09, 0, 0]} rotation={[0, sIdx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
                <planeGeometry args={[4.2, 0.95]} />
                <meshBasicMaterial color={b.color} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 6. 轮胎缓冲墙组 (Tire Stacks) */}
      {tireWalls.map((tw, idx) => (
        <group key={idx} position={[tw.side * 8.4, 0.4, tw.z]}>
          {[-0.3, 0.3].map((dz, di) => (
            <mesh key={di} position={[0, 0, dz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.5, 12]} />
              <meshStandardMaterial
                color={(idx + di) % 2 === 0 ? "#dc2626" : "#f8fafc"}
                roughness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* 7. 远景看台剪影与看台灯串 (低画质档剔除看台灯串与高面数，保留护栏与沥青) */}
      {!isLow && (
        <group>
          {/* 左侧看台 */}
          <group position={[-18, 0, 220]}>
            {/* 阶梯座席剪影 */}
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[10, 7.0, 520]} />
              <meshStandardMaterial color="#11151f" roughness={0.9} />
            </mesh>
            {/* 看台顶棚 */}
            <mesh position={[2, 8.2, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[12, 0.4, 520]} />
              <meshStandardMaterial color="#1a202c" metalness={0.7} />
            </mesh>
          </group>

          {/* 右侧看台 */}
          <group position={[18, 0, 220]}>
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[10, 7.0, 520]} />
              <meshStandardMaterial color="#11151f" roughness={0.9} />
            </mesh>
            <mesh position={[-2, 8.2, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[12, 0.4, 520]} />
              <meshStandardMaterial color="#1a202c" metalness={0.7} />
            </mesh>
          </group>

          {/* 看台灯串微粒子 */}
          <points>
            <bufferGeometry attach="geometry" {...lightStringPoints} />
            <pointsMaterial attach="material" size={0.35} color="#fed7aa" transparent opacity={0.8} />
          </points>
        </group>
      )}

      {/* 8. 高杆探照灯群 */}
      {lightPoles.map((poleZ, idx) => (
        <group key={idx}>
          {/* 左侧灯柱 */}
          <group position={[-11.5, 0, poleZ]}>
            <mesh position={[0, 5.5, 0]}>
              <cylinderGeometry args={[0.16, 0.28, 11, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[1.5, 10.8, 0]} rotation={[0, 0, -0.4]}>
              <boxGeometry args={[3.0, 0.45, 0.9]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[1.5, 10.6, 0]}>
              <boxGeometry args={[2.8, 0.05, 0.7]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight position={[2, 10.2, 0]} intensity={isHigh ? 3.5 : 2.2} distance={48} color="#fff8ea" />
          </group>

          {/* 右侧灯柱 */}
          <group position={[11.5, 0, poleZ]}>
            <mesh position={[0, 5.5, 0]}>
              <cylinderGeometry args={[0.16, 0.28, 11, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[-1.5, 10.8, 0]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[3.0, 0.45, 0.9]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-1.5, 10.6, 0]}>
              <boxGeometry args={[2.8, 0.05, 0.7]} />
              <meshBasicMaterial color="#fffbeb" />
            </mesh>
            <pointLight position={[-2, 10.2, 0]} intensity={isHigh ? 3.5 : 2.2} distance={48} color="#fff8ea" />
          </group>
        </group>
      ))}

      {/* 9. 终点龙门架 (402.33 米 / 1/4 英里) 挂方格旗横幅与冲线警示 */}
      <group position={[0, 0, 402.33]}>
        {/* 跨道桁架 */}
        <mesh position={[0, 7.8, 0]}>
          <boxGeometry args={[22, 1.8, 1.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* 左立柱 */}
        <mesh position={[-10.5, 3.9, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 7.8, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        {/* 右立柱 */}
        <mesh position={[10.5, 3.9, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 7.8, 12]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>

        {/* 终点发光大标语 "1/4 MILE FINISH" */}
        <mesh position={[0, 8.0, 0.72]}>
          <boxGeometry args={[13, 1.2, 0.05]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* 挂载黑白方格旗横幅 (Checkered Flag Banner) */}
        <mesh position={[0, 6.7, 0.72]}>
          <planeGeometry args={[18, 1.2]} />
          <meshBasicMaterial map={checkeredTexture || undefined} />
        </mesh>
        <pointLight position={[0, 6.8, 1.8]} color="#ffffff" intensity={7.0} distance={30} />
        <pointLight position={[0, 8.0, 1.5]} color="#ef4444" intensity={6.0} distance={25} />

        {/* 终点地面黑白方格旗冲线区 */}
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 2.4]} />
          <meshBasicMaterial map={checkeredTexture || undefined} />
        </mesh>
      </group>

      {/* 10. 终点后减速缓冲区 (420m - 550m 刹车警示) */}
      <group position={[0, 0, 480]}>
        {[-9.5, 9.5].map((x, i) => (
          <group key={i} position={[x, 2.0, 0]}>
            <mesh>
              <boxGeometry args={[0.2, 1.2, 3.0]} />
              <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <mesh position={[i === 0 ? 0.12 : -0.12, 0, 0]}>
              <planeGeometry args={[2.8, 1.0]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        ))}
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
  const isBraking = telemetry.distanceMeters >= 402.33 || (telemetry.speedMs > 5 && telemetry.throttle === 0);

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
            isBraking={isBraking}
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
