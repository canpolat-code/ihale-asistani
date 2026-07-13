# schema.py
from pydantic import BaseModel
from typing import List

class BirimFiyat(BaseModel):
    poz_no: str
    is_tanimi: str
    birim: str
    fiyat: float
    para_birimi: str = "TRY"

class FiyatListesi(BaseModel):
    pozlar: List[BirimFiyat]