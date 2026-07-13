# database.py
import chromadb  # type: ignore[reportMissingImports]
from chromadb.config import Settings  # type: ignore[reportMissingImports]
from google import genai  # type: ignore
from typing import List, Dict, Any
from schema import BirimFiyat  # type: ignore[reportMissingImports]

# Gemini İstemcisi (Ortam değişkeninde GEMINI_API_KEY bulunmalı)
client = genai.Client()

# ChromaDB Kalıcı İstemcisi (Veriler RAM'de uçmasın diye diske yazıyoruz)
# .gitignore dosyamıza 'chroma_db/' eklediğimiz için bu klasör GitHub'a gitmeyecek
db_client = chromadb.PersistentClient(path="./chroma_db")

# Koleksiyon oluşturma (veya varsa çağırma)
# Kosinüs benzerliği (cosine) kullanarak vektörler arası açıyı ölçeceğiz
collection = db_client.get_or_create_collection(
    name="kurum_pozlari",
    metadata={"hnsw:space": "cosine"} 
)

def get_embedding(text: str) -> List[float]:
    """
    Verilen metni Gemini embedding modeli ile yüksek boyutlu bir vektöre çevirir.
    """
    response = client.models.embed_content(
        model='text-embedding-004',
        contents=text,
    )
    return response.embeddings[0].values

def insert_pozlar(pozlar: List[BirimFiyat], kurum_adi: str, yil: int):
    """
    Pydantic ile çıkarılmış pozları vektör uzayına kaydeder.
    """
    print(f"{kurum_adi} - {yil} verileri vektörel uzaya işleniyor. Lütfen bekleyin...")
    
    ids = []
    documents = []
    embeddings = []
    metadatas = []

    for idx, poz in enumerate(pozlar):
        # Benzersiz bir ID oluşturuyoruz
        doc_id = f"{kurum_adi}_{yil}_{poz.poz_no}_{idx}"
        
        # Vektörel anlama taban oluşturacak asıl metin: İş Tanımı
        # İhale dökümanındaki metin bu tanım ile uzaysal olarak kıyaslanacak
        text_to_embed = f"Poz No: {poz.poz_no} - Tanım: {poz.is_tanimi}"
        
        ids.append(doc_id)
        documents.append(text_to_embed)
        # Metni vektöre çeviriyoruz (Geometrik koordinatlar)
        embeddings.append(get_embedding(text_to_embed))
        
        # Fiyat, birim gibi sayısal ve kategorik verileri metadata olarak saklıyoruz
        metadatas.append({
            "kurum_adi": kurum_adi,
            "yil": yil,
            "poz_no": poz.poz_no,
            "birim": poz.birim,
            "fiyat": float(poz.fiyat),
            "para_birimi": poz.para_birimi
        })

    # Verileri ChromaDB'ye toplu halde (batch) ekliyoruz
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    print(f"Başarıyla {len(pozlar)} adet poz veritabanına kaydedildi.")

def semantik_poz_ara(ihale_is_tanimi: str, kurum_filtresi: str | None = None, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    İhale dokümanından okunan bozuk/farklı bir iş tanımını veritabanında arar
    ve anlamsal olarak en yakın 'top_k' adet pozu döndürür.
    """
    # 1. Gelen ihale metnini uzayda bir vektöre (koordinata) çevir
    query_embedding = get_embedding(ihale_is_tanimi)
    
    # 2. Metadata filtresi ayarla (İsteğe bağlı sadece belirli bir kurumda aramak için)
    query_kwargs = {
        "query_embeddings": [query_embedding],
        "n_results": top_k
    }
    if kurum_filtresi:
        query_kwargs["where"] = {"kurum_adi": kurum_filtresi}

    # 3. Vektör uzayında en yakın komşuları (K-Nearest Neighbors) bul
    results = collection.query(**query_kwargs)
    
    # Sonuçları daha okunaklı bir formata çevir
    eslesmeler = []
    if results['metadatas'] and len(results['metadatas'][0]) > 0:
        for i in range(len(results['metadatas'][0])):
            eslesmeler.append({
                "poz_no": results['metadatas'][0][i]['poz_no'],
                "is_tanimi": results['documents'][0][i],
                "birim": results['metadatas'][0][i]['birim'],
                "fiyat": results['metadatas'][0][i]['fiyat'],
                "benzerlik_skoru": 1 - results['distances'][0][i] # Kosinüs mesafesini benzerlik yüzdesine çeviriyoruz
            })
    return eslesmeler