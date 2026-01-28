import { useEffect, useState } from "react"
import { BsTwitterX } from "react-icons/bs"
import { SiRender, SiGithub , } from "react-icons/si"
import { X, Globe, Loader2 } from "lucide-react"

interface CreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface GitHubProfile {
  avatar_url: string
  name: string
  bio: string
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [profile, setProfile] = useState<GitHubProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch("https://api.github.com/users/Matrixxboy")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md p-[1px]
        bg-gradient-to-br from-[#a8a29e] to-[#44403c]
        rounded-xl shadow-[0_0_40px_rgba(214,211,209,0.25)]
        animate-scaleIn"
      >
        <div className="bg-[#1c1917] rounded-xl p-8 relative overflow-hidden">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#78716c] hover:text-[#e7e5e4] transition"
          >
            <X size={22} />
          </button>

          {/* Glow */}
          <div className="absolute inset-x-0 top-0 mx-auto w-40 h-40 bg-[#d6d3d1]/10 blur-3xl -z-10" />

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div
              className="w-24 h-24 rounded-full p-[2px]
              bg-gradient-to-br from-[#e7e5e4] to-[#57534e]
              shadow-[0_0_30px_rgba(214,211,209,0.4)]"
            >
              <div
                className="w-full h-full rounded-full bg-[#292524]
                flex items-center justify-center overflow-hidden"
              >
                {loading ? (
                  <Loader2 className="animate-spin text-[#a8a29e]" />
                ) : (
                  <img
                    src={profile?.avatar_url}
                    alt="GitHub Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#fafaf9] to-[#a8a29e] bg-clip-text text-transparent">
              {profile?.name || "Matrixxboy"}
            </h2>

            <p className="text-xs tracking-widest uppercase text-[#a8a29e]">
              Lead Developer & Creator
            </p>

            <p className="text-sm text-[#78716c] px-4 leading-relaxed">
              {profile?.bio ||
                "Building advanced AI systems with privacy-first and dark aesthetic design."}
            </p>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-6 mt-8">
            <a
              href="https://github.com/Matrixxboy"
              target="_blank"
              className="text-[#78716c] hover:text-white hover:scale-110 transition"
            >
              <SiGithub size={22} />
            </a>

            <a
              href="https://x.com/mmatrixxboy"
              className="text-[#78716c] hover:text-black hover:scale-110 transition"
            >
              <BsTwitterX size={22} />
            </a>

            <a
              href="https://utsav-lankapati.onrender.com"
              className="text-[#78716c] hover:text-blue-500 hover:scale-110 transition"
            >
              <Globe size={22} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
