"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentPreference = {
  adStorage: "granted" | "denied";
  analyticsStorage: "granted" | "denied";
  updatedAt: number;
};

interface ConsentContextValue {
  consent: ConsentPreference | null;
  bannerVisible: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateConsent: (preference: ConsentPreference) => void;
  openManager: () => void;
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

const STORAGE_KEY = "scl-consent-v1";

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentPreference | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const saved = loadStoredConsent();
    if (saved) {
      setConsent(saved);
      applyConsent(saved);
    } else if (isEeaRegion()) {
      setBannerVisible(true);
      applyConsent({ adStorage: "denied", analyticsStorage: "denied", updatedAt: Date.now() });
    } else {
      const defaults: ConsentPreference = {
        adStorage: "granted",
        analyticsStorage: "granted",
        updatedAt: Date.now(),
      };
      setConsent(defaults);
      applyConsent(defaults);
    }
    setBootstrapped(true);
  }, []);

  const value = useMemo<ConsentContextValue>(() => ({
    consent,
    bannerVisible: bannerVisible && bootstrapped,
    acceptAll: () => {
      const preference: ConsentPreference = {
        adStorage: "granted",
        analyticsStorage: "granted",
        updatedAt: Date.now(),
      };
      setConsent(preference);
      setBannerVisible(false);
      storeConsent(preference);
      applyConsent(preference);
    },
    rejectAll: () => {
      const preference: ConsentPreference = {
        adStorage: "denied",
        analyticsStorage: "denied",
        updatedAt: Date.now(),
      };
      setConsent(preference);
      setBannerVisible(false);
      storeConsent(preference);
      applyConsent(preference);
    },
    updateConsent: (preference) => {
      setConsent(preference);
      setBannerVisible(false);
      storeConsent(preference);
      applyConsent(preference);
    },
    openManager: () => setBannerVisible(true),
  }), [consent, bannerVisible, bootstrapped]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}

function loadStoredConsent(): ConsentPreference | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "adStorage" in parsed && "analyticsStorage" in parsed) {
      return parsed as ConsentPreference;
    }
  } catch (error) {
    console.warn("Failed to parse stored consent", error);
  }
  return null;
}

function storeConsent(preference: ConsentPreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
}

function applyConsent(preference: ConsentPreference) {
  if (typeof window === "undefined") return;
  const update = {
    ad_storage: preference.adStorage,
    analytics_storage: preference.analyticsStorage,
    functionality_storage: "granted",
    personalization_storage: "denied",
    security_storage: "granted",
  } as const;

  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", update);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "consent.update", ...update });
  }
}

function isEeaRegion(): boolean {
  if (typeof navigator === "undefined") return true;
  const locale = navigator.language?.toLowerCase() ?? "";
  const eeaPrefixes = [
    "en-gb",
    "en-ie",
    "fr",
    "de",
    "es",
    "it",
    "nl",
    "sv",
    "no",
    "da",
    "fi",
    "pl",
    "pt",
    "cs",
    "sk",
    "sl",
    "hr",
    "hu",
    "el",
    "bg",
    "ro",
    "lt",
    "lv",
    "et",
  ];
  return eeaPrefixes.some((prefix) => locale.startsWith(prefix));
}