# PostPrep frontend

React 18 + Vite + TypeScript + Tailwind 3 client for the PostPrep API (PDF/text in, title, summary, keywords and categories out).

## Run

```bash
npm install
npm run dev        # proxies /api to the backend (see vite.config.ts)
npm run build      # type-check + production build
```

`VITE_API_URL` (see `.env.example`) overrides the API base URL. Auth uses `SameSite=Strict` cookies, so serve the app and API from the same site.

## Structure

```
src/
  lib/          api client (cookie auth, single-flight refresh), formatting helpers
  context/      AuthContext (session + role detection), ToastContext
  hooks/        useArticlePolling (articles are analysed asynchronously)
  components/   Navbar, Modal, ArticleView, shared UI
  pages/        Login, Dashboard (new analysis), MyArticles, admin/*
```

## Notes

- The API has no "who am I" endpoint and the cookie is HttpOnly, so the role is detected by probing `GET /admin/dashboard` after login (200 = ADMIN).
- Admin screens are code-split and only load for admins.
- Design: dark ambient background with animated blobs, frosted-glass panels, IBM Plex Mono (self-hosted via `@fontsource`). Blobs are plain radial gradients animated with transforms, and `backdrop-blur` is only used on large containers.
