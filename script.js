// ===== 配置区 =====
const ANNOUNCEMENT = {
    text: '点击了解京东家政赠品规则，买商品送2小时家政服务！',
    url: 'https://mp.weixin.qq.com/s/LwWSPeKD_B_VJrPor9NuxA'
};

// 全局数据
let allData = null;
let currentSort = 'default';

// 页面加载
document.addEventListener('DOMContentLoaded', function() {
    setAnnouncement();
    loadProducts();
    bindSortSelect();
});

// 设置公告
function setAnnouncement() {
    var linkEl = document.getElementById('announcement-link');
    var textEl = document.getElementById('announcement-text');
    if (linkEl) linkEl.href = ANNOUNCEMENT.url;
    if (textEl) textEl.textContent = ANNOUNCEMENT.text;
}

// 绑定排序下拉框
function bindSortSelect() {
    var select = document.getElementById('sort-select');
    if (select) {
        select.addEventListener('change', function(e) {
            currentSort = e.target.value;
            if (allData) {
                var activeTab = document.querySelector('.tab.active');
                var catName = activeTab ? activeTab.getAttribute('data-cat') : 'all';
                renderProducts(allData, catName);
            }
        });
    }
}

// 加载产品数据
function loadProducts() {
    fetch('data.json?t=' + Date.now())
        .then(function(response) { return response.json(); })
        .then(function(data) {
            allData = data;
            renderTabs(data);
            renderProducts(data, 'all');
            updateTitle(data);
        })
        .catch(function(error) {
            console.error('加载数据失败:', error);
            document.getElementById('products-container').innerHTML =
                '<p class="loading">数据加载失败，请刷新重试</p>';
        });
}

// 更新页面标题
function updateTitle(data) {
    var el = document.getElementById('page-title');
    if (el && data.date) {
        el.textContent = data.date + ' 哆啦线报';
    }
}

// 渲染分类标签（带数量）
function renderTabs(data) {
    var tabsContainer = document.getElementById('category-tabs');
    if (!tabsContainer || !data.categories) return;

    tabsContainer.innerHTML = '';

    var allProducts = [];
    data.categories.forEach(function(cat) {
        if (cat.products) allProducts = allProducts.concat(cat.products);
    });

    // 全部标签
    var tabAll = document.createElement('div');
    tabAll.className = 'tab active';
    tabAll.setAttribute('data-cat', 'all');
    tabAll.textContent = '全部 (' + allProducts.length + ')';
    tabsContainer.appendChild(tabAll);

    // 超市返卡标签（从所有商品中筛选 badge 含超市返卡的）
    var cardProducts = allProducts.filter(function(p) {
        return p.badge && p.badge.indexOf('超市返卡') !== -1;
    });
    if (cardProducts.length > 0) {
        var tabCard = document.createElement('div');
        tabCard.className = 'tab';
        tabCard.setAttribute('data-cat', '超市返卡');
        tabCard.textContent = '超市返卡 (' + cardProducts.length + ')';
        tabsContainer.appendChild(tabCard);
    }

    data.categories.forEach(function(cat) {
        var count = cat.products ? cat.products.length : 0;
        var tab = document.createElement('div');
        tab.className = 'tab';
        tab.setAttribute('data-cat', cat.name);
        tab.textContent = cat.name + ' (' + count + ')';
        tabsContainer.appendChild(tab);
    });

    // 绑定点击事件
    tabsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab')) {
            var allTabs = tabsContainer.querySelectorAll('.tab');
            allTabs.forEach(function(t) { t.classList.remove('active'); });
            e.target.classList.add('active');
            var catName = e.target.getAttribute('data-cat');
            renderProducts(allData, catName);
        }
    });
}

// 排序函数
function sortProducts(products) {
    var sorted = products.slice(); // 复制数组
    
    if (currentSort === 'price-asc') {
        sorted.sort(function(a, b) {
            return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        });
    } else if (currentSort === 'price-desc') {
        sorted.sort(function(a, b) {
            return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        });
    } else if (currentSort === 'name') {
        sorted.sort(function(a, b) {
            return (a.name || '').localeCompare(b.name || '', 'zh-CN');
        });
    }
    // default: 保持原顺序
    
    return sorted;
}

// 渲染商品列表
function renderProducts(data, categoryName) {
    var container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';

    var products = [];
    if (categoryName === 'all') {
        data.categories.forEach(function(cat) {
            if (cat.products) {
                cat.products.forEach(function(p) {
                    products.push(p);
                });
            }
        });
    } else if (categoryName === '超市返卡') {
        // 按标签筛选
        data.categories.forEach(function(cat) {
            if (cat.products) {
                cat.products.forEach(function(p) {
                    if (p.badge && p.badge.indexOf('超市返卡') !== -1) {
                        products.push(p);
                    }
                });
            }
        });
    } else {
        data.categories.forEach(function(cat) {
            if (cat.name === categoryName && cat.products) {
                products = cat.products;
            }
        });
    }

    if (products.length === 0) {
        container.innerHTML = '<p class="loading">暂无商品</p>';
        return;
    }

    // 排序
    products = sortProducts(products);

    products.forEach(function(product) {
        var card = document.createElement('a');
        card.className = 'product-card';
        card.href = product.productUrl || '#';
        card.target = '_blank';
        card.rel = 'noopener';

        // 商品图片
        var imgDiv = document.createElement('div');
        imgDiv.className = 'product-image';
        var img = document.createElement('img');
        img.src = product.imageUrl || '';
        img.alt = product.name || '';
        imgDiv.appendChild(img);

        // 商品信息
        var infoWrapper = document.createElement('div');
        infoWrapper.className = 'product-info-wrapper';

        // 促销标签（无标签时显示"赠2小时家政"）
        var badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = product.badge && product.badge.trim() ? product.badge : '下单注意赠品';
        infoWrapper.appendChild(badge);

        var name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = product.name;
        infoWrapper.appendChild(name);

        var info = document.createElement('div');
        info.className = 'product-info';
        info.textContent = product.bookingInfo || '';
        infoWrapper.appendChild(info);

        // 价格行（包含价格 + 赠品数量）
        var priceRow = document.createElement('div');
        priceRow.className = 'price-row';

        var priceWrapper = document.createElement('div');
        priceWrapper.className = 'price-wrapper';

        var priceLabel = document.createElement('span');
        priceLabel.className = 'price-label';
        priceLabel.textContent = '京东价';

        var priceValue = document.createElement('span');
        priceValue.className = 'price-value';
        priceValue.textContent = '¥' + product.price;

        priceWrapper.appendChild(priceLabel);
        priceWrapper.appendChild(priceValue);
        priceRow.appendChild(priceWrapper);

        // 赠品数量（右下角）
        if (product.giftCount) {
            var giftBadge = document.createElement('span');
            giftBadge.className = 'gift-badge';
            giftBadge.textContent = '家政券：' + product.giftCount;
            priceRow.appendChild(giftBadge);
        } else if (product.gift) {
            // 兼容旧数据：从 gift 字段提取数字
            var giftText = product.gift;
            var giftMatch = giftText.match(/\d+/);
            var giftCount = giftMatch ? giftMatch[0] : '1';
            var giftBadge = document.createElement('span');
            giftBadge.className = 'gift-badge';
            giftBadge.textContent = '家政券：' + giftCount;
            priceRow.appendChild(giftBadge);
        }

        infoWrapper.appendChild(priceRow);

        card.appendChild(imgDiv);
        card.appendChild(infoWrapper);
        container.appendChild(card);
    });
}
