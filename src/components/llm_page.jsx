import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare, Leaf, Menu, X } from 'lucide-react';

const KrishiMitra = () => {
  const [language, setLanguage] = useState('English');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const API_BASE_URL = 'http://localhost:8000';

  const TEXT = {
    welcome_message: {
      English: "Namaste! I'm your farming assistant. Ask me about crops, schemes, weather, or any agricultural advice.",
      Hindi: "नमस्ते! मैं आपका कृषि सहायक हूँ। मुझसे फसलों, योजनाओं, मौसम या कृषि सलाह के बारे में पूछें।"
    },
    chat_placeholder: {
      English: "Ask about crops, schemes, weather...",
      Hindi: "फसलों, योजनाओं, मौसम के बारे में पूछें..."
    },
    thinking: {
      English: "Thinking...",
      Hindi: "सोच रहा हूँ..."
    },
    error: {
      English: "Sorry, I couldn't process your request. Please try again.",
      Hindi: "क्षमा करें, मैं आपका अनुरोध संसाधित नहीं कर सका। कृपया पुनः प्रयास करें।"
    },
    sidebar_title: {
      English: "KrishiMitra Assistant",
      Hindi: "कृषिमित्र सहायक"
    },
    capabilities: {
      English: "What I can help with:",
      Hindi: "मैं किसमें मदद कर सकता हूँ:"
    },
    features: {
      English: [
        "🌾 Crop planning & advice",
        "🏛️ Government schemes",
        "🌤️ Weather forecasts",
        "💰 Market prices",
        "🔬 Disease diagnosis",
        "💧 Water management"
      ],
      Hindi: [
        "🌾 फसल योजना और सलाह",
        "🏛️ सरकारी योजनाएं",
        "🌤️ मौसम का पूर्वानुमान",
        "💰 बाजार मूल्य",
        "🔬 रोग निदान",
        "💧 जल प्रबंधन"
      ]
    },
    quick_questions: {
      English: "Quick Questions:",
      Hindi: "त्वरित प्रश्न:"
    },
    suggestions: {
      English: [
        "What crops are best for this season?",
        "Tell me about PM-KISAN scheme",
        "What's today's weather forecast?",
        "Current market prices for wheat"
      ],
      Hindi: [
        "इस मौसम के लिए कौन सी फसलें सबसे अच्छी हैं?",
        "मुझे पीएम-किसान योजना के बारे में बताएं",
        "आज का मौसम पूर्वानुमान क्या है?",
        "गेहूं के वर्तमान बाजार मूल्य"
      ]
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: TEXT.welcome_message[language],
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: text,
          language: language,
          thread_id: threadId
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: TEXT.error[language],
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white/90 backdrop-blur-sm shadow-2xl overflow-hidden`}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Leaf className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {TEXT.sidebar_title[language]}
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Farming Aid</p>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="mb-6">
            <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setLanguage('English')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  language === 'English'
                    ? 'bg-white text-green-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('Hindi')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  language === 'Hindi'
                    ? 'bg-white text-green-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Capabilities */}
          <div className="mb-6 flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              {TEXT.capabilities[language]}
            </h3>
            <div className="space-y-2">
              {TEXT.features[language].map((feature, idx) => (
                <div key={idx} className="text-sm text-gray-600 py-2 px-3 bg-gray-50 rounded-lg">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Session Info */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p className="mb-1">Session: Active</p>
              <p className="font-mono truncate">{threadId.slice(0, 20)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-2">
                <MessageSquare className="text-green-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Chat Assistant</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Quick Suggestions (shown initially) */}
            {messages.length <= 1 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-600 mb-4 text-center">
                  {TEXT.quick_questions[language]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TEXT.suggestions[language].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-green-500 group"
                    >
                      <p className="text-sm text-gray-700 group-hover:text-green-700 font-medium">
                        {suggestion}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl rounded-br-sm'
                    : msg.isError
                      ? 'bg-red-50 border-2 border-red-200 text-red-800 rounded-3xl rounded-bl-sm'
                      : 'bg-white shadow-md rounded-3xl rounded-bl-sm border border-gray-100'
                } px-6 py-4`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Leaf className="text-white" size={16} />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">KrishiMitra</span>
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                    {msg.content}
                  </div>
                  <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white shadow-md rounded-3xl rounded-bl-sm border border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-green-600" size={20} />
                    <span className="text-gray-600">{TEXT.thinking[language]}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-gray-200 focus-within:border-green-500 transition-all">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={TEXT.chat_placeholder[language]}
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-6 py-4 bg-transparent resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                  style={{ minHeight: '56px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Send size={24} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default KrishiMitra;