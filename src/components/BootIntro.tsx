"use client";

import { useEffect, useState } from "react";

/** ~1.7s boot intro: droplet rises, logo blooms, rings expand, overlay fades. */
export default function BootIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Skip entirely for reduced-motion users.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1850);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="bs-boot" aria-hidden>
      <div className="bs-boot-droplet" />
      <div className="bs-boot-ring" />
      <div className="bs-boot-ring r2" />
      <div className="bs-boot-logo">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 16V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1a2 2 0 0 1-1 1.73l-6 3.54A2 2 0 0 1 9 15.99V16" />
          <path d="M7 16h10" />
          <path d="M7 20h10" opacity="0.55" />
        </svg>
      </div>
    </div>
  );
}
