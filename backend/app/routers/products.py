from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.dependencies import get_product_service
from app.models.product import InsuranceProduct
from app.services.product_service import ProductService

router = APIRouter(prefix="/api", tags=["products"])


@router.get("/products", response_model=List[InsuranceProduct])
def list_products(
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> List[InsuranceProduct]:
    return product_service.list_products()


@router.get("/products/{product_id}", response_model=InsuranceProduct)
def get_product(
    product_id: str,
    product_service: Annotated[ProductService, Depends(get_product_service)],
) -> InsuranceProduct:
    product = product_service.get_product(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product '{product_id}' not found.",
        )
    return product
