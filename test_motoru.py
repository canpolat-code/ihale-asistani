import os
from schema import BirimFiyat
from database import insert_pozlar, semantik_poz_ara

# Sistemin API anahtarına erişebildiğinden emin olmak için basit bir kontrol
if not os.environ.get("GEMINI_API_KEY"):
    print("UYARI: Lütfen terminalde 'export GEMINI_API_KEY=sizin_anahtariniz' komutunu çalıştırın.")
    exit()

def run_test():
    print("--- 1. FAZ: Vektör Uzayına Veri Yükleme ---")
    # Kurumun resmi PDF'inden çıktığını varsaydığımız nizami, hatasız veriler
    mock_pozlar = [
        BirimFiyat(
            poz_no="10.130.1001",
            is_tanimi="C25/30 sınıfı hazır beton dökülmesi ve yerleştirilmesi",
            birim="m3",
            fiyat=2500.50
        ),
        BirimFiyat(
            poz_no="10.130.1002",
            is_tanimi="C30/37 sınıfı hazır beton dökülmesi ve yerleştirilmesi",
            birim="m3",
            fiyat=2800.00
        ),
        BirimFiyat(
            poz_no="20.010.2001",
            is_tanimi="Laminant parke kaplama yapılması (Süpürgelik dahil)",
            birim="m2",
            fiyat=450.75
        )
    ]

    # Verileri uzaya gömüyoruz (Embedding)
    insert_pozlar(mock_pozlar, kurum_adi="Test_Kurumu", yil=2026)
    print("\nVeriler başarıyla n-boyutlu uzaya yerleştirildi.\n")

    print("--- 2. FAZ: Semantik Tolerans Testi ---")
    # İhale dokümanından okunan bozuk, kelimeleri değişmiş ve kısaltmalar içeren metin
    bozuk_ihale_metni = "C25 kalitesinde hazır betonun atılması işi (miktara göre)"
    
    print(f"Aranan Bozuk Metin: '{bozuk_ihale_metni}'")
    print("Vektörel eşleştirme başlatılıyor...\n")

    # Arama işlemi
    sonuclar = semantik_poz_ara(
        ihale_is_tanimi=bozuk_ihale_metni,
        kurum_filtresi="Test_Kurumu",
        top_k=2  # En yakın 2 sonucu getir
    )

    print("--- 3. FAZ: Matematiksel Sonuçlar ---")
    for i, sonuc in enumerate(sonuclar):
        print(f"Sonuç {i+1}:")
        print(f"  Poz No: {sonuc['poz_no']}")
        print(f"  Kurum Tanımı: {sonuc['is_tanimi']}")
        print(f"  Benzerlik Skoru (Kosinüs): %{sonuc['benzerlik_skoru'] * 100:.2f}")
        print("-" * 30)

if __name__ == "__main__":
    run_test()