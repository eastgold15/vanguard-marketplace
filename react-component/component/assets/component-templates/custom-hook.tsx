import { useState, useCallback, useEffect } from 'react';

// Return type interface
interface UseCustomHookReturn {
  value: string;
  setValue: (value: string) => void;
  reset: () => void;
  // Add more return values
}

// Hook implementation
export function useCustomHook(initialValue = ''): UseCustomHookReturn {
  const [value, setValue] = useState(initialValue);

  // Memoized callbacks
  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Effects
  useEffect(() => {
    // Side effects here
    console.log('Value changed:', value);
  }, [value]);

  return {
    value,
    setValue,
    reset,
  };
}

// Usage Example (delete before using):
/*
function Component() {
  const { value, setValue, reset } = useCustomHook('initial');
  
  return (
    <div>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={reset}>Reset</button>
    </div>
  );
}
*/

// ============================================
// Example: useToggle Hook
// ============================================

interface UseToggleReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [isOpen, setIsOpen] = useState(initialValue);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}

// ============================================
// Example: useDebounce Hook
// ============================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// Example: useLocalStorage Hook
// ============================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
