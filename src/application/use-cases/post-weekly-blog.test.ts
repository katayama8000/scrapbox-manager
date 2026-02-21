import { assertEquals } from "std/assert/mod.ts";
import { weeklyTemplate } from "./post-weekly-blog.ts";

Deno.test("weeklyTemplate.buildText generates correct text", () => {
  const connectLink = "test-link";
  const avgWakeUpTime = 7.5;
  const avgSleepQuality = 4;
  const expected = "[**** Last week's average wake-up time]\n" +
    " 7.5h\n" +
    "[**** Last week's average sleep quality]\n" +
    " 4\n" +
    "[**** Goals]\n" +
    "[**** Try something new]\n" +
    "[**** How was the week]\n" +
    "[**** Summary]\n" +
    "Summary of the week\n" +
    "#test-link\n" +
    "#weekly";
  const result = weeklyTemplate.buildText(
    connectLink,
    avgWakeUpTime,
    avgSleepQuality,
    "Summary of the week",
  );
  assertEquals(result, expected);
});

Deno.test(
  "weeklyTemplate.generateTitle generates correct title for a given date",
  () => {
    const date = new Date("2026-02-21T00:00:00Z"); // Saturday
    const expected = "2026/02/22 ~ 2026/02/28";
    const result = weeklyTemplate.generateTitle(date);
    assertEquals(result, expected);
  },
);

Deno.test(
  "weeklyTemplate.generateTitlesForThisWeek generates correct titles for the week starting from Sunday",
  () => {
    const date = new Date("2026-02-22T00:00:00Z"); // Sunday
    const expected = [
      "2026/02/21 (Sat)",
      "2026/02/20 (Fri)",
      "2026/02/19 (Thu)",
      "2026/02/18 (Wed)",
      "2026/02/17 (Tue)",
      "2026/02/16 (Mon)",
    ];
    const result = weeklyTemplate.generateTitlesForThisWeek(date);
    assertEquals(result, expected);
  },
);

Deno.test(
  "weeklyTemplate.generateTitlesForThisWeek generates correct titles for the previous 6 days",
  () => {
    const date = new Date("2026-02-25T00:00:00Z"); // Wednesday
    const expected = [
      "2026/02/24 (Tue)",
      "2026/02/23 (Mon)",
      "2026/02/22 (Sun)",
      "2026/02/21 (Sat)",
      "2026/02/20 (Fri)",
      "2026/02/19 (Thu)",
    ];
    const result = weeklyTemplate.generateTitlesForThisWeek(date);
    assertEquals(result, expected);
  },
);
