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
    for (let offset = 0; offset < data.length; offset += 4) {
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        const alpha = data[offset + 3];
        if (red >= 245 && green >= 245 && blue >= 245 && alpha >= 245) whitePixels += 1;
    }

    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    return {
        whitePixels,
        innerBottomAlpha: alphaAt(64, 120),
        outsideContourAlphas: [alphaAt(6, 64), alphaAt(121, 64)],
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
        { label: 'cache-safe SVG', file: 'kucher-conga-favicon-v2.svg' },
        { label: 'legacy SVG', file: 'icon.svg' },
        { label: '48px PNG', file: 'favicon-48x48.png' },
        { label: 'Apple touch PNG', file: 'apple-touch-icon.png' },
        { label: 'ICO', file: 'favicon.ico', ico: true },
    ];

    it.each(assets)('$label renders a white circular badge with transparent corners', async ({ file, ico }) => {
        const rendered = await readRenderedPixels(file, ico);

        expect(rendered.whitePixels).toBeGreaterThan(1_000);
        expect(rendered.innerBottomAlpha).toBeGreaterThanOrEqual(180);
        expect(rendered.outsideContourAlphas.every((alpha) => alpha <= 25)).toBe(true);
        expect(rendered.cornerAlphas).toEqual([0, 0, 0, 0]);
    });
});
