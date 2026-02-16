
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Video, Star, Loader2, ShieldCheck, CircleDot, CloudUpload, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentNonBlocking, createTransactionNonBlocking } from "@/firebase/non-blocking-updates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { uploadRecordingToDrive } from "@/app/actions/upload-recording";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
    webkitSpeechRecognition: any;
  }
}

const BANNED_WORDS = ["حمار", "غبي", "كلب", "واطي", "تفو", "شتيمة", "زفت", "يا وسخ", "يا غبي"];

type RatingFlow = 'goal' | 'ratings' | 'complaint_ask' | 'complaint_terms' | 'complaint_final';

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
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });

      // محاولة استخدام MP4 إذا كان مدعوماً، وإلا العودة لـ WebM
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsUploading(true);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fileName = `Lecture_${requestId}_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        
        // 1. الرفع إلى Firebase Storage
        if (storage) {
          const fileRef = ref(storage, `recordings/${requestId}/${fileName}`);
          const uploadTask = uploadBytesResumable(fileRef, blob);

          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => {
              console.error("Firebase Upload Error:", error);
              setIsUploading(false);
            }, 
            async () => {
              const fbUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              // 2. الرفع إلى Google Drive (نسخة ثانية)
              const formData = new FormData();
              formData.append('file', blob, fileName);
              const driveResult = await uploadRecordingToDrive(formData, fileName);

              if (requestRef) {
                updateDocumentNonBlocking(requestRef, { 
                  recordingUrl: fbUrl,
                  driveUrl: driveResult.webViewLink || null,
                  isRecorded: true,
                  recordedAt: new Date().toISOString()
                });
              }
              setIsUploading(false);
              toast({ title: "تم التوثيق المزدوج بنجاح ✅", description: "المحاضرة محفوظة في Firebase و Google Drive." });
            }
          );
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setMeetingStarted(true);
      startMeeting();
    } catch (err) {
      toast({ variant: "destructive", title: "تنبيه الرقابة", description: "يجب مشاركة الشاشة لتوثيق الجلسة وحفظ حقوقك المالية." });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const startMeeting = () => {
    if (window.JitsiMeetExternalAPI && jitsiContainerRef.current && profile && request) {
      const options = {
        roomName: `vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/Fahimni_${requestId}`,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        userInfo: { displayName: profile.fullName, email: profile.email },
        configOverwrite: { prejoinPageEnabled: false, enableWelcomePage: false }
      };
      const newApi = new window.JitsiMeetExternalAPI("8x8.vc", options);
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
      updateDocumentNonBlocking(requestRef, {
        understandingRating,
        teacherStyleRating,
        platformTechRating,
        review,
        status: isComplaint ? 'pending_review' : 'completed',
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

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin h-12 w-12" /></div>;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" />
      <div className="bg-red-600 text-white text-center py-1 font-black text-xs z-50">نظام الرقابة (Firebase + Drive) يسجل الجلسة الآن.</div>
      
      <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 z-50">
        <h1 className="text-white font-bold truncate">{request?.title}</h1>
        <Button 
          variant="destructive" 
          disabled={!meetingStarted || isUploading}
          onClick={() => profile?.role === 'mustafhem' ? (api?.executeCommand('hangup'), handleStopRecording()) : toast({ title: "تنبيه", description: "يجب على المستفهم إنهاء الجلسة." })}
        >
          {isUploading ? "جاري التوثيق..." : "إنهاء المحاضرة"}
        </Button>
      </div>

      <div className="flex-1 relative">
        {!meetingStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-8">
            <Card className="p-10 rounded-[3rem] shadow-2xl max-w-lg space-y-8 bg-white">
              <ShieldCheck size={64} className="mx-auto text-blue-600" />
              <h2 className="text-2xl font-black">بدء التوثيق السحابي</h2>
              <p className="text-muted-foreground font-bold">سيتم تسجيل المحاضرة تلقائياً ورفعها لـ Firebase Storage و Google Drive.</p>
              <Button onClick={handleStartRecording} className="w-full h-16 rounded-2xl font-black text-xl bg-primary">دخول المحاضرة الآن</Button>
            </Card>
          </div>
        ) : (
          <div id="jaas-container" ref={jitsiContainerRef} className="absolute inset-0 w-full h-full" />
        )}
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white space-y-6">
          <CloudUpload size={80} className="text-primary animate-bounce" />
          <h3 className="text-3xl font-black">جاري الحفظ السحابي</h3>
          <p className="text-xl opacity-70">يتم الرفع لـ Firebase و Drive... {Math.round(uploadProgress)}%</p>
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="rounded-[2.5rem]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right text-2xl font-black">تقييم الجلسة</DialogTitle></DialogHeader>
          {profile?.role === 'mustafhem' ? (
            <div className="space-y-6">
              {currentStep === 'goal' && (
                <div className="text-center space-y-6">
                  <h2 className="text-xl font-bold">هل فهمت المعلومة المطلوبة؟</h2>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setCurrentStep('ratings')} className="bg-green-600 h-14 px-8 rounded-xl font-bold">نعم، فهمت</Button>
                    <Button onClick={() => setCurrentStep('complaint_ask')} variant="outline" className="h-14 px-8 rounded-xl font-bold">لا، أريد مراجعة</Button>
                  </div>
                </div>
              )}
              {currentStep === 'ratings' && (
                <div className="space-y-4">
                  <div className="space-y-2"><Label className="font-bold">تقييم الشرح</Label><div className="flex gap-2 justify-end">{[1,2,3,4,5].map(s => <Star key={s} onClick={() => setUnderstandingRating(s)} className={`h-8 w-8 cursor-pointer ${understandingRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />)}</div></div>
                  <Textarea placeholder="ملاحظاتك..." value={review} onChange={(e) => setReview(e.target.value)} className="h-24 rounded-xl" />
                  <Button onClick={() => handleFinishSession(false)} disabled={isSubmitting} className="w-full h-14 rounded-xl font-bold">إرسال وإنهاء</Button>
                </div>
              )}
              {currentStep === 'complaint_ask' && (
                <div className="text-center space-y-6">
                  <ShieldAlert size={48} className="mx-auto text-red-600" />
                  <h2 className="text-xl font-bold">فتح نزاع لمراجعة الفيديو؟</h2>
                  <Button onClick={() => handleFinishSession(true)} className="w-full h-14 bg-red-600 rounded-xl font-bold">تأكيد فتح نزاع</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-10 text-center space-y-4">
              <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
              <h2 className="text-xl font-black">بانتظار تقييم الطالب...</h2>
              <Button onClick={() => router.push("/requests")} className="w-full h-14 rounded-xl font-bold">العودة للرئيسية</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
