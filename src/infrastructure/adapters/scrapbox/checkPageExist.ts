export const checkPageExist = async (
  projectName: string,
  title: string,
): Promise<boolean> => {
  try {
    const encodedProjectName = encodeURIComponent(projectName);
    const encodedTitle = encodeURIComponent(title);
    const url =
      `https://scrapbox.io/api/pages/${encodedProjectName}/${encodedTitle}`;
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    console.error("checkPageExist error:", error);
    return false;
  }
};
