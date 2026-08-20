import { createRequire } from 'node:module';
import { expect, it } from 'vitest';

type Redirect = {
    source: string;
    destination: string;
    permanent: boolean;
};

const require = createRequire(import.meta.url);
const nextConfig = require('../next.config.js') as {
    redirects?: () => Promise<Redirect[]>;
};

it('redirects exact and legacy banquet hall URLs to canonical pages', async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(expect.arrayContaining([
        { source: '/izumrudnyj-zal', destination: '/halls/izumrudnyj-zal', permanent: true },
        { source: '/rubinovyj-zal', destination: '/halls/rubinovyj-zal', permanent: true },
        { source: '/shokoladnyj-zal', destination: '/halls/shokoladnyj-zal', permanent: true },
        { source: '/halls/banketnye-zaly-rubin', destination: '/halls/rubinovyj-zal', permanent: true },
        { source: '/halls/banketnye-zaly', destination: '/halls', permanent: true },
    ]));
});
