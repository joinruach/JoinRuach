/**
 * Course and lesson types
 */

export type CourseLevel = 'foundation' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'audio' | 'text' | 'quiz';

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  level: CourseLevel;
  coverImage?: string;
  heroVideo?: string;
  published: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  slug: string;
  description?: string;
  type: LessonType;
  order: number;
  duration?: number;
  videoUrl?: string;
  audioUrl?: string;
  transcript?: string;
  published: boolean;
}

export interface LessonProgress {
  lessonId: number;
  userId: number;
  secondsWatched: number;
  completed: boolean;
  lastWatchedAt: string;
}

export interface CourseProgress {
  courseId: number;
  userId: number;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
}
