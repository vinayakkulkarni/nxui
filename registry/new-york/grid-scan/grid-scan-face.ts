import type { FaceApi, GridScanEngine, GridScanStatus } from './types';

const FACE_API_URL =
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

export const GRID_SCAN_MODELS_URL =
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

export const GRID_SCAN_STATUS_LABELS: Record<GridScanStatus, string> = {
  loading: 'Loading face tracking',
  searching: 'Looking for a face',
  tracking: 'Tracking',
  blocked: 'Camera unavailable',
};

let loader: Promise<FaceApi> | null = null;

function isFaceApi(value: unknown): value is FaceApi {
  return (
    typeof value === 'object' &&
    value !== null &&
    'detectSingleFace' in value &&
    'nets' in value &&
    'TinyFaceDetectorOptions' in value
  );
}

function readFaceApi(): FaceApi | null {
  const api: unknown = Reflect.get(window, 'faceapi');
  return isFaceApi(api) ? api : null;
}

/** Loads face-api.js from the CDN once and shares it between instances. */
function loadFaceApi(): Promise<FaceApi> {
  const ready = readFaceApi();
  if (ready) return Promise.resolve(ready);
  if (!loader) {
    loader = new Promise<FaceApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = FACE_API_URL;
      script.async = true;
      script.addEventListener('load', () => {
        const api = readFaceApi();
        if (api) resolve(api);
        else reject(new Error('face-api.js'));
      });
      script.addEventListener('error', () => {
        loader = null;
        reject(new Error('face-api.js'));
      });
      document.head.appendChild(script);
    });
  }
  return loader;
}

/**
 * Tracks the viewer's head through the webcam and feeds its position into
 * the engine. Returns a stop function that releases the camera.
 */
export function startHeadTracking(
  video: HTMLVideoElement,
  modelsPath: string,
  engine: GridScanEngine,
  setStatus: (status: GridScanStatus) => void,
): () => void {
  let stopped = false;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lost = 0;
  const smooth = { x: 0, y: 0, near: 1, ready: false };
  setStatus('loading');

  const run = async () => {
    try {
      const faceapi = await loadFaceApi();
      await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
      if (stopped) return;
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (stopped) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      video.srcObject = stream;
      await video.play();
      setStatus('searching');
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,
        scoreThreshold: 0.45,
      });
      const detect = async () => {
        if (stopped) return;
        const result = await Promise.resolve(
          faceapi.detectSingleFace(video, options),
        ).catch(() => null);
        if (stopped) return;
        if (result) {
          const box = result.box;
          const vw = video.videoWidth || 1;
          const vh = video.videoHeight || 1;
          const x = -((box.x + box.width / 2) / vw - 0.5) * 2;
          const y = -((box.y + box.height / 2) / vh - 0.5) * 2;
          const near = 0.32 / Math.max(0.08, box.width / vw);
          const k = smooth.ready ? 0.45 : 1;
          smooth.x += (x - smooth.x) * k;
          smooth.y += (y - smooth.y) * k;
          smooth.near += (near - smooth.near) * k;
          smooth.ready = true;
          lost = 0;
          engine.setHeadActive(true);
          engine.headMove(smooth.x, smooth.y, smooth.near);
          setStatus('tracking');
        } else if (++lost > 12 && engine.isHeadActive()) {
          engine.setHeadActive(false);
          smooth.ready = false;
          engine.headRelease();
          setStatus('searching');
        }
        timer = setTimeout(detect, 40);
      };
      void detect();
    } catch {
      if (!stopped) setStatus('blocked');
    }
  };
  void run();

  return () => {
    stopped = true;
    clearTimeout(timer);
    if (stream) for (const track of stream.getTracks()) track.stop();
    video.srcObject = null;
    if (engine.isHeadActive()) {
      engine.setHeadActive(false);
      engine.headRelease();
    }
  };
}
