
"use client";

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, Send, ChevronRight, Hash, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminFloatingChats() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "floatingChats"), orderBy("updatedAt", "desc"));
  }, [firestore]);

  const { data: chats, isLoading } = useCollection(chatsQuery);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedChat) return null;
    return query(collection(firestore, "floatingChats", selectedChat.id, "messages"), orderBy("createdAt", "asc"));
  }, [firestore, selectedChat]);

  const { data: messages } = useCollection(messagesQuery);

  const handleReply = async () => {
    if (!firestore || !selectedChat || !replyMessage.trim()) return;

    try {
      await addDoc(collection(firestore, "floatingChats", selectedChat.id, "messages"), {
        senderId: "admin",
        senderName: "فريق دعم فهمني",
        text: replyMessage,
        isAdmin: true,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(firestore, "floatingChats", selectedChat.id), {
        status: "replied",
        updatedAt: new Date().toISOString()
      });

      setReplyMessage("");
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10" dir="rtl">
      <div className="border-r-8 border-primary pr-6">
        <h1 className="text-4xl font-black font-headline">النافذة العائمة (إدارة الدردشة)</h1>
        <p className="text-muted-foreground text-lg">الرد المباشر على استفسارات الزوار والمستخدمين عبر النافذة العائمة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 shadow-xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-lg font-black">المحادثات النشطة</CardTitle></CardHeader>
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {isLoading ? <div className="p-10 text-center animate-pulse font-bold">جاري التحميل...</div> : 
                chats?.map((chat) => (
                  <div 
                    key={chat.id} 
                    onClick={() => setSelectedChat(chat)}
                    className={`p-6 cursor-pointer hover:bg-muted transition-colors ${selectedChat?.id === chat.id ? 'bg-primary/5 border-r-4 border-primary' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={chat.status === 'open' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}>
                        {chat.status === 'open' ? 'جديدة' : 'تم الرد'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{new Date(chat.updatedAt).toLocaleTimeString('ar-EG')}</span>
                    </div>
                    <h4 className="font-bold text-sm truncate text-right">{chat.userName}</h4>
                    <p className="text-xs text-muted-foreground mt-1 text-right line-clamp-1">{chat.lastMessage}</p>
                  </div>
                ))
              }
              {(!chats || chats.length === 0) && !isLoading && (
                <div className="p-10 text-center text-muted-foreground font-bold italic">لا توجد محادثات عائمة حالياً.</div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="lg:col-span-2 shadow-xl rounded-[2.5rem] overflow-hidden border-2 bg-white">
          {selectedChat ? (
            <div className="flex flex-col h-[680px]">
              <div className="p-6 border-b bg-muted/10 flex justify-between items-center">
                <div className="text-right">
                  <h3 className="font-black text-xl flex items-center gap-2"><User size={20} className="text-primary" /> {selectedChat.userName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Chat ID: {selectedChat.id}</p>
                </div>
              </div>
              <ScrollArea className="flex-1 p-6 bg-zinc-50/30">
                <div className="space-y-4">
                  {messages?.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.isAdmin ? 'bg-primary text-white' : 'bg-white border text-zinc-800'}`}>
                        <p className="font-bold text-sm">{msg.text}</p>
                        <span className="text-[10px] opacity-50 block mt-1">{new Date(msg.createdAt).toLocaleTimeString('ar-EG')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-6 border-t bg-white">
                <div className="flex gap-2">
                  <Input 
                    placeholder="اكتب ردك هنا..." 
                    className="h-14 rounded-xl border-2" 
                    value={replyMessage} 
                    onChange={(e) => setReplyMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()} 
                  />
                  <Button onClick={handleReply} className="h-14 px-8 rounded-xl bg-primary">
                    <Send size={20}/>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-30">
              <MessageCircle size={80} />
              <p className="text-2xl font-black mt-4">اختر محادثة للرد عليها</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
