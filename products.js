let products = [];
let currentProduct = null;

// 定制相关变量
let customizeProcesses = {
    drilling: { 
        name: '钻孔', 
        enabled: false, 
        priority: 1,
        parameters: { time: 5.0, count: 3 }
    },
    assembly: { 
        name: '装配', 
        enabled: false, 
        priority: 2,
        parameters: { time: 10.0, count: 1 }
    },
    weighing: { 
        name: '称重', 
        enabled: false, 
        priority: 3,
        parameters: { weight: 2.0 } 
    },
    coding: { 
        name: '喷码', 
        enabled: false, 
        priority: 4,
        parameters: { time: 3.0, count: 1 }
    }
};

let customizePartSelection = {
    left: '',
    right: ''
};

let customizedWorkPlan = null; 

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

// 加载商品数据
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


// 弹窗相关
function openModal(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    // 设置商品信息
    document.getElementById('modalProductName').textContent = currentProduct.productName;
    document.getElementById('modalProductDesc').textContent = currentProduct.description || '暂无描述';
    
    // 如果有定制的工作计划，显示定制计划；否则显示原计划
    const workPlanToShow = customizedWorkPlan || currentProduct.workPlan || '暂无工作计划';
    document.getElementById('modalWorkPlan').textContent = workPlanToShow;
    
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
    
    // 显示包含定制信息的提示
    let message = `已将 ${currentProduct.productName} x${quantity} 加入购物车！`;
    if (customizedWorkPlan) {
        message += '\n\n定制工作计划：\n' + customizedWorkPlan;
    }
    alert(message);
    
    // 更新销量
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
    
    // 显示包含定制信息的购买确认
    let message = `购买成功！\n商品：${currentProduct.productName}\n数量：${quantity}件\n总价：￥${totalPrice}`;
    if (customizedWorkPlan) {
        message += '\n\n您的定制工作计划：\n' + customizedWorkPlan;
    }
    alert(message);
    
    // 更新销量
    updateProductSales(currentProduct.id, (currentProduct.sales || 0) + quantity);
    
    closeModal();
    
    // 重新加载商品数据以更新销量显示
    setTimeout(() => {
        loadProducts();
    }, 100);
}

// ===== 定制功能相关函数 =====

// 打开定制弹窗
function openCustomizeModal() {
    resetCustomizeProcesses();
    resetCustomizePartSelection();
    document.getElementById('customizeModal').classList.add('show');
}

// 关闭定制弹窗
function closeCustomizeModal() {
    document.getElementById('customizeModal').classList.remove('show');
}

// 更新定制零件选择
function updateCustomizePartSelection(side, value) {
    customizePartSelection[side] = value;
    updateCustomizeUI();
}

// 生成定制工作计划名称
function generateCustomizePlanName() {
    const enabledProcesses = Object.keys(customizeProcesses)
        .filter(key => customizeProcesses[key].enabled)
        .map(key => ({ key: key, process: customizeProcesses[key] }))
        .sort((a, b) => a.process.priority - b.process.priority)
        .map(item => item.process.name);
    
    return enabledProcesses.length > 0 ? enabledProcesses.join('-') : '未配置工序';
}

// 验证定制优先级
function validateCustomizePriorities() {
    const enabledProcesses = Object.keys(customizeProcesses)
        .filter(key => customizeProcesses[key].enabled)
        .map(key => customizeProcesses[key].priority);
    
    const uniquePriorities = enabledProcesses.filter((value, index, self) => 
        self.indexOf(value) === index
    );
    
    return enabledProcesses.length === uniquePriorities.length;
}

// 更新定制参数
function updateCustomizeParameter(processKey, paramType, value) {
    if (!customizeProcesses[processKey].parameters) {
        customizeProcesses[processKey].parameters = {};
    }
    
    let numValue = parseFloat(value);
    
    // 验证输入值
    if (isNaN(numValue) || numValue < 0) {
        numValue = 0;
    }
    
    if (paramType === 'count' && numValue < 1) {
        numValue = 1;
    }
    
    customizeProcesses[processKey].parameters[paramType] = numValue;
}

// 更新定制优先级
function updateCustomizePriority(processKey, newPriority) {
    const priority = parseInt(newPriority);
    if (priority < 1 || priority > 4) return;
    
    customizeProcesses[processKey].priority = priority;
    updateCustomizeUI();
}

// 更新定制UI
function updateCustomizeUI() {
    // 更新预览名称
    document.getElementById('customizePreviewName').textContent = generateCustomizePlanName();
    
    // 更新错误提示
    const errorSection = document.getElementById('customizeErrorSection');
    if (!validateCustomizePriorities()) {
        document.getElementById('customizeErrorTitle').textContent = '优先级冲突';
        document.getElementById('customizeErrorMessage').textContent = '每个启用的工序必须有不同的优先级';
        errorSection.style.display = 'block';
    } else {
        errorSection.style.display = 'none';
    }

    // 更新喷码工序状态
    const codingToggle = document.getElementById('customizeCodingToggle');
    const codingNote = document.getElementById('customizeCodingNote');
    
    if (customizeProcesses.assembly.enabled) {
        codingToggle.classList.remove('disabled');
        codingNote.style.display = 'none';
    } else {
        codingToggle.classList.add('disabled');
        codingToggle.classList.remove('active');
        customizeProcesses.coding.enabled = false;
        hideCustomizeProcessRows('coding');
        codingNote.style.display = 'inline';
    }
}

// 显示定制工序参数行
function showCustomizeProcessRows(processKey) {
    if (processKey === 'weighing') {
        document.getElementById('customizeWeight').style.display = 'flex';
        document.getElementById('customizeWeighingPriority').style.display = 'flex';
    } else {
        const processName = processKey.charAt(0).toUpperCase() + processKey.slice(1);
        const timeElement = document.getElementById('customize' + processName + 'Time');
        const countElement = document.getElementById('customize' + processName + 'Count');
        const priorityElement = document.getElementById('customize' + processName + 'Priority');
        
        if (timeElement) timeElement.style.display = 'flex';
        if (countElement) countElement.style.display = 'flex';
        if (priorityElement) priorityElement.style.display = 'flex';
    }
}

// 隐藏定制工序参数行
function hideCustomizeProcessRows(processKey) {
    if (processKey === 'weighing') {
        document.getElementById('customizeWeight').style.display = 'none';
        document.getElementById('customizeWeighingPriority').style.display = 'none';
    } else {
        const processName = processKey.charAt(0).toUpperCase() + processKey.slice(1);
        const timeElement = document.getElementById('customize' + processName + 'Time');
        const countElement = document.getElementById('customize' + processName + 'Count');
        const priorityElement = document.getElementById('customize' + processName + 'Priority');
        
        if (timeElement) timeElement.style.display = 'none';
        if (countElement) countElement.style.display = 'none';
        if (priorityElement) priorityElement.style.display = 'none';
    }
}

// 切换定制工序状态
function toggleCustomizeProcess(processKey) {
    if (processKey === 'coding' && !customizeProcesses.assembly.enabled) {
        return;
    }

    // 如果是关闭装配，同时关闭喷码
    if (processKey === 'assembly' && customizeProcesses.assembly.enabled) {
        customizeProcesses.coding.enabled = false;
        document.getElementById('customizeCodingToggle').classList.remove('active');
        hideCustomizeProcessRows('coding');
    }

    customizeProcesses[processKey].enabled = !customizeProcesses[processKey].enabled;
    
    // 更新切换按钮状态
    const processName = processKey.charAt(0).toUpperCase() + processKey.slice(1);
    const toggle = document.getElementById('customize' + processName + 'Toggle');
    
    if (customizeProcesses[processKey].enabled) {
        toggle.classList.add('active');
        showCustomizeProcessRows(processKey);
    } else {
        toggle.classList.remove('active');
        hideCustomizeProcessRows(processKey);
    }

    updateCustomizeUI();
}

// 确认定制
function confirmCustomize() {
    if (!validateCustomizePriorities()) {
        alert('每个工序的优先级必须不同！');
        return;
    }

    const enabledProcesses = Object.keys(customizeProcesses).filter(key =>
        customizeProcesses[key].enabled
    );
    
    if (enabledProcesses.length === 0) {
        alert('至少需要启用一个工序！');
        return;
    }

    if (customizeProcesses.coding.enabled && !customizeProcesses.assembly.enabled) {
        alert('喷码工序需要装配工序启用后才能启动！');
        return;
    }

    if (!customizePartSelection.left || !customizePartSelection.right) {
        alert('请将两个零件都选择后再完成定制！');
        return;
    }

    // 生成详细的工作计划描述
    const planName = generateCustomizePlanName();
    let planDetails = planName + '\n';
    
    // 按优先级排序添加详细参数
    const sortedProcesses = Object.keys(customizeProcesses)
        .filter(key => customizeProcesses[key].enabled)
        .map(key => ({ key, process: customizeProcesses[key] }))
        .sort((a, b) => a.process.priority - b.process.priority);
    
    sortedProcesses.forEach(({ key, process }) => {
        if (key === 'weighing') {
            planDetails += `设定重量：${process.parameters.weight}g\n`;
        } else {
            if (process.parameters.time) {
                planDetails += `${process.name}时间：${process.parameters.time}S\n`;
            }
            if (process.parameters.count) {
                planDetails += `${process.name}次数：${process.parameters.count}次\n`;
            }
        }
    });

    // 添加零件信息
    if (customizePartSelection.left || customizePartSelection.right) {
        planDetails += '选配零件：';
        if (customizePartSelection.left) {
            const leftPartText = document.querySelector('#customizeLeftPart option:checked').textContent;
            planDetails += leftPartText;
        }
        if (customizePartSelection.right) {
            const rightPartText = document.querySelector('#customizeRightPart option:checked').textContent;
            if (customizePartSelection.left) planDetails += ' + ';
            planDetails += rightPartText;
        }
    }

    // 保存定制的工作计划
    customizedWorkPlan = planDetails;
    
    // 关闭定制弹窗
    closeCustomizeModal();
    
    // 更新当前商品弹窗中的工作计划显示
    if (document.getElementById('modalOverlay').classList.contains('show')) {
        document.getElementById('modalWorkPlan').textContent = customizedWorkPlan;
    }
    
    alert('定制完成！您的定制工作计划已保存。');
}

// 重置定制零件选择
function resetCustomizePartSelection() {
    customizePartSelection = {
        left: '',
        right: ''
    };
    document.getElementById('customizeLeftPart').value = '';
    document.getElementById('customizeRightPart').value = '';
}

// 重置定制工序状态
function resetCustomizeProcesses() {
    customizeProcesses = {
        drilling: { 
            name: '钻孔', 
            enabled: false, 
            priority: 1,
            parameters: { time: 5.0, count: 3 }
        },
        assembly: { 
            name: '装配', 
            enabled: false, 
            priority: 2,
            parameters: { time: 10.0, count: 1 }
        },
        weighing: { 
            name: '称重', 
            enabled: false, 
            priority: 3,
            parameters: { weight: 2.0 }  
        },
        coding: { 
            name: '喷码', 
            enabled: false, 
            priority: 4,
            parameters: { time: 3.0, count: 1 }
        }
    };

    // 重置UI
    const processKeys = Object.keys(customizeProcesses);
    processKeys.forEach(key => {
        const processName = key.charAt(0).toUpperCase() + key.slice(1);
        const toggle = document.getElementById('customize' + processName + 'Toggle');
        
        if (toggle) {
            toggle.classList.remove('active');
            hideCustomizeProcessRows(key);
        }
        
        // 重置参数输入值
        if (key === 'weighing') {
            const weightInput = document.querySelector('#customizeWeight input');
            if (weightInput) weightInput.value = customizeProcesses[key].parameters.weight;
            const priorityInput = document.querySelector('#customizeWeighingPriority input');
            if (priorityInput) priorityInput.value = customizeProcesses[key].priority;
        } else {
            const timeInput = document.querySelector('#customize' + processName + 'Time input');
            const countInput = document.querySelector('#customize' + processName + 'Count input');
            const priorityInput = document.querySelector('#customize' + processName + 'Priority input');
            
            if (timeInput) timeInput.value = customizeProcesses[key].parameters.time;
            if (countInput) timeInput.value = customizeProcesses[key].parameters.count;
            if (priorityInput) priorityInput.value = customizeProcesses[key].priority;
        }
    });

    updateCustomizeUI();
}

// 事件监听器
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

    // 为动态生成的图片添加错误处理
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.product-image')) {
            handleImageError(e.target);
        }
    }, true);
});

// 点击弹窗外部关闭
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
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
        closeCustomizeModal();
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

// 点击定制弹窗外部关闭
document.addEventListener('DOMContentLoaded', function() {
    const customizeModal = document.getElementById('customizeModal');
    if (customizeModal) {
        customizeModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeCustomizeModal();
            }
        });
    }
});