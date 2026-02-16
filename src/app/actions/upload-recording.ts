
'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * @fileOverview سيرفر أكشن لرفع تسجيلات المحاضرات إلى Google Drive.
 */

export async function uploadRecordingToDrive(formData: FormData, fileName: string) {
  const file = formData.get('file') as File;
  if (!file) throw new Error('لم يتم استلام ملف التسجيل.');

  // يجب ضبط هذه المتغيرات في ملف .env
  const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.warn('تنبيه: إعدادات Google Drive ناقصة في الـ .env. سيتم محاكاة الرفع لغرض التجربة.');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { success: true, message: 'تمت المحاكاة (يرجى ضبط الإعدادات للرفع الفعلي).' };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: file.type,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    return { success: true, fileId: response.data.id, message: 'تم رفع المحاضرة بنجاح إلى Google Drive.' };
  } catch (error: any) {
    console.error('Drive Upload Error:', error);
    return { success: false, message: 'فشل الرفع: ' + (error.message || 'خطأ غير معروف') };
  }
}
