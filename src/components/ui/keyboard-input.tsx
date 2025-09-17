import { useEffect, useMemo, useRef } from 'react';
import { Input } from './input';
import { useKeyboard } from '@/contexts/keyboard-context';

type KeyboardInputProps = React.ComponentProps<'input'> & {
  showKeyboardOnFocus?: boolean;
  numericOnly?: boolean;
};

export function KeyboardInput({ showKeyboardOnFocus = true, numericOnly, ...props }: KeyboardInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setInputRef, showKeyboard, setLayout } = useKeyboard();

  useEffect(() => {
    if (inputRef.current) {
      setInputRef(inputRef);
    }
  }, [setInputRef]);

  const isNumeric = useMemo(() => {
    if (numericOnly) return true;
    const t = (props.type ?? '').toLowerCase();
    const im = (props as any).inputMode?.toString().toLowerCase();
    return t === 'tel' || im === 'numeric';
  }, [numericOnly, props.type, (props as any).inputMode]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (showKeyboardOnFocus) {
      showKeyboard();
      setLayout(isNumeric ? 'numeric' : 'default');
    }
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  return (
    <Input
      ref={inputRef}
      onFocus={handleFocus}
      onTouchEnd={(e) => {
        e.preventDefault();
        inputRef.current?.focus();
      }}
      inputMode={isNumeric ? 'numeric' : (props as any).inputMode}
      {...props}
    />
  );
}
