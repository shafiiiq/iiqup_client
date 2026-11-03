import { useCallback, useEffect, useRef, useState } from 'react';

const DURATION_TICK_MS = 250;
const MIME_EXTENSIONS = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg' };

export const useVoiceRecorder = () => {
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const tickerRef = useRef(null);
  const segmentStartedAtRef = useRef(0);
  const elapsedBeforeSegmentRef = useRef(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const stopTicker = useCallback(() => {
    clearInterval(tickerRef.current);
    tickerRef.current = null;
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    segmentStartedAtRef.current = Date.now();
    tickerRef.current = setInterval(
      () => setDurationMillis(elapsedBeforeSegmentRef.current + Date.now() - segmentStartedAtRef.current),
      DURATION_TICK_MS
    );
  }, [stopTicker]);

  const releaseResources = useCallback(() => {
    stopTicker();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    elapsedBeforeSegmentRef.current = 0;
    setDurationMillis(0);
    setIsPaused(false);
  }, [stopTicker]);

  useEffect(() => releaseResources, [releaseResources]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      window.alert('Voice recording is not supported in this browser.');
      return false;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      window.alert('Microphone permission is required to record a voice message.');
      return false;
    }
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    });
    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];
    elapsedBeforeSegmentRef.current = 0;
    startTicker();
    recorder.start();
    return true;
  }, [startTicker]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    stopTicker();
    elapsedBeforeSegmentRef.current += Date.now() - segmentStartedAtRef.current;
    setDurationMillis(elapsedBeforeSegmentRef.current);
    setIsPaused(true);
  }, [stopTicker]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    startTicker();
    setIsPaused(false);
  }, [startTicker]);

  const stopRecorder = (recorder) =>
    new Promise((resolve) => {
      recorder.addEventListener('stop', resolve, { once: true });
      recorder.stop();
    });

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return null;
    await stopRecorder(recorder);
    const mimeType = (recorder.mimeType || 'audio/webm').split(';')[0];
    const recordedBlob = new Blob(chunksRef.current, { type: mimeType });
    releaseResources();
    if (recordedBlob.size === 0) return null;
    const extension = MIME_EXTENSIONS[mimeType] ?? 'webm';
    return new File([recordedBlob], `voice-${Date.now()}.${extension}`, { type: mimeType });
  }, [releaseResources]);

  const cancelRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') await stopRecorder(recorder);
    releaseResources();
  }, [releaseResources]);

  return {
    durationMillis,
    isPaused,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
};