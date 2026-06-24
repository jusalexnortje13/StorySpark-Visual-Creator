import OpenAI from "openai";

const MAX_FIELD_LENGTH = 700;
const REQUIRED_FIELDS = ["character", "setting", "problem", "solution", "beginning", "middle", "ending"];

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function cleanText(value, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function containsLikelyPersonalInfo(text) {
  const patterns = [
    /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/i,
    /\b(?:\+?\d[\d\s().-]{7,}\d)\b/,
    /\bhttps?:\/\//i
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function buildPrompt(data) {
  const optional = (label, value) => value ? `${label}: ${value}\n` : "";

  return `Create ONE wide triptych storyboard image made of THREE EQUAL SQUARE PANELS arranged left to right.

This is a visual planning aid for primary-school creative writing. The content must be safe, hopeful and age-appropriate.

STRICT LAYOUT:
- Canvas ratio exactly 3:1.
- Three equal square panels with clear vertical gutters.
- Panel 1 is the BEGINNING, panel 2 is the MIDDLE, panel 3 is the ENDING.
- Do not add titles, labels, captions, letters, numbers, speech bubbles, watermarks or logos.
- Each panel must work as a separate square image when the wide picture is cut into three equal parts.
- Do not let important characters cross the panel boundaries.

VISUAL STYLE:
${data.style}

CHARACTER CONSISTENCY:
The same main character must have exactly the same face, age, body shape, hairstyle, clothing, accessories and colours in all three panels.
Main character: ${data.character}
${optional("Exact appearance details", data.appearance)}${optional("Supporting characters", data.supporting)}Setting used consistently across the sequence: ${data.setting}
${optional("Important object or goal", data.object)}Problem or conflict: ${data.problem}
${optional("Story twist", data.twist)}Solution: ${data.solution}

PANEL 1 — BEGINNING:
${data.beginning}

PANEL 2 — MIDDLE:
${data.middle}

PANEL 3 — ENDING:
${data.ending}

SAFETY AND QUALITY:
- Suitable for children aged approximately 8–11.
- No graphic injuries, frightening horror, sexual content, hateful imagery, realistic weapons, dangerous instructions or humiliating content.
- Make emotions and actions easy to understand visually.
- Use cinematic composition, clear storytelling and rich environmental detail.
- Keep all recurring character details consistent across all three panels.`;
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Use a POST request to generate images." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(503, {
      error: "The teacher has not connected an OpenAI API key yet. Please follow the setup guide."
    });
  }

  if (!process.env.TEACHER_PIN) {
    return jsonResponse(503, {
      error: "The teacher has not created a class code yet. Please follow the setup guide."
    });
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return jsonResponse(400, { error: "The story information could not be read." });
  }

  const classCode = cleanText(raw.classCode, 40);
  if (classCode !== process.env.TEACHER_PIN) {
    return jsonResponse(401, { error: "That class code is not correct. Please ask your teacher." });
  }

  const data = {
    character: cleanText(raw.character, 300),
    appearance: cleanText(raw.appearance, 300),
    supporting: cleanText(raw.supporting, 300),
    setting: cleanText(raw.setting, 300),
    object: cleanText(raw.object, 300),
    problem: cleanText(raw.problem, 400),
    twist: cleanText(raw.twist, 300),
    solution: cleanText(raw.solution, 400),
    beginning: cleanText(raw.beginning),
    middle: cleanText(raw.middle),
    ending: cleanText(raw.ending),
    style: cleanText(raw.style, 300) ||
      "warm, colourful children's storybook illustration"
  };

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) {
      return jsonResponse(400, { error: `Please complete the ${field} section.` });
    }
  }

  const combinedText = Object.values(data).join(" ");
  if (containsLikelyPersonalInfo(combinedText)) {
    return jsonResponse(400, {
      error: "Please remove email addresses, phone numbers and website links. Use fictional story information only."
    });
  }

  const prompt = buildPrompt(data);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const result = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: "3072x1024",
      quality: process.env.OPENAI_IMAGE_QUALITY || "low",
      output_format: "jpeg",
      output_compression: 88,
      moderation: "auto"
    });

    const imageBase64 = result?.data?.[0]?.b64_json;
    if (!imageBase64) {
      return jsonResponse(502, { error: "The image service did not return an image." });
    }

    return jsonResponse(200, {
      image: `data:image/jpeg;base64,${imageBase64}`,
      prompt
    });
  } catch (error) {
    console.error("StorySpark image error", {
      code: error?.code,
      status: error?.status,
      request_id: error?.request_id
    });

    if (error?.code === "moderation_blocked") {
      return jsonResponse(400, {
        error: "This story could not be illustrated safely. Please replace frightening, violent, unkind or personal details and try again."
      });
    }

    if (error?.status === 401) {
      return jsonResponse(503, {
        error: "The image account is not connected correctly. The teacher should check the API key."
      });
    }

    if (error?.status === 429) {
      return jsonResponse(429, {
        error: "The image limit has been reached or the account needs more credit. Please ask your teacher."
      });
    }

    return jsonResponse(500, {
      error: "The pictures could not be created right now. Please wait a moment and try again with your teacher."
    });
  }
};
