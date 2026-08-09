import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { rawNote } = req.body;
    if (!rawNote || typeof rawNote !== 'string') {
      return res.status(400).json({ success: false, error: 'Catatan transaksi tidak boleh kosong.' });
    }

    const ai = getGenAI();

    const prompt = `
Ekstrak informasi transaksi kas dari teks bebas Bahasa Indonesia berikut ini menjadi format JSON terstruktur:
"${rawNote}"

Ketentuan Kategori standar:
- Pemasukan: "Iuran Anggota", "Donasi/Sponsor", "Bunga Bank/Cashback", "Pemasukan Lainnya"
- Pengeluaran: "Konsumsi & Acara", "Peralatan & ATK", "Operasional & Kebersihan", "Transportasi & Logistik", "Kesehatan & Darurat", "Pengeluaran Lainnya"

Ketentuan Metode Pembayaran: "Tunai", "Transfer Bank", "QRIS", "e-Wallet (GoPay/OVO/Dana)"

Keluarkan HANYA JSON dengan properti:
{
  "type": "pemasukan" | "pengeluaran",
  "amount": number (nominal Rupiah tanpa titik/koma),
  "category": string (salah satu kategori standar di atas),
  "description": string (penjelasan singkat transaksi),
  "contributor": string (nama orang/pihak terkait jika ada, jika tidak ada isi "-"),
  "paymentMethod": string (salah satu metode pembayaran di atas),
  "date": string (format YYYY-MM-DD, gunakan tanggal hari ini ${new Date().toISOString().split('T')[0]} jika tidak disebutkan)
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            contributor: { type: Type.STRING },
            paymentMethod: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ['type', 'amount', 'category', 'description', 'contributor', 'paymentMethod', 'date'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Gagal mengekstrak data transaksi.');

    const parsed = JSON.parse(text);
    res.status(200).json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-note:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memproses catatan dengan AI.' });
  }
}
