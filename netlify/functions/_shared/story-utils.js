const MAX_FIELD_LENGTH = 700;
const REQUIRED_FIELDS = ["character", "setting", "problem", "solution", "beginning", "middle", "ending"];

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export function cleanText(value, maxLength = MAX_FIELD_LENGTH) {
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

export function cleanStoryPayload(raw) {
  return {
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
    style: cleanText(raw.style, 300) || "warm, colourful children's storybook illustration"
  };
}

export function validateStoryPayload(data) {
  for (const field of REQUIRED_FIELDS) {
    if (!data[field]) return `Please complete the ${field} section.`;
  }
  if (containsLikelyPersonalInfo(Object.values(data).join(" "))) {
    return "Please remove email addresses, phone numbers and website links. Use fictional story information only.";
  }
  return "";
}

export function validJobId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function buildPrompt(data) {
  const optional = (label, value) => value ? `${label}: ${value}\n` : "";

  return `Create ONE wide triptych storyboard image made of THREE EQUAL SQUARE PANELS arranged left to right.

This is a visual planning aid for primary-school creative writing. The content must be safe, hopeful and age-appropriate.

STRICT LAYOUT:
- Canvas ratio exactly 3:1.
- Three equal square panels with clear vertical gutters.
- Panel 1 is the BEGINNING, panel 2 is the MIDDLE, panel 3 is the ENDING.
- Do not add titles, labels, captions, letters, numbers, speech bubbles, watermarks or logos.
- Each panel must work as a separate square image when the wide picture is cut into three equal parts.
- Do not let important characters cross panel boundaries.

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
- Use clear visual storytelling and rich environmental detail.
- Keep all recurring character details consistent across all three panels.`;
}

export function friendlyImageError(status, code, message = "") {
  if (code === "billing_hard_limit_reached") {
    return "The OpenAI API account has reached its spending limit. The teacher should check API billing and limits.";
  }
  if (code === "moderation_blocked" || status === 400 && /safety|moderation/i.test(message)) {
    return "This story could not be illustrated safely. Replace frightening, violent, unkind or personal details and try again.";
  }
  if (status === 401) {
    return "The image account is not connected correctly. The teacher should check the OpenAI API key.";
  }
  if (status === 429) {
    return "The image account has reached a rate or credit limit. Please ask your teacher to check API usage and billing.";
  }
  if (status === 403) {
    return "The image account does not currently have permission to use this image model. The teacher should check the OpenAI project settings.";
  }
  return "The pictures could not be created right now. Please wait a moment and try again with your teacher.";
}
