
/* ========================================
   1. Sample Restaurant Data
   ข้อมูลตัวอย่างสำหรับพัฒนา UI
======================================== */

const restaurants = [
    {
        id: 1,
        name: "ครัวตามสั่งลุงหนวด",
        category: "อาหารตามสั่ง",
        location: "โรงอาหารกลาง",
        hours: "08:00 - 16:00",
        status: "open",
        description: "อาหารตามสั่ง ทำสดใหม่ทุกจาน",
        menu: ["ข้าวกะเพราหมูสับ", "ข้าวผัด", "ข้าวไข่เจียว"],
        emoji: "🍳"
    },
    {
        id: 2,
        name: "ก๋วยเตี๋ยวเรืออยุธยา",
        category: "ก๋วยเตี๋ยว",
        location: "ศูนย์อาหาร",
        hours: "09:00 - 17:00",
        status: "open",
        description: "ก๋วยเตี๋ยวเรือรสเข้มข้น",
        menu: ["ก๋วยเตี๋ยวเรือ", "ก๋วยเตี๋ยวหมู", "ลูกชิ้น"],
        emoji: "🍜"
    },
    {
        id: 3,
        name: "ข้าวมันไก่ประตูน้ำ",
        category: "ข้าว",
        location: "โรงอาหารกลาง",
        hours: "07:00 - 14:00",
        status: "closed",
        description: "ข้าวมันไก่พร้อมน้ำจิ้มสูตรพิเศษ",
        menu: ["ข้าวมันไก่ต้ม", "ข้าวมันไก่ทอด"],
        emoji: "🍗"
    },
    {
        id: 4,
        name: "ชาไข่มุก Sweet Tea",
        category: "เครื่องดื่ม",
        location: "อาคารเรียนรวม",
        hours: "09:00 - 18:00",
        status: "open",
        description: "เครื่องดื่มและชาไข่มุกหลากหลายรสชาติ",
        menu: ["ชาไทย", "ชาเขียว", "โกโก้", "ชานมไข่มุก"],
        emoji: "🧋"
    },
    {
        id: 5,
        name: "บ้านขนมหวาน",
        category: "ของหวาน",
        location: "ศูนย์อาหาร",
        hours: "10:00 - 16:00",
        status: "closed",
        description: "ขนมหวานสำหรับเติมความสดชื่น",
        menu: ["บัวลอย", "ลอดช่อง", "น้ำแข็งไส"],
        emoji: "🍰"
    },
    {
        id: 6,
        name: "ส้มตำแซ่บนัว",
        category: "อื่น ๆ",
        location: "โรงอาหารกลาง",
        hours: "10:00 - 19:00",
        status: "open",
        description: "อาหารอีสาน รสจัดจ้าน",
        menu: ["ส้มตำไทย", "ส้มตำปูปลาร้า", "ไก่ย่าง"],
        emoji: "🥗"
    }
];


/* ========================================
   2. Get HTML Elements
======================================== */

const searchInput = document.getElementById("searchInput");
const clearSearchButton = document.getElementById("clearSearch");

const categoryFilters = document.getElementById("categoryFilters");
const statusFilters = document.getElementById("statusFilters");

const restaurantList = document.getElementById("restaurantList");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const resetFiltersButton = document.getElementById("resetFilters");


/* ========================================
   3. Filter State
======================================== */

let selectedCategory = "all";
let selectedStatus = "all";


/* ========================================
   4. Search and Filter Restaurants
======================================== */

function getFilteredRestaurants() {
    const keyword = searchInput.value.trim().toLowerCase();

    return restaurants.filter((restaurant) => {

        // ค้นหาชื่อร้าน หมวดหมู่ สถานที่ และเมนู
        const searchableText = [
            restaurant.name,
            restaurant.category,
            restaurant.location,
            restaurant.description,
            ...restaurant.menu
        ].join(" ").toLowerCase();

        const matchesSearch =
            searchableText.includes(keyword);

        // กรองตามหมวดหมู่
        const matchesCategory =
            selectedCategory === "all" ||
            restaurant.category === selectedCategory;

        // กรองตามสถานะร้าน
        const matchesStatus =
            selectedStatus === "all" ||
            restaurant.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
    });
}


/* ========================================
   5. Render Restaurant Cards
======================================== */

function renderRestaurants(filteredRestaurants) {

    restaurantList.innerHTML = "";

    filteredRestaurants.forEach((restaurant) => {

        const card = document.createElement("article");
        card.className = "restaurant-card";

        const statusText =
            restaurant.status === "open" ? "เปิดอยู่" : "ปิดแล้ว";

        const statusClass =
            restaurant.status === "open" ? "open" : "closed";

        // สร้างการ์ดจากข้อมูลร้านอาหาร
        card.innerHTML = `
            <div class="restaurant-image">
                <div class="restaurant-image-placeholder"
                     role="img"
                     aria-label="${restaurant.category}">
                    ${restaurant.emoji}
                </div>

                <span class="restaurant-status ${statusClass}">
                    ${statusText}
                </span>
            </div>

            <div class="restaurant-info">
                <h3 class="restaurant-name">
                    ${restaurant.name}
                </h3>

                <span class="restaurant-category">
                    ${restaurant.category}
                </span>

                <p class="restaurant-location">
                    📍 ${restaurant.location}
                </p>

                <p class="restaurant-hours">
                    🕒 ${restaurant.hours} น.
                </p>

                <p class="restaurant-description">
                    ${restaurant.description}
                </p>
            </div>
        `;

        restaurantList.appendChild(card);
    });

    // อัปเดตจำนวนผลลัพธ์
    resultCount.textContent =
        `พบ ${filteredRestaurants.length} ร้าน`;

    // แสดงข้อความเมื่อไม่พบร้าน
    emptyState.hidden = filteredRestaurants.length !== 0;
}


/* ========================================
   6. Update Results
======================================== */

function updateResults() {
    const filteredRestaurants = getFilteredRestaurants();

    renderRestaurants(filteredRestaurants);

    // แสดงปุ่มล้างคำค้นหาเมื่อมีข้อความ
    clearSearchButton.classList.toggle(
        "visible",
        searchInput.value.length > 0
    );
}


/* ========================================
   7. Category Filter Events
======================================== */

categoryFilters.addEventListener("click", (event) => {

    const button = event.target.closest("[data-category]");

    if (!button) return;

    selectedCategory = button.dataset.category;

    // เปลี่ยนสีปุ่มที่ถูกเลือก
    categoryFilters
        .querySelectorAll("[data-category]")
        .forEach((categoryButton) => {
            categoryButton.classList.toggle(
                "active",
                categoryButton === button
            );
        });

    updateResults();
});


/* ========================================
   8. Open / Closed Filter Events
======================================== */

statusFilters.addEventListener("click", (event) => {

    const button = event.target.closest("[data-status]");

    if (!button) return;

    selectedStatus = button.dataset.status;

    // เปลี่ยนสีปุ่มที่ถูกเลือก
    statusFilters
        .querySelectorAll("[data-status]")
        .forEach((statusButton) => {
            statusButton.classList.toggle(
                "active",
                statusButton === button
            );
        });

    updateResults();
});


/* ========================================
   9. Search Input Events
======================================== */

searchInput.addEventListener("input", updateResults);


/* ========================================
   10. Clear Search
======================================== */

clearSearchButton.addEventListener("click", () => {

    searchInput.value = "";

    updateResults();

    searchInput.focus();
});


/* ========================================
   11. Reset All Filters
======================================== */

function resetFilters() {

    searchInput.value = "";

    selectedCategory = "all";
    selectedStatus = "all";

    // เลือกหมวดหมู่ทั้งหมด
    categoryFilters
        .querySelectorAll("[data-category]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.category === "all"
            );
        });

    // เลือกสถานะทั้งหมด
    statusFilters
        .querySelectorAll("[data-status]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.status === "all"
            );
        });

    updateResults();
}

resetFiltersButton.addEventListener("click", resetFilters);


/* ========================================
   12. Initial Render
======================================== */

// แสดงร้านอาหารทั้งหมดเมื่อเปิดหน้าเว็บ
updateResults();
