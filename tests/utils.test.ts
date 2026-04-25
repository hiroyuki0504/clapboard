import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime, formatLogTime } from "../lib/utils";

test("formatDate keeps date-only values on the Tokyo calendar day", () => {
  assert.equal(formatDate("2026-05-02"), "2026/05/02");
});

test("formatDateTime formats timestamp values in Tokyo time", () => {
  assert.equal(formatDateTime("2026-04-25T09:40:00+09:00"), "04/25 09:40");
});

test("formatLogTime keeps date-only values on the Tokyo calendar day", () => {
  assert.equal(formatLogTime("2026-05-02"), "05/02");
});
