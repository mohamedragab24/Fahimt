
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ArrowRight, Video, ShieldCheck, Copy, Check, Star, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
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
    if (requestRef && profile) {
      const field = profile.role === 'mufhem' ? 'teacherJoined' : 'studentJoined';
      updateDocumentNonBlocking(requestRef, { [field]: true });
    }
  }, [requestRef, profile]);

  const startMeeting = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainerRef.current && profile && request) {
      const domain = "8x8.vc";
      const options = {
        roomName: `vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/${requestId}`,
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
        },
      };
      const newApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(newApi);

      newApi.addEventListener('videoConferenceLeft', () => {
        setShowRating(true);
      });
    }
  };

  const submitRating = () => {
    if (rating === 0) {
      toast({ variant: "destructive", title: "التقييم إجباري", description: "يرجى اختيار عدد النجوم قبل المغادرة." });
      return;
    }
    if (requestRef) {
      updateDocumentNonBlocking(requestRef, {
        rating,
        review,
        status: 'completed'
      });
      toast({ title: "شكراً لتقييمك!" });
      router.push("/requests");
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black">جاري تأمين الغرفة...</div>;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script 
        src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" 
        onLoad={startMeeting}
      />
      
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold">{request?.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* لا يمكن للمفهم إغلاق الجلسة قبل المستفهم (تعطيل الزر للمفهم في بعض الحالات أو تركه للمستفهم فقط) */}
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => { 
              if (profile?.role === 'mufhem') {
                toast({ variant: "destructive", title: "تنبيه", description: "يجب على المستفهم إنهاء الجلسة أولاً لضمان اكتمال الشرح." });
              } else {
                api?.executeCommand('hangup'); 
              }
            }} 
            className="rounded-full px-6 font-bold"
          >
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* مودال التقييم الإجباري */}
      <Dialog open={showRating} onOpenChange={(open) => { if (!open && rating === 0) return; setShowRating(open); }}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-2xl font-black">تقييم المحاضرة (إجباري)</DialogTitle>
            <DialogDescription className="text-right">يرجى تقييم الجلسة لإتمام العملية.</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6 flex flex-col items-center">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`h-10 w-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'}`} />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="رأيك في الشرح..." 
              className="h-24 rounded-xl text-lg"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={submitRating} className="w-full h-14 text-xl font-black">إرسال التقييم وإغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
