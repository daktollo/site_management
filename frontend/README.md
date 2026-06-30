# Frontend

The Vue 3 (Vite) single-page application for Site Management, using `vue-router`,
Pinia, and axios.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` to the backend on port 3000 (see
[`vite.config.js`](vite.config.js)). Start the [backend](../backend/README.md)
and [database](../docker/README.md) first. Sign in with a demo account (password
`password123`), e.g. `alice@site.test`.

> The dev server uses file-watch polling to avoid the host inotify limit
> (`ENOSPC`); see `server.watch` in `vite.config.js`.

## Languages

The UI ships in **Turkish (default)** and English via `vue-i18n`. A TR/EN toggle
button sits in the top-right (also on the login screen); the choice is saved to
`localStorage`. Messages live in [`src/i18n/`](src/i18n/).

## Structure

```
src/
├── main.js              app bootstrap (Pinia + router)
├── App.vue              shell + navigation
├── style.css           global styles
├── router/index.js     routes + auth guard
├── i18n/               vue-i18n setup + tr/en messages (default Turkish)
├── stores/auth.js      Pinia auth store (token + user)
├── services/api.js     axios instance with JWT interceptor
└── views/
    ├── LoginView.vue
    ├── DashboardView.vue    debts overview + my summary
    ├── PaymentsView.vue     Payments tab, create transaction, mark paid
    ├── CleaningView.vue     assignments, tasks, admin tools
    └── PropertiesView.vue   properties, units, residents
```

## Related documents

- [Frontend design](../docs/frontend.md)
- [Backend API](../backend/README.md)
- [Architecture](../docs/architecture.md)
