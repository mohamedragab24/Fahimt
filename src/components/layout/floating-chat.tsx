
"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minus, Maximize2, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, addDoc, doc, updateDoc, setDoc, onSnapshot } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export function FloatingChat() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatId = user?.uid || null;

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, "floatingChats", chatId, "messages"), orderBy("createdAt", "asc"));
  }, [firestore, chatId]);

  const { data: messages } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || !firestore || !user) return;

    try {
      const chatRef = doc(firestore, "floatingChats", user.uid);
      await setDoc(chatRef, {
        id: user.uid,
        userId: user.uid,
        userName: user.displayName || "مستخدم",
        lastMessage: message,
        status: "open",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await addDoc(collection(firestore, "floatingChats", user.uid, "messages"), {
        senderId: user.uid,
        senderName: user.displayName || "مستخدم",
        text: message,
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      setMessage("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال الرسالة." });
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4" dir="rtl">
      {isOpen && (
        <Card className={`w-80 md:w-96 shadow-2xl rounded-[2rem] border-2 overflow-hidden transition-all ${isMinimized ? 'h-16' : 'h-[500px]'}`}>
          <CardHeader className="bg-primary text-white p-4 flex flex-row justify-between items-center space-y-0">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <User size={20} /> دردشة الدعم الفني
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4 bg-zinc-50/50 h-[360px]">
                <div className="space-y-4">
                  {messages?.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm font-bold ${msg.isAdmin ? 'bg-white border text-zinc-800' : 'bg-primary text-white'}`}>
                        {msg.text}
                        <span className="text-[10px] block mt-1 opacity-50">{new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-white">
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                  <Input 
                    placeholder="اكتب رسالتك..." 
                    className="h-12 rounded-xl border-2" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                  />
                  <Button type="submit" className="h-12 w-12 rounded-xl p-0">
                    <Send size={20} />
                  </Button>
                </form>
              </div>
            </>
          )}
        </Card>
      )}

      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-transform hover:scale-110 group"
        >
          <MessageCircle size={32} className="group-hover:rotate-12 transition-transform" />
        </Button>
      )}
    </div>
  );
}
