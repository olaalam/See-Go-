// components/FullPageLoader.jsx

import { Loader2 } from "lucide-react"; // من ShadCN
import React from "react";

const FullPageLoader = () => {
  return (
    <div className="absolute inset-0 z-50 bg-white/5 backdrop-blur-sm flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-bg-primary" />
    </div>
  );
};


export default FullPageLoader;
