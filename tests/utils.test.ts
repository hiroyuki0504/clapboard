import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDate, formatDateTime } from "../lib/utils";

describe("date formatting", () => {
  it("formats date-only values without timezone drift", () => {
    assert.equal(formatDate("2026-05-20"), "2026/05/20");
    assert.equal(formatDate("2026-5-2"), "2026/05/02");
  });

  it("formats timestamp values in the product timezone", () => {
    assert.equal(formatDate("2026-04-24T16:20:00+09:00"), "2026/04/24");
    assert.equal(formatDateTime("2026-04-24T16:20:00+09:00"), "04/24 16:20");
  });

  it("uses a placeholder for invalid date values", () => {
    assert.equal(formatDate("not-a-date"), "—");
    assert.equal(formatDate("2026-13-40"), "—");
    assert.equal(formatDateTime("not-a-date"), "—");
  });
});
