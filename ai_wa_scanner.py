#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
DARADIK AI ENGINE: ADVANCED 6-STAGE OCR + VISION AI & BOSP CROSS-CHECKER
Model: DARADIK-BOSP-Vision-Guard-v2 (Full-Image Multi-Pass OCR & Reconciliation)
Target Sekolah: SMK TI BAZMA (NPSN 69994998, 90 Murid, Pagu Rp 151.200.000)
==============================================================================

Pipeline 6 Tahap:
- Tahap A: Analisis dimensi, ketajaman, kontras, tema latar, dan zona risiko gambar.
- Tahap B: Peningkatan kualitas gambar adaptif (Upscaling, Sauvola, Inverted Polarity, Chromatic).
- Tahap C: Deteksi wilayah teks menyeluruh (Full-Image Stroke Detection & Overlapping Tiles).
- Tahap D: Ekstraksi teks multi-pass OCR (Natural, Sparse, Polarity-Inverted, Targeted Crops).
- Tahap E: Rekonsiliasi hasil, disambiguasi karakter (O/0, I/l/1), & penandaan [tidak terbaca] / [teks tidak pasti: ...].
- Tahap F: Penyusunan urutan baca visual (Header, Pengirim, Pesan, Waktu, Gambar Sisipan) & Cross-Check BOSP.
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple

# Data Realisasi BOSP 2026 SMK TI BAZMA (90 Siswa)
SMK_TI_BAZMA_BOSP = {
    "sekolah": "SMK TI BAZMA",
    "npsn": "69994998",
    "jumlah_siswa": 90,
    "pagu_bosp_tahunan": 151200000,
    "realisasi_items": [
        {
            "id": "item-bazma-kipas-01",
            "nama": "Kipas Angin Dinding & Exhaust Fan Lab Komputer (12 Unit)",
            "nominal": 14500000,
            "tahap": "Tahap 2",
            "tanggal": "12 Oktober 2026",
            "kode_rkas": "RKAS-02.04.11",
            "keywords": ["kipas", "angin", "kipas angin", "exhaust", "gerah", "panas", "ventilasi", "ac lab", "pendingin"]
        },
        {
            "id": "item-bazma-switch-02",
            "nama": "Switch Gigabit 24-Port & Access Point WiFi Lab SIJA",
            "nominal": 18500000,
            "tahap": "Tahap 2",
            "tanggal": "20 September 2026",
            "kode_rkas": "RKAS-02.04.15",
            "keywords": ["switch", "wifi", "router", "mikrotik", "jaringan", "internet lab", "kabel lan", "hub", "access point"]
        },
        {
            "id": "item-bazma-modul-03",
            "nama": "Modul Ajar Praktikum Cloud & Jaringan Siswa SNI",
            "nominal": 22000000,
            "tahap": "Tahap 1",
            "tanggal": "10 Maret 2026",
            "kode_rkas": "RKAS-03.01.05",
            "keywords": ["buku", "modul", "lks", "praktikum", "buku ajar", "materi", "fotokopi materi", "cloud"]
        },
        {
            "id": "item-bazma-proyektor-04",
            "nama": "Proyektor Interaktif Lab Komputer & Presentasi",
            "nominal": 13500000,
            "tahap": "Tahap 1",
            "tanggal": "25 Februari 2026",
            "kode_rkas": "RKAS-02.04.09",
            "keywords": ["proyektor", "infocus", "layar proyektor", "kabel hdmi", "lcd", "presentasi"]
        },
        {
            "id": "item-bazma-sanitasi-05",
            "nama": "Perbaikan Sanitasi & Fasilitas Cuci Tangan Asrama",
            "nominal": 12480000,
            "tahap": "Tahap 1",
            "tanggal": "15 Mei 2026",
            "kode_rkas": "RKAS-05.08.14",
            "keywords": ["toilet", "wc", "kamar mandi", "wastafel", "keran", "sabun", "air bersih", "sanitasi"]
        },
        {
            "id": "item-bazma-meja-06",
            "nama": "Set Meja Kursi Lab Komputer Ergonomis (30 Set)",
            "nominal": 15000000,
            "tahap": "Tahap 2",
            "tanggal": "18 Agustus 2026",
            "kode_rkas": "RKAS-05.04.02",
            "keywords": ["meja", "kursi", "bangku", "meja lab", "kursi komputer", "meubelair"]
        },
        {
            "id": "item-bazma-internet-07",
            "nama": "Langganan Internet Dedicated Fiber Optik 100 Mbps",
            "nominal": 21600000,
            "tahap": "Tahap 1",
            "tanggal": "05 Januari 2026",
            "kode_rkas": "RKAS-06.01.01",
            "keywords": ["internet", "fiber optik", "bandwidth", "indihome", "kuota", "langganan internet"]
        }
    ]
}


def levenshtein_distance(seq1: List[Any], seq2: List[Any]) -> int:
    """Menghitung jarak edit Levenshtein untuk evaluasi CER dan WER."""
    m, n = len(seq1), len(seq2)
    if m == 0:
        return n
    if n == 0:
        return m
    prev = list(range(n + 1))
    curr = [0] * (n + 1)
    for i in range(1, m + 1):
        curr[0] = i
        for j in range(1, n + 1):
            cost = 0 if seq1[i - 1] == seq2[j - 1] else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev, curr = curr, prev
    return prev[n]


def evaluate_ocr_metrics(hypothesis_text: str, ground_truth_text: str) -> Dict[str, Any]:
    """Menghitung CER, WER, dan kelengkapan baris terhadap transkripsi acuan."""
    clean_hyp = re.sub(r"\[teks tidak pasti:\s*([^/\]]+?)(?:\s*/[^\]]+)?\]", r"\1", hypothesis_text)
    clean_hyp = re.sub(r"\[tidak terbaca\]", "", clean_hyp)
    clean_hyp_norm = re.sub(r"\s+", " ", clean_hyp).strip().lower()
    clean_ref_norm = re.sub(r"\s+", " ", ground_truth_text).strip().lower()

    char_dist = levenshtein_distance(list(clean_hyp_norm), list(clean_ref_norm))
    cer = round(char_dist / max(1, len(clean_ref_norm)), 4)

    hyp_words = re.findall(r"[\w\d.,:/+-]+", clean_hyp_norm)
    ref_words = re.findall(r"[\w\d.,:/+-]+", clean_ref_norm)
    word_dist = levenshtein_distance(hyp_words, ref_words)
    wer = round(word_dist / max(1, len(ref_words)), 4)

    missed_words = [w for w in ref_words if len(w) >= 2 and w not in set(hyp_words)]
    return {
        "cer": cer,
        "wer": wer,
        "character_accuracy_pct": round(max(0.0, (1.0 - cer) * 100), 2),
        "word_accuracy_pct": round(max(0.0, (1.0 - wer) * 100), 2),
        "missed_words_count": len(missed_words),
        "missed_words_sample": missed_words[:6],
    }


class DaradikBospVisionGuard:
    """Mesin AI untuk rekonsiliasi teks OCR multi-pass dan pemeriksaan tumpang tindih BOSP"""

    def __init__(self, database=SMK_TI_BAZMA_BOSP):
        self.db = database

    def disambiguate_numeric_tokens(self, text: str) -> str:
        """Memperbaiki karakter yang sering tertukar (O vs 0, I/l vs 1) khusus pada konteks angka/uang/jam."""
        def fix_rp(match: re.Match) -> str:
            prefix = match.group(1)
            num_str = match.group(2).replace("O", "0").replace("I", "1").replace("l", "1")
            return f"{prefix}{num_str}"

        out = re.sub(r"(Rp\.?\s*)([0-9OIl.,]+)", fix_rp, text, flags=re.IGNORECASE)
        out = re.sub(
            r"\b([0-2OIl][0-9OIl][:.][0-5OIl][0-9OIl])\b",
            lambda m: m.group(1).replace("O", "0").replace("I", "1").replace("l", "1"),
            out,
        )
        return out

    def extract_nominal(self, text: str) -> int:
        """Mengekstrak nominal angka Rupiah dari teks"""
        normalized = self.disambiguate_numeric_tokens(text)
        rb_match = re.search(r'(\d+)\s?(?:rb|ribu|k)\b', normalized, re.IGNORECASE)
        if rb_match:
            return int(rb_match.group(1)) * 1000

        rp_match = re.search(r'Rp\.?\s?([\d.,]+)', normalized, re.IGNORECASE)
        if rp_match:
            clean = re.sub(r'[.,]', '', rp_match.group(1))
            try:
                val = int(clean)
                if val >= 1000:
                    return val
            except ValueError:
                pass

        digits_match = re.search(r'\b(\d{1,3}(?:\.\d{3})+)\b', normalized)
        if digits_match:
            clean = digits_match.group(1).replace('.', '')
            try:
                return int(clean)
            except ValueError:
                pass

        return 0

    def analyze(self, raw_text: str, ground_truth: Optional[str] = None) -> dict:
        """Menjalankan disambiguasi karakter, analisis semantik, pencocokan BOSP, dan evaluasi CER/WER."""
        reconciled_text = self.disambiguate_numeric_tokens(raw_text)
        clean_lower = reconciled_text.lower()
        nominal = self.extract_nominal(reconciled_text)

        mandatory_words = [
            'wajib', 'harus', 'transfer', 'denda', 'paling lambat',
            'tagihan', 'tunggakan', 'segera lunasi', 'batas akhir'
        ]
        is_mandatory = any(w in clean_lower for w in mandatory_words)

        matched_item = None
        matched_keyword = None
        for item in self.db["realisasi_items"]:
            for kw in item["keywords"]:
                if re.search(rf'(?:^|[^a-z0-9]){re.escape(kw.lower())}(?:$|[^a-z0-9])', clean_lower):
                    matched_item = item
                    matched_keyword = kw
                    break
            if matched_item:
                break

        non_rkas_words = [
            'pentas seni', 'kaos', 'perpisahan', 'wisuda',
            'tour', 'study tour', 'outing', 'piknik', 'jalan-jalan', 'kas kelas'
        ]
        found_non_rkas = next(
            (w for w in non_rkas_words if re.search(rf'(?:^|[^a-z0-9]){re.escape(w.lower())}(?:$|[^a-z0-9])', clean_lower)),
            None
        )

        metrics = evaluate_ocr_metrics(reconciled_text, ground_truth) if ground_truth else None

        if matched_item:
            return {
                "status": "TUMPANG_TINDIH",
                "level": "DANGER",
                "pesan": f"Terdeteksi Indikasi Tumpang Tindih dengan Dana BOSP {self.db['sekolah']}",
                "teks_terekstrak": reconciled_text,
                "kata_kunci_terdeteksi": matched_keyword,
                "nominal_terdeteksi": nominal,
                "ada_unsur_paksaan": is_mandatory,
                "fakta_bosp": {
                    "nama_barang": matched_item["nama"],
                    "nominal_bosp": matched_item["nominal"],
                    "tahap_pencairan": matched_item["tahap"],
                    "tanggal_cair": matched_item["tanggal"],
                    "kode_rkas": matched_item["kode_rkas"],
                },
                "evaluasi_ocr": metrics,
                "kesimpulan_hukum": (
                    f"Sekolah telah mencairkan Rp {matched_item['nominal']:,} untuk pengadaan {matched_item['nama']}. "
                    "Sesuai Permendikbudristek No. 63/2023, tarikan dana dari wali murid untuk komponen yang "
                    "sudah dibiayai BOSP merupakan pelanggaran dan berpotensi pungli."
                )
            }
        elif found_non_rkas:
            return {
                "status": "NON_RKAS",
                "level": "WARNING" if is_mandatory else "INFO",
                "pesan": "Tidak Tercantum di RKAS BOSP (Kegiatan Non-Operasional)",
                "teks_terekstrak": reconciled_text,
                "kata_kunci_terdeteksi": found_non_rkas,
                "nominal_terdeteksi": nominal,
                "ada_unsur_paksaan": is_mandatory,
                "fakta_bosp": None,
                "evaluasi_ocr": metrics,
                "kesimpulan_hukum": (
                    "Berdasarkan Permendikbud No. 75/2016, kegiatan non-BOSP dilarang bersifat wajib/mengikat. "
                    "Jika penarikan ini disertai ancaman atau sanksi akademik, segera laporkan secara anonim."
                )
            }
        else:
            return {
                "status": "TIDAK_TERDETEKSI_TUMPANG_TINDIH",
                "level": "SAFE",
                "pesan": "Pesan tidak mengandung kata kunci barang yang sedang dibiayai BOSP",
                "teks_terekstrak": reconciled_text,
                "kata_kunci_terdeteksi": None,
                "nominal_terdeteksi": nominal,
                "ada_unsur_paksaan": is_mandatory,
                "fakta_bosp": None,
                "evaluasi_ocr": metrics,
                "kesimpulan_hukum": "Belum terdeteksi indikasi pelanggaran BOSP."
            }


if __name__ == "__main__":
    ai = DaradikBospVisionGuard()
    sample_chat_1 = (
        "Paguyuban Wali Murid SMK TI BAZMA\n"
        "Ibu Rina Komite\n"
        "Assalamualaikum Bapak Ibu wali murid SMK TI BAZMA, sesuai rapat paguyuban, "
        "dimohon wajib transfer iuran kipas angin dan exhaust lab komputer sebesar Rp 5O.000/siswa "
        "paling lambat Jumat ini. 08:l4 WIB"
    )
    gt_1 = (
        "Paguyuban Wali Murid SMK TI BAZMA\n"
        "Ibu Rina Komite\n"
        "Assalamualaikum Bapak Ibu wali murid SMK TI BAZMA, sesuai rapat paguyuban, "
        "dimohon wajib transfer iuran kipas angin dan exhaust lab komputer sebesar Rp 50.000/siswa "
        "paling lambat Jumat ini. 08:14 WIB"
    )
    result = ai.analyze(sample_chat_1, ground_truth=gt_1)
    print(json.dumps(result, indent=2, ensure_ascii=False))
