My Arcane Library v13.1 — Raf Güvenlik Sürümü

Bu paket kişisel sanal kütüphane, okuma takibi, hedefler, tavsiyeler, film/TV uyarlamaları, arkadaşlar ve Arcane AI içerir.

v13.1 düzeltmeleri:
- Raf kartlarına tıklama artık yalnızca kitap ayrıntısını açar; kitap silme ile hiçbir bağlantısı yoktur.
- Kitap kartları data-book-id + olay dinleme ile güvenli şekilde açılır.
- Supabase sorgusu hata verdiğinde yerel kitaplık artık boş listeyle ezilmez.
- Bulut boş dönerse mevcut yerel kitaplar korunur ve mümkünse buluta geri yazılır.
- Yerel ve bulut kitapları güncelleme tarihine göre güvenli şekilde birleştirilir.
- Buluttan silme başarısız olursa kitap otomatik olarak geri yüklenir.
- PWA manifestine 192/512 PNG ikonları eklendi.
- Service Worker yeni sürümde HTML için network-first çalışır; eski kodun cache'de takılı kalması azaltıldı.
- JSON yedek adı v13 olarak güncellendi.

Supabase Edge Function: supabase/functions/arcane-ai/index.ts
