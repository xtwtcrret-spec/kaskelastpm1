import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini Client safely
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API 1: AI Cash Flow Advisor & Financial Audit
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      const { groupName, totalBalance, totalIncome, totalExpense, unpaidDues, categoryBreakdown, recentTransactions } = req.body;

      const ai = getGenAI();

      const prompt = `
Anda adalah seorang konsultan keuangan dan auditor kas profesional independen untuk organisasi/kelas/komunitas di Indonesia.
Berikut adalah data kas saat ini untuk "${groupName || "Kas Organisasi"}":
- Total Saldo Kas: Rp ${Number(totalBalance || 0).toLocaleString("id-ID")}
- Total Pemasukan: Rp ${Number(totalIncome || 0).toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${Number(totalExpense || 0).toLocaleString("id-ID")}
- Total Tunggakan Iuran (Belum Dibayar): Rp ${Number(unpaidDues || 0).toLocaleString("id-ID")}
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
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              healthScore: { type: Type.INTEGER },
              healthStatus: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              anomaliesOrRisks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              projection3Month: { type: Type.STRING },
            },
            required: [
              "healthScore",
              "healthStatus",
              "summary",
              "keyInsights",
              "anomaliesOrRisks",
              "recommendations",
              "projection3Month",
            ],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Tidak ada respons teks dari AI.");
      }

      const parsedData = JSON.parse(text);
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Error in /api/gemini/advisor:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal menghasilkan analisis AI.",
      });
    }
  });

  // API 2: Smart AI Expense/Income Note Parser
  app.post("/api/gemini/parse-note", async (req, res) => {
    try {
      const { rawNote } = req.body;
      if (!rawNote || typeof rawNote !== "string") {
        return res.status(400).json({ success: false, error: "Catatan transaksi tidak boleh kosong." });
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
  "date": string (format YYYY-MM-DD, gunakan tanggal hari ini ${new Date().toISOString().split("T")[0]} jika tidak disebutkan)
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
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
            required: ["type", "amount", "category", "description", "contributor", "paymentMethod", "date"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gagal mengekstrak data transaksi.");
      }

      const parsed = JSON.parse(text);
      res.json({ success: true, data: parsed });
    } catch (error: any) {
      console.error("Error in /api/gemini/parse-note:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Gagal memproses catatan dengan AI.",
      });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server KasKita running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
