"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface ARCameraProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  onCameraStart?: () => void;
  onCameraStop?: () => void;
  className?: string;
}

export const ARCamera = forwardRef<HTMLVideoElement, ARCameraProps>(
  ({ onVideoReady, onCameraStart, onCameraStop, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    useEffect(() => {
      const getDevices = async () => {
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter(
            (device) => device.kind === "videoinput"
          );
          setDevices(videoDevices);
          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        } catch (err) {
          console.error("Failed to enumerate devices:", err);
        }
      };

      getDevices();
    }, [selectedDeviceId]);

    useEffect(() => {
      return () => {
        stopCamera();
      };
    }, []);

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsActive(false);
      if (onCameraStop) {
        onCameraStop();
      }
    };

    const startCamera = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();

            setIsActive(true);
            setIsLoading(false);

            if (onVideoReady && videoRef.current) {
              onVideoReady(videoRef.current);
            }

            if (onCameraStart) {
              onCameraStart();
            }
          };
        }
      } catch (err) {
        setIsLoading(false);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to access camera");
        }
      }
    };

    return (
      <div className={`relative flex h-full w-full items-center justify-center ${className || ""}`}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            {error ? (
              <>
                <CameraOff className="h-12 w-12 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <Button onClick={startCamera} disabled={isLoading}>
                  Try Again
                </Button>
              </>
            ) : (
              <>
                {isLoading ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 text-primary" />
                    <Button onClick={startCamera} className="gap-2">
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                  </>
                )}

                {devices.length > 1 && !isLoading && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
          </div>
        )}

        {isActive && (
          <div className="absolute bottom-4 right-4">
            <Button onClick={stopCamera} variant="destructive" size="sm" className="gap-2">
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </Button>
          </div>
        )}
      </div>
    );
  }
);

ARCamera.displayName = "ARCamera";
