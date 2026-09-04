import { withSupabase } from 'npm:@supabase/server'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { ...cors, 'Content-Type': 'application/json' }
  })

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'POST') return json({ error: 'POST gerekli.' }, 405)

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'GEMINI_API_KEY Supabase secret olarak tanımlanmamış.' }, 500)

    const body = await req.json().catch(() => ({}))
    const message = String(body?.message || '').trim()
    if (!message) return json({ error: 'Mesaj boş olamaz.' }, 400)
    if (message.length > 4000) return json({ error: 'Mesaj çok uzun.' }, 400)

    const { data: books, error } = await ctx.supabase
      .from('books')
      .select('title,author,pages,read,category,status,rating,notes,fav,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) return json({ error: 'Kitaplık okunamadı.' }, 500)

    const library = (books || []).map((b: any) => ({
      title: b.title,
      author: b.author,
      pages: b.pages,
      read: b.read,
      category: b.category,
      status: b.status,
      rating: b.rating,
      notes: b.notes,
      favorite: b.fav
    }))

    const instructions = `Sen My Arcane Library uygulamasının Türkçe konuşan kişisel kitap danışmanı Arcane AI'sın.
Kullanıcının kitaplık verisini analiz ederek doğal, samimi ve faydalı cevaplar ver.
Kitap önerisi isterse öncelikle Türkçe yazılmış eserleri veya Türkçeye çevrilmiş ve Türkiye'de yaygın bulunan eserleri öner.
Yabancı eserleri İngilizce başlığıyla verme; Türkçe çeviri adıyla yaz.
Emin olmadığın Türkçe başlıkları uydurma.
Kullanıcının okuduğu veya okumakta olduğu kitapları tekrar önerme.
Mümkün olduğunda tür, yazar, puan ve notlarından zevk çıkar.
Cevaplarını Türkçe ver ve gereksiz uzunlukta yazma.

Kullanıcının kitaplık verisi:
${JSON.stringify(library)}`

    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.7-flash'
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: instructions }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: message }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 900
        }
      })
    })

    if (!r.ok) {
      const detail = await r.text()
      console.error('Gemini API error:', detail)
      let friendly = 'Gemini AI servisi yanıt vermedi.'
      try {
        const parsed = JSON.parse(detail)
        const apiMessage = parsed?.error?.message
        if (apiMessage) friendly = `Gemini API hatası (${r.status}): ${apiMessage}`
      } catch (_) {}
      return json({ error: friendly }, 502)
    }

    const data = await r.json()
    const answer = (data?.candidates || [])
      .flatMap((c: any) => c?.content?.parts || [])
      .map((p: any) => p?.text || '')
      .filter(Boolean)
      .join('\n')
      .trim()

    return json({ answer: answer || 'Şu anda yanıt oluşturamadım.' })
  })
}
