import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const publicPath = (...parts: string[]) => path.join(process.cwd(), 'public', ...parts);

function extractFirstIcoImage(ico: Buffer): Buffer {
    const imageCount = ico.readUInt16LE(4);
    if (imageCount < 1) throw new Error('favicon.ico has no image entries');

    const byteLength = ico.readUInt32LE(14);
    const byteOffset = ico.readUInt32LE(18);
    return ico.subarray(byteOffset, byteOffset + byteLength);
}

async function readRenderedPixels(asset: string, ico = false) {
    const file = await readFile(publicPath(asset));
    const input = ico ? extractFirstIcoImage(file) : file;
    const { data, info } = await sharp(input, { density: 96 })
        .resize(128, 128)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let whitePixels = 0;
    let transparentPixels = 0;
    let darkPixels = 0;
    let darkMinX = info.width;
    let darkMinY = info.height;
    let darkMaxX = -1;
    let darkMaxY = -1;
    for (let offset = 0; offset < data.length; offset += 4) {
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        const alpha = data[offset + 3];
        if (red >= 245 && green >= 245 && blue >= 245 && alpha >= 245) whitePixels += 1;
        if (alpha <= 10) transparentPixels += 1;
        if (red <= 20 && green <= 20 && blue <= 20 && alpha >= 245) {
            const pixel = offset / 4;
            const x = pixel % info.width;
            const y = Math.floor(pixel / info.width);
            darkPixels += 1;
            darkMinX = Math.min(darkMinX, x);
            darkMinY = Math.min(darkMinY, y);
            darkMaxX = Math.max(darkMaxX, x);
            darkMaxY = Math.max(darkMaxY, y);
        }
    }

    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    return {
        whitePixels,
        transparentPixels,
        darkPixels,
        darkBounds: {
            width: darkMaxX - darkMinX + 1,
            height: darkMaxY - darkMinY + 1,
        },
        centerAlpha: alphaAt(64, 64),
        edgeAlphas: [alphaAt(64, 0), alphaAt(127, 64), alphaAt(64, 127), alphaAt(0, 64)],
        cornerAlphas: [
            alphaAt(0, 0),
            alphaAt(info.width - 1, 0),
            alphaAt(0, info.height - 1),
            alphaAt(info.width - 1, info.height - 1),
        ],
    };
}

describe('favicon assets', () => {
    const assets = [
        { label: 'cache-safe SVG', file: 'kucher-conga-favicon-v4.svg' },
        { label: 'legacy SVG', file: 'icon.svg' },
        { label: '48px PNG', file: 'favicon-48x48-v4.png' },
        { label: 'Apple touch PNG', file: 'apple-touch-icon-v4.png' },
        { label: 'ICO', file: 'favicon-v4.ico', ico: true },
    ];

    it.each(assets)('$label renders a large black eye on a transparent canvas', async ({ file, ico }) => {
        const rendered = await readRenderedPixels(file, ico);

        expect(rendered.whitePixels).toBeLessThan(50);
        expect(rendered.transparentPixels).toBeGreaterThan(8_000);
        expect(rendered.darkPixels).toBeGreaterThan(2_000);
        expect(rendered.darkBounds.width).toBeGreaterThanOrEqual(96);
        expect(rendered.darkBounds.height).toBeGreaterThanOrEqual(90);
        expect(rendered.centerAlpha).toBeGreaterThanOrEqual(245);
        expect(rendered.edgeAlphas).toEqual([0, 0, 0, 0]);
        expect(rendered.cornerAlphas).toEqual([0, 0, 0, 0]);
    });
});
