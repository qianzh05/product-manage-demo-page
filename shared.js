// 共享数据管理 - localStorage + JSON文件操作
const STORAGE_KEY = 'productSystem_products';
const DATA_FILE_PATH = './data/products.json';

// 从JSON文件加载产品数据
async function loadProductsFromFile() {
    try {
        const response = await fetch(DATA_FILE_PATH);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.products || [];
    } catch (error) {
        console.error('从文件加载数据失败:', error);
        return null;
    }
}

// 初始化数据 - 优先从文件加载，失败则使用localStorage或生成示例数据
async function initializeData() {
    // 每次都用JSON文件覆盖localStorage
    const fileProducts = await loadProductsFromFile();
    if (fileProducts && fileProducts.length > 0) {
        saveProductsToStorage(fileProducts);
        return fileProducts;
    }
    return [];
}

// 保存产品数据到localStorage
function saveProductsToStorage(products) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        console.log('数据已保存到localStorage');
        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        return false;
    }
}

// 从localStorage读取产品数据
function loadProductsFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('读取数据失败:', error);
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

// 根据分类筛选商品
function getProductsByCategory(category) {
    const allProducts = loadProductsFromStorage();
    if (!category || category === 'all') {
        return allProducts;
    }
    return allProducts.filter(product => product.category === category);
}

// 搜索商品
function searchProducts(query) {
    const allProducts = loadProductsFromStorage();
    if (!query) return allProducts;
    
    const searchQuery = query.toLowerCase();
    return allProducts.filter(product => 
        product.productName.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
}

// 生成示例数据（备用方案）
function generateSampleData(count = 10) {
    const descriptions = [
        '高性能工业控制器，适用于自动化生产线，支持多种通信协议',
        '智能传感器模块，支持多种数据采集，实时监控生产状态',
        '精密加工零部件，符合工业4.0标准，高精度制造工艺',
        '工业级通信设备，稳定可靠，支持远程监控和数据传输',
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
            status: Math.random() > 0.3, // 70%的产品上架
            image: `https://picsum.photos/200/200?random=${i}`,
            description: descriptions[descIndex] + `（${productNames[nameIndex]}专用型号）`,
            sales: randomSales,
            category: categories[categoryIndex],
            tags: generateProductTags(productNames[nameIndex])
        });
    }
    
    return sampleProducts;
}

// 生成产品标签
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

// 数据验证和格式化
function validateProduct(product) {
    const required = ['id', 'productName', 'price', 'workPlan'];
    for (let field of required) {
        if (!product[field]) {
            throw new Error(`缺少必填字段: ${field}`);
        }
    }
    
    // 格式化数据
    return {
        id: product.id,
        productName: product.productName,
        price: parseFloat(product.price),
        workPlan: product.workPlan,
        status: Boolean(product.status),
        image: product.image || '',
        description: product.description || '',
        sales: product.sales || 0,
        category: product.category || '未分类',
        tags: product.tags || []
    };
}

// 导出数据为JSON格式（用于备份）
function exportProductsToJSON() {
    const products = loadProductsFromStorage();
    const exportData = {
        products: products,
        categories: [...new Set(products.map(p => p.category))],
        exportDate: new Date().toISOString(),
        totalProducts: products.length,
        onlineProducts: products.filter(p => p.status).length
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `products_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// 数据统计
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