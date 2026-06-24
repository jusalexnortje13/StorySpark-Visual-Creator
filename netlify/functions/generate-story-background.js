import { getStore } from "@netlify/blobs";
import { buildPrompt, friendlyImageError, validJobId } from "./_shared/story-utils.js";

export const config = { background: true };

export default async (request) => {
  let body = {};
  try { body = await request.json(); } catch { return; }

  const jobId = body.jobId;
  if (!validJobId(jobId)) return;

  const store = getStore({ name: "storyspark-jobs", consistency: "strong" });
  const job = await store.get(jobId, { type: "json", consistency: "strong" });
  if (!job || !job.payload || job.status === "done") return;

  await store.setJSON(jobId, {
    ...job,
    status: "processing",
    startedAt: new Date().toISOString()
  });

  const prompt = buildPrompt(job.payload);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        prompt,
        size: process.env.OPENAI_IMAGE_SIZE || "1536x512",
        quality: process.env.OPENAI_IMAGE_QUALITY || "low",
        output_format: "jpeg",
        output_compression: 82,
        moderation: "auto",
        user: `storyspark-${jobId}`
      })
    });

    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) {
      const error = new Error(result?.error?.message || "OpenAI image request failed");
      error.status = apiResponse.status;
      error.code = result?.error?.code || result?.error?.type;
      throw error;
    }

    const imageBase64 = result?.data?.[0]?.b64_json;
    if (!imageBase64) throw new Error("The image service did not return an image.");

    await store.setJSON(jobId, {
      jobId,
      jobToken: job.jobToken,
      status: "done",
      image: `data:image/jpeg;base64,${imageBase64}`,
      prompt,
      createdAt: job.createdAt,
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("StorySpark background image error", {
      code: error?.code,
      status: error?.status,
      message: error?.message
    });

    await store.setJSON(jobId, {
      jobId,
      jobToken: job.jobToken,
      status: "error",
      error: friendlyImageError(error?.status, error?.code, error?.message),
      createdAt: job.createdAt,
      completedAt: new Date().toISOString()
    });
  }
};
