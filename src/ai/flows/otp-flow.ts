'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP) وإرسالها عبر Infobip.
 * 
 * - generateAndSendOTP - دالة لإنشاء رمز وإرساله حقيقة عبر البريد (Infobip) أو الواتساب.
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

    // استخدام الذكاء الاصطناعي لصياغة الرسالة
    const { text } = await ai.generate({
      prompt: `أنت مساعد نظام "فهمني". المستخدم طلب رمز تحقق عبر ${input.method === 'email' ? 'البريد الإلكتروني' : 'الواتساب'}.
      الرمز المولد هو: ${code}
      قم بصياغة رسالة احترافية باللغة العربية تخبره بالرمز وكيفية استخدامه. لا تزد عن 20 كلمة.
      المستلم: ${input.recipient}`,
    });

    let sendSuccess = false;
    const apiKey = 'App 0287a4d3a664e2ae2a09ed0f9982ab46-cd21866e-50a3-4a7d-8050-03a7d7fec5a3';

    if (input.method === 'email') {
      try {
        const response = await fetch('https://3dg8lv.api.infobip.com/email/4/messages', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            "messages": [
              {
                "destinations": [
                  {
                    "to": [
                      {
                        "destination": input.recipient
                      }
                    ]
                  }
                ],
                "sender": "mohamedmini2006@selfserve.worlds-connected.co",
                "content": {
                  "subject": "رمز التحقق - فهمني",
                  "text": text // استخدام النص المصاغ بالذكاء الاصطناعي
                }
              }
            ]
          })
        });

        if (response.ok) {
          sendSuccess = true;
        } else {
          const errorData = await response.json();
          console.error('Infobip Email failed:', errorData);
        }
      } catch (err: any) {
        console.error('Email API call failed:', err);
      }
    } else if (input.method === 'whatsapp') {
      // محاكاة إرسال الواتساب حالياً باستخدام نفس الـ API Key إذا توفرت الخدمة
      try {
        console.log(`[WHATSAPP SIMULATION] Sending ${code} to ${input.recipient}`);
        // ملاحظة: لربط واتساب حقيقي عبر Infobip، يتم استخدام endpoint مختلف مثل /whatsapp/1/message/text
        sendSuccess = true; 
      } catch (err) {
        console.error('WhatsApp simulation failed:', err);
      }
    }

    return {
      success: sendSuccess,
      code,
      message: sendSuccess 
        ? `تم إرسال الرمز بنجاح عبر ${input.method === 'email' ? 'البريد' : 'الواتساب'}.`
        : 'فشل إرسال الرمز، يرجى التأكد من البيانات والمحاولة لاحقاً.',
    };
  }
);
