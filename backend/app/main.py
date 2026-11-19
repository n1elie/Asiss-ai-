from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.dependencies import product_service
from app.routers import chat, products, sessions, websocket


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Seed predefined insurance products into the in-memory store
    product_service.seed_products()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(websocket.router)


@app.get("/", tags=["health"])
def health_check() -> dict:
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
    }
