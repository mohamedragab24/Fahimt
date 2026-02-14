
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { Video, Star, Loader2, AlertCircle, ShieldAlert, CheckCircle2, XCircle, Info, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking, createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

type RatingFlow = 'goal' | 'ratings' | 'complaint_ask' | 'complaint_terms' | 'complaint_final' | 'technical_only';

export default function MeetingPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  
  // UI States
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<RatingFlow>('goal');
  
  // Rating Data
  const [goalAchieved, setGoalAchieved] = useState<boolean | null>(null);
  const [understandingRating, setUnderstandingRating] = useState(0);
  const [teacherStyleRating, setTeacherStyleRating] = useState(0);
  const [platformTechRating, setPlatformTechRating] = useState(0);
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

      newApi.addEventListener('videoConferenceLeft', () => {
        setShowRatingDialog(true);
      });
    }
  };

  // المراقبة اللحظية لإنهاء الجلسة من قبل الطالب بالنسبة للمعلم
  useEffect(() => {
    if (request?.status === 'completed' || request?.status === 'pending_review') {
      if (profile?.role === 'mufhem' && !showRatingDialog) {
        setShowRatingDialog(true);
        setCurrentStep('technical_only');
      }
    }
  }, [request?.status, profile?.role, showRatingDialog]);

  const handleFinishSession = async (isComplaint: boolean = false) => {
    setIsSubmitting(true);
    
    if (requestRef && request && firestore) {
      const finalStatus = isComplaint ? 'pending_review' : 'completed';
      
      updateDocumentNonBlocking(requestRef, {
        understandingRating,
        teacherStyleRating,
        platformTechRating,
        review,
        status: finalStatus,
        completedAt: new Date().toISOString(),
        hasComplaint: isComplaint
      });

      if (!isComplaint) {
        const teacherEarning = request.amount * 0.8;
        createTransactionNonBlocking(firestore, request.mustafhemId, {
          amount: request.amount,
          type: 'withdrawal',
          details: `رسوم محاضرة: ${request.title}`,
          status: 'completed'
        });
        createTransactionNonBlocking(firestore, request.mufhemId, {
          amount: teacherEarning,
          type: 'earning',
          details: `أرباح محاضرة: ${request.title}`,
          status: 'completed'
        });
      } else {
        toast({ title: "تم تسجيل الشكوى", description: "سيتم مراجعة الجلسة من قبل الإدارة خلال 3 أيام." });
      }
      
      router.push("/requests");
    }
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-xl font-black">جاري تأمين غرفة المحاضرة والرقابة...</p>
    </div>
  );

  const isStudent = profile?.role === 'mustafhem';

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script 
        src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" 
        onLoad={startMeeting}
      />
      
      {/* شريط التنبيه الدائم */}
      <div className="bg-red-500 text-white text-center py-2 font-black text-sm md:text-lg animate-pulse shadow-lg z-[60]">
        الجلسة مسجلة لضمان حقك وجوة الخدمة
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Video className="text-primary h-5 w-5" />
          </div>
          <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-md">{request?.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => { 
              if (!isStudent) {
                toast({ variant: "destructive", title: "تنبيه للمفهم", description: "يجب على الطالب إنهاء الجلسة أولاً لضمان حفظ سجل الرقابة والتقييم وتحويل أرباحك." });
              } else {
                api?.executeCommand('hangup'); 
              }
            }} 
            className="rounded-full px-6 font-black shadow-lg"
          >
            إنهاء الجلسة
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* مودال التقييم والشكاوى المطور */}
      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8" dir="rtl">
          
          {/* واجهة المستفهم (الطالب) */}
          {isStudent && (
            <div className="space-y-6">
              {currentStep === 'goal' && (
                <div className="text-center space-y-8 py-6">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary">
                    <MessageSquare size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-800">هل فهمت وحققت هدفك من الاستفهام؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => { setGoalAchieved(true); setCurrentStep('ratings'); }} className="h-16 px-12 rounded-2xl bg-green-600 hover:bg-green-700 text-xl font-black">نعم</Button>
                    <Button onClick={() => { setGoalAchieved(false); setCurrentStep('complaint_ask'); }} variant="outline" className="h-16 px-12 rounded-2xl border-2 text-xl font-black">لا</Button>
                  </div>
                </div>
              )}

              {currentStep === 'ratings' && (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="text-right text-2xl font-black">تقييم الجلسة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <RatingItem label="قيم مدى فهمك لهذا الاستفهام" value={understandingRating} onChange={setUnderstandingRating} />
                    <RatingItem label="قيم أسلوب وشرح المفهم" value={teacherStyleRating} onChange={setTeacherStyleRating} />
                    <RatingItem label="قيم جودة الجلسة تقنياً على المنصة" value={platformTechRating} onChange={setPlatformTechRating} />
                    <div className="space-y-2">
                      <Label className="font-bold">اكتب رأيك...</Label>
                      <Textarea value={review} onChange={(e) => setReview(e.target.value)} className="rounded-xl border-2" />
                    </div>
                    <Button onClick={() => handleFinishSession(false)} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg">إرسال التقييم وإنهاء</Button>
                  </div>
                </div>
              )}

              {currentStep === 'complaint_ask' && (
                <div className="text-center space-y-8 py-6">
                  <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-orange-600">
                    <ShieldAlert size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-800 leading-relaxed px-4">هل تريد تقديم شكوى وطلب مراجعة للجلسة لاسترداد قيمتها ومعاقبة المفهم في حالة ثبوت خطئه؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setCurrentStep('complaint_terms')} className="h-16 px-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-xl font-black">نعم</Button>
                    <Button onClick={() => setCurrentStep('ratings')} variant="outline" className="h-16 px-12 rounded-2xl border-2 text-xl font-black">لا</Button>
                  </div>
                </div>
              )}

              {currentStep === 'complaint_terms' && (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 text-sm space-y-4">
                    <h3 className="font-black text-blue-800 text-lg flex items-center gap-2"><Info size={20}/> تنبيهات الشكوى:</h3>
                    <ul className="list-decimal list-inside space-y-2 text-blue-900 font-bold">
                      <li>استكمال إجراءات الشكوى سيحول الأمر للإدارة لمراجعة التسجيل.</li>
                      <li>إذا ثبت خطأك، سيتم خصم مستحقاتك المالية.</li>
                      <li>إذا ثبت تقصير المفهم، سيتم إعادة المبلغ لك كلياً أو جزئياً.</li>
                    </ul>
                    <p className="text-xs text-red-600 font-black">* ملاحظة: في حال انتهاء الفترة المجانية (أول 5 دقائق) دون طلب مغادرة، سيتم خصم الرصيد تلقائياً.</p>
                  </div>
                  <h4 className="text-xl font-black text-center">هل تود استكمال إجراءات الشكوى؟</h4>
                  <div className="flex gap-4">
                    <Button onClick={() => handleFinishSession(true)} className="flex-1 h-14 rounded-2xl bg-red-600 font-black">استكمال الشكوى</Button>
                    <Button onClick={() => setCurrentStep('ratings')} variant="outline" className="flex-1 h-14 rounded-2xl font-black">الإقرار بالتحصيل</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* واجهة المفهم (المعلم) */}
          {!isStudent && (
            <div className="space-y-8 py-6">
              <div className="text-center space-y-4">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-bounce">
                  <Loader2 size={40} />
                </div>
                <h2 className="text-2xl font-black">يرجى الانتظار لحظات..</h2>
                <p className="text-muted-foreground font-bold leading-relaxed px-10 text-lg">المستفهم يقوم بتقييم الجلسة الآن. خروجك قبل النهاية قد يؤثر على احتساب الجلسة.</p>
              </div>
              
              <div className="border-t pt-8 space-y-6">
                <RatingItem label="قيم جودة الجلسة تقنياً على المنصة" value={platformTechRating} onChange={setPlatformTechRating} />
                <div className="space-y-2">
                  <Label className="font-bold">ملاحظات تقنية (اختياري)</Label>
                  <Textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="اكتب رأيك..." className="rounded-xl border-2 h-24" />
                </div>
                <Button 
                  onClick={() => router.push("/requests")} 
                  disabled={request?.status === 'accepted'} 
                  className="w-full h-16 rounded-2xl font-black text-xl shadow-lg"
                >
                  {request?.status === 'accepted' ? "بانتظار إنهاء الطالب..." : "إنهاء والعودة"}
                </Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}

function RatingItem({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-2 text-right">
      <Label className="font-black text-zinc-700">{label}</Label>
      <div className="flex gap-2 justify-end">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => onChange(s)} className="transition-transform hover:scale-110">
            <Star className={`h-8 w-8 ${value >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
