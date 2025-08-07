let products = [];
let filteredProducts = [];
let editIndex = -1;
let selectedImage = '';
let currentPage = 1;
const pageSize = 10;

// 初始化
async function initializePage() {
    try {
        console.log('🔄 初始化管理页面...');
        
        products = await initializeData();
        console.log('✅ 数据加载完成:', products.length, '个商品');
        
        renderTable();
    } catch (error) {
        console.error('❌ 页面初始化失败:', error);
        // 如果初始化失败则尝试从localStorage加载
        products = loadProductsFromStorage();
        renderTable();
    }
}

function renderTable() {   // 渲染表格
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    filteredProducts = query 
        ? products.filter(p =>
                p.id.toLowerCase().includes(query) ||
                p.productName.toLowerCase().includes(query)
            )
        : products;
    
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const tbody = document.querySelector('#productTable tbody');
    tbody.innerHTML = '';
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);

    pageProducts.forEach((p, i) => {
        const globalIndex = products.findIndex(product => product.id === p.id);
        const tr = document.createElement('tr');
        const actionLabel = p.status ? '下架' : '上架';
        const statusText = p.status ? '已上架' : '已下架';
        const statusClass = p.status ? 'status-online' : 'status-offline';
        
        tr.innerHTML = `
            <td class="col-id">${p.id}</td>
            <td class="col-name">${p.productName}</td>
            <td class="col-price">¥${p.price}</td>
            <td class="col-plan">${p.workPlanID}</td>
            <td class="col-status"><span class="${statusClass}">${statusText}</span></td>
            <td class="col-description">
                <div class="description-text" title="${p.description || ''}" onclick="showDescriptionModal('${p.productName}', '${(p.description || '').replace(/'/g, '&#39;')}')">${p.description || '-'}</div>
            </td>
            <td class="col-image">
                ${p.image ? `<img src="${p.image}" class="product-image" alt="产品图片" onclick="showImagePreviewModal('${p.image.replace(/'/g, "\\'")}')">` : '-'}
            </td>
            <td class="col-actions">
                <div class="action-btns">
                    <button class="btn-save" onclick="toggleStatus(${globalIndex})">${actionLabel}</button>
                    <button class="btn-primary" onclick="openEditModal(${globalIndex})">编辑</button>
                    <button class="btn-secondary" onclick="deleteProduct(${globalIndex})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    renderPagination();
}

function renderPagination() {   // 翻页
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.innerHTML = '«';
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; renderTable(); };
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add('active');
        }
        btn.onclick = () => {
            currentPage = i;
            renderTable();
        };
        pagination.appendChild(btn);
    }

    const next = document.createElement('button');
    next.innerHTML = '»';
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; renderTable(); };
    pagination.appendChild(next);
}

function openAddModal() {   // 打开新增产品模态框
    editIndex = -1;
    document.getElementById('modalTitle').innerText = '新增产品';
    clearModal();
    document.getElementById('modal').style.display = 'flex';
}

function openEditModal(i) { // 打开编辑产品模态框
    editIndex = i;
    const p = products[i];
    document.getElementById('modalTitle').innerText = '编辑产品';
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.productName;
    document.getElementById('price').value = p.price;
    document.getElementById('workPlan').value = p.workPlan;
    document.getElementById('workPlanID').value = p.workPlanID;
    document.getElementById('productDescription').value = p.description || '';
    selectedImage = p.image;
    showPreview(selectedImage);
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() { 
    document.getElementById('modal').style.display = 'none'; 
}

function clearModal() {     // 清空模态框内容
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('price').value = '';
    document.getElementById('workPlan').value = '';
    document.getElementById('productDescription').value = '';
    selectedImage = '';
    document.getElementById('preview').innerHTML = '';
    document.getElementById('imageFile').value = '';
}

document.getElementById('imageFile').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            selectedImage = e.target.result;
            showPreview(selectedImage);
        };
        reader.readAsDataURL(file);
    }
});

function showPreview(imageSrc) {    // 显示图片预览
    if (imageSrc) {
        document.getElementById('preview').innerHTML = `<img src="${imageSrc}">`;
    } else {
        document.getElementById('preview').innerHTML = '';
    }
}

function showDescriptionModal(productName, description) {
    if (!description || description === '-') {
        alert('该产品暂无描述信息');
        return;
    }
    document.getElementById('descriptionModalTitle').textContent = productName + ' - 产品描述';
    document.getElementById('descriptionModalContent').textContent = description.replace(/&#39;/g, "'");
    document.getElementById('descriptionModal').style.display = 'flex';
}

function closeDescriptionModal() {
    document.getElementById('descriptionModal').style.display = 'none';
}

function saveProduct() {
    const id = document.getElementById('productId').value.trim();
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('price').value;
    const workPlan = document.getElementById('workPlan').value.trim();
    const workPlanID = document.getElementById('workPlanID').value.trim();
    const description = document.getElementById('productDescription').value.trim();

    // 验证必填字段
    if (!id || !name || !price || !workPlan) {
        alert('请填写所有必填字段！');
        return;
    }

    const existingProduct = products.find((p, index) => p.id === id && index !== editIndex);
    if (existingProduct) {
        alert('产品编号已存在！');
        return;
    }

    const product = {
        id: id,
        productName: name,
        price: parseFloat(price).toFixed(2),
        workPlan: workPlan,
        workPlanID: workPlanID,
        description: description,
        status: editIndex > -1 ? products[editIndex].status : false,
        image: selectedImage,
        sales: editIndex > -1 ? products[editIndex].sales || 0 : 0,
        category: editIndex > -1 ? products[editIndex].category || '未分类' : '未分类',
        tags: editIndex > -1 ? products[editIndex].tags || [] : []
    };

    if (editIndex > -1) {
        products[editIndex] = product;
    } else {
        products.push(product);
    }

    // 保存到localStorage
    saveProductsToStorage(products);

    closeModal(); 
    renderTable();
    alert(editIndex > -1 ? '产品修改成功！' : '产品添加成功！');
}

function deleteProduct(i) {
    if (confirm('确定删除这个产品吗？')) {
        products.splice(i, 1);
        
        // 保存到localStorage
        saveProductsToStorage(products);
        
        const totalPages = Math.ceil(products.length / pageSize);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        renderTable();
        alert('产品删除成功！');
    }
}

function toggleStatus(i) {
    products[i].status = !products[i].status;
    
    // 保存到localStorage
    saveProductsToStorage(products);
    
    renderTable();
    
    const statusText = products[i].status ? '上架' : '下架';
    alert(`产品已${statusText}！`);
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
    if (event.target.classList.contains('description-modal')) {
        closeDescriptionModal();
        closeImagePreviewModal();
    }
}

function showImagePreviewModal(imgSrc) {
    document.getElementById('previewLargeImg').src = imgSrc;
    document.getElementById('imagePreviewModal').style.display = 'flex';
}

function closeImagePreviewModal() {
    document.getElementById('imagePreviewModal').style.display = 'none';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});