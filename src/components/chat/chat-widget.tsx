'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Trash2,
  History,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the best universities for engineering in China?',
  'How do I apply for a Chinese Government Scholarship?',
  'What documents do I need for my application?',
  'Which programs are taught in English?',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch sessions when opening
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('chat_auth_token');
      if (!token) return;
      const res = await fetch('/api/chat/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open, fetchSessions]);

  const TOKEN_KEY = 'sica_auth_token';

  const getAuthToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const token = getAuthToken();
    if (!token) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add placeholder assistant message
    const assistantId = `temp-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content.trim(),
          session_id: sessionId,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream reader');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'session') {
                setSessionId(data.session_id);
              } else if (data.type === 'content') {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullContent } : m
                  )
                );
              } else if (data.type === 'done') {
                // Streaming complete
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled
      } else {
        console.error('Chat error:', error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [isLoading, sessionId, getAuthToken, fetchSessions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const loadSession = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/chat/sessions/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setSessionId(id);
        setShowHistory(false);
      }
    } catch {
      // Silent fail
    }
  };

  const deleteSession = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/chat/sessions?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (sessionId === id) {
          setMessages([]);
          setSessionId(null);
        }
        fetchSessions();
      }
    } catch {
      // Silent fail
    }
  };

  if (!mounted) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-base">SICA AI Assistant</SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowHistory(!showHistory)}
                aria-label="Chat history"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={startNewChat}
                aria-label="New chat"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* History sidebar */}
        {showHistory && (
          <div className="border-b px-4 py-3 max-h-48 overflow-y-auto flex-shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Conversations</p>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No conversations yet</p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer group',
                      s.id === sessionId && 'bg-muted'
                    )}
                    onClick={() => loadSession(s.id)}
                  >
                    <span className="truncate flex-1 text-xs">{s.title || 'Untitled'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Separator className="mt-3" />
          </div>
        )}

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-sm mb-1">How can I help you?</h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-[260px]">
                Ask me about universities, programs, scholarships, or the application process.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full max-w-[300px]">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left text-xs rounded-lg border px-3 py-2 hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'rounded-xl px-3 py-2 text-sm max-w-[85%] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {msg.role === 'assistant' && !msg.content && isLoading ? (
                  <div className="flex items-center gap-1.5 py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-secondary text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about studying in China..."
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            AI may make mistakes. Verify important information.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
