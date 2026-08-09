import { useState, useEffect, useRef, useCallback } from 'react';
import { GameStats, KeystrokeLog } from '../types';
import { playSwitchSound, playErrorSound, SwitchType } from '../utils/soundEngine';

export function useTypingEngine(targetText: string, soundType: SwitchType = 'mechanical') {
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errorsCount, setErrorsCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [wpmHistory, setWpmHistory] = useState<{ time: number; wpm: number; accuracy: number }[]>([]);
  const [errorHeatmap, setErrorHeatmap] = useState<Record<string, number>>({});
  const [keystrokeLogs, setKeystrokeLogs] = useState<KeystrokeLog[]>([]);
  const [lastTypoHint, setLastTypoHint] = useState<{ typed: string; expected: string; timestamp: number } | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const consecutiveErrorsRef = useRef(0);
  const [consecutiveErrorAlert, setConsecutiveErrorAlert] = useState<{ count: number; timestamp: number } | null>(null);

  const historyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when target text changes
  const resetEngine = useCallback((newText?: string) => {
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setErrorsCount(0);
    setTotalKeystrokes(0);
    setCompleted(false);
    setWpmHistory([]);
    setErrorHeatmap({});
    setKeystrokeLogs([]);
    setLastTypoHint(null);
    setIsShaking(false);
    consecutiveErrorsRef.current = 0;
    setConsecutiveErrors(0);
    setConsecutiveErrorAlert(null);
    if (historyIntervalRef.current) {
      clearInterval(historyIntervalRef.current);
      historyIntervalRef.current = null;
    }
  }, []);

  // Calculate current real-time stats
  const getElapsedMs = useCallback(() => {
    if (!startTime) return 0;
    if (endTime) return endTime - startTime;
    return Date.now() - startTime;
  }, [startTime, endTime]);

  const getWpm = useCallback(() => {
    const elapsedMs = getElapsedMs();
    if (elapsedMs < 1000) return 0;

    // Count correct characters up to the first error
    let correctCount = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === targetText[i]) {
        correctCount++;
      } else {
        break;
      }
    }

    const words = correctCount / 5;
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes);
  }, [userInput, targetText, getElapsedMs]);

  const getCpm = useCallback(() => {
    const elapsedMs = getElapsedMs();
    if (elapsedMs < 1000) return 0;

    let correctCount = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === targetText[i]) {
        correctCount++;
      } else {
        break;
      }
    }

    const minutes = elapsedMs / 60000;
    return Math.round(correctCount / minutes);
  }, [userInput, targetText, getElapsedMs]);

  const getAccuracy = useCallback(() => {
    if (totalKeystrokes === 0) return 100;
    const correctKeystrokes = totalKeystrokes - errorsCount;
    return Math.max(0, Math.round((correctKeystrokes / totalKeystrokes) * 100));
  }, [totalKeystrokes, errorsCount]);

  // Track key press sounds and metrics
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (completed) return;

    // Ignore modifier keys
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') {
      return;
    }

    const now = Date.now();
    const activeStartTime = startTime || now;

    // Initialize typing timer on first character
    if (!startTime) {
      setStartTime(now);
    }

    const timestampMs = Math.max(0, now - activeStartTime);

    if (e.key === 'Backspace') {
      playSwitchSound(soundType);
      if (consecutiveErrorsRef.current > 0) {
        const nextVal = Math.max(0, consecutiveErrorsRef.current - 1);
        consecutiveErrorsRef.current = nextVal;
        setConsecutiveErrors(nextVal);
        if (nextVal < 5) {
          setConsecutiveErrorAlert(null);
        }
      }
      setUserInput((prev) => {
        const nextLength = Math.max(0, prev.length - 1);
        setKeystrokeLogs((logs) => [
          ...logs,
          {
            key: 'Backspace',
            timestampMs,
            inputLength: nextLength,
            isCorrect: true,
          }
        ]);
        return prev.slice(0, -1);
      });
      return;
    }

    // Ignore other non-printable keys
    if (e.key.length > 1) return;

    playSwitchSound(soundType);
    setTotalKeystrokes((prev) => prev + 1);

    const charTyped = e.key;
    const expectedChar = targetText[userInput.length];
    const isCorrect = charTyped === expectedChar;

    setUserInput((prev) => {
      // If it's a mistake: do NOT advance the cursor!
      if (!isCorrect) {
        setErrorsCount((prevErrors) => prevErrors + 1);
        playErrorSound();

        // Increment consecutive error streak
        const newStreak = consecutiveErrorsRef.current + 1;
        consecutiveErrorsRef.current = newStreak;
        setConsecutiveErrors(newStreak);

        // Alert when reaching 5 consecutive typos or every 5 typos
        if (newStreak === 5 || (newStreak > 5 && newStreak % 5 === 0)) {
          setConsecutiveErrorAlert({
            count: newStreak,
            timestamp: Date.now(),
          });
        }

        // Trigger shake effect
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);

        // Record typo hint for user clarity
        setLastTypoHint({
          typed: charTyped,
          expected: expectedChar || 'End of text',
          timestamp: Date.now()
        });

        // Track mistake character in heatmap
        if (expectedChar) {
          setErrorHeatmap((prevMap) => ({
            ...prevMap,
            [expectedChar]: (prevMap[expectedChar] || 0) + 1,
          }));
        }

        setKeystrokeLogs((logs) => [
          ...logs,
          {
            key: charTyped,
            timestampMs,
            inputLength: prev.length,
            isCorrect: false,
            expectedChar,
          }
        ]);

        return prev;
      }

      // Reset consecutive error streak on correct key press
      consecutiveErrorsRef.current = 0;
      setConsecutiveErrors(0);
      setConsecutiveErrorAlert(null);

      // Clear typo hint on correct key press
      setLastTypoHint(null);
      const nextInput = prev + charTyped;

      setKeystrokeLogs((logs) => [
        ...logs,
        {
          key: charTyped,
          timestampMs,
          inputLength: nextInput.length,
          isCorrect: true,
          expectedChar,
        }
      ]);

      // Check for completion
      if (nextInput === targetText) {
        setCompleted(true);
        setEndTime(Date.now());
      }

      return nextInput;
    });
  }, [userInput, targetText, startTime, completed, soundType]);

  // Track WPM history at 1-second intervals while typing is active
  useEffect(() => {
    if (startTime && !completed && !endTime) {
      historyIntervalRef.current = setInterval(() => {
        const timeSecs = Math.round((Date.now() - startTime) / 1000);
        if (timeSecs > 0) {
          setWpmHistory((prev) => [
            ...prev,
            {
              time: timeSecs,
              wpm: getWpm(),
              accuracy: getAccuracy(),
            },
          ]);
        }
      }, 1000);
    }

    return () => {
      if (historyIntervalRef.current) {
        clearInterval(historyIntervalRef.current);
        historyIntervalRef.current = null;
      }
    };
  }, [startTime, completed, endTime, getWpm, getAccuracy]);

  // Get final consolidated stats
  const getStats = useCallback((): GameStats => {
    return {
      wpm: getWpm(),
      accuracy: getAccuracy(),
      cpm: getCpm(),
      errors: errorsCount,
      elapsedMs: getElapsedMs(),
      errorHeatmap,
      wpmHistory: wpmHistory.length > 0 ? wpmHistory : [{ time: 1, wpm: getWpm(), accuracy: getAccuracy() }],
      keystrokes: keystrokeLogs,
    };
  }, [getWpm, getAccuracy, getCpm, errorsCount, getElapsedMs, errorHeatmap, wpmHistory, keystrokeLogs]);

  return {
    userInput,
    completed,
    errorsCount,
    totalKeystrokes,
    startTime,
    endTime,
    resetEngine,
    handleKeyDown,
    getWpm,
    getCpm,
    getAccuracy,
    getStats,
    errorHeatmap,
    wpmHistory,
    lastTypoHint,
    isShaking,
    consecutiveErrors,
    consecutiveErrorAlert,
  };
}
