import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface KeyboardContextValue {
  show: boolean;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null> | null;
  setInputRef: (ref: React.RefObject<any>) => void;
  showKeyboard: () => void;
  hideKeyboard: () => void;
  pressKey: (key: string) => void;
}

const KeyboardContext = createContext<KeyboardContextValue | undefined>(undefined);

export const useKeyboard = () => {
  const ctx = useContext(KeyboardContext);
  if (!ctx) throw new Error("useKeyboard must be used within KeyboardProvider");
  return ctx;
};

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const setInputRef = useCallback((ref: React.RefObject<any>) => {
    inputRef.current = ref?.current ?? null;
  }, []);

  const showKeyboard = useCallback(() => setShow(true), []);
  const hideKeyboard = useCallback(() => setShow(false), []);

  // Attach global listeners so any input/textarea will trigger the keyboard on focus (kiosk UX)
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        inputRef.current = target as any;
        setShow(true);
      }
    };
    const handlePointerDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      // If clicked outside of inputs and keyboard, optionally hide
      if (!el.closest('[data-onscreen-keyboard]') && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
        // Keep keyboard open on kiosk unless explicitly hidden
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const pressKey = useCallback((key: string) => {
    const el = inputRef.current as any;
    if (!el) return;
    el.focus?.();
    const start = el.selectionStart ?? el.value?.length ?? 0;
    const end = el.selectionEnd ?? start;

    if (key === 'Backspace') {
      if (start === end && start > 0) {
        const before = el.value.slice(0, start - 1);
        const after = el.value.slice(end);
        el.value = before + after;
        el.setSelectionRange(start - 1, start - 1);
      } else if (start !== end) {
        const before = el.value.slice(0, start);
        const after = el.value.slice(end);
        el.value = before + after;
        el.setSelectionRange(start, start);
      }
    } else if (key === 'Space') {
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      el.value = before + ' ' + after;
      el.setSelectionRange(start + 1, start + 1);
    } else if (key === 'Enter') {
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      el.value = before + "\n" + after;
      el.setSelectionRange(start + 1, start + 1);
    } else {
      const before = el.value.slice(0, start);
      const after = el.value.slice(end);
      el.value = before + key + after;
      el.setSelectionRange(start + key.length, start + key.length);
    }
    // Trigger input event so React picks up value changes
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  const value = useMemo(() => ({ show, inputRef: inputRef as any, setInputRef, showKeyboard, hideKeyboard, pressKey }), [show, setInputRef, showKeyboard, hideKeyboard, pressKey]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};
