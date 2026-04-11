'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  X, 
  Send, 
  Phone, 
  Loader2, 
  Bot, 
  User, 
  Copy, 
  Check, 
  History, 
  Plus,
  Trash2,
  Clock,
  Expand,
  Shrink,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Mail,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMarkdown } from '@/components/chat-markdown';
import { ChatUniversityCard, ChatUniversityCardSkeleton } from '@/components/chat-university-card';
import { ChatProgramCard, ChatProgramCardSkeleton } from '@/components/chat-program-card';
import { 
  parseChatContent, 
  splitByCardPlaceholders, 
  getQuickActions, 
  detectContext,
  getFollowUpQuestions
} from '@/lib/chat-utils';

// Generate unique IDs using crypto API with fallback
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random string
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
};

// Regenerate all message IDs to ensure uniqueness (fixes old localStorage data)
const regenerateMessageIds = (messages: any[]): Message[] => {
  return messages.map(msg => ({
    ...msg,
    id: generateId(), // Always generate new unique ID
    timestamp: new Date(msg.timestamp),
  }));
};

// Card data types matching API response
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

// Default quick actions shown at start
const DEFAULT_QUICK_ACTIONS = [
  { label: '🎓 Scholarships', query: 'What scholarship options are available for international students?' },
  { label: '📝 Apply Now', query: 'How do I apply to a Chinese university?' },
  { label: '📚 Programs', query: 'What types of programs are available?' },
  { label: '🏆 Top Universities', query: 'What are the top universities in China?' },
];

const STORAGE_KEY = 'sica-chat-history';
const STORAGE_VERSION_KEY = 'sica-chat-version';
const STORAGE_VERSION = 2; // Increment this to force clear old data with duplicate IDs
const LEAD_CAPTURE_KEY = 'sica-lead-captured';
const LEAD_CAPTURE_AFTER_MESSAGES = 5;
const MAX_HISTORY_CONVERSATIONS = 10;

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInputValue(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      // Check storage version - clear old data if version mismatch
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (storedVersion !== String(STORAGE_VERSION)) {
        // Version mismatch - clear old data to prevent duplicate key errors
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const loadedConversations = parsed.map((conv: any) => ({
          ...conv,
          id: generateId(), // Regenerate conversation ID too
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: regenerateMessageIds(conv.messages), // Regenerate all message IDs
        }));
        setConversations(loadedConversations);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, MAX_HISTORY_CONVERSATIONS)));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [conversations]);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const currentContext = useMemo(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    return detectContext(lastUserMessage?.content || '');
  }, [messages]);
  const quickActions = useMemo(() => getQuickActions(currentContext), [currentContext]);

  const createNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setFollowUpQuestions([]);
    setMessageCount(0);
    setSessionId(null);
    setShowHistory(false);
  }, []);

  const updateCurrentConversation = useCallback((msgs: Message[]) => {
    if (msgs.length === 0) return;
    
    const title = msgs[0].content.slice(0, 50) + (msgs[0].content.length > 50 ? '...' : '');
    const now = new Date();
    
    setConversations(prev => {
      const existing = prev.find(c => c.id === currentConversationId);
      if (existing) {
        return prev.map(c => c.id === currentConversationId ? {
          ...c,
          title,
          messages: msgs,
          updatedAt: now,
        } : c).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
      
      const newConv: Conversation = {
        id: generateId(),
        title,
        messages: msgs,
        createdAt: now,
        updatedAt: now,
      };
      setCurrentConversationId(newConv.id);
      return [newConv, ...prev].slice(0, MAX_HISTORY_CONVERSATIONS);
    });
  }, [currentConversationId]);

  const switchConversation = useCallback((id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
      setFollowUpQuestions([]);
      setMessageCount(conv.messages.filter(m => m.role === 'user').length);
      setShowHistory(false);
    }
  }, [conversations]);

  const deleteConversation = useCallback((e: React.MouseEvent | React.KeyboardEvent, id: string) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

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
    updateCurrentConversation(newMessages);
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
    updateCurrentConversation(messagesWithPlaceholder);

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
                  updateCurrentConversation(updatedMsgs);
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
      updateCurrentConversation(updatedMsgs);
      
      if (text) {
        setFollowUpQuestions(getFollowUpQuestions(text, currentContext));
      }

      if (universityIds.length > 0 || programIds.length > 0) {
        await fetchCardData(assistantId, universityIds, programIds);
      } else {
        const finalMsgs = updatedMsgs.map(m => 
          m.id === assistantId 
            ? { ...m, loading: false }
            : m
        );
        setMessages(finalMsgs);
        updateCurrentConversation(finalMsgs);
      }

      if (!fullContent) {
        const errorMsgs = updatedMsgs.map(m => 
          m.id === assistantId 
            ? { ...m, content: 'Sorry, I encountered an error. Please try again.', loading: false }
            : m
        );
        setMessages(errorMsgs);
        updateCurrentConversation(errorMsgs);
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
      updateCurrentConversation(errorMsgs);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, fetchCardData, updateCurrentConversation, currentContext, sessionId]);

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
    // Could send to analytics here
    toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve!');
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleLeadSubmit = async () => {
    if (!leadEmail || !leadEmail.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    
    setLeadSubmitting(true);
    try {
      const response = await fetch('/api/chat/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, name: leadName }),
      });
      
      if (response.ok) {
        localStorage.setItem(LEAD_CAPTURE_KEY, 'true');
        setShowLeadCapture(false);
        toast.success('Thanks! We\'ll be in touch soon.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const exportConversation = () => {
    const text = messages.map(m => 
      `[${m.timestamp.toLocaleString()}] ${m.role === 'user' ? 'You' : 'SICA AI'}:\n${m.content}`
    ).join('\n\n---\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sica-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported!');
  };

  const shareConversation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SICA Chat Conversation',
          text: messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n'),
        });
      } catch {
        // User cancelled
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const regenerateLastResponse = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      setMessages(prev => prev.slice(0, -1)); // Remove last assistant message
      sendMessage(lastUserMessage.content);
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for history list
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Render message content with markdown and cards
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
    <>
      {/* Chat Window */}
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-background border rounded-2xl shadow-2xl transition-all duration-300 ease-in-out',
          isFullscreen 
            ? 'inset-4 sm:inset-8 rounded-2xl' 
            : 'bottom-24 right-4 w-[calc(100vw-2rem)] sm:w-96',
          isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
        style={!isFullscreen ? { height: 'min(70vh, 600px)' } : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">SICA AI Assistant</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={createNewConversation}
              title="New Conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowHistory(!showHistory)}
              title="History"
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={shareConversation}
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={exportConversation}
              title="Export"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Minimize' : 'Fullscreen'}
            >
              {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* History Sidebar */}
          <div className={cn(
            'border-r bg-muted/30 overflow-y-auto transition-all duration-300',
            showHistory ? 'w-40 sm:w-48' : 'w-0 hidden'
          )}>
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Recent</h4>
              </div>
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4">No saved chats</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    className={cn(
                      'w-full text-left p-2 rounded-lg mb-1 text-xs transition-colors',
                      'hover:bg-muted flex items-start gap-2 group',
                      currentConversationId === conv.id ? 'bg-primary/10' : ''
                    )}
                  >
                    <Clock className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(conv.updatedAt)}</p>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => deleteConversation(e, conv.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setConversations(prev => prev.filter(c => c.id !== conv.id)); } }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Welcome message when empty */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Hi! I&apos;m SICA AI</h3>
                  <p className="text-sm text-muted-foreground mb-4">Ask me anything about studying in China</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        <Bot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-[85%]')}>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2.5 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}
                    >
                      {message.content === '' ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking...
                        </span>
                      ) : message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <>
                          {renderMessageContent(message)}
                          {/* Message Actions */}
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                            <button
                              onClick={() => handleCopy(message.content, message.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              {copiedId === message.id ? 'Copied' : 'Copy'}
                            </button>
                            
                            {/* Rating buttons */}
                            <button
                              onClick={() => handleRating(message.id, 'positive')}
                              className={cn(
                                'text-xs transition-colors',
                                message.rating === 'positive' 
                                  ? 'text-green-500' 
                                  : 'text-muted-foreground hover:text-green-500'
                              )}
                            >
                              <ThumbsUp className="h-3 w-3" />
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
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                            
                            {/* Regenerate */}
                            <button
                              onClick={regenerateLastResponse}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Timestamp */}
                    <div className={cn(
                      'text-[10px] text-muted-foreground mt-1',
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-muted text-xs">
                        <User className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Bot className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-bl-md rounded-2xl px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up Questions */}
            {followUpQuestions.length > 0 && !isLoading && (
              <div className="px-3 sm:px-4 pb-2 border-t">
                <p className="text-xs text-muted-foreground mb-2 pt-2">Ask follow-up:</p>
                <div className="flex flex-wrap gap-1.5">
                  {followUpQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={`followup-${index}-${question.slice(0, 20)}`}
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full h-7 px-3"
                      onClick={() => handleQuickAction(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {messages.length <= 3 && !isLoading && !isTyping && (
              <div className="px-3 sm:px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.slice(0, 4).map((action, index) => (
                    <Button
                      key={`quick-${index}-${action.label}`}
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-full h-7 px-3"
                      onClick={() => handleQuickAction(action.query)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Contact */}
            <div className="px-3 sm:px-4 py-2 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Human help?</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
                <Link 
                  href="/apply" 
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Apply Now <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex gap-2">
                {speechSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn('rounded-full h-10 w-10 shrink-0', isListening && 'bg-red-500 text-white border-red-500')}
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                )}
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isListening ? 'Listening...' : 'Ask about universities...'}
                  className="flex-1 rounded-full text-sm"
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
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300',
          isOpen && 'rotate-90'
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>

      {/* Lead Capture Dialog */}
      <Dialog open={showLeadCapture} onOpenChange={setShowLeadCapture}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Get Personalized Help
            </DialogTitle>
            <DialogDescription>
              Enter your email to receive personalized recommendations and application guidance from our experts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Name (optional)</Label>
              <Input
                id="lead-name"
                placeholder="Your name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">Email *</Label>
              <Input
                id="lead-email"
                type="email"
                placeholder="your@email.com"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowLeadCapture(false)}
              >
                Maybe Later
              </Button>
              <Button 
                className="flex-1"
                onClick={handleLeadSubmit}
                disabled={leadSubmitting}
              >
                {leadSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Get Help
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Conversation</DialogTitle>
            <DialogDescription>
              Copy the conversation text below to share it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            readOnly
            value={messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n')}
            className="min-h-[200px] text-sm"
          />
          <Button onClick={() => {
            navigator.clipboard.writeText(messages.map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n\n'));
            toast.success('Copied to clipboard!');
          }}>
            <Copy className="h-4 w-4 mr-2" />
            Copy to Clipboard
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Link component for the Apply Now button
function Link({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
