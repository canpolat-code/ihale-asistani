# scripts/ingestion.py
import fitz  
from typing import Any
from google import genai
from google.genai import types
from schema import FiyatListesi  # Bir önceki adımda oluşturduğumuz şema

# Gemini istemcisini başlat (Ortam değişkeninde GEMINI_API_KEY bulunmalıdır)
client = genai.Client()

def extract_pdf_in_chunks(pdf_path: str, kurum_adi: str, yil: int, chunk_size: int = 5):
    print(f"{pdf_path} dosyası işleniyor...")
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    tum_pozlar = []

    # Sayfaları chunk_size (örn. 5) büyüklüğünde gruplara ayırarak döngüye al
    for i in range(0, total_pages, chunk_size):
        chunk_pages = range(i, min(i + chunk_size, total_pages))
        print(f"İşlenen sayfalar: {chunk_pages[0] + 1} - {chunk_pages[-1] + 1} / {total_pages}")
        
        contents = []
        
        # Gruptaki her bir sayfayı yüksek çözünürlüklü görsele çevir (Vision yaklaşımı)
        for page_num in chunk_pages:
            page = doc[page_num]
            # 2.0 zoom faktörü ile ~150-200 DPI kalitesinde render alıyoruz
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img_bytes = pix.tobytes("png")
            
            # Görseli Gemini'nin okuyabileceği formata ekle
            contents.append(
                types.Part.from_bytes(data=img_bytes, mime_type="image/png")
            )
        
        # Prompt ekle
        prompt_text = (
            f"Bu görseller {kurum_adi} kurumunun {yil} yılına ait birim fiyat listesi sayfalarıdır. "
            "Tablolardaki tüm poz numaralarını, iş tanımlarını, birimlerini ve fiyatlarını eksiksiz çıkar. "
            "Eğer tablo bir sayfadan diğerine taşıyorsa, veriyi birleştir. "
            "Sadece verilen şemaya uygun, geçerli bir JSON döndür."
        )
        contents.append(prompt_text)

        # Gemini Pro'ya yapılandırılmış Structured Output ile istek at
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FiyatListesi,
                temperature=0.1 # düşük sıcaklık
            ),
        )
        
        # Dönen JSON verisini doğrudan Pydantic objesi olarak alabiliriz
        # burada hata yönetimi/try-catch blokları olmalıdır)
        chunk_sonucu = response.parsed
        if chunk_sonucu and hasattr(chunk_sonucu, 'pozlar'):
            tum_pozlar.extend(chunk_sonucu.pozlar) # type: ignore
            print(f"Bu gruptan {len(chunk_sonucu.pozlar)} adet poz çıkarıldı.") # type: ignore

    print(f"Toplam çıkarılan poz sayısı: {len(tum_pozlar)}")
    return tum_pozlar

if __name__ == "__main__":
    # Test amaçlı kullanım
    # pozlar = extract_pdf_in_chunks("attached_assets/CSB 2026 BİRİM FİYATLAR.pdf", "CSB", 2026)
    pass