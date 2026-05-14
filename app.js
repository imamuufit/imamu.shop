const CATEGORY_ORDER = [
  "サプリメント",
  "アパレル",
  "トレーニングギア",
  "チケット・回数券",
  "予約販売",
];

const STOCK_CLASSES = {
  in_stock: "is-in-stock",
  low_stock: "is-low-stock",
  sold_out: "is-sold-out",
  pre_order: "is-pre-order",
  ticket: "is-ticket",
};

const SUPPLEMENT_NOTICE =
  "サプリメントは食品です。疾病の診断、治療、予防を目的としたものではなく、体質や体調により合わない場合があります。";

const state = {
  store: {},
  categories: CATEGORY_ORDER,
  products: [],
  activeCategory: "すべて",
  query: "",
};

const elements = {
  categoryFilters: document.querySelector("#categoryFilters"),
  productGrid: document.querySelector("#productGrid"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  emptyState: document.querySelector("#emptyState"),
  modal: document.querySelector("#productModal"),
  modalImage: document.querySelector("#modalImage"),
  modalStatus: document.querySelector("#modalStatus"),
  modalCategory: document.querySelector("#modalCategory"),
  modalTitle: document.querySelector("#modalTitle"),
  modalPrice: document.querySelector("#modalPrice"),
  modalDescription: document.querySelector("#modalDescription"),
  modalRecommended: document.querySelector("#modalRecommended"),
  modalUsage: document.querySelector("#modalUsage"),
  modalNotes: document.querySelector("#modalNotes"),
  lineReserveButton: document.querySelector("#lineReserveButton"),
  paymentButton: document.querySelector("#paymentButton"),
};

let lastFocusedElement = null;

document.addEventListener("DOMContentLoaded", initStore);

async function initStore() {
  bindEvents();

  try {
    const response = await fetch("./products.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("商品データを読み込めませんでした。");
    }

    const data = await response.json();
    state.store = data.store || {};
    state.products = Array.isArray(data.products) ? data.products : [];
    state.categories = mergeCategories(data.categories, state.products);

    renderFilters();
    renderProducts();
  } catch (error) {
    elements.productGrid.innerHTML = "";
    elements.emptyState.hidden = false;
    elements.emptyState.textContent = "商品データの読み込みに失敗しました。";
    console.error(error);
  }
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  elements.categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;

    state.activeCategory = button.dataset.category;
    renderFilters();
    renderProducts();
  });

  elements.productGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-product-id]");
    if (!button) return;

    const product = state.products.find((item) => item.id === button.dataset.productId);
    if (product) openModal(product);
  });

  elements.modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) {
      closeModal();
    }
  });
}

function renderFilters() {
  const uniqueCategories = ["すべて", ...state.categories.filter(Boolean)];

  elements.categoryFilters.innerHTML = uniqueCategories
    .map((category) => {
      const isActive = category === state.activeCategory;
      return `
        <button
          class="filter-button ${isActive ? "is-active" : ""}"
          type="button"
          data-category="${escapeAttribute(category)}"
          aria-pressed="${isActive}"
        >
          ${escapeHtml(category)}
        </button>
      `;
    })
    .join("");
}

function mergeCategories(sourceCategories, products) {
  const configured = Array.isArray(sourceCategories) ? sourceCategories : CATEGORY_ORDER;
  const productCategories = products.map((product) => product.category).filter(Boolean);

  return [...new Set([...configured, ...productCategories])];
}

function renderProducts() {
  const products = getFilteredProducts();
  elements.resultCount.textContent = `${products.length}件`;
  elements.emptyState.hidden = products.length !== 0;

  elements.productGrid.innerHTML = products.map(renderProductCard).join("");
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const matchesCategory =
      state.activeCategory === "すべて" || product.category === state.activeCategory;
    const text = [
      product.name,
      product.category,
      product.shortDescription,
      product.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && text.includes(state.query);
  });
}

function renderProductCard(product) {
  const stockClass = STOCK_CLASSES[product.stockStatus] || STOCK_CLASSES.in_stock;

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}">
      </div>
      <div class="product-content">
        <div class="product-meta">
          <span class="category-pill">${escapeHtml(product.category)}</span>
          <span class="stock-badge ${stockClass}">${escapeHtml(product.stockLabel)}</span>
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-price">${formatPrice(product.price)}<span>${escapeHtml(state.store.taxNote || "税込")}</span></p>
        <p class="product-description">${escapeHtml(product.shortDescription)}</p>
        <button class="detail-button" type="button" data-product-id="${escapeAttribute(product.id)}">
          詳細を見る
        </button>
      </div>
    </article>
  `;
}

function openModal(product) {
  lastFocusedElement = document.activeElement;
  const stockClass = STOCK_CLASSES[product.stockStatus] || STOCK_CLASSES.in_stock;
  const notes = buildNotes(product);

  elements.modalImage.src = product.image;
  elements.modalImage.alt = product.name;
  elements.modalStatus.className = `stock-badge ${stockClass}`;
  elements.modalStatus.textContent = product.stockLabel;
  elements.modalCategory.textContent = product.category;
  elements.modalTitle.textContent = product.name;
  elements.modalPrice.textContent = `${formatPrice(product.price)} ${state.store.taxNote || "税込"}`;
  elements.modalDescription.textContent = product.description;
  elements.modalRecommended.innerHTML = renderList(product.recommendedFor || []);
  elements.modalUsage.textContent = product.usage || "商品ラベルまたは店頭案内をご確認ください。";
  elements.modalNotes.innerHTML = renderList(notes);

  setActionLink(elements.lineReserveButton, buildLineReserveUrl(product), "LINEで取り置きする");
  setActionLink(elements.paymentButton, product.paymentUrl, "外部決済リンクへ");

  elements.modal.hidden = false;
  document.body.classList.add("modal-open");
  elements.modal.querySelector(".modal-close").focus();
}

function closeModal() {
  elements.modal.hidden = true;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function buildNotes(product) {
  const notes = Array.isArray(product.notes) ? [...product.notes] : [];

  if (product.isSupplement && !notes.includes(SUPPLEMENT_NOTICE)) {
    notes.unshift(SUPPLEMENT_NOTICE);
  }

  return notes;
}

function buildLineReserveUrl(product) {
  const baseUrl = product.lineReserveUrl || state.store.lineReserveUrl;
  if (!baseUrl) return "";

  const message = [
    state.store.reserveMessagePrefix || "imamu. STORE 取り置き希望です。",
    `商品名：${product.name}`,
    `価格：${formatPrice(product.price)}`,
  ].join("\n");

  if (baseUrl.includes("{message}")) {
    return baseUrl.replace("{message}", encodeURIComponent(message));
  }

  return baseUrl;
}

function setActionLink(element, href, label) {
  element.textContent = href ? label : "準備中";
  element.href = href || "#";
  element.classList.toggle("is-disabled", !href);
  element.setAttribute("aria-disabled", String(!href));
  element.tabIndex = href ? 0 : -1;
}

function renderList(items) {
  if (!items.length) {
    return "<li>店頭でご相談ください。</li>";
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function formatPrice(price) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: state.store.currency || "JPY",
    maximumFractionDigits: 0,
  }).format(price || 0);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value);
}
