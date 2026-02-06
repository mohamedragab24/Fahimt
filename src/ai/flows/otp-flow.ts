
'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP).
 * 
 * - generateAndSendOTP - دالة لإنشاء رمز وإرساله.
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

    const { text } = await ai.generate({
      prompt: `أنت مساعد نظام "فهمني". المستخدم طلب رمز تحقق عبر ${input.method === 'email' ? 'البريد الإلكتروني' : 'الواتساب'}.
      الرمز المولد هو: ${code}
      قم بصياغة رسالة احترافية باللغة العربية تخبره بالرمز وكيفية استخدامه.
      المستلم: ${input.recipient}`,
    });

    // ملاحظة: هنا يتم استدعاء API الإرسال الفعلي (مثل Twilio للواتساب أو Resend للبريد)
    // حالياً نقوم بمحاكاة الإرسال والرد بالنجاح
    console.log(`[OTP SENT TO ${input.recipient} via ${input.method}]: ${code}`);

    return {
      success: true,
      code,
      message: text,
    };
  }
);
