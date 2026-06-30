# DataChart

A multi-tenant SaaS dashboard builder with live charts, data source integrations, and analytics.

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/wesellis/datachart?style=flat-square)](https://github.com/wesellis/datachart/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/wesellis/datachart?style=flat-square)](https://github.com/wesellis/datachart/commits)

---

## Overview

DataChart is a full-stack SaaS platform for building interactive dashboards. It supports drag-and-drop widget placement, multiple data sources (Snowflake, Azure, ServiceNow, PostgreSQL), APM monitoring, and multi-tenant access control.

## Features

- **Dashboard Builder** — Drag-and-drop chart and widget placement with real-time preview
- **Data Sources** — Connect to Snowflake, Azure, ServiceNow, PostgreSQL, and REST APIs
- **APM Monitoring** — Application performance dashboards and alerts
- **Multi-Tenant** — Isolated tenant workspaces with role-based access control
- **Export** — PDF, Excel, and CSV export from any dashboard
- **Billing** — Stripe-based subscription tiers (Starter / Professional / Enterprise)
- **AI Agents** — Automated analytics and anomaly detection

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Recharts, Chart.js, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy, Alembic |
| Database | PostgreSQL, Redis, Elasticsearch |
| Infra | Docker, Nginx, Kubernetes |
| Payments | Stripe |

## Project Structure

```
datachart/
├── backend/                # FastAPI Python backend
│   ├── app/                # Application code
│   │   ├── api/            # API routes
│   │   ├── core/           # Config, auth, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── services/       # API service layer
│   └── package.json
├── deployment/             # Docker, Kubernetes, monitoring configs
├── nginx/                  # Nginx reverse proxy config
└── scripts/                # Deployment and utility scripts
```

## Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/wesellis/datachart.git
cd datachart
```

2. **Backend setup:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
alembic upgrade head
uvicorn app.main:app --reload
```

3. **Frontend setup:**
```bash
cd frontend
npm install
cp .env.example .env   # fill in your values
npm start
```

4. **Or run with Docker:**
```bash
docker-compose up -d
```

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and configure your API endpoint.

For the backend, set at minimum:
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing secret
- `STRIPE_SECRET_KEY` — Stripe API key

## License

MIT License — see [LICENSE](LICENSE) for details.
