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
    const internalVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // Get available camera devices
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

  // Start camera stream
  const startCamera = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsActive(true);
          setIsLoading(false);
          
          if (onVideoReady && videoRef.current) {
            onVideoReady(videoRef.current);
          }
        };
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      setError("Failed to access camera. Please check permissions.");
      setIsLoading(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg bg-black"
        playsInline
        muted
      />

      {!isActive && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Camera is off</p>
            <Button onClick={startCamera} size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-destructive/90 text-destructive-foreground p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {isActive && (
        <div className="absolute top-4 right-4 flex gap-2">
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                stopCamera();
                setTimeout(startCamera, 100);
              }}
              className="bg-black/70 text-white text-xs px-2 py-1 rounded"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${devices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          )}
          
          <Button
            onClick={stopCamera}
            size="sm"
            variant="destructive"
            className="bg-red-500/90 hover:bg-red-600"
          >
            <CameraOff className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
