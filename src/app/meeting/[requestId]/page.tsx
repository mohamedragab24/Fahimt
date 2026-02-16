
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Video, Star, Loader2, Info, ShieldAlert, MessageSquare, Record, CircleDot, StopCircle, CloudUpload, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking, createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
    webkitSpeechRecognition: any;
  }
}

const BANNED_WORDS = ["حمار", "غبي", "كلب", "واطي", "تفو", "شتيمة", "زفت", "يا وسخ", "يا غبي"];

type RatingFlow = 'goal' | 'ratings' | 'complaint_ask' | 'complaint_terms' | 'complaint_final' | 'technical_only';

export default function MeetingPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user, storage } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [meetingStarted, setMeetingStarted] = useState(false);
  
  // Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleStartRecording = async () => {
    try {
      // طلب مشاركة الشاشة مع الصوت
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });

      // تحديد أفضل صيغة مدعومة (تلقائياً يحولها النظام لـ MP4-compatible blob)
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsUploading(true);
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const fileName = `Recorded_Lecture_${requestId}_${Date.now()}.webm`;
        const storagePath = `recordings/${requestId}/${fileName}`;
        const fileRef = ref(storage, storagePath);

        try {
          const uploadTask = uploadBytesResumable(fileRef, blob);

          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            }, 
            (error) => {
              console.error("Upload failed:", error);
              toast({ variant: "destructive", title: "فشل الرفع", description: "تعذر حفظ التسجيل في السجلات السحابية." });
              setIsUploading(false);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              if (requestRef) {
                updateDocumentNonBlocking(requestRef, { 
                  recordingUrl: downloadURL,
                  isRecorded: true,
                  recordedAt: new Date().toISOString()
                });
              }
              setIsUploading(false);
              toast({ title: "تم التوثيق السحابي", description: "المحاضرة محفوظة الآن في سجلات الرقابة." });
            }
          );
        } catch (err) {
          console.error("Storage error:", err);
          setIsUploading(false);
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start(1000); // التقاط أجزاء كل ثانية لضمان الاستقرار
      setMediaRecorder(recorder);
      setIsRecording(true);
      setMeetingStarted(true);
      startMeeting();
    } catch (err) {
      console.error("Recording error:", err);
      toast({ 
        variant: "destructive", 
        title: "تنبيه الرقابة الصارمة", 
        description: "يجب تفعيل 'مشاركة الشاشة' للدخول للمحاضرة؛ هذا الإجراء يحمي حقك المالي ويوثق الجلسة." 
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window && user && profile) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ar-SA';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('')
          .toLowerCase();

        const detectedBannedWord = BANNED_WORDS.find(word => transcript.includes(word));

        if (detectedBannedWord) {
          handleAutoBan(detectedBannedWord);
          recognition.stop();
        }
      };

      recognition.onerror = () => { try { recognition.start(); } catch(e) {} };
      recognition.onend = () => { try { recognition.start(); } catch(e) {} };

      try { recognition.start(); } catch(e) {}
      return () => { recognition.stop(); };
    }
  }, [user, profile]);

  const handleAutoBan = (word: string) => {
    if (!userRef || !user) return;
    updateDocumentNonBlocking(userRef, {
      status: 'blocked',
      banReason: `حظر تلقائي: استخدام لفظ خارج (${word}) أثناء المحاضرة الموثقة.`,
      bannedAt: new Date().toISOString(),
      bannedBy: 'system'
    });
    toast({ variant: "destructive", title: "تم حظر الحساب فوراً", description: "لقد انتهكت سياسة الحوار وتم طردك من الجلسة." });
    if (api) api.executeCommand('hangup');
    handleStopRecording();
    router.push("/");
  };

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
        }
      };
      const newApi = new window.JitsiMeetExternalAPI(domain, options);
      setApi(newApi);

      newApi.addEventListener('videoConferenceLeft', () => {
        handleStopRecording();
        setShowRatingDialog(true);
      });
    }
  };

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
      }
      router.push("/requests");
    }
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-xl font-black">جاري تأمين الغرفة الموثقة...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" />
      
      <div className="bg-red-600 text-white text-center py-2 font-black text-xs animate-pulse z-[60] shadow-md">
        نظام الرقابة السحابي (Firebase) يسجل الجلسة الآن لحفظ الحقوق.
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg"><Video className="text-primary h-5 w-5" /></div>
          <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-md">{request?.title}</h1>
          {isRecording && <Badge className="bg-red-600 text-white animate-pulse"><CircleDot size={12} className="ml-1" /> جاري التوثيق</Badge>}
        </div>
        
        <Button 
          variant="destructive" 
          disabled={!meetingStarted || isUploading}
          onClick={() => { 
            if (profile?.role !== 'mustafhem') {
              toast({ title: "تنبيه للمفهم", description: "يجب على المستفهم إنهاء الجلسة لضمان تحويل أرباحك." });
            } else {
              api?.executeCommand('hangup'); 
              handleStopRecording();
            }
          }} 
          className="rounded-full px-8 font-black"
        >
          {isUploading ? <><Loader2 className="animate-spin ml-2" /> جاري الحفظ السحابي...</> : "إنهاء المحاضرة"}
        </Button>
      </div>

      <div className="flex-1 relative bg-zinc-950">
        {!meetingStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg space-y-8 border-4 border-primary/10">
              <div className="bg-blue-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600">
                <ShieldCheck size={64} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-zinc-900">بدء التوثيق السحابي</h2>
                <p className="text-muted-foreground font-bold leading-relaxed">
                  سيتم تسجيل المحاضرة تلقائياً ورفعها لـ Firebase Storage. يرجى الضغط على الزر أدناه ثم اختيار "شاشة كاملة" للمتابعة.
                </p>
              </div>
              <Button onClick={handleStartRecording} className="w-full h-20 rounded-3xl font-black text-2xl bg-primary shadow-xl hover:scale-105 transition-all">
                <CircleDot className="ml-3 h-8 w-8 animate-pulse" /> دخول المحاضرة الآن
              </Button>
            </div>
          </div>
        ) : (
          <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
        )}
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center text-white space-y-10">
          <div className="relative">
            <CloudUpload size={120} className="text-primary animate-bounce" />
            <div className="absolute inset-0 border-8 border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-5xl font-black">جاري التوثيق النهائي</h3>
            <p className="text-2xl opacity-70">يتم رفع المحاضرة لـ Firebase Storage... {Math.round(uploadProgress)}%</p>
            <div className="w-80 h-4 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8" dir="rtl">
          <DialogHeader><DialogTitle className="text-right text-2xl font-black">تقييم الجلسة الموثقة</DialogTitle></DialogHeader>
          {profile?.role === 'mustafhem' ? (
            <div className="space-y-6">
              {currentStep === 'goal' && (
                <div className="text-center space-y-8 py-6">
                  <h2 className="text-2xl font-black text-zinc-800">هل حققت هدفك من الاستفهام؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => { setGoalAchieved(true); setCurrentStep('ratings'); }} className="h-16 px-12 rounded-2xl bg-green-600 text-xl font-black">نعم، فهمت</Button>
                    <Button onClick={() => { setGoalAchieved(false); setCurrentStep('complaint_ask'); }} variant="outline" className="h-16 px-12 rounded-2xl border-2 text-xl font-black">لا، أريد مراجعة</Button>
                  </div>
                </div>
              )}
              {currentStep === 'ratings' && (
                <div className="space-y-6">
                  <RatingItem label="قيم جودة الشرح" value={understandingRating} onChange={setUnderstandingRating} />
                  <RatingItem label="قيم أسلوب الخبير" value={teacherStyleRating} onChange={setTeacherStyleRating} />
                  <div className="space-y-2 text-right"><Label className="font-bold">ملاحظاتك (اختياري)</Label><Textarea value={review} onChange={(e) => setReview(e.target.value)} className="rounded-xl border-2 h-32" /></div>
                  <Button onClick={() => handleFinishSession(false)} disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black text-xl shadow-lg">حفظ التقييم وإنهاء</Button>
                </div>
              )}
              {currentStep === 'complaint_ask' && (
                <div className="text-center space-y-8 py-6">
                  <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-orange-600"><ShieldAlert size={40} /></div>
                  <h2 className="text-2xl font-black">هل تود فتح نزاع لمراجعة المحاضرة؟</h2>
                  <p className="text-muted-foreground font-bold">سيقوم فريقنا بمشاهدة التسجيل المحفوظ لفض النزاع.</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => handleFinishSession(true)} className="h-16 px-12 rounded-2xl bg-red-600 text-xl font-black">نعم، افتح نزاع</Button>
                    <Button onClick={() => setCurrentStep('ratings')} variant="outline" className="h-16 px-12 rounded-2xl text-xl font-black">لا، سأقيم فقط</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-2xl font-black">بانتظار تقييم الطالب...</h2>
              <p className="text-muted-foreground font-bold">سيتم تحويل أرباحك فور تأكيد الطالب فهمه للمعلومة.</p>
              <Button onClick={() => router.push("/requests")} className="w-full h-16 rounded-2xl font-black text-xl">العودة للرئيسية</Button>
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
          <button key={s} onClick={() => onChange(s)}>
            <Star className={`h-10 w-10 ${value >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
