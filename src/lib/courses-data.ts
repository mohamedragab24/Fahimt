"use client";

// طبقة بيانات الكورسات — Firestore حقيقي مشترك بين كل المستخدمين
// (بدل التخزين المحلي القديم اللي كان بيحفظ في كل متصفح لوحده).

import { Course, CourseEnrollment } from "./types";
import { initializeFirebase } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

function db() {
  return initializeFirebase().firestore;
}

function reportPermissionError(path: string, operation: "write" | "create" | "update" | "delete", data?: any) {
  errorEmitter.emit(
    "permission-error",
    new FirestorePermissionError({ path, operation, requestResourceData: data })
  );
}

// ---------------------------------------------------------------------------
// الكورسات — Courses
// ---------------------------------------------------------------------------

/** اشتراك لحظي (Realtime) في كل الكورسات. استخدمه بدل getStoredCourses القديمة. */
export function subscribeToCourses(
  callback: (courses: Course[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const ref = collection(db(), "courses");
  return onSnapshot(
    ref,
    (snap) => {
      const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
      courses.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(courses);
    },
    (err) => {
      console.error("تعذر جلب الكورسات من Firestore:", err);
      onError?.(err);
      callback([]);
    }
  );
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const snap = await getDoc(doc(db(), "courses", id));
  if (!snap.exists()) return undefined;
  return { id: snap.id, ...(snap.data() as any) } as Course;
}

/** إنشاء كورس جديد أو تحديث كورس موجود. الكورس الجديد يبدأ دايمًا بحالة "قيد المراجعة". */
export async function upsertCourse(course: Course, isNew: boolean): Promise<void> {
  const firestore = db();
  const ref = doc(firestore, "courses", course.id);
  const nowIso = new Date().toISOString();

  const payload: Course = isNew
    ? { ...course, status: "pending", rejectionReason: "", isPaused: false, createdAt: nowIso, updatedAt: nowIso }
    : { ...course, updatedAt: nowIso };

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (err) {
    reportPermissionError(ref.path, isNew ? "create" : "update", payload);
    throw err;
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  const ref = doc(db(), "courses", courseId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    reportPermissionError(ref.path, "delete");
    throw err;
  }
}

/** إجراءات الإدارة فقط: موافقة / رفض (مع سبب) / إيقاف مؤقت أو تفعيل كورس معتمد. */
export async function approveCourse(courseId: string): Promise<void> {
  const ref = doc(db(), "courses", courseId);
  try {
    await updateDoc(ref, { status: "approved", rejectionReason: "", updatedAt: new Date().toISOString() });
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const c = snap.data() as any;
      const { notifyFollowersOfNewCourse } = await import("./follow-data");
      notifyFollowersOfNewCourse(c.instructorId, c.instructorName, c.title, courseId).catch(() => {});
    }
  } catch (err) {
    reportPermissionError(ref.path, "update", { status: "approved" });
    throw err;
  }
}

export async function rejectCourse(courseId: string, reason: string): Promise<void> {
  const ref = doc(db(), "courses", courseId);
  try {
    await updateDoc(ref, { status: "rejected", rejectionReason: reason, updatedAt: new Date().toISOString() });
  } catch (err) {
    reportPermissionError(ref.path, "update", { status: "rejected", rejectionReason: reason });
    throw err;
  }
}

export async function setCoursePaused(courseId: string, isPaused: boolean): Promise<void> {
  const ref = doc(db(), "courses", courseId);
  try {
    await updateDoc(ref, { isPaused, updatedAt: new Date().toISOString() });
  } catch (err) {
    reportPermissionError(ref.path, "update", { isPaused });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// الاشتراكات (المشتريات) — Enrollments
// ---------------------------------------------------------------------------

export function subscribeToEnrollments(
  callback: (enrollments: CourseEnrollment[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const ref = collection(db(), "course_enrollments");
  return onSnapshot(
    ref,
    (snap) => {
      const enrollments = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CourseEnrollment[];
      callback(enrollments);
    },
    (err) => {
      console.error("تعذر جلب الاشتراكات من Firestore:", err);
      onError?.(err);
      callback([]);
    }
  );
}

export async function isUserEnrolled(courseId: string, studentId?: string): Promise<boolean> {
  if (!studentId) return false;
  const q = query(
    collection(db(), "course_enrollments"),
    where("courseId", "==", courseId),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function enrollStudent(
  courseId: string,
  instructorId: string,
  studentId: string,
  studentName: string,
  studentEmail: string,
  amount: number
): Promise<CourseEnrollment> {
  const firestore = db();
  const already = await isUserEnrolled(courseId, studentId);
  if (already) {
    const q = query(
      collection(firestore, "course_enrollments"),
      where("courseId", "==", courseId),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(q);
    const existingDoc = snap.docs[0];
    return { id: existingDoc.id, ...(existingDoc.data() as any) } as CourseEnrollment;
  }

  const enrollmentId = `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newEnrollment: CourseEnrollment = {
    id: enrollmentId,
    courseId,
    instructorId,
    studentId,
    studentName,
    studentEmail,
    enrolledAt: new Date().toISOString(),
    amountPaid: amount,
    progressPercent: 0,
    completedLessonIds: [],
  };

  const enrollRef = doc(firestore, "course_enrollments", enrollmentId);
  try {
    await setDoc(enrollRef, newEnrollment);
  } catch (err) {
    reportPermissionError(enrollRef.path, "create", newEnrollment);
    throw err;
  }

  // تحديث عدد المبيعات في الكورس
  const courseRef = doc(firestore, "courses", courseId);
  try {
    const courseSnap = await getDoc(courseRef);
    const currentTotal = (courseSnap.exists() ? (courseSnap.data() as any).totalEnrollments : 0) || 0;
    await updateDoc(courseRef, { totalEnrollments: currentTotal + 1 });
  } catch {
    // غير حرج: العملية الأساسية (الاشتراك) نجحت بالفعل حتى لو فشل تحديث العداد
  }

  return newEnrollment;
}

export async function updateLessonProgress(
  courseId: string,
  studentId: string,
  lessonId: string,
  isCompleted: boolean,
  totalLessons: number
): Promise<void> {
  const firestore = db();
  const q = query(
    collection(firestore, "course_enrollments"),
    where("courseId", "==", courseId),
    where("studentId", "==", studentId)
  );
  const snap = await getDocs(q);
  const existingDoc = snap.docs[0];
  if (!existingDoc) return;

  const enrollment = existingDoc.data() as CourseEnrollment;
  const currentIds = new Set(enrollment.completedLessonIds || []);
  if (isCompleted) {
    currentIds.add(lessonId);
  } else {
    currentIds.delete(lessonId);
  }
  const completedLessonIds = Array.from(currentIds);
  const progressPercent = Math.min(100, Math.round((completedLessonIds.length / Math.max(1, totalLessons)) * 100));

  const ref = doc(firestore, "course_enrollments", existingDoc.id);
  try {
    await updateDoc(ref, { completedLessonIds, progressPercent });
  } catch (err) {
    reportPermissionError(ref.path, "update", { completedLessonIds, progressPercent });
    throw err;
  }
}

export async function getEnrollmentsForInstructor(
  instructorId: string
): Promise<{ enrollment: CourseEnrollment; course: Course }[]> {
  const firestore = db();
  const coursesQ = query(collection(firestore, "courses"), where("instructorId", "==", instructorId));
  const coursesSnap = await getDocs(coursesQ);
  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
  const courseIds = new Set(courses.map((c) => c.id));

  const enrollQ = query(collection(firestore, "course_enrollments"), where("instructorId", "==", instructorId));
  const enrollSnap = await getDocs(enrollQ);
  const enrollments = enrollSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) })) as CourseEnrollment[];

  return enrollments
    .filter((e) => courseIds.has(e.courseId))
    .map((e) => ({ enrollment: e, course: courses.find((c) => c.id === e.courseId)! }));
}
