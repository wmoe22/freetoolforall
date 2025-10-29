/* import { useEffect, useRef } from "react";
export default function Banner() {
  const bannerRef = useRef(null);
  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.firstChild) {
      const atOptions = {
        key: "5f5974a83798aa28cd290cbee513c6e2",
        format: "iframe",
        height: 90,
        width: 728,
        params: {},
      };
      const confScript = document.createElement("script");
      const adScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.innerHTML = `atOptions = ${JSON.stringify(atOptions)}`;
      adScript.type = "text/javascript";
      adScript.src = `//comprehensiveimplementationstrode.com/${atOptions.key}/invoke.js`;
      bannerRef.current.appendChild(confScript);
      bannerRef.current.appendChild(adScript);
    }
  }, []);
  return <div ref={bannerRef} className="ad-banner"></div>;
}
 */