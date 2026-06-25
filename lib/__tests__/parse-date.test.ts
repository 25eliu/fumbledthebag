import { describe, it, expect } from "vitest";
import { parseDate } from "@/lib/parse-date";

describe("parseDate", () => {
  it("parses 'Mar 2020'", () => { expect(parseDate("Mar 2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses 'March 2020'", () => { expect(parseDate("March 2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses '3/2020'", () => { expect(parseDate("3/2020")).toEqual({ month: 3, year: 2020 }); });
  it("parses '2020-03'", () => { expect(parseDate("2020-03")).toEqual({ month: 3, year: 2020 }); });
  it("ignores a day in '3/15/2020'", () => { expect(parseDate("3/15/2020")).toEqual({ month: 3, year: 2020 }); });
  it("defaults month to January when only a year is given", () => { expect(parseDate("2020")).toEqual({ month: 1, year: 2020 }); });
  it("clamps a too-late year to maxYear", () => { expect(parseDate("Jan 2099")).toEqual({ month: 1, year: 2026 }); });
  it("keeps a pre-2015 year (no silent rewrite)", () => { expect(parseDate("May 2000")).toEqual({ month: 5, year: 2000 }); });
  it("clamps an absurd too-early year to the sanity floor", () => { expect(parseDate("Jan 1500")).toEqual({ month: 1, year: 1900 }); });
  it("errors on garbage", () => { expect(parseDate("banana")).toEqual({ error: expect.any(String) }); });
  it("errors on empty", () => { expect(parseDate("")).toEqual({ error: expect.any(String) }); });
});
