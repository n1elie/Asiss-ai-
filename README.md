# Mosh (Asiss-ai-)

Mosh is an insurance assurance system: a FastAPI backend with a Next.js frontend.

## Backend (backend/)

- FastAPI + Uvicorn application (`app/main.py`)
- Routers: `products`, `sessions`, `chat`, `websocket`
- Dependencies in `requirements.txt` (FastAPI, Uvicorn, Pydantic, Pydantic-Settings, python-dotenv, websockets, python-multipart)

Run with:

```bash
python -m venv venv
.\venv\Scripts\activate        # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and adjust the settings.

## Frontend (frontend/)

- Next.js (React) app with Ant Design (`antd`), Axios and Zustand
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`
- Run with:

```bash
cd frontend
npm install   # or npm ci
npm run dev
```

## Notes

- `node_modules` is **not** committed to the repo. The local `frontend/node_modules` was removed and `node_modules` is listed in `.gitignore`. Reinstall it with `npm install` after cloning.
- Environment-specific files (`backend/.env`, `frontend/.env*`) are not committed.
