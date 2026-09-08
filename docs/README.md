# Gallery documentation / Dokumentasi galeri

Current edition / Edisi saat ini: **1.1**, 8 September 2026.

| Language / Bahasa | Markdown | PDF |
|---|---|---|
| Bahasa Indonesia | [Guide](GALLERY-GUIDE.id.md) | [PDF](../output/pdf/interactive-gallery-guide.id.pdf) |
| English | [Guide](GALLERY-GUIDE.en.md) | [PDF](../output/pdf/interactive-gallery-guide.en.pdf) |

Version 1.1 documents the approved skylight room, shared layout constants, daylight lighting, and updated object/camera positions. The application uses Three.js building geometry inspired by the reference image; it does not use the image as a flat backdrop or as a GLB conversion.

Versi 1.1 mendokumentasikan ruangan skylight yang telah disetujui, konstanta layout bersama, pencahayaan siang, serta posisi objek/kamera terbaru. Bangunan dibuat dengan geometri Three.js berdasarkan gambar referensi.

## Rebuild / Ekspor ulang

The Markdown guides are the source of truth. Update both language editions before exporting. PDF diagrams render Mermaid connections as labeled vector arrows; the Markdown retains the original Mermaid graph syntax.

Markdown menjadi sumber utama. Perbarui kedua bahasa sebelum ekspor. Diagram PDF menampilkan koneksi Mermaid sebagai panah vektor berlabel; Markdown tetap menyimpan sintaks graph Mermaid.

```bash
python3 -m venv .venv-docs
.venv-docs/bin/pip install reportlab pymupdf pillow
.venv-docs/bin/python docs/build_guides.py --qa
```

Run these commands from the project root. The builder uses Arial/Courier New on macOS or DejaVu fonts on Linux. Install those fonts if missing. `--qa` writes rendered pages and contact sheets to `tmp/pdfs/v1.1-review/` for visual review; omit it to export PDFs only. Version labels are read from the Markdown front matter text.

Jalankan dari root proyek. Builder memakai Arial/Courier New pada macOS atau DejaVu pada Linux. Opsi `--qa` membuat preview untuk pemeriksaan visual. Hasil akhir ditulis ke `output/pdf/`, dengan nama file tetap agar tautan dokumen tidak berubah.
