import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { cleanStoryPayload, cleanText, jsonResponse, validateStoryPayload } from "./_shared/story-utils.js";

export default async (request) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Use a POST request." });

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(503, { error: "The teacher has not connected an OpenAI API key yet." });
  }
  if (!process.env.TEACHER_PIN) {
    return jsonResponse(503, { error: "The teacher has not created a class code yet." });
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(400, { error: "The story information could not be read." });
  }

  if (cleanText(raw.classCode, 40) !== process.env.TEACHER_PIN) {
    return jsonResponse(401, { error: "That class code is not correct. Please ask your teacher." });
  }

  const payload = cleanStoryPayload(raw);
  const validationError = validateStoryPayload(payload);
  if (validationError) return jsonResponse(400, { error: validationError });

  const jobId = randomUUID();
  const jobToken = randomUUID();
  const store = getStore({ name: "storyspark-jobs", consistency: "strong" });

  await store.setJSON(jobId, {
    jobId,
    jobToken,
    status: "queued",
    payload,
    createdAt: new Date().toISOString()
  });

  return jsonResponse(202, { jobId, jobToken });
};
