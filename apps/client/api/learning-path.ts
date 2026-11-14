import type {
  CompleteSessionPayload,
  CompleteSessionResult,
  DailyLimits,
  LearningPathConfig,
  LearningPathProgress,
} from "~/types/models/learning-path";
import { getHttp } from "./http";

export async function fetchLearningPathConfig(coursePackId: string) {
  const http = getHttp();
  return (await http<LearningPathConfig>(`learning-path/${coursePackId}/config`, {
    method: "get",
  })) as LearningPathConfig;
}

export async function fetchLearningPathProgress(coursePackId: string) {
  const http = getHttp();
  return (await http<LearningPathProgress>(`learning-path/${coursePackId}/progress`, {
    method: "get",
  })) as LearningPathProgress;
}

export async function fetchDailyLimits(coursePackId: string) {
  const http = getHttp();
  return (await http<DailyLimits>(`learning-path/${coursePackId}/daily-limits`, {
    method: "get",
  })) as DailyLimits;
}

export async function postCompleteSession(coursePackId: string, payload: CompleteSessionPayload) {
  const http = getHttp();
  return (await http<CompleteSessionResult>(`learning-path/${coursePackId}/complete`, {
    method: "post",
    body: payload,
  })) as CompleteSessionResult;
}
