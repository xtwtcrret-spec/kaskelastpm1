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
    const {
      groupName,
      totalBalance,
      totalIncome,
      totalExpense,
      unpaidDues,
      categoryBreakdown,
      recentTransactions,
    } = req.body;

    const ai = getGenAI();

    const prompt = `
Anda adalah seorang konsultan keuangan dan auditor kas profesional independen untuk organisasi/kelas/komunitas di Indonesia.
Berikut adalah data kas saat ini untuk "${groupName || 'Kas Organisasi'}":
- Total Saldo Kas: Rp ${Number(totalBalance || 0).toLocaleString('id-ID')}
- Total Pemasukan: Rp ${Number(totalIncome || 0).toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${Number(totalExpense || 0).toLocaleString('id-ID')}
- Total Tunggakan Iuran (Belum Dibayar): Rp ${Number(unpaidDues || 0).toLocaleString('id-ID')}
- Breakdown Kategori Pengeluaran: ${JSON.stringify(categoryBreakdown || [])}
- Transaksi Terakhir (10 sampel): ${JSON.stringify(recentTransactions || [])}

Tugas Anda:
Berikan analisis audit kas yang tajam, solutif, transparan, dan mudah dipahami oleh pengurus kas/bendahara dalam Bahasa Indonesia.
Keluarkan hasil HANYA dalam format JSON dengan struktur persis seperti berikut:
{
  "healthScore": number (0-100),
  "healthStatus": string ("Sangat Sehat" | "Sehat" | "Perlu Perhatian" | "Kritis"),
  "summary": string (2-3 kalimat ringkasan kondisi kas),
  "keyInsights": array of strings (3-4 poin fakta atau temuan penting),
  "anomaliesOrRisks": array of strings (2-3 potensi risiko, pemborosan, atau tunggakan iuran yang harus diwaspadai),
  "recommendations": array of strings (3-4 langkah aksi konkrit untuk bendahara agar kas makin sehat),
  "projection3Month": string (perkiraan kondisi kas 3 bulan ke depan jika pola pemasukan/pengeluaran bertahan)
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
            healthScore: { type: Type.INTEGER },
            healthStatus: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            anomaliesOrRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            projection3Month: { type: Type.STRING },
          },
          required: [
            'healthScore',
            'healthStatus',
            'summary',
            'keyInsights',
            'anomaliesOrRisks',
            'recommendations',
            'projection3Month',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Tidak ada respons teks dari AI.');

    const parsedData = JSON.parse(text);
    res.status(200).json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/gemini/advisor:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menghasilkan analisis AI.' });
  }
}
