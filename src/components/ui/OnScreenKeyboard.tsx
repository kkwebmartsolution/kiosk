import React, { useMemo } from "react";
import { useKeyboard } from "@/contexts/keyboard-context";

const keyRows: string[][] = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["z","x","c","v","b","n","m"],
];

const OnScreenKeyboard: React.FC = () => {
  const { show, pressKey, hideKeyboard } = useKeyboard();

  const rows = useMemo(() => keyRows, []);
  if (!show) return null;

  return (
    <div data-onscreen-keyboard className="fixed inset-x-0 bottom-0 z-[100] select-none">
      <div className="mx-auto max-w-6xl p-2 pb-3">
        <div className="rounded-xl border bg-white shadow-2xl">
          <div className="grid gap-2 p-2">
            {rows.map((row, idx) => (
              <div key={idx} className="flex justify-center gap-2">
                {row.map((k) => (
                  <button
                    key={k}
                    className="px-4 py-3 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-base font-medium"
                    onClick={() => pressKey(k)}
                  >
                    {k}
                  </button>
                ))}
                {idx === 2 && (
                  <button
                    className="px-4 py-3 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-base font-medium"
                    onClick={() => pressKey("Backspace")}
                  >
                    ⌫
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-center gap-2">
              <button className="px-4 py-3 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-base font-medium" onClick={() => pressKey(" ")}>Space</button>
              <button className="px-4 py-3 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-base font-medium" onClick={() => pressKey("Enter")}>Enter</button>
              <button className="px-4 py-3 rounded-md bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-base font-medium" onClick={hideKeyboard}>Hide</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
