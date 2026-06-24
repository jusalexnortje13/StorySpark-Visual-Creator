# StorySpark Visual Creator

StorySpark lets learners enter a character, setting, problem, twist and solution; review a beginning-middle-ending plan; and generate a consistent three-panel storyboard. The webpage automatically crops the wide storyboard into three downloadable square images.

## Important

This version needs:

1. A Netlify account
2. An OpenAI API account with billing/credits enabled
3. An OpenAI API key
4. A private class code chosen by the teacher

A ChatGPT Plus subscription and API billing are separate services.

## Deploy through Netlify and GitHub

### 1. Unzip this folder

Keep the file structure exactly as supplied:

- `index.html`
- `package.json`
- `netlify.toml`
- `netlify/functions/generate-story.js`

### 2. Create a GitHub repository

1. Sign in to GitHub.
2. Create a new repository.
3. Upload all the files and folders from this project.
4. Do not upload an API key or put it inside any file.

### 3. Connect the repository to Netlify

1. In Netlify, choose **Add new project**.
2. Select **Import an existing project**.
3. Connect GitHub and select the StorySpark repository.
4. Accept the build settings and deploy.

### 4. Add the secure environment variables

In Netlify, open:

**Project configuration → Environment variables**

Add:

- `OPENAI_API_KEY` = your OpenAI API key
- `TEACHER_PIN` = a private class code, for example a word and several numbers
- Optional: `OPENAI_IMAGE_MODEL` = `gpt-image-2`
- Optional: `OPENAI_IMAGE_QUALITY` = `low`

Make sure the variables are available to **Functions**. Redeploy the site after adding or changing them.

### 5. Test the website

1. Open the Netlify public URL.
2. Select **Load an Example**.
3. Check the three scenes.
4. Enter the class code.
5. Select **Create My 3 Images**.

Image creation can take up to two minutes.

## Classroom safety

- Use the website under teacher supervision.
- Tell learners that the pictures are AI-generated and can contain mistakes.
- Do not enter real learner names, photographs, addresses, phone numbers, emails or other personal details.
- Use fictional characters and school-appropriate stories.
- Review all generated pictures before learners submit or publish them.
- Keep the class code private and change it if it is shared outside the class.
- Monitor API usage and set spending limits in the OpenAI platform.
- Your school is responsible for reviewing applicable privacy, child-safety, consent and data-protection requirements.

This prototype does not store story plans in a database. Story text is sent to the configured image API only when the teacher-authorised generation button is used.

## Cost control

The app creates one low-quality 3072 × 1024 image and crops it into three panels. This is designed to reduce cost compared with making three separate image requests. Current pricing may change, so check the OpenAI pricing page and set account limits before classroom use.

## Troubleshooting

**“The teacher has not connected an OpenAI API key.”**  
Add `OPENAI_API_KEY` to Netlify environment variables and redeploy.

**“That class code is not correct.”**  
Use the exact value stored as `TEACHER_PIN`.

**“The image limit has been reached.”**  
Check API billing, credit balance, usage limits and rate limits.

**The panels do not divide perfectly.**  
AI image composition is not perfectly predictable. Generate again, or use the full wide storyboard rather than the cropped panels.

**The character changes slightly.**  
Add detailed visual information in the “Character appearance” field and generate again.
