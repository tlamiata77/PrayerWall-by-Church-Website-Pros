import { useState, useRef, useEffect, useCallback } from 'react';

export interface SpeechToTextState {
  isSupported: boolean;
  isListening: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number; // 0 to 100
  duration: number; // in seconds
  error: string | null;
}

export function useSpeechToText() {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Check support on mount
  useEffect(() => {
    const hasWebSpeech = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const hasMediaDevices = typeof navigator !== 'undefined' &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    setIsSupported(hasWebSpeech || hasMediaDevices);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    setIsListening(false);
    setIsPaused(false);
    setAudioLevel(0);
  };

  const startListening = useCallback(async () => {
    setError(null);
    setInterimTranscript('');
    setAudioLevel(0);
    setDuration(0);

    const hasWebSpeech = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // 1. Request microphone access
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Set up audio analyzer for live waveform visualization
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateVolume = () => {
              if (!analyserRef.current || !mediaStreamRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              // Normalize to 0-100 range
              const level = Math.min(100, Math.round((avg / 128) * 100));
              setAudioLevel(level);

              animationFrameRef.current = requestAnimationFrame(updateVolume);
            };

            updateVolume();
          }
        } catch (ctxErr) {
          console.warn('AudioContext volume metering failed:', ctxErr);
        }

        // Set up MediaRecorder as backup / audio capture
        try {
          audioChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
          
          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorderRef.current = recorder;
          recorder.start(250);
        } catch (recErr) {
          console.warn('MediaRecorder init failed:', recErr);
        }
      }
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      let errMsg = 'Microphone access was denied or is unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Microphone permission blocked. Please allow microphone access in your browser settings to record your prayer.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No microphone device was detected on your system.';
      }
      setError(errMsg);
      return;
    }

    // 2. Set up SpeechRecognition if available
    if (hasWebSpeech) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let newFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptText = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newFinal += transcriptText;
            } else {
              currentInterim += transcriptText;
            }
          }

          if (newFinal) {
            setTranscript((prev) => {
              const trimmed = prev.trim();
              const addition = newFinal.trim();
              if (!trimmed) return addition;
              return `${trimmed} ${addition}`;
            });
          }

          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setError('Microphone permission denied for voice recognition.');
          } else if (event.error === 'no-speech') {
            // Keep listening, user might be pausing
          } else if (event.error !== 'aborted') {
            setError(`Speech recognition notice: ${event.error}`);
          }
        };

        recognition.onend = () => {
          // If we were still listening and not paused, auto restart to maintain continuous dictation
          if (recognitionRef.current && isListening && !isPaused) {
            try {
              recognition.start();
            } catch (e) {
              // ignore
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (recStartErr) {
        console.warn('SpeechRecognition start failed, will rely on audio recording:', recStartErr);
      }
    }

    setIsListening(true);
    setIsPaused(false);

    // Timer
    timerIntervalRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, [isListening, isPaused]);

  const pauseListening = useCallback(() => {
    setIsPaused(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {
        // ignore
      }
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const resumeListening = useCallback(() => {
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // ignore
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try {
        mediaRecorderRef.current.resume();
      } catch (e) {
        // ignore
      }
    }
    if (!timerIntervalRef.current) {
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    let finalRecordedTranscript = transcript.trim();
    if (interimTranscript.trim()) {
      finalRecordedTranscript = finalRecordedTranscript
        ? `${finalRecordedTranscript} ${interimTranscript.trim()}`
        : interimTranscript.trim();
      setTranscript(finalRecordedTranscript);
      setInterimTranscript('');
    }

    // Stop recorder & check audio
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch (e) {
          resolve();
        }
      });
    }

    // If speech recognition was empty but we recorded audio chunks, try server transcription
    if (!finalRecordedTranscript && audioChunksRef.current.length > 0) {
      setIsTranscribing(true);
      try {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: audioChunksRef.current[0]?.type || 'audio/webm',
        });

        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const base64Audio = await base64Promise;

        const res = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            finalRecordedTranscript = data.text.trim();
            setTranscript(finalRecordedTranscript);
          }
        }
      } catch (transcribeErr) {
        console.warn('Server fallback transcription failed:', transcribeErr);
      } finally {
        setIsTranscribing(false);
      }
    }

    cleanupAudio();
    return finalRecordedTranscript;
  }, [transcript, interimTranscript]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setDuration(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isPaused,
    isTranscribing,
    transcript,
    interimTranscript,
    audioLevel,
    duration,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
    setTranscript,
  };
}
