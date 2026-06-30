# Documentation

This folder contains modular, interconnected documentation for the Site
Management application. Start at the [project README](../README.md) for a
high-level overview, then dive into the topics below.

## Index

| Document                                       | Purpose                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [architecture.md](architecture.md)            | System components, data flow, and technology decisions.            |
| [setup.md](setup.md)                           | Local environment, Docker installation, and PostgreSQL setup.      |
| [database-schema.md](database-schema.md)       | Relational data model shared by all features.                      |
| [frontend.md](frontend.md)                     | Vue.js application structure and conventions.                      |
| [features/README.md](features/README.md)       | Feature catalog and how the features relate.                       |

## Feature documentation

- [Authentication & users](features/authentication.md)
- [Properties & units](features/properties.md)
- [Payments](features/payments.md)
- [Cleaning schedules](features/cleaning.md)

## Conventions

- Every document links back to this index and to related documents so navigation
  stays seamless.
- The [database schema](database-schema.md) is the single source of truth for
  data shapes; feature docs reference its tables rather than redefining them.
