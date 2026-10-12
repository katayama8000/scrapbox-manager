type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

import { checkPageExist } from "./checkPageExist.ts";

type CosenseReadPageLine = {
  id?: string;
  text?: string;
};

type CosenseReadPageResponse = {
  id?: string;
  title?: string;
  persistent?: boolean;
  lines?: CosenseReadPageLine[];
};

const COSENSE_CLI_BASE_ARGS = ["-y", "@helpfeel/cosense-cli@1.16.1"];

const ensureCosensePat = (): void => {
  if (!Deno.env.get("COSENSE_PAT")) {
    throw new Error("COSENSE_PAT is required for Cosense write operations.");
  }
};

const runCosenseCli = async (
  args: string[],
  stdinText?: string,
): Promise<CommandResult> => {
  const command = new Deno.Command("npx", {
    args: [...COSENSE_CLI_BASE_ARGS, ...args],
    stdin: stdinText === undefined ? "null" : "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = command.spawn();

  if (stdinText !== undefined && child.stdin) {
    const encoder = new TextEncoder();
    const writer = child.stdin.getWriter();
    await writer.write(encoder.encode(stdinText));
    await writer.close();
  }

  const { code, stdout, stderr } = await child.output();
  const decoder = new TextDecoder();

  return {
    code,
    stdout: decoder.decode(stdout),
    stderr: decoder.decode(stderr),
  };
};

const projectUrlFromName = (projectName: string): string => {
  return `https://scrapbox.io/${encodeURIComponent(projectName)}`;
};

const pageUrlFromTitle = (projectName: string, title: string): string => {
  return `${projectUrlFromName(projectName)}/${encodeURIComponent(title)}`;
};

const parsePreviewId = (stdout: string): string => {
  const matched = stdout.match(/^previewId:\s*(.+)$/m);
  if (!matched || !matched[1]) {
    throw new Error(`previewId not found in cosense-cli output: ${stdout}`);
  }
  return matched[1].trim();
};

const submitPreview = async (
  projectUrl: string,
  previewId: string,
  projectName?: string,
  title?: string,
): Promise<void> => {
  const submitResult = await runCosenseCli([
    "submitEdit",
    projectUrl,
    previewId,
  ]);

  if (submitResult.code !== 0) {
    const output = submitResult.stderr || submitResult.stdout;
    const isMissingPageField =
      output.includes("submit response missing page field") &&
      output.includes("commitId:");

    // cosense-cli sometimes returns a non-zero exit code even though the page
    // is actually created. If we can verify the page exists, treat it as success.
    if (isMissingPageField && projectName && title) {
      const exists = await checkPageExist(projectName, title);
      if (exists) {
        console.warn(
          `cosense submitEdit reported a missing page field, but page exists: ${title}`,
        );
        return;
      }
    }

    throw new Error(
      `cosense submitEdit failed: ${output}`,
    );
  }
};

export const createPageWithCosenseCli = async (
  projectName: string,
  title: string,
  content: string,
): Promise<void> => {
  ensureCosensePat();
  const projectUrl = projectUrlFromName(projectName);
  const body = `${title}\n${content}`;

  const previewResult = await runCosenseCli([
    "previewEdit",
    "--new",
    projectUrl,
  ], body);

  if (previewResult.code !== 0) {
    throw new Error(
      `cosense previewEdit --new failed: ${
        previewResult.stderr || previewResult.stdout
      }`,
    );
  }

  const previewId = parsePreviewId(previewResult.stdout);
  await submitPreview(projectUrl, previewId, projectName, title);
};

export const updatePageWithCosenseCli = async (
  projectName: string,
  title: string,
  content: string,
): Promise<void> => {
  ensureCosensePat();
  const pageUrl = pageUrlFromTitle(projectName, title);
  const readResult = await runCosenseCli(["readPage", pageUrl]);

  if (readResult.code !== 0) {
    throw new Error(
      `cosense readPage failed: ${readResult.stderr || readResult.stdout}`,
    );
  }

  const page = JSON.parse(readResult.stdout) as CosenseReadPageResponse;

  if (!page.persistent || !page.id) {
    throw new Error(`page does not exist for update: ${title}`);
  }

  const lines = Array.isArray(page.lines) ? page.lines : [];
  const hasTitleLine = lines[0]?.text === title;
  const bodyLines = hasTitleLine ? lines.slice(1) : lines;
  const deleteOps = bodyLines
    .filter((line) => typeof line.id === "string")
    .map((line) => ({ delete: line.id as string }));

  const desiredBodyLines = content.length > 0 ? content.split("\n") : [];
  const ops: Array<Record<string, string>> = [...deleteOps];

  if (desiredBodyLines.length > 0) {
    ops.push({
      insertBefore: "_end",
      text: desiredBodyLines.join("\n"),
    });
  }

  const projectUrl = projectUrlFromName(projectName);
  const previewResult = await runCosenseCli([
    "previewEdit",
    projectUrl,
    page.id,
  ], JSON.stringify({ ops }));

  if (previewResult.code !== 0) {
    throw new Error(
      `cosense previewEdit failed: ${
        previewResult.stderr || previewResult.stdout
      }`,
    );
  }

  const previewId = parsePreviewId(previewResult.stdout);
  await submitPreview(projectUrl, previewId, projectName, title);
};
