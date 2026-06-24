import { getStore } from "@netlify/blobs";
import { cleanText, jsonResponse, validJobId } from "./_shared/story-utils.js";

export default async (request) => {
  if (request.method !== "DELETE") return jsonResponse(405, { error: "Use a DELETE request." });

  const url = new URL(request.url);
  const jobId = cleanText(url.searchParams.get("jobId"), 50);
  const token = cleanText(url.searchParams.get("token"), 50);
  if (!validJobId(jobId) || !validJobId(token)) return jsonResponse(400, { error: "Invalid job reference." });

  const store = getStore({ name: "storyspark-jobs", consistency: "strong" });
  const job = await store.get(jobId, { type: "json", consistency: "strong" });
  if (!job || job.jobToken !== token) return jsonResponse(404, { error: "Job not found." });

  await store.delete(jobId);
  return jsonResponse(200, { deleted: true });
};
