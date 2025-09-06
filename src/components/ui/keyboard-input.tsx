import { useEffect, useRef } from 'react';
import { Input } from './input';
import { useKeyboard } from '@/contexts/keyboard-context';

type KeyboardInputProps = React.ComponentProps<'input'> & {
  showKeyboardOnFocus?: boolean;
};

export function KeyboardInput({ showKeyboardOnFocus = true, ...props }: KeyboardInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setInputRef, showKeyboard } = useKeyboard();

  useEffect(() => {
    if (inputRef.current) {
      setInputRef(inputRef);
    }
  }, [setInputRef]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (showKeyboardOnFocus) {
      showKeyboard();
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
      {...props}
    />
  );
}
