// lib/reservations.js

/**
 * Интерфейс для создания бронирования
 * @typedef {Object} CreateReservationRequest
 * @property {string} name - Имя клиента
 * @property {string} phone - Телефон клиента
 * @property {string} date - Дата бронирования в формате YYYY-MM-DD
 * @property {string} time - Время бронирования в формате HH:mm
 * @property {number} guests_count - Количество гостей
 * @property {string} [comments] - Пожелания (необязательно)
 */

/**
 * Ответ от API создания бронирования
 * @typedef {Object} CreateReservationResponse
 * @property {boolean} success - Успешно ли создано бронирование
 * @property {any} [reservation] - Данные созданного бронирования
 * @property {string} [message] - Сообщение об успехе
 * @property {string} [error] - Сообщение об ошибке
 */

/**
 * Создает бронирование через API сайта бронирований
 * @param {CreateReservationRequest} data - Данные бронирования
 * @param {string} apiUrl - URL сайта бронирований (например: https://your-reservations-site.vercel.app)
 * @returns {Promise<CreateReservationResponse>} Результат создания бронирования
 */
export async function createReservation(data, apiUrl) {
  // Проверка на пустой URL
  if (!apiUrl || apiUrl.trim() === '') {
    return {
      success: false,
      error: 'URL API бронирований не настроен. Пожалуйста, свяжитесь с администратором.',
    };
  }

  // Очищаем URL: убираем пробелы и нормализуем слэши
  let cleanApiUrl = apiUrl.trim();
  
  // Убираем trailing slash
  cleanApiUrl = cleanApiUrl.replace(/\/+$/, '');
  
  // Убираем все множественные слэши после протокола, оставляя только один после домена
  // Это обрабатывает случаи типа: https://domain.com// или https://domain.com///
  cleanApiUrl = cleanApiUrl.replace(/(https?:\/\/[^\/]+)\/+/g, '$1/');
  
  // Формируем endpoint, гарантируя один слэш между доменом и путем
  // Убираем все множественные слэши в пути
  const apiEndpoint = `${cleanApiUrl}/api/reservations/public`.replace(/([^:]\/)\/+/g, '$1');
  
  console.log('Original API URL:', apiUrl);
  console.log('Cleaned API URL:', cleanApiUrl);
  console.log('Final endpoint:', apiEndpoint);

  let timeoutId;
  try {
    console.log('Sending reservation request to:', apiEndpoint);
    console.log('Reservation data:', data);

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд timeout

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Проверяем, является ли ответ JSON
    const contentType = response.headers.get('content-type');
    let result;

    if (contentType && contentType.includes('application/json')) {
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        const text = await response.text();
        console.error('Response text:', text);
        return {
          success: false,
          error: `Ошибка сервера: неверный формат ответа (${response.status})`,
        };
      }
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return {
        success: false,
        error: `Ошибка сервера: неверный формат ответа (${response.status})`,
      };
    }

    if (!response.ok) {
      console.error('API error response:', result);
      return {
        success: false,
        error: result.error || result.message || `Ошибка сервера (${response.status})`,
      };
    }

    console.log('Reservation created successfully:', result);
    return result;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    
    // Обработка различных типов ошибок
    if (error.name === 'AbortError') {
      console.error('Request timeout:', error);
      return {
        success: false,
        error: 'Превышено время ожидания ответа. Проверьте подключение к интернету и попробуйте позже.',
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      return {
        success: false,
        error: 'Ошибка сети. Проверьте подключение к интернету или свяжитесь с администратором.',
      };
    }

    // CORS ошибка
    if (error.message && error.message.includes('CORS')) {
      console.error('CORS error:', error);
      return {
        success: false,
        error: 'Ошибка доступа к серверу. Пожалуйста, свяжитесь с администратором.',
      };
    }

    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка. Попробуйте позже или свяжитесь с администратором.',
    };
  }
}

