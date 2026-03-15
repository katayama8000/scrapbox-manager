// deno-lint-ignore-file require-await
import { assertEquals, assertThrows } from "std/assert/mod.ts";
import { CalculateAverageWakeUpTimeUseCase } from "./calculate_average_wake_up_time.ts";
import { ScrapboxRepository } from "@/application/ports/scrapbox-repository.ts";
import { DateProvider } from "@/application/ports/date-provider.ts";

type WakeUpTimeMethods = {
  parseMinToNum: (time: string) => number;
  calculateAverageWakeUpTime: (times: string[]) => number;
};

const createUseCase = () => {
  const scrapboxRepositoryMock: ScrapboxRepository = {
    post: async () => {},
    update: async () => {},
    exists: async () => false,
    getPage: async () => null,
    getPageCount: async () => null,
    listPages: async () => null,
    listPagesByPageTitle: async () => null,
  };

  const dateProvider: DateProvider = {
    now: () => new Date("2026-03-15T00:00:00Z"),
  };

  return new CalculateAverageWakeUpTimeUseCase(
    scrapboxRepositoryMock,
    dateProvider,
  );
};

Deno.test("parseMinToNum converts HH:mm to decimal hours", () => {
  const useCase = createUseCase();
  const methods = useCase as unknown as WakeUpTimeMethods;

  assertEquals(methods.parseMinToNum("7:30"), 7.5);
  assertEquals(methods.parseMinToNum("8:00"), 8);
});

Deno.test(
  "calculateAverageWakeUpTime normalizes hour-only format and returns average",
  () => {
    const useCase = createUseCase();
    const methods = useCase as unknown as WakeUpTimeMethods;

    const result = methods.calculateAverageWakeUpTime(["8", "9:30", "7"]);
    assertEquals(result, 8.167);
  },
);

Deno.test("calculateAverageWakeUpTime trims values before averaging", () => {
  const useCase = createUseCase();
  const methods = useCase as unknown as WakeUpTimeMethods;

  const result = methods.calculateAverageWakeUpTime([" 8 ", " 9:15 "]);
  assertEquals(result, 8.625);
});

Deno.test("calculateAverageWakeUpTime throws on invalid time format", () => {
  const useCase = createUseCase();
  const methods = useCase as unknown as WakeUpTimeMethods;

  assertThrows(
    () => methods.calculateAverageWakeUpTime(["8:0", "9:30"]),
    Error,
    "Invalid time format. Please use the format 'HH:mm'.",
  );
});
