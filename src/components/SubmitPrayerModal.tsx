import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { VisibilityType, RequestCategory } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';
import {
  X,
  Lock,
  Church as ChurchIcon,
  Globe,
  Sparkles,
  Heart,
  Flame,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  LifeBuoy,
  Mic,
  MicOff,
  Volume2,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  Wand2,
  RefreshCw,
  Info
} from 'lucide-react';

const CATEGORIES: RequestCategory[] = [
  'Health & Healing',
  'Comfort & Grief',
  'Family & Relationships',
  'Spiritual Growth',
  'Missions & Outreach',
  'Praise & Thanksgiving',
  'Guidance & Provision',
  'General',
];

export const SubmitPrayerModal: React.FC = () => {
  const {
    currentChurch,
    submitModalOpen,
    setSubmitModalOpen,
    addPrayerRequest,
    isModerating,
    currentUser,
  } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [requesterName, setRequesterName] = useState(currentUser?.name || '');
  const [requesterEmail, setRequesterEmail] = useState(currentUser?.email || '');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone || '');

  // The account may finish loading after this form is created; fill in the person's details on open
  useEffect(() => {
    if (submitModalOpen && currentUser) {
      setRequesterName((n) => n || currentUser.name);
      setRequesterEmail((e) => e || currentUser.email);
      setRequesterPhone((p) => p || currentUser.phone || '');
    }
  }, [submitModalOpen, currentUser]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityType>('church');
  const [category, setCategory] = useState<RequestCategory>('Health & Healing');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Voice dictation state
  const {
    isSupported: isSpeechSupported,
    isListening,
    isPaused,
    isTranscribing,
    transcript,
    interimTranscript,
    audioLevel,
    duration,
    error: speechError,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
  } = useSpeechToText();

  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'content' | 'title' | 'both'>('content');
  const [dictationMode, setDictationMode] = useState<'append' | 'replace'>('append');
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  // Helper: capitalize sentences and clean transcript
  const formatSpokenPrayer = (rawText: string): string => {
    if (!rawText) return '';
    let text = rawText.trim();
    // Capitalize first character
    text = text.charAt(0).toUpperCase() + text.slice(1);
    // Capitalize after periods, question marks, exclamation marks
    text = text.replace(/([.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
    return text;
  };

  // Helper: derive title from spoken prayer content
  const extractTitleFromContent = (text: string): string => {
    if (!text.trim()) return '';
    let clean = text.trim();
    // Strip common conversational starters
    clean = clean.replace(/^(please pray for|praying for|i ask for prayer for|pray for|prayer request for|can you pray for|i need prayer for)\s+/i, '');
    // Take first sentence or first 7 words
    const firstSentence = clean.split(/[.?!]/)[0].trim();
    const words = firstSentence.split(/\s+/);
    if (words.length <= 7) {
      return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1);
    }
    return words.slice(0, 7).join(' ').charAt(0).toUpperCase() + words.slice(0, 7).join(' ').slice(1);
  };

  const handleStartVoice = async (target: 'content' | 'title' | 'both' = 'content') => {
    setDictationTarget(target);
    setVoicePanelOpen(true);
    resetTranscript();
    await startListening();
  };

  const handleStopAndApplyVoice = async () => {
    const finalSpoken = await stopListening();
    const spokenText = (finalSpoken || transcript || interimTranscript).trim();
    if (!spokenText) {
      setVoicePanelOpen(false);
      return;
    }

    const cleanSpoken = formatSpokenPrayer(spokenText);

    if (dictationTarget === 'title') {
      setTitle((prev) => (dictationMode === 'append' && prev ? `${prev} - ${cleanSpoken}` : cleanSpoken));
      setVoiceNotification('Spoken title inserted into prayer request!');
    } else if (dictationTarget === 'content') {
      setContent((prev) => (dictationMode === 'append' && prev ? `${prev ? prev + '\n\n' : ''}${cleanSpoken}` : cleanSpoken));
      if (!title.trim()) {
        const autoTitle = extractTitleFromContent(cleanSpoken);
        if (autoTitle) {
          setTitle(autoTitle);
        }
      }
      setVoiceNotification('Spoken prayer recorded and applied to details!');
    } else if (dictationTarget === 'both') {
      const autoTitle = extractTitleFromContent(cleanSpoken);
      if (autoTitle) setTitle(autoTitle);
      setContent(cleanSpoken);
      setVoiceNotification('Spoken prayer recorded and title generated!');
    }

    setTimeout(() => setVoiceNotification(null), 3500);
    setVoicePanelOpen(false);
  };

  const handleCancelVoice = async () => {
    if (isListening) {
      await stopListening();
    }
    resetTranscript();
    setVoicePanelOpen(false);
  };

  const handleAutoGenerateTitle = () => {
    if (!content.trim()) return;
    const derived = extractTitleFromContent(content);
    if (derived) {
      setTitle(derived);
      setVoiceNotification(`Generated title: "${derived}"`);
      setTimeout(() => setVoiceNotification(null), 3000);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Submission response status
  const [submitResult, setSubmitResult] = useState<{
    status: 'success' | 'flagged' | 'crisis' | 'error';
    message: string;
    encouragement?: string;
  } | null>(null);

  if (!submitModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await addPrayerRequest({
        title: title.trim(),
        content: content.trim(),
        requesterName: isAnonymous ? 'Anonymous' : (requesterName.trim() || 'Church Member'),
        requesterEmail: requesterEmail.trim() || undefined,
        requesterPhone: requesterPhone.trim() || undefined,
        isAnonymous,
        visibility,
        category,
        isUrgent,
      });

      if (!res.success) {
        setSubmitResult({
          status: 'error',
          message: 'Your prayer request could not be saved. Please check your connection and try again.',
        });
        return;
      }

      // Fetch a gentle Scripture encouragement for the requester
      let encouragementNote = '';
      try {
        const encRes = await fetch('/api/generate-encouragement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category }),
        });
        if (encRes.ok) {
          const encJson = await encRes.json();
          encouragementNote = encJson.encouragement;
        }
      } catch (err) {
        // Fallback
        encouragementNote = "May the Lord bless you and keep you; may His face shine upon you and give you peace. (Numbers 6:24-26)";
      }

      if (res.status === 'flagged') {
        setSubmitResult({
          status: 'flagged',
          message:
            'Thank you for sharing your heart. Your prayer request has been received and sent to our pastoral team for review before it is published to the public prayer wall.',
          encouragement: encouragementNote,
        });
      } else if (res.status === 'rejected') {
        setSubmitResult({
          status: 'error',
          message:
            res.reason ||
            'We were unable to publish this request as written. Please contact our pastoral office directly if you need immediate care.',
        });
      } else {
        setSubmitResult({
          status: 'success',
          message:
            visibility === 'private'
              ? 'Your confidential prayer request has been received by our pastoral care team. Our pastors will lift this before the Lord in strict confidence.'
              : 'Your prayer request has been posted to our church prayer wall! Our congregation will stand with you in faith.',
          encouragement: encouragementNote,
        });
      }
    } catch (err) {
      setSubmitResult({
        status: 'error',
        message: 'An error occurred while submitting your prayer request. Please try again.',
      });
    }
  };

  const handleResetAndClose = () => {
    if (isListening) {
      stopListening();
    }
    resetTranscript();
    setVoicePanelOpen(false);
    setTitle('');
    setContent('');
    setRequesterName('');
    setRequesterEmail('');
    setRequesterPhone('');
    setIsAnonymous(false);
    setVisibility('church');
    setCategory('Health & Healing');
    setIsUrgent(false);
    setSubmitResult(null);
    setSubmitModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto sm:my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif-church text-base sm:text-lg font-bold">
                Submit a Prayer Request
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-400 line-clamp-1">
                {currentChurch.name} • How can our church family pray for you?
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {submitResult ? (
          <div className="p-6 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                submitResult.status === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : submitResult.status === 'flagged'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {submitResult.status === 'success' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : submitResult.status === 'flagged' ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>

            <h3 className="font-serif-church text-xl font-bold text-stone-900">
              {submitResult.status === 'success'
                ? 'Prayer Request Received'
                : submitResult.status === 'flagged'
                ? 'Received for Pastoral Review'
                : 'Notice'}
            </h3>

            <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              {submitResult.message}
            </p>

            {/* Scripture Encouragement */}
            {submitResult.encouragement && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 font-serif-church italic max-w-md mx-auto space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 font-sans block not-italic">
                  A Word of Encouragement for You:
                </span>
                <p>"{submitResult.encouragement}"</p>
              </div>
            )}

            {/* Crisis Support Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 max-w-md mx-auto flex items-start gap-2.5 text-left">
              <LifeBuoy className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-800 block">Immediate Pastoral Need?</span>
                <p>
                  If you are experiencing an acute personal or emotional crisis, please call our church care line at{' '}
                  <strong className="text-stone-900">{currentChurch.phone}</strong> or call the 988 Suicide & Crisis Lifeline (available 24/7).
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-6 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close & Return to Wall
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {currentUser && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Logged in as <strong>{currentUser.name}</strong></span>
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                  Saved to your Member Prayer History
                </span>
              </div>
            )}

            {/* Voice Notification Toast */}
            {voiceNotification && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between animate-in fade-in duration-200">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{voiceNotification}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceNotification(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Voice Dictation Callout Bar */}
            {!voicePanelOpen && (
              <div className="bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Speak Your Prayer (Microphone Speech-to-Text)</span>
                      <span className="bg-amber-200/80 text-amber-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        New
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Record naturally using your voice — instant real-time transcription.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartVoice(content ? 'title' : 'content')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record with Microphone</span>
                </button>
              </div>
            )}

            {/* EXPANDED LIVE VOICE RECORDING CONSOLE */}
            {voicePanelOpen && (
              <div className="bg-stone-900 text-white rounded-xl p-4 border border-stone-800 space-y-3.5 shadow-xl animate-in fade-in duration-150">
                {/* Console Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Pulsing Recording Indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-3 w-3">
                        {isListening && !isPaused && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-3 w-3 ${
                            isListening && !isPaused
                              ? 'bg-rose-500'
                              : isPaused
                              ? 'bg-amber-400'
                              : isTranscribing
                              ? 'bg-purple-400'
                              : 'bg-stone-500'
                          }`}
                        ></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">
                        {isListening && !isPaused
                          ? 'Listening...'
                          : isPaused
                          ? 'Paused'
                          : isTranscribing
                          ? 'Transcribing Audio...'
                          : 'Microphone Ready'}
                      </span>
                    </div>

                    {/* Timer */}
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">
                      {formatTimer(duration)}
                    </span>
                  </div>

                  {/* Dictation Target Selector */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-stone-400 mr-1 hidden sm:inline">Record into:</span>
                    <div className="bg-stone-800 p-0.5 rounded-lg border border-stone-700 flex items-center">
                      <button
                        type="button"
                        onClick={() => setDictationTarget('content')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          dictationTarget === 'content'
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'text-stone-300 hover:text-white'
                        }`}
                      >
                        Prayer Details
                      </button>
                      <button
                        type="button"
                        onClick={() => setDictationTarget('title')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          dictationTarget === 'title'
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'text-stone-300 hover:text-white'
                        }`}
                      >
                        Title
                      </button>
                      <button
                        type="button"
                        onClick={() => setDictationTarget('both')}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                          dictationTarget === 'both'
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'text-stone-300 hover:text-white'
                        }`}
                      >
                        Both (Auto-Fill)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Microphone Sound Bars Visualizer */}
                <div className="flex items-center justify-between gap-2 h-7 bg-stone-950/70 rounded-lg px-3 border border-stone-800/80">
                  <div className="flex items-center gap-1.5 text-stone-400 text-[10px] shrink-0">
                    <Volume2
                      className={`w-3.5 h-3.5 ${
                        audioLevel > 5 ? 'text-amber-400' : 'text-stone-500'
                      }`}
                    />
                    <span className="hidden sm:inline">Mic Volume:</span>
                  </div>

                  <div className="flex items-center gap-1 flex-1 justify-center h-full py-1">
                    {Array.from({ length: 18 }).map((_, i) => {
                      const curve = Math.sin((i / 17) * Math.PI) * 0.7 + 0.3;
                      const barHeight =
                        isListening && !isPaused
                          ? Math.max(15, Math.min(100, Math.round(audioLevel * curve * 1.3)))
                          : 10;
                      return (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all duration-75 ${
                            isListening && !isPaused
                              ? audioLevel > 18
                                ? 'bg-amber-400'
                                : 'bg-amber-500/70'
                              : 'bg-stone-700'
                          }`}
                          style={{ height: `${barHeight}%` }}
                        />
                      );
                    })}
                  </div>

                  <span className="text-[10px] text-stone-400 font-mono w-8 text-right shrink-0">
                    {audioLevel}%
                  </span>
                </div>

                {/* Real-Time Live Transcription Box */}
                <div className="bg-stone-950/90 rounded-xl p-3 border border-stone-800 text-xs min-h-[70px] max-h-36 overflow-y-auto leading-relaxed">
                  {transcript || interimTranscript ? (
                    <div className="text-stone-100 font-serif-church text-sm">
                      <span>{transcript}</span>
                      {interimTranscript && (
                        <span className="text-amber-300 italic bg-amber-950/70 px-1 rounded ml-1 animate-pulse font-sans">
                          {interimTranscript}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-400 italic">
                      {isListening && !isPaused
                        ? 'Listening... speak your prayer clearly into the microphone (e.g. "Lord, please heal my husband\'s heart condition and give our family peace...")'
                        : isPaused
                        ? 'Recording paused. Click Resume when you are ready to continue.'
                        : isTranscribing
                        ? 'Transcribing recorded audio with AI...'
                        : 'Click Start Speaking to begin voice dictation.'}
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {speechError && (
                  <div className="p-2.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold block">Microphone Notice:</span>
                      <p className="text-[11px] leading-tight text-rose-300">{speechError}</p>
                    </div>
                  </div>
                )}

                {/* Recording Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800 text-xs">
                  <div className="flex items-center gap-2">
                    {isListening ? (
                      isPaused ? (
                        <button
                          type="button"
                          onClick={resumeListening}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold rounded-lg transition-colors cursor-pointer border border-stone-700"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseListening}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-lg transition-colors cursor-pointer border border-stone-700"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => startListening()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Speaking</span>
                      </button>
                    )}

                    {(transcript || interimTranscript) && (
                      <button
                        type="button"
                        onClick={resetTranscript}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-[11px] rounded transition-colors cursor-pointer"
                        title="Clear recorded transcript"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelVoice}
                      className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleStopAndApplyVoice}
                      disabled={!transcript.trim() && !interimTranscript.trim() && !isListening}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Done & Apply to Prayer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Requester Name & Anonymous Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Your Name <span className="text-stone-400 font-normal">(or check anonymous)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Post Anonymously</span>
                </label>
              </div>

              {!isAnonymous && (
                <input
                  type="text"
                  placeholder="e.g. Mary Higgins"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Prayer Title Field with Mic Button and Auto-Title Helper */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Prayer Title <span className="text-rose-500">*</span>
                </label>

                <div className="flex items-center gap-1.5">
                  {content.trim() && !title.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateTitle}
                      className="text-[11px] text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Auto-derive title from prayer details"
                    >
                      <Wand2 className="w-3 h-3 text-amber-600" />
                      <span>Auto-Generate Title</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleStartVoice('title')}
                    className={`text-[11px] px-2 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                      voicePanelOpen && dictationTarget === 'title'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                    }`}
                    title="Record title using microphone"
                  >
                    <Mic className="w-3 h-3 text-amber-600" />
                    <span>Dictate Title</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="e.g. Upcoming cardiac bypass surgery for Harold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif-church font-semibold"
              />
            </div>

            {/* Request Details Field with Mic Button */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Prayer Details <span className="text-rose-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleStartVoice('content')}
                  className={`text-[11px] px-2.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                    voicePanelOpen && dictationTarget === 'content'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                  title="Record prayer details using microphone"
                >
                  <Mic className="w-3 h-3 text-amber-600" />
                  <span>Dictate Details (Voice)</span>
                </button>
              </div>

              <textarea
                required
                rows={4}
                placeholder="Share how our church family can stand with you in prayer (type or click microphone to speak)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category & Urgent Flag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RequestCategory)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="flex items-center gap-1 text-rose-700">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Mark as Urgent Need
                  </span>
                </label>
              </div>
            </div>

            {/* PRIVACY & VISIBILITY SELECTOR (The key user request requirement) */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-900 block">
                Prayer Visibility & Privacy
              </label>
              <div className="space-y-2">
                {/* Option 1: Private (Staff Only) */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'private'
                      ? 'border-purple-500 bg-purple-50/60 ring-1 ring-purple-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-purple-950">
                      <Lock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Private (Church Pastoral Staff Only)</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Strictly confidential. Only pastors and staff prayer team will see this. It will <strong>NOT</strong> appear on the public wall.
                    </p>
                  </div>
                </label>

                {/* Option 2: Church Public */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'church'
                      ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="church"
                    checked={visibility === 'church'}
                    onChange={() => setVisibility('church')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <ChurchIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>{currentChurch.name} Congregation Wall</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Visible on our church prayer wall. Church members can view, pray, and click "I Prayed for This".
                    </p>
                  </div>
                </label>

                {/* Option 3: Global Network */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    visibility === 'global'
                      ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-400'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="global"
                    checked={visibility === 'global'}
                    onChange={() => setVisibility('global')}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Global Prayer Wall (Church Website Pros Network)</span>
                    </div>
                    <p className="text-stone-500 mt-0.5 leading-relaxed">
                      Visible on our church wall <strong>AND</strong> featured on the ChurchWebsitePros.com national network prayer wall for believers worldwide.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Optional Contact Info for Pastoral Care Follow-up */}
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700 block">
                Optional Pastoral Contact (Private to Staff)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="email"
                  placeholder="Your Email (confidential)"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white"
                />
                <input
                  type="tel"
                  placeholder="Your Phone (optional)"
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white"
                />
              </div>
            </div>

            {/* AI Moderation Safety Reassurance */}
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-start gap-2 text-stone-500 text-[11px] leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Safety Protection:</strong> Requests are vetted with AI-assisted moderation to filter profanity, commercial spam, and ensure community safety. Flagged submissions are reviewed directly by pastoral staff.
              </span>
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isModerating}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isModerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Safety...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Share Prayer Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
