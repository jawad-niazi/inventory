import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const TOUR_STEPS = [
  {
    step: 1,
    title: "Welcome to Inventory Management",
    text: "This tool helps you keep track of your products, your stock, and your sales, all in one place. This short tour will show you around in about 2 minutes, and help you add your first product. You can skip it any time.",
    route: "/dashboard",
    target: null,
    placement: "center",
  },
  {
    step: 2,
    title: "Your shop at a glance",
    text: "These cards show the important numbers for your shop. Total Products is how many products you have. Low stock tells you which products are running out. Quick Links take you to the pages you use most.",
    route: "/dashboard",
    target: '[data-tour="overview-cards"]',
    placement: "bottom",
  },
  {
    step: 3,
    title: "Low stock warnings",
    text: "When a product's stock gets low, it shows up here. Right now, 2 products are low on stock. Click 'View' on this card to see which ones they are.",
    route: "/dashboard",
    target: '[data-tour="low-stock-card"]',
    placement: "bottom",
  },
  {
    step: 4,
    title: "Your latest products",
    text: "This table shows your most recent products, with their stock, price, and status. For example, mouse has 26 in stock, and bag has 0, so bag is Low Stock. Click 'View All' to see all your products.",
    route: "/dashboard",
    target: '[data-tour="recent-products"]',
    placement: "bottom",
  },
  {
    step: 5,
    title: "Find your way around",
    text: "Use the menu on the left to move around. Products is where you add and edit products. Sales is where you make a sale. Inventory is where you check your stock.",
    route: "/dashboard",
    target: '[data-tour="sidebar"]',
    placement: "right",
  },
  {
    step: 6,
    title: "Search anything",
    text: "Type here to find a product, an order, or a supplier. For example, type 'mouse' to find the mouse product, or type an invoice number like 'INV-2E0B8500' to find that sale.",
    route: "/dashboard",
    target: '[data-tour="header-search"]',
    placement: "bottom",
  },
  {
    step: 7,
    title: "First, add a category",
    text: "Before you add a product, make a category for it. A category is a group, like 'luggage' or 'wood'. Type the category name here and click 'Add Category'. You can skip this if you want — the product form lets you pick 'None' — but making a category first is the normal way.",
    route: "/categories",
    target: '[data-tour="add-category-card"]',
    placement: "bottom",
  },
  {
    step: 8,
    title: "Now add your first product",
    text: "Go to Products and click '+ Add Product'. Fill in the Product Name — that is the only box you must fill in. Then add the Code, Model Name, Sale Price, and Low Stock Threshold if you want to, and pick the category you just made. There is no stock box here — your product starts with 0 stock, and you add stock in the next step.",
    route: "/products",
    target: '[data-tour="add-product-btn"]',
    placement: "bottom",
  },
  {
    step: 9,
    title: "Now add the stock",
    text: "Your new product starts with 0 stock, so it shows as Low Stock. To fix that, go to Inventory, open the 'Adjust Stock' tab, pick your product, enter how many you have — for example +50 — add a reason, and click 'Adjust Stock'. Then your product will show as In Stock. You can also add stock with a Purchase, but Adjust Stock is the quick way.",
    route: "/inventory",
    target: '[data-tour="adjust-stock-tab"]',
    placement: "bottom",
  },
  {
    step: 10,
    title: "You're ready",
    text: "That's the tour. You can now add a category, add a product, add its stock, make sales, and check your stock. If you ever want this tour again, click 'Take the tour' on the Dashboard.",
    route: "/inventory",
    target: null,
    placement: "center",
  },
];

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const getStorageKey = () => {
    const userKey = user?.email || user?.id || "default";
    return `inventory_tour_seen_${userKey}`;
  };

  const markTourSeen = () => {
    const key = getStorageKey();
    localStorage.setItem(key, "true");
    localStorage.setItem("inventory_tour_seen", "true");
  };

  const hasSeenTour = () => {
    const key = getStorageKey();
    return (
      localStorage.getItem(key) === "true" ||
      localStorage.getItem("inventory_tour_seen") === "true"
    );
  };

  const startTour = (stepIndex = 1) => {
    setCurrentStep(stepIndex);
    setIsTourOpen(true);
    const targetRoute = TOUR_STEPS[stepIndex - 1]?.route || "/dashboard";
    if (location.pathname !== targetRoute) {
      navigate(targetRoute);
    }
  };

  const closeTour = (markSeen = true) => {
    setIsTourOpen(false);
    if (markSeen || dontShowAgain) {
      markTourSeen();
    }
  };

  const nextStep = () => {
    if (currentStep >= TOUR_STEPS.length) {
      closeTour(true);
      return;
    }
    const nextIdx = currentStep + 1;
    const nextStepDef = TOUR_STEPS[nextIdx - 1];
    if (nextStepDef && location.pathname !== nextStepDef.route) {
      navigate(nextStepDef.route);
    }
    setCurrentStep(nextIdx);
  };

  const prevStep = () => {
    if (currentStep <= 1) return;
    const prevIdx = currentStep - 1;
    const prevStepDef = TOUR_STEPS[prevIdx - 1];
    if (prevStepDef && location.pathname !== prevStepDef.route) {
      navigate(prevStepDef.route);
    }
    setCurrentStep(prevIdx);
  };

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        currentStep,
        dontShowAgain,
        setDontShowAgain,
        startTour,
        closeTour,
        nextStep,
        prevStep,
        hasSeenTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}
