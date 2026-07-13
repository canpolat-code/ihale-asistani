from pydantic import BaseModel, Field
from typing import List, Optional

class BirimFiyat(BaseModel):
    poz_no: str = Field(
        ..., 
        description="Kurumun belirlediği benzersiz poz, iş kalemi veya rayiç numarası."
    )
    is_tanimi: str = Field(
        ..., 
        description="İşin, malzemenin veya hizmetin detaylı teknik açıklaması."
    )
    birim: str = Field(
        ..., 
        description="Ölçü veya tartı birimi (ör. m2, kg, adet, ton, m3)."
    )
    fiyat: float = Field(
        ..., 
        description="Birim başına düşen net fiyat. Sadece sayısal değer olmalıdır."
    )
    para_birimi: str = Field(
        default="TRY", 
        description="Fiyatın tanımlandığı para birimi."
    )
    ek_aciklama: Optional[str] = Field(
        default=None, 
        description="Tabloda poz ile ilgili verilmiş spesifik bir not veya istisna varsa buraya eklenir."
    )

class FiyatListesi(BaseModel):
    kurum_adi: str = Field(
        ..., 
        description="Belgenin ait olduğu kurumun (ör. ÇŞB, PTT) tam adı."
    )
    yil: int = Field(
        ..., 
        description="Birim fiyatların geçerli olduğu yıl."
    )
    pozlar: List[BirimFiyat] = Field(
        ..., 
        description="Belgeden çıkarılan ve yapılandırılan tüm pozların listesi."
    )