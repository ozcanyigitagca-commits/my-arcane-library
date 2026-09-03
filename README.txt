MY ARCANE LIBRARY v8
====================

Supabase bağlantısı bu paket için yapılandırıldı.

Proje:
https://khmcgiklbnogsamvqjrj.supabase.co

İçerik:
- index.html
- library-bg.png
- supabase.sql
- README.txt

Online kullanım:
1) index.html ve library-bg.png dosyalarını bir statik hosting'e yükle.
2) Siteyi aç.
3) Hesap > Kayıt Ol ile kullanıcı oluştur.
4) E-posta doğrulaması açıksa gelen kutundan hesabı doğrula.
5) Giriş yaptıktan sonra kitaplar Supabase'de hesabına özel saklanır.

Güvenlik:
- Veritabanında RLS aktif.
- Kullanıcı yalnızca kendi books kayıtlarını okuyup değiştirebilir.
- HTML içine service_role anahtarı konulmamıştır; yalnızca publishable key kullanılmıştır.

Not:
- Site internet olmadan da yerel modda açılabilir.
- Kitap kapakları ve kitap araması Open Library üzerinden gelir.
