
const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');

// GET รายการเมนูของร้าน (ไม่ต้อง Login)
router.get('/:id/menus', menuController.getMenusByShop);

// PUT เปลี่ยนสถานะเมนู (ต้อง Login)
router.put(
  '/:id/menus/:menuId',
  authMiddleware,
  menuController.updateMenuSoldOut
);

module.exports = router;
