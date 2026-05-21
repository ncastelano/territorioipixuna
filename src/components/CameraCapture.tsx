// app/components/CameraCapture.tsx

"use client";

import { useEffect, useRef, useState } from "react";

import { Camera, CameraOff, RefreshCcw, Check, X } from "lucide-react";

type Props = {
  onCapture: (file: File) => void;

  onClose: () => void;
};

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [loadingCamera, setLoadingCamera] = useState(true);

  const [cameraError, setCameraError] = useState("");

  // =========================
  // START CAMERA
  // =========================

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // =========================
  // OPEN CAMERA
  // =========================

  const startCamera = async () => {
    try {
      setLoadingCamera(true);

      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },

        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error(error);

      setCameraError("Não foi possível acessar a câmera");
    } finally {
      setLoadingCamera(false);
    }
  };

  // =========================
  // STOP CAMERA
  // =========================

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  // =========================
  // CAPTURE PHOTO
  // =========================

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;

    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;

    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    setCapturedImage(imageData);

    stopCamera();
  };

  // =========================
  // CONFIRM PHOTO
  // =========================

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    const response = await fetch(capturedImage);

    const blob = await response.blob();

    const file = new File([blob], `photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    onCapture(file);
  };

  // =========================
  // RETAKE
  // =========================

  const retakePhoto = async () => {
    setCapturedImage(null);

    await startCamera();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,

        zIndex: 9999,

        background: "#000",

        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          position: "absolute",

          top: 0,
          left: 0,
          right: 0,

          zIndex: 20,

          padding: 18,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)",
        }}
      >
        <div>
          <div
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              marginBottom: 4,
            }}
          >
            Câmera
          </div>

          <div
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Capturar foto
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: 44,
            height: 44,

            borderRadius: 999,

            border: 0,

            background: "rgba(255,255,255,0.12)",

            color: "#fff",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* CAMERA */}
      <div
        style={{
          flex: 1,

          position: "relative",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          overflow: "hidden",
        }}
      >
        {/* VIDEO */}
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",

              objectFit: "cover",
            }}
          />
        )}

        {/* PHOTO */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="captured"
            style={{
              width: "100%",
              height: "100%",

              objectFit: "cover",
            }}
          />
        )}

        {/* LOADING */}
        {loadingCamera && (
          <div
            style={{
              position: "absolute",

              inset: 0,

              background: "#000",

              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",

              color: "#fff",
            }}
          >
            <Camera size={42} />

            <div
              style={{
                marginTop: 16,
                fontSize: 15,
              }}
            >
              Abrindo câmera...
            </div>
          </div>
        )}

        {/* ERROR */}
        {cameraError && (
          <div
            style={{
              position: "absolute",

              inset: 0,

              background: "#000",

              display: "flex",
              flexDirection: "column",

              alignItems: "center",

              justifyContent: "center",

              padding: 24,

              textAlign: "center",
            }}
          >
            <CameraOff size={52} color="rgba(255,255,255,0.7)" />

            <div
              style={{
                marginTop: 18,

                color: "#fff",

                fontSize: 16,

                fontWeight: 700,
              }}
            >
              Erro ao acessar câmera
            </div>

            <div
              style={{
                marginTop: 10,

                color: "rgba(255,255,255,0.6)",

                lineHeight: 1.5,

                maxWidth: 300,
              }}
            >
              Permita acesso à câmera no navegador
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {!loadingCamera && !cameraError && (
        <div
          style={{
            position: "absolute",

            bottom: 0,
            left: 0,
            right: 0,

            padding: 24,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,

            background:
              "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
          }}
        >
          {/* CAPTURE */}
          {!capturedImage && (
            <button
              onClick={capturePhoto}
              style={{
                width: 82,
                height: 82,

                borderRadius: 999,

                border: "6px solid rgba(255,255,255,0.25)",

                background: "#fff",

                cursor: "pointer",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              }}
            >
              <Camera size={28} color="#000" />
            </button>
          )}

          {/* CONFIRM */}
          {capturedImage && (
            <>
              <button
                onClick={retakePhoto}
                style={{
                  width: 68,
                  height: 68,

                  borderRadius: 999,

                  border: 0,

                  background: "rgba(255,255,255,0.12)",

                  color: "#fff",

                  cursor: "pointer",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCcw size={24} />
              </button>

              <button
                onClick={confirmPhoto}
                style={{
                  width: 82,
                  height: 82,

                  borderRadius: 999,

                  border: 0,

                  background: "linear-gradient(to right, #10b981, #059669)",

                  color: "#fff",

                  cursor: "pointer",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  boxShadow: "0 10px 30px rgba(16,185,129,0.45)",
                }}
              >
                <Check size={30} />
              </button>
            </>
          )}
        </div>
      )}

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        style={{
          display: "none",
        }}
      />
    </div>
  );
}
