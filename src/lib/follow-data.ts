"use client";

// نظام متابعة المُفهمين — Firestore حقيقي (بدل fahimt_subscribed_instructors المحلي القديم)

import { initializeFirebase } from "@/firebase";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";

function db() {
  return initializeFirebase().firestore;
}

function followDocId(followerId: string, instructorId: string) {
  return `${followerId}_${instructorId}`;
}

/** اشتراك لحظي في عدد متابعي مُفهم مُعيّن + هل المستخدم الحالي متابعه. */
export function subscribeToInstructorFollowers(
  instructorId: string,
  callback: (followerIds: string[]) => void
): Unsubscribe {
  const q = query(collection(db(), "course_follows"), where("instructorId", "==", instructorId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => (d.data() as any).followerId)),
    () => callback([])
  );
}

export async function followInstructor(followerId: string, instructorId: string, instructorName: string): Promise<void> {
  const firestore = db();
  const ref = doc(firestore, "course_follows", followDocId(followerId, instructorId));
  const payload = {
    followerId,
    instructorId,
    instructorName,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(ref, payload);
  } catch (err) {
    errorEmitter.emit("permission-error", new FirestorePermissionError({ path: ref.path, operation: "create", requestResourceData: payload }));
    throw err;
  }
}

export async function unfollowInstructor(followerId: string, instructorId: string): Promise<void> {
  const firestore = db();
  const ref = doc(firestore, "course_follows", followDocId(followerId, instructorId));
  try {
    await deleteDoc(ref);
  } catch (err) {
    errorEmitter.emit("permission-error", new FirestorePermissionError({ path: ref.path, operation: "delete" }));
    throw err;
  }
}

/** إشعار كل متابعي المُفهم بكورس جديد اتوافق عليه (تُستدعى من لوحة اعتماد الإدارة). */
export async function notifyFollowersOfNewCourse(instructorId: string, instructorName: string, courseTitle: string, courseId: string): Promise<void> {
  const firestore = db();
  const q = query(collection(firestore, "course_follows"), where("instructorId", "==", instructorId));
  const { getDocs } = await import("firebase/firestore");
  const snap = await getDocs(q);
  const jobs = snap.docs.map((d) => {
    const followerId = (d.data() as any).followerId;
    return addDoc(collection(firestore, "notifications"), {
      userId: followerId,
      title: "كورس جديد من مُفهم بتتابعه!",
      message: `نزل كورس جديد "${courseTitle}" للمُفهم ${instructorName}.`,
      type: "new_course",
      link: `/courses/${courseId}`,
      read: false,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  });
  await Promise.all(jobs);
}
