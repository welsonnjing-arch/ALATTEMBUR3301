# FYNUX OS — Disaster Recovery & Backup Runbook
**Sistem Operasional Bisnis Internal Fynux Digital Solutions**
*Dokumen Prosedur Pemulihan Bencana, Integritas Transaksi & Keamanan Data (v1.0)*

---

## 1. Prinsip Integritas Data & Anti-Loss

Fynux OS dirancang dengan standar ketat integritas relasional PostgreSQL untuk menjamin data keuangan, faktur resmi, dan catatan garansi klien tidak dapat hilang atau rusak secara tidak sengaja:

1. **`ON DELETE RESTRICT` pada Seluruh Tabel Finansial & Operasional**:
   - Tabel `companies`, `contacts`, `deals`, `invoices`, `payments`, `warranties`, dan `maintenance_contracts` dikonfigurasi dengan klausul `ON DELETE RESTRICT`.
   - Menghapus prospek, klien, atau kesepakatan tidak akan pernah menghapus faktur invoice atau pembayaran yang telah dibukukan.
2. **Zero Fake-Zeros Rule**:
   - Jika biaya produksi suatu proyek belum tercatat lengkap, metrik margin laba dan profit bersih tidak boleh diasumsikan bernilai Rp 0, melainkan berstatus `null` (*"Belum dihitung"*).
3. **Penyimpanan Berkas Eksternal Tanpa Beban Hosting Sendiri**:
   - Berkas ukuran besar (aset logo, figma, dokumen kontrak, zip source code) disimpan pada Google Drive resmi atau repository GitHub dan hanya ditautkan melalui entitas `project_external_links`.
4. **Pencegahan Kebocoran Rahasia (No-Leak Policy)**:
   - Token API Gemini, kunci Duitku PG (`DUITKU_API_KEY`), dan secret Supabase hanya dimuat via server environment variables (`process.env`), tidak pernah terekspos ke *client bundle* atau *activity log*.

---

## 2. Jadwal & Strategi Pencadangan (Backup Strategy)

### A. Pencadangan Otomatis Cloud (Supabase Managed)
- **Point-in-Time Recovery (PITR)**: Dikonfigurasi aktif dengan retensi 7-30 hari pada dashboard database Supabase.
- **Daily Physical Snapshot**: Dilakukan setiap hari pada pukul 03.00 WIB secara otomatis di level infrastruktur.

### B. Pencadangan Manual Berkala (Disaster Cold Backup)
Untuk kebutuhan arsip bulanan oleh Owner (Faiz Aditama), jalankan skrip dump data PostgreSQL:

```bash
# 1. Ekspor skema dan seluruh data ke format SQL
npx supabase db dump --data-only -f supabase/backups/fynux_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Enkripsi berkas cadangan sebelum disimpan ke storage arsip aman
gpg --symmetric --cipher-algo AES256 supabase/backups/fynux_backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 3. Langkah-Langkah Pemulihan Sistem (Recovery Runbook)

Jika terjadi insiden fatal (kesalahan operator, kegagalan database host, atau bencana data center):

### Langkah 1: Aktifkan Maintenance Mode
Arahkan lalu lintas domain sementara ke halaman statis pemeliharaan agar tidak ada transaksi baru masuk di tengah proses restorasi.

### Langkah 2: Verifikasi Integritas Snapshot Terakhir
Periksa berkas backup SQL atau titik waktu pemulihan (PITR) terakhir:
```bash
# Pastikan checksum berkas SQL sesuai
shasum -a 256 supabase/backups/fynux_backup_latest.sql
```

### Langkah 3: Eksekusi Reset Skema & Restore Data
Jalankan migrasi fondasi awal lalu timpa dengan data cadangan terverifikasi:
```bash
# Reset skema ke struktur baseline
npx supabase db reset

# Pulihkan data transaksional melalui psql
psql -h <SUPABASE_DB_HOST> -U postgres -d postgres -f supabase/backups/fynux_backup_latest.sql
```

### Langkah 4: Validasi Integritas Otomatis
Jalankan rangkaian tes otomatis untuk memastikan tidak ada logika bisnis atau referensi relasional yang patah:
```bash
# Jalankan test suite terotomasi
npm test

# Jalankan audit tipe TypeScript
npm run type-check

# Jalankan build produksi Next.js
npm run build
```

Hasil wajib: Seluruh 26 tes lulus (100% pass), 0 error kompilasi, dan seluruh 21 rute aplikasi berhasil ter-render secara optimal.

---

## 4. Rangkuman Kontak Darurat Operasional Fynux

| Peran | Penanggung Jawab | Kontak Darurat |
|---|---|---|
| **Lead Developer & Owner** | Faiz Aditama | +62 895-3240-69850 / faiz@fynux.co |
| **Sales & Business Lead** | Tim Sales Fynux | halo@fynux.co |
| **Duitku Support Hotline** | Duitku Technical Support | support@duitku.com |
| **Hosting & Cloud Infrastructure** | Supabase Platform Status | https://status.supabase.com |

---
*Dokumen ini merupakan bagian tak terpisahkan dari Fynux OS Business Operations Blueprint.*
