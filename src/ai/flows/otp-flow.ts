'use server';
/**
 * @fileOverview تدفق Genkit المطور لإدارة رموز التحقق (OTP) عبر Infobip.
 * تم تحديث الهيكلية لتتطابق مع معايير Infobip JSON الاحترافية.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OTPInputSchema = z.object({
  recipient: z.string().describe('البريد الإلكتروني أو رقم الهاتف المستهدف.'),
  method: z.enum(['email', 'whatsapp']).describe('وسيلة الإرسال.'),
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
    
    console.log(`[OTP SYSTEM] Start Request for: ${input.recipient} | Method: ${input.method}`);

    let sendSuccess = false;
    let errorMessage = '';
    
    const apiKey = 'App d1d0cecac245ff6225debf8f02de3c36-4d903627-05b8-4656-bdc1-d3ab395a9e47';
    const baseUrl = 'pdp4k3.api.infobip.com';

    if (input.method === 'email') {
      try {
        const response = await fetch(`https://${baseUrl}/email/4/messages`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            "messages": [
              {
                "destinations": [
                  {
                    "to": [
                      {
                        "destination": input.recipient.trim().toLowerCase()
                      }
                    ]
                  }
                ],
                "sender": "resraa355@selfserve.worlds-connected.co",
                "content": {
                  "subject": "رمز التحقق - منصة فهمني",
                  "text": `مرحباً، رمز التحقق الخاص بك هو: ${code}`
                }
              }
            ]
          })
        });

        const responseData = await response.json();
        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP EMAIL SUCCESS] MsgID: ${responseData.messages?.[0]?.messageId}`);
        } else {
          console.error('[INFOBIP EMAIL ERROR]', responseData);
          errorMessage = 'السيرفر رفض إرسال البريد، تأكد من صحة العنوان.';
        }
      } catch (err: any) {
        console.error('[OTP EMAIL FETCH ERROR]', err.message);
        errorMessage = 'خطأ في الاتصال بسيرفر البريد.';
      }
    } else if (input.method === 'whatsapp') {
      try {
        // تنظيف الرقم تماماً: أرقام فقط لضمان توافق Infobip
        let formattedPhone = input.recipient.trim().replace(/\D/g, ''); 

        console.log(`[INFOBIP WHATSAPP ATTEMPT] Target: ${formattedPhone}`);

        const response = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            "from": "447860099299", // رقم Sandbox الافتراضي
            "to": formattedPhone,
            "content": {
              "text": `رمز التحقق لمنصة فهمني هو: ${code}`
            }
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP WHATSAPP ACCEPTED] MsgID: ${responseData.messages?.[0]?.messageId}`);
        } else {
          console.error('[INFOBIP WHATSAPP REJECTED]', responseData);
          errorMessage = responseData.requestError?.serviceException?.text || 'تأكد من تفعيل Sandbox بإرسال كلمة START للرقم.';
        }
      } catch (err: any) {
        console.error('[INFOBIP WHATSAPP CRASH]', err.message);
        errorMessage = 'خطأ في الشبكة أثناء إرسال الواتساب.';
      }
    }

    return {
      success: sendSuccess,
      code: sendSuccess ? code : '', 
      message: sendSuccess 
        ? `تم إرسال الرمز بنجاح عبر ${input.method === 'email' ? 'البريد' : 'الواتساب'}.`
        : errorMessage || 'فشل الإرسال، يرجى المحاولة لاحقاً.',
    };
  }
);