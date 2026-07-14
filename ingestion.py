# ingestion.py
import pandas as pd
import re
from schema import BirimFiyat
from database import insert_pozlar

def temiz_fiyat_cevir(raw_fiyat) -> float | None:
    """Metinsel fiyat verisini analitik olarak float standardına dönüştürür."""
    if pd.isna(raw_fiyat):
        return None
    
    dize_fiyat = str(raw_fiyat).strip()
    # Para birimi sembollerini ve gereksiz boşlukları temizle
    dize_fiyat = re.sub(r'[^0-9,.]', '', dize_fiyat)
    
    if not dize_fiyat:
        return None
        
    try:
        # Türk finansal formatı sönümleme: "1.250,50" -> "1250.50"
        if ',' in dize_fiyat and '.' in dize_fiyat:
            dize_fiyat = dize_fiyat.replace('.', '').replace(',', '.')
        elif ',' in dize_fiyat:
            dize_fiyat = dize_fiyat.replace(',', '.')
        
        return float(dize_fiyat)
    except ValueError:
        return None

def standart_excel_ingest_pipeline(excel_yolu: str, kurum_adi: str, yil: int, batch_size: int = 150):
    """
    Belirlenen şema kontratına göre Excel dosyalarını doğrusal zaman karmaşıklığıyla (O(N))
    okur, Pydantic şemasıyla doğrular ve ChromaDB'ye mühürler.
    """
    print(f"\n>>> [ETL BAŞLADI] {kurum_adi} ({yil}) Veri Yükleme Hattı Ateşlendi <<<")
    print("-" * 80)
    
    try:
        # Excel dosyasındaki tüm sayfaları oku
        xls_kitap = pd.read_excel(excel_yolu, sheet_name=None)
    except Exception as e:
        print(f"[KRİTİK HATA] Dosya matrisine erişilemedi: {e}")
        return

    toplam_kaydedilen_poz = 0

    # Dosyadaki tüm sekmeleri doğrusal olarak tara
    for sekme_adi, df in xlsKitap.items() if 'xls_kitap' in locals() else xls_kitap.items(): #type: ignore
        # Tamamen boş satır ve sütunları ele
        df = df.dropna(how='all').dropna(axis=1, how='all')
        if df.empty:
            continue
            
        # Kullanıcının tanımladığı zorunlu veri şeması kontratı
        st_sutunlar = ['POZ NO', 'IS TANIMI', 'BIRIMI', 'BİRİM FİYAT']
        
        # Eğer mevcut DataFrame sütun başlıkları kontratı doğrudan içermiyorsa, 
        # satırların arasında başlık satırını arayan buluşsal süzgeç
        if not all(col in df.columns for col in ['POZ NO', 'IS TANIMI', 'BIRIMI']):
            baslik_bulundu = False
            for idx, row in df.iterrows():
                row_values = [str(val).strip().upper() for val in row.values]
                if 'POZ NO' in row_values or 'IS TANIMI' in row_values:
                    # Başlık satırını yeniden konumlandır ve üstündeki çöplüğü sil
                    df.columns = [str(c).strip().upper() for c in row.values]
                    df = df.iloc[idx + 1:].reset_index(drop=True) #type: ignore
                    baslik_bulundu = True
                    break
            if not baslik_bulundu:
                continue

        # Sütun isimlerini normalize et (Büyük harf ve boşluk standardizasyonu)
        df.columns = [str(c).strip().upper() for c in df.columns]
        
        # Fiyat sütun varyasyonunu (BİRİM FİYAT / BIRIM FIYAT) sönümle
        fiyat_col = None
        for c in df.columns:
            if 'FIYAT' in c or 'FİYAT' in c:
                fiyat_col = c
                break
                
        if not all(k in df.columns for k in ['POZ NO', 'IS TANIMI', 'BIRIMI']) or not fiyat_col:
            continue

        print(f"[*] Sekme Analiz Ediliyor: '{sekme_adi}'")
        poz_havuzu = []
        
        for index, row in df.iterrows():
            raw_poz = str(row['POZ NO']).strip()
            raw_tanim = str(row['IS TANIMI']).strip()
            raw_birim = str(row['BIRIMI']).strip()
            raw_fiyat = row[fiyat_col]

            # Veri temizleme süzgeci (Veri bütünlüğü koruması)
            if raw_poz.lower() in ['nan', ''] or raw_tanim.lower() in ['nan', ''] or raw_birim.lower() in ['nan', '']:
                continue

            fiyat_float = temiz_fiyat_cevir(raw_fiyat)
            if fiyat_float is None:
                continue

            try:
                # Veri Kontratı Doğrulaması (Type-Safety)
                poz_obj = BirimFiyat(
                    poz_no=raw_poz,
                    is_tanimi=raw_tanim,
                    birim=raw_birim,
                    fiyat=fiyat_float
                )
                poz_havuzu.append(poz_obj)
                
            except Exception:
                continue

            # Batch Processing: Hafıza taşmasını önlemek için partiler halinde DB'ye mühürleme
            if len(poz_havuzu) >= batch_size:
                insert_pozlar(poz_havuzu, kurum_adi, yil)
                toplam_kaydedilen_poz += len(poz_havuzu)
                poz_havuzu = []

        # Partiden geriye kalan son verileri içeri besle
        if poz_havuzu:
            insert_pozlar(poz_havuzu, kurum_adi, yil)
            toplam_kaydedilen_poz += len(poz_havuzu)

    print("-" * 80)
    print(f">>> MİMARİ BAŞARI: {kurum_adi} için toplam {toplam_kaydedilen_poz} adet veri mühürlendi. <<<")

if __name__ == "__main__":
    # Standardize edilmiş kurumsal veri kütüphanesi yükleme döngüsü
    standart_excel_ingest_pipeline("PTT 2026.xlsx", "PTT", 2026)
    standart_excel_ingest_pipeline("CSB 2026 BİRİM FİYATLAR.xlsx", "CSB", 2026)
    standart_excel_ingest_pipeline("KTB 2026.xlsx", "KTB", 2026)