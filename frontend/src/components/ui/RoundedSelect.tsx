import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";

export type RoundedSelectOption = {
  value: string;
  label: string;
};

export function RoundedSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select option",
  size = "md",
  className,
  buttonClassName,
  menuClassName,
  optionClassName
}: {
  value: string;
  onChange: (value: string) => void;
  options: RoundedSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={clsx(
          "flex w-full items-center justify-between border border-[#2B2B2B]/10 bg-[#FFFFFF] text-left text-[#202020] outline-none transition hover:border-[#2E2E5A]/30 hover:bg-[#F2F5F8] focus:border-[#2E2E5A] focus:ring-4 focus:ring-[#2E2E5A]/10 disabled:cursor-not-allowed",
          size === "sm"
            ? "h-[42px] rounded-[14px] px-3 text-sm shadow-[0_10px_24px_rgba(32,32,32,0.08)]"
            : "h-[60px] rounded-[24px] px-5 text-[18px] shadow-[0_18px_34px_rgba(32,32,32,0.12)]",
          buttonClassName
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>

        <span
          className={clsx(
            "ml-4 flex shrink-0 items-center justify-center rounded-full bg-[#F2F5F8] text-[#2B2B2B] transition",
            size === "sm" ? "h-8 w-8" : "h-10 w-10",
            isOpen && "rotate-180 bg-[#2E2E5A]/12 text-[#2E2E5A]"
          )}
        >
          <ChevronDown className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        </span>
      </button>

      {isOpen ? (
        <div
          className={clsx(
            "absolute left-0 right-0 z-[1200] overflow-hidden border border-[#2B2B2B]/10 bg-[#FFFFFF] shadow-[0_28px_60px_rgba(32,32,32,0.18)] backdrop-blur-sm",
            size === "sm" ? "top-[calc(100%+10px)] rounded-[18px] p-2" : "top-[calc(100%+14px)] rounded-[26px] p-3",
            menuClassName
          )}
        >
          <div className="max-h-[260px] overflow-y-auto pr-1">
            <div className="space-y-1">
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value || "empty"}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between text-left transition",
                      size === "sm" ? "rounded-[12px] px-3 py-2 text-sm" : "rounded-[18px] px-4 py-3 text-[16px]",
                      selected
                        ? "bg-[#2E2E5A]/10 text-[#2E2E5A] shadow-[inset_0_0_0_1px_rgba(46,46,90,0.16)]"
                        : "text-[#2B2B2B] hover:bg-[#F2F5F8] hover:text-[#202020]",
                      optionClassName
                    )}
                  >
                    <span className="pr-3">{option.label}</span>
                    {selected ? (
                      <span
                        className={clsx(
                          "flex items-center justify-center rounded-full bg-[#FFFFFF] text-[#2E2E5A] shadow-sm",
                          size === "sm" ? "h-7 w-7" : "h-8 w-8"
                        )}
                      >
                        <Check className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
