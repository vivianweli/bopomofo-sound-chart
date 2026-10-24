# bopomofo-sound-chart

A Zhuyin (注音) syllable chart where each syllable and tone plays a recorded sound.

- `public/index.html` is the whole site.
- `netlify/functions/api.mjs` serves and stores the audio (Netlify Functions + Netlify Blobs).
- Anyone can listen. Only someone with the recording password can upload.

## Deploy (Netlify)

1. Netlify → Add new site → Import an existing project → pick this repo and the branch to publish (normally `main`).
   Netlify reads `netlify.toml`, so no build settings are needed.
2. Site configuration → Environment variables → add `RECORD_PASSWORD` with a long password, then redeploy.

Recordings live in Netlify Blobs, not in the repo, so redeploying never removes them.

## Recording

Open `https://<your-site>/?record`, enter the password, allow the microphone, and press Space to record and stop.
Each take is converted to mp3 and goes live as soon as it uploads. Without the password the page shows only a login box and the server refuses uploads.
