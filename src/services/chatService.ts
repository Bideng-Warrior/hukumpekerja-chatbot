import { ChatMessage, CitationData } from '../domain/types';

// Mock API function to simulate RAG retrieval and generation
export async function sendMessage(query: string, history: ChatMessage[]): Promise<ChatMessage> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let content = "Terima kasih atas pertanyaannya. Sebagai informasi, hak-hak Anda dilindungi oleh Undang-Undang.";
      let citations: CitationData[] = [];

      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('phk') || lowerQuery.includes('pesangon')) {
        content = "Jika Anda mengalami PHK (Pemutusan Hubungan Kerja), Anda berhak atas uang pesangon, uang penghargaan masa kerja, dan uang penggantian hak, sesuai dengan alasan PHK tersebut. Besaran pastinya bergantung pada masa kerja Anda.";
        citations = [
          {
            uu: "UU Cipta Kerja",
            pasal: "Pasal 156",
            bab: "Bab IV Ketenagakerjaan",
            text: "Dalam hal terjadi pemutusan hubungan kerja, pengusaha wajib membayar uang pesangon dan/atau uang penghargaan masa kerja dan uang penggantian hak yang seharusnya diterima."
          }
        ];
      } else if (lowerQuery.includes('lembur')) {
        content = "Untuk kerja lembur, Anda berhak menerima upah lembur. Waktu kerja lembur maksimal adalah 4 jam sehari dan 18 jam seminggu. Pengusaha wajib membayar upah kerja lembur.";
        citations = [
          {
            uu: "Peraturan Pemerintah Pengganti Undang-Undang",
            pasal: "Pasal 78",
            bab: "Bab IV Ketenagakerjaan",
            text: "Pengusaha yang mempekerjakan pekerja/buruh melebihi waktu kerja, wajib membayar upah kerja lembur."
          },
          {
            uu: "PP PKWT",
            pasal: "Pasal 31",
            text: "Waktu kerja lembur hanya dapat dilakukan paling banyak 4 (empat) jam dalam 1 (satu) hari dan 18 (delapan belas) jam dalam 1 (satu) minggu."
          }
        ];
      } else {
        content = "Berdasarkan pedoman hukum yang ada, hal tersebut diatur dalam hukum ketenagakerjaan Indonesia. Jika ini adalah masalah serius, kami sarankan Anda berkonsultasi langsung dengan Disnaker atau LBH terdekat untuk mendapatkan pendampingan hukum resmi.";
      }

      resolve({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content,
        citations
      });
    }, 1500); // Simulate network latency
  });
}
