'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Clock
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
  studentCount: number | null;
  logoUrl: string | null;
}

interface ProgramCardData {
  id: string;
  name: string;
  nameCn: string | null;
  degree: string | null;
  major: string | null;
  universityName: string | null;
  universityId: string | null;
  language: string | null;
  duration: string | null;
  durationMonths: number | null;
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
}

const WHATSAPP_NUMBER = '+8617325764171';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}`;

// Default quick actions shown at start
const DEFAULT_QUICK_ACTIONS = [
  { label: 'Scholarships', query: 'What scholarship options are available for international students?' },
  { label: 'Apply Now', query: 'How do I apply to a Chinese university?' },
  { label: 'Programs', query: 'What types of programs are available?' },
  { label: 'Top Universities', query: 'What are the top universities in China?' },
];

const STORAGE_KEY = 'sica-chat-history';
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
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Load conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert string dates back to Date objects
        const hydrated = parsed.map((conv: Conversation) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setConversations(hydrated);
        
        // Load the most recent conversation or default
        if (hydrated.length > 0) {
          const mostRecent = hydrated[0];
          setCurrentConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);
  
  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);
  
  // Default greeting message
  const defaultMessages: Message[] = [
    {
      id: '1',
      role: 'assistant',
      content: "Hello! 👋 I'm **SICA AI Assistant**. I can help you:\n\n• Find universities and programs in China\n• Understand scholarship options\n• Navigate the application process\n• Answer questions about studying in China\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ];
  
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: 'New Conversation',
      messages: defaultMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations(prev => [newConversation, ...prev].slice(0, MAX_HISTORY_CONVERSATIONS));
    setCurrentConversationId(newId);
    setMessages(defaultMessages);
    setShowHistory(false);
    setFollowUpQuestions([]);
    setSessionId(null);
  }, [defaultMessages]);
  
  // Switch to a different conversation
  const switchConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setShowHistory(false);
      setFollowUpQuestions([]);
    }
  }, [conversations]);
  
  // Delete a conversation
  const deleteConversation = useCallback((e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If we deleted the current conversation, switch to another or create new
    if (conversationId === currentConversationId) {
      if (conversations.length > 1) {
        const nextConversation = conversations.find(c => c.id !== conversationId);
        if (nextConversation) {
          setCurrentConversationId(nextConversation.id);
          setMessages(nextConversation.messages);
        }
      } else {
        setMessages(defaultMessages);
      }
    }
  }, [conversations, currentConversationId, defaultMessages]);
  
  // Update current conversation in history
  const updateCurrentConversation = useCallback((updatedMessages: Message[]) => {
    setConversations(prev => {
      const newConversations = [...prev];
      const index = newConversations.findIndex(c => c.id === currentConversationId);
      
      // Generate a title from the first user message
      let title = 'New Conversation';
      const firstUserMessage = updatedMessages.find(m => m.role === 'user');
      if (firstUserMessage) {
        title = firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
      }
      
      if (index !== -1) {
        // Update existing conversation
        newConversations[index] = {
          ...newConversations[index],
          messages: updatedMessages,
          title,
          updatedAt: new Date(),
        };
        // Move to front
        const [updated] = newConversations.splice(index, 1);
        newConversations.unshift(updated);
      } else {
        // Create new conversation
        newConversations.unshift({
          id: currentConversationId,
          title,
          messages: updatedMessages,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      return newConversations.slice(0, MAX_HISTORY_CONVERSATIONS);
    });
  }, [currentConversationId]);

  // Detect context for quick actions based on last message
  const currentContext = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      return detectContext(lastAssistantMessage.content);
    }
    return 'general';
  }, [messages]);

  // Get contextual quick actions
  const quickActions = useMemo(() => {
    if (messages.length <= 2) {
      return DEFAULT_QUICK_ACTIONS;
    }
    return getQuickActions(currentContext);
  }, [messages.length, currentContext]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch card data for a message
  const fetchCardData = useCallback(async (
    messageId: string, 
    universityIds: string[], 
    programIds: string[]
  ) => {
    if (universityIds.length === 0 && programIds.length === 0) return;

    try {
      const response = await fetch('/api/chat/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universities: universityIds, programs: programIds }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create maps for quick lookup by ID
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

        // Update message with fetched data
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
      id: Date.now().toString(),
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

    // Create placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
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
      // Call chat API
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

      // Read SSE stream
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

      // Parse content for markers and fetch card data
      const { text, universityIds, programIds } = parseChatContent(fullContent);
      
      // Update message with parsed content and IDs
      const updatedMsgs = messagesWithPlaceholder.map(m => 
        m.id === assistantId 
          ? { ...m, content: text, universityIds, programIds }
          : m
      );
      setMessages(updatedMsgs);
      updateCurrentConversation(updatedMsgs);
      
      // Generate follow-up questions
      if (text) {
        setFollowUpQuestions(getFollowUpQuestions(text, currentContext));
      }

      // Fetch card data if there are markers
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

      // If no content was received, show error
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
          if (part.type === 'text') {
            return (
              <ChatMarkdown key={index} content={part.content} />
            );
          } else if (part.type === 'uni-card' && part.index !== undefined) {
            // Check if we have data for this card
            const uniData = message.universityData?.get(part.index);
            if (uniData) {
              return (
                <ChatUniversityCard
                  key={index}
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
                  studentCount={uniData.studentCount}
                  logoUrl={uniData.logoUrl}
                />
              );
            }
            // Show skeleton if loading, or nothing if not found
            if (message.loading) {
              return <ChatUniversityCardSkeleton key={index} />;
            }
            return null;
          } else if (part.type === 'prog-card' && part.index !== undefined) {
            const progData = message.programData?.get(part.index);
            if (progData) {
              return (
                <ChatProgramCard
                  key={index}
                  id={progData.id}
                  name={progData.name}
                  nameCn={progData.nameCn}
                  degree={progData.degree}
                  major={progData.major}
                  universityName={progData.universityName}
                  universityId={progData.universityId}
                  language={progData.language}
                  duration={progData.duration}
                  durationMonths={progData.durationMonths}
                  tuition={progData.tuition}
                  currency={progData.currency}
                  scholarshipAvailable={progData.scholarshipAvailable}
                />
              );
            }
            if (message.loading) {
              return <ChatProgramCardSkeleton key={index} />;
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
          'fixed bottom-24 right-4 z-50 flex flex-col bg-background border rounded-2xl shadow-2xl transition-all duration-300 ease-in-out',
          'w-[calc(100vw-2rem)] sm:w-96',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
        style={{ height: 'min(70vh, 600px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
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
          <div className="flex items-center gap-1">
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
              title="Conversation History"
            >
              <History className="h-4 w-4" />
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
            showHistory ? 'w-48' : 'w-0 hidden'
          )}>
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Recent Chats</h4>
              </div>
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4">No saved conversations</p>
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3 py-2.5 text-sm',
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
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
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
                        </div>
                      </>
                    )}
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
              <div className="px-4 pb-2 border-t">
                <p className="text-xs text-muted-foreground mb-2 pt-2">Ask follow-up:</p>
                <div className="flex flex-wrap gap-1.5">
                  {followUpQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
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
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.slice(0, 4).map((action) => (
                    <Button
                      key={action.label}
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
            <div className="px-4 py-2 border-t bg-muted/30">
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Need human help? WhatsApp: +86 173 2576 4171</span>
              </a>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about universities, programs..."
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
    </>
  );
}
