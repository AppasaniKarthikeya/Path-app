'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface UserProfile {
  name: string;
  status: string;
  degree: string;
  branch: string;
  year: string;
  graduationYear: string;
  currentJob: string;
  yearsExperience: string;
  careerGoal: string;
  interests: string[];
  learningStyle: string;
  timeAvailable: string;
  languagesKnown: string[];
  projects: string;
  challenges: string;
}

const DAILY_LIMIT = parseInt(process.env.NEXT_PUBLIC_DAILY_CHAT_LIMIT || '50', 10);

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load profile and chat history
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      const savedProfile = localStorage.getItem(`path_profile_${user.uid}`);
      if (!savedProfile) {
        router.push('/profile-setup');
        return;
      }
      setProfile(JSON.parse(savedProfile));

      // Load chat sessions
      const savedSessions = localStorage.getItem(`path_sessions_${user.uid}`);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setChatSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        } else {
          setCurrentSessionId(Date.now().toString());
        }
      } else {
        // Migrate old chat
        const oldChat = localStorage.getItem(`path_chat_${user.uid}`);
        if (oldChat) {
          const parsedMessages = JSON.parse(oldChat);
          const newSession = {
            id: Date.now().toString(),
            title: parsedMessages[0]?.content.slice(0, 30) + '...' || 'Previous Chat',
            messages: parsedMessages,
            updatedAt: Date.now(),
          };
          setChatSessions([newSession]);
          setCurrentSessionId(newSession.id);
          setMessages(parsedMessages);
          localStorage.removeItem(`path_chat_${user.uid}`);
        } else {
          setCurrentSessionId(Date.now().toString());
        }
      }

      // Load daily count
      const today = new Date().toDateString();
      const savedCount = localStorage.getItem(`path_count_${user.uid}_${today}`);
      setDailyCount(savedCount ? parseInt(savedCount, 10) : 0);
    }
  }, [user, loading, router]);

  // Auto-scroll to bottom only if user hasn't scrolled up manually
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  // Save messages to current session
  useEffect(() => {
    if (user && messages.length > 0 && currentSessionId) {
      setChatSessions((prev) => {
        const exists = prev.find((s) => s.id === currentSessionId);
        let newTitle = exists?.title || 'New Chat';
        if (newTitle === 'New Chat' && messages.length > 0) {
          newTitle = messages[0].content.slice(0, 30) + '...';
        }

        let newSessions;
        if (exists) {
          newSessions = prev.map((s) =>
            s.id === currentSessionId ? { ...s, messages, updatedAt: Date.now(), title: newTitle } : s
          );
        } else {
          newSessions = [
            { id: currentSessionId, title: newTitle, messages, updatedAt: Date.now() },
            ...prev,
          ];
        }
        
        // Sort by updatedAt descending
        newSessions.sort((a, b) => b.updatedAt - a.updatedAt);
        localStorage.setItem(`path_sessions_${user.uid}`, JSON.stringify(newSessions));
        return newSessions;
      });
    }
  }, [messages, user, currentSessionId]);

  const incrementDailyCount = () => {
    if (!user) return;
    const today = new Date().toDateString();
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem(`path_count_${user.uid}_${today}`, String(newCount));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming || !profile) return;

    if (dailyCount >= DAILY_LIMIT) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `You've reached your daily limit of ${DAILY_LIMIT} messages. This limit helps keep Path free for everyone! Come back tomorrow for more guidance. 🌅`,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setAutoScroll(true); // Force scroll to bottom on new message
    incrementDailyCount();

    // Create assistant message placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    try {
      // Build message history for API
      const apiMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          userProfile: profile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Server error: ${response.status}`);
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
          );
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ Sorry, I encountered an issue: ${errorMessage}\n\nPlease check that:\n1. Your API keys are configured in .env.local\n2. The server is running properly\n\nTry sending your message again.`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // Reset height after send
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const createNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const editProfile = () => {
    if (user) {
      router.push('/profile-setup?edit=true');
    }
  };

  if (loading || !user || !profile) {
    return (
      <div style={styles.container}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div
        style={{
          ...styles.sidebar,
          ...(showSidebar ? styles.sidebarOpen : {}),
        }}
      >
        <div style={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.sidebarLogo}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>पथ</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>Path</span>
          </div>
          <button onClick={() => setShowSidebar(false)} style={styles.closeSidebar}>
            ✕
          </button>
        </div>

        <button onClick={createNewChat} style={styles.newChatButton}>
          + New Chat
        </button>

        <div style={styles.sidebarSection}>
          <h3 style={styles.sidebarSectionTitle}>Recent Chats</h3>
          <div style={styles.chatList}>
            {chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setMessages(session.messages);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
                style={{
                  ...styles.sidebarBtn,
                  backgroundColor: session.id === currentSessionId ? '#222' : 'transparent',
                  color: session.id === currentSessionId ? '#fff' : '#aaa',
                  marginBottom: 2,
                }}
              >
                💬 {session.title}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.sidebarSection}>
          <h3 style={styles.sidebarSectionTitle}>Profile</h3>
          <div style={styles.profileInfo}>
            <p style={styles.profileName}>{profile.name}</p>
            <p style={styles.profileDetail}>
              {profile.status === 'student' ? `${profile.degree} • ${profile.year}` : profile.currentJob}
            </p>
            {profile.careerGoal && (
              <p style={styles.profileDetail}>Goal: {profile.careerGoal}</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={styles.sidebarFooter}>
          <button onClick={editProfile} style={styles.sidebarBtn}>
            ✏️ Edit Profile
          </button>
          <button onClick={handleSignOut} style={{ ...styles.sidebarBtn, color: '#f87171' }}>
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <button onClick={() => setShowSidebar(!showSidebar)} style={styles.menuButton}>
            ☰
          </button>
          <div style={styles.topBarCenter}>
            <span style={styles.topBarTitle}>Path AI Mentor</span>
          </div>
          <div style={styles.limitBadge}>
            {dailyCount}/{DAILY_LIMIT} today
          </div>
        </div>

        {/* Messages */}
        <div 
          style={styles.messagesContainer} 
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 && (
            <div style={styles.welcomeContainer}>
              <div style={styles.welcomeLogo}>
                <span style={{ fontSize: 48, fontWeight: 700, color: '#fff' }}>पथ</span>
              </div>
              <h2 style={styles.welcomeTitle}>
                Hey {profile.name.split(' ')[0]}! 👋
              </h2>
              <p style={styles.welcomeSubtitle}>
                I&apos;m your career guidance mentor. Ask me anything about:
              </p>
              <div style={styles.suggestionsGrid}>
                {[
                  '🗺️ Career roadmaps for software engineering',
                  '💡 Which tech stack should I learn first?',
                  '📋 How to build a strong resume as a student',
                  '🎯 How to prepare for tech interviews',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion.replace(/^.+?\s/, ''));
                    }}
                    style={styles.suggestionCard}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.messageRow,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
                }}
              >
                {message.role === 'assistant' && (
                  <div style={styles.botLabel}>Path 🧭</div>
                )}
                <div style={styles.messageContent}>
                  {message.content ? (
                    <div className="markdown-body">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                          strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: message.role === 'assistant' ? '#4ade80' : 'inherit' }} {...props} />,
                          ul: ({ node, ...props }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }} {...props} />,
                          ol: ({ node, ...props }) => <ol style={{ margin: '0 0 8px 0', paddingLeft: 20 }} {...props} />,
                          li: ({ node, ...props }) => <li style={{ marginBottom: 4 }} {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span style={styles.thinkingText}>
                      Thinking <span style={styles.dot}>●</span>
                      <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                      <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          <form onSubmit={handleSubmit} style={styles.inputForm}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Dynamic resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                dailyCount >= DAILY_LIMIT
                  ? 'Daily limit reached. Come back tomorrow!'
                  : 'Ask anything about your career, education, tech stacks...'
              }
              disabled={isStreaming || dailyCount >= DAILY_LIMIT}
              style={styles.inputField}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming || dailyCount >= DAILY_LIMIT}
              style={{
                ...styles.sendButton,
                ...((!input.trim() || isStreaming) ? styles.sendButtonDisabled : {}),
              }}
            >
              {isStreaming ? '⏳' : '↑'}
            </button>
          </form>
          <p style={styles.disclaimer}>
            Path AI may make mistakes. Always verify important decisions with real mentors and professionals.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#0a0a0a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
  },
  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: '#111',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: 16,
    position: 'fixed' as const,
    left: -300,
    top: 0,
    bottom: 0,
    zIndex: 100,
    transition: 'left 0.3s ease',
  },
  sidebarOpen: {
    left: 0,
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarLogo: {
    width: 36,
    height: 36,
    backgroundColor: '#000',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #333',
  },
  closeSidebar: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
  },
  newChatButton: {
    padding: '10px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 20,
    textAlign: 'left' as const,
  },
  sidebarSection: {
    marginBottom: 16,
  },
  sidebarSectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    maxHeight: 250,
    overflowY: 'auto' as const,
    marginBottom: 16,
  },
  profileInfo: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  profileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 4px 0',
  },
  profileDetail: {
    color: '#888',
    fontSize: 12,
    margin: '2px 0',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  sidebarBtn: {
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left' as const,
    borderRadius: 6,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  // Main area
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    marginRight: 8,
  },
  topBarCenter: {
    flex: 1,
    textAlign: 'center' as const,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
  },
  limitBadge: {
    padding: '4px 10px',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    color: '#888',
    fontSize: 12,
  },
  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 16px',
  },
  welcomeContainer: {
    textAlign: 'center' as const,
    paddingTop: 60,
    maxWidth: 500,
    margin: '0 auto',
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    backgroundColor: '#111',
    borderRadius: 20,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #222',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 8px 0',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#888',
    margin: '0 0 24px 0',
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    textAlign: 'left' as const,
  },
  suggestionCard: {
    padding: '14px 16px',
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    color: '#ccc',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left' as const,
    lineHeight: 1.4,
    transition: 'border-color 0.2s',
  },
  messageRow: {
    display: 'flex',
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: '12px 16px',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    color: '#fff',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1a1a1a',
    color: '#ddd',
    borderBottomLeftRadius: 4,
    border: '1px solid #222',
  },
  botLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#4ade80',
    marginBottom: 6,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: 'break-word' as const,
  },
  thinkingText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic' as const,
    display: 'inline-flex',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    color: '#4ade80',
    animation: 'pulse 1s infinite',
  },
  // Input
  inputContainer: {
    padding: '12px 16px 8px',
    borderTop: '1px solid #1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 720,
    margin: '0 auto',
  },
  inputField: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
    lineHeight: 1.5,
    maxHeight: 120,
    boxSizing: 'border-box' as const,
  },
  sendButton: {
    width: 42,
    height: 42,
    backgroundColor: '#4ade80',
    border: 'none',
    borderRadius: 10,
    color: '#000',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
    color: '#666',
    cursor: 'not-allowed',
  },
  disclaimer: {
    textAlign: 'center' as const,
    fontSize: 11,
    color: '#555',
    margin: '8px 0 0',
    maxWidth: 720,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};
