'use server';

import EnhancedMenuSection from '../components/EnhancedMenuSection';
import { getMenuByType } from '../../lib/menu/getMenuByType';

export default async function MenuPage() {
  const mainCategories = await getMenuByType('main');
  const promoCategories = await getMenuByType('promotions');
  const kidsCategories = await getMenuByType('kids');
  const barCategories = await getMenuByType('bar');
  const wineCategories = await getMenuByType('wine');

  const dataByType = {
    main: { categories: mainCategories },
    promotions: { categories: promoCategories },
    kids: { categories: kidsCategories },
    bar: { categories: barCategories },
    wine: { categories: wineCategories },
  };

  return (
    <div className="bg-neutral-950 text-white min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <EnhancedMenuSection
          ssrMenuDataByType={dataByType}
          enableAdminEditing
        />
      </div>
    </div>
  );
}


