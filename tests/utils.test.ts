import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDate,
  formatDateTime,
  formatLogTime,
  normalizeProgressValue,
  safeFileUrl,
} from "../lib/utils";

describe("date formatting", () => {
  it("formats date-only values without timezone drift", () => {
    assert.equal(formatDate("2026-05-20"), "2026/05/20");
    assert.equal(formatDate("2026-5-2"), "2026/05/02");
    assert.equal(formatLogTime("2026-05-02"), "05/02");
  });

  it("formats timestamp values in the product timezone", () => {
    assert.equal(formatDate("2026-04-24T16:20:00+09:00"), "2026/04/24");
    assert.equal(formatDateTime("2026-04-24T16:20:00+09:00"), "04/24 16:20");
    assert.equal(formatLogTime("2026-04-25T09:40:00+09:00"), "04/25 09:40");
  });

  it("uses a placeholder for invalid date values", () => {
    assert.equal(formatDate("not-a-date"), "—");
    assert.equal(formatDate("2026-13-40"), "—");
    assert.equal(formatDateTime("not-a-date"), "—");
    assert.equal(formatLogTime("not-a-date"), "--:--");
  });
});

describe("safeFileUrl", () => {
  it("allows absolute http and https URLs", () => {
    assert.equal(
      safeFileUrl("https://example.com/report.pdf?download=1"),
      "https://example.com/report.pdf?download=1",
    );
    assert.equal(safeFileUrl("http://example.com/"), "http://example.com/");
  });

  it("rejects non-web and relative URLs", () => {
    assert.equal(safeFileUrl("javascript:alert(1)"), null);
    assert.equal(safeFileUrl("ftp://example.com/report.pdf"), null);
    assert.equal(safeFileUrl("/local/report.pdf"), null);
    assert.equal(safeFileUrl("not a url"), null);
  });
});

describe("progress normalization", () => {
  it("keeps finite progress values inside the accessible range", () => {
    assert.equal(normalizeProgressValue(42), 42);
    assert.equal(normalizeProgressValue(-20), 0);
    assert.equal(normalizeProgressValue(150), 100);
    assert.equal(normalizeProgressValue(Number.NaN), 0);
    assert.equal(normalizeProgressValue(Number.POSITIVE_INFINITY), 0);
  });
});
