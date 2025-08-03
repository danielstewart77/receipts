from pydantic import BaseModel, Field
from typing import List

class Receipt(BaseModel):
    item: str = Field(description="the name of the grocery item")
    quantity: float = Field(description="the quantity of the grocery item")
    unitPrice: float = Field(description="the price of one unit of the grocery item")
    totalPrice: float = Field(description="the price of the sum of all units of the grocery item")
    store: str = Field(description="the name of the store where the item was purchased")
    date: str = Field(description="the date the item was purchased")
    cc_last4: int = Field(description="the last 4 digits of the credit card used to make the purchase")

    class Config:
        extra = "forbid"

class ReceiptItems(BaseModel):
    items: List[Receipt] = Field(description="List of items found on the receipt")
    store: str = Field(description="the name of the store where the items were purchased")
    date: str = Field(description="the date the items were purchased")
    total: float = Field(description="the total amount of the receipt")
    
    class Config:
        extra = "forbid"