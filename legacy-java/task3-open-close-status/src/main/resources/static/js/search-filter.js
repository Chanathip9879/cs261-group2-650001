const restaurants = [
    {
        id: 1,
        name: "ครัวตามสั่งลุงหนวด",
        category: "อาหารตามสั่ง",
        location: "โรงอาหารกลาง",
        hours: "08:00 - 16:00",
        status: "open",
        description: "อาหารตามสั่ง ทำสดใหม่ทุกจาน",
        lat: 14.0734,
        lng: 100.6059,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "ข้าวกะเพราหมูสับ", price: 45, image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&w=400&q=80" },
            { name: "ข้าวผัด", price: 40, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80" },
            { name: "ข้าวไข่เจียว", price: 35, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: 2,
        name: "ก๋วยเตี๋ยวเรืออยุธยา",
        category: "ก๋วยเตี๋ยว",
        location: "ศูนย์อาหาร",
        hours: "09:00 - 17:00",
        status: "open",
        description: "ก๋วยเตี๋ยวเรือรสเข้มข้น",
        lat: 14.0728,
        lng: 100.6072,
        image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "ก๋วยเตี๋ยวเรือ", price: 45, image: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=400&q=80" },
            { name: "ก๋วยเตี๋ยวหมู", price: 50, image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=400&q=80" },
            { name: "ลูกชิ้นลวก", price: 30, image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: 3,
        name: "ข้าวมันไก่ประตูน้ำ",
        category: "ข้าว",
        location: "โรงอาหารกลาง",
        hours: "07:00 - 14:00",
        status: "closed",
        description: "ข้าวมันไก่พร้อมน้ำจิ้มสูตรพิเศษ",
        lat: 14.0719,
        lng: 100.6048,
        image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "ข้าวมันไก่ต้ม", price: 50, image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400&q=80" },
            { name: "ข้าวมันไก่ทอด", price: 55, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: 4,
        name: "ชาไข่มุก Sweet Tea",
        category: "เครื่องดื่ม",
        location: "อาคารเรียนรวม",
        hours: "09:00 - 18:00",
        status: "open",
        description: "เครื่องดื่มและชาไข่มุกหลากหลายรสชาติ",
        lat: 14.0741,
        lng: 100.6039,
        image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "ชาไทย", price: 35, image: "https://images.unsplash.com/photo-1571934811355-1c97c7c3d4b8?auto=format&fit=crop&w=400&q=80" },
            { name: "ชานมไข่มุก", price: 45, image: "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: 5,
        name: "บ้านขนมหวาน",
        category: "ของหวาน",
        location: "ศูนย์อาหาร",
        hours: "10:00 - 16:00",
        status: "closed",
        description: "ขนมหวานสำหรับเติมความสดชื่น",
        lat: 14.0730,
        lng: 100.6081,
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "บัวลอย", price: 30, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80" },
            { name: "น้ำแข็งไส", price: 35, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80" }
        ]
    },
    {
        id: 6,
        name: "ส้มตำแซ่บนัว",
        category: "อื่น ๆ",
        location: "โรงอาหารกลาง",
        hours: "10:00 - 19:00",
        status: "open",
        description: "อาหารอีสาน รสจัดจ้าน",
        lat: 14.0722,
        lng: 100.6065,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80",
        menu: [
            { name: "ส้มตำไทย", price: 40, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80" },
            { name: "ไก่ย่าง", price: 80, image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=400&q=80" }
        ]
    }
];

const searchInput = document.getElementById("searchInput");
const clearSearchButton = document.getElementById("clearSearch");
const categoryFilters = document.getElementById("categoryFilters");
const statusFilters = document.getElementById("statusFilters");
const restaurantList = document.getElementById("restaurantList");
const resultCount = document.getElementById("resultCount");
const emptyState = document.getElementById("emptyState");
const resetFiltersButton = document.getElementById("resetFilters");
const recommendList = document.getElementById("recommendList");
const homeSearch = document.getElementById("homeSearch");

let selectedCategory = "all";
let selectedStatus = "all";

const STATUS_API = "/api/check-status";
const statusById = {};

const STATUS_VIEW = {
    open: { text: "เปิดอยู่", cssClass: "open" },
    closed: { text: "ปิดแล้ว", cssClass: "closed" },
    temporarily: { text: "ปิดชั่วคราว", cssClass: "temporary" },
    loading: { text: "กำลังตรวจสอบ...", cssClass: "loading" },
    unknown: { text: "ไม่ทราบสถานะ", cssClass: "unknown" }
};

function mapApiStatus(status) {
    switch (status) {
        case "Open": return "open";
        case "Closed": return "closed";
        case "TemporarilyClosed": return "temporarily";
        default: return "unknown";
    }
}

function getStatusState(restaurant) {
    const fromApi = statusById[restaurant.id];
    if (fromApi) return fromApi.state;
    return restaurant.status === "open" || restaurant.status === "closed"
        ? restaurant.status
        : "unknown";
}

async function fetchRestaurantStatus(id) {
    const response = await fetch(`${STATUS_API}/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
    });
    if (response.status === 404) return "unknown";
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return mapApiStatus(data.status);
}

async function loadStatuses() {
    restaurants.forEach((restaurant) => {
        if (!statusById[restaurant.id]) {
            statusById[restaurant.id] = { state: "loading" };
        }
    });
    refreshStatusBadges();

    await Promise.all(restaurants.map(async (restaurant) => {
        try {
            statusById[restaurant.id] = { state: await fetchRestaurantStatus(restaurant.id) };
        } catch (error) {
            if (!statusById[restaurant.id] || statusById[restaurant.id].state === "loading") {
                statusById[restaurant.id] = { state: "unknown" };
            }
        }
    }));

    updateResults();
    renderRecommended();
}

function refreshStatusBadges() {
    document.querySelectorAll("[data-status-id]").forEach((badge) => {
        const state = statusById[badge.dataset.statusId]?.state ?? "unknown";
        const view = STATUS_VIEW[state] ?? STATUS_VIEW.unknown;
        badge.className = `badge ${view.cssClass}`;
        badge.textContent = view.text;
    });
}

function getFilteredRestaurants() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();

    return restaurants.filter((restaurant) => {
        const searchableText = [
            restaurant.name,
            restaurant.category,
            restaurant.location,
            restaurant.description,
            ...restaurant.menu.map((item) => item.name)
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(keyword);
        const matchesCategory =
            selectedCategory === "all" || restaurant.category === selectedCategory;
        const liveStatus = getStatusState(restaurant);
        const matchesStatus =
            selectedStatus === "all" ||
            (selectedStatus === "open" && liveStatus === "open") ||
            (selectedStatus === "closed" && liveStatus !== "open");

        return matchesSearch && matchesCategory && matchesStatus;
    });
}

function restaurantCard(restaurant) {
    const state = getStatusState(restaurant);
    const view = STATUS_VIEW[state] ?? STATUS_VIEW.unknown;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "resto-card";
    button.innerHTML = `
        <img src="${restaurant.image}" alt="${restaurant.name}">
        <div>
            <h3>${restaurant.name}</h3>
            <span class="badge ${view.cssClass}" data-status-id="${restaurant.id}">${view.text}</span>
            <p class="muted">${restaurant.location} · ${restaurant.hours} น.</p>
        </div>
        <svg class="heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21s-7-4.6-9.5-8.4C.4 9.4 2.2 5 6.2 5c2.1 0 3.4 1.2 4.3 2.4C11.4 6.2 12.7 5 14.8 5c4 0 5.8 4.4 3.7 7.6C19 16.4 12 21 12 21Z"/>
        </svg>
    `;
    button.addEventListener("click", () => window.openRestaurant?.(restaurant.id));
    return button;
}

function renderRestaurants(filteredRestaurants) {
    restaurantList.innerHTML = "";
    filteredRestaurants.forEach((restaurant) => {
        restaurantList.appendChild(restaurantCard(restaurant));
    });
    resultCount.textContent = `พบ ${filteredRestaurants.length} ร้าน`;
    emptyState.hidden = filteredRestaurants.length !== 0;
}

function renderRecommended() {
    if (!recommendList) return;
    recommendList.innerHTML = "";
    restaurants.slice(0, 4).forEach((restaurant) => {
        recommendList.appendChild(restaurantCard(restaurant));
    });
}

function updateResults() {
    if (!searchInput || !restaurantList) return;
    renderRestaurants(getFilteredRestaurants());
    clearSearchButton.classList.toggle("visible", searchInput.value.length > 0);
}

if (categoryFilters) {
    categoryFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) return;
        selectedCategory = button.dataset.category;
        categoryFilters.querySelectorAll("[data-category]").forEach((categoryButton) => {
            categoryButton.classList.toggle("active", categoryButton === button);
        });
        updateResults();
    });
}

if (statusFilters) {
    statusFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-status]");
        if (!button) return;
        selectedStatus = button.dataset.status;
        statusFilters.querySelectorAll("[data-status]").forEach((statusButton) => {
            statusButton.classList.toggle("active", statusButton === button);
        });
        updateResults();
    });
}

if (searchInput) searchInput.addEventListener("input", updateResults);

if (clearSearchButton) {
    clearSearchButton.addEventListener("click", () => {
        searchInput.value = "";
        updateResults();
        searchInput.focus();
    });
}

function resetFilters() {
    searchInput.value = "";
    selectedCategory = "all";
    selectedStatus = "all";
    categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
        button.classList.toggle("active", button.dataset.category === "all");
    });
    statusFilters.querySelectorAll("[data-status]").forEach((button) => {
        button.classList.toggle("active", button.dataset.status === "all");
    });
    updateResults();
}

if (resetFiltersButton) resetFiltersButton.addEventListener("click", resetFilters);

if (homeSearch) {
    homeSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            searchInput.value = homeSearch.value;
            window.showScreen?.("all");
            updateResults();
        }
    });
}

updateResults();
renderRecommended();
loadStatuses();
