import type {
  ReviewCard,
  ReviewCourseSummary,
  ReviewGrade,
  ReviewSummary,
} from "~/types/models/review";
import { getHttp } from "./http";

export async function postEnqueueReview(coursePackId: string, courseId: string) {
  const http = getHttp();
  return (await http<{ added: number }>(`review/${coursePackId}/enqueue`, {
    method: "post",
    body: { courseId },
  })) as { added: number };
}

export async function fetchReviewSummary(coursePackId: string) {
  const http = getHttp();
  return (await http<ReviewSummary>(`review/${coursePackId}/summary`, {
    method: "get",
  })) as ReviewSummary;
}

export async function fetchReviewSummaryByCourse(coursePackId: string) {
  const http = getHttp();
  return (await http<ReviewCourseSummary[]>(`review/${coursePackId}/summary-by-course`, {
    method: "get",
  })) as ReviewCourseSummary[];
}

export async function fetchDueReviewCards(coursePackId: string, limit = 20) {
  const http = getHttp();
  return (await http<ReviewCard[]>(`review/${coursePackId}/cards`, {
    method: "get",
    query: { limit },
  })) as ReviewCard[];
}

export async function postReviewGrade(cardId: string, grade: ReviewGrade) {
  const http = getHttp();
  return (await http<ReviewCard>(`review/cards/${cardId}/grade`, {
    method: "post",
    body: { grade },
  })) as ReviewCard;
}
