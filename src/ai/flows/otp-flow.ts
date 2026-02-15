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
    
    console.log(`[OTP SYSTEM] New Request: ${input.recipient} | Method: ${input.method} | Code: ${code}`);

    let sendSuccess = false;
    let errorMessage = '';
    
    // إعدادات Infobip بناءً على البيانات المزودة
    const apiKey = 'App d1d0cecac245ff6225debf8f02de3c36-4d903627-05b8-4656-bdc1-d3ab395a9e47';
    const baseUrl = 'pdp4k3.api.infobip.com';

    if (input.method === 'email') {
      try {
        // استخدام تنسيق JSON للبريد كما في الكود المزود
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
                        "destination": input.recipient
                      }
                    ]
                  }
                ],
                "sender": "resraa355@selfserve.worlds-connected.co",
                "content": {
                  "subject": "رمز التحقق - منصة فهمني",
                  "text": `رمز التحقق الخاص بك لمنصة فهمني هو: ${code}`
                }
              }
            ]
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP EMAIL SUCCESS] Sent to ${input.recipient}`, responseData);
        } else {
          console.error('[INFOBIP EMAIL ERROR]', responseData);
          errorMessage = 'فشل إرسال البريد الإلكتروني. تأكد من إعدادات الحساب.';
        }
      } catch (err: any) {
        console.error('[OTP EMAIL FETCH ERROR]', err.message);
        errorMessage = 'خطأ في الاتصال بسيرفر البريد.';
      }
    } else if (input.method === 'whatsapp') {
      try {
        // تنظيف الرقم: إزالة أي رموز غير رقمية لضمان قبول الطلب
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
            from: "447860099299", // الرقم الافتراضي لـ Infobip (يجب تفعيله في Sandbox)
            to: formattedPhone,
            content: {
              text: `رمز التحقق الخاص بك لمنصة فهمني هو: ${code}`
            }
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP WHATSAPP ACCEPTED] MessageID: ${responseData.messages?.[0]?.messageId || 'N/A'}`);
        } else {
          console.error('[INFOBIP WHATSAPP REJECTED]', responseData);
          errorMessage = responseData.requestError?.serviceException?.text || 'تأكد من صحة رقم الواتساب وتفعيل الـ Sandbox.';
        }
      } catch (err: any) {
        console.error('[INFOBIP WHATSAPP CRASH]', err.message);
        errorMessage = 'خطأ في الاتصال بسيرفر الواتساب.';
      }
    }

    return {
      success: sendSuccess,
      code: sendSuccess ? code : '', 
      message: sendSuccess 
        ? `تم إرسال الرمز بنجاح عبر ${input.method === 'email' ? 'البريد' : 'الواتساب'}.`
        : errorMessage || 'فشل إرسال الرمز، يرجى المحاولة لاحقاً.',
    };
  }
);