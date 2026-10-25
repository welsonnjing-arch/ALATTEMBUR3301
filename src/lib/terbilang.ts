/**
 * FYNUX OS — Indonesian Number to Words Converter ("Terbilang")
 * Digunakan untuk mencetak nominal terbilang resmi pada nota tagihan / invoice.
 * Contoh: 950000 -> "Sembilan ratus lima puluh ribu rupiah."
 */

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

function angkaKeKata(n: number): string {
  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return angkaKeKata(n - 10) + " belas";
  } else if (n < 100) {
    return (
      angkaKeKata(Math.floor(n / 10)) +
      " puluh " +
      angkaKeKata(n % 10)
    ).trim();
  } else if (n < 200) {
    return "seratus " + angkaKeKata(n - 100);
  } else if (n < 1000) {
    return (
      angkaKeKata(Math.floor(n / 100)) +
      " ratus " +
      angkaKeKata(n % 100)
    ).trim();
  } else if (n < 2000) {
    return "seribu " + angkaKeKata(n - 1000);
  } else if (n < 1000000) {
    return (
      angkaKeKata(Math.floor(n / 1000)) +
      " ribu " +
      angkaKeKata(n % 1000)
    ).trim();
  } else if (n < 1000000000) {
    return (
      angkaKeKata(Math.floor(n / 1000000)) +
      " juta " +
      angkaKeKata(n % 1000000)
    ).trim();
  } else if (n < 1000000000000) {
    return (
      angkaKeKata(Math.floor(n / 1000000000)) +
      " milyar " +
      angkaKeKata(n % 1000000000)
    ).trim();
  } else {
    return (
      angkaKeKata(Math.floor(n / 1000000000000)) +
      " triliun " +
      angkaKeKata(n % 1000000000000)
    ).trim();
  }
}

export function terbilang(nominal: number): string {
  if (nominal === 0) return "Nol rupiah.";
  const cleanNominal = Math.floor(Math.abs(nominal));
  const hasil = angkaKeKata(cleanNominal);
  // Huruf pertama kapital + akhiran rupiah
  const kapital = hasil.charAt(0).toUpperCase() + hasil.slice(1);
  return `${kapital} rupiah.`;
}
