const axios = require('axios');
const cheerio = require('cheerio');

// Функция для парсинга конкретного объявления
exports.getParsedShowData = async (id) => {
  try {
    const URL = `https://krisha.kz/a/show/${id}`;
    console.log('Parsed URL:', URL); // Лог для отладки
    const response = await axios.get(URL);
    const html = response.data;
    const $ = cheerio.load(html);

    // Извлечение данных с страницы
    const title = $('h1').text().trim() || 'Нет названия';
    const description = $('.offer__description').html() || 'Описание отсутствует';
    const price = parseInt($('.offer__price').text().replace(/[^\d]/g, '') || '0');
    const address = $('.offer__location span').text().trim() || 'Неизвестный адрес';

    // Парсинг всех изображений
    const imageSrc = [];
    $('.gallery__small-item').each((_, element) => {
      const imgSrc = $(element).attr('data-photo-url');
      if (imgSrc) {
        imageSrc.push(imgSrc.startsWith('http') ? imgSrc : `https:${imgSrc}`);
      }
    });

    // Парсинг дополнительных параметров из div.offer__info-item
    const additionalDetails = {};
    $('.offer__info-item').each((_, element) => {
      const key = $(element).attr('data-name')?.trim(); // Получаем значение атрибута data-name
      let value = $(element).text().trim().replace(/\s{2,}/g, ''); // Удаляем лишние пробелы и символы перевода строки
      // Убираем названия параметров из значений
      value = value.replace(/^(Город|Тип дома|Жилой комплекс|Год постройки|Площадь, м²|Санузел|Потолки|Этаж|Состояние)/, '').trim();
      if (key && value) {
        additionalDetails[key] = value;
      }
    });

    // Парсинг данных пользователя
    const user = {
      name: $('.owners__name').text().trim() || 'Неизвестный пользователь', // Имя
      phone: $('.offer__contacts-phones').text().trim() || 'Телефон не указан', // Телефон
      image:
        $('.owners__image img').attr('src') ||
        'https://example.com/user-default.jpg', // Аватарка
    };

    // Извлечение конкретных параметров
    const city = address.split(',')[0]?.trim() || 'Неизвестный город';
    const houseType = additionalDetails['flat.building'] || 'Неизвестный тип дома';
    const complex = additionalDetails['map.complex'] || 'Неизвестный жилой комплекс';
    const buildYear = additionalDetails['house.year'] || 'Не указан';
    const area = additionalDetails['live.square'] || 'Не указана';
    const bathroom = additionalDetails['flat.toilet'] || 'Не указан';
    const ceilingHeight = additionalDetails['ceiling'] || 'Не указаны';
    const floor = additionalDetails['flat.floor'] || 'Не указан';
    const condition = additionalDetails['flat.renovation'] || 'Не указан';

    const country = 'Казахстан';
    const region = 'Неизвестный регион';
    const roomCount = parseInt($('.offer__info .offer__parameters span:contains("комнат")').text().match(/\d+/)?.[0] || '0');
    const bathroomCount = 1; // Примерное значение
    const guestCount = roomCount * 2; // Логика: 2 гостя на комнату
    const latlng = { lat: 43.238949, lng: 76.889709 }; // Пример координат Алматы
    const reservations = []; // Данных о бронированиях нет

    // Возвращаем результат
    return {
      id,
      title,
      description,
      imageSrc, // Возвращаем массив всех изображений
      price,
      category: 'Vacation Home',
      location: {
        country,
        state: null,
        city,
        address,
        zipCode: null,
      },
      additionalDetails: {
        city,
        houseType,
        complex,
        buildYear,
        area,
        bathroom,
        ceilingHeight,
        floor,
        condition, // Обновленный параметр состояния
      },
      country,
      region,
      roomCount,
      guestCount,
      bathroomCount,
      latlng,
      user, // Добавляем объект пользователя
      reservations,
    };
  } catch (error) {
    throw new Error('Ошибка при парсинге данных: ' + error.message);
  }
};
