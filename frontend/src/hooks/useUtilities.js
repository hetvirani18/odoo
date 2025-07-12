import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values (useful for search inputs)
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} - The debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for managing form submission states
 * @returns {Object} - { isSubmitting, submitForm }
 */
export const useSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitForm = async (submitFunction) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await submitFunction();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitForm
  };
};

/**
 * Custom hook for managing modal/dialog states
 * @param {boolean} initialState - Initial open/closed state
 * @returns {Object} - { isOpen, open, close, toggle }
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    open,
    close,
    toggle
  };
};
