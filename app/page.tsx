import { OrnamentScanner } from "./ornament-scanner";

import "./debug.css";

export default function Home() {
  return (
    <div className="debug-page flex min-h-full flex-1 flex-col">
      <OrnamentScanner />
    </div>
  );
}
