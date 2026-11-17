// server/utils/decorateShops.js
// Attach today's hours + effective status to each shop.
// All shops are loaded in two queries (weekly rows + today's holidays), no per-shop request.

const db = require('../db');
const { bangkokParts, getEffectiveStatus } = require('./effectiveHours');

async function decorateShops(shops, now = new Date()) {
  const parts = bangkokParts(now);
  const hours = shops.length ? await db.listTodayHours(parts) : {};

  return shops.map((shop) => {
    const { pin, ...publicShop } = shop;
    const h = hours[shop.id] || { weekly: [], special_holidays: [] };
    const effectiveStatus = getEffectiveStatus(shop, h.weekly, h.special_holidays, now);
    return {
      ...publicShop,
      todayHours: h.weekly,
      todayHolidays: h.special_holidays,
      effectiveStatus,
      effectiveOpen: effectiveStatus.open,
    };
  });
}

module.exports = { decorateShops };
