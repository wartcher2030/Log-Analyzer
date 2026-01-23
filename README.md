<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/14-DdnGhv8Xh7llcFXk0BaAMVjn14B0od

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Production build & deploy (Cloudflare Pages)

This repository is prepared to deploy to Cloudflare Pages using GitHub Actions. Automated deployment requires you to push this repository to GitHub and set a few repository secrets.

1. Create a GitHub repository and push the project (example):

```powershell
git init
git add .
git commit -m "chore: prepare for cloudflare-pages deploy"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

2. In your GitHub repo settings -> Secrets -> Actions, set these secrets:
   - `CLOUDFLARE_API_TOKEN` — A scoped API token with Pages:Edit, Pages:Read, and Account:Read permissions.
   - `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID.
   - `CLOUDFLARE_PROJECT_NAME` — The Pages project name (the Pages project slug).

3. Optional: Add a `.env.local` file for local dev with your `VITE_GEMINI_API_KEY` (see `.env.example`).

4. Configure the custom domain in Cloudflare Pages UI: add `log-analyzer-app.metastackwebtechnologies.com` as a custom domain for the Pages project. Either the Pages UI will instruct you the exact DNS records to add, or you can create a CNAME pointing your subdomain to the Pages project domain.

Notes & verification:
- The GitHub Action in `.github/workflows/deploy-pages.yml` builds with `npm run build` and deploys the `./dist` folder.
- A `CNAME` file is included so Pages can detect the custom domain; you still must verify ownership in the Cloudflare Pages UI.
