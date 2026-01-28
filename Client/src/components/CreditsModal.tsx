import { X, Github, Globe, Twitter, Heart } from "lucide-react"

interface CreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-md p-1 bg-gradient-to-br from-[#d6d3d1] to-[#44403c] rounded-lg shadow-2xl transform transition-transform duration-300 scale-100">
        <div className="bg-[#1c1917] rounded-lg p-8 relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#78716c] hover:text-[#d6d3d1] transition-colors"
          >
            <X size={24} />
          </button>

          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#d6d3d1]/10 rounded-full blur-3xl -z-10"></div>

          {/* Avatar / Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#a8a29e] to-[#57534e] p-[2px] shadow-lg">
              <div className="w-full h-full rounded-full bg-[#292524] flex items-center justify-center">
                <span className="text-[#d6d3d1]">
                  <Globe size={48} />
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#e7e5e4] to-[#a8a29e]">
              Matrixxboy
            </h2>
            <p className="text-[#a8a29e] text-sm font-medium tracking-wider uppercase">
              Lead Developer & Creator
            </p>
            <p className="text-[#78716c] text-sm leading-relaxed px-4">
              Building advanced AI experiences with a focus on local privacy and
              aesthetic design.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mt-8">
            <a
              href="https://github.com/Matrixxboy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78716c] hover:text-[#d6d3d1] hover:scale-110 transition-all duration-300"
              title="GitHub"
            >
              <Github size={24} />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78716c] hover:text-[#38bdf8] hover:scale-110 transition-all duration-300"
              title="Twitter / X"
            >
              <Twitter size={24} />
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#78716c] hover:text-[#22c55e] hover:scale-110 transition-all duration-300"
              title="Website"
            >
              <Globe size={24} />
            </a>
          </div>

          {/* Footer */}
          {/* <div className="mt-8 pt-6 border-t border-[#292524] text-center">
            <p className="text-[#57534e] text-xs flex items-center justify-center gap-1">
              Made with{" "}
              <Heart
                size={10}
                className="text-red-500 fill-red-500 animate-pulse"
              />{" "}
              by Matrixxboy
            </p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
