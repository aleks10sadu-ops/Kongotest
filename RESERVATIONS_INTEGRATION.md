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

