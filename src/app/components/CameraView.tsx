interface Props {
  visible: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function CameraView({ visible, videoRef }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          filter: 'brightness(0.35) saturate(0.6)',
        }}
        playsInline
        muted
      />
    </div>
  );
}
