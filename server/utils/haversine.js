/**
 * คำนวณระยะทางระหว่างพิกัด 2 จุดบนพื้นโลกด้วยสูตร Haversine
 * @param {number} lat1 ละติจูดจุดที่ 1 (องศา)
 * @param {number} lon1 ลองจิจูดจุดที่ 1 (องศา)
 * @param {number} lat2 ละติจูดจุดที่ 2 (องศา)
 * @param {number} lon2 ลองจิจูดจุดที่ 2 (องศา)
 * @returns {{ distance_km: number, distance_m: number }}
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371;

  const toRadians = (degree) => (degree * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const radLat1 = toRadians(lat1);
  const radLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawKm = EARTH_RADIUS_KM * c;

  const distance_km = Math.round(rawKm * 1000) / 1000;
  const distance_m = Math.round(rawKm * 1000);

  return {
    distance_km,
    distance_m
  };
}

/**
 * ตรวจสอบความถูกต้องของค่าพิกัด lat และ lng
 * @param {any} rawLat
 * @param {any} rawLng
 * @returns {{ valid: boolean, lat?: number, lng?: number, error?: string }}
 */
function validateCoordinates(rawLat, rawLng) {
  if (
    rawLat === undefined ||
    rawLat === null ||
    String(rawLat).trim() === '' ||
    rawLng === undefined ||
    rawLng === null ||
    String(rawLng).trim() === ''
  ) {
    return {
      valid: false,
      error: 'กรุณาระบุพิกัด lat และ lng ให้ครบถ้วน'
    };
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      valid: false,
      error: 'พิกัด lat และ lng ต้องเป็นตัวเลขที่ถูกต้อง'
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: 'ค่า lat ต้องอยู่ระหว่าง -90 ถึง 90'
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: 'ค่า lng ต้องอยู่ระหว่าง -180 ถึง 180'
    };
  }

  return {
    valid: true,
    lat,
    lng
  };
}

module.exports = {
  calculateHaversineDistance,
  validateCoordinates
};