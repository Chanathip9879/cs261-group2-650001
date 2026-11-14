/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tu: {
          red: '#C8102E',      // สีแดงเลือดหมู มธ.
          yellow: '#FFCD00',   // สีเหลืองทอง มธ.
        },
        canteen: {
          green: '#059669',    // สีเขียวกระจ่าง กรีนแคนทีน
          sci: '#0284C7',      // สีฟ้าวิทยาศาสตร์ คณะวิทย์
        },
        // Design tokens จาก Figma (Group2-CS261)
        brand: {
          DEFAULT: '#9d4300',  // สีหลัก น้ำตาลส้ม (ปุ่ม/ลิงก์/โลโก้)
          accent: '#f97316',   // สีส้มสด (CTA หลัก/แบนเนอร์)
          peach: '#ffdbca',    // พื้นหลังส้มอ่อน
          deep: '#341100',
        },
        surface: {
          DEFAULT: '#faf8ff',  // พื้นหลังหน้า
          low: '#f2f3ff',
          mid: '#eaedff',
          high: '#e2e7ff',
        },
        ink: {
          DEFAULT: '#131b2e',  // ตัวอักษรหลัก
          muted: '#584237',    // ตัวอักษรรอง
          navy: '#283044',     // ปุ่มสีเข้ม
        },
        ok: {
          DEFAULT: '#006c49',  // สถานะเปิด
          text: '#00714d',
          soft: '#6cf8bb',
        },
        danger: {
          DEFAULT: '#ba1a1a',  // สถานะปิด/ของหมด
          deep: '#93000a',
          soft: '#ffdad6',
          rose: '#b91a24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Prompt', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Prompt', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0px 1px 2px 0px rgba(0,0,0,0.05)',
        soft: '0px 1px 8px 0px rgba(0,0,0,0.04)',
        lift: '0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.1)',
        hero: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)',
        nav: '0px -2px 12px 0px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
