# database.py
import os
import time
from pathlib import Path
from dotenv import load_dotenv
import chromadb # type: ignore
from chromadb.config import Settings # type: ignore
from google import genai # type: ignore
from google.genai import errors # type: ignore
from schema import BirimFiyat

load_dotenv()

# Deterministik Yol Yönetimi
BASE_DIR = Path(__file__).resolve().parent
DB_DIR = BASE_DIR / "chroma_db"

# Vektör Veritabanı İstemcisi
chroma_client = chromadb.PersistentClient(path=str(DB_DIR))
collection = chroma_client.get_or_create_collection(name="birim_fiyatlar")

# Gemini İstemcisi
client = genai.Client()

def get_embedding_with_backoff(text: str, retries: int = 5, delay: float = 1.0) -> list[float] | None:
    """API limitlerine karşı üstel geri çekilme uygulayarak vektör üretir."""
    if not text or not text.strip() or text.lower() == "nan":
        return None
        
    for i in range(retries):
        try:
            response = client.models.embed_content(
                model='text-embedding-005',
                contents=text.strip(),
            )
            return response.embeddings[0].values # type: ignore
        except errors.ClientError as e:
            # 429 veya kota aşımı hatası saptandığında bekleme süresini katla
            if "429" in str(e) or "exhausted" in str(e).lower():
                wait_time = delay * (2 ** i)
                print(f"  [Kota Sınırı] API yoğun. {wait_time} saniye bekleniyor...")
                time.sleep(wait_time)
            else:
                print(f"[Embedding Hatası] Beklenmeyen hata: {e}")
                return None
    return None

def insert_pozlar(pozlar: list[BirimFiyat], kurum_adi: str, yil: int):
    """Verileri tür ve benzersizlik süzgecinden geçirerek ChromaDB'ye mühürler."""
    for poz in pozlar:
        # Boş ve tanımsız iş tanımlarını anlamsal uzaya gönderme
        if not poz.is_tanimi or poz.is_tanimi.lower() == "nan" or len(poz.is_tanimi.strip()) < 3:
            continue
            
        emb = get_embedding_with_backoff(poz.is_tanimi)
        if emb is None:
            continue
            
        # Çatışmayı önlemek için benzersiz bir deterministik kimlik kombinasyonu (UuID) üretimi
        anlamsal_hash = abs(hash(poz.is_tanimi)) % 100000
        unique_id = f"{metin_temizle(kurum_adi)}_{yil}_{metin_temizle(poz.poz_no)}_{anlamsal_hash}"
        
        try:
            # add yerine upsert kullanarak çatışmaları ve çökmeleri tamamen engelliyoruz
            collection.upsert(
                ids=[unique_id],
                embeddings=[emb],
                documents=[poz.is_tanimi],
                metadatas=[{
                    "poz_no": str(poz.poz_no),
                    "birim": str(poz.birim) if poz.birim else "-",
                    "fiyat": float(poz.fiyat),
                    "kurum": kurum_adi,
                    "yil": int(yil)
                }]
            )
            # Sunucu sağlığı ve stabil RPM yönetimi için mikro-gecikme (Metronom)
            time.sleep(0.05)
            
        except Exception as e:
            print(f"  [Kayıt Atlandı] {poz.poz_no} veritabanına yazılamadı: {e}")
            continue

def metin_temizle(text: str) -> str:
    """Kimlik dizelerindeki geçersiz karakterleri sterilize eder."""
    return "".join(c for col in text for c in col if c.isalnum() or c in "._-").strip()

def semantik_poz_ara(ihale_is_tanimi: str, kurum_filtresi: str | None = None, top_k: int = 3) -> list[dict]:
    """Hafızadaki anlamsal koordinatları sorgular."""
    sorgu_vektoru = get_embedding_with_backoff(ihale_is_tanimi)
    if not sorgu_vektoru:
        return []
        
    filtre = {"kurum": kurum_filtresi} if kurum_filtresi else None
    
    results = collection.query(
        query_embeddings=[sorgu_vektoru],
        n_results=top_k,
        where=filtre # type: ignore
    )
    
    eslesmeler = []
    if results and results['documents'] and len(results['documents'][0]) > 0:
        for i in range(len(results['metadatas'][0])): # type: ignore
            eslesmeler.append({
                "poz_no": results['metadatas'][0][i]['poz_no'], # type: ignore
                "is_tanimi": results['documents'][0][i], # type: ignore
                "birim": results['metadatas'][0][i]['birim'], # type: ignore
                "fiyat": results['metadatas'][0][i]['fiyat'], # type: ignore
                "benzerlik_skoru": 1 - results['distances'][0][i] # type: ignore
            })
    return eslesmeler