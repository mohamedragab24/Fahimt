'use server';
/**
 * @fileOverview تدفق إرسال الإشعارات والتذكيرات عبر الواتساب والبريد.
 * تم تحسين الهيكلية لضمان وصول الرسائل عبر Infobip.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessagingInputSchema = z.object({
  recipient: z.string().describe('البريد أو رقم الهاتف.'),
  method: z.enum(['email', 'whatsapp']),
  subject: z.string().optional(),
  body: z.string().describe('نص الرسالة.'),
});

export async function sendNotification(input: z.infer<typeof MessagingInputSchema>) {
  return messagingFlow(input);
}

const messagingFlow = ai.defineFlow(
  {
    name: 'messagingFlow',
    inputSchema: MessagingInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    const apiKey = 'App d1d0cecac245ff6225debf8f02de3c36-4d903627-05b8-4656-bdc1-d3ab395a9e47';
    const baseUrl = 'pdp4k3.api.infobip.com';

    if (input.method === 'email') {
      try {
        const res = await fetch(`https://${baseUrl}/email/4/messages`, {
          method: 'POST',
          headers: { 
            'Authorization': apiKey, 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            "messages": [{
              "from": "resraa355@selfserve.worlds-connected.co",
              "destinations": [{ "to": input.recipient }],
              "subject": input.subject || "تنبيه من منصة فهمني",
              "text": input.body
            }]
          })
        });
        const data = await res.json();
        return { 
          success: res.ok, 
          message: res.ok ? 'تم الإرسال بنجاح' : (data.requestError?.serviceException?.text || 'خطأ في سيرفر البريد') 
        };
      } catch { return { success: false, message: 'فشل الاتصال بسيرفر البريد' }; }
    } else {
      try {
        const cleanPhone = input.recipient.replace(/\D/g, '');
        const res = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
          method: 'POST',
          headers: { 
            'Authorization': apiKey, 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            "from": "447860099299",
            "to": cleanPhone,
            "content": { "text": input.body }
          })
        });
        const data = await res.json();
        const isInternalOk = data.messages?.[0]?.status?.groupName !== 'REJECTED';
        
        return { 
          success: res.ok && isInternalOk, 
          message: (res.ok && isInternalOk) ? 'تم الإرسال بنجاح' : (data.messages?.[0]?.status?.description || data.requestError?.serviceException?.text || 'خطأ في الواتساب')
        };
      } catch { return { success: false, message: 'فشل الاتصال بسيرفر الواتساب' }; }
    }
  }
);