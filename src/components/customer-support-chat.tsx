
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
import { Dialog, DialogContent, DialogHeader, DialogTitle as VisuallyHiddenTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useIsMobile } from '@/hooks/use-mobile';


type Message = {
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
};

type CustomerSupportChatProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function CustomerSupportChat({ isOpen, onOpenChange }: CustomerSupportChatProps) {
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
  const isMobile = useIsMobile();

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
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);
  
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
       if (!isOpen || isMinimized) {
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
  
  if (isMobile) {
    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg z-50 flex items-center justify-center"
                onClick={() => onOpenChange(true)}
                aria-label="Open chat support"
            >
                <Bot className="h-8 w-8" />
                {hasUnreadMessages && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
            </Button>
        );
    }
    
     return (
       <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 border-0 w-[95vw] h-[80vh] flex flex-col" hideCloseButton>
            <DialogHeader>
              <VisuallyHiddenTitle>TeachFlow AI Assistant</VisuallyHiddenTitle>
              <DialogDescription className="sr-only">Chat with our AI assistant for help with TeachFlow.</DialogDescription>
            </DialogHeader>
            <Card className="h-full flex flex-col shadow-2xl rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8 bg-primary-foreground text-primary flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                </Avatar>
                <div>
                    <CardTitle className="text-base font-semibold">TeachFlow Assistant</CardTitle>
                </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
                </Button>
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
                        <div className="flex flex-col gap-1 max-w-[80%]">
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
                 <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1"
                        disabled={isLoading}
                        autoComplete="off"
                        aria-label="Message input"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
            </Card>
        </DialogContent>
       </Dialog>
    );
  }

  // Desktop view
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 w-[400px] h-[600px] flex flex-col" hideCloseButton>
        <DialogHeader>
          <VisuallyHiddenTitle>TeachFlow AI Assistant</VisuallyHiddenTitle>
          <DialogDescription className="sr-only">Chat with our AI assistant for help with TeachFlow.</DialogDescription>
        </DialogHeader>
        <Card className="h-full flex flex-col shadow-2xl rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </Avatar>
              <div>
                <CardTitle className="text-base font-semibold">TeachFlow Assistant</CardTitle>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
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
                    <div className="flex flex-col gap-1 max-w-[80%]">
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
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1"
                disabled={isLoading}
                autoComplete="off"
                aria-label="Message input"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
