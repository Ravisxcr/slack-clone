# Slack Clone

A real-time team collaboration app built with Next.js, inspired by Slack.

## Table of Contents

- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)
- [Acknowledgements](#acknowledgements)
- [Learn More](#learn-more)
- [Deploy on Vercel](#deploy-on-vercel)

## Folder Structure

```
slack-clone/
  |- convex/
    |-- _generated/
    |-- auth.config.ts
    |-- auth.ts
    |-- channels.ts
    |-- conversations.ts
    |-- http.ts
    |-- members.ts
    |-- messages.ts
    |-- reactions.ts
    |-- schema.ts
    |-- tsconfig.json
    |-- upload.ts
    |-- users.ts
    |-- workspaces.ts
  |- public/
    |-- logo.svg
  |- src/
    |-- app/
      |--- auth/
      |--- join/
      |--- workspace/
      |--- globals.css
      |--- layout.tsx
      |--- page.tsx
    |-- components/
      |--- ui/
      |--- channel-hero.tsx
      |--- conversation-hero.tsx
      |--- convex-client-provider.tsx
      |--- editor.tsx
      |--- emoji-popover.tsx
      |--- hint.tsx
      |--- jotai-provider.tsx
      |--- message-list.tsx
      |--- message.tsx
      |--- modal-provider.tsx
      |--- reactions.tsx
      |--- renderer.tsx
      |--- theme-provider.tsx
      |--- thread-bar.tsx
      |--- thumbnail.tsx
      |--- toolbar.tsx
    |-- config/
      |--- index.ts
    |-- features/
      |--- auth/
      |--- channels/
      |--- conversations/
      |--- members/
      |--- messages/
      |--- reactions/
      |--- upload/
      |--- workspaces/
    |-- hooks/
      |--- use-channel-id.ts
      |--- use-confirm.tsx
      |--- use-member-id.ts
      |--- use-panel.ts
      |--- use-workspace-id.ts
    |-- lib/
      |--- utils.ts
    |-- middleware.ts
    |-- proxy.ts
  |- .env.example
  |- .env.local
  |- .eslintrc.json
  |- .gitignore
  |- .prettierrc.json
  |- .prettierrc.mjs
  |- bun.lockb
  |- components.json
  |- environment.d.ts
  |- next.config.mjs
  |- package.json
  |- postcss.config.mjs
  |- tailwind.config.ts
  |- tsconfig.json
  |- vercel.ts
```

## Getting Started

1. Make sure **Git** and **Node.js** are installed.
2. Clone this repository.
3. Create a `.env.local` file in the root directory:

```env
# .env.local

NEXT_TELEMETRY_DISABLED=1

# deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:<deployment-name> # team: <team-name>, project: <project-name>

NEXT_PUBLIC_CONVEX_URL="https://<deployment-name>.convex.cloud"
```

4. **Convex Deployment**

   - Visit [https://convex.dev](https://convex.dev) and log in or sign up.
   - Create a new deployment and replace `<deployment-name>`, `<team-name>`, and `<project-name>` in `.env.local` with your details.

5. **Initialize Convex Auth**

   ```bash
   npx @convex-dev/auth
   ```

   Set the `SITE_URL` environment variable to your app URL (e.g., `http://localhost:3000`).

6. **Google OAuth**

   - Create a project in [Google Cloud Console](https://console.cloud.google.com/).
   - Go to **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID** (Web Application).
   - Set the **Authorized Redirect URI** to your Convex HTTP Actions callback URL (same as `CONVEX_URL` but with `.site` instead of `.cloud`).
   - Set the credentials in Convex:

   ```bash
   npx convex env set AUTH_GOOGLE_CLIENT_ID your-google-client-id
   npx convex env set AUTH_GOOGLE_CLIENT_SECRET your-google-client-secret
   ```

7. **GitHub OAuth**

   - Go to [GitHub Developer Settings](https://github.com/settings/developers) and create a new OAuth App.
   - Set the **Authorization Callback URL** to your Convex callback URL.
   - Set the credentials in Convex:

   ```bash
   npx convex env set AUTH_GITHUB_ID your-github-client-id
   npx convex env set AUTH_GITHUB_SECRET your-github-client-secret
   ```

8. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   # or
   bun install
   ```

9. Start the development server:

   ```bash
   npm run dev
   # or
   bun dev
   ```

> **Note:** Keep your API keys and secrets out of version control.

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework
- [TypeScript](https://www.typescriptlang.org/)
- [Convex](https://convex.dev/) — real-time backend
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/) — accessible component primitives
- [Quill](https://quilljs.com/) — rich text editor
- [Jotai](https://jotai.org/) — state management

## Acknowledgements

- Original tutorial by [CodeWithAntonio](https://codewithantonio.com/)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev/)

## Deploy on Vercel

The easiest way to deploy this app is with the [Vercel Platform](https://vercel.com/new).

See the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
