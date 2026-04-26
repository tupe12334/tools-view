import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const graphJsonPath = path.resolve(here, '..', 'examples', '.claude', 'graph', 'graph.json');

test.describe('toolsview graph viewer', () => {
  test('emits graph.json with expected nodes and edges', () => {
    const graph = JSON.parse(fs.readFileSync(graphJsonPath, 'utf-8'));
    const ids = graph.nodes
      .filter((n: { type: string }) => n.type === 'skill')
      .map((n: { id: string }) => n.id)
      .sort();
    expect(ids).toEqual(['another-skill', 'test-skill']);
    expect(graph.edges).toContainEqual(
      expect.objectContaining({ from: 'another-skill', to: 'test-skill', type: 'calls' }),
    );
  });

  test('embeds graph data into html and renders chrome', async ({ page }) => {
    await page.goto('graph.html');
    await expect(page).toHaveTitle(/Skills/);
    await expect(page.locator('#title')).toHaveText(/Skills/);
    await expect(page.locator('#c')).toBeVisible();
    await expect(page.locator('#leg-skill')).toBeVisible();

    const ids = await page.evaluate(() => {
      const tv = (window as unknown as { __toolsview?: { G: { nodes: { id: string }[] } } })
        .__toolsview;
      if (!tv) throw new Error('__toolsview not exposed');
      return tv.G.nodes.map((n) => n.id).sort();
    });
    expect(ids).toContain('test-skill');
    expect(ids).toContain('another-skill');
  });

  test('opens mermaid.live in new tab on node click', async ({ page, context }) => {
    await page.goto('graph.html');

    await page.waitForFunction(() => {
      const tv = (
        window as unknown as { __toolsview?: { clickNode?: (id: string) => void } }
      ).__toolsview;
      return Boolean(tv && typeof tv.clickNode === 'function');
    });

    const popupPromise = context.waitForEvent('page');
    await page.evaluate(() => {
      const tv = (window as unknown as { __toolsview: { clickNode: (id: string) => void } })
        .__toolsview;
      tv.clickNode('test-skill');
    });

    const popup = await popupPromise;
    const url = popup.url();
    expect(url).toContain('mermaid.live/edit#base64:');
    const encoded = url.split('#base64:')[1];
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(b64, 'base64').toString('utf-8');
    const state: { code: string } = JSON.parse(decoded);
    expect(typeof state.code).toBe('string');
    expect(state.code.length).toBeGreaterThan(0);
    await popup.close();
  });
});
