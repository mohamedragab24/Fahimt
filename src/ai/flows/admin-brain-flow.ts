'use server';
/**
 * @fileOverview محرك الذكاء الاصطناعي للتحكم في إعدادات المنصة.
 * يقوم بتحليل طلبات المسؤول وتحويلها إلى تحديثات في قاعدة البيانات.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdminBrainInputSchema = z.object({
  instruction: z.string().describe('تعليمات المسؤول لتعديل الموقع.'),
});

const AdminBrainOutputSchema = z.object({
  updates: z.record(z.any()).describe('كائن يحتوي على الحقول المراد تحديثها في settings/general.'),
  feedback: z.string().describe('رسالة توضح ما قام به الذكاء الاصطناعي.'),
});

export async function processAdminInstruction(input: z.infer<typeof AdminBrainInputSchema>) {
  return adminBrainFlow(input);
}

const adminBrainFlow = ai.defineFlow(
  {
    name: 'adminBrainFlow',
    inputSchema: AdminBrainInputSchema,
    outputSchema: AdminBrainOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      system: `أنت مدير تقني لمنصة "فهمني". مهمتك هي تحويل طلبات المسؤول النصية إلى تحديثات تقنية في مستند الإعدادات.
      الحقول المتاحة للتعديل هي:
      - siteTitle (عنوان الموقع)
      - heroTitle (العنوان الكبير في صفحة الهبوط)
      - heroSubtitle (الوصف أسفل العنوان)
      - primaryColor (كود لون Hex للون الأساسي)
      - accentColor (كود لون Hex للون التمييز)
      - footerText (نص التذييل)
      
      يجب أن تعيد كائناً يحتوي فقط على الحقول التي طلب المسؤول تغييرها.
      مثال: إذا قال "غير لون الموقع للأخضر"، ابحث عن كود الأخضر المناسب وضعه في primaryColor.
      إذا قال "سمي الموقع فهمني بلس"، غير siteTitle.`,
      prompt: input.instruction,
      output: { schema: AdminBrainOutputSchema }
    });

    return output!;
  }
);
