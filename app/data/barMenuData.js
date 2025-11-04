// Данные барного меню
export const barMenuData = {
  categories: [
    {
      id: "tea",
      name: "Чай",
      items: [
        {
          id: 1,
          name: "Помашнее варенье",
          description: "Арбузное/кизиловое/абрикосовое/вишневое",
          price: 220,
          currency: "₽",
          volume: null
        },
        {
          id: 2,
          name: "Чайник чая",
          description: "Черный / Черный с бергамотом / черный с чабрецом / Зеленый / зеленый с жасмином / молочный улун",
          price: 290,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 3,
          name: "Купажированный черный чай с натуральными ягодами",
          description: "1001 ночь / Маленькие чудеса / Красные ягоды",
          price: 290,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 4,
          name: "Волшебный чай",
          description: "Каркаде, корица, гвоздика, апельсин и яблоко",
          price: 360,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 5,
          name: "Марокканский мятный чай",
          description: "Черный чай с цитрусовыми нотками, корицей, гвоздикой и мятой",
          price: 420,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 6,
          name: "Яблочно-медовый чай",
          description: "Черный чай с яблоком, медом и яблочным соком",
          price: 360,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 7,
          name: "Апельсиновый чай",
          description: "Зеленый чай с соком апельсина и слайсами апельсина",
          price: 360,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 8,
          name: "Облепиховый чай",
          description: "Согревающий напиток с ягодами облепихи и медом. По желанию добавить свежий имбирь и палочку корицы",
          price: 540,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        }
      ]
    },
    {
      id: "refreshing_tea",
      name: "Чай освежающий",
      items: [
        {
          id: 9,
          name: "Красное море",
          description: "Освежающий напиток на основе каркаде, с добавлением клубничного и ванильного сиропов и сока лимона",
          price: 360,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        },
        {
          id: 10,
          name: "Ледяное яблоко",
          description: "Черный чай с соком лимона, мятой, сахарным сиропом и соком зеленого яблока",
          price: 360,
          currency: "₽",
          volume: 600,
          volume_unit: "мл",
          weight: "600 мл"
        }
      ]
    },
    {
      id: "coffee",
      name: "Кофе",
      note: "Кофе, в состав которого входят классическое молоко, можно приготовить на альтернативном растительном продукте: миндальном или кокосовом",
      items: [
        {
          id: 11,
          name: "По-восточному",
          price: 130,
          currency: "₽",
          volume: 60,
          volume_unit: "мл",
          weight: "60 мл"
        },
        {
          id: 12,
          name: "Эспрессо",
          price: 130,
          currency: "₽",
          volume: 45,
          volume_unit: "мл",
          weight: "45 мл"
        },
        {
          id: 13,
          name: "Эспрессо допио",
          price: 200,
          currency: "₽",
          volume: 90,
          volume_unit: "мл",
          weight: "90 мл"
        },
        {
          id: 14,
          name: "Американо",
          price: 130,
          currency: "₽",
          volume: 200,
          volume_unit: "мл",
          weight: "200 мл"
        },
        {
          id: 15,
          name: "Капучино",
          description: "Классический или с сиропом",
          price: 240,
          currency: "₽",
          volume: 200,
          volume_unit: "мл",
          weight: "200 мл"
        },
        {
          id: 16,
          name: "Латте",
          description: "Классический или с сиропом",
          price: 260,
          currency: "₽",
          volume: 215,
          volume_unit: "мл",
          weight: "215 мл"
        },
        {
          id: 17,
          name: "Глясе",
          description: "Американо с шариком ванильного мороженого",
          price: 300,
          currency: "₽",
          volume: 215,
          volume_unit: "мл",
          weight: "215 мл"
        },
        {
          id: 18,
          name: "Раф кофе",
          description: "Эспрессо с ванильным сиропом и сливками",
          price: 300,
          currency: "₽",
          volume: 215,
          volume_unit: "мл",
          weight: "215 мл"
        },
        {
          id: 19,
          name: "Флэт уайт",
          description: "Двойная порция Эспрессо со взбитым молоком",
          price: 280,
          currency: "₽",
          volume: 310,
          volume_unit: "мл",
          weight: "310 мл"
        }
      ]
    },
    {
      id: "cold_coffee",
      name: "Холодный кофе",
      items: [
        {
          id: 20,
          name: "Мятный шоколад",
          description: "Эспрессо, сироп Мята, сироп Шоколад, молоко",
          price: 360,
          currency: "₽",
          volume: 450,
          volume_unit: "мл",
          weight: "450 мл"
        },
        {
          id: 21,
          name: "Ice coffee",
          description: "Эспрессо, сироп на выбор: Карамель / Орех / Шоколад / Кокос / Ваниль",
          price: 360,
          currency: "₽",
          volume: 350,
          volume_unit: "мл",
          weight: "350 мл"
        }
      ]
    },
    {
      id: "juices_drinks",
      name: "Соки и напитки",
      items: [
        {
          id: 22,
          name: "Сок в ассортименте",
          price_small: 70,
          price_large: 280,
          currency: "₽",
          volume_small: 250,
          volume_large: 1000,
          volume_unit: "мл",
          variants: [
            {
              name: "250 мл",
              price: 70,
              weight: "250 мл"
            },
            {
              name: "1000 мл",
              price: 280,
              weight: "1000 мл"
            }
          ],
          price: 70
        },
        {
          id: 23,
          name: "Морс Домашний",
          price_small: 120,
          price_large: 480,
          currency: "₽",
          volume_small: 250,
          volume_large: 1000,
          volume_unit: "мл",
          variants: [
            {
              name: "250 мл",
              price: 120,
              weight: "250 мл"
            },
            {
              name: "1000 мл",
              price: 480,
              weight: "1000 мл"
            }
          ],
          price: 120
        },
        {
          id: 24,
          name: "Лимонад Персик-клубника",
          price: 480,
          currency: "₽",
          volume: 1000,
          volume_unit: "мл",
          weight: "1000 мл"
        },
        {
          id: 25,
          name: "Лимонад Вишневый",
          price: 480,
          currency: "₽",
          volume: 1000,
          volume_unit: "мл",
          weight: "1000 мл"
        },
        {
          id: 26,
          name: "Лимонад Арбуз",
          description: "сезонная позиция",
          price: 480,
          currency: "₽",
          volume: 1000,
          volume_unit: "мл",
          weight: "1000 мл"
        },
        {
          id: 27,
          name: "Лимонад Дыня",
          description: "сезонная позиция",
          price: 480,
          currency: "₽",
          volume: 1000,
          volume_unit: "мл",
          weight: "1000 мл"
        },
        {
          id: 28,
          name: "Тоник Rich",
          description: "стекло",
          price: 250,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 29,
          name: "Добрый Cola",
          description: "стекло",
          price: 180,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 30,
          name: "Добрый Cola без сахара",
          description: "стекло",
          price: 180,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 31,
          name: "Добрый Апельсин",
          description: "стекло",
          price: 180,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 32,
          name: "Добрый Лимон-лайм",
          description: "стекло",
          price: 180,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 33,
          name: "Минеральная вода Бон Аква",
          description: "стекло: с газом/без газа",
          price: 150,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 34,
          name: "Джермук",
          description: "стекло: с газом",
          price: 230,
          currency: "₽",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        },
        {
          id: 35,
          name: "Боржоми",
          description: "стекло: с газом",
          price: 230,
          currency: "₽",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        },
        {
          id: 36,
          name: "Лимонад Тархун / Дюшес",
          description: "стекло",
          price: 230,
          currency: "₽",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        },
        {
          id: 37,
          name: "Свежевыжатый сок",
          description: "Яблоко / апельсин / грейпфрут / сельдерей / морковь / лимон",
          price: 330,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        }
      ]
    },
    {
      id: "bottled_beer",
      name: "Бутылочное пиво",
      items: [
        {
          id: 38,
          name: "Бутылочное пиво",
          price: 250,
          currency: "руб",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        }
      ]
    },
    {
      id: "vodka",
      name: "Алкогольные напитки - Водка",
      note: "Объем порции: 50 мл",
      items: [
        {
          id: 39,
          name: "Чавыча Премиум",
          price: 110,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 40,
          name: "Царская Серебро",
          price: 120,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 41,
          name: "Царская Золото",
          price: 150,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 42,
          name: "Онегин",
          price: 270,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 43,
          name: "Белуга",
          price: 290,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 44,
          name: "Чистые Росы",
          price: 330,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 45,
          name: "Абсолют",
          price: 330,
          currency: "₽",
          weight: "50 мл"
        },
        {
          id: 46,
          name: "Мон Блан",
          price: 450,
          currency: "₽",
          weight: "50 мл"
        }
      ]
    },
    {
      id: "cognac",
      name: "Алкогольные напитки - Коньяк",
      note: "Объем порции: 40 мл",
      items: [
        {
          id: 47,
          name: "Арарат 3 звезды",
          price: 240,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 48,
          name: "Арарат 5 звезд",
          price: 350,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 49,
          name: "Курвуазье 12 лет",
          price: 920,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "whiskey",
      name: "Алкогольные напитки - Виски",
      note: "Объем порции: 40 мл",
      items: [
        {
          id: 50,
          name: "Вильям Лоусонс",
          price: 240,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 51,
          name: "Баллантайнс",
          price: 340,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 52,
          name: "Джим Бим",
          price: 400,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 53,
          name: "Джемесон",
          price: 400,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 54,
          name: "Джек Дэниэлс",
          price: 420,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 55,
          name: "Чивас 12 лет",
          price: 570,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 56,
          name: "Макаллан 12 лет",
          price: 1490,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "rum",
      name: "Алкогольные напитки - Ром",
      note: "Объем порции: 40 мл",
      items: [
        {
          id: 57,
          name: "Капитан Морган Уайт",
          price: 270,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 58,
          name: "Капитан Морган Пряный золотой",
          price: 270,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 59,
          name: "Капитан Морган Дарк",
          price: 270,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "gin",
      name: "Алкогольные напитки - Джин",
      note: "Объем порции: 40 мл",
      items: [
        {
          id: 60,
          name: "ХОППЕРС Ориджинал Драй",
          price: 160,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 61,
          name: "ХОППЕРС Мандарин/Розмарин",
          price: 160,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 62,
          name: "ХОППЕРС Лаванда/Чабрец",
          price: 160,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 63,
          name: "Бифитер",
          price: 320,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "tequila",
      name: "Алкогольные напитки - Текила",
      note: "100% agave azul 40 мл",
      items: [
        {
          id: 64,
          name: "Антигуа Круз Сильвер (серебряная)",
          price: 360,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 65,
          name: "Антигуа Круз Репосадо (золотая)",
          price: 430,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "vermouth",
      name: "Алкогольные напитки - Вермут",
      note: "Объем порции: 100 мл",
      items: [
        {
          id: 66,
          name: "Мартини Бьянко",
          price: 580,
          currency: "₽",
          weight: "100 мл"
        },
        {
          id: 67,
          name: "Мартини Экстра Драй",
          price: 580,
          currency: "₽",
          weight: "100 мл"
        },
        {
          id: 68,
          name: "Мартини Россо",
          price: 580,
          currency: "₽",
          weight: "100 мл"
        }
      ]
    },
    {
      id: "liqueurs",
      name: "Алкогольные напитки - Ликеры",
      note: "Объем порции: 40 мл",
      items: [
        {
          id: 69,
          name: "Егермейстер",
          price: 260,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 70,
          name: "Бейлиз",
          price: 350,
          currency: "₽",
          weight: "40 мл"
        },
        {
          id: 71,
          name: "Самбука",
          price: 260,
          currency: "₽",
          weight: "40 мл"
        }
      ]
    },
    {
      id: "non_alcoholic_cocktails",
      name: "Безалкогольные коктейли",
      items: [
        {
          id: 72,
          name: "Зеленая миля",
          description: "Сироп Блю Кюрасао, лимонный фреш, ананасовый сок, персиковый сок, сироп Ваниль, содовая, свежая мята, сахар",
          price: 300,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 73,
          name: "Лето пришло",
          description: "Сироп Дыня, сок апельсина, сок ананаса, сок лимона, кусочки свежей дыни",
          price: 300,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 74,
          name: "Мохито",
          description: "Классический или клубничный",
          price: 300,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 75,
          name: "Пина Колада",
          description: "Ананасовый сок, сироп Кокос, сливки",
          price: 350,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 76,
          name: "Цунами",
          description: "Пюре киви, сироп Личи, сок лимона, сок яблока",
          price: 300,
          currency: "₽",
          volume: 350,
          volume_unit: "мл",
          weight: "350 мл"
        },
        {
          id: 77,
          name: "Сливочное вдохновение",
          description: "Молоко, ананасовый сок, персиковый сок, сироп Клубника, сироп Кокос",
          price: 300,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 78,
          name: "Цитрусовый взрыв",
          description: "Ананасовый сок, апельсиновый сок, лимонный фреш, сироп Гренадин",
          price: 350,
          currency: "₽",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        }
      ]
    },
    {
      id: "milkshake",
      name: "Молочный коктейль",
      items: [
        {
          id: 79,
          name: "Молочный коктейль",
          description: "Варианты: Ванильный, Клубничный, Шоколадный",
          variants: [
            {
              name: "Ванильный",
              price: 450,
              weight: "330 мл"
            },
            {
              name: "Клубничный",
              price: 450,
              weight: "330 мл"
            },
            {
              name: "Шоколадный",
              price: 450,
              weight: "330 мл"
            }
          ],
          price: 450,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        }
      ]
    },
    {
      id: "alcoholic_cocktails",
      name: "Алкогольные коктейли",
      items: [
        {
          id: 80,
          name: "Свободное падение",
          description: "Hoppers original gin, сок грейпфрута, сахарный сироп, сок лимона, корица, перец, грейпфрут",
          price: 360,
          currency: "₽",
          volume: 350,
          volume_unit: "мл",
          weight: "350 мл"
        },
        {
          id: 81,
          name: "Жгучий мандарин",
          description: "Hoppers mandarin gin, сироп Мандарин, сок апельсина, сок лимона, табаско",
          price: 420,
          currency: "₽",
          volume: 350,
          volume_unit: "мл",
          weight: "350 мл"
        },
        {
          id: 82,
          name: "Лавандос",
          description: "Hoppers lavander gin, сироп Лаванда, чабрец, сахарный сироп, сок лимона",
          price: 360,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 83,
          name: "Ягерита",
          description: "Ликер Егермейстер, сок лайма, ликер Трипл сек, сахарный сироп, веточка розмарина, цедра апельсина",
          price: 420,
          currency: "₽",
          volume: 310,
          volume_unit: "мл",
          weight: "310 мл"
        },
        {
          id: 84,
          name: "Выпил, закусил",
          description: "Виски, сироп Гренадин, сок грейпфрута, сок лайма, огурец",
          price: 420,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 85,
          name: "Яблочный штрудель",
          description: "Виски, яблочный сок, корица, сироп Ваниль",
          price: 420,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 86,
          name: "Апероль шприц",
          description: "Ликер Апероль, игристое вино, содовая, апельсин",
          price: 580,
          currency: "₽",
          volume: 300,
          volume_unit: "мл",
          weight: "300 мл"
        },
        {
          id: 87,
          name: "Ромовый пунш",
          description: "Золотой ром, ликер Апероль, сок лимона, сок апельсина, сироп Гренадин, цедра апельсина",
          price: 650,
          currency: "₽",
          volume: 310,
          volume_unit: "мл",
          weight: "310 мл"
        },
        {
          id: 88,
          name: "Гео",
          description: "Водка, киви, сироп Зеленое яблоко, сок лайма, спрайт",
          price: 420,
          currency: "₽",
          volume: 350,
          volume_unit: "мл",
          weight: "350 мл"
        },
        {
          id: 89,
          name: "Голубая лагуна",
          description: "Сироп Блю Кюрасао, водка, спрайт, лимон",
          price: 350,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 90,
          name: "Секс на пляже",
          description: "Водка, ананасовый сок, персиковый сок, морс, сироп Гренадин",
          price: 350,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 91,
          name: "Текила санрайз",
          description: "Текила, апельсиновый сок, сироп Гренадин",
          price: 420,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 92,
          name: "Маргарита",
          description: "Текила, ликер Трипл Сек, лайм фреш, соль",
          price: 420,
          currency: "₽",
          volume: 110,
          volume_unit: "мл",
          weight: "110 мл"
        },
        {
          id: 93,
          name: "Мохито",
          description: "Ром, мята, лайм, тростниковый сахар",
          price: 420,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 94,
          name: "Мохито клубничный",
          description: "Ром, мята, лайм, сироп Клубника",
          price: 460,
          currency: "₽",
          volume: 250,
          volume_unit: "мл",
          weight: "250 мл"
        },
        {
          id: 95,
          name: "Алиса в стране бокалов",
          description: "Белый ром, клубничный сироп, спрайт, сок лимона",
          price: 350,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 96,
          name: "Пина Колада",
          description: "Ром, ананасовый сок, сливки, ликер Пина Колада",
          price: 580,
          currency: "₽",
          volume: 330,
          volume_unit: "мл",
          weight: "330 мл"
        },
        {
          id: 97,
          name: "Кайпиринья",
          description: "Ром, лайм, тростниковый сироп",
          price: 480,
          currency: "₽",
          volume: 310,
          volume_unit: "мл",
          weight: "310 мл"
        },
        {
          id: 98,
          name: "Белый русский",
          description: "Кофейный ликер, водка, сливки",
          price: 390,
          currency: "₽",
          volume: 90,
          volume_unit: "мл",
          weight: "90 мл"
        },
        {
          id: 99,
          name: "Лонг Айленд",
          description: "Текила, водка, ром, джин, ликер Трипл сек, кола, лайм",
          price: 580,
          currency: "₽",
          volume: 500,
          volume_unit: "мл",
          weight: "500 мл"
        },
        {
          id: 100,
          name: "Б-52",
          description: "Кофейный ликер, сливочный ликер, ликер Трипл Сек",
          price: 390,
          currency: "₽",
          volume: 60,
          volume_unit: "мл",
          weight: "60 мл"
        },
        {
          id: 101,
          name: "Медуза",
          description: "Кокосовый ликер, сливочный ликер, светлый ром, ликер Трипл Сек, сироп Блю Кюрасао",
          price: 390,
          currency: "₽",
          volume: 60,
          volume_unit: "мл",
          weight: "60 мл"
        },
        {
          id: 102,
          name: "Рецепт от врача",
          description: "Кофейный ликер, сливочный ликер, текила, корица",
          price: 390,
          currency: "₽",
          volume: 60,
          volume_unit: "мл",
          weight: "60 мл"
        },
        {
          id: 103,
          name: "Боярский",
          description: "Водка, сироп Гренадин, Табаско",
          price: 390,
          currency: "₽",
          volume: 60,
          volume_unit: "мл",
          weight: "60 мл"
        }
      ]
    }
  ]
};

