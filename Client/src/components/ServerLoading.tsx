import React from "react"

export default function ServerLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500">
      <div className="flex flex-col items-center p-8 rounded-2xl bg-[#1c1917] border border-[#292524] shadow-2xl max-w-sm w-full mx-4 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-[#292524] border-t-[#d6d3d1] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl animate-pulse">⚡</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-[#e7e5e4] mb-2 tracking-wide">
          Waking Up Server
        </h2>

        <p className="text-[#a8a29e] text-sm leading-relaxed">
          The server is currently starting up from a dormant state. This may
          take up to{" "}
          <span className="text-[#d6d3d1] font-medium">60 seconds</span>.
        </p>

        <div className="mt-6 w-full bg-[#292524] h-1 rounded-full overflow-hidden">
          <div className="h-full bg-[#d6d3d1]/50 animate-progress origin-left"></div>
        </div>
      </div>
    </div>
  )
}
