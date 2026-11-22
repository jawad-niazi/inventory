import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTour, TOUR_STEPS } from "../../context/TourContext";
import { X } from "lucide-react";

export default function GuidedTour() {
  const {
    isTourOpen,
    currentStep,
    dontShowAgain,
    setDontShowAgain,
    closeTour,
    nextStep,
    prevStep,
  } = useTour();

  const location = useLocation();
  const [targetRect, setTargetRect] = useState(null);

  const stepDef = TOUR_STEPS[currentStep - 1] || TOUR_STEPS[0];

  // Handle Escape key to skip/close
  useEffect(() => {
    if (!isTourOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeTour(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen, closeTour]);

  // Target element lookup & bounding rect calculation
  useEffect(() => {
    if (!isTourOpen) {
      setTargetRect(null);
      return;
    }

    if (!stepDef.target) {
      setTargetRect(null);
      return;
    }

    let isMounted = true;
    let attempts = 0;

    const locateTarget = () => {
      if (!isMounted) return;
      const el = document.querySelector(stepDef.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        // If element is partially offscreen, scroll it into view
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Capture position after scroll settles
        setTimeout(() => {
          if (!isMounted) return;
          const freshEl = document.querySelector(stepDef.target);
          if (freshEl) {
            setTargetRect(freshEl.getBoundingClientRect());
          }
        }, 120);
      } else {
        attempts++;
        if (attempts < 25) {
          setTimeout(locateTarget, 100);
        } else {
          // Gracefully fallback to center if element is missing on current page
          console.warn(`[Tour] Element ${stepDef.target} not found; falling back to center.`);
          setTargetRect(null);
        }
      }
    };

    locateTarget();

    const handleReposition = () => {
      if (!stepDef.target) return;
      const el = document.querySelector(stepDef.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isTourOpen, currentStep, location.pathname, stepDef.target]);

  if (!isTourOpen) return null;

  // Compute tooltip position
  const getTooltipStyle = () => {
    const width = Math.min(420, window.innerWidth - 32);
    const estimatedHeight = 230;
    const padding = 16;

    if (!targetRect || stepDef.placement === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${width}px`,
        zIndex: 10000,
      };
    }

    // Right-side placement (e.g. sidebar)
    if (stepDef.placement === "right") {
      let top = Math.max(padding, Math.min(window.innerHeight - estimatedHeight - padding, targetRect.top + 50));
      let left = targetRect.right + padding;
      if (left + width + padding > window.innerWidth) {
        left = window.innerWidth - width - padding;
      }
      return {
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 10000,
      };
    }

    // Default: Below target
    let top = targetRect.bottom + padding;
    // Flip above target if overflowing bottom and space above exists
    if (top + estimatedHeight > window.innerHeight && targetRect.top > estimatedHeight + padding) {
      top = Math.max(padding, targetRect.top - estimatedHeight - padding);
    }

    let left = targetRect.left + targetRect.width / 2 - width / 2;
    left = Math.max(padding, Math.min(window.innerWidth - width - padding, left));

    return {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      zIndex: 10000,
    };
  };

  const isLastStep = stepDef.step === 10;

  return (
    <div className="tour-overlay-portal">
      {/* 1. Backdrop overlay with SVG spotlight cutout */}
      <svg
        className="fixed inset-0 pointer-events-auto z-[9998] w-full h-full transition-opacity duration-300"
        onClick={() => closeTour(true)}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="24"
                ry="24"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.5)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 2. Neon highlight ring around target element */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-[9999] rounded-3xl ring-4 ring-brand-neon shadow-[0_0_35px_rgba(206,243,109,0.55)] transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* 3. Tooltip Card */}
      <div
        className="rounded-4xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-slate-100 pointer-events-auto transition-all duration-200"
        style={getTooltipStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar: Step badge + Close button */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Step {stepDef.step} of 10
          </span>
          <button
            type="button"
            onClick={() => closeTour(true)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
            title="Close tour"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {stepDef.title}
        </h3>

        {/* Text */}
        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
          {stepDef.text}
        </p>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Left: Skip tour + Don't show again on step 1 */}
          <div className="flex items-center gap-4">
            {!isLastStep && (
              <button
                type="button"
                onClick={() => closeTour(true)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Skip tour
              </button>
            )}
            {stepDef.step === 1 && (
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-semibold text-slate-500 hover:text-slate-700">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-brand-neon focus:ring-brand-neon"
                />
                Don't show again
              </label>
            )}
          </div>

          {/* Right: Back & Next / Finish */}
          <div className="flex items-center gap-2">
            {stepDef.step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="rounded-full bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={nextStep}
              className="rounded-full bg-brand-neon hover:bg-brand-neon/90 px-5 py-2 text-xs font-bold text-slate-900 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(206,243,109,0.4)] transition-all duration-200"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
