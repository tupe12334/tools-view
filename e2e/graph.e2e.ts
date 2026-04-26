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
    await expect(page.locator('canvas#c')).toBeVisible();
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

  test('opens mermaid modal on node click', async ({ page }) => {
    await page.goto('graph.html');
    const modal = page.locator('#modal');
    await expect(modal).toBeHidden();

    await page.waitForFunction(
      () => {
        const tv = (window as unknown as { __toolsview?: { nodes?: { x: number }[] } })
          .__toolsview;
        return Boolean(tv && tv.nodes && tv.nodes.length > 0);
      },
    );
    await page.evaluate(() => {
      type N = { id: string; x: number; y: number };
      const tv = (window as unknown as { __toolsview: { nodes: N[] } }).__toolsview;
      const node = tv.nodes.find((n) => n.id === 'test-skill');
      if (!node) throw new Error('test-skill node missing');
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const clientX = rect.left + node.x;
      const clientY = rect.top + node.y;
      const opts: MouseEventInit = { clientX, clientY, bubbles: true, button: 0 };
      canvas.dispatchEvent(new MouseEvent('mousedown', opts));
      window.dispatchEvent(new MouseEvent('mouseup', opts));
    });

    await expect(modal).toBeVisible();
    await expect(page.locator('#modal-title')).toHaveText('Test Skill');
    await expect(page.locator('#modal-body .mermaid')).toHaveCount(1);

    await page.locator('#modal-close').click();
    await expect(modal).toBeHidden();
  });
});
