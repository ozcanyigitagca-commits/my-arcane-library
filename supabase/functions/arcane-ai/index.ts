import { withSupabase } from 'npm:@supabase/server'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'gemini-3.6-flash'
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

async function callGemini(apiKey: string, contents: any[], systemInstruction: string, config: any = {}) {
  const model = Deno.env.get('GEMINI_MODEL') || MODEL
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: config,
    }),
  })
  const raw = await resp.text()
  let data: any = null
  try { data = JSON.parse(raw) } catch {}
  if (!resp.ok) {
    const detail = data?.error?.message || raw || 'Gemini isteği reddetti.'
    const code = data?.error?.status || ''
    throw new Error(`Gemini API hatası (${resp.status})${code ? ` [${code}]` : ''}: ${detail}`)
  }
  const answer = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n').trim() || ''
  return { data, answer, model }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'POST') return json({ error: 'POST gerekli.' }, 405)

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'GEMINI_API_KEY Supabase Secret olarak bulunamadı.' }, 200)

    const body = await req.json().catch(() => ({}))
    const { data: books, error } = await ctx.supabase
      .from('books')
      .select('title,author,pages,read,category,status,rating,notes,fav,updated_at')
      .order('updated_at', { ascending: false }).limit(200)
    if (error) return json({ error: 'Kitaplık okunamadı: ' + error.message }, 200)

    const library = (books || []).map((b: any) => ({
      title: b.title, author: b.author, pages: Number(b.pages || 0), read: Number(b.read || 0),
      category: b.category || 'Belirtilmemiş', status: b.status || 'unread', rating: b.rating ?? null,
      notes: b.notes || '', favorite: !!b.fav,
    }))
    const totalPages = library.reduce((n: number, b: any) => n + b.pages, 0)
    const readPages = library.reduce((n: number, b: any) => n + Math.min(b.read, b.pages), 0)
    const finished = library.filter((b: any) => b.status === 'finished').length
    const reading = library.filter((b: any) => b.status === 'reading').length

    const system = `Sen My Arcane Library'nin kişisel Türkçe kitap danışmanı Arcane AI'sın.
ÇOK ÖNEMLİ KURALLAR:
1) Kullanıcının mesajına doğrudan cevap ver. Kullanıcı selam vermediyse ASLA "Merhaba", "Selam", "Hoş geldin" gibi giriş yapma.
2) Soruyu tekrar etme. Gereksiz nezaket cümleleri kullanma.
3) Cevap yarım kalmamalı. Düşünceni tamamla; en az 3 anlamlı cümle veya gerektiğinde maddeler kullan.
4) Kitaplık verisini gerçekten kullan. Kitap sayısı, yazar, tür, puan, okuma durumu ve notları dikkate al.
5) Kullanıcının kitabında olmayan kitapları öner. Okunmuş/okunmakta olan kitapları tekrar önerme.
6) Türkçe konuş. Yabancı kitapların yaygın Türkçe adını kullan; emin değilsen başlığı uydurma.
7) Kullanıcı "analiz et", "profil çıkar", "zevkimi söyle" derse somut örneklerle analiz yap; yalnızca "kitaplığın var" deme.
8) Kullanıcı aylık plan isterse gerçekçi bir plan çıkar; mevcut okuma hızını kitaplık geçmişindeki sayfa kayıtlarından hesapla, veri yetersizse bunu açıkça belirt.
9) Kullanıcı bir kitap sorarsa, yalnızca kitaplığındaki verilere dayanmak zorunda değilsin; genel kitap bilgisini kullanabilirsin ama uydurma ayrıntı verme.
10) Yanıtı kullanıcıya fayda sağlayacak biçimde yapılandır: kısa başlıklar ve maddeler uygundur.

KİTAPLIK ÖZETİ:
Toplam kitap: ${library.length}
Toplam sayfa: ${totalPages}
Okunmuş sayfa: ${readPages}
Tamamlanan: ${finished}
Okunuyor: ${reading}
Kitaplık verisi JSON: ${JSON.stringify(library)}`

    // Health check: validate the secret + model with a tiny real Gemini call.
    if (body?.health) {
      try {
        const result = await callGemini(apiKey, [{ role: 'user', parts: [{ text: 'Sadece "OK" yaz.' }] }], 'Bir bağlantı testi yapılıyor. Sadece OK yaz.', { maxOutputTokens: 20 })
        return json({ ok: result.answer.toUpperCase().includes('OK'), message: 'Gemini bağlantısı çalışıyor.', checks: [
          { ok: true, name: 'Supabase Edge Function', detail: 'Çalışıyor' },
          { ok: true, name: 'GEMINI_API_KEY', detail: 'Secret bulundu' },
          { ok: true, name: 'Gemini API', detail: 'HTTP 200' },
          { ok: true, name: 'Model', detail: result.model },
        ] })
      } catch (e) {
        return json({ ok: false, message: 'Gemini bağlantısı başarısız.', checks: [
          { ok: true, name: 'Supabase Edge Function', detail: 'Çalışıyor' },
          { ok: true, name: 'GEMINI_API_KEY', detail: 'Secret bulundu' },
          { ok: false, name: 'Gemini API', detail: String((e as Error).message || e) },
          { ok: false, name: 'Model', detail: Deno.env.get('GEMINI_MODEL') || MODEL },
        ] })
      }
    }

    // Structured recommendation mode: predictable JSON for UI cards.
    if (body?.mode === 'recommendations') {
      const count = Math.min(Math.max(Number(body.count) || 5, 1), 8)
      const schema = {
        type: 'OBJECT',
        properties: {
          recommendations: {
            type: 'ARRAY', items: { type: 'OBJECT', properties: {
              title: { type: 'STRING' }, author: { type: 'STRING' }, reason: { type: 'STRING' },
            }, required: ['title', 'author', 'reason'] }
          }
        }, required: ['recommendations']
      }
      try {
        const result = await callGemini(apiKey, [{ role: 'user', parts: [{ text: `${count} kitap öner. Her öneride Türkçe başlık, yazar ve kişisel neden olsun.` }] }], system + '\nÖNERİ MODU: Yalnızca gerçekten yeni ve uygun kitaplar seç.', {
          responseMimeType: 'application/json', responseSchema: schema, maxOutputTokens: 1200,
        })
        let parsed: any = {}
        try { parsed = JSON.parse(result.answer) } catch { parsed = { recommendations: [] } }
        const have = new Set(library.map((b: any) => b.title.toLocaleLowerCase('tr-TR')))
        parsed.recommendations = (parsed.recommendations || []).filter((x: any) => x?.title && !have.has(String(x.title).toLocaleLowerCase('tr-TR'))).slice(0, count)
        return json({ recommendations: parsed.recommendations, model: result.model })
      } catch (e) { return json({ error: String((e as Error).message || e) }, 200) }
    }

    const message = String(body?.message || '').trim()
    if (!message) return json({ answer: 'Sorunu veya yapmak istediğin işlemi yaz; kitaplığını buna göre analiz edeyim.' })
    if (message.length > 5000) return json({ error: 'Mesaj çok uzun. Lütfen 5000 karakterden kısa bir mesaj gönder.' }, 200)

    const history = Array.isArray(body?.history) ? body.history.slice(-10) : []
    const contents = history.filter((h: any) => (h?.role === 'user' || h?.role === 'model') && h?.text).map((h: any) => ({ role: h.role, parts: [{ text: String(h.text).slice(0, 4000) }] }))
    contents.push({ role: 'user', parts: [{ text: message }] })

    try {
      const result = await callGemini(apiKey, contents, system, { maxOutputTokens: 1400 })
      return json({ answer: result.answer || 'Yanıt üretilemedi. Lütfen soruyu yeniden deneyelim.', model: result.model })
    } catch (e) {
      return json({ error: String((e as Error).message || e) }, 200)
    }
  }),
}
