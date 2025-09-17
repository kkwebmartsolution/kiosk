import React, { useMemo } from "react";
import { useKeyboard } from "@/contexts/keyboard-context";

const alphaRows: string[][] = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["z","x","c","v","b","n","m"],
];

const numericRows: string[][] = [
  ["1","2","3"],
  ["4","5","6"],
  ["7","8","9"],
  ["0"],
];

const OnScreenKeyboard: React.FC = () => {
  const { show, pressKey, hideKeyboard, layout } = useKeyboard();

  const rows = useMemo(() => (layout === 'numeric' ? numericRows : alphaRows), [layout]);
  if (!show) return null;

  return (
    <div data-onscreen-keyboard className="fixed inset-x-0 bottom-0 z-[100] select-none">
      <div className="mx-auto max-w-5xl p-3 pb-5">
        <div className="rounded-t-2xl border bg-white shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-white/90">
          <div className="flex justify-center py-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Numeric layout: 3-column grid like mobile dial pad */}
          {layout === 'numeric' ? (
            <div className="px-3 pb-3">
              <div className="mx-auto w-full max-w-sm">
                <div className="grid grid-cols-3 gap-2">
                  {["1","2","3","4","5","6","7","8","9","","0","Backspace"].map((k, i) => (
                    <div key={i} className="flex">
                      {k === "" ? (
                        <div className="h-14 w-full" />
                      ) : k === "Backspace" ? (
                        <button
                          aria-label="Backspace"
                          className="h-14 w-full rounded-xl bg-gray-100 active:bg-gray-300 shadow-sm text-xl font-medium"
                          onClick={() => pressKey("Backspace")}
                        >
                          ⌫
                        </button>
                      ) : (
                        <button
                          className="h-14 w-full rounded-xl bg-gray-100 active:bg-gray-300 shadow-sm text-xl font-semibold"
                          onClick={() => pressKey(k)}
                        >
                          {k}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-2">
                <button className="h-11 px-4 rounded-lg bg-gray-100 active:bg-gray-300 text-sm font-medium" onClick={hideKeyboard}>Hide</button>
                <button className="h-11 px-4 rounded-lg bg-gray-100 active:bg-gray-300 text-sm font-medium" onClick={() => pressKey("Enter")}>Enter</button>
              </div>
            </div>
          ) : (
            /* Alpha layout */
            <div className="px-3 pb-4">
              <div className="grid gap-2">
                {rows.map((row, idx) => (
                  <div key={idx} className="flex justify-center gap-2">
                    {row.map((k) => (
                      <button
                        key={k}
                        className="h-14 min-w-14 px-4 rounded-2xl bg-gray-100 active:bg-gray-300 shadow-sm text-xl font-medium"
                        onClick={() => pressKey(k)}
                      >
                        {k}
                      </button>
                    ))}
                    {idx === 2 && (
                      <button
                        aria-label="Backspace"
                        className="h-14 min-w-20 px-4 rounded-2xl bg-gray-100 active:bg-gray-300 shadow-sm text-xl font-medium"
                        onClick={() => pressKey("Backspace")}
                      >
                        ⌫
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <button className="h-12 px-5 rounded-xl bg-gray-100 active:bg-gray-300 text-base font-medium" onClick={hideKeyboard}>Hide</button>
                  <button
                    className="h-14 flex-1 max-w-xl px-6 rounded-2xl bg-gray-100 active:bg-gray-300 shadow-sm text-xl font-medium"
                    onClick={() => pressKey(" ")}
                  >
                    Space
                  </button>
                  <button className="h-12 px-5 rounded-xl bg-gray-100 active:bg-gray-300 text-base font-medium" onClick={() => pressKey("Enter")}>Enter</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
