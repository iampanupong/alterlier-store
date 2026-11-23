// Static guard: every admin entry point authorizes itself. Hiding admin links or
// the layout's nav is cosmetic, and server actions / route handlers are public POST
// endpoints, so the check has to be in each one. This fails the suite if a new admin
// page, action or route handler forgets `requireAdmin()`.

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, test } from "node:test";
import ts from "typescript";

const ROOT = join(import.meta.dirname, "..", "app", "admin");
const HTTP_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

function parse(file: string) {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
}

function isRequireAdminCall(node: ts.Node | undefined): boolean {
  if (!node) return false;
  if (ts.isAwaitExpression(node)) node = node.expression;
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "requireAdmin";
}

/** First statement is `await requireAdmin(…)` or `const x = await requireAdmin(…)`. */
function startsWithRequireAdmin(body: ts.Block | undefined) {
  const first = body?.statements[0];
  if (!first) return false;
  if (ts.isExpressionStatement(first)) {
    return ts.isAwaitExpression(first.expression) && isRequireAdminCall(first.expression);
  }
  if (ts.isVariableStatement(first)) {
    const init = first.declarationList.declarations[0]?.initializer;
    return !!init && ts.isAwaitExpression(init) && isRequireAdminCall(init);
  }
  return false;
}

function isExported(node: ts.Node) {
  return ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function isUseServerFile(sf: ts.SourceFile) {
  const first = sf.statements[0];
  return (
    !!first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use server"
  );
}

/** Exported functions (declarations and `export const x = async () => {…}`) with their bodies. */
function exportedFunctions(sf: ts.SourceFile) {
  const found: { name: string; body: ts.Block | undefined }[] = [];
  for (const statement of sf.statements) {
    if (!isExported(statement)) continue;
    if (ts.isFunctionDeclaration(statement)) {
      found.push({ name: statement.name?.text ?? "default", body: statement.body });
    } else if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        const init = decl.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          found.push({
            name: decl.name.getText(sf),
            body: ts.isBlock(init.body) ? init.body : undefined,
          });
        }
      }
    }
  }
  return found;
}

function containsRequireAdmin(sf: ts.SourceFile) {
  let found = false;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (isRequireAdminCall(node)) found = true;
    else ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

const files = walk(ROOT).filter((file) => /\.tsx?$/.test(file));
const rel = (file: string) => relative(ROOT, file);

describe("admin authorization guard", () => {
  test("finds the admin routes", () => {
    assert.ok(files.some((file) => file.endsWith("page.tsx")), "no admin pages found");
  });

  for (const file of files.filter((f) => /[\\/]page\.tsx$/.test(f))) {
    test(`page ${rel(file)} calls requireAdmin()`, () => {
      assert.ok(containsRequireAdmin(parse(file)), `${rel(file)} never calls requireAdmin()`);
    });
  }

  for (const file of files) {
    const sf = parse(file);
    const isRoute = /[\\/]route\.ts$/.test(file);
    if (!isUseServerFile(sf) && !isRoute) continue;

    for (const fn of exportedFunctions(sf)) {
      if (isRoute && !HTTP_METHODS.has(fn.name)) continue;
      test(`${isRoute ? "route handler" : "server action"} ${rel(file)}#${fn.name} starts with requireAdmin()`, () => {
        assert.ok(
          startsWithRequireAdmin(fn.body),
          `${rel(file)}#${fn.name} must begin with \`await requireAdmin()\``,
        );
      });
    }
  }
});
