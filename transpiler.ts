import * as fs from "fs";
import ts from "typescript";
// Error's handler
export class FidsError extends Error {
  constructor(message: string, public line?: number, public column?: number) {
    super(message);
    this.name = "FidsError";
  }
}

// -------------------------
// Tipos permitidos e mapeamento para TypeScript
// -------------------------
const FIDSTypes = ["int", "float", "string", "bool", "void"] as const;
type FIDSType = (typeof FIDSTypes)[number];

const RESERVED = new Set([
  "dec",
  "func",
  "if",
  "otw",
  "return",
  "look",
  "when",
  "while",
  "do",
  "for",
  "break",
  "keep",
  "log",
  "int",
  "float",
  "string",
  "bool",
  "void",
]);

// -------------------------
// Tabela de símbolos
// -------------------------
const symbolTable: Map<string, FIDSType> = new Map();

// -------------------------
// Funções auxiliares
// -------------------------
function checkReserved(name: string) {
  if (RESERVED.has(name)) throw new SyntaxError(`Reserved word: '${name}'`);
}

function mapType(type: FIDSType): string {
  switch (type) {
    case "int":
    case "float":
      return "number";
    case "bool":
      return "boolean";
    case "string":
      return "string";
    case "void":
      return "void";
  }
}

// -------------------------
// Substituições de palavras-chave
// -------------------------
const KEYWORDS: [RegExp, string][] = [
  [/\blog\(/g, "console.log("],
  [/\botw if\b/g, "else if"],
  [/\botw\b/g, "else"],
  [/\blook\(/g, "switch("],
  [/\bwhen\b/g, "case"],
  [/\bkeep\b/g, "continue"],
];

// -------------------------
// Funções de transformação
// -------------------------
function transformKeywords(code: string): string {
  let result = code;
  for (const [pattern, repl] of KEYWORDS) {
    result = result.replace(pattern, repl);
  }
  return result;
}

function transformVariables(code: string): string {
  let result = code;

  // dec type varName = value
  result = result.replace(
    /\bdec\s+(\w+)\s+(\w+)\s*=\s*([^;\n]+)/g,
    (_, type, name, value) => {
      checkReserved(name);
      symbolTable.set(name, type as FIDSType);
      const mapped = mapType(type as FIDSType);
      return `const ${name}: ${mapped} = ${value};\nif (typeof ${name} !== '${mapped}') throw new TypeError('Variable ${name} must be ${type}')`;
    }
  );

  // type varName = value
  result = result.replace(
    /\b(int|float|string|bool)\s+(\w+)\s*=\s*([^;\n]+)/g,
    (_, type, name, value) => {
      checkReserved(name);
      symbolTable.set(name, type as FIDSType);
      const mapped = mapType(type as FIDSType);
      return `let ${name}: ${mapped} = ${value};\nif (typeof ${name} !== '${mapped}') throw new TypeError('Variable ${name} must be ${type}')`;
    }
  );

  return result;
}

function transformForLoops(code: string): string {
  return code.replace(
    /for\s*\(\s*(int|float|string|bool)\s+(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\){/g,
    (_, type, name, init, cond, incr) => {
      symbolTable.set(name, type as FIDSType);
      const mapped = mapType(type as FIDSType);
      // Colocamos a checagem dentro do bloco, sem adicionar { extra
      return `for (let ${name}: ${mapped} = ${init}; ${cond}; ${incr}) {\n  if (typeof ${name} !== '${mapped}') throw new TypeError('Variable ${name} must be ${type}');`;
    }
  );
}

function transformConditionals(code: string): string {
  return code
    .replace(/\bif\b/g, "if")
    .replace(/\botw if\b/g, "else if")
    .replace(/\botw\b/g, "else");
}

function transformFunctions(code: string): string {
  return code.replace(
    /\b(bool|int|float|string|void)\s+func\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (_, retType, name, params) => {
      // Mapear tipo de retorno
      const mappedRet = mapType(retType as FIDSType);

      // Mapear tipos dos parâmetros
      const mappedParams = params
        .split(",")
        .map((p: any) => {
          const [type, pname] = p.trim().split(/\s+/);
          if (!type || !pname) return "";
          return `${pname}: ${mapType(type as FIDSType)}`;
        })
        .join(", ");

      return `function ${name}(${mappedParams}): ${mappedRet} {`;
    }
  );
}

function transformTryCatch(code: string): string {
  // exc(Exception e) → catch(e: Exception)
  if (code.match(/\bexc\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/)) {
    throw new TypeError("catch must specify a type, e.g., exc(Exception e)");
  }

  return code.replace(
    /\bexc\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\)/g,
    "catch($2: $1)"
  );
}

function transformGenerics(code: string): string {
  // dec Generic<T> name = value
  code = code.replace(
    /\bdec\s+([A-Za-z_][A-Za-z0-9_]*)<(\w+)>\s+(\w+)\s*=\s*([^;\n]+)/g,
    (_, generic, innerType, name, value) => {
      checkReserved(name);
      const mapped = mapType(innerType as FIDSType);
      symbolTable.set(name, innerType as FIDSType);
      return `const ${name}: ${generic}<${mapped}> = ${value};`;
    }
  );

  // List<T> arr = ["a","b"] → let arr: List<string> = new List("a","b")
  code = code.replace(
    /\bList<(\w+)>\s+(\w+)\s*=\s*\[([^\]]*)\]/g,
    (_, innerType, name, items) => {
      const mapped = mapType(innerType as FIDSType);
      return `let ${name}: List<${mapped}> = new List(${items})`;
    }
  );

  // let/const Generic<T> name = value
  code = code.replace(
    /\b([A-Za-z_][A-Za-z0-9_]*)<(\w+)>\s+(\w+)\s*=\s*([^;\n]+)/g,
    (_, generic, innerType, name, value) => {
      checkReserved(name);
      const mapped = mapType(innerType as FIDSType);
      symbolTable.set(name, innerType as FIDSType);
      return `let ${name}: ${generic}<${mapped}> = ${value};`;
    }
  );

  return code;
}

function transformPromises(code: string): string {
  let result = code;

  // Construtor do FidsPromise<T> — sempre força resolve/reject tipados corretamente
  result = result.replace(
    /new\s+FidsPromise<(\w+)>\s*\(\s*\([^\)]*\)\s*=>/g,
    (_, promiseType) => {
      const tsType = mapType(promiseType as FIDSType);
      return `new FidsPromise<${tsType}>((resolve: (v: ${tsType}) => void, reject: (e: any) => void) =>`;
    }
  );

  // Tipar parâmetros das funções callback do then/exc
  result = result.replace(
    /\(\s*(bool|int|float|string)\s+(\w+)\s*\)\s*=>/g,
    (_, type, name) => {
      const mapped = mapType(type as FIDSType);
      return `(${name}: ${mapped}) =>`;
    }
  );

  // Mantém .exc e .atEnd sem alteração
  result = result.replace(/\.exc\s*\(/g, ".exc(");
  result = result.replace(/\.atEnd\s*\(/g, ".atEnd(");

  return result;
}

function transformTypedParams(code: string): string {
  return code.replace(
    /\(\s*([A-Za-z_][A-Za-z0-9_]*(?:\s+[A-Za-z_][A-Za-z0-9_]*)?(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*(?:\s+[A-Za-z_][A-Za-z0-9_]*)?)*)\s*\)\s*=>/g,
    (match, params) => {
      // params = "string a, string b" ou "int x"
      const converted = params
        .split(/\s*,\s*/)
        .map((p: any) => {
          const [type, name] = p.trim().split(/\s+/);
          return `${name}: ${mapType(type as FIDSType)}`;
        })
        .join(", ");
      return `(${converted}) =>`;
    }
  );
}

// -------------------------
// Transpiler principal
// -------------------------
export function transpile(code: string): string {
  let tsCode = code;

  //TODO implement import FidsPromise from './runtime/FidsPromise'\n
  const nativeImports = "import List from './runtime/List'";
  tsCode = nativeImports + "\n\n" + tsCode;

  tsCode = transformPromises(tsCode);
  tsCode = transformKeywords(tsCode);
  tsCode = transformTypedParams(tsCode);
  tsCode = transformForLoops(tsCode);
  tsCode = transformGenerics(tsCode);
  tsCode = transformVariables(tsCode);
  tsCode = transformFunctions(tsCode);
  tsCode = transformConditionals(tsCode);
  tsCode = transformTryCatch(tsCode);

  const transpiled = ts.transpileModule(tsCode, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });

  if (transpiled.diagnostics?.length) {
    const diag = transpiled.diagnostics[0];
    const msg = ts.flattenDiagnosticMessageText(diag.messageText, "\n");

    const line = diag.file
      ? diag.file.getLineAndCharacterOfPosition(diag.start!).line + 1
      : undefined;
    const col = diag.file
      ? diag.file.getLineAndCharacterOfPosition(diag.start!).character + 1
      : undefined;

    let friendly = msg;
    if (msg.includes("not assignable")) {
      friendly = `Type error: Incompatible value assignment (line ${line}, col ${col}).`;
    } else if (msg.includes("Operator")) {
      friendly = `Type error: Invalid operator usage (line ${line}, col ${col}).`;
    }
  }

  return tsCode;
}

// -------------------------
// CLI
// -------------------------
if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: ts-node transpiler.ts <file>");
    process.exit(1);
  }
  const code = fs.readFileSync(file, "utf-8");
  const tsCode = transpile(code);
  console.log(tsCode);
}
