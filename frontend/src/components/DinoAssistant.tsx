// DinoAssistant.tsx — Floating AI chat widget (DinoBot)
// Notes & integration:
// - Uses `/api/ai/chat` on the backend to send messages
// - In development this file points to `http://localhost:5000`; update to `import.meta.env.VITE_API_URL` in production
// - Available to any logged-in user; unauthenticated users are prompted to log in
import { useState, useRef, useEffect } from "react";
import { X, Send, User, Loader2, Minimize2, RefreshCw } from "lucide-react";
import { DinoBotIcon } from "./DinoIcons";
import { useAuth } from "../lib/auth";
import { Link } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DinoAssistant() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Hello! I'm DinoBot, your prehistoric guide! Ask me anything about dinosaurs - their diets, sizes, time periods, or specific species!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    // Check if user is logged in
    if (!user || !token) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: input.trim() },
        { role: "assistant", content: "🔒 Please log in to use DinoBot! Create a free account to chat with me about dinosaurs." },
      ]);
      setInput("");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setModelLoading(false);

    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();
      
      // Handle model loading (503)
      if (response.status === 503 && data.estimatedTime) {
        setModelLoading(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `🦕 ${data.message} (about ${Math.ceil(data.estimatedTime)}s)` },
        ]);
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `🔒 ${data.message || "Please log in again to use DinoBot."}` },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || "Sorry, I couldn't process that. Try again!" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🦕 Oops! I'm having trouble connecting. Please try again in a moment!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
      setTimeout(() => sendMessage(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
        title="Ask DinoBot"
      >
        <DinoBotIcon size={24} />
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
      </button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full shadow-lg cursor-pointer hover:bg-gray-700 transition"
      >
        <DinoBotIcon size={20} className="text-green-400" />
        <span className="text-sm text-white">DinoBot</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="ml-2 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="flex items-center gap-2">
          <DinoBotIcon size={24} className="text-white" />
          <div>
            <h3 className="font-semibold text-white">DinoBot</h3>
            <p className="text-xs text-green-100">Your free Dino Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 min-h-[200px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <DinoBotIcon size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-br-md"
                  : "bg-gray-700 text-gray-100 rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <DinoBotIcon size={16} className="text-white" />
            </div>
            <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Model loading retry button */}
      {modelLoading && (
        <div className="px-4 pb-2">
          <button
            onClick={retryLastMessage}
            className="w-full flex items-center justify-center gap-2 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Login prompt for non-logged-in users */}
      {!user && (
        <div className="px-4 pb-2">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
          >
            Log in to use DinoBot
          </Link>
        </div>
      )}

      {/* Quick suggestions for logged-in users */}
      {user && messages.length <= 2 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {["What's the biggest dinosaur?", "Tell me about T-Rex", "When did dinosaurs go extinct?"].map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                setTimeout(() => sendMessage(), 100);
              }}
              className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about dinosaurs..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
