
'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP) وإرسالها عبر Infobip WhatsApp و Email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OTPInputSchema = z.object({
  recipient: z.string().describe('البريد الإلكتروني أو رقم الهاتف المستهدف (بصيغة دولية كاملة).'),
  method: z.enum(['email', 'whatsapp']).describe('وسيلة الإرسال المطلوبة.'),
});

const OTPOutputSchema = z.object({
  success: z.boolean().describe('هل تم إرسال الرمز بنجاح.'),
  code: z.string().describe('الرمز الذي تم إنشاؤه.'),
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
    
    console.log(`[OTP SYSTEM] Request for: ${input.recipient} | Code: ${code} | Method: ${input.method}`);

    let sendSuccess = false;
    // المفتاح الجديد المقدم من المستخدم
    const apiKey = 'App d1d0cecac245ff6225debf8f02de3c36-4d903627-05b8-4656-bdc1-d3ab395a9e47';
    const baseUrl = '3dg8lv.api.infobip.com';

    if (input.method === 'email') {
      try {
        const response = await fetch(`https://${baseUrl}/email/4/messages`, {
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
            'text': `رمز التحقق الخاص بك لمنصة فهمني هو: ${code}`
          })
        });
        if (response.ok) sendSuccess = true;
      } catch (err) {
        console.error('[OTP EMAIL ERROR]', err);
      }
    } else if (input.method === 'whatsapp') {
      try {
        // تنظيف الرقم من أي رموز لضمان قبول Infobip للرقم الدولي
        let formattedPhone = input.recipient.trim().replace(/\D/g, ''); 

        const response = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            from: "447860099299", // الرقم الافتراضي لـ Infobip للرسائل النصية
            to: formattedPhone,
            content: {
              text: `رمز التحقق الخاص بك لمنصة فهمني هو: ${code}`
            }
          })
        });

        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP WHATSAPP SUCCESS] to ${formattedPhone}`);
        } else {
          const errorData = await response.json();
          console.error('[INFOBIP WHATSAPP ERROR]', errorData);
        }
      } catch (err: any) {
        console.error('[INFOBIP WHATSAPP FETCH ERROR]', err.message);
      }
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
