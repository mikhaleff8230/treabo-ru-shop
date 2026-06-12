'use strict';

const defaultCache = require('next-pwa/cache');

// Не оборачиваем urlPattern через замыкание: next-pwa сериализует функцию,
// и внешние переменные (например, orig) в service worker недоступны.
module.exports = defaultCache;
