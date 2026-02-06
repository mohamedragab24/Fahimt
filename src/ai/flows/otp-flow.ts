
'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP) وإرسالها عبر البريد الإلكتروني.
 * 
 * - generateAndSendOTP - دالة لإنشاء رمز وإرساله حقيقة عبر البريد أو محاكاته للواتساب.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

// تهيئة Resend بمفتاح API من متغيرات البيئة
const resend = new Resend(process.env.RESEND_API_KEY);

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

    // استخدام الذكاء الاصطناعي لصياغة الرسالة
    const { text } = await ai.generate({
      prompt: `أنت مساعد نظام "فهمني". المستخدم طلب رمز تحقق عبر ${input.method === 'email' ? 'البريد الإلكتروني' : 'الواتساب'}.
      الرمز المولد هو: ${code}
      قم بصياغة رسالة احترافية باللغة العربية تخبره بالرمز وكيفية استخدامه. لا تزد عن 30 كلمة.
      المستلم: ${input.recipient}`,
    });

    let sendSuccess = false;
    let finalMessage = text;

    if (input.method === 'email' && process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Fahmani <onboarding@resend.dev>',
          to: input.recipient,
          subject: 'رمز التحقق الخاص بك في فهمني',
          html: `<div dir="rtl" style="font-family: sans-serif; text-align: center; padding: 20px;">
                  <h2>مرحباً بك في فهمني</h2>
                  <p>رمز التحقق الخاص بك هو:</p>
                  <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 40px;">${code}</h1>
                  <p>صلاحية هذا الرمز هي 10 دقائق.</p>
                </div>`,
        });

        if (error) {
          console.error('Resend Error:', error);
        } else {
          sendSuccess = true;
          console.log('Email sent successfully via Resend:', data?.id);
        }
      } catch (err) {
        console.error('Failed to send email:', err);
      }
    } else {
      // محاكاة الإرسال للواتساب أو في حال غياب مفتاح API للبريد
      console.log(`[OTP SIMULATION TO ${input.recipient} via ${input.method}]: ${code}`);
      sendSuccess = true; // نعتبره نجح في المحاكاة لتجربة الواجهة
    }

    return {
      success: sendSuccess,
      code,
      message: sendSuccess 
        ? (input.method === 'email' && process.env.RESEND_API_KEY ? 'تم إرسال الرمز لبريدك الإلكتروني.' : finalMessage)
        : 'فشل إرسال الرمز، يرجى المحاولة لاحقاً.',
    };
  }
);
