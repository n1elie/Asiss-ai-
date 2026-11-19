from typing import Any, Dict, List, Optional


class InMemoryStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._products: List[Dict[str, Any]] = []

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._sessions.get(session_id)

    def set_session(self, session_id: str, data: Dict[str, Any]) -> None:
        self._sessions[session_id] = data

    def all_sessions(self) -> Dict[str, Dict[str, Any]]:
        return self._sessions

    def get_products(self) -> List[Dict[str, Any]]:
        return self._products

    def set_products(self, products: List[Dict[str, Any]]) -> None:
        self._products = products


store = InMemoryStore()
