<div align="center">
  <img src="docs/dist/assets/logo-mark.svg" alt="BuildCRM" width="96" height="96" />

  [English](README.md) · [Русский](README.ru.md)
</div>

# BuildCRM

**Модульная CRM-система на FastAPI + React с кастомным ORM (DotORM), real-time чатом через WebSocket и интеграцией с внешними мессенджерами.**

**Официальный сайт:** [buildcrm.com](https://buildcrm.com)
**Демо версия:** [demo.buildcrm.com](https://demo.buildcrm.com)
📖 **Полная документация:** [docs.buildcrm.com](https://docs.buildcrm.com)

---

## Стек

| Слой | Технологии |
|------|-----------|
| **Backend** | Python 3.12+, FastAPI, asyncpg, PostgreSQL |
| **ORM** | DotORM (собственный async ORM) |
| **Frontend** | React 18, TypeScript, Mantine UI v8, Redux Toolkit |
| **Real-time** | WebSocket + PostgreSQL LISTEN/NOTIFY (redis optional) |
| **Интеграции** | Telegram, WhatsApp, Avito, Email (IMAP/SMTP) |

## Быстрый старт

### Docker (рекомендуется)

```bash
docker compose up --build
```

- Frontend: http://127.0.0.1:7777
- Backend API: http://127.0.0.1:7777/api/
- Backend direct: http://127.0.0.1:8000

### Локально для разработки

**Backend:**
```bash
# F5 если используете VS code
# или:
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

## Структура проекта

```
buildcrm/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── main_cron.py             # Cron-задачи
│   ├── project_setup.py         # Models, Apps, Settings
│   └── base/
│       ├── system/              # Ядро: ORM, auth, services
│       │   ├── dotorm/          # DotORM — async ORM
│       │   ├── dotorm_crud_auto/# Авто-генерация CRUD API
│       │   ├── core/            # Environment, Service
│       │   └── schemas/
│       └── crm/                 # Бизнес-модули
│           ├── chat/            # Чат + WebSocket
│           ├── security/        # ACL, сессии, роли
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
│       ├── chat/           # Модуль чата
│       └── ...
├── tests/
├── docs/                        # MkDocs документация
└── docker-compose.yml
```

## Документация

Документация написана в `docs/` и собирается через [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

| Раздел | Описание |
|--------|----------|
| [Backend](docs/backend/index.md) | Архитектура, DotORM, модули, API |
| [Frontend](docs/frontend/index.md) | React-приложение, state management |
| [Гайды](docs/guides/index.md) | Новый модуль, WebSocket, тесты |

## Демо

🌐 [demo.buildcrm.com](https://demo.buildcrm.com)

## Лицензия

BuildCRM License v1.0
