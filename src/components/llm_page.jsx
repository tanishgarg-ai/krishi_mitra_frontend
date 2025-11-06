import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Loader2, MessageSquare, Trash2 } from 'lucide-react';

export default function FarmingChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [language, setLanguage] = useState('English');
  const [threads, setThreads] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = 'http://localhost:8000/chat';

  // Load threads and current thread on mount
  useEffect(() => {
    loadThreads();
  }, []);

  // Load messages when thread changes
  useEffect(() => {
    if (threadId) {
      loadMessages(threadId);
    }
  }, [threadId]);

  const loadThreads = async () => {
    try {
      const result = await window.storage.list('thread:', false);
      if (result && result.keys) {
        const threadList = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key, false);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        const validThreads = threadList.filter(t => t !== null);
        setThreads(validThreads.sort((a, b) => b.lastUpdated - a.lastUpdated));
        
        // Load most recent thread if no thread selected
        if (!threadId && validThreads.length > 0) {
          setThreadId(validThreads[0].id);
        } else if (!threadId) {
          // Create first thread if none exist
          startNewChat();
        }
      } else {
        startNewChat();
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      startNewChat();
    }
  };

  const loadMessages = async (tid) => {
    try {
      const result = await window.storage.get(`messages:${tid}`, false);
      if (result) {
        setMessages(JSON.parse(result.value));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const saveMessages = async (tid, msgs) => {
    try {
      await window.storage.set(`messages:${tid}`, JSON.stringify(msgs), false);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const saveThread = async (tid, title, msgs) => {
    try {
      const threadData = {
        id: tid,
        title: title || 'New Chat',
        lastUpdated: Date.now(),
        messageCount: msgs.length
      };
      await window.storage.set(`thread:${tid}`, JSON.stringify(threadData), false);
      await loadThreads();
    } catch (error) {
      console.error('Error saving thread:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const userInput = input;
    setInput('');
    setLoading(true);

    // Save user message immediately
    await saveMessages(threadId, newMessages);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: userInput,
          language: language,
          thread_id: threadId
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response
        };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        
        // Save messages and update thread
        await saveMessages(threadId, updatedMessages);
        
        // Update thread title with first message
        const title = messages.length === 0
          ? userInput.slice(0, 50) + (userInput.length > 50 ? '...' : '')
          : threads.find(t => t.id === threadId)?.title || 'Chat';
        await saveThread(threadId, title, updatedMessages);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to get response'}`
        };
        const updatedMessages = [...newMessages, errorMessage];
        setMessages(updatedMessages);
        await saveMessages(threadId, updatedMessages);
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Connection error: ${error.message}. Make sure your backend is running.`
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      await saveMessages(threadId, updatedMessages);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    const newThreadId = `thread_${Date.now()}`;
    setThreadId(newThreadId);
    setMessages([]);
    inputRef.current?.focus();
  };

  const deleteThread = async (tid, e) => {
    e.stopPropagation();
    try {
      await window.storage.delete(`thread:${tid}`, false);
      await window.storage.delete(`messages:${tid}`, false);
      
      if (tid === threadId) {
        startNewChat();
      }
      await loadThreads();
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const selectThread = (tid) => {
    setThreadId(tid);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus size={18} />
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => selectThread(thread.id)}
                className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-colors ${
                  thread.id === threadId
                    ? 'bg-orange-50 text-orange-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {thread.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {thread.messageCount} messages
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteThread(thread.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MessageSquare size={20} />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold">
              F
            </div>
            <div>
              <h1 className="text-sm font-medium text-gray-900">Farming Assistant</h1>
              <p className="text-xs text-gray-500">Thread: {threadId?.slice(-8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Punjabi">Punjabi</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                F
              </div>
              <h2 className="text-2xl font-medium text-gray-900 mb-2">
                Welcome to Farming Assistant
              </h2>
              <p className="text-gray-600 max-w-md">
                Ask me anything about farming, crops, soil management, pest control, or agricultural best practices.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-6 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`}>
                      {msg.role === 'user' ? 'Y' : 'F'}
                    </div>
                    <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block text-left px-4 py-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mb-6">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      F
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-gray-100 px-4 py-2.5 rounded-2xl">
                        <Loader2 className="animate-spin text-gray-500" size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about farming, crops, or agriculture..."
                  disabled={loading}
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  style={{
                    minHeight: '52px',
                    maxHeight: '200px',
                    overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden'
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-12 h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}