import { useState, useEffect, useRef } from 'react';

export function useSpeech(onResult) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const fullTranscriptRef = useRef('');

  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          fullTranscriptRef.current += finalTranscript;
        }

        // Reset silence timer on any speech detection (interim or final)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
           stopListening();
        }, 5000);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (fullTranscriptRef.current.trim() && onResultRef.current) {
          onResultRef.current(fullTranscriptRef.current.trim());
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore already stopped
        }
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        fullTranscriptRef.current = ''; // Reset transcript on new start
        recognitionRef.current.start();
        
        // Start initial silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
           stopListening();
        }, 5000);
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Could not stop recognition:", e);
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
  };

  const speak = (text, onEndCallback) => {
    if (!window.speechSynthesis) {
      console.warn("Speech Synthesis API not supported.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a male English voice (for Jerry)
    const voices = window.speechSynthesis.getVoices();
    const maleVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google UK English Male')));
    if (maleVoice) utterance.voice = maleVoice;

    utterance.pitch = 1;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking };
}
