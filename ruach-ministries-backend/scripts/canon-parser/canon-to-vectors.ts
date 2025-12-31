#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

type CanonNode = {
  canonNodeId: string;
  content: {
    text: string;
    [key: string]: unknown;
  };
  location: {
    chapter: {
      index: number;
      title?: string;
    };
    order?: number;
    [key: string]: unknown;
  };
  authority?: {
    tier?: number;
    weight?: number;
  };
  source?: unknown;
};

type CanonBundle = {
  nodes: CanonNode[];
};

type VectorChunk = {
  id: string;
  text: string;
  context: string;
  meta: {
    canonNodeId: string;
    chapter: number;
    order?: number;
    authority?: CanonNode["authority"];
    source?: CanonNode["source"];
  };
};

type Options = {
  input: string;
  output: string;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    input: "",
    output: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
      case "-i":
        options.input = args[++i] ?? "";
        break;
      case "--output":
      case "-o":
        options.output = args[++i] ?? "";
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown arg: ${arg}`);
    }
  }

  if (!options.input) {
    throw new Error("--input is required.");
  }

  if (!options.output) {
    options.output = `${options.input.replace(/\.canon(\.clean)?\.json$/, "")}.vectors.json`;
  }

  return options;
}

function printUsage(): void {
  const script = path.relative(process.cwd(), process.argv[1] ?? "canon-to-vectors.ts");
  // eslint-disable-next-line no-console
  console.log(`
Usage:
  tsx ${script} --input path/to/ministry-of-healing.canon.clean.json [--output path/to/chunks.vectors.json]
`);
}

async function main(): Promise<void> {
  const options = parseArgs();
  const bundle = JSON.parse(await fs.readFile(options.input, "utf-8")) as CanonBundle;
  const chunks: VectorChunk[] = [];

  for (let i = 0; i < bundle.nodes.length; i += 1) {
    const node = bundle.nodes[i];
    const neighbors = [
      bundle.nodes[i - 1]?.content.text,
      node.content.text,
      bundle.nodes[i + 1]?.content.text,
    ].filter(Boolean);

    chunks.push({
      id: node.canonNodeId,
      text: node.content.text,
      context: neighbors.join("\n"),
      meta: {
        canonNodeId: node.canonNodeId,
        chapter: node.location.chapter.index,
        order: node.location.order,
        authority: node.authority,
        source: node.source,
      },
    });
  }

  await fs.writeFile(options.output, `${JSON.stringify(chunks, null, 2)}\n`, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`Vector chunks written to ${options.output}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Vector export failed:", error);
  process.exit(1);
});
