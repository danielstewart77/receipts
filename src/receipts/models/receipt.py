from pydantic import BaseModel, Field

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