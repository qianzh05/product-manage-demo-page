// 优化版共享数据管理
const STORAGE_KEY = 'productSystem_products';
const ORIGINAL_DATA_KEY = 'productSystem_originalData';
const DATA_FILE_PATH = './data/products.json';

// 数据状态管理
let dataMode = 'hybrid'; // 'json-only' | 'hybrid' | 'local-only'

// 从JSON文件加载产品数据
async function loadProductsFromFile() {
    try {
        console.log('📁 从JSON文件加载数据:', DATA_FILE_PATH);
        const response = await fetch(DATA_FILE_PATH);
        
        if (!response.ok) {
            console.error(`❌ 文件加载失败: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ JSON文件加载成功:', data);
        
        if (data.products && Array.isArray(data.products)) {
            console.log('📦 找到产品数据:', data.products.length, '个产品');
            return data.products;
        } else {
            console.error('❌ JSON格式错误: 缺少products数组');
            return null;
        }
    } catch (error) {
        console.error('❌ 从文件加载数据失败:', error);
        return null;
    }
}

// 初始化数据 - 智能选择数据源
async function initializeData() {
    console.log('🔄 开始初始化数据...');
    
    try {
        // 1. 尝试从JSON文件加载
        const fileProducts = await loadProductsFromFile();
        if (fileProducts && fileProducts.length > 0) {
            console.log('✅ 使用JSON文件作为数据源');
            
            // 保存原始数据副本
            localStorage.setItem(ORIGINAL_DATA_KEY, JSON.stringify(fileProducts));
            
            // 检查是否有本地修改
            const localProducts = loadProductsFromStorage();
            if (localProducts.length > 0) {
                console.log('🔄 发现本地修改，合并数据...');
                const mergedProducts = mergeProductData(fileProducts, localProducts);
                saveProductsToStorage(mergedProducts);
                return mergedProducts;
            } else {
                // 首次加载，直接使用JSON数据
                const validatedProducts = fileProducts.map(validateProduct);
                saveProductsToStorage(validatedProducts);
                return validatedProducts;
            }
        }
    } catch (error) {
        console.warn('⚠️ JSON文件加载失败，使用本地数据:', error);
    }
    
    // 2. 从localStorage加载
    const storageProducts = loadProductsFromStorage();
    if (storageProducts.length > 0) {
        console.log('✅ 使用localStorage数据');
        return storageProducts;
    }
    
    // 3. 生成示例数据
    console.log('⚠️ 生成示例数据');
    const sampleProducts = generateSampleData();
    saveProductsToStorage(sampleProducts);
    return sampleProducts;
}

// 合并JSON数据和本地修改
function mergeProductData(jsonProducts, localProducts) {
    console.log('🔀 合并数据中...');
    
    // 创建本地产品的映射
    const localMap = new Map();
    localProducts.forEach(product => {
        localMap.set(product.id, product);
    });
    
    // 合并数据：优先使用JSON的基础信息，保留本地的状态修改
    const mergedProducts = jsonProducts.map(jsonProduct => {
        const localProduct = localMap.get(jsonProduct.id);
        
        if (localProduct) {
            // 存在本地修改，合并数据
            return {
                ...jsonProduct,  // JSON的基础信息（名称、描述、价格等）
                status: localProduct.status,  // 本地的上架状态
                sales: localProduct.sales || jsonProduct.sales || 0,  // 累计销量
                // 保留其他可能的本地修改
                customFields: localProduct.customFields || {}
            };
        } else {
            // 新产品，直接使用JSON数据
            return {
                ...jsonProduct,
                sales: jsonProduct.sales || 0
            };
        }
    });
    
    // 添加本地新增的产品（如果有）
    localProducts.forEach(localProduct => {
        const existsInJson = jsonProducts.some(jp => jp.id === localProduct.id);
        if (!existsInJson) {
            mergedProducts.push(localProduct);
        }
    });
    
    console.log('✅ 数据合并完成:', mergedProducts.length, '个产品');
    return mergedProducts;
}

// 保存产品数据到localStorage
function saveProductsToStorage(products) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log('💾 数据已保存到localStorage');
        return true;
    } catch (error) {
        console.error('❌ 保存数据失败:', error);
        return false;
    }
}

// 从localStorage读取产品数据
function loadProductsFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('❌ 读取数据失败:', error);
        return [];
    }
}

// 获取已上架的产品（用于商品展示页面）
function getOnlineProducts() {
    const allProducts = loadProductsFromStorage();
    return allProducts.filter(product => product.status === true);
}

// 更新产品销量
function updateProductSales(productId, newSales) {
    const products = loadProductsFromStorage();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].sales = newSales;
        saveProductsToStorage(products);
        return true;
    }
    return false;
}

// 重置到原始JSON数据
async function resetToOriginalData() {
    try {
        const originalData = localStorage.getItem(ORIGINAL_DATA_KEY);
        if (originalData) {
            const products = JSON.parse(originalData);
            saveProductsToStorage(products);
            console.log('🔄 已重置到原始JSON数据');
            return products;
        } else {
            // 重新从文件加载
            const fileProducts = await loadProductsFromFile();
            if (fileProducts) {
                saveProductsToStorage(fileProducts);
                localStorage.setItem(ORIGINAL_DATA_KEY, JSON.stringify(fileProducts));
                console.log('🔄 已从文件重新加载原始数据');
                return fileProducts;
            }
        }
    } catch (error) {
        console.error('❌ 重置数据失败:', error);
    }
    return null;
}

// 导出当前数据为JSON格式
function exportCurrentDataAsJSON() {
    const products = loadProductsFromStorage();
    const exportData = {
        products: products,
        categories: [...new Set(products.map(p => p.category))],
        exportDate: new Date().toISOString(),
        totalProducts: products.length,
        onlineProducts: products.filter(p => p.status).length,
        dataSource: 'localStorage',
        note: '此数据包含用户的本地修改（上架状态、销量等）'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `products_modified_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('📥 数据导出完成');
}

// 导入JSON数据文件
function importJSONData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products && Array.isArray(data.products)) {
                    const validatedProducts = data.products.map(validateProduct);
                    saveProductsToStorage(validatedProducts);
                    
                    // 触发页面更新
                    if (typeof renderTable === 'function') renderTable();
                    if (typeof loadProducts === 'function') loadProducts();
                    
                    alert(`成功导入 ${validatedProducts.length} 个产品！`);
                    console.log('📥 JSON数据导入成功');
                } else {
                    alert('文件格式错误：缺少products数组');
                }
            } catch (error) {
                alert('文件解析失败：' + error.message);
                console.error('❌ JSON导入失败:', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// 数据管理工具面板
function createDataManagementPanel() {
    const panel = document.createElement('div');
    panel.id = 'dataManagementPanel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 20px;
        z-index: 1500;
        min-width: 250px;
        display: none;
    `;
    
    panel.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">数据管理</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="exportCurrentDataAsJSON()" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                📥 导出当前数据
            </button>
            <button onclick="importJSONData()" style="padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
                📤 导入JSON数据
            </button>
            <button onclick="resetToOriginalData().then(() => { if(typeof renderTable === 'function') renderTable(); if(typeof loadProducts === 'function') loadProducts(); })" style="padding: 8px 12px; border: 1px solid #orange; border-radius: 6px; cursor: pointer;">
                🔄 重置到原始数据
            </button>
            <button onclick="document.getElementById('dataManagementPanel').style.display='none'" style="padding: 8px 12px; border: 1px solid #999; border-radius: 6px; cursor: pointer;">
                关闭
            </button>
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #666;">
            <p><strong>说明：</strong></p>
            <p>• 导出：保存当前所有修改</p>
            <p>• 导入：替换为新的JSON数据</p>
            <p>• 重置：恢复到原始JSON状态</p>
        </div>
    `;
    
    document.body.appendChild(panel);
    return panel;
}

// 显示数据管理面板
function showDataManagementPanel() {
    let panel = document.getElementById('dataManagementPanel');
    if (!panel) {
        panel = createDataManagementPanel();
    }
    panel.style.display = 'block';
}

// 其他保持不变的函数...
function generateSampleData(count = 10) {
    // ... 保持原有代码
    const descriptions = [
        '高性能工业控制器，适用于自动化生产线，支持多种通信协议',
        '智能传感器模块，支持多种数据采集，实时监控生产状态',
        '精密加工零部件，符合工业4.0标准，高精度制造工艺',
        '工业级通信设备，稳定可面，支持远程监控和数据传输',
        '自动化控制系统核心组件，模块化设计，易于维护升级'
    ];
    
    const workPlans = [
        '第一装配 - 对箍 - 蛋芯\n加热时间：5S\n加热次数：3次\n装配时间：25S\n装配/冷却：1次',
        '组装外壳 - 安装芯片 - 测试\n测试时间：3S\n测试次数：2次\n组装时间：18S\n质检时间：10S',
        '电池装配 - 电路连接 - 外壳组装\n充电测试：10S\n电路检测：5次\n组装时间：30S\n安全检测：15S',
        '传感器安装 - 表带装配 - 系统调试\n调试时间：8S\n测试次数：4次\n装配时间：20S\n防水测试：12S',
        '线圈安装 - 电路调试 - 外壳封装\n功率测试：6S\n兼容测试：3次\n装配时间：15S\n安全检测：8S'
    ];
    
    const productNames = [
        '智能保温杯', '无线蓝牙耳机', '便携充电宝', '运动手环', '无线充电器',
        '蓝牙音箱', '智能手表', '移动硬盘', '无线鼠标', '机械键盘'
    ];
    
    const categories = ['生活用品', '数码产品', '智能穿戴', '存储设备', '办公用品'];
    
    const sampleProducts = [];
    
    for (let i = 1; i <= count; i++) {
        const randomPrice = (Math.random() * 800 + 100).toFixed(2);
        const randomSales = Math.floor(Math.random() * 5000 + 100);
        const nameIndex = (i - 1) % productNames.length;
        const descIndex = (i - 1) % descriptions.length;
        const workPlanIndex = (i - 1) % workPlans.length;
        const categoryIndex = Math.floor(Math.random() * categories.length);
        
        sampleProducts.push({
            id: 'P' + String(i).padStart(3, '0'),
            productName: productNames[nameIndex] + (i > 10 ? ` ${Math.floor(i/10)}代` : ''),
            price: parseFloat(randomPrice),
            workPlan: workPlans[workPlanIndex],
            status: Math.random() > 0.3,
            image: `https://picsum.photos/200/200?random=${i}`,
            description: descriptions[descIndex] + `（${productNames[nameIndex]}专用型号）`,
            sales: randomSales,
            category: categories[categoryIndex],
            tags: generateProductTags(productNames[nameIndex])
        });
    }
    
    return sampleProducts;
}

function generateProductTags(productName) {
    const tagMap = {
        '保温杯': ['智能', '保温', '304不锈钢'],
        '蓝牙耳机': ['蓝牙', '降噪', '音质'],
        '充电宝': ['大容量', '快充', '便携'],
        '手环': ['心率监测', '防水', '运动'],
        '充电器': ['无线充电', '快充', '兼容性'],
        '音箱': ['环绕音效', '防水', '蓝牙'],
        '手表': ['智能', '通话', '健康监测'],
        '硬盘': ['大容量', '高速', '便携'],
        '鼠标': ['无线', '人体工学', '静音'],
        '键盘': ['机械键盘', 'RGB', '游戏']
    };
    
    for (let key in tagMap) {
        if (productName.includes(key)) {
            return tagMap[key];
        }
    }
    return ['产品', '质量', '实用'];
}

function validateProduct(product) {
    const required = ['id', 'productName', 'price'];
    for (let field of required) {
        if (!product[field]) {
            console.warn(`产品缺少必填字段 ${field}:`, product);
        }
    }
    
    return {
        id: product.id,
        productName: product.productName,
        price: parseFloat(product.price),
        workPlan: product.workPlan || '暂无工作计划',
        status: Boolean(product.status),
        image: product.image || '',
        description: product.description || '',
        sales: product.sales || 0,
        category: product.category || '未分类',
        tags: product.tags || []
    };
}

function getProductStatistics() {
    const products = loadProductsFromStorage();
    const categories = [...new Set(products.map(p => p.category))];
    
    return {
        totalProducts: products.length,
        onlineProducts: products.filter(p => p.status).length,
        offlineProducts: products.filter(p => !p.status).length,
        categories: categories.length,
        totalSales: products.reduce((sum, p) => sum + (p.sales || 0), 0),
        avgPrice: products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / products.length,
        categoriesStats: categories.map(cat => ({
            name: cat,
            count: products.filter(p => p.category === cat).length,
            onlineCount: products.filter(p => p.category === cat && p.status).length
        }))
    };
}

// 调试工具
window.dataManager = {
    export: exportCurrentDataAsJSON,
    import: importJSONData,
    reset: resetToOriginalData,
    showPanel: showDataManagementPanel,
    stats: getProductStatistics
};

console.log('🛠️ 数据管理工具已加载！');
console.log('使用 dataManager.showPanel() 打开管理面板');
console.log('或直接使用: dataManager.export(), dataManager.import(), dataManager.reset()');