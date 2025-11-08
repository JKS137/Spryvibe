import { useEffect, useRef, useState, useCallback } from "react";

interface FaceLandmarks {
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  noseBridge: { x: number; y: number }[];
  allLandmarks: { x: number; y: number }[];
  faceRotation: { pitch: number; yaw: number; roll: number };
}

interface UseFaceDetectionOptions {
  maxFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  options: UseFaceDetectionOptions = {}
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const faceDetectionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Extract specific landmark indices for eyes and nose
  const extractLandmarks = useCallback((results: any): FaceLandmarks => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return {
        leftEye: [],
        rightEye: [],
        noseBridge: [],
        allLandmarks: [],
        faceRotation: { pitch: 0, yaw: 0, roll: 0 },
      };
    }

    const face = results.multiFaceLandmarks[0];

    // MediaPipe Face Mesh landmark indices
    // Left eye: 33, 133, 160, 159, 158, 157, 173
    const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173];
    // Right eye: 362, 263, 387, 386, 385, 384, 380
    const rightEyeIndices = [362, 263, 387, 386, 385, 384, 380];
    // Nose bridge: 6, 168, 197, 195
    const noseBridgeIndices = [6, 168, 197, 195];

    const leftEye = leftEyeIndices.map((i) => face[i]);
    const rightEye = rightEyeIndices.map((i) => face[i]);
    const noseBridge = noseBridgeIndices.map((i) => face[i]);

    // Calculate face rotation (simplified)
    const nose = face[1];
    const leftCheek = face[234];
    const rightCheek = face[454];

    const yaw = Math.atan2(
      rightCheek.x - leftCheek.x,
      rightCheek.z - leftCheek.z
    );
    const pitch = Math.atan2(nose.y - face[10].y, nose.z - face[10].z);
    const roll = Math.atan2(leftCheek.y - rightCheek.y, leftCheek.x - rightCheek.x);

    return {
      leftEye,
      rightEye,
      noseBridge,
      allLandmarks: face,
      faceRotation: {
        pitch: pitch * (180 / Math.PI),
        yaw: yaw * (180 / Math.PI),
        roll: roll * (180 / Math.PI),
      },
    };
  }, []);

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const initFaceDetection = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { FaceMesh } = await import("@mediapipe/face_mesh");
        const { Camera } = await import("@mediapipe/camera_utils");

        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: options.maxFaces || 1,
          refineLandmarks: true,
          minDetectionConfidence: options.minDetectionConfidence || 0.5,
          minTrackingConfidence: options.minTrackingConfidence || 0.5,
        });

        faceMesh.onResults((results) => {
          const extracted = extractLandmarks(results);
          setLandmarks(extracted);

          // Calculate FPS
          frameCountRef.current++;
          const now = performance.now();
          if (now - lastFrameTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFrameTimeRef.current = now;
          }
        });

        faceDetectionRef.current = faceMesh;
        setIsLoaded(true);
      } catch (err) {
        console.error("Failed to initialize face detection:", err);
        setError("Failed to load face detection. Please refresh the page.");
      }
    };

    initFaceDetection();

    return () => {
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
      }
    };
  }, [options.maxFaces, options.minDetectionConfidence, options.minTrackingConfidence, extractLandmarks]);

  // Start detection loop
  const startDetection = useCallback(async () => {
    if (!isLoaded || !videoRef.current || !faceDetectionRef.current) {
      return;
    }

    try {
      const { Camera } = await import("@mediapipe/camera_utils");

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceDetectionRef.current) {
            await faceDetectionRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      await camera.start();
      setIsDetecting(true);
    } catch (err) {
      console.error("Failed to start detection:", err);
      setError("Failed to access camera. Please check permissions.");
    }
  }, [isLoaded, videoRef]);

  // Stop detection
  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  return {
    isLoaded,
    isDetecting,
    landmarks,
    error,
    fps,
    startDetection,
    stopDetection,
  };
}
