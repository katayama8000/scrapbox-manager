import { assertEquals, assertStringIncludes } from "std/assert/mod.ts";
import { GenerativeAIProviderImpl } from "./generative-ai-provider-impl.ts";

Deno.test("English selection and questions retain the three-string JSON schema", async () => {
  const originalFetch = globalThis.fetch;
  const requests: {
    contents: { parts: { text: string }[] }[];
    generationConfig: Record<string, unknown>;
  }[] = [];
  globalThis.fetch = (_input, init) => {
    requests.push(JSON.parse(init!.body as string));
    return Promise.resolve(
      new Response(
        JSON.stringify({
          candidates: [{
            content: { parts: [{ text: '["one","two","three"]' }] },
          }],
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
  };
  try {
    const provider = new GenerativeAIProviderImpl("test-key");
    assertEquals(
      await provider.selectEnglishPages(["one", "two", "three", "four"]),
      ["one", "two", "three"],
    );
    assertEquals(
      await provider.generateEnglishQuestions(
        "Title: one\nContent:\none notes",
      ),
      ["one", "two", "three"],
    );
    for (const request of requests) {
      assertEquals(
        request.generationConfig.responseMimeType,
        "application/json",
      );
      assertEquals(request.generationConfig.responseSchema, {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      });
    }
    assertStringIncludes(
      requests[0].contents[0].parts[0].text,
      '["one","two","three","four"]',
    );
    assertStringIncludes(requests[1].contents[0].parts[0].text, "exactly 3");
    assertStringIncludes(
      requests[1].contents[0].parts[0].text,
      "this one source page",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
