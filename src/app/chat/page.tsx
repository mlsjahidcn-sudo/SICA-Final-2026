'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Send, 
  Phone, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check, 
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMarkdown } from '@/components/chat-markdown';
import { ChatUniversityCard, ChatUniversityCardSkeleton } from '@/components/chat-university-card';
import { ChatProgramCard, ChatProgramCardSkeleton } from '@/components/chat-program-card';
import { LeadCaptureForm } from '@/components/chat/lead-capture-form';
import { 
  parseChatContent, 
  splitByCardPlaceholders, 
  getQuickActions, 
  detectContext,
  getFollowUpQuestions
} from '@/lib/chat-utils';
import Link from 'next/link';

// Generate unique IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Card data types
interface UniversityCardData {
  id: string;
  name: string;
  nameCn: string | null;
  city: string | null;
  province: string | null;
  ranking: number | null;
  types: string[];
  tuitionMin: number | null;
  tuitionMax: number | null;
  currency: string;
  logoUrl: string | null;
}

interface ProgramCardData {
  id: string;
  name: string;
  degree: string | null;
  category: string | null;
  universityName: string | null;
  universityId: string | null;
  language: string | null;
  duration: string | null;
  durationYears: number | null;
  tuition: number | null;
  currency: string;
  scholarshipAvailable: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  universityIds?: string[];
  programIds?: string[];
  universityData?: Map<number, UniversityCardData>;
  programData?: Map<number, ProgramCardData>;
  loading?: boolean;
  rating?: 'positive' | 'negative';
}

const WHATSAPP_NUMBER = '+8617325764171';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}`;

const DEFAULT_QUICK_ACTIONS = [
  { label: '🎓 Scholarships', query: 'What scholarship options are available for international students?' },
  { label: '📝 Apply Now', query: 'How do I apply to a Chinese university?' },
  { label: '📚 Programs', query: 'What types of programs are available?' },
  { label: '🏆 Top Universities', query: 'What are the top universities in China?' },
];

const LEAD_CAPTURE_KEY = 'sica-lead-captured';
const LEAD_CAPTURE_AFTER_MESSAGES = 5;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  
  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [collectedUniversityIds, setCollectedUniversityIds] = useState<string[]>([]);
  const [collectedProgramIds, setCollectedProgramIds] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if lead capture should be shown
  useEffect(() => {
    const leadCaptured = localStorage.getItem(LEAD_CAPTURE_KEY);
    if (!leadCaptured && messageCount >= LEAD_CAPTURE_AFTER_MESSAGES && !showLeadCapture) {
      setShowLeadCapture(true);
    }
  }, [messageCount, showLeadCapture]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const currentContext = useMemo(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    return detectContext(lastUserMessage?.content || '');
  }, [messages]);
  const quickActions = useMemo(() => getQuickActions(currentContext), [currentContext]);

  // Fetch card data
  const fetchCardData = useCallback(async (messageId: string, universityIds: string[], programIds: string[]) => {
    try {
      const response = await fetch('/api/chat/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universityIds, programIds }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const universityData = new Map<number, UniversityCardData>();
        const programData = new Map<number, ProgramCardData>();

        if (data.universities) {
          data.universities.forEach((uni: UniversityCardData) => {
            const idx = universityIds.indexOf(uni.id);
            if (idx !== -1) {
              universityData.set(idx, uni);
            }
          });
        }

        if (data.programs) {
          data.programs.forEach((prog: ProgramCardData) => {
            const idx = programIds.indexOf(prog.id);
            if (idx !== -1) {
              programData.set(idx, prog);
            }
          });
        }

        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, universityData, programData, loading: false }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to fetch card data:', error);
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, loading: false }
          : m
      ));
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    setFollowUpQuestions([]);
    setMessageCount(prev => prev + 1);

    const assistantId = generateId();
    const placeholderMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };
    
    const messagesWithPlaceholder = [...newMessages, placeholderMessage];
    setMessages(messagesWithPlaceholder);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      setIsTyping(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'session') {
                  setSessionId(parsed.session_id);
                } else if (parsed.type === 'content' && parsed.content) {
                  fullContent += parsed.content;
                  const updatedMsgs = messagesWithPlaceholder.map(m => 
                    m.id === assistantId 
                      ? { ...m, content: fullContent }
                      : m
                  );
                  setMessages(updatedMsgs);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      const { text, universityIds, programIds } = parseChatContent(fullContent);
      
      const updatedMsgs = messagesWithPlaceholder.map(m => 
        m.id === assistantId 
          ? { ...m, content: text, universityIds, programIds }
          : m
      );
      setMessages(updatedMsgs);
      
      if (text) {
        setFollowUpQuestions(getFollowUpQuestions(text, currentContext));
      }

      if (universityIds.length > 0 || programIds.length > 0) {
        setCollectedUniversityIds(prev => [...new Set([...prev, ...universityIds])]);
        setCollectedProgramIds(prev => [...new Set([...prev, ...programIds])]);
        await fetchCardData(assistantId, universityIds, programIds);
      } else {
        const finalMsgs = updatedMsgs.map(m => 
          m.id === assistantId 
            ? { ...m, loading: false }
            : m
        );
        setMessages(finalMsgs);
      }

      if (!fullContent) {
        const errorMsgs = updatedMsgs.map(m => 
          m.id === assistantId 
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.', loading: false }
            : m
        );
        setMessages(errorMsgs);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const errorMsgs = messagesWithPlaceholder.map(m => 
        m.id === assistantId 
          ? { ...m, content: 'Sorry, I encountered an error. Please try again or contact us via WhatsApp.', loading: false }
          : m
      );
      setMessages(errorMsgs);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, fetchCardData, currentContext, sessionId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRating = (messageId: string, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, rating } : m
    ));
    toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve!');
  };

  const handleLeadSubmit = (leadData: {
    name: string;
    email: string;
    whatsapp_number: string;
    nationality: string;
    degree_level: string;
    major_interest: string;
    preferred_language: string;
    budget_range: string;
  }) => {
    localStorage.setItem(LEAD_CAPTURE_KEY, 'true');
    setShowLeadCapture(false);
    toast.success(`Thanks ${leadData.name}! We'll contact you soon via WhatsApp.`);
  };

  const regenerateLastResponse = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1));
      sendMessage(lastUserMessage.content);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SICA AI Chat - Study in China',
          text: 'Chat with SICA AI about studying in China!',
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render message content
  const renderMessageContent = (message: Message) => {
    const parts = splitByCardPlaceholders(message.content);

    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          const uniqueKey = `${message.id}-${index}-${part.type}`;
          
          if (part.type === 'text') {
            return (
              <ChatMarkdown key={uniqueKey} content={part.content} />
            );
          } else if (part.type === 'uni-card' && part.index !== undefined) {
            const uniData = message.universityData?.get(part.index);
            if (uniData) {
              return (
                <ChatUniversityCard
                  key={uniqueKey}
                  id={uniData.id}
                  name={uniData.name}
                  nameCn={uniData.nameCn}
                  city={uniData.city}
                  province={uniData.province}
                  ranking={uniData.ranking}
                  types={uniData.types}
                  tuitionMin={uniData.tuitionMin}
                  tuitionMax={uniData.tuitionMax}
                  currency={uniData.currency}
                  logoUrl={uniData.logoUrl}
                />
              );
            }
            if (message.loading) {
              return <ChatUniversityCardSkeleton key={uniqueKey} />;
            }
            return null;
          } else if (part.type === 'prog-card' && part.index !== undefined) {
            const progData = message.programData?.get(part.index);
            if (progData) {
              return (
                <ChatProgramCard
                  key={uniqueKey}
                  id={progData.id}
                  name={progData.name}
                  degree={progData.degree}
                  category={progData.category}
                  universityName={progData.universityName}
                  universityId={progData.universityId}
                  language={progData.language}
                  duration={progData.duration}
                  durationYears={progData.durationYears}
                  tuition={progData.tuition}
                  currency={progData.currency}
                  scholarshipAvailable={progData.scholarshipAvailable}
                />
              );
            }
            if (message.loading) {
              return <ChatProgramCardSkeleton key={uniqueKey} />;
            }
            return null;
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold text-sm">SICA AI Assistant</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Hi! I&apos;m SICA AI</h2>
              <p className="text-muted-foreground mb-6">Ask me anything about studying in China</p>
              <div className="flex flex-wrap justify-center gap-2">
                {DEFAULT_QUICK_ACTIONS.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleQuickAction(action.query)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn('max-w-[80%]')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  {message.content === '' ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </span>
                  ) : message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <>
                      {renderMessageContent(message)}
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                        <button
                          onClick={() => handleCopy(message.content, message.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedId === message.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedId === message.id ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleRating(message.id, 'positive')}
                          className={cn(
                            'text-xs transition-colors',
                            message.rating === 'positive' 
                              ? 'text-green-500' 
                              : 'text-muted-foreground hover:text-green-500'
                          )}
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleRating(message.id, 'negative')}
                          className={cn(
                            'text-xs transition-colors',
                            message.rating === 'negative' 
                              ? 'text-red-500' 
                              : 'text-muted-foreground hover:text-red-500'
                          )}
                        >
                          👎
                        </button>
                        <button
                          onClick={regenerateLastResponse}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className={cn(
                  'text-[10px] text-muted-foreground mt-1',
                  message.role === 'user' ? 'text-right' : 'text-left'
                )}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-muted text-sm">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-bl-md rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && !isLoading && (
        <div className="border-t bg-background/95 backdrop-blur">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <p className="text-xs text-muted-foreground mb-2">Ask follow-up:</p>
            <div className="flex flex-wrap gap-2">
              {followUpQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => handleQuickAction(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length <= 3 && !isLoading && !isTyping && (
        <div className="border-t bg-background/95 backdrop-blur">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 4).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => handleQuickAction(action.query)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Capture Form */}
      {showLeadCapture && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <LeadCaptureForm
            sessionId={sessionId || undefined}
            programIds={collectedProgramIds.length > 0 ? collectedProgramIds : undefined}
            universityIds={collectedUniversityIds.length > 0 ? collectedUniversityIds : undefined}
            onSubmit={handleLeadSubmit}
            onCancel={() => setShowLeadCapture(false)}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background sticky bottom-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about universities, programs, scholarships..."
              className="flex-1 rounded-full"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-10 w-10"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            <Link href="/apply" className="flex items-center gap-1 hover:text-foreground transition-colors">
              Apply Now <ExternalLink className="h-3 w-3" />
            </Link>
            <Link href="/programs" className="hover:text-foreground transition-colors">
              Browse Programs
            </Link>
            <Link href="/universities" className="hover:text-foreground transition-colors">
              Universities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
