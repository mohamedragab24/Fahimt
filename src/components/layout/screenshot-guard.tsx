"use client";

import { useEffect, useState } from "react";

/**
 * حماية بسيطة على مستوى المتصفح لتقليل التقاط الشاشة/التسجيل داخل المنصة.
 *
 * ملاحظة مهمة: لا توجد طريقة في الويب تمنع لقطة الشاشة 100% على مستوى نظام
 * التشغيل (خصوصًا الموبايل)، لكن هذا المكوّن يطبّق كل الإجراءات الممكنة من
 * داخل المتصفح كطبقة ردع:
 * - منع النقر بالزر الأيمن ونسخ/تحديد المحتوى المحمي.
 * - منع اختصارات لقطة الشاشة/أدوات المطوّر المعروفة (PrintScreen, F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, Ctrl+P).
 * - تعتيم الصفحة فورًا عند فقد التركيز/التبديل بين التطبيقات (يمنع رؤية
 *   المحتوى أثناء تسجيل الشاشة أو عند فتح أداة لقطة الشاشة في بعض الأنظمة).
 * - إخفاء المحتوى بالكامل عند الطباعة.
 */
export function ScreenshotGuard() {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const blockedCombo =
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["I", "J", "C", "i", "j", "c"].includes(key);

      const blockedSingle =
        key === "PrintScreen" ||
        key === "F12" ||
        ((e.ctrlKey || e.metaKey) && ["u", "U", "s", "S", "p", "P"].includes(key));

      if (blockedCombo || blockedSingle) {
        e.preventDefault();
        if (key === "PrintScreen" && navigator.clipboard) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .fahimt-protected,
        .fahimt-protected *:not(input):not(textarea):not([contenteditable="true"]) {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        @media print {
          body {
            display: none !important;
          }
        }
      `}</style>
      {isBlurred && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/98 backdrop-blur-2xl"
          style={{ pointerEvents: "none" }}
        >
          <span className="text-sm font-bold text-muted-foreground">فهمت</span>
        </div>
      )}
    </>
  );
}
