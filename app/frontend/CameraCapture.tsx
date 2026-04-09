
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './components/common/Button';
import LoadingSpinner from './components/common/LoadingSpinner';
import { UIStringContent } from './types';
import { CameraIcon, ArrowPathIcon } from './components/common/IconComponents';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onBack: () => void;
  texts: UIStringContent;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onBack, texts }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const startStream = useCallback(async (deviceId?: string) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsLoading(true);
    setError(null);

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment', // Prioritize rear camera
        ...(deviceId && { deviceId: { exact: deviceId } }),
      },
      audio: false,
    };

    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Could not access camera. Please check permissions and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [stream]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);
        const initialDeviceId = videoDevices.find(d => d.label.toLowerCase().includes('back'))?.deviceId || videoDevices[0]?.deviceId;
        setCurrentDeviceId(initialDeviceId);
        startStream(initialDeviceId);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startStream]);


  const handleSwitchCamera = () => {
    if (availableDevices.length < 2) return;
    const currentIndex = availableDevices.findIndex(d => d.deviceId === currentDeviceId);
    const nextDevice = availableDevices[(currentIndex + 1) % availableDevices.length];
    setCurrentDeviceId(nextDevice.deviceId);
    startStream(nextDevice.deviceId);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startStream(currentDeviceId);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 relative">
      <Button onClick={onBack} variant="secondary" size="sm" className="absolute top-4 left-4 z-20 !bg-black/40 hover:!bg-black/60 !text-white">
        Back to Upload
      </Button>

      <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {capturedImage ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
            </motion.div>
          ) : (
            <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full">
              {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner text="Starting camera..." color="text-white" /></div>}
              {error && <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4">{error}</div>}
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}></video>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl flex justify-center items-center gap-8 z-20">
        <AnimatePresence>
          {capturedImage ? (
            <motion.div key="preview-controls" className="flex gap-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <Button onClick={handleRetake} variant="secondary" size="lg">{texts.retake}</Button>
              <Button onClick={() => onCapture(capturedImage)} variant="primary" size="lg">{texts.usePhoto}</Button>
            </motion.div>
          ) : (
            <motion.div key="capture-controls" className="flex items-center gap-8" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <Button onClick={handleSwitchCamera} disabled={availableDevices.length < 2} className="!w-16 !h-16 !rounded-full !bg-white/20 hover:!bg-white/30" aria-label={texts.switchCamera}>
                <ArrowPathIcon className="w-8 h-8 text-white" />
              </Button>
              <Button onClick={handleCapture} disabled={!stream || !!error} className="!w-24 !h-24 !rounded-full !bg-white hover:!bg-gray-200 !border-4 !border-white/50" aria-label={texts.capture}>
                <div className="w-20 h-20 rounded-full bg-white ring-2 ring-inset ring-gray-600"></div>
              </Button>
              <div className="w-16 h-16"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraCapture;
