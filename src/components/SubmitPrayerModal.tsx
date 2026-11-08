import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RequestCategory } from '../types';
import { useSpeechToText, isInsideFrame } from '../hooks/useSpeechToText';
import { normalizeCategory } from '../utils/csvParser';
import {
  X,
  Lock,
  Sparkles,
  Heart,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  LifeBuoy,
  Mic,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react';

// Simple stand-in title when the AI title service can't be reached: the first few words
const fallbackTitle = (text: string): string => {
  let clean = text.trim().replace(/\s+/g, ' ');
  clean = clean.replace(/^(please pray for|praying for|i ask for prayer for|pray for|prayer request for|can you pray for|i need prayer for|i would like prayer for)\s+/i, '');
  const firstSentence = clean.split(/[.?!\n]/)[0].trim() || clean;
  const words = firstSentence.split(' ');
  const short = words.length <= 8 ? firstSentence : `${words.slice(0, 8).join(' ')}...`;
  return short.charAt(0).toUpperCase() + short.slice(1);
};

interface AiTitle {
  title: string;
  category: RequestCategory;
  isPraise: boolean;
  isUrgent: boolean;
}

// Ask the AI for the short title shown on the wall and printable prayer list (Netlify function)
const fetchAiTitle = async (text: string): Promise<AiTitle | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('/.netlify/functions/prayer-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) return null;
    const data = await res.json();
    return data?.title ? (data as AiTitle) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

export const SubmitPrayerModal: React.FC = () => {
  const {
    currentChurch,
    submitModalOpen,
    setSubmitModalOpen,
    addPrayerRequest,
    isModerating,
    currentUser,
  } = useApp();

  const [content, setContent] = useState('');
  const [requesterName, setRequesterName] = useState(currentUser?.name || '');
  const [requesterEmail, setRequesterEmail] = useState(currentUser?.email || '');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // The account may finish loading after this form is created; fill in the person's details on open
  useEffect(() => {
    if (submitModalOpen && currentUser) {
      setRequesterName((n) => n || currentUser.name);
      setRequesterEmail((e) => e || currentUser.email);
      setRequesterPhone((p) => p || currentUser.phone || '');
    }
  }, [submitModalOpen, currentUser]);

  // Voice dictation state
  const {
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

  // Helper: capitalize sentences and clean transcript
  const formatSpokenPrayer = (rawText: string): string => {
    if (!rawText) return '';
    let text = rawText.trim();
    text = text.charAt(0).toUpperCase() + text.slice(1);
    text = text.replace(/([.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
    return text;
  };

  const handleStartVoice = async () => {
    setVoicePanelOpen(true);
    resetTranscript();
    await startListening();
  };

  const handleStopAndApplyVoice = async () => {
    const finalSpoken = await stopListening();
    const spokenText = (finalSpoken || transcript || interimTranscript).trim();
    if (spokenText) {
      const cleanSpoken = formatSpokenPrayer(spokenText);
      setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${cleanSpoken}` : cleanSpoken));
    }
    setVoicePanelOpen(false);
  };

  const handleCancelVoice = async () => {
    if (isListening) {
      await stopListening();
    }
    resetTranscript();
    setVoicePanelOpen(false);
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

  const visibility = isPrivate ? 'private' : 'church';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || isSharing) return;

    setIsSharing(true);
    try {
      const ai = await fetchAiTitle(text);
      const title = ai?.title || fallbackTitle(text);
      const category: RequestCategory = ai?.category || normalizeCategory('', text);

      const res = await addPrayerRequest({
        title,
        content: text,
        requesterName: isAnonymous ? 'Anonymous' : (requesterName.trim() || 'Church Member'),
        requesterEmail: requesterEmail.trim() || undefined,
        requesterPhone: requesterPhone.trim() || undefined,
        isAnonymous,
        visibility,
        category: ai?.isPraise ? 'Praise & Thanksgiving' : category,
        isUrgent: Boolean(ai?.isUrgent),
      });

      if (!res.success) {
        setSubmitResult({
          status: 'error',
          message: 'Your prayer request could not be saved. Please check your connection and try again.',
        });
        return;
      }

      const encouragementNote =
        'May the Lord bless you and keep you; may His face shine upon you and give you peace. (Numbers 6:24-26)';

      if (res.status === 'flagged') {
        setSubmitResult({
          status: 'flagged',
          message:
            'Thank you for sharing your heart. Your prayer request has been received and sent to our pastoral team for review before it is published to the prayer wall.',
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
    } finally {
      setIsSharing(false);
    }
  };

  const handleResetAndClose = () => {
    if (isListening) {
      stopListening();
    }
    resetTranscript();
    setVoicePanelOpen(false);
    setContent('');
    setRequesterName('');
    setRequesterEmail('');
    setRequesterPhone('');
    setIsAnonymous(false);
    setIsPrivate(false);
    setShowContact(false);
    setSubmitResult(null);
    setSubmitModalOpen(false);
  };

  const busy = isSharing || isModerating;

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
            aria-label="Close"
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
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Prayer request */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="prayer-text" className="text-sm font-semibold text-stone-800">
                  What would you like prayer for?
                </label>
                {!voicePanelOpen && (
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 shrink-0"
                    title="Speak your prayer instead of typing"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Speak</span>
                  </button>
                )}
              </div>
              <textarea
                id="prayer-text"
                required
                rows={6}
                autoFocus
                placeholder="Share as much or as little as you like. We'll make a short version for the prayer list."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            {/* Voice dictation */}
            {voicePanelOpen && (
              <div className="bg-stone-900 text-white rounded-xl p-4 border border-stone-800 space-y-3.5 shadow-xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 border-b border-stone-800 pb-2.5">
                  <span className="relative flex h-3 w-3">
                    {isListening && !isPaused && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isListening && !isPaused ? 'bg-rose-500' : isPaused ? 'bg-amber-400' : isTranscribing ? 'bg-purple-400' : 'bg-stone-500'
                      }`}
                    ></span>
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    {isListening && !isPaused ? 'Listening...' : isPaused ? 'Paused' : isTranscribing ? 'Transcribing...' : 'Microphone Ready'}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-200 border border-stone-700">
                    {formatTimer(duration)}
                  </span>
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
                      {isInsideFrame && (
                        <a
                          href={window.location.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1.5 text-[11px] font-bold text-white underline underline-offset-2"
                        >
                          Open the prayer wall in its own window
                        </a>
                      )}
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
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="prayer-name" className="text-sm font-semibold text-stone-800">
                  Your name
                </label>
                <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Share anonymously</span>
                </label>
              </div>
              {!isAnonymous && (
                <input
                  id="prayer-name"
                  type="text"
                  placeholder="e.g. Mary Higgins"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full text-base sm:text-sm px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              )}
            </div>

            {/* Private */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isPrivate ? 'border-purple-400 bg-purple-50/60' : 'border-stone-200 hover:bg-stone-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-stone-600 leading-relaxed">
                <span className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  Keep this private
                </span>
                Only our pastors and staff will see it. It won't appear on the prayer wall.
              </span>
            </label>

            {/* Optional contact */}
            <div>
              <button
                type="button"
                onClick={() => setShowContact((v) => !v)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                aria-expanded={showContact}
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showContact ? 'rotate-180' : ''}`} />
                Want a pastor to follow up? Add your email or phone (optional)
              </button>
              {showContact && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email (only staff see this)"
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    className="text-base sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (only staff see this)"
                    value={requesterPhone}
                    onChange={(e) => setRequesterPhone(e.target.value)}
                    className="text-base sm:text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Submit a Prayer Request</span>
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
