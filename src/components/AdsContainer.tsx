"use client";

import { useEffect } from "react";

export default function AdBox2() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://comprehensiveimplementationstrode.com/2b58113fcb3b44d4d69b7b220984a81f/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.onload = () => console.log("AdBox2 script loaded successfully");
    script.onerror = (e) => console.error("AdBox2 script failed to load:", e);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="container-2b58113fcb3b44d4d69b7b220984a81f"></div>;
}
