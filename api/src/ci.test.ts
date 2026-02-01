import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ciPath = resolve(import.meta.dir, "../../.github/workflows/api-tests.yml");
const deployPath = resolve(import.meta.dir, "../../.github/workflows/api-deploy.yml");

const ciFile = existsSync(ciPath) ? readFileSync(ciPath, "utf-8") : null;
const deployFile = existsSync(deployPath) ? readFileSync(deployPath, "utf-8") : null;

const skipCi = !ciFile;
const skipDeploy = !deployFile;

describe.skipIf(skipCi)("API CI workflow (api-tests.yml)", () => {
  test("should trigger on push to main with api/** path", () => {
    expect(ciFile).toContain("push:");
    expect(ciFile).toContain("branches: [main]");
    expect(ciFile).toContain('"api/**"');
  });

  test("should trigger on pull requests to main", () => {
    expect(ciFile).toContain("pull_request:");
  });

  test("should also trigger on workflow file changes", () => {
    expect(ciFile).toContain("api-tests.yml");
  });

  test("should use oven-sh/setup-bun action", () => {
    expect(ciFile).toContain("oven-sh/setup-bun");
  });

  test("should install dependencies with frozen lockfile", () => {
    expect(ciFile).toContain("bun install --frozen-lockfile");
  });

  test("should have a typecheck step", () => {
    expect(ciFile).toContain("Typecheck");
    expect(ciFile).toContain("tsc --noEmit");
  });

  test("should run tests", () => {
    expect(ciFile).toContain("bun test");
  });

  test("should have a build job", () => {
    expect(ciFile).toContain("build:");
    expect(ciFile).toContain("docker build");
  });

  test("should run build after tests pass", () => {
    expect(ciFile).toContain("needs: test");
  });

  test("should run on ubuntu-latest", () => {
    expect(ciFile).toContain("ubuntu-latest");
  });
});

describe.skipIf(skipDeploy)("API Deploy workflow (api-deploy.yml)", () => {
  test("should trigger only on push to main", () => {
    expect(deployFile).toContain("push:");
    expect(deployFile).toContain("branches: [main]");
    expect(deployFile).not.toContain("pull_request:");
  });

  test("should trigger only for api/** changes", () => {
    expect(deployFile).toContain('"api/**"');
  });

  test("should use GitHub Container Registry", () => {
    expect(deployFile).toContain("ghcr.io");
  });

  test("should login to container registry", () => {
    expect(deployFile).toContain("docker/login-action");
  });

  test("should extract Docker metadata for tags", () => {
    expect(deployFile).toContain("docker/metadata-action");
  });

  test("should build and push Docker image", () => {
    expect(deployFile).toContain("docker/build-push-action");
    expect(deployFile).toContain("push: true");
  });

  test("should tag with commit SHA and latest", () => {
    expect(deployFile).toContain("type=sha");
    expect(deployFile).toContain("type=raw,value=latest");
  });

  test("should use api context for Docker build", () => {
    expect(deployFile).toContain("context: api");
  });

  test("should have packages write permission", () => {
    expect(deployFile).toContain("packages: write");
  });

  test("should use GITHUB_TOKEN for authentication", () => {
    expect(deployFile).toContain("secrets.GITHUB_TOKEN");
  });
});
