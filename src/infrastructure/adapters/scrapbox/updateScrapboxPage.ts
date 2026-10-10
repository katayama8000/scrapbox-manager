import { checkPageExist } from "./checkPageExist.ts";
import { updatePageWithCosenseCli } from "./cosenseCli.ts";

export const updateScrapboxPage = async (
  projectName: string,
  title: string,
  content: string | (() => Promise<string>),
): Promise<void> => {
  const body = typeof content === "function" ? await content() : content;

  if (!(await checkPageExist(projectName, title))) {
    console.warn(`Page does not exist: ${title}. Skipping update.`);
    return;
  }

  await updatePageWithCosenseCli(projectName, title, body);
  console.log("Successfully updated Scrapbox page (cosense-cli):", title);
};
