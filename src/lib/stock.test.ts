import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { inventoryView, parseInventoryFilter, toStockState } from "./stock";

describe("toStockState", () => {
  test("0 is sold out, at or under the threshold is low, above it is in stock", () => {
    assert.deepEqual(toStockState(0, 3), { status: "out_of_stock" });
    assert.deepEqual(toStockState(1, 3), { status: "low_stock", quantity: 1 });
    assert.deepEqual(toStockState(3, 3), { status: "low_stock", quantity: 3 });
    assert.deepEqual(toStockState(4, 3), { status: "in_stock" });
  });

  test("a threshold of 0 never reports low stock", () => {
    assert.deepEqual(toStockState(1, 0), { status: "in_stock" });
    assert.deepEqual(toStockState(0, 0), { status: "out_of_stock" });
  });
});

describe("parseInventoryFilter", () => {
  test("known values pass through, anything else is all", () => {
    for (const value of ["all", "out", "low", "in"]) assert.equal(parseInventoryFilter(value), value);
    for (const value of [undefined, "", "LOW", "sold", ["low"]]) assert.equal(parseInventoryFilter(value), "all");
  });
});

describe("inventoryView", () => {
  const row = (name: string, stockQuantity: number, lowStockThreshold = 3) => ({
    name,
    stockQuantity,
    lowStockThreshold,
  });
  const rows = [row("Coat", 20), row("Bag", 0), row("Scarf", 2), row("Belt", 1), row("Hat", 0), row("Top", 5)];

  test("counts every status regardless of the filter", () => {
    assert.deepEqual(inventoryView(rows, "low").counts, { all: 6, out: 2, low: 2, in: 2 });
  });

  test("all sorts sold out, then low, then in stock; then by quantity and name", () => {
    assert.deepEqual(
      inventoryView(rows, "all").rows.map((r) => r.name),
      ["Bag", "Hat", "Belt", "Scarf", "Top", "Coat"],
    );
  });

  test("filters by derived status", () => {
    assert.deepEqual(inventoryView(rows, "out").rows.map((r) => r.name), ["Bag", "Hat"]);
    assert.deepEqual(inventoryView(rows, "low").rows.map((r) => r.name), ["Belt", "Scarf"]);
    assert.deepEqual(inventoryView(rows, "in").rows.map((r) => r.name), ["Top", "Coat"]);
  });

  test("uses each product's own threshold and keeps extra fields", () => {
    const view = inventoryView([{ ...row("Ring", 8, 10), id: "r" }], "low");
    assert.deepEqual(view.rows, [{ name: "Ring", stockQuantity: 8, lowStockThreshold: 10, id: "r" }]);
  });
});
