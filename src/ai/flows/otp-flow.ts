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
    
    // مفتاح Infobip والمجال الخاص بالمستخدم
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

        if (response.ok) {
          sendSuccess = true;
          console.log(`[INFOBIP EMAIL SUCCESS] Sent to ${input.recipient}`);
        } else {
          const errorData = await response.json();
          console.error('[INFOBIP EMAIL ERROR]', errorData);
          errorMessage = 'فشل إرسال البريد الإلكتروني.';
        }
      } catch (err: any) {
        console.error('[OTP EMAIL FETCH ERROR]', err.message);
        errorMessage = 'خطأ في الاتصال بسيرفر البريد.';
      }
    } else if (input.method === 'whatsapp') {
      try {
        // تنظيف الرقم: يجب أن يكون بصيغة دولية أرقام فقط لـ Infobip (مثال: 201208015262)
        let formattedPhone = input.recipient.trim().replace(/\D/g, ''); 

        console.log(`[INFOBIP WHATSAPP ATTEMPT] Target: ${formattedPhone} | Using Sandbox Sender: 447860099299`);

        const response = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            from: "447860099299", // الرقم الافتراضي لـ Infobip (يجب تفعيله في Sandbox بالجوال المستلم)
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
          // توضيح للمستخدم في حال كان الحساب تجريبياً ويحتاج تفعيل
          errorMessage = responseData.requestError?.serviceException?.text?.includes('not subscribed') 
            ? 'يرجى إرسال كلمة START لرقم الواتساب الخاص بـ Infobip لتفعيل الاستلام (Sandbox).' 
            : `فشل الإرسال: ${responseData.requestError?.serviceException?.text || 'تأكد من صحة الرقم'}`;
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
