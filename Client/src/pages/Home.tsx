import { ArrowRight, Shield, Cpu, Search, Lock } from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#e7e5e4] flex flex-col font-sans selection:bg-[#a8a29e] selection:text-[#0c0a09]">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#292524]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#44403c]/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center relative z-10 w-[90%] mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br rounded-full from-[#d6d3d1] to-[#57534e] flex items-center justify-center shadow-lg">
            <img src="logo.png" alt="" className="text-2xl rounded-full" />
          </div>
          <span className="md:text-2xl lg:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e7e5e4] to-[#a8a29e]">
            Unified Causal AI
          </span>
        </div>
        {/* <div className="hidden lg:flex gap-8 text-sm font-medium text-[#a8a29e]">
          <a href="#" className="hover:text-[#e7e5e4] transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-[#e7e5e4] transition-colors">
            Safety
          </a>
          <a href="#" className="hover:text-[#e7e5e4] transition-colors">
            Models
          </a>
        </div> */}
        <Link
          to="/chat"
          className="px-5 py-2 rounded-full border border-[#292524] hover:bg-[#1c1917] transition-all text-sm font-semibold tracking-wide"
        >
          Launch App
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 text-center mx-auto mt-10 md:mt-20">
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1917] border border-[#292524] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-[#a8a29e] uppercase tracking-wider">
            Local Inference Ready
          </span>
        </div> */}
        <img
          src="logo.png"
          alt=""
          className="w-32 h-32 rounded-full shadow-[0_8px_30px_rgba(255,255,255,0.30),0_-8px_30px_rgba(255,255,255,0.30),8px_0_30px_rgba(255,255,255,0.30),-8px_0_30px_rgba(255,255,255,0.30)]"
        />
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 mt-4 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Private AI, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#d6d3d1] via-[#a8a29e] to-[#57534e]">
            Running Locally.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#78716c] max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          Experience the power of large language models without sending your
          data to the cloud. Fast, secure, and completely open-source.
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Link
            to="/chat"
            className="group relative px-8 py-4 bg-[#e7e5e4] text-[#0c0a09] rounded-xl font-bold text-lg shadow-xl shadow-[#e7e5e4]/10 hover:shadow-[#e7e5e4]/20 hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Chatting{" "}
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#d6d3d1] to-[#e7e5e4] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <a
            href="https://github.com/Matrixxboy"
            target="_blank"
            className="px-8 py-4 bg-[#1c1917] border border-[#292524] text-[#e7e5e4] rounded-xl font-bold text-lg hover:bg-[#292524] transition-all duration-300 flex items-center justify-center gap-2"
          >
            View on GitHub
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid max-w-7xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 w-full text-left animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
          <div className="p-6 rounded-2xl bg-[#1c1917]/50 border border-[#292524] backdrop-blur-sm hover:border-[#44403c] transition-colors">
            <div className="w-12 h-12 bg-[#292524] rounded-lg flex items-center justify-center mb-4 text-[#d6d3d1]">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#d6d3d1]">
              Local & Secure
            </h3>
            <p className="text-[#78716c] leading-relaxed">
              Your chat history and data are stored 100% locally on your
              machine. Nothing is ever sent to our servers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1c1917]/50 border border-[#292524] backdrop-blur-sm hover:border-[#44403c] transition-colors">
            <div className="w-12 h-12 bg-[#292524] rounded-lg flex items-center justify-center mb-4 text-[#d6d3d1]">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#d6d3d1]">
              Zero Data Leaks
            </h3>
            <p className="text-[#78716c] leading-relaxed">
              We don't track you. No telemetry, no logs, and no hidden data
              collection. Your privacy is our priority.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1c1917]/50 border border-[#292524] backdrop-blur-sm hover:border-[#44403c] transition-colors">
            <div className="w-12 h-12 bg-[#292524] rounded-lg flex items-center justify-center mb-4 text-[#d6d3d1]">
              <Search size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#d6d3d1]">
              Private Web Search
            </h3>
            <p className="text-[#78716c] leading-relaxed">
              Integrated with DuckDuckGo for anonymous web searches. Access the
              internet without being tracked.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#1c1917]/50 border border-[#292524] backdrop-blur-sm hover:border-[#44403c] transition-colors">
            <div className="w-12 h-12 bg-[#292524] rounded-lg flex items-center justify-center mb-4 text-[#d6d3d1]">
              <Cpu size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#d6d3d1]">
              Model Freedom
            </h3>
            <p className="text-[#78716c] leading-relaxed">
              Download and run any GGUF model from Hugging Face. Switch between
              models instantly.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-[#292524] w-full text-center text-[#57534e] text-sm">
          <p>
            &copy; 2024 UCAI. Built by{" "}
            <span className="text-[#a8a29e] font-medium">
              <a href="https://github.com/Matrixxboy" target="_blank">
                Matrixxboy
              </a>
            </span>
            .
          </p>
        </footer>
      </main>
    </div>
  )
}
