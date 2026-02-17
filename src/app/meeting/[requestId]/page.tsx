
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Video, Star, Loader2, ShieldCheck, CircleDot, CloudUpload, ShieldAlert, Wallet, Lock } from "lucide-react";
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
  }
}

type RatingFlow = 'goal' | 'ratings' | 'complaint_ask';

export default function MeetingPage() {
  const { requestId } = useParams();
  const router = useRouter();
  const { user, storage } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<any>(null);
  const [meetingStarted, setMeetingStarted] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<RatingFlow>('goal');
  
  const [understandingRating, setUnderstandingRating] = useState(0);
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
    if (request?.status !== 'paid' && !profile?.isAdmin) {
      toast({ variant: "destructive", title: "تنبيه الأمان", description: "لا يمكن بدء المحاضرة قبل إتمام عملية الدفع." });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });

      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsUploading(true);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fileName = `Lecture_${requestId}_${Date.now()}.mp4`;
        
        if (storage) {
          const fileRef = ref(storage, `recordings/${requestId}/${fileName}`);
          const uploadTask = uploadBytesResumable(fileRef, blob);

          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            null, 
            async () => {
              const fbUrl = await getDownloadURL(uploadTask.snapshot.ref);
              const formData = new FormData();
              formData.append('file', blob, fileName);
              const driveResult = await uploadRecordingToDrive(formData, fileName);

              if (requestRef) {
                updateDocumentNonBlocking(requestRef, { 
                  recordingUrl: fbUrl,
                  driveUrl: driveResult.webViewLink || null,
                  isRecorded: true
                });
              }
              setIsUploading(false);
              toast({ title: "تم التوثيق السحابي بنجاح" });
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
      toast({ variant: "destructive", title: "تنبيه", description: "يجب مشاركة الشاشة لتوثيق الجلسة." });
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
        configOverwrite: { prejoinPageEnabled: false }
      };
      const newApi = new window.JitsiMeetExternalAPI("8x8.vc", options);
      setApi(newApi);
      newApi.addEventListener('videoConferenceLeft', () => {
        if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop();
        setShowRatingDialog(true);
      });
    }
  };

  const handleFinishSession = async (isComplaint: boolean = false) => {
    setIsSubmitting(true);
    if (requestRef && request && firestore) {
      updateDocumentNonBlocking(requestRef, {
        status: isComplaint ? 'pending_review' : 'completed',
        completedAt: new Date().toISOString(),
        hasComplaint: isComplaint
      });

      if (!isComplaint) {
        const teacherEarning = request.amount * 0.8;
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

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-white" /></div>;

  if (request?.status !== 'paid' && !profile?.isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-6 text-center space-y-8" dir="rtl">
        <div className="bg-red-500/20 p-10 rounded-[3rem] border-4 border-dashed border-red-500 animate-pulse">
          <Lock size={80} className="mx-auto text-red-500" />
        </div>
        <h2 className="text-4xl font-black">المحاضرة غير متاحة بعد</h2>
        <p className="text-xl text-zinc-400 max-w-lg">يجب على المستفهم إتمام عملية الدفع أولاً لكي تفتح غرفة المحاضرة ويتم تفعيل نظام التوثيق.</p>
        <Button onClick={() => router.push(profile?.role === 'mustafhem' ? `/requests/${requestId}` : '/')} className="h-16 px-12 rounded-2xl text-xl font-black bg-primary">
          {profile?.role === 'mustafhem' ? "الذهاب لصفحة الدفع" : "العودة للرئيسية"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden" dir="rtl">
      <Script src="https://8x8.vc/vpaas-magic-cookie-1fbd16d85bf84be0aaba7317c17f25dd/external_api.js" />
      <div className="bg-red-600 text-white text-center py-1 font-black text-xs z-50">نظام الرقابة (Firebase + Drive) يسجل الجلسة الآن.</div>
      
      {!meetingStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
          <Card className="p-10 rounded-[3rem] shadow-2xl max-w-lg space-y-8 bg-white">
            <ShieldCheck size={64} className="mx-auto text-blue-600" />
            <h2 className="text-2xl font-black">جاهز للبدء؟</h2>
            <p className="text-muted-foreground font-bold">سيتم توثيق هذه المحاضرة سحابياً لضمان حقوق الطرفين.</p>
            <Button onClick={handleStartRecording} className="w-full h-16 rounded-2xl font-black text-xl bg-primary">دخول المحاضرة الآن</Button>
          </Card>
        </div>
      ) : (
        <div id="jaas-container" ref={jitsiContainerRef} className="flex-1 w-full h-full" />
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white space-y-6">
          <CloudUpload size={80} className="text-primary animate-bounce" />
          <h3 className="text-3xl font-black">جاري الحفظ السحابي... {Math.round(uploadProgress)}%</h3>
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="rounded-[2.5rem]" dir="rtl">
          <DialogHeader><DialogTitle className="text-right text-2xl font-black">تقييم الجلسة</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6 text-center">
            {currentStep === 'goal' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">هل فهمت المعلومة المطلوبة؟</h2>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setCurrentStep('ratings')} className="bg-green-600 h-14 px-8 rounded-xl font-bold">نعم، فهمت</Button>
                  <Button onClick={() => setCurrentStep('complaint_ask')} variant="outline" className="h-14 px-8 rounded-xl font-bold text-red-600">لا، أريد مراجعة</Button>
                </div>
              </div>
            )}
            {currentStep === 'ratings' && (
              <div className="space-y-4">
                <Label className="font-bold">تقييمك للمفهم</Label>
                <div className="flex gap-2 justify-center">{[1,2,3,4,5].map(s => <Star key={s} onClick={() => setUnderstandingRating(s)} className={`h-10 w-10 cursor-pointer ${understandingRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />)}</div>
                <Button onClick={() => handleFinishSession(false)} className="w-full h-14 rounded-xl font-bold">إنهاء الجلسة بنجاح</Button>
              </div>
            )}
            {currentStep === 'complaint_ask' && (
              <div className="space-y-6">
                <ShieldAlert size={48} className="mx-auto text-red-600" />
                <h2 className="text-xl font-bold">فتح نزاع؟ سيتم مراجعة الفيديو يدوياً.</h2>
                <Button onClick={() => handleFinishSession(true)} className="w-full h-14 bg-red-600 rounded-xl font-bold">تأكيد فتح النزاع</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
