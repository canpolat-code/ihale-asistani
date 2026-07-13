# ingestion.py
import os
import time
import fitz  # PyMuPDF # type: ignore
from pathlib import Path
from dotenv import load_dotenv # type: ignore
from google import genai # type: ignore
from google.genai import types # type: ignore
from schema import FiyatListesi # type: ignore
from database import insert_pozlar

# Çevresel değişkenleri yükle
load_dotenv()
client = genai.Client()

def process_chunk_with_backoff(contents, schema, max_retries=5):
    """
    API İstek Sınırlarını (Rate Limits) aşmak için Üstel Geri Çekilme uygular.
    Hata durumunda bekleme süresini katlayarak artırır.
    """
    base_wait_time = 10  # Başlangıç bekleme süresi (saniye)
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                    temperature=0.1 # Halüsinasyonu minimize etmek için düşük sıcaklık
                ),
            )
            return response.parsed
            
        except Exception as e:
            hata_mesaji = str(e).lower()
            # 429 (Too Many Requests) veya Kota dolumu hatalarını yakala
            if "429" in hata_mesaji or "quota" in hata_mesaji or "exhausted" in hata_mesaji:
                wait_time = base_wait_time * (2 ** attempt)
                print(f"  [!] API Sınırı Aşıldı. Model soğutuluyor... {wait_time} sn beklenecek. (Deneme {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"  [X] Beklenmeyen kritik hata: {e}")
                return None
                
    print("  [X] Maksimum deneme sayısına ulaşıldı. Bu sayfa grubu atlanıyor.")
    return None

def ingest_pdf(pdf_filename: str, kurum_adi: str, yil: int, chunk_size: int = 5):
    """
    PDF'i parçalara böler, görsel olarak analiz eder ve Vektör Veritabanına yazar.
    """
    # Mutlak yol hesaplaması
    BASE_DIR = Path(__file__).resolve().parent
    pdf_path = BASE_DIR / "attached_assets" / pdf_filename
    
    if not pdf_path.exists():
        print(f"Hata: Sistem '{pdf_path}' konumunda dosyayı bulamadı.")
        return

    print(f"\n{'='*50}")
    print(f">>> {kurum_adi} ({yil}) Veri Çıkarımı Başlıyor: {pdf_filename} <<<")
    print(f"{'='*50}\n")
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    toplam_cikarilan_poz = 0

    # Sayfaları gruplar (chunks) halinde işle
    for i in range(0, total_pages, chunk_size):
        chunk_pages = range(i, min(i + chunk_size, total_pages))
        print(f"\n[Sayfalar: {chunk_pages[0] + 1} - {chunk_pages[-1] + 1} / {total_pages}] analize alınıyor...")
        
        contents = []
        for page_num in chunk_pages:
            page = doc[page_num]
            # Hız ve kalite optimizasyonu için 2.0 (yaklaşık 150 DPI) çözünürlük
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            contents.append(
                types.Part.from_bytes(data=pix.tobytes("png"), mime_type="image/png")
            )
        
        prompt_text = (
            f"Bu görseller {kurum_adi} kurumunun {yil} yılına ait resmi birim fiyat listesi sayfalarıdır. "
            "Tablolardaki tüm poz numaralarını, iş tanımlarını, ölçü birimlerini ve birim fiyatlarını eksiksiz çıkar. "
            "Eğer tablo satırları bir sayfadan diğerine taşıyorsa, veriyi anlamsal olarak birleştir. "
            "Sadece verilen şemaya tam uyumlu, geçerli bir JSON döndür."
        )
        contents.append(prompt_text)

        # Hata tolere eden (fault-tolerant) yapay zeka çağrısı
        chunk_sonucu = process_chunk_with_backoff(contents, FiyatListesi)
        
        if chunk_sonucu and hasattr(chunk_sonucu, 'pozlar') and chunk_sonucu.pozlar: # type: ignore
            cikarilan_adet = len(chunk_sonucu.pozlar) # type: ignore
            toplam_cikarilan_poz += cikarilan_adet
            print(f"  -> Başarı: {cikarilan_adet} adet yapılandırılmış poz saptandı.")
            
            # RAM'in şişmesini önlemek için çıkarılan veriyi anında ChromaDB'ye gömüyoruz
            insert_pozlar(chunk_sonucu.pozlar, kurum_adi, yil) # type: ignore
        else:
            print("  -> Uyarı: Bu gruptan geçerli bir poz çıkarılamadı veya yapı boş döndü.")
        
        # Ücretsiz API (Free Tier) kotasını korumak için zorunlu uyku döngüsü
        if chunk_pages[-1] + 1 < total_pages:
            bekleme = 15
            print(f"  [Sistem Koruması] API yığılmasını önlemek için {bekleme} saniye bekleniyor...")
            time.sleep(bekleme)

    print(f"\n=== MİMARİ İŞLEM TAMAMLANDI ===")
    print(f"Kurum: {kurum_adi}")
    print(f"Veritabanına İşlenen Toplam Poz: {toplam_cikarilan_poz}")
    print(f"{'='*50}")

if __name__ == "__main__":
    # Sistemin asıl testi: PTT 2026 belgesini veritabanına aktarma emri
    ingest_pdf("PTT 2026.pdf", "PTT", 2026, chunk_size=2)