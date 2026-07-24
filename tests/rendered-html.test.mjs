import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://aurora-prototype.example/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Aurora Inspiration experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Inspiration — Aurora<\/title>/i);
  assert.match(html, /Good evening, Aditya\./);
  assert.match(html, /Dinner, then the late set\./);
  assert.match(html, /For tomorrow morning/);
  assert.match(html, /Worth making room for/);
  assert.match(html, /Tell Aurora what to change/);
  assert.match(html, /https?:\/\/[^\"']+\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|SkeletonPreview/);
});

test("ships the Aurora brand assets and removes starter infrastructure", async () => {
  const [page, layout, experience, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/AuroraExperience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  await Promise.all([
    access(new URL("public/aurora-logo.png", templateRoot)),
    access(new URL("public/favicon.png", templateRoot)),
    access(new URL("public/og.png", templateRoot)),
    access(new URL("public/fonts/Hellix-Regular.woff2", templateRoot)),
    access(new URL("public/images/private-dinner.jpg", templateRoot)),
  ]);

  assert.match(page, /AuroraExperience/);
  assert.match(layout, /generateMetadata/);
  assert.match(experience, /Send access request/);
  assert.match(experience, /Your timeline is live/i);
  assert.match(css, /--orange:\s*#ff8f19/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
