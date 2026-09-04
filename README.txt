MY ARCANE LIBRARY v11

V11, V10 üzerindeki Arcane AI backendini OpenAI yerine Google Gemini API ile çalıştırır.
Gemini ücretsiz katmanda desteklenen modeller kullanılabilir; varsayılan model: gemini-3.7-flash.

KURULUM
1) Google AI Studio üzerinden bir Gemini API anahtarı oluştur.
2) Supabase Dashboard > Edge Functions > arcane-ai > Secrets bölümünde GEMINI_API_KEY adında secret oluştur ve anahtarı buraya gir.
3) İstersen GEMINI_MODEL secret'ını gemini-3.7-flash olarak bırakabilirsin; kod zaten bu modeli varsayılan kullanır.
4) supabase/functions/arcane-ai/index.ts dosyasını Edge Function olarak deploy et.
5) Siteyi Ctrl+F5 ile yenile ve Arcane AI'yı test et.

GÜVENLİK
Gemini API anahtarını index.html içine koyma ve kullanıcıya açık frontend koduna yazma. Anahtar yalnızca Supabase Edge Function secret olarak tutulmalıdır.

V11'DE KORUNANLAR
- Kütüphane arayüzü ve arka plan
- Supabase giriş / kayıt
- Kitap ekleme ve takip
- Arkadaş sistemi ve arkadaş kitaplıkları
- Puan / yorum sistemi
- Türkçe kitap önerileri
- İstatistikler ve okuma geçmişi
- Arcane AI arayüzü
