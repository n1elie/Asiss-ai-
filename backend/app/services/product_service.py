from typing import List, Optional
from app.core.store import InMemoryStore
from app.models.product import InsuranceProduct, ProductType


class ProductService:
    def __init__(self, store: InMemoryStore) -> None:
        self._store = store

    def seed_products(self) -> None:
        if not self._store.get_products():
            default_products = [
                InsuranceProduct(
                    id="motor",
                    name="Motor Insurance",
                    description="Comprehensive coverage for private & commercial vehicles.",
                    type=ProductType.MOTOR,
                    icon="🚗",
                ),
                InsuranceProduct(
                    id="fire",
                    name="Fire Insurance",
                    description="Protect your property and assets from fire and perils.",
                    type=ProductType.FIRE,
                    icon="🔥",
                ),
                InsuranceProduct(
                    id="travel",
                    name="Travel Insurance",
                    description="Coverage for international and domestic travel.",
                    type=ProductType.TRAVEL,
                    icon="✈️",
                ),
                InsuranceProduct(
                    id="personal_accident",
                    name="Personal Accident",
                    description="Personal accident and injury protection.",
                    type=ProductType.PERSONAL_ACCIDENT,
                    icon="🛡️",
                ),
            ]
            self._store.set_products([p.model_dump() for p in default_products])

    def list_products(self) -> List[InsuranceProduct]:
        raw_products = self._store.get_products()
        return [InsuranceProduct.model_validate(p) for p in raw_products]

    def get_product(self, product_id: str) -> Optional[InsuranceProduct]:
        for product in self.list_products():
            if product.id == product_id:
                return product
        return None
