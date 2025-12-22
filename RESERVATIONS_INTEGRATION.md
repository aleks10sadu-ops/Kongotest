# Интеграция с сайтом бронирований

## Настройка

1. Создайте файл `.env.local` в корне проекта (если его еще нет)

2. Добавьте переменную окружения с URL вашего сайта бронирований:
   ```
   NEXT_PUBLIC_RESERVATIONS_API_URL=https://your-reservations-site.vercel.app
   ```

3. Перезапустите сервер разработки после добавления переменной окружения

## Как это работает

1. Клиент заполняет форму бронирования на сайте
2. Данные отправляются на API сайта бронирований: `POST /api/reservations/public`
3. Если бронирование успешно создано, оно автоматически появляется на сайте бронирований благодаря Realtime подписке
4. В случае успеха также отправляется уведомление в Telegram (как резервный вариант)
5. Если URL API не указан, форма работает в режиме "только Telegram" (старое поведение)

## Формат данных

Форма отправляет следующие данные:
- `name` - Имя клиента
- `phone` - Телефон клиента
- `date` - Дата бронирования (формат: YYYY-MM-DD)
- `time` - Время бронирования (формат: HH:mm)
- `guests_count` - Количество гостей (число)
- `comments` - Пожелания (необязательно)

## Устранение ошибок

### Ошибка "Failed to fetch"

Эта ошибка может возникать по нескольким причинам:

1. **Неправильный URL API**
   - Проверьте, что переменная `NEXT_PUBLIC_RESERVATIONS_API_URL` указана правильно
   - URL должен начинаться с `https://` или `http://`
   - Убедитесь, что нет лишних слэшей в конце URL

2. **CORS проблемы**
   - Убедитесь, что на сайте бронирований настроены CORS заголовки
   - API должен разрешать запросы с вашего домена

3. **API недоступен**
   - Проверьте, что сайт бронирований работает и доступен
   - Проверьте подключение к интернету

4. **Timeout**
   - По умолчанию установлен timeout 30 секунд
   - Если запрос занимает больше времени, проверьте производительность API

5. **Проблемы с сетью**
   - Проверьте подключение к интернету
   - Попробуйте отключить VPN или прокси

### Проверка настройки

1. Откройте консоль браузера (F12)
2. При отправке формы проверьте логи:
   - Должно быть сообщение "Sending reservation request to: [URL]"
   - Если видите ошибку CORS, проверьте настройки на сервере бронирований
   - Если видите timeout, проверьте доступность API

## Важно: настройка RLS в Supabase

Убедитесь, что в Supabase включены RLS политики, разрешающие создание бронирований через анонимный ключ. Если их еще нет, выполните в SQL Editor:

```sql
-- Разрешить создание бронирований для анонимных пользователей через API
CREATE POLICY "Allow public reservation creation"
ON reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Разрешить создание гостей для анонимных пользователей
CREATE POLICY "Allow public guest creation"
ON guests
FOR INSERT
TO anon
WITH CHECK (true);

-- Разрешить чтение гостей по телефону
CREATE POLICY "Allow public guest read by phone"
ON guests
FOR SELECT
TO anon
USING (true);
```

## Настройка Content Security Policy (CSP)

Если вы получаете ошибку "Refused to connect" из-за CSP, убедитесь, что домен API бронирований добавлен в `connect-src` в `next.config.js`.

По умолчанию уже добавлены:
- `https://k-c-reservations.vercel.app`
- `https://*.vercel.app` (для всех Vercel доменов)

Если вы используете другой домен, добавьте его в `next.config.js`:

```javascript
"connect-src 'self' https://*.supabase.co ... https://your-reservations-domain.com",
```

## Настройка CORS на сайте бронирований

Если вы получаете CORS ошибки, убедитесь, что на сайте бронирований настроены правильные заголовки. В Next.js это можно сделать через `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/reservations/public',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' }, // или конкретный домен
        { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
      ],
    },
  ];
}
```

