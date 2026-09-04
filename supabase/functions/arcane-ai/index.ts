import { withSupabase } from 'npm:@supabase/server'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const cleanJson = (s: string) => s.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim()

async function callGemini(apiKey: string, model: string, payload: unknown) {
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
  })
  const text = await resp.text()
  let data: any = null
  try { data = JSON.parse(text) } catch { data = null }
  return { resp, text, data }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'POST') return json({ error: 'POST gerekli.' }, 405)

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash'
    if (!apiKey) return json({ error: 'GEMINI_API_KEY Supabase Secret olarak bulunamadı.' })

    const body = await req.json().catch(() => ({}))

    if (body?.health) {
      try {
        const { resp, data } = await callGemini(apiKey, model, {
          contents: [{ role: 'user', parts: [{ text: 'Yanıt olarak sadece OK yaz.' }] }],
          generationConfig: { maxOutputTokens: 8 },
        })
        if (!resp.ok) {
          const msg = data?.error?.message || 'Gemini isteği reddetti.'
          return json({ ok: false, message: 'Gemini bağlantısı başarısız.', checks: [
            { name: 'Supabase Edge Function', ok: true, detail: 'Çalışıyor' },
            { name: 'GEMINI_API_KEY', ok: true, detail: 'Secret bulundu' },
            { name: 'Gemini API', ok: false, detail: `HTTP ${resp.status}: ${msg}` },
            { name: 'Model', ok: true, detail: model },
          ] })
        }
        return json({ ok: true, message: 'Arcane AI bağlantısı sağlıklı.', checks: [
          { name: 'Supabase Edge Function', ok: true, detail: 'Çalışıyor' },
          { name: 'GEMINI_API_KEY', ok: true, detail: 'Secret bulundu' },
          { name: 'Gemini API', ok: true, detail: 'Yanıt alındı' },
          { name: 'Model', ok: true, detail: model },
        ] })
      } catch (e) {
        return json({ ok: false, message: 'Gemini bağlantı testi teknik olarak başarısız.', checks: [{ name: 'Gemini API', ok: false, detail: String((e as any)?.message || e) }] })
      }
    }

    const { data: books, error } = await ctx.supabase
      .from('books')
      .select('title,author,pages,read,category,status,rating,notes,fav,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (error) return json({ error: 'Supabase kitaplık sorgusunda hata: ' + error.message })

    const library = (books || []).map((b: any) => ({
      title: b.title, author: b.author, pages: b.pages, read: b.read,
      category: b.category, status: b.status, rating: b.rating, notes: b.notes, favorite: b.fav,
    }))
    const base = `Sen My Arcane Library uygulamasının Türkçe konuşan kişisel kitap danışmanı Arcane AI'sın. Kullanıcıya doğal, samimi ve faydalı cevap ver. Kullanıcının kitaplığını dikkate al. Kitaplıkta bulunan veya okunmuş kitapları tekrar önerme. Yabancı eserleri Türkçe yaygın çeviri adıyla yaz. Emin olmadığın Türkçe başlıkları uydurma. Kütüphane verisi: ${JSON.stringify(library)}`

    try {
      if (body?.mode === 'recommendations') {
        const count = Math.min(8, Math.max(1, Number(body.count) || 5))
        const prompt = base + `\n${count} adet yeni kitap öner. SADECE JSON döndür, markdown kullanma. Şema: {"recommendations":[{"title":"...","author":"...","reason":"..."}]}. Her önerinin kısa ve kişisel bir nedeni olsun.`
        const { resp, data } = await callGemini(apiKey, model, {
          systemInstruction: { parts: [{ text: prompt }] },
          contents: [{ role: 'user', parts: [{ text: 'Kitap önerilerimi hazırla.' }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 900, responseMimeType: 'application/json' },
        })
        if (!resp.ok) return json({ error: `Gemini API hatası (${resp.status}): ${data?.error?.message || 'Gemini isteği reddetti.'}` })
        const raw = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '{}'
        let parsed: any = {}
        try { parsed = JSON.parse(cleanJson(raw)) } catch { parsed = { recommendations: [] } }
        return json({ recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [] })
      }

      const message = String(body?.message || '').trim()
      if (!message) return json({ error: 'Mesaj boş olamaz.' })
      const { resp, data } = await callGemini(apiKey, model, {
        systemInstruction: { parts: [{ text: base + '\nKitap önerisi istenirse nedenlerini açıkla. Gereksiz uydurma bilgi verme.' }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 },
      })
      if (!resp.ok) return json({ error: `Gemini API hatası (${resp.status}): ${data?.error?.message || 'Gemini isteği reddetti.'}` })
      const answer = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n').trim()
      return json({ answer: answer || 'Şu anda yanıt oluşturamadım.' })
    } catch (e) {
      return json({ error: 'Gemini servisine bağlanırken teknik hata oluştu: ' + String((e as any)?.message || e) })
    }
  }),
}
