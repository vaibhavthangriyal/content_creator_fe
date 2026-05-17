export interface CanvasVideoOptions {
  audioBlob: Blob;
  width?: number;
  height?: number;
  fps?: number;
}

export async function generateSatsangCanvasVideo(
  options: CanvasVideoOptions,
): Promise<Blob> {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;
  const fps = options.fps ?? 30;

  const audioEl = document.createElement('audio');
  audioEl.preload = 'auto';
  audioEl.src = URL.createObjectURL(options.audioBlob);
console.log("AUDIO CREADTED")
  await waitForMetadata(audioEl);
console.log("AUDIO CREADTED 22")
  const canvas = document.createElement('canvas');
console.log("CANVAS CREADTED 22")
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(audioEl.src);
    throw new Error('Canvas 2D context unavailable');
  }

  renderFrame(ctx, width, height, 0);

  const canvasStream = canvas.captureStream(fps);
  const videoTracks = canvasStream.getVideoTracks();
  if (!videoTracks.length) {
    URL.revokeObjectURL(audioEl.src);
    throw new Error('Canvas video track could not be created');
  }
  videoTracks[0].contentHint = 'motion';

  const audioCapture = (audioEl as any).captureStream || (audioEl as any).mozCaptureStream;
  if (!audioCapture) {
    URL.revokeObjectURL(audioEl.src);
    throw new Error('Audio captureStream is not supported in this browser');
  }
  const audioStream: MediaStream = audioCapture.call(audioEl);
  const tracks = [
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ];
  const mixedStream = new MediaStream(tracks);

  const mimeType =
    MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

  const recorder = new MediaRecorder(mixedStream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (evt) => {
    if (evt.data.size > 0) {
      chunks.push(evt.data);
    }
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('MediaRecorder failed'));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  let rafId = 0;
  const draw = () => {
    const t = audioEl.currentTime;
    renderFrame(ctx, width, height, t);
    rafId = requestAnimationFrame(draw);
  };

  recorder.start(1000);
  draw();
  await audioEl.play();

  await new Promise<void>((resolve) => {
    audioEl.onended = () => resolve();
  });

  cancelAnimationFrame(rafId);
  recorder.stop();
  const blob = await stopPromise;

  mixedStream.getTracks().forEach((track) => track.stop());
  URL.revokeObjectURL(audioEl.src);
  return blob;
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#7aa6ff');
  sky.addColorStop(0.45, '#bed7ff');
  sky.addColorStop(1, '#dfe9f2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#8da1ad';
  drawMountain(ctx, 0, h * 0.62, w * 0.42, h * 0.35);
  drawMountain(ctx, w * 0.22, h * 0.62, w * 0.5, h * 0.42);
  drawMountain(ctx, w * 0.56, h * 0.62, w * 0.45, h * 0.36);

  const templeX = w * 0.5;
  const templeY = h * 0.58;
  ctx.fillStyle = '#f2d8aa';
  ctx.fillRect(templeX - 120, templeY, 240, 210);
  ctx.fillStyle = '#c79c64';
  ctx.beginPath();
  ctx.moveTo(templeX - 150, templeY);
  ctx.lineTo(templeX, templeY - 120);
  ctx.lineTo(templeX + 150, templeY);
  ctx.closePath();
  ctx.fill();

  const wfX = w * 0.82;
  const wfY = h * 0.34;
  const wfW = 130;
  const wfH = 500;
  const wfGrad = ctx.createLinearGradient(wfX, wfY, wfX, wfY + wfH);
  wfGrad.addColorStop(0, 'rgba(219,239,255,0.85)');
  wfGrad.addColorStop(1, 'rgba(173,214,245,0.35)');
  ctx.fillStyle = wfGrad;
  ctx.fillRect(wfX, wfY, wfW, wfH);
  for (let i = 0; i < 22; i += 1) {
    const y = wfY + ((i * 28 + t * 180) % wfH);
    const alpha = 0.18 + (i % 4) * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(wfX + 10 + (i % 5) * 20, y, 6, 24);
  }

  const birdX = 120 + ((t * 240) % (w + 220)) - 120;
  const birdY = 180 + Math.sin(t * 2.8) * 34;
  drawBird(ctx, birdX, birdY, 1 + 0.08 * Math.sin(t * 12));

  const pX = 240 + Math.sin(t * 0.9) * 20;
  const pY = h - 160;
  drawPeacock(ctx, pX, pY, 1 + 0.03 * Math.sin(t * 1.3));
}

function drawMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.5, y - h);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
}

function drawBird(ctx: CanvasRenderingContext2D, x: number, y: number, flapScale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(30,30,30,0.75)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.quadraticCurveTo(-8, -12 * flapScale, 0, 0);
  ctx.quadraticCurveTo(8, -12 * flapScale, 22, 0);
  ctx.stroke();
  ctx.restore();
}

function drawPeacock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyScale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(bodyScale, bodyScale);
  ctx.fillStyle = '#195f8a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f9a73';
  ctx.beginPath();
  ctx.ellipse(40, -5, 60, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f3f63';
  ctx.beginPath();
  ctx.arc(0, -50, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function waitForMetadata(audio: HTMLAudioElement) {
  return new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Failed to load audio metadata'));
    };
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
  });
}
