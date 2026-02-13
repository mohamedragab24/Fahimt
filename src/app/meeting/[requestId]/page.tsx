
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { Video, Star, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking, createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function MeetingPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestRef = useMemoFirebase(() => {
    if (!firestore || !requestId) return null;
    return doc(firestore, "istifhams", requestId as string);
  }, [firestore, requestId]);

  const { data: request, isLoading } = useDoc(requestRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (requestRef && profile && requestId) {
      const field = profile.role === 'mufhem' ? 'teacherJoined' : 'studentJoined';
      updateDocumentNonBlocking(requestRef, { 
        [field]: true,
        lastLiveSession: new Date().toISOString(),
        recordingUrl: `https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/Fahimni_Room_${requestId}`
      });
    }
  }, [requestRef, profile, requestId]);

  const startMeeting = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainerRef.current && profile && request) {
      const roomName = `Fahimni_Room_${requestId}`;
      const domain = "8x8.vc";
      const options = {
        roomName: `vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/${roomName}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: profile.fullName || "مستخدم فهمني",
          email: profile.email,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          disableDeepLinking: true,
          prejoinPageEnabled: false,
          enableWelcomePage: false,
          autoRecord: true,
          localRecording: {
            enabled: true,
            format: 'flac'
          }
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'settings', 'raisehand', 'videoquality', 'filmstrip', 'tileview', 'help', 'mute-everyone'
          ],
        }
      };
      const newApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(newApi);

      newApi.on('videoConferenceJoined', () => {
        newApi.executeCommand('startRecording', { mode: 'file' });
      });

      newApi.on('recordingStatusChanged', (data: any) => {
        if (data.on && data.link && requestRef) {
          updateDocumentNonBlocking(requestRef, { 
            recordingUrl: data.link,
            isRecordingActive: true
          });
        }
      });

      newApi.addEventListener('videoConferenceLeft', () => {
        if (profile.role === 'mustafhem') {
          setShowRating(true);
        } else {
          router.push("/requests");
        }
      });
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      toast({ variant: "destructive", title: "التقييم إجباري", description: "يرجى تقييم المحاضرة لإكمال العملية وحفظ السجل." });
      return;
    }
    
    setIsSubmitting(true);
    
    if (requestRef && request && firestore) {
      // 1. تحديث حالة الاستفهام
      updateDocumentNonBlocking(requestRef, {
        rating,
        review,
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // 2. معالجة الأموال (أتمتة الدفع)
      const commission = request.amount * 0.2;
      const teacherEarning = request.amount * 0.8;

      // خصم من الطالب (إذا لم يخصم مسبقاً، هنا نعتبره دفعة نهائية)
      createTransactionNonBlocking(firestore, request.mustafhemId, {
        amount: request.amount,
        type: 'withdrawal',
        details: `رسوم محاضرة: ${request.title}`,
        status: 'completed'
      });

      // إضافة للمعلم
      createTransactionNonBlocking(firestore, request.mufhemId, {
        amount: teacherEarning,
        type: 'earning',
        details: `أرباح محاضرة: ${request.title} (بعد خصم عمولة 20%)`,
        status: 'completed'
      });
      
      toast({ title: "تم الانتهاء بنجاح!", description: "شكراً لتقييمك، تم تحويل الأرباح للمفهم وحفظ سجل الرقابة." });
      router.push("/requests");
    }
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-xl font-black">جاري تأمين غرفة المحاضرة والرقابة...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script 
        src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" 
        onLoad={startMeeting}
      />
      
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Video className="text-primary h-5 w-5" />
          </div>
          <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-md">{request?.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {profile?.role === 'mufhem' && (
            <div className="hidden md:flex items-center gap-2 text-zinc-400 text-xs font-bold bg-zinc-800 px-4 py-2 rounded-full border border-zinc-700">
              <AlertCircle size={14} /> بانتظار الطالب لإنهاء الجلسة (التقييم إلزامي للطالب)
            </div>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => { 
              if (profile?.role === 'mufhem') {
                toast({ variant: "destructive", title: "تنبيه للمفهم", description: "يجب على الطالب (المستفهم) إنهاء الجلسة أولاً لضمان حفظ سجل الرقابة والتقييم وتحويل أرباحك." });
              } else {
                api?.executeCommand('hangup'); 
              }
            }} 
            className="rounded-full px-6 font-bold shadow-lg"
          >
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      <Dialog open={showRating} onOpenChange={(open) => { if (!open && rating === 0) return; setShowRating(open); }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
              <Star className="text-yellow-500 fill-yellow-500" /> تقييم المحاضرة
            </DialogTitle>
            <DialogDescription className="text-right text-lg font-medium">يرجى تقييم أداء المفهم لإغلاق المحاضرة وضمان حقه في الأرباح.</DialogDescription>
          </DialogHeader>
          <div className="py-8 space-y-8 flex flex-col items-center">
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-all hover:scale-125">
                  <Star className={`h-12 w-12 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
                </button>
              ))}
            </div>
            <div className="w-full space-y-2">
              <Label className="font-black text-sm mr-2">ما رأيك في شرح المعلم؟</Label>
              <Textarea 
                placeholder="اكتب ملاحظاتك هنا (اختياري)..." 
                className="h-32 rounded-2xl text-lg p-4 border-2 focus:border-primary text-right"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={submitRating} 
              disabled={isSubmitting}
              className="w-full h-16 text-xl font-black rounded-2xl shadow-xl"
            >
              {isSubmitting ? "جاري الحفظ..." : "إرسال التقييم وإنهاء الجلسة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
