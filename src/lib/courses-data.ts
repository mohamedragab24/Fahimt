import { Course, CourseEnrollment } from "./types";

const INITIAL_COURSES: Course[] = [];

const STORAGE_KEY_COURSES = "fahimt_ready_courses_v2";
const STORAGE_KEY_ENROLLMENTS = "fahimt_course_enrollments_v2";

const DEMO_COURSE_IDS = new Set(["course-web-dev-pro", "course-math-calculus", "course-ai-prompting"]);

export function getStoredCourses(): Course[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COURSES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure all demo mock courses are excluded
    return parsed.filter((c: any) => c && c.id && !DEMO_COURSE_IDS.has(c.id));
  } catch (e) {
    console.error("Failed to parse stored courses", e);
    return [];
  }
}

export function saveCourses(courses: Course[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
    window.dispatchEvent(new Event("fahimt_courses_updated"));
  } catch (e) {
    console.error("Failed to save courses", e);
  }
}

export function getCourseById(id: string): Course | undefined {
  const courses = getStoredCourses();
  return courses.find(c => c.id === id);
}

export function upsertCourse(course: Course): void {
  const courses = getStoredCourses();
  const index = courses.findIndex(c => c.id === course.id);
  if (index >= 0) {
    courses[index] = { ...courses[index], ...course, updatedAt: new Date().toISOString() };
  } else {
    courses.unshift(course);
  }
  saveCourses(courses);
}

export function deleteCourse(courseId: string): void {
  const courses = getStoredCourses();
  const filtered = courses.filter(c => c.id !== courseId);
  saveCourses(filtered);
}

export function getStoredEnrollments(): CourseEnrollment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENROLLMENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse enrollments", e);
    return [];
  }
}

export function saveEnrollments(enrollments: CourseEnrollment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ENROLLMENTS, JSON.stringify(enrollments));
    window.dispatchEvent(new Event("fahimt_enrollments_updated"));
  } catch (e) {
    console.error("Failed to save enrollments", e);
  }
}

export function isUserEnrolled(courseId: string, studentId?: string): boolean {
  if (!studentId) return false;
  const enrollments = getStoredEnrollments();
  return enrollments.some(e => e.courseId === courseId && e.studentId === studentId);
}

export function enrollStudent(
  courseId: string, 
  studentId: string, 
  studentName: string, 
  studentEmail: string, 
  amount: number
): CourseEnrollment {
  const enrollments = getStoredEnrollments();
  const existing = enrollments.find(e => e.courseId === courseId && e.studentId === studentId);
  if (existing) return existing;

  const newEnrollment: CourseEnrollment = {
    id: `enroll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    courseId,
    studentId,
    studentName,
    studentEmail,
    enrolledAt: new Date().toISOString(),
    amountPaid: amount,
    progressPercent: 0,
    completedLessonIds: []
  };

  enrollments.push(newEnrollment);
  saveEnrollments(enrollments);

  // Update total enrollments in the course object
  const courses = getStoredCourses();
  const course = courses.find(c => c.id === courseId);
  if (course) {
    course.totalEnrollments = (course.totalEnrollments || 0) + 1;
    saveCourses(courses);
  }

  return newEnrollment;
}

export function updateLessonProgress(
  courseId: string, 
  studentId: string, 
  lessonId: string, 
  isCompleted: boolean
): void {
  const enrollments = getStoredEnrollments();
  const enrollment = enrollments.find(e => e.courseId === courseId && e.studentId === studentId);
  if (!enrollment) return;

  const course = getCourseById(courseId);
  if (!course) return;

  const currentIds = new Set(enrollment.completedLessonIds || []);
  if (isCompleted) {
    currentIds.add(lessonId);
  } else {
    currentIds.delete(lessonId);
  }

  enrollment.completedLessonIds = Array.from(currentIds);
  const totalLessons = course.lessons.length || 1;
  enrollment.progressPercent = Math.min(100, Math.round((enrollment.completedLessonIds.length / totalLessons) * 100));

  saveEnrollments(enrollments);
}

export function getEnrollmentsForInstructor(instructorId: string): { enrollment: CourseEnrollment; course: Course }[] {
  const courses = getStoredCourses().filter(c => c.instructorId === instructorId);
  const courseIds = new Set(courses.map(c => c.id));
  const enrollments = getStoredEnrollments().filter(e => courseIds.has(e.courseId));

  return enrollments.map(e => ({
    enrollment: e,
    course: courses.find(c => c.id === e.courseId)!
  }));
}

// Firestore helpers used by the shared course platform.
import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

export function mapFirestoreCourse(id: string, data: any): Course {
  const rawLessons = Array.isArray(data?.lessons) ? data.lessons : [];
  return {
    id,
    title: String(data?.title ?? data?.name ?? ""),
    description: String(data?.description ?? ""),
    coverUrl: String(data?.coverUrl ?? data?.thumbnailUrl ?? ""),
    price: Number(data?.price ?? 0),
    features: Array.isArray(data?.features) ? data.features.map(String) : [],
    lessons: rawLessons.map((l: any, index: number) => ({
      id: String(l?.id ?? `lesson-${index + 1}`),
      title: String(l?.title ?? l?.name ?? ""),
      description: l?.description ? String(l.description) : undefined,
      videoUrl: String(l?.videoUrl ?? ""),
      durationMinutes: Number(l?.durationMinutes ?? 0),
      order: Number(l?.order ?? index + 1),
      isFreePreview: Boolean(l?.isFreePreview ?? l?.isPreview ?? false),
      videoFileName: l?.videoFileName ? String(l.videoFileName) : undefined,
      videoFileSize: l?.videoFileSize ? String(l.videoFileSize) : undefined,
    })),
    instructorId: String(data?.instructorId ?? ""),
    instructorName: String(data?.instructorName ?? ""),
    instructorAvatar: data?.instructorAvatar ? String(data.instructorAvatar) : "",
    isPublished: data?.isPublished === true,
    approvalStatus: data?.approvalStatus ?? (data?.isPublished ? "approved" : "pending"),
    approvedAt: data?.approvedAt ? String(data.approvedAt) : undefined,
    courseUrl: data?.courseUrl ? String(data.courseUrl) : `https://fahmt-jonh.vercel.app/courses/${id}`,
    category: String(data?.category ?? ""),
    createdAt: String(data?.createdAt ?? ""),
    updatedAt: data?.updatedAt ? String(data.updatedAt) : undefined,
    totalEnrollments: Number(data?.totalEnrollments ?? 0),
    rating: Number(data?.rating ?? 5),
  };
}

export async function fetchFirestoreCourse(firestore: Firestore, courseId: string): Promise<Course | null> {
  const courseSnap = await getDoc(doc(firestore, "courses", courseId));
  if (!courseSnap.exists()) return null;
  const lessonsSnap = await getDocs(collection(firestore, "courses", courseId, "lessons"));
  const lessons = lessonsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => Number(a.order ?? 0) - Number(b.order ?? 0));
  return mapFirestoreCourse(courseSnap.id, { ...courseSnap.data(), lessons });
}

export async function fetchFirestoreCourses(firestore: Firestore): Promise<Course[]> {
  const snap = await getDocs(query(collection(firestore, "courses"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => mapFirestoreCourse(d.id, d.data()));
}

export async function getNextCourseId(firestore: Firestore): Promise<string> {
  const snap = await getDocs(collection(firestore, "courses"));
  let max = 0;
  const pattern = /^course-(\d+)-789401347533-dr6h$/;
  snap.docs.forEach((d) => {
    const match = d.id.match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `course-${max + 1}-789401347533-dr6h`;
}

export async function saveCourseToFirestore(
  firestore: Firestore,
  course: Course,
): Promise<void> {
  const courseRef = doc(firestore, "courses", course.id);
  const lessonData = course.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description ?? "",
    videoUrl: lesson.videoUrl,
    durationMinutes: lesson.durationMinutes,
    durationSeconds: Math.max(0, Math.round(lesson.durationMinutes * 60)),
    order: lesson.order,
    isFreePreview: lesson.isFreePreview === true,
    isPreview: lesson.isFreePreview === true,
    videoFileName: lesson.videoFileName ?? "",
    videoFileSize: lesson.videoFileSize ?? "",
  }));

  await setDoc(courseRef, {
    title: course.title,
    description: course.description,
    coverUrl: course.coverUrl,
    price: course.price,
    features: course.features,
    instructorId: course.instructorId,
    instructorName: course.instructorName,
    instructorAvatar: course.instructorAvatar ?? "",
    category: course.category,
    isPublished: course.isPublished,
    approvalStatus: course.approvalStatus ?? "pending",
    approvedAt: course.approvedAt ?? null,
    courseUrl: course.courseUrl ?? `https://fahmt-jonh.vercel.app/courses/${course.id}`,
    createdAt: course.createdAt,
    updatedAt: new Date().toISOString(),
    totalEnrollments: course.totalEnrollments ?? 0,
    rating: course.rating ?? 5,
  }, { merge: true });

  const batch = writeBatch(firestore);
  course.lessons.forEach((lesson) => {
    batch.set(
      doc(courseRef, "lessons", lesson.id),
      lessonData.find((l) => l.id === lesson.id)!,
      { merge: true },
    );
  });
  await batch.commit();
}
