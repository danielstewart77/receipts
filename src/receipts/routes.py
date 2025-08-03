from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from typing import Optional, Any, Dict
from src.receipts.services.images import process_in_store, process_receipt
from src.receipts.services.interpret import interpret_query
from src.receipts.services.receipts import upcert_in_store, upcert_receipt_items, upcert_receipt
from src.auth.routes import get_current_user, get_current_user_refresh

receipts_router = APIRouter()

# Pydantic models
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    message: str

class MessageResponse(BaseModel):
    message: str
    error: Optional[str] = None

@receipts_router.get("/authenticated")
async def authenticated(current_user: str = Depends(get_current_user)):
    """Check if user is authenticated"""
    return {"authenticated": True, "user": current_user}

@receipts_router.post("/upload_receipt")
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload and process a receipt"""
    if file:
        items = await process_receipt(file)
        if items:
            # Return the items for frontend confirmation
            return {
                "items": [item.model_dump() for item in items],
                "store": items[0].store if items else "",
                "date": items[0].date if items else "",
                "total": sum(item.totalPrice for item in items)
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to process receipt")
    raise HTTPException(status_code=400, detail="No file found")

@receipts_router.post("/upload_in_store")
async def upload_in_store(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload and process an in-store item"""
    if file:
        item = await process_in_store(file)
        if item:
            return item.model_dump()
        else:
            raise HTTPException(status_code=400, detail="Failed to process item")
    raise HTTPException(status_code=400, detail="No file found")

@receipts_router.post("/save_in_store")
async def save_in_store(
    item: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    """Save an in-store item"""
    if item:
        response = upcert_in_store(user_identity=current_user, item=item)
        return response
    raise HTTPException(status_code=400, detail="No item data found")

@receipts_router.post("/save_receipt")
async def save_receipt(
    receipt_data: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    """Save receipt items"""
    if receipt_data and receipt_data.get('items'):
        response = await upcert_receipt_items(user_identity=current_user, receipt_data=receipt_data)
        return response
    raise HTTPException(status_code=400, detail="No receipt data found")

@receipts_router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_data: ChatRequest,
    current_user: str = Depends(get_current_user)
):
    """Chat with the receipt analysis system"""
    response = interpret_query(chat_data.query, current_user)
    return ChatResponse(message=response or "No response available")