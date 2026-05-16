import { DebugPortal } from "./debug-portal";

import "./debug.css";

export default function Home() {
 

  return (
    <div className="debug-page flex min-h-full flex-1 flex-col">
      <DebugPortal />
    </div>
  );
}
