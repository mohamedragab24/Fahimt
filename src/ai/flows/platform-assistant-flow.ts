
'use server';
/**
 * @fileOverview مساعد "فهمت" الذكي للإجابة على استفسارات المنصة.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssistantInputSchema = z.object({
  query: z.string().describe('سؤال المستخدم حول المنصة.'),
});

const AssistantOutputSchema = z.object({
  answer: z.string().describe('إجابة المساعد الذكي.'),
  suggestedAction: z.string().optional().describe('إجراء مقترح (مثل: فتح تذكرة دعم).'),
});

export async function askPlatformAssistant(input: z.infer<typeof AssistantInputSchema>) {
  return assistantFlow(input);
}

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      system: `أنت مساعد ذكي لمنصة "فهمت" التعليمية. 
      معلومات المنصة: 
      - هي منصة تربط الطلاب (المستفهمين) بالخبراء (المفهمين) في بث مباشر.
      - العمولة هي 20% تخصم من المدرس.
      - يمكن شحن المحفظة عبر فودافون كاش أو المحافظ الإلكترونية.
      - سحب الأرباح يتم خلال 24 ساعة.
      - يوجد نظام تقييم بعد كل محاضرة.
      - التوثيق (العلامة الزرقاء) يتطلب طلب من الإدارة.
      أجب بأسلوب ودي واحترافي باللغة العربية. إذا كان السؤال خارج نطاق المنصة، اعتذر بلباقة.`,
      prompt: input.query,
      output: { schema: AssistantOutputSchema }
    });

    return output!;
  }
);
