import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
  options: optionsProp,
  children,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
  name,
  required,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");

  // Extract options from options prop OR <option> children
  const parsedOptions = React.useMemo(() => {
    if (optionsProp && Array.isArray(optionsProp)) {
      return optionsProp.map((opt) =>
        typeof opt === "object"
          ? {
              value: String(opt.value ?? opt.id ?? ""),
              label: String(opt.label ?? opt.name ?? opt.value ?? ""),
            }
          : { value: String(opt), label: String(opt) }
      );
    }

    const opts = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === "option") {
        opts.push({
          value: String(child.props.value ?? ""),
          label: child.props.children
            ? React.Children.toArray(child.props.children).join("")
            : String(child.props.value ?? ""),
        });
      }
    });
    return opts;
  }, [optionsProp, children]);

  // Find currently selected option
  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Determine flip positioning on open
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > 220) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      const event = {
        target: { value: opt.value, name: name || "" },
        currentTarget: { value: opt.value, name: name || "" },
      };
      onChange(event);
    }
  };

  // Determine label to show on trigger button
  const displayText = selectedOption
    ? selectedOption.label
    : parsedOptions.find((o) => o.value === "")?.label || placeholder;

  const isPlaceholder = !selectedOption || selectedOption.value === "";

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden native input for form submissions */}
      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required}
        id={id}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 text-left transition-all cursor-pointer ${
          className ||
          "rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-neon hover:bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`truncate block ${
            isPlaceholder
              ? "text-slate-400 font-normal"
              : "text-slate-900 font-medium"
          }`}
        >
          {displayText}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 rounded-2xl bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-slate-100 animate-in fade-in zoom-in-95 duration-100 min-w-[200px] ${
            dropdownPosition === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          role="listbox"
        >
          <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-hide py-0.5">
            {parsedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-brand-neon/20 font-bold text-slate-900"
                      : "text-slate-700 font-medium hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
