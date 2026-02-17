"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  Video, 
  Star, 
  Loader2, 
  ShieldCheck, 
  CircleDot, 
  CloudUpload, 
  ShieldAlert, 
  Wallet, 
  Lock,
  Monitor,
  AlertCircle,
  Info
} from "lucide-react";
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

/**
 * صفحة المحاضرة المباشرة مع نظام التوثيق السحابي الإلزامي.
 */
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
      // نطلب من المستخدم مشاركة الشاشة لغرض التوثيق الأمني للجلسة
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
      // هذا الخطأ يظهر إذا رفض المستخدم مشاركة الشاشة
      toast({ 
        variant: "destructive", 
        title: "إذن التوثيق مطلوب", 
        description: "يجب الموافقة على مشاركة الشاشة (النافذة الحالية) لتفعيل نظام الرقابة والتوثيق المباشر." 
      });
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
        hasComplaint: isComplaint,
        understandingRating: understandingRating
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
      
      {!meetingStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 bg-[#F8FAFC]">
          <Card className="p-10 rounded-[3.5rem] shadow-2xl max-w-2xl space-y-8 bg-white border-none">
            <div className="bg-blue-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
              <ShieldCheck size={56} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-zinc-900">نظام التوثيق والرقابة الذكي</h2>
              <p className="text-muted-foreground font-bold text-lg leading-relaxed">
                لضمان حقوقك المالية والمعرفية، سيتم تسجيل هذه الجلسة فيديو وصوت ورفعها سحابياً للمراجعة عند الضرورة.
              </p>
            </div>

            <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-200 text-right space-y-4">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 shrink-0 mt-1" size={20} />
                <p className="text-blue-800 text-sm font-black">
                  عند الضغط على الزر أدناه، ستظهر لك نافذة من المتصفح تطلب "مشاركة الشاشة". يرجى اختيار <span className="underline">"نافذة الاجتماع"</span> أو <span className="underline">"هذا التبويب"</span> للمتابعة.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleStartRecording} 
              className="w-full h-20 rounded-[2rem] font-black text-2xl bg-primary shadow-xl hover:scale-[1.02] transition-all"
            >
              <Monitor className="ml-3 h-8 w-8" /> بدء المحاضرة والتوثيق الآن
            </Button>
            
            <p className="text-xs text-zinc-400 font-bold">بمتابعتك أنت توافق على سياسة الخصوصية وتوثيق الجلسة سحابياً.</p>
          </Card>
        </div>
      ) : (
        <>
          <div className="bg-red-600 text-white text-center py-1.5 font-black text-xs z-50 flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            نظام الرقابة السحابي يسجل الجلسة الآن لضمان حقوقك
          </div>
          <div id="jaas-container" ref={jitsiContainerRef} className="flex-1 w-full h-full" />
        </>
      )}

      {isUploading && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center text-white space-y-6">
          <CloudUpload size={80} className="text-primary animate-bounce" />
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-black">جاري الحفظ السحابي...</h3>
            <p className="text-zinc-400 font-bold">يرجى الانتظار، يتم تأمين تسجيل المحاضرة ({Math.round(uploadProgress)}%)</p>
          </div>
          <Loader2 className="animate-spin h-10 w-10 opacity-50" />
        </div>
      )}

      <Dialog open={showRatingDialog} onOpenChange={() => {}}>
        <DialogContent className="rounded-[3rem] p-10" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right text-3xl font-black flex items-center gap-3">
              <Star className="text-yellow-500 fill-current" /> تقييم المحاضرة
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-10 py-6 text-center">
            {currentStep === 'goal' && (
              <div className="space-y-8">
                <div className="bg-muted/30 p-8 rounded-[2rem] space-y-4">
                  <h2 className="text-2xl font-black text-zinc-800 leading-tight">هل تم تحقيق الهدف من الاستفهام وفهمت المعلومة؟</h2>
                  <p className="text-muted-foreground font-bold italic">"{request?.goal}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => setCurrentStep('ratings')} className="bg-green-600 hover:bg-green-700 h-16 rounded-2xl font-black text-xl shadow-lg">نعم، فهمت</Button>
                  <Button onClick={() => setCurrentStep('complaint_ask')} variant="outline" className="h-16 rounded-2xl font-black text-xl text-red-600 border-red-200 hover:bg-red-50">لا، أريد مراجعة</Button>
                </div>
              </div>
            )}

            {currentStep === 'ratings' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-xl font-black text-zinc-700 block">كيف تقيم أداء المفهم في هذه الجلسة؟</Label>
                  <div className="flex gap-3 justify-center">
                    {[1,2,3,4,5].map(s => (
                      <button 
                        key={s} 
                        onClick={() => setUnderstandingRating(s)}
                        className="transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star size={56} className={`${understandingRating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'} transition-colors`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="font-black text-right block">ملاحظاتك (اختياري)</Label>
                  <Textarea 
                    placeholder="اكتب كلمة شكر أو ملاحظة للمفهم..." 
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="h-32 rounded-2xl border-2"
                  />
                </div>

                <Button onClick={() => handleFinishSession(false)} disabled={understandingRating === 0 || isSubmitting} className="w-full h-16 rounded-2xl font-black text-xl shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "إنهاء الجلسة وتحويل الأرباح"}
                </Button>
              </div>
            )}

            {currentStep === 'complaint_ask' && (
              <div className="space-y-8 animate-in fade-in zoom-in">
                <div className="bg-red-50 p-8 rounded-[2rem] border-2 border-dashed border-red-200 space-y-4">
                  <ShieldAlert size={64} className="mx-auto text-red-600" />
                  <h2 className="text-2xl font-black text-red-900">فتح نزاع رسمي</h2>
                  <p className="text-red-800 font-bold">سيتم تعليق أرباح المفهم فوراً وسيقوم فريق الرقابة بمراجعة فيديو المحاضرة للفصل بينكما.</p>
                </div>
                <Button onClick={() => handleFinishSession(true)} disabled={isSubmitting} className="w-full h-16 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-xl shadow-xl">
                  تأكيد فتح النزاع والمراجعة
                </Button>
                <Button variant="ghost" onClick={() => setCurrentStep('goal')} className="font-bold text-zinc-400">تراجع، العودة للخلف</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RatingStat({ label, value }: { label: string, value?: number }) {
  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${Number(value) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200'}`} />)}
      </div>
      <span className="font-bold text-zinc-600">{label}</span>
    </div>
  );
}
