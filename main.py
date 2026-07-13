# main.py
import os
from dotenv import load_dotenv
from database import semantik_poz_ara, client  # database.py içindeki hazır istemciyi alıyoruz

def yapay_zeka_analizi_yap(sorgu: str, eslesmeler: list) -> str:
    """Retrieved (geri çağırılan) pozları ve kullanıcı sorgusunu alarak Gemini ile sentezler."""
    # Model için zengin bir bağlam (context) metni oluşturuyoruz
    context_metni = ""
    for idx, e in enumerate(eslesmeler):
        context_metni += f"Alternatif [{idx+1}]:\n"
        context_metni += f"  Kurum: {e['kurum']}\n"
        context_metni += f"  Poz No: {e['poz_no']}\n"
        context_metni += f"  Resmi Tanım: {e['is_tanimi']}\n"
        context_metni += f"  Birim Fiyat: {e['fiyat']:.2f} TL ({e['birim']})\n\n"
        
    prompt = f"""
    Sen kıdemli bir kamu ihale, hakediş ve yaklaşık maliyet uzmanısın.
    Kullanıcının ihaleye sokmak veya maliyetini hesaplamak istediği gayriresmi/serbest iş tanımı şudur:
    "{sorgu}"
    
    Veritabanımızda yapılan n-boyutlu semantik arama sonucunda bu işe en yakın bulunan resmi kurum pozları şunlardır:
    {context_metni}
    
    Görevin:
    1. Bu alternatifleri kullanıcının aradığı işe göre analitik olarak değerlendir.
    2. Aralarından kullanıcının iş tanımına matematiksel ve teknik olarak EN UYGUN olan temel pozu gerekçesiyle seç.
    3. Kullanıcıya bu imalatı yaparken nelere dikkat etmesi gerektiğine dair çok kısa, profesyonel bir teknik tavsiye ver.
    
    Yanıtını bir mühendise sunar gibi net, maddeler halinde ve profesyonel bir üslupla yaz. Türkçe olsun.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text #type: ignore
    except Exception as e:
        return f"Yapay zeka sentez analizi yapılamadı: {e}"

def main():
    load_dotenv()
    
    print("\n" + "="*75)
    print("İHALE ASİSTANI V2 - GENERATIVE RAG SENTEZ TERMİNALİ")
    print("="*75)
    print("Sistem Durumu: Vektör Uzayı ve Generative Sentez Motoru Aktif.")
    print("(Çıkış yapmak için 'q' tuşuna basın)\n")
    
    while True:
        print("[Filtre] [1] Tüm Kurumlar | [2] PTT | [3] ÇŞB | [4] KTB")
        secim = input("-> Seçiminiz (1-4): ").strip()
        
        if secim.lower() == 'q':
            break
            
        kurum_filtresi = {"2": "PTT", "3": "CSB", "4": "KTB"}.get(secim, None)
        if secim not in ["1", "2", "3", "4"]:
            print("\n[Varsayılan] Tüm kütüphane taranıyor...\n")
            
        sorgu = input("\n>>> Aranacak İhale İş Tanımını Girin: ").strip()
        
        if sorgu.lower() == 'q':
            break
        if not sorgu:
            continue
            
        print("\n[1/2] Veritabanında anlamsal uzay koordinatları taranıyor...")
        sonuclar = semantik_poz_ara(ihale_is_tanimi=sorgu, kurum_filtresi=kurum_filtresi, top_k=4)
        
        if not sonuclar:
            print("[-] Eşleşen veri bulunamadı.\n")
            print("-" * 75)
            continue
            
        # Ham veri dökümü
        print("\n[Bulunan En Yakın Resmi Pozlar]:")
        for i, sonuc in enumerate(sonuclar):
            print(f"  [{i+1}] %{sonuc['benzerlik_skoru']*100:.1f} Benzerlik | {sonuc['kurum']} - {sonuc['poz_no']} | {sonuc['fiyat']:.2f} TL ({sonuc['birim']})")
            
        print("\n[2/2] Yapay zeka uzman analiz raporu sentezleniyor, lütfen bekleyin...\n")
        
        # Generative RAG Sentezi
        analiz_raporu = yapay_zeka_analizi_yap(sorgu, sonuclar)
        
        print("="*75)
        print("HAKEDİŞ VE YAKLAŞIK MALİYET UZMAN RAPORU")
        print("="*75)
        print(analiz_raporu)
        print("="*75 + "\n")

if __name__ == "__main__":
    main()