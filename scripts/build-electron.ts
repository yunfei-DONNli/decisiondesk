import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

type BuildTarget = {
  format: "cjs" | "esm";
  source: string;
  target: string;
};

const outputDir = path.resolve("dist-electron");
const buildTargets: BuildTarget[] = [
  {
    format: "esm",
    source: path.resolve("electron", "report-export.ts"),
    target: path.join(outputDir, "report-export.js")
  },
  {
    format: "esm",
    source: path.resolve("electron", "main.ts"),
    target: path.join(outputDir, "main.js")
  },
  {
    format: "cjs",
    source: path.resolve("electron", "preload.ts"),
    target: path.join(outputDir, "preload.cjs")
  }
];

function transpileFile(target: BuildTarget): void {
  const source = fs.readFileSync(target.source, "utf8");
  const compilerOptions: ts.CompilerOptions = {
    esModuleInterop: true,
    module: target.format === "cjs" ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  };
  const output = ts.transpileModule(source, {
    compilerOptions,
    fileName: path.basename(target.source)
  });

  fs.mkdirSync(path.dirname(target.target), { recursive: true });
  fs.writeFileSync(target.target, output.outputText, "utf8");
}

fs.mkdirSync(outputDir, { recursive: true });
buildTargets.forEach(transpileFile);
