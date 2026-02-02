import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const easJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, "../eas.json"), "utf-8")
);
const appJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, "../app.json"), "utf-8")
);
const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dir, "../package.json"), "utf-8")
);

describe("eas.json", () => {
  test("should have a cli section with minimum version", () => {
    expect(easJson.cli).toBeDefined();
    expect(easJson.cli.version).toBeDefined();
  });

  test("should use local app version source", () => {
    expect(easJson.cli.appVersionSource).toBe("local");
  });

  describe("development profile", () => {
    test("should exist", () => {
      expect(easJson.build.development).toBeDefined();
    });

    test("should enable development client", () => {
      expect(easJson.build.development.developmentClient).toBe(true);
    });

    test("should use internal distribution", () => {
      expect(easJson.build.development.distribution).toBe("internal");
    });
  });

  describe("preview profile", () => {
    test("should exist", () => {
      expect(easJson.build.preview).toBeDefined();
    });

    test("should use internal distribution", () => {
      expect(easJson.build.preview.distribution).toBe("internal");
    });

    test("should build Android as APK", () => {
      expect(easJson.build.preview.android.buildType).toBe("apk");
    });
  });

  describe("production profile", () => {
    test("should exist", () => {
      expect(easJson.build.production).toBeDefined();
    });

    test("should auto-increment version", () => {
      expect(easJson.build.production.autoIncrement).toBe(true);
    });

    test("should configure iOS for store distribution", () => {
      expect(easJson.build.production.ios.distribution).toBe("store");
    });

    test("should configure Android as app-bundle (aab)", () => {
      expect(easJson.build.production.android.buildType).toBe("app-bundle");
    });
  });

  describe("submit configuration", () => {
    test("should have production submit config", () => {
      expect(easJson.submit).toBeDefined();
      expect(easJson.submit.production).toBeDefined();
    });

    test("should configure iOS submission fields", () => {
      expect(easJson.submit.production.ios).toBeDefined();
      expect(easJson.submit.production.ios.appleId).toBeDefined();
      expect(easJson.submit.production.ios.ascAppId).toBeDefined();
      expect(easJson.submit.production.ios.appleTeamId).toBeDefined();
    });

    test("should configure Android submission with service account", () => {
      expect(easJson.submit.production.android).toBeDefined();
      expect(easJson.submit.production.android.serviceAccountKeyPath).toBeDefined();
    });
  });
});

describe("app.json — EAS requirements", () => {
  test("should have iOS bundleIdentifier", () => {
    expect(appJson.expo.ios.bundleIdentifier).toBe("com.membooks.app");
  });

  test("should have Android package name", () => {
    expect(appJson.expo.android.package).toBe("com.membooks.app");
  });

  test("should have app version", () => {
    expect(appJson.expo.version).toBeDefined();
  });

  test("should have app slug", () => {
    expect(appJson.expo.slug).toBe("membooks");
  });

  test("should have scheme for deep linking", () => {
    expect(appJson.expo.scheme).toBe("membooks");
  });
});

describe("package.json — EAS scripts", () => {
  test("should have eas-cli in devDependencies", () => {
    expect(packageJson.devDependencies["eas-cli"]).toBeDefined();
  });

  test("should have build:preview script", () => {
    expect(packageJson.scripts["build:preview"]).toContain("eas build");
    expect(packageJson.scripts["build:preview"]).toContain("--profile preview");
  });

  test("should have build:production script", () => {
    expect(packageJson.scripts["build:production"]).toContain("eas build");
    expect(packageJson.scripts["build:production"]).toContain("--profile production");
  });
});
