import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIStringContent } from './types';
import { 
    Camera, RefreshCw, ArrowLeft, Zap, ZapOff, 
    Check, RotateCcw, Scan, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from './components/ui/button';

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
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [isShutterActive, setIsShutterActive] = useState(false);

    const startStream = useCallback(async (deviceId?: string) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsLoading(true);
        setError(null);
        setTorchOn(false);

        const constraints: MediaStreamConstraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: deviceId ? undefined : { ideal: 'environment' },
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

            // Check for torch/flashlight support
            const track = newStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities?.() as any;
            if (capabilities && capabilities.torch) {
                setTorchSupported(true);
            } else {
                setTorchSupported(false);
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please allow camera permissions in your browser and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [stream]);

    useEffect(() => {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setAvailableDevices(videoDevices);
                const initialDeviceId = videoDevices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('environment') ||
                    d.label.toLowerCase().includes('rear')
                )?.deviceId || videoDevices[0]?.deviceId;
                setCurrentDeviceId(initialDeviceId);
                startStream(initialDeviceId);
            })
            .catch(() => {
                startStream();
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

    const handleToggleTorch = async () => {
        if (!stream || !torchSupported) return;
        const track = stream.getVideoTracks()[0];
        try {
            await (track as any).applyConstraints({
                advanced: [{ torch: !torchOn }]
            });
            setTorchOn(!torchOn);
        } catch (e) {
            console.warn("Could not toggle torch:", e);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            setIsShutterActive(true);
            setTimeout(() => setIsShutterActive(false), 200);

            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
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
        <div className="relative w-full h-[650px] max-h-[85vh] bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col justify-between select-none">
            {/* Shutter White Flash */}
            {isShutterActive && (
                <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-ping" />
            )}

            {/* Top Navigation Bar */}
            <div className="relative z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <Button 
                    type="button"
                    onClick={onBack} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border-neutral-700 backdrop-blur-md gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs">{texts.backToAnalysis || "Back"}</span>
                </Button>

                <div className="flex items-center gap-2">
                    {torchSupported && !capturedImage && (
                        <Button
                            type="button"
                            onClick={handleToggleTorch}
                            variant="outline"
                            size="sm"
                            className={`rounded-full border-neutral-700 backdrop-blur-md ${torchOn ? 'bg-amber-500 text-black border-amber-400' : 'bg-neutral-900/80 text-white hover:bg-neutral-800'}`}
                            title="Toggle Flash"
                        >
                            {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                        </Button>
                    )}

                    {availableDevices.length > 1 && !capturedImage && (
                        <Button
                            type="button"
                            onClick={handleSwitchCamera}
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border-neutral-700 backdrop-blur-md gap-1.5"
                            title={texts.switchCamera}
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-xs hidden sm:inline">{texts.switchCamera}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Viewfinder Center Area */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
                <AnimatePresence mode="wait">
                    {capturedImage ? (
                        <motion.div 
                            key="preview" 
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full flex items-center justify-center p-4"
                        >
                            <img 
                                src={capturedImage} 
                                alt="Captured leaf preview" 
                                className="max-w-full max-h-full object-contain rounded-2xl border border-neutral-800 shadow-2xl" 
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="video" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="relative w-full h-full flex items-center justify-center"
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 gap-3 z-20">
                                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-neutral-400 font-mono">Initializing Camera Viewfinder...</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-neutral-950 z-20">
                                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                                    <h4 className="text-white font-semibold mb-1">Camera Error</h4>
                                    <p className="text-xs text-neutral-400 max-w-sm">{error}</p>
                                </div>
                            )}

                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                            />

                            {/* Futuristic Scanning HUD Overlay */}
                            {!isLoading && !error && (
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8 z-10">
                                    {/* Reticle Crop Frame */}
                                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden">
                                        {/* Corner Reticle Brackets */}
                                        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                                        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

                                        {/* Animated Laser Scanning Line */}
                                        <motion.div 
                                            className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981]"
                                            animate={{ y: [0, 310, 0] }}
                                            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                                        />

                                        {/* Center Target Crosshair */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                            <Scan className="w-12 h-12 text-emerald-400" />
                                        </div>
                                    </div>

                                    {/* Guideline hint */}
                                    <div className="mt-4 px-3.5 py-1.5 rounded-full bg-black/60 border border-neutral-700/60 backdrop-blur-md flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                        <span className="text-[11px] font-mono text-neutral-300">
                                            Align leaf inside frame for optimal diagnosis
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls Dock */}
            <div className="relative z-30 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {capturedImage ? (
                        <motion.div 
                            key="preview-controls" 
                            className="flex items-center gap-4 w-full max-w-sm justify-center" 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 20, opacity: 0 }}
                        >
                            <Button 
                                type="button"
                                onClick={handleRetake} 
                                variant="outline" 
                                size="lg"
                                className="flex-1 rounded-2xl bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>{texts.retake || "Retake"}</span>
                            </Button>

                            <Button 
                                type="button"
                                onClick={() => onCapture(capturedImage)} 
                                size="lg"
                                className="flex-1 rounded-2xl bg-white hover:bg-neutral-200 text-black font-semibold shadow-lg gap-2"
                            >
                                <Check className="w-4 h-4 text-black" />
                                <span>{texts.usePhoto || "Analyze Leaf"}</span>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="capture-controls" 
                            className="flex items-center justify-center"
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            exit={{ y: 20, opacity: 0 }}
                        >
                            <button
                                type="button"
                                onClick={handleCapture}
                                disabled={!stream || !!error || isLoading}
                                className="group relative p-2 rounded-full border-4 border-white/20 hover:border-emerald-500/50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                aria-label={texts.capture || "Capture Photo"}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white group-hover:bg-emerald-400 transition-colors flex items-center justify-center shadow-inner">
                                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-black" />
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
