import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage the stepwise execution of an algorithm.
 * @param {Array} states - An array of pre-computed state objects representing each step of the algorithm.
 * @param {Number} defaultSpeed - Default playback speed in ms.
 */
export function useAlgorithmRunner(states = [], defaultSpeed = 500) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const timerRef = useRef(null);

  const totalSteps = states.length;
  const isFinished = totalSteps > 0 && currentStep === totalSteps - 1;

  const play = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setIsPlaying(true);
    }
  }, [currentStep, totalSteps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setIsPlaying(false); // Usually want to pause when manually stepping back
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const seek = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
    }
  }, [totalSteps]);

  // Handle automatic playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        nextStep();
      }, speed);
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, speed, nextStep]);

  // Stop playing if finished
  useEffect(() => {
    if (isFinished) {
      setIsPlaying(false);
    }
  }, [isFinished]);

  return {
    currentStep,
    currentState: states[currentStep] || null,
    isPlaying,
    isFinished,
    speed,
    totalSteps,
    play,
    pause,
    nextStep,
    prevStep,
    reset,
    seek,
    setSpeed
  };
}
