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
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsUploading(true);
        toast({ title: "جاري حفظ المحاضرة...", description: "يتم الآن تأمين النسخة المسجلة في السحابة." });
        
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const fileName = `Lecture_${requestId}_${Date.now()}.webm`;
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
              toast({ title: "تم التوثيق بنجاح", description: "المحاضرة محفوظة الآن في سجلات الرقابة." });
            }
          );
        } catch (err) {
          console.error("Storage error:", err);
          setIsUploading(false);
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setMeetingStarted(true);
      startMeeting();
    } catch (err) {
      console.error("Recording error:", err);
      toast({ variant: "destructive", title: "تنبيه الرقابة", description: "يجب تفعيل تسجيل الشاشة للدخول للمحاضرة لضمان حقك." });
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
      banReason: `حظر تلقائي من السيستم: استخدام لفظ خارج (${word}) أثناء المحاضرة.`,
      bannedAt: new Date().toISOString(),
      bannedBy: 'system'
    });
    toast({ variant: "destructive", title: "تم حظر حسابك", description: "لقد انتهكت سياسة الاستخدام وتم حظر حسابك تلقائياً." });
    if (api) api.executeCommand('hangup');
    handleStopRecording();
    router.push("/");
  };

  useEffect(() => {
    if (requestRef && profile && requestId && meetingStarted) {
      const field = profile.role === 'mufhem' ? 'teacherJoined' : 'studentJoined';
      updateDocumentNonBlocking(requestRef, { 
        [field]: true,
        lastLiveSession: new Date().toISOString()
      });
    }
  }, [requestRef, profile, requestId, meetingStarted]);

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
          autoRecord: false, 
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat',
            'settings', 'raisehand', 'videoquality', 'filmstrip', 'tileview', 'help', 'mute-everyone'
          ],
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
      <p className="text-xl font-black">جاري تأمين غرفة المحاضرة والرقابة...</p>
    </div>
  );

  const isStudent = profile?.role === 'mustafhem';

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" />
      
      <div className="bg-red-500 text-white text-center py-2 font-black text-sm animate-pulse shadow-lg z-[60]">
        {isRecording ? "المحاضرة قيد التسجيل والتوثيق المباشر" : "التزم بآداب الحوار؛ الجلسة خاضعة للرقابة الصارمة"}
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg"><Video className="text-primary h-5 w-5" /></div>
          <h1 className="text-white font-bold truncate max-w-[200px] md:max-w-md">{request?.title}</h1>
          {isRecording && <Badge className="bg-red-600 text-white animate-pulse"><CircleDot size={12} className="ml-1" /> تسجيل مفعل</Badge>}
        </div>
        
        <Button 
          variant="destructive" 
          size="sm" 
          disabled={!meetingStarted || isUploading}
          onClick={() => { 
            if (!isStudent) {
              toast({ variant: "destructive", title: "تنبيه للمفهم", description: "يجب على الطالب إنهاء الجلسة أولاً لضمان حفظ سجل الرقابة والتقييم وتحويل أرباحك." });
            } else {
              api?.executeCommand('hangup'); 
              handleStopRecording();
            }
          }} 
          className="rounded-full px-6 font-black shadow-lg"
        >
          {isUploading ? <><Loader2 className="animate-spin ml-2" /> جاري التوثيق...</> : "إنهاء المحاضرة"}
        </Button>
      </div>

      <div className="flex-1 relative bg-zinc-950 flex flex-col items-center justify-center">
        {!meetingStarted ? (
          <Card className="w-full max-w-lg rounded-[2.5rem] p-10 bg-white shadow-2xl text-center space-y-8 animate-in zoom-in">
            <div className="bg-blue-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
              <ShieldAlert size={48} />
            </div>
            <div className="space-y-2 px-6">
              <h2 className="text-3xl font-black text-zinc-900">بدء المحاضرة الموثقة</h2>
              <p className="text-muted-foreground font-bold leading-relaxed">
                لسلامتك وحفظ حقوقك المالية والمعرفية، يتم تسجيل المحاضرة تلقائياً ورفعها لـ Firebase Storage فور الانتهاء. يرجى تفعيل "مشاركة الشاشة" للمتابعة.
              </p>
            </div>
            <Button 
              onClick={handleStartRecording} 
              className="w-full h-20 rounded-3xl font-black text-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"
            >
              <CircleDot className="ml-3 h-8 w-8 animate-pulse" /> دخول وتوثيق الجلسة
            </Button>
            <div className="p-4 bg-zinc-50 rounded-2xl flex items-center gap-3 text-zinc-500 text-xs font-bold justify-center">
              <ShieldCheck size={16} className="text-green-600" />
              <span>نظام الرقابة الفوري (Firebase Cloud) مفعّل</span>
            </div>
          </Card>
        ) : (
          <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
        )}
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white space-y-8">
          <div className="relative">
            <CloudUpload size={100} className="text-primary animate-bounce" />
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black">جاري توثيق المحاضرة سحابياً</h3>
            <p className="text-xl opacity-70">يتم الآن رفع النسخة الأصلية لـ Firebase Storage... {Math.round(uploadProgress)}%</p>
            <div className="w-64 h-3 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl p-8" dir="rtl">
          <DialogHeader><DialogTitle className="text-right text-2xl font-black">تقييم الجلسة التعليمية</DialogTitle></DialogHeader>
          
          {isStudent ? (
            <div className="space-y-6">
              {currentStep === 'goal' && (
                <div className="text-center space-y-8 py-6">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-primary"><MessageSquare size={40} /></div>
                  <h2 className="text-2xl font-black text-zinc-800">هل فهمت وحققت هدفك من الاستفهام؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => { setGoalAchieved(true); setCurrentStep('ratings'); }} className="h-16 px-12 rounded-2xl bg-green-600 hover:bg-green-700 text-xl font-black">نعم</Button>
                    <Button onClick={() => { setGoalAchieved(false); setCurrentStep('complaint_ask'); }} variant="outline" className="h-16 px-12 rounded-2xl border-2 text-xl font-black">لا</Button>
                  </div>
                </div>
              )}
              {currentStep === 'ratings' && (
                <div className="space-y-6">
                  <RatingItem label="قيم مدى فهمك لهذا الاستفهام" value={understandingRating} onChange={setUnderstandingRating} />
                  <RatingItem label="قيم أسلوب وشرح المفهم" value={teacherStyleRating} onChange={setTeacherStyleRating} />
                  <RatingItem label="قيم جودة الجلسة تقنياً على المنصة" value={platformTechRating} onChange={setPlatformTechRating} />
                  <div className="space-y-2 text-right"><Label className="font-bold">اكتب رأيك...</Label><Textarea value={review} onChange={(e) => setReview(e.target.value)} className="rounded-xl border-2" /></div>
                  <Button onClick={() => handleFinishSession(false)} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black text-lg">إرسال التقييم وإنهاء</Button>
                </div>
              )}
              {currentStep === 'complaint_ask' && (
                <div className="text-center space-y-8 py-6">
                  <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-orange-600"><ShieldAlert size={40} /></div>
                  <h2 className="text-2xl font-black text-zinc-800 px-4">هل تريد تقديم شكوى وطلب مراجعة للجلسة؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setCurrentStep('complaint_terms')} className="h-16 px-12 rounded-2xl bg-orange-600 text-xl font-black">نعم</Button>
                    <Button onClick={() => setCurrentStep('ratings')} variant="outline" className="h-16 px-12 rounded-2xl text-xl font-black">لا</Button>
                  </div>
                </div>
              )}
              {currentStep === 'complaint_terms' && (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200 text-sm space-y-4">
                    <h3 className="font-black text-blue-800 text-lg flex items-center gap-2"><Info size={20}/> تنبيهات الشكوى:</h3>
                    <ul className="list-decimal list-inside space-y-2 text-blue-900 font-bold">
                      <li>سيتم مراجعة فيديو المحاضرة المرفوع على Firebase من قبل الإدارة.</li>
                      <li>إذا ثبت تقصير المفهم، سيتم إعادة المبلغ لك.</li>
                    </ul>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => handleFinishSession(true)} className="flex-1 h-14 rounded-2xl bg-red-600 font-black">استكمال الشكوى</Button>
                    <Button onClick={() => setCurrentStep('ratings')} variant="outline" className="flex-1 h-14 rounded-2xl font-black">الإقرار بالتحصيل</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 py-6 text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-bounce"><Loader2 size={40} /></div>
              <h2 className="text-2xl font-black">يرجى الانتظار لحظات..</h2>
              <p className="text-muted-foreground font-bold px-10 text-lg">المستفهم يقوم بتقييم الجلسة الآن. خروجك قبل النهاية قد يؤثر على احتساب الجلسة.</p>
              <Button onClick={() => router.push("/requests")} disabled={request?.status === 'accepted'} className="w-full h-16 rounded-2xl font-black text-xl shadow-lg">
                {request?.status === 'accepted' ? "بانتظار إنهاء الطالب..." : "إنهاء والعودة"}
              </Button>
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
