# CreditPulse — HTML, CSS & JavaScript

A complete static website ready to deploy to Vercel. No framework, npm install or build step is required.

## Files

- index.html — homepage, membership preview and welcome guide
- styles.css — styling, responsive layouts and motion
- app.js — navigation, forms, walkthrough and checklist
- config.js — connection settings for checkout, videos, support and the client portal
- assets/creditpulse-logo.png — your original logo
- assets/your-next-chapter.png — illustrative lifestyle image
- vercel.json — static hosting configuration
- .vercelignore — keeps this guide out of the hosted site

Keep these files and the assets folder together. Do not upload the ZIP itself as a website.

## Deploy with GitHub and Vercel

1. Extract this ZIP.
2. Create a GitHub repository and upload the CONTENTS of the CreditPulse-Vercel folder. index.html and vercel.json should be at the repository root. Keep the assets folder intact.
3. In Vercel, choose Add New > Project and import that repository.
4. Choose Other as the Framework Preset. The included vercel.json sets no build or install command and serves the root directory.
5. Leave Root Directory at the repository root. If you uploaded the outer CreditPulse-Vercel folder instead of its contents, set Root Directory to CreditPulse-Vercel.
6. Deploy. Vercel will give you the website URL.

If Vercel asks for manual settings:
- Framework Preset: Other
- Build Command: enable Override and leave it empty
- Install Command: leave empty
- Output Directory: . (the project root)

## Deploy from a terminal instead

Open a terminal inside CreditPulse-Vercel (where vercel.json is located), then run:

    npx vercel --prod

Follow the prompts to sign in and select or create a Vercel project. Do not create a nested output directory or run a build command.

## View locally

Open index.html to inspect the page. For a normal local web origin and consistent checklist storage, use VS Code Live Server or run this command from the project folder:

    python -m http.server 8080

Then open http://localhost:8080. Python is optional and not needed on Vercel.

## Routes

- / — introduction
- /#membership — membership preview
- /#welcome — welcome checklist

Hash navigation does not require server rewrites.

## Connect the real services

Edit config.js to supply HTTPS checkout, dashboard, privacy-policy and membership-terms URLs, direct playable video-file URLs, and the support email. Do not put private API keys in this file: it is public JavaScript.

IMPORTANT: This is the same interactive preview you reviewed. It does not take payments, create accounts, collect credit documents, analyse reports or send letters. The checkout flow is explicitly labelled as a preview. Form entries remain in memory; only checklist completion is saved on the device. Reset is available in the welcome guide.

The proposed price is CAD 19.97 recurring every 14 days. Confirm currency, taxes, renewal schedule, cancellation and refund terms before live signup. A real subscription requires a payment provider and backend/webhook handling for account activation. Supplying checkoutUrl and changing previewMode alone does NOT implement provisioning or convert the preview form to a production checkout. Keep previewMode true until the live journey is integrated and reviewed.

Without real videos, the site provides a working text walkthrough. The lifestyle photograph is illustrative. The original logo is embedded as a local asset, not redrawn. Google Fonts require internet access; serif and sans-serif system fallbacks are provided.

## Validation

JavaScript syntax and local file references were checked. The original release also passed DOM interaction checks for navigation, form validation, walkthrough completion, checklist persistence/reset and unavailable storage. Browser visual QA was not available. The exported HTML, CSS, JavaScript and images are unchanged from that release.

## Official Vercel references

https://vercel.com/docs/builds
https://vercel.com/docs/project-configuration/vercel-json
https://vercel.com/docs/cli/deploy
