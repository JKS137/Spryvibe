import { useRef, useState, useEffect } from "react";
import { ARCamera } from "./ar-camera-v2";
import { LensOverlay } from "./lens-overlay";
import { EffectSelector } from "./effect-selector";
import { useFaceDetection } from "@/hooks/use-face-detection-v2";
import { useAREffectsStore } from "@/stores/ar-effects-store";
import { Button } from "@/components/ui/button";
import { Camera, Download, Video, Square, Smile } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function AREffectsPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });

  const {
    activeEffect,
    isRecording,
    emotionTriggerEnabled,
    glowIntensity,
    isCameraActive,
    setActiveEffect,
    toggleRecording,
    toggleEmotionTrigger,
    setGlowIntensity,
    setCameraActive,
    addSnapshot,
    addRecording,
  } = useAREffectsStore();

  const { isLoaded, isDetecting, landmarks, fps, startDetection, stopDetection } =
    useFaceDetection(videoRef);

  useEffect(() => {
    if (isCameraActive && isLoaded) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [isCameraActive, isLoaded, startDetection, stopDetection]);

  const handleVideoReady = (video: HTMLVideoElement) => {
    setVideoSize({
      width: video.videoWidth || 640,
      height: video.videoHeight || 480,
    });
  };

  const handleCameraStart = () => {
    setCameraActive(true);
  };

  const handleCameraStop = () => {
    setCameraActive(false);
    stopDetection();
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = videoSize.width;
    canvas.height = videoSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, videoSize.width, videoSize.height);

    canvas.toBlob((blob: Blob | null) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        addSnapshot(url);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `spryvibe-ar-${Date.now()}.png`;
        link.click();
      }
    });
  };

  const startRecording = async () => {
    const video = videoRef.current;
    if (!video || !video.srcObject) return;

    const stream = video.srcObject as MediaStream;
    
    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        addRecording(url);

        const link = document.createElement("a");
        link.href = url;
        link.download = `spryvibe-ar-recording-${Date.now()}.webm`;
        link.click();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      toggleRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecordingFunc = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      toggleRecording();
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AR Face Effects</h2>
        {isDetecting && (
          <span className="text-sm text-muted-foreground">FPS: {fps}</span>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ARCamera
          ref={videoRef}
          onVideoReady={handleVideoReady}
          onCameraStart={handleCameraStart}
          onCameraStop={handleCameraStop}
        />

        {isCameraActive && landmarks && (
          <LensOverlay
            landmarks={landmarks}
            effect={activeEffect}
            videoWidth={videoSize.width}
            videoHeight={videoSize.height}
            glowIntensity={glowIntensity}
            emotionTriggerEnabled={emotionTriggerEnabled}
          />
        )}

        {isCameraActive && isRecording && (
          <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-sm font-medium text-white">
            <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Recording
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col gap-4">
        <EffectSelector
          activeEffect={activeEffect}
          onEffectChange={setActiveEffect}
          disabled={!isCameraActive}
        />

        {activeEffect === "glowing-eyes" && (
          <div className="flex items-center gap-4">
            <Label htmlFor="glow-intensity" className="text-sm">
              Glow Intensity:
            </Label>
            <Slider
              id="glow-intensity"
              min={0}
              max={2}
              step={0.1}
              value={[glowIntensity]}
              onValueChange={(value: number[]) => setGlowIntensity(value[0])}
              className="flex-1"
              disabled={!isCameraActive}
            />
            <span className="text-sm text-muted-foreground">
              {glowIntensity.toFixed(1)}x
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch
            id="emotion-trigger"
            checked={emotionTriggerEnabled}
            onCheckedChange={toggleEmotionTrigger}
            disabled={!isCameraActive}
          />
          <Label htmlFor="emotion-trigger" className="flex items-center gap-2">
            <Smile className="h-4 w-4" />
            Emotion Triggers (Smile = Brighter)
          </Label>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={captureSnapshot}
            disabled={!isCameraActive || !activeEffect}
            className="flex-1 gap-2"
          >
            <Camera className="h-4 w-4" />
            Capture Snapshot
          </Button>

          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!isCameraActive || !activeEffect}
              className="flex-1 gap-2"
              variant="destructive"
            >
              <Video className="h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecordingFunc}
              className="flex-1 gap-2"
              variant="destructive"
            >
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          )}
        </div>

        {!isLoaded && isCameraActive && (
          <p className="text-center text-sm text-muted-foreground">
            Loading face detection model...
          </p>
        )}
      </div>
    </div>
  );
}
