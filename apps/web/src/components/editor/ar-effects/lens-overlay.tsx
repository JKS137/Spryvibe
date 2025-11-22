import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface LensOverlayProps {
  landmarks: {
    leftEye: { x: number; y: number }[];
    rightEye: { x: number; y: number }[];
    noseBridge: { x: number; y: number }[];
    faceRotation: { pitch: number; yaw: number; roll: number };
    faceBlendshapes?: any[];
  } | null;
  effect: "glowing-eyes" | "sunglasses" | null;
  videoWidth: number;
  videoHeight: number;
  glowIntensity?: number;
  emotionTriggerEnabled?: boolean;
}

function GlowingEyes({
  leftEye,
  rightEye,
  intensity = 1.0,
  blendshapes,
  emotionTriggerEnabled,
}: {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  intensity?: number;
  blendshapes?: any[];
  emotionTriggerEnabled?: boolean;
}) {
  const leftGlowRef = useRef<THREE.Mesh>(null);
  const rightGlowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = Math.sin(time * 2) * 0.3 + 0.7;
    
    let finalIntensity = intensity;
    
    // Apply emotion trigger (smile)
    if (emotionTriggerEnabled && blendshapes) {
      const smileLeft = blendshapes.find((b: any) => b.categoryName === "mouthSmileLeft")?.score || 0;
      const smileRight = blendshapes.find((b: any) => b.categoryName === "mouthSmileRight")?.score || 0;
      const smileScore = (smileLeft + smileRight) / 2;
      
      // Boost intensity when smiling
      finalIntensity = intensity * (1 + smileScore * 2);
    }

    if (leftGlowRef.current && rightGlowRef.current) {
      const mat = leftGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse * finalIntensity;
      
      (rightGlowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * finalIntensity;
    }
  });

  if (leftEye.length === 0 || rightEye.length === 0) return null;

  const leftEyeCenter = leftEye.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  leftEyeCenter.x /= leftEye.length;
  leftEyeCenter.y /= leftEye.length;

  const rightEyeCenter = rightEye.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  rightEyeCenter.x /= rightEye.length;
  rightEyeCenter.y /= rightEye.length;

  const leftX = (leftEyeCenter.x - 0.5) * 10;
  const leftY = -(leftEyeCenter.y - 0.5) * 10;
  const rightX = (rightEyeCenter.x - 0.5) * 10;
  const rightY = -(rightEyeCenter.y - 0.5) * 10;

  const eyeRadius = 0.3;

  return (
    <>
      <mesh ref={leftGlowRef} position={[leftX, leftY, 0]}>
        <circleGeometry args={[eyeRadius, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>
      
      <mesh position={[leftX, leftY, 0.01]}>
        <circleGeometry args={[eyeRadius * 1.5, 32]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
      </mesh>

      <mesh ref={rightGlowRef} position={[rightX, rightY, 0]}>
        <circleGeometry args={[eyeRadius, 32]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.8} />
      </mesh>
      
      <mesh position={[rightX, rightY, 0.01]}>
        <circleGeometry args={[eyeRadius * 1.5, 32]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

function Sunglasses({
  leftEye,
  rightEye,
  noseBridge,
  rotation,
}: {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  noseBridge: { x: number; y: number }[];
  rotation: { pitch: number; yaw: number; roll: number };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [modelError, setModelError] = useState(false);
  
  // Try to load a GLTF model - using a public placeholder URL or local asset
  // In a real app, this would be a local asset like "/models/sunglasses.glb"
  const { scene } = useGLTF("https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/sunglasses/model.gltf", undefined, undefined, (error) => {
    console.warn("Failed to load sunglasses model, falling back to geometry", error);
    setModelError(true);
  }) as any;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.z = (rotation.roll * Math.PI) / 180;
      groupRef.current.rotation.x = (rotation.pitch * Math.PI) / 180;
      groupRef.current.rotation.y = (rotation.yaw * Math.PI) / 180;
    }
  }, [rotation]);

  if (leftEye.length === 0 || rightEye.length === 0) return null;

  const leftEyeCenter = leftEye.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  leftEyeCenter.x /= leftEye.length;
  leftEyeCenter.y /= leftEye.length;

  const rightEyeCenter = rightEye.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  rightEyeCenter.x /= rightEye.length;
  rightEyeCenter.y /= rightEye.length;

  const centerX = ((leftEyeCenter.x + rightEyeCenter.x) / 2 - 0.5) * 10;
  const centerY = -((leftEyeCenter.y + rightEyeCenter.y) / 2 - 0.5) * 10;

  const eyeDistance = Math.sqrt(
    (rightEyeCenter.x - leftEyeCenter.x) ** 2 + (rightEyeCenter.y - leftEyeCenter.y) ** 2
  );
  const scale = eyeDistance * 15;

  // Fallback geometry if model fails to load or is still loading
  const renderFallback = () => {
    const lensWidth = 1.2;
    const lensHeight = 0.8;
    const bridgeWidth = 0.4;
    const frameThickness = 0.08;

    return (
      <>
        <mesh position={[-lensWidth / 2 - bridgeWidth / 2, 0, 0]}>
          <boxGeometry args={[lensWidth, lensHeight, 0.05]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.7} />
        </mesh>

        <mesh position={[lensWidth / 2 + bridgeWidth / 2, 0, 0]}>
          <boxGeometry args={[lensWidth, lensHeight, 0.05]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.7} />
        </mesh>

        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[bridgeWidth, frameThickness, 0.05]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        <mesh position={[-lensWidth / 2 - bridgeWidth / 2, lensHeight / 2, 0]}>
          <boxGeometry args={[lensWidth + frameThickness, frameThickness, 0.06]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        <mesh position={[-lensWidth / 2 - bridgeWidth / 2, -lensHeight / 2, 0]}>
          <boxGeometry args={[lensWidth + frameThickness, frameThickness, 0.06]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        <mesh position={[lensWidth / 2 + bridgeWidth / 2, lensHeight / 2, 0]}>
          <boxGeometry args={[lensWidth + frameThickness, frameThickness, 0.06]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        <mesh position={[lensWidth / 2 + bridgeWidth / 2, -lensHeight / 2, 0]}>
          <boxGeometry args={[lensWidth + frameThickness, frameThickness, 0.06]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </>
    );
  };

  return (
    <group ref={groupRef} position={[centerX, centerY, 0]} scale={[scale, scale, scale]}>
      {scene && !modelError ? (
        <primitive 
          object={scene} 
          scale={[0.5, 0.5, 0.5]} 
          rotation={[0, Math.PI, 0]} // Adjust based on model orientation
          position={[0, 0, 0]} 
        />
      ) : (
        renderFallback()
      )}
    </group>
  );
}

export function LensOverlay({
  landmarks,
  effect,
  videoWidth,
  videoHeight,
  glowIntensity = 1.0,
  emotionTriggerEnabled = false,
}: LensOverlayProps) {
  if (!landmarks || !effect) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: videoWidth, height: videoHeight }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {effect === "glowing-eyes" && (
          <GlowingEyes
            leftEye={landmarks.leftEye}
            rightEye={landmarks.rightEye}
            intensity={glowIntensity}
            blendshapes={landmarks.faceBlendshapes}
            emotionTriggerEnabled={emotionTriggerEnabled}
          />
        )}

        {effect === "sunglasses" && (
          <Sunglasses
            leftEye={landmarks.leftEye}
            rightEye={landmarks.rightEye}
            noseBridge={landmarks.noseBridge}
            rotation={landmarks.faceRotation}
          />
        )}
      </Canvas>
    </div>
  );
}
