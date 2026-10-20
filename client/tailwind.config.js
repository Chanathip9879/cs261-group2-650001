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
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
