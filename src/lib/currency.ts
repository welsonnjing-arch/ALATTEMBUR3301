/**
 * FYNUX OS — Financial Calculation & Currency Formatting Utilities
 * Menjamin presisi finansial dan mencegah 'fake zero'.
 */

export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "Belum diatur";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatRupiah = formatIDR;

export function parseCurrencyInput(val: string): number {
  const cleanStr = val.replace(/[^0-9]/g, "");
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}

export interface ProfitabilityCalculation {
  dealAmount: number;
  totalCost: number | null;
  profit: number | null;
  marginPercent: number | null;
  isCostComplete: boolean;
}

/**
 * Menghitung profitabilitas sesuai aturan:
 * Jika biaya belum lengkap atau belum dicatat, profit tidak boleh dianggap bernilai 0.
 */
export function calculateProfitability(
  dealAmount: number,
  costs: number[] | null,
  isCostComplete: boolean = true
): ProfitabilityCalculation {
  if (!costs || costs.length === 0 || !isCostComplete) {
    return {
      dealAmount,
      totalCost: null,
      profit: null,
      marginPercent: null,
      isCostComplete: false,
    };
  }

  const totalCost = costs.reduce((acc, curr) => acc + curr, 0);
  const profit = dealAmount - totalCost;
  const marginPercent = dealAmount > 0 ? (profit / dealAmount) * 100 : 0;

  return {
    dealAmount,
    totalCost,
    profit,
    marginPercent: Math.round(marginPercent * 10) / 10,
    isCostComplete: true,
  };
}
