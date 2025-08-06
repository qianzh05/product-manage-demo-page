const STORAGE_KEY = 'productSystem_products';
const ORIGINAL_DATA_KEY = 'productSystem_originalData';
const DATA_FILE_PATH = './data/products.json';


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

// 初始化数据
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
                //直接使用JSON数据
                const validatedProducts = fileProducts.map(validateProduct);
                saveProductsToStorage(validatedProducts);
                return validatedProducts;
            }
        }
    } catch (error) {
        console.warn('⚠️ JSON文件加载失败，使用本地数据:', error);
    }
    
}

// 合并JSON数据和本地修改
function mergeProductData(jsonProducts, localProducts) {
    console.log('🔀 合并数据中...');
    
    const localMap = new Map();
    localProducts.forEach(product => {
        localMap.set(product.id, product);
    });
    
    // 优先使用JSON的基础信息，保留本地的状态修改
    const mergedProducts = jsonProducts.map(jsonProduct => {
        const localProduct = localMap.get(jsonProduct.id);
        
        if (localProduct) {
            return {
                ...jsonProduct,  // JSON的基础信息
                status: localProduct.status,  
                sales: localProduct.sales || jsonProduct.sales || 0,  
                customFields: localProduct.customFields || {}
            };
        } else {
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
            alert('数据已重置到原始JSON状态！');
            location.reload();
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
                    location.reload();
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