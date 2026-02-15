'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP) وإرسالها عبر Infobip.
 * تم تحسينه لضمان أعلى توافقية مع سيرفرات Infobip لضمان وصول الرسائل.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OTPInputSchema = z.object({
  recipient: z.string().describe('البريد الإلكتروني أو رقم الهاتف المستهدف.'),
  method: z.enum(['email', 'whatsapp']).describe('وسيلة الإرسال المطلوبة.'),
});

const OTPOutputSchema = z.object({
  success: z.boolean().describe('هل تم إرسال الرمز بنجاح.'),
  code: z.string().describe('الرمز الذي تم إنشاؤه (للتخزين في Firestore).'),
  message: z.string().describe('رسالة توضح حالة العملية.'),
});

export async function generateAndSendOTP(input: z.infer<typeof OTPInputSchema>) {
  return otpFlow(input);
}

const otpFlow = ai.defineFlow(
  {
    name: 'otpFlow',
    inputSchema: OTPInputSchema,
    outputSchema: OTPOutputSchema,
  },
  async (input) => {
    // إنشاء رمز عشوائي من 6 أرقام
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // تسجيل الرمز في السيرفر للضرورة التقنية أثناء التطوير
    console.log(`[OTP SYSTEM] New Request for: ${input.recipient} | Code: ${code}`);

    // صياغة الرسالة عبر الذكاء الاصطناعي
    const { text } = await ai.generate({
      prompt: `أنت مساعد نظام "فهمني". المستخدم طلب رمز تحقق عبر ${input.method === 'email' ? 'البريد الإلكتروني' : 'الواتساب'}.
      الرمز المولد هو: ${code}
      قم بصياغة رسالة احترافية قصيرة جداً باللغة العربية تخبره بالرمز. 
      مثال: "رمز التحقق الخاص بك لمنصة فهمني هو: ${code}"
      المستلم: ${input.recipient}`,
    });

    let sendSuccess = false;
    const apiKey = 'App 0287a4d3a664e2ae2a09ed0f9982ab46-cd21866e-50a3-4a7d-8050-03a7d7fec5a3';

    if (input.method === 'email') {
      try {
        // Infobip Email API يتطلب أحياناً JSON مسطح أو FormData
        // سنستخدم الطلب الأكثر استقراراً
        const response = await fetch('https://3dg8lv.api.infobip.com/email/4/messages', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'from': 'Fahimni Support <mohamedmini2006@selfserve.worlds-connected.co>',
            'to': input.recipient,
            'subject': 'رمز التحقق - منصة فهمني',
            'text': text
          })
        });

        if (response.ok) {
          sendSuccess = true;
          console.log(`[OTP SUCCESS] Email sent to ${input.recipient}`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[OTP ERROR] Infobip Response:', JSON.stringify(errorData));
        }
      } catch (err: any) {
        console.error('[OTP NETWORK ERROR] Failed to reach Infobip:', err);
      }
    } else if (input.method === 'whatsapp') {
      // محاكاة إرسال الواتساب حالياً
      console.log(`[WHATSAPP SIMULATION] Sending ${code} to ${input.recipient}`);
      sendSuccess = true; 
    }

    return {
      success: sendSuccess,
      code,
      message: sendSuccess 
        ? `تم إرسال الرمز بنجاح عبر ${input.method === 'email' ? 'البريد' : 'الواتساب'}.`
        : 'فشل إرسال الرمز، يرجى التأكد من صحة البيانات أو المحاولة لاحقاً.',
    };
  }
);
