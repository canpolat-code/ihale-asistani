import os


def load_dotenv():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return False
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    return True


def main():
    # Çevresel değişkenleri yükle
    load_dotenv()
    print("İhale Asistanı Sistem Yöneticisi Başlatılıyor...")

if __name__ == "__main__":
    main()