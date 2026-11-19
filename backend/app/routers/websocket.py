import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.dependencies import conversation_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/sessions/{session_id}/chat")
async def websocket_chat(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            user_message = (data.get("message") or "").strip()
            if not user_message:
                await websocket.send_json({"error": "Message cannot be empty."})
                continue
            try:
                session, assistant_msg = conversation_service.process_message(session_id, user_message)
                await websocket.send_json(
                    {
                        "session": session.model_dump(mode="json"),
                        "assistant_message": assistant_msg.model_dump(mode="json"),
                    }
                )
            except KeyError:
                await websocket.send_json({"error": f"Session '{session_id}' not found."})
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected for session %s", session_id)
    except Exception as exc:  # pragma: no cover - defensive logging
        logger.error("WebSocket error for session %s: %s", session_id, exc)
