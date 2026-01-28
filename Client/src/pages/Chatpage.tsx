import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  MessageSquare,
  Plus,
  Trash2,
  Menu,
  X,
  Pin,
  PinOff,
  Edit2,
  Check,
} from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatSession {
  id: string
  name: string
  messages: Message[]
  timestamp: number
  pinned?: boolean
}

export default function Chatpage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Helper to sort sessions: Pinned first, then Newest first
  const sortSessions = (sess: ChatSession[]) => {
    return [...sess].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.timestamp - a.timestamp
    })
  }

  // Load sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem("ucai_sessions")
    if (saved) {
      try {
        let parsed = JSON.parse(saved)
        // Ensure legacy sessions (without pinned) work
        parsed = sortSessions(parsed)
        setSessions(parsed)
        // Always start fresh instead of loading previous
        createNewSession()
      } catch (e) {
        console.error("Failed to parse sessions", e)
        createNewSession()
      }
    } else {
      createNewSession()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("ucai_sessions", JSON.stringify(sessions))
    }
  }, [sessions])

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: "New Chat",
      messages: [],
      timestamp: Date.now(),
      pinned: false,
    }
    setSessions((prev) => {
      // We put the new session into the list, then sort (it will be below pinned items)
      return sortSessions([newSession, ...prev])
    })
    setCurrentSessionId(newSession.id)
    setMessages([])
    if (window.innerWidth < 768) setIsSidebarOpen(false)
  }

  const loadSession = (id: string) => {
    // If clicking the current session, do nothing? Or maybe reload.
    // If editing, cancel edit.
    setEditingSessionId(null)

    const session = sessions.find((s) => s.id === id)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      if (window.innerWidth < 768) setIsSidebarOpen(false)
    }
  }

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const newSessions = sessions.filter((s) => s.id !== id)
    setSessions(newSessions)
    localStorage.setItem("ucai_sessions", JSON.stringify(newSessions))

    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        // Load first available (which will be first pinned or newest)
        // But maybe safer to create new? The user just deleted the active one.
        // Let's create new for clarity.
        createNewSession()
      } else {
        createNewSession()
      }
    }
  }

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, pinned: !s.pinned } : s,
      )
      return sortSessions(updated)
    })
  }

  const startRenaming = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditName(session.name)
  }

  const saveRename = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (editName.trim()) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, name: editName } : s)),
      )
    }
    setEditingSessionId(null)
  }

  const updateSessionMessages = (newMessages: Message[]) => {
    if (!currentSessionId) return

    setSessions((prev) => {
      let updated = prev.map((s) => {
        if (s.id === currentSessionId) {
          // Generate a name if it's the first user message & name is still default
          let name = s.name
          if (
            s.messages.length === 0 &&
            newMessages.length > 0 &&
            s.name === "New Chat"
          ) {
            const firstMsg = newMessages[0].content
            name = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? "..." : "")
          }
          return { ...s, messages: newMessages, name, timestamp: Date.now() } // Update timestamp
        }
        return s
      })
      return sortSessions(updated)
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: "user", content: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    updateSessionMessages(updatedMessages)

    setInput("")
    setLoading(true)

    // Add placeholder for assistant
    const placeholderMsgs = [
      ...updatedMessages,
      { role: "assistant", content: "" } as Message,
    ]
    setMessages(placeholderMsgs)

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages, // rudimentary history
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMsg += chunk

        // Update the UI
        setMessages((prev) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = {
            role: "assistant",
            content: assistantMsg,
          }
          return newMsgs
        })
      }
      // Update session storage after complete response
      updateSessionMessages([
        ...updatedMessages,
        { role: "assistant", content: assistantMsg },
      ])
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: "assistant",
          content:
            "Error: Failed to connect to local model. Please ensure the server is running and a model is loaded in Settings.",
        }
        return newMsgs
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#1c1917] text-[#e7e5e4] overflow-hidden">
      {/* Sidebar - Mobile Toggle overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#0c0a09] border-r border-[#292524] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b border-[#292524] flex items-center justify-between">
          <h2 className="font-semibold tracking-wide text-[#d6d3d1]">
            History
          </h2>
          <button
            onClick={createNewSession}
            className="p-2 hover:bg-[#292524] rounded-sm transition-colors text-[#a8a29e] hover:text-[#e7e5e4]"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-65px)]">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={`p-3 border-b border-[#292524]/50 cursor-pointer hover:bg-[#1c1917] transition-colors group relative ${currentSessionId === session.id ? "bg-[#1c1917] border-l-2 border-l-[#d6d3d1]" : "border-l-2 border-l-transparent"}`}
            >
              <div className="flex justify-between items-start gap-2">
                {/* Session Name Area */}
                <div className="flex-1 min-w-0">
                  {editingSessionId === session.id ? (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full bg-[#292524] text-[#e7e5e4] text-sm px-1 py-0.5 rounded focus:outline-none border border-[#44403c]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            saveRename(e as any, session.id)
                        }}
                      />
                      <button
                        onClick={(e) => saveRename(e, session.id)}
                        className="text-green-400 p-0.5 hover:bg-[#292524] rounded"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p
                        className={`text-sm font-medium truncate ${session.pinned ? "text-purple-300" : "text-[#d6d3d1]"}`}
                      >
                        {session.pinned && (
                          <Pin
                            size={10}
                            className="inline mr-1 -mt-0.5"
                            fill="currentColor"
                          />
                        )}
                        {session.name}
                      </p>
                      <p className="text-xs text-[#78716c] mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions (Hover) */}
                {editingSessionId !== session.id && (
                  <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button
                      onClick={(e) => togglePin(e, session.id)}
                      className={`p-1.5 rounded hover:bg-[#292524] ${session.pinned ? "text-purple-400 opacity-100" : "text-[#78716c] hover:text-[#d6d3d1]"}`}
                      title={session.pinned ? "Unpin" : "Pin"}
                    >
                      {session.pinned ? (
                        <PinOff size={14} />
                      ) : (
                        <Pin size={14} />
                      )}
                    </button>
                    <button
                      onClick={(e) => startRenaming(e, session)}
                      className="p-1.5 text-[#78716c] hover:text-[#d6d3d1] hover:bg-[#292524] rounded"
                      title="Rename"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1.5 text-[#78716c] hover:text-red-400 hover:bg-[#292524] rounded"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="p-8 text-center text-[#57534e] text-sm italic">
              No chat history.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-4 border-b border-[#292524] bg-[#1c1917]/95 backdrop-blur-sm flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-[#78716c]"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-medium text-[#d6d3d1] tracking-wide">
              UCAI <span className="text-[#a8a29e]">Local Chat</span>
            </h1>
          </div>
          <a
            href="/settings"
            className="text-sm text-[#78716c] hover:text-[#d6d3d1] transition-colors uppercase tracking-wider text-xs font-semibold"
          >
            Settings
          </a>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[#57534e] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#292524] flex items-center justify-center text-3xl opacity-80">
                ☕
              </div>
              <p className="text-lg font-light tracking-wide">
                Ready to chat with your local model.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-5 rounded-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#44403c] text-[#f5f5f4]" // Stone 700
                    : "bg-[#292524] text-[#d6d3d1] border border-[#292524]" // Stone 800
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-light">
                    {msg.content}
                  </p>
                ) : (
                  <div className="prose prose-invert prose-stone max-w-none text-sm md:text-base font-light leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-[#1c1917] border-t border-[#292524]">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type a message..."
              disabled={loading}
              rows={1}
              className="w-full bg-[#0c0a09] border border-[#292524] text-[#e7e5e4] rounded-sm py-4 pl-6 pr-14 focus:outline-none focus:border-[#57534e] transition-colors placeholder-[#44403c] font-light resize-none overflow-hidden"
              style={{ minHeight: "60px" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-3 p-2 text-[#78716c] hover:text-[#d6d3d1] disabled:opacity-30 disabled:hover:text-[#78716c] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
