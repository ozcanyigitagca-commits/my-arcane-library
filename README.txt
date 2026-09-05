MY ARCANE LIBRARY v13 — STABLE

Bu sürüm V12'nin daha dayanıklı, yerel-öncelikli paketidir.

Öne çıkanlar:
- Tavsiyeler ve filmli kitaplar ağ/API çalışmasa bile yerel katalogdan hemen görünür.
- Open Library kapakları ve kitap araması timeout + hata yakalama ile çalışır.
- Supabase senkronizasyonu giriş yapan kullanıcı için korunur; localStorage yedek olarak çalışır.
- JSON dışa/içe aktarma korunur.
- GitHub Pages için PWA/service-worker dosyaları eklendi; sayfa kabuğu offline açılabilir.
- Arcane AI Edge Function: supabase/functions/arcane-ai/index.ts

AI için Supabase Secret:
GEMINI_API_KEY
İsteğe bağlı:
GEMINI_MODEL=gemini-3.6-flash

GitHub Pages yalnızca frontend'i yayınlar. Supabase Edge Function ayrıca Supabase üzerinde deploy edilmelidir.
