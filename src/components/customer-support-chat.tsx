'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, User, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { customerSupport } from '@/ai/flows/customer-support-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
};

export default function CustomerSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm the TeachFlow AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized && scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        setTimeout(() => {
          scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnreadMessages(false);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input.trim(),
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await customerSupport({
        history: messages,
        question: input.trim(),
      });
      
      const modelMessage: Message = { 
        role: 'model', 
        content: result.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, modelMessage]);
      
      // Show unread indicator if chat is minimized or closed
      if (isMinimized || !isOpen) {
        setHasUnreadMessages(true);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'model',
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Customer support AI error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnreadMessages(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized) {
      setHasUnreadMessages(false);
    }
  };

  // Floating action button when chat is closed
  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg relative"
        onClick={handleOpen}
        aria-label="Open chat support"
      >
        <Bot className="h-8 w-8" />
        {hasUnreadMessages && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-2xl rounded-xl z-50">
        <CardHeader className="flex flex-row items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={toggleMinimize}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </Avatar>
            <div>
              <CardTitle className="text-base font-semibold">TeachFlow Assistant</CardTitle>
              {hasUnreadMessages && (
                <span className="text-xs text-muted-foreground">New message</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}>
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">Maximize</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Full chat window
  return (
    <Card className="fixed bottom-4 right-4 w-80 h-[500px] shadow-2xl rounded-xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold">TeachFlow Assistant</CardTitle>
            <span className="text-xs text-muted-foreground">Always here to help</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMinimize}>
            <Minimize2 className="h-4 w-4" />
            <span className="sr-only">Minimize</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-6 w-6 border flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm prose dark:prose-invert prose-p:my-0 prose-ul:my-1 prose-li:my-0 prose-code:text-xs break-words',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.timestamp && (
                    <span className={cn(
                      'text-xs text-muted-foreground px-1',
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-6 w-6 border flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start animate-in fade-in duration-300">
                <Avatar className="h-6 w-6 border flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 border-t bg-background">
        <div className="flex w-full items-center space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            className="flex-1"
            disabled={isLoading}
            autoComplete="off"
            aria-label="Message input"
          />
          <Button 
            onClick={handleSendMessage}
            size="icon" 
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
