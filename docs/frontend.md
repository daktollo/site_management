# Frontend

[← Documentation index](README.md) · [← Architecture](architecture.md)

The frontend is a **Vue.js** single-page application living in
[`frontend/`](../frontend/). This document describes the intended structure; the
folder currently holds a skeleton (see [`frontend/README.md`](../frontend/README.md)).

## Planned structure

```
frontend/
├── package.json          ← dependencies & scripts (placeholder)
├── index.html
├── vite.config.js
└── src/
    ├── main.js           ← app bootstrap
    ├── App.vue
    ├── router/           ← route definitions
    ├── stores/           ← state management (e.g. Pinia)
    ├── services/         ← REST API clients
    ├── components/       ← reusable UI components
    └── views/
        ├── PaymentsView.vue    ← the Payments tab
        ├── CleaningView.vue    ← cleaning schedules & assignments
        ├── PropertiesView.vue  ← properties & units
        └── auth/               ← login / account
```

## Key screens

| View            | Feature doc                                       |
| --------------- | ------------------------------------------------- |
| Payments tab    | [features/payments.md](features/payments.md)      |
| Cleaning tab    | [features/cleaning.md](features/cleaning.md)      |
| Properties tab  | [features/properties.md](features/properties.md)  |
| Auth / account  | [features/authentication.md](features/authentication.md) |

## Conventions (to be established)

- Component names in `PascalCase`; one component per `.vue` file.
- API access is centralized in `src/services/` rather than called from components.
- Shared, reactive state lives in `src/stores/`.

## Related documents

- [Architecture](architecture.md)
- [Feature catalog](features/README.md)
