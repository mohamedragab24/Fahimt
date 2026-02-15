
'use server';
/**
 * @fileOverview تدفق Genkit لإدارة رموز التحقق (OTP) وإرسالها عبر Infobip و Twilio WhatsApp.
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

    if (input.method === 'email') {
      const apiKey = 'App 0287a4d3a664e2ae2a09ed0f9982ab46-cd21866e-50a3-4a7d-8050-03a7d7fec5a3';
      try {
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
            'text': `رمز التحقق الخاص بك لمنصة فهمني هو: ${code}`
          })
        });
        if (response.ok) sendSuccess = true;
      } catch (err) {
        console.error('[OTP EMAIL ERROR]', err);
      }
    } else if (input.method === 'whatsapp') {
      try {
        const twilio = require('twilio');
        const accountSid = 'ACa8b9d0d5714688e35f53b9e769c82695';
        const authToken = process.env.TWILIO_AUTH_TOKEN; 
        
        if (!authToken) {
          console.error("[TWILIO ERROR] Auth Token is missing in environment variables.");
          return { success: false, code, message: 'خطأ في إعدادات الخادم (Token مفقود).' };
        }

        const client = twilio(accountSid, authToken);

        // تنظيف الرقم من أي مسافات أو رموز غير مرغوبة والتأكد من وجود +
        let formattedPhone = input.recipient.trim().replace(/\s+/g, '');
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const message = await client.messages.create({
          from: 'whatsapp:+14155238886',
          contentSid: 'HX229f5a04fd0510ce1b071852155d3e75',
          contentVariables: JSON.stringify({ "1": code }),
          to: `whatsapp:${formattedPhone}`
        });

        if (message.sid) {
          sendSuccess = true;
          console.log(`[TWILIO SUCCESS] SID: ${message.sid} to ${formattedPhone}`);
        }
      } catch (err: any) {
        console.error('[TWILIO ERROR]', err.message);
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
