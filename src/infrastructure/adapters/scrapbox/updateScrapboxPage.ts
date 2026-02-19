import { checkPageExist } from "./checkPageExist.ts";
import { createBrowserSession } from "./createBrowserSession.ts";

export const updateScrapboxPage = async (
  sessionId: string,
  projectName: string,
  title: string,
  content: string | (() => Promise<string>),
): Promise<void> => {
  const body = typeof content === "function" ? await content() : content;
  const scrapboxUrl = new URL(
    `https://scrapbox.io/${projectName}/${encodeURIComponent(title)}?body=${
      encodeURIComponent(
        body,
      )
    }`,
  );
  const { browser, page } = await createBrowserSession(sessionId);

  if (!(await checkPageExist(projectName, title))) {
    console.warn(`Page does not exist: ${title}. Skipping update.`);
    return;
  }
  await page.goto(scrapboxUrl.toString());
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
  await browser.close();
  console.log("Successfully updated Scrapbox page:", title);
};
