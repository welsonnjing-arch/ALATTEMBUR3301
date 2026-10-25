import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { terbilang } from "../src/lib/terbilang";
import { calculateProfitability, formatIDR } from "../src/lib/currency";

describe("Financial Engine & Terbilang Precision", () => {
  test("terbilang converts 950.000 to exact official Indonesian phrase", () => {
    const result = terbilang(950000);
    assert.equal(result, "Sembilan ratus lima puluh ribu rupiah.");
  });

  test("terbilang converts 4.500.000 correctly", () => {
    const result = terbilang(4500000);
    assert.equal(result, "Empat juta lima ratus ribu rupiah.");
  });

  test("terbilang converts 0 correctly", () => {
    const result = terbilang(0);
    assert.equal(result, "Nol rupiah.");
  });

  test("terbilang converts 12.000.000 correctly", () => {
    const result = terbilang(12000000);
    assert.equal(result, "Dua belas juta rupiah.");
  });

  test("formatIDR formats currency in Rupiah without decimals", () => {
    const formatted = formatIDR(950000);
    assert.ok(formatted.includes("950.000"));
    assert.ok(formatted.includes("Rp"));
  });

  test("formatIDR returns 'Belum diatur' when amount is null/undefined", () => {
    assert.equal(formatIDR(null), "Belum diatur");
    assert.equal(formatIDR(undefined), "Belum diatur");
  });
});

describe("Zero Fake-Zeros Profitability Rule", () => {
  test("returns null profit and margin if costs are missing or incomplete", () => {
    // If costs array is empty
    const res1 = calculateProfitability(5000000, [], true);
    assert.equal(res1.profit, null);
    assert.equal(res1.marginPercent, null);
    assert.equal(res1.isCostComplete, false);

    // If isCostComplete flag is false
    const res2 = calculateProfitability(5000000, [1000000], false);
    assert.equal(res2.profit, null);
    assert.equal(res2.marginPercent, null);
    assert.equal(res2.isCostComplete, false);
  });

  test("calculates accurate profit and margin percentage when costs are complete", () => {
    const dealAmount = 10000000;
    const costs = [2000000, 1000000]; // Total cost: 3.000.000
    const res = calculateProfitability(dealAmount, costs, true);

    assert.equal(res.totalCost, 3000000);
    assert.equal(res.profit, 7000000);
    assert.equal(res.marginPercent, 70.0);
    assert.equal(res.isCostComplete, true);
  });
});
