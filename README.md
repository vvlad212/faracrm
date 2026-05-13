<div align="center">
  <img src="docs/dist/assets/logo-mark.svg" alt="BuildCRM" width="96" height="96" />

  [English](README.md) · [Русский](README.ru.md)
</div>

# BuildCRM

**Modular CRM system built on FastAPI + React with a custom ORM (DotORM), real-time chat via WebSocket, and integrations with external messengers.**

**Official site:** [buildcrm.com](https://buildcrm.com)
**Demo:** [demo.buildcrm.com](https://demo.buildcrm.com)
📖 **Full documentation:** [docs.buildcrm.com](https://docs.buildcrm.com)

---

## Stack

| Layer | Technologies |
|------|-----------|
| **Backend** | Python 3.12+, FastAPI, asyncpg, PostgreSQL |
| **ORM** | DotORM (in-house async ORM) |
| **Frontend** | React 18, TypeScript, Mantine UI v8, Redux Toolkit |
| **Real-time** | WebSocket + PostgreSQL LISTEN/NOTIFY (redis optional) |
| **Integrations** | Telegram, WhatsApp, Avito, Email (IMAP/SMTP) |

## Quick start

### Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://127.0.0.1:7777
- Backend API: http://127.0.0.1:7777/api/
- Backend direct: http://127.0.0.1:8000

### Local development

**Backend:**
```bash
# F5 if you use VS Code
# or:
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --host 0.0.0.0 --port 8090
```

**Frontend:**
```bash
cd frontend
yarn install
yarn dev
```

## Project layout

```
buildcrm/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── main_cron.py             # Cron jobs
│   ├── project_setup.py         # Models, Apps, Settings
│   └── base/
│       ├── system/              # Core: ORM, auth, services
│       │   ├── dotorm/          # DotORM — async ORM
│       │   ├── dotorm_crud_auto/# Auto-generated CRUD API
│       │   ├── core/            # Environment, Service
│       │   └── schemas/
│       └── crm/                 # Business modules
│           ├── chat/            # Chat + WebSocket
│           ├── security/        # ACL, sessions, roles
│           ├── users/
│           ├── leads/
│           ├── sales/
│           ├── partners/
│           ├── tasks/
│           └── ...
├── frontend/
│   └── src/
│       ├── services/api/        # RTK Query API
│       ├── store/               # Redux store
│       ├── chat/           # Chat module
│       └── ...
├── tests/
├── docs/                        # MkDocs documentation
└── docker-compose.yml
```

## Documentation

The documentation lives in `docs/` and is built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

| Section | Description |
|--------|----------|
| [Backend](docs/backend/index.md) | Architecture, DotORM, modules, API |
| [Frontend](docs/frontend/index.md) | React app, state management |
| [Guides](docs/guides/index.md) | New module, WebSocket, tests |

## Demo

🌐 [demo.buildcrm.com](https://demo.buildcrm.com)

## License

BuildCRM License v1.0
