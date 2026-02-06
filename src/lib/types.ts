
export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  role: UserRole;
  avatarUrl: string;
  specialization?: string;
  balance: number;
}

export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'canceled';

export interface LearningRequest {
  id: string;
  title: string;
  description: string;
  amount: number;
  meetingTime: string;
  category: string;
  status: RequestStatus;
  studentId: string;
  studentName: string;
  teacherId?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning';
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}
