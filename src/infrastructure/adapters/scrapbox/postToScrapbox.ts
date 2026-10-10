import { checkPageExist } from "./checkPageExist.ts";
import { createPageWithCosenseCli } from "./cosenseCli.ts";

export const postToScrapbox = async (
  projectName: string,
  title: string,
  content: string | (() => Promise<string>),
): Promise<void> => {
  const body = typeof content === "function" ? await content() : content;

  if (await checkPageExist(projectName, title)) {
    console.warn(`Page already exists: ${title}. Skipping creation.`);
    return;
  }

  await createPageWithCosenseCli(projectName, title, body);
  console.log("Successfully written to Scrapbox (cosense-cli):", title);
};
