import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

type Redirect = {
    source: string;
    destination: string;
    permanent: boolean;
};

const require = createRequire(import.meta.url);
const nextConfig = require('../next.config.js') as {
    redirects?: () => Promise<Redirect[]>;
};

describe('legacy search-result redirects', () => {
    it('permanently redirects indexed URLs from the previous site', async () => {
        const redirects = await nextConfig.redirects?.();
        const expected: Redirect[] = [
            { source: '/about', destination: '/', permanent: true },
            { source: '/contacts', destination: '/#find', permanent: true },
            { source: '/foto', destination: '/#atmosphere', permanent: true },
            { source: '/akcii-restorana', destination: '/promotions', permanent: true },
            { source: '/dostavka', destination: '/delivery', permanent: true },
            { source: '/delivery/shashlyk', destination: '/menu?category=shashlyk#delivery', permanent: true },
            { source: '/delivery/khinkali', destination: '/menu?category=khinkali#delivery', permanent: true },
            { source: '/menu/shashlyk', destination: '/menu?category=shashlyk#delivery', permanent: true },
            { source: '/menu/khinkali', destination: '/menu?category=khinkali#delivery', permanent: true },
            { source: '/osnovnoe-menyu', destination: '/menu#main', permanent: true },
            { source: '/detskoe-menyu', destination: '/menu#main', permanent: true },
            { source: '/barnoe-menyu', destination: '/menu#bar', permanent: true },
            { source: '/vinnaya-karta', destination: '/menu#wine', permanent: true },
            { source: '/biznes-lanch', destination: '/business-lunch', permanent: true },
            { source: '/banketnoe-menyu', destination: '/menu#banquet', permanent: true },
            { source: '/services', destination: '/halls', permanent: true },
            { source: '/besedki', destination: '/halls/besedki-kucher', permanent: true },
            { source: '/izumrudnyj-zal', destination: '/halls/izumrudnyj-zal', permanent: true },
            { source: '/rubinovyj-zal', destination: '/halls/rubinovyj-zal', permanent: true },
            { source: '/shokoladnyj-zal', destination: '/halls/shokoladnyj-zal', permanent: true },
            { source: '/halls/banketnye-zaly-rubin', destination: '/halls/rubinovyj-zal', permanent: true },
            { source: '/halls/banketnye-zaly', destination: '/halls', permanent: true },
            { source: '/letnyaya-veranda', destination: '/halls/letnyaya-veranda', permanent: true },
            { source: '/detskaya-ploshchadka', destination: '/halls', permanent: true },
            { source: '/detskaya-komnata', destination: '/halls', permanent: true },
            { source: '/kalyannaya', destination: '/halls/barnyy-zal', permanent: true },
            { source: '/novosti', destination: '/events', permanent: true },
            { source: '/novosti/:path*', destination: '/events', permanent: true },
            { source: '/novogodnyaya-noch-i-korporativy', destination: '/events', permanent: true },
            { source: '/nashi-vakansii', destination: '/vacancies', permanent: true },
            { source: '/politika-konfidecialnosti', destination: '/privacy', permanent: true },
            { source: '/pravila-nahozhdeniya-gostej-v-restorane', destination: '/rules', permanent: true },
        ];

        expect(redirects).toEqual(expect.arrayContaining(expected));
    });
});
