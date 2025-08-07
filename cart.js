let cart = [];
let products = [];

function loadCart() {
    cart = JSON.parse(localStorage.getItem('productSystem_cart') || '[]');
}
function saveCart() {
    localStorage.setItem('productSystem_cart', JSON.stringify(cart));
}
function loadProductsData() {
    products = loadProductsFromStorage();
}
function getProductById(id) {
    return products.find(p => p.id === id);
}
function renderCart() {
    const cartList = document.getElementById('cartList');
    cartList.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartList.innerHTML = `<div style="text-align:center;color:#888;padding:50px 0;">购物车为空</div>`;
        document.getElementById('cartTotalPrice').textContent = '￥0.00';
        return;
    }
    cart.forEach(item => {
        const product = getProductById(item.id);
        if (!product) return;
        total += product.price * item.qty;
        const image = product.image && product.image.startsWith('http')
            ? `<img src="${product.image}" alt="${product.productName}">`
            : `<div style="font-size:2rem;">🛒</div>`;
        cartList.innerHTML += `
            <div class="cart-item">
                <input type="checkbox" class="cart-checkbox" data-id="${item.id}">
                <div class="cart-image">${image}</div>
                <div class="cart-info">
                    <div class="cart-name">${product.productName}</div>
                    <div class="cart-desc">${product.description || ''}</div>
                    <div class="cart-price">￥${product.price}</div>
                </div>
                <div class="cart-qty">
                    数量：
                    <button type="button" class="qty-btn" data-id="${item.id}" data-action="decrease">-</button>
                    <input type="number" class="qty-input" min="1" max="99" value="${item.qty}" data-id="${item.id}">
                    <button type="button" class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
                </div>
                <button type="button" class="cart-remove" data-id="${item.id}" title="移除">🗑️</button>
            </div>
        `;
    });
    document.getElementById('cartTotalPrice').textContent = `￥${total.toFixed(2)}`;
}
function setupEvents() {
    document.getElementById('cartList').onclick = function(e) {
        // 移除商品
        if (e.target.classList.contains('cart-remove')) {
            const id = e.target.getAttribute('data-id');
            cart = cart.filter(item => item.id !== id);
            saveCart();
            renderCart();
        }
        // 数量加减
        if (e.target.classList.contains('qty-btn')) {
            const id = e.target.getAttribute('data-id');
            const action = e.target.getAttribute('data-action');
            const item = cart.find(i => i.id === id);
            if (item) {
                if (action === 'increase' && item.qty < 99) item.qty++;
                if (action === 'decrease' && item.qty > 1) item.qty--;
                saveCart();
                renderCart();
            }
        }
    };
    // 数量输入框
    document.getElementById('cartList').addEventListener('input', function(e) {
        if (e.target.classList.contains('qty-input')) {
            const id = e.target.getAttribute('data-id');
            let value = parseInt(e.target.value) || 1;
            if (value < 1) value = 1;
            if (value > 99) value = 99;
            const item = cart.find(i => i.id === id);
            if (item) {
                item.qty = value;
                saveCart();
                renderCart();
            }
        }
    });
    document.getElementById('selectAll').onchange = function() {
        document.querySelectorAll('.cart-checkbox').forEach(cb => cb.checked = this.checked);
    };
    document.getElementById('buySelected').onclick = function() {
        const selected = getSelectedIds();
        if (selected.length === 0) return alert('请选择商品');
        let total = 0;
        selected.forEach(id => {
            const item = cart.find(i => i.id === id);
            const product = getProductById(id);
            if (product && item) {
                total += product.price * item.qty;
                updateProductSales(id, (product.sales || 0) + item.qty);
            }
        });
        alert(`购买成功！共${selected.length}种商品，总价￥${total.toFixed(2)}`);
        cart = cart.filter(item => !selected.includes(item.id));
        saveCart();
        renderCart();
    };
    document.getElementById('deleteSelected').onclick = function() {
        const selected = getSelectedIds();
        if (selected.length === 0) return alert('请选择商品');
        cart = cart.filter(item => !selected.includes(item.id));
        saveCart();
        renderCart();
    };
}
function getSelectedIds() {
    return Array.from(document.querySelectorAll('.cart-checkbox:checked')).map(cb => cb.getAttribute('data-id'));
}

// 页面初始化
document.addEventListener('DOMContentLoaded', async function() {
    loadProductsData();
    loadCart();
    renderCart();
    setupEvents();
});