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

  const faceLandmarkerRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const { maxFaces = 1, minDetectionConfidence = 0.5, minTrackingConfidence = 0.5 } = options;

  const extractLandmarks = useCallback((results: any): FaceLandmarks => {
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        leftEye: [],
        rightEye: [],
        noseBridge: [],
        allLandmarks: [],
        faceRotation: { pitch: 0, yaw: 0, roll: 0 },
      };
    }

    const face = results.faceLandmarks[0];

    const leftEyeIndices = [33, 133, 160, 159, 158, 157, 173];
    const rightEyeIndices = [362, 263, 387, 386, 385, 384, 380];
    const noseBridgeIndices = [6, 168, 197, 195];

    const leftEye = leftEyeIndices.map((idx) => ({ x: face[idx].x, y: face[idx].y }));
    const rightEye = rightEyeIndices.map((idx) => ({ x: face[idx].x, y: face[idx].y }));
    const noseBridge = noseBridgeIndices.map((idx) => ({ x: face[idx].x, y: face[idx].y }));

    const allLandmarks = face.map((lm: any) => ({ x: lm.x, y: lm.y }));

    const leftEyeCenter = leftEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    leftEyeCenter.x /= leftEye.length;
    leftEyeCenter.y /= leftEye.length;

    const rightEyeCenter = rightEye.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    rightEyeCenter.x /= rightEye.length;
    rightEyeCenter.y /= rightEye.length;

    const noseTip = { x: face[1].x, y: face[1].y };

    const eyeDistance = Math.sqrt(
      (rightEyeCenter.x - leftEyeCenter.x) ** 2 + (rightEyeCenter.y - leftEyeCenter.y) ** 2
    );
    const roll = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x) * (180 / Math.PI);

    const pitch = ((noseTip.y - (leftEyeCenter.y + rightEyeCenter.y) / 2) / eyeDistance) * 45;
    const yaw = ((noseTip.x - (leftEyeCenter.x + rightEyeCenter.x) / 2) / eyeDistance) * 45;

    return {
      leftEye,
      rightEye,
      noseBridge,
      allLandmarks,
      faceRotation: { pitch, yaw, roll },
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeFaceLandmarker = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        if (!mounted) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: maxFaces,
          minFaceDetectionConfidence: minDetectionConfidence,
          minFacePresenceConfidence: minTrackingConfidence,
          minTrackingConfidence: minTrackingConfidence,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
        });

        if (!mounted) return;

        faceLandmarkerRef.current = faceLandmarker;
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to initialize face detection");
        setIsLoaded(false);
      }
    };

    initializeFaceLandmarker();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [maxFaces, minDetectionConfidence, minTrackingConfidence]);

  const detectFaces = useCallback(() => {
    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !faceLandmarker || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    const now = performance.now();
    const elapsed = now - lastFrameTimeRef.current;

    if (elapsed > 1000) {
      setFps(Math.round((frameCountRef.current / elapsed) * 1000));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }

    try {
      const results = faceLandmarker.detectForVideo(video, now);

      if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
        const extractedLandmarks = extractLandmarks(results);
        setLandmarks(extractedLandmarks);
      } else {
        setLandmarks(null);
      }

      frameCountRef.current++;
    } catch (err) {
      console.error("Face detection error:", err);
    }

    if (isDetecting) {
      animationFrameRef.current = requestAnimationFrame(detectFaces);
    }
  }, [videoRef, isDetecting, extractLandmarks]);

  const startDetection = useCallback(async () => {
    if (!faceLandmarkerRef.current) {
      setError("Face detector not initialized");
      return;
    }

    setIsDetecting(true);
    lastFrameTimeRef.current = performance.now();
    frameCountRef.current = 0;
    detectFaces();
  }, [detectFaces]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setLandmarks(null);
    setFps(0);
  }, []);

  useEffect(() => {
    if (isDetecting) {
      detectFaces();
    }
  }, [isDetecting, detectFaces]);

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
