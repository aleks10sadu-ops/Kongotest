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
  try {
    const response = await fetch(`${apiUrl}/api/reservations/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Ошибка при создании бронирования',
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Ошибка сети',
    };
  }
}

