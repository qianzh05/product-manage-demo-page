// 商品展示页面脚本
let products = [];
let currentProduct = null;

// 轮播图相关
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.dot');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function currentSlide(index) {
    currentSlideIndex = index - 1;
    showSlide(currentSlideIndex);
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    showSlide(currentSlideIndex);
}

// 自动轮播
setInterval(nextSlide, 4000);

// 加载商品数据（修复异步问题）
async function loadProducts() {
    try {
        console.log('🔄 开始加载商品数据...');
        
        // 等待初始化数据完成
        await initializeData();
        
        // 只获取已上架的商品
        products = getOnlineProducts();
        console.log('✅ 获取到已上架商品:', products.length, '个');
        
        if (products.length === 0) {
            showNoProductsMessage();
            return;
        }
        
        generateProducts();
    } catch (error) {
        console.error('❌ 加载商品数据失败:', error);
        showNoProductsMessage();
    }
}

// 显示无商品消息
function showNoProductsMessage() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 4rem; margin-bottom: 20px;">📦</div>
            <h3 style="margin-bottom: 10px; color: #333;">暂无上架商品</h3>
            <p>请前往 <a href="index.html" style="color: #667eea;">商品管理页面</a> 上架商品</p>
        </div>
    `;
}

// 生成商品卡片
function generateProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // 处理图片显示
        const imageContent = product.image && product.image.startsWith('http') 
            ? `<img src="${product.image}" alt="${product.productName}">` 
            : `<div style="font-size: 3rem;">${getProductIcon(product.productName)}</div>`;
        
        // 格式化价格
        const formattedPrice = product.price.toString().startsWith('￥') 
            ? product.price 
            : `￥${product.price}`;
        
        // 格式化销量
        const salesText = product.sales ? `已售${product.sales}件` : '新品上市';
        
        productCard.innerHTML = `
            <div class="product-image">${imageContent}</div>
            <div class="product-info">
                <div class="product-name">${product.productName}</div>
                <div class="product-description">${product.description || '暂无描述'}</div>
                <div class="product-price">${formattedPrice}</div>
                <div class="product-sales">${salesText}</div>
                <button class="add-to-cart-btn" onclick="openModal('${product.id}')">
                    加入购物车
                </button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// 根据商品名称获取图标
function getProductIcon(productName) {
    const iconMap = {
        '保温杯': '☕',
        '蓝牙耳机': '🎧',
        '耳机': '🎧',
        '充电宝': '🔋',
        '手环': '⌚',
        '手表': '⌚',
        '充电器': '📱',
        '音箱': '🔊',
        '鼠标': '🖱️',
        '键盘': '⌨️',
        '硬盘': '💾'
    };
    
    for (let key in iconMap) {
        if (productName.includes(key)) {
            return iconMap[key];
        }
    }
    return '📦'; // 默认图标
}

// 弹窗相关
function openModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    // 设置商品信息
    document.getElementById('modalProductName').textContent = currentProduct.productName;
    document.getElementById('modalProductDesc').textContent = currentProduct.description || '暂无描述';
    document.getElementById('modalWorkPlan').textContent = currentProduct.workPlan || '暂无工作计划';
    
    // 设置商品图片
    const modalImage = document.getElementById('modalProductImage');
    if (currentProduct.image && currentProduct.image.startsWith('http')) {
        modalImage.innerHTML = `<img src="${currentProduct.image}" alt="${currentProduct.productName}">`;
    } else {
        modalImage.innerHTML = getProductIcon(currentProduct.productName);
        modalImage.style.fontSize = '5rem';
    }
    
    // 重置数量
    document.getElementById('quantity').value = 1;
    
    // 显示弹窗
    document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    currentProduct = null;
}

// 数量控制
function changeQuantity(delta) {
    const quantityInput = document.getElementById('quantity');
    let currentValue = parseInt(quantityInput.value) || 1;
    currentValue += delta;
    if (currentValue < 1) currentValue = 1;
    if (currentValue > 99) currentValue = 99;
    quantityInput.value = currentValue;
}

// 加入购物车
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // 这里可以实现购物车逻辑
    // 目前只是显示提示信息
    alert(`已将 ${currentProduct.productName} x${quantity} 加入购物车！`);
    
    // 可以在这里更新销量
    updateProductSales(currentProduct.id, (currentProduct.sales || 0) + quantity);
    
    closeModal();
    
    // 重新加载商品数据以更新销量显示
    setTimeout(() => {
        loadProducts();
    }, 100);
}

// 立即购买
function buyNow() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const totalPrice = (parseFloat(currentProduct.price) * quantity).toFixed(2);
    
    // 这里可以跳转到支付页面
    // 目前只是显示提示信息
    alert(`购买成功！\n商品：${currentProduct.productName}\n数量：${quantity}件\n总价：￥${totalPrice}`);
    
    // 更新销量
    updateProductSales(currentProduct.id, (currentProduct.sales || 0) + quantity);
    
    closeModal();
    
    // 重新加载商品数据以更新销量显示
    setTimeout(() => {
        loadProducts();
    }, 100);
}

// 点击弹窗外部关闭
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // 监听localStorage变化，实现实时同步
    window.addEventListener('storage', function(e) {
        if (e.key === 'productSystem_products') {
            loadProducts();
        }
    });
    
    // 定期刷新数据（每30秒检查一次）
    setInterval(() => {
        const newProducts = getOnlineProducts();
        if (JSON.stringify(newProducts) !== JSON.stringify(products)) {
            loadProducts();
        }
    }, 30000);
});

// 处理数量输入框的输入验证
document.getElementById('quantity').addEventListener('input', function() {
    let value = parseInt(this.value);
    if (isNaN(value) || value < 1) {
        this.value = 1;
    } else if (value > 99) {
        this.value = 99;
    }
});

// 处理键盘事件
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// 防止表单默认提交行为
document.getElementById('quantity').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});

// 图片加载错误处理
function handleImageError(img) {
    img.parentElement.innerHTML = `<div style="font-size: 3rem;">${getProductIcon(img.alt)}</div>`;
}

// 添加图片错误处理
document.addEventListener('DOMContentLoaded', function() {
    // 为动态生成的图片添加错误处理
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.product-image')) {
            handleImageError(e.target);
        }
    }, true);
});