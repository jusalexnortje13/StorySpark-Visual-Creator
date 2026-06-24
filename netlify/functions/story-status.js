import { getStore } from "@netlify/blobs";
import { cleanText, jsonResponse, validJobId } from "./_shared/story-utils.js";

export default async (request) => {
  if (request.method !== "GET") return jsonResponse(405, { error: "Use a GET request." });

  const url = new URL(request.url);
  const jobId = cleanText(url.searchParams.get("jobId"), 50);
  const token = cleanText(url.searchParams.get("token"), 50);
  if (!validJobId(jobId) || !validJobId(token)) {
    return jsonResponse(400, { error: "The image job reference is not valid." });
  }

  const store = getStore({ name: "storyspark-jobs", consistency: "strong" });
  const job = await store.get(jobId, { type: "json", consistency: "strong" });
  if (!job || job.jobToken !== token) {
    return jsonResponse(404, { error: "This image job could not be found." });
  }

  if (job.status === "done") {
    return jsonResponse(200, {
      status: "done",
      image: job.image,
      prompt: job.prompt
    });
  }
  if (job.status === "error") {
    return jsonResponse(200, { status: "error", error: job.error });
  }

  return jsonResponse(200, { status: job.status || "queued" });
};
