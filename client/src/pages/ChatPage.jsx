import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, Zap } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './ChatPage.css';

const QUICK_PROMPTS = [
  { text: 'How much did I spend on food this month?', icon: '🍔' },
  { text: 'Compare my spending this month vs last month', icon: '📊' },
  { text: 'Can I afford a ₹15,000 purchase right now?', icon: '🤔' },
  { text: 'What are my top 3 spending categories?', icon: '📋' },
  { text: 'Create a budget plan for next month', icon: '📝' },
  { text: 'How much have I saved this year?', icon: '💰' },
];

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1); // all except current message
      const { data } = await api.post('/api/chat', {
        message: messageText,
        history,
      });

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to get response';
      toast.error(msg);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I couldn\'t process that. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    // Basic formatting: bold, line breaks, lists
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n- /g, '\n• ')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="chat-page">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="chat-header-title">finwise ai</h1>
                <p className="chat-header-subtitle">your personal finance assistant</p>
              </div>
            </div>
            <div className="chat-header-status">
              <span className="chat-status-dot" />
              online
            </div>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">
                  <MessageCircle size={48} strokeWidth={1} />
                </div>
                <h2 className="chat-welcome-title">Hey! I'm your Finwise AI 👋</h2>
                <p className="chat-welcome-text">
                  Ask me anything about your spending, savings, budget, or financial goals.
                  I have full access to your transaction data.
                </p>
                <div className="chat-quick-prompts">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      className="chat-quick-prompt"
                      onClick={() => sendMessage(prompt.text)}
                    >
                      <span className="chat-quick-icon">{prompt.icon}</span>
                      {prompt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-ai'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="chat-message-avatar">
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className="chat-message-bubble">
                      <div
                        className="chat-message-text"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="chat-message chat-message-ai">
                    <div className="chat-message-avatar">
                      <Sparkles size={14} />
                    </div>
                    <div className="chat-message-bubble">
                      <div className="chat-typing">
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                        <span className="chat-typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input */}
          <div className="chat-input-bar">
            <div className="chat-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Ask about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                className="chat-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
            <p className="chat-disclaimer">
              Finwise AI can make mistakes. Always verify important financial decisions.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
