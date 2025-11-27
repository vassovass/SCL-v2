"use client";

import { useEffect } from "react";

import { useConsent } from "@/components/providers/ConsentProvider";

export function AdBanner() {
  const { consent } = useConsent();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
      return;
    }

    if (consent?.adStorage !== "granted") {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    script.async = true;
    script.setAttribute("data-ad-client", process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [consent]);

  if (consent?.adStorage !== "granted") {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-500">
        Ads will appear here after consent is granted.
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle block w-full"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}