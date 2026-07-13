# ingestion.py
import pandas as pd
import re
from schema import BirimFiyat
from database import insert_pozlar

def metin_normallestir(metin) -> str:
    if pd.isna(metin): return ""
    metin = str(metin).lower().strip()
    metin = metin.replace('ı', 'i').replace('ğ', 'g').replace('ü', 'u').replace('ş', 's').replace('ö', 'o').replace('ç', 'c')
    return re.sub(r'[^a-z0-9]', '', metin)

def akilli_sutun_bul(df: pd.DataFrame, anahtar_kelimeler: list) -> str | None:
    for col in df.columns:
        norm_col = metin_normallestir(col)
        for kw in anahtar_kelimeler:
            if kw in norm_col:
                return col
    return None

def ingest_heterojen_excel(excel_yolu: str, kurum_adi: str, yil: int, batch_size: int = 100):
    print(f"\n>>> [ETL BAŞLATILDI] {kurum_adi} ({yil}) - Heterojen Şema Analizi: {excel_yolu} <<<")
    print("="*80)
    
    try:
        xls_sayfalar = pd.read_excel(excel_yolu, sheet_name=None)
    except Exception as e:
        print(f"[KRİTİK HATA] Dosya okuma matrisi çöktü: {e}")
        return

    toplam_basarili_kayit = 0

    for sayfa_adi, df in xls_sayfalar.items():
        df = df.dropna(how='all').dropna(axis=1, how='all')
        if df.empty: continue
            
        # Sütunları Heuristic olarak haritalandır
        col_poz = akilli_sutun_bul(df, ['pozno', 'poznumarasi', 'pozgrubu'])
        col_tanim = akilli_sutun_bul(df, ['tanim', 'imalat', 'cinsi', 'aciklama', 'gerecler'])
        col_birim = akilli_sutun_bul(df, ['birim', 'olcu'])
        col_fiyat = akilli_sutun_bul(df, ['montajli', 'rayic', 'brfiyat', 'fiyat', 'tutar'])

        if not all([col_poz, col_tanim, col_birim, col_fiyat]):
            continue
            
        print(f"\n[*] İşlenen Sekme: '{sayfa_adi}' | Matris Bağlantısı Kuruldu.")
        poz_havuzu = []
        
        for index, row in df.iterrows():
            try:
                raw_poz = str(row[col_poz]).strip() #type: ignore
                raw_tanim = str(row[col_tanim]).strip() #type: ignore
                raw_birim = str(row[col_birim]).strip() #type: ignore
                raw_fiyat = str(row[col_fiyat]).strip() #type: ignore

                if raw_poz.lower() in ['nan', ''] or raw_tanim.lower() in ['nan', ''] or raw_fiyat.lower() in ['nan', '', '-']:
                    continue

                # Sayısal matris standardizasyonu (Para birimi ve noktalama temizliği)
                temiz_fiyat = re.sub(r'[^0-9,.]', '', raw_fiyat)
                if ',' in temiz_fiyat and '.' in temiz_fiyat:
                    temiz_fiyat = temiz_fiyat.replace('.', '').replace(',', '.')
                elif ',' in temiz_fiyat:
                    temiz_fiyat = temiz_fiyat.replace(',', '.')
                
                fiyat_float = float(temiz_fiyat)

                poz_obj = BirimFiyat(
                    poz_no=raw_poz,
                    is_tanimi=raw_tanim,
                    birim=raw_birim if raw_birim != "nan" else "Adet",
                    fiyat=fiyat_float
                )
                poz_havuzu.append(poz_obj)

            except Exception:
                continue

            if len(poz_havuzu) >= batch_size:
                print(f"  [Vektör İşleme] {len(poz_havuzu)} adet veri uzaysal belleğe kodlanıyor...")
                insert_pozlar(poz_havuzu, kurum_adi, yil)
                toplam_basarili_kayit += len(poz_havuzu)
                poz_havuzu = []
                
        if poz_havuzu:
            insert_pozlar(poz_havuzu, kurum_adi, yil)
            toplam_basarili_kayit += len(poz_havuzu)

    print("="*80)
    print(f">>> İŞLEM TAMAMLANDI: {kurum_adi} için {toplam_basarili_kayit} poz kalıcı hafızaya mühürlendi. <<<")

if __name__ == "__main__":
    # Sırayla tüm kurumsal kütüphaneyi hatasız yutmaya hazırız
    ingest_heterojen_excel("PTT 2026.xlsx", "PTT", 2026)