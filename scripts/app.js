class LostFoundApp {
    constructor() {
        this.currentTab = 'home';
        this.currentClaimItem = null;
    }

    init() {
        console.log('LostFoundApp initialized');
        this.bindEvents();
        this.loadStats();
        this.showTab('home');
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.dataset.tab;
                console.log('Navigation clicked:', tabName);
                this.showTab(tabName);
            });
        });

        // Action cards on home page
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                console.log('Action card clicked:', tabName);
                this.showTab(tabName);
            });
        });

        // Form submissions
        const lostForm = document.getElementById('lostItemForm');
        const foundForm = document.getElementById('foundItemForm');
        const claimForm = document.getElementById('claimForm');

        if (lostForm) {
            lostForm.addEventListener('submit', (e) => this.handleLostItemSubmit(e));
        }
        if (foundForm) {
            foundForm.addEventListener('submit', (e) => this.handleFoundItemSubmit(e));
        }
        if (claimForm) {
            claimForm.addEventListener('submit', (e) => this.handleClaimSubmit(e));
        }

        // File uploads
        this.setupFileUploads();

        // Search and filter
        const searchInput = document.getElementById('searchItems');
        const filterSelect = document.getElementById('filterCategory');
        
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterFoundItems());
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterFoundItems());
        }

        // Claim modal
        const closeClaimModal = document.getElementById('closeClaimModal');
        const cancelClaim = document.getElementById('cancelClaim');
        
        if (closeClaimModal) {
            closeClaimModal.addEventListener('click', () => this.hideClaimModal());
        }
        if (cancelClaim) {
            cancelClaim.addEventListener('click', () => this.hideClaimModal());
        }

        // Close modal when clicking outside
        const claimModal = document.getElementById('claimModal');
        if (claimModal) {
            claimModal.addEventListener('click', (e) => {
                if (e.target.id === 'claimModal') {
                    this.hideClaimModal();
                }
            });
        }

        console.log('All events bound successfully');
    }

    setupFileUploads() {
        // Lost item photo
        this.setupFileUpload('lostPhoto', 'lostPhotoUpload', 'lostPhotoPreview', 'lostPhotoPreviewImg');
        
        // Found item photo  
        this.setupFileUpload('foundPhoto', 'foundPhotoUpload', 'foundPhotoPreview', 'foundPhotoPreviewImg');
        
        // Claim proof photo
        this.setupFileUpload('claimProof', 'claimProofUpload', 'claimProofPreview', 'claimProofPreviewImg');
    }

    setupFileUpload(inputId, uploadId, previewId, previewImgId) {
        const fileInput = document.getElementById(inputId);
        const fileUpload = document.getElementById(uploadId);
        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(previewImgId);

        if (!fileInput || !fileUpload) {
            console.log('File upload elements not found:', inputId);
            return;
        }

        fileUpload.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (previewImg) previewImg.src = e.target.result;
                    if (preview) preview.classList.remove('hidden');
                    if (fileUpload) fileUpload.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    showTab(tabName) {
        console.log('Showing tab:', tabName);
        
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Show selected tab content
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.remove('hidden');
            this.currentTab = tabName;

            // Load tab-specific data
            this.loadTabData(tabName);
        } else {
            console.error('Tab not found:', tabName);
        }
    }

    loadTabData(tabName) {
        console.log('Loading data for:', tabName);
        
        switch (tabName) {
            case 'home':
                this.loadStats();
                break;
            case 'foundCatalog':
                this.loadFoundItems();
                break;
            case 'myLostItems':
                this.loadMyLostItems();
                break;
            case 'myClaims':
                this.loadMyClaims();
                break;
            case 'adminClaims':
                if (auth && auth.isAdmin()) {
                    this.loadAdminClaims();
                }
                break;
            case 'adminDashboard':
                if (auth && auth.isAdmin()) {
                    this.loadAdminDashboard();
                }
                break;
        }
    }

    loadStats() {
        if (!database) {
            console.error('Database not available');
            return;
        }

        try {
            const stats = database.getStats();
            
            // Update home page stats
            const lostCount = document.getElementById('lostItemsCount');
            const foundCount = document.getElementById('foundItemsCount');
            const claimsCount = document.getElementById('claimsCount');

            if (lostCount) lostCount.textContent = stats.totalLostItems;
            if (foundCount) foundCount.textContent = stats.totalFoundItems;
            if (claimsCount) claimsCount.textContent = stats.pendingClaims;

            console.log('Stats loaded:', stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async handleLostItemSubmit(e) {
        e.preventDefault();
        console.log('Lost item form submitted');
        
        if (!auth || !auth.getCurrentUser()) {
            this.showNotification('Please log in to report lost items', 'error');
            return;
        }

        const user = auth.getCurrentUser();
        const itemName = document.getElementById('lostItemName');
        const category = document.getElementById('lostCategory');
        const description = document.getElementById('lostDescription');
        const dateTime = document.getElementById('lostDateTime');
        const location = document.getElementById('lostLocation');

        if (!itemName || !category || !description || !dateTime || !location) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Basic validation
        if (!itemName.value.trim() || !description.value.trim() || !location.value.trim()) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const itemData = {
            id: database.generateId(),
            userId: user.id,
            userName: user.name,
            itemName: itemName.value.trim(),
            category: category.value,
            description: description.value.trim(),
            dateTime: dateTime.value,
            location: location.value.trim(),
            status: 'lost',
            createdAt: new Date().toISOString()
        };

        // Handle photo upload
        const photoFile = document.getElementById('lostPhoto').files[0];
        if (photoFile) {
            try {
                itemData.photo = await database.saveImage(photoFile);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }

        database.saveLostItem(itemData);
        
        this.showNotification('Lost item reported successfully!');
        e.target.reset();
        this.hideImagePreview('lostPhotoPreview');
        this.loadStats();
        
        // Switch to My Lost Items tab
        this.showTab('myLostItems');
    }

    async handleFoundItemSubmit(e) {
        e.preventDefault();
        console.log('Found item form submitted');
        
        if (!auth || !auth.getCurrentUser()) {
            this.showNotification('Please log in to report found items', 'error');
            return;
        }

        const user = auth.getCurrentUser();
        const itemName = document.getElementById('foundItemName');
        const category = document.getElementById('foundCategory');
        const description = document.getElementById('foundDescription');
        const dateTime = document.getElementById('foundDateTime');
        const location = document.getElementById('foundLocation');

        if (!itemName || !category || !description || !dateTime || !location) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Basic validation
        if (!itemName.value.trim() || !description.value.trim() || !location.value.trim()) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const itemData = {
            id: database.generateId(),
            foundBy: user.name,
            foundByUserId: user.id,
            itemName: itemName.value.trim(),
            category: category.value,
            description: description.value.trim(),
            dateTime: dateTime.value,
            location: location.value.trim(),
            status: 'available',
            createdAt: new Date().toISOString()
        };

        // Handle photo upload
        const photoFile = document.getElementById('foundPhoto').files[0];
        if (photoFile) {
            try {
                itemData.photo = await database.saveImage(photoFile);
            } catch (error) {
                console.error('Error uploading image:', error);
                this.showNotification('Error uploading photo. Please try again.', 'error');
                return;
            }
        } else {
            this.showNotification('Please upload a photo of the found item', 'error');
            return;
        }

        database.saveFoundItem(itemData);
        
        this.showNotification('Found item reported successfully! It is now available for claiming in the catalog.');
        e.target.reset();
        this.hideImagePreview('foundPhotoPreview');
        this.loadStats();
        
        // Switch to Found Items Catalog to see the new item
        this.showTab('foundCatalog');
    }

    hideImagePreview(previewId) {
        const preview = document.getElementById(previewId);
        const uploadId = previewId.replace('Preview', 'Upload');
        const upload = document.getElementById(uploadId);
        
        if (preview) preview.classList.add('hidden');
        if (upload) upload.classList.remove('hidden');
    }

    loadFoundItems() {
        if (!database) {
            console.error('Database not available');
            return;
        }

        const items = database.getAvailableFoundItems();
        const grid = document.getElementById('foundItemsGrid');
        const noItems = document.getElementById('noFoundItems');

        if (!grid) {
            console.error('Found items grid not found');
            return;
        }

        grid.innerHTML = '';

        if (items.length === 0) {
            if (noItems) noItems.classList.remove('hidden');
            console.log('No found items available');
            return;
        }

        if (noItems) noItems.classList.add('hidden');

        items.forEach(item => {
            const itemCard = this.createFoundItemCard(item);
            grid.appendChild(itemCard);
        });

        console.log('Found items loaded:', items.length);
    }

    createFoundItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                ${item.photo ? 
                    `<img src="${item.photo}" alt="${item.itemName}" />` : 
                    `<i class="fas fa-box"></i>`
                }
            </div>
            <div class="item-content">
                <span class="item-category">${item.category}</span>
                <h3 class="item-name">${item.itemName}</h3>
                <p class="item-description">${item.description}</p>
                <div class="item-meta">
                    <span><i class="fas fa-user"></i> Found by: ${item.foundBy}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(item.dateTime).toLocaleDateString()}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary btn-sm claim-btn" data-item-id="${item.id}">
                        <i class="fas fa-hand-holding"></i> Claim This Item
                    </button>
                </div>
            </div>
        `;

        // Add claim event listener
        const claimBtn = card.querySelector('.claim-btn');
        claimBtn.addEventListener('click', () => {
            this.showClaimModal(item);
        });

        return card;
    }

    showClaimModal(item) {
        this.currentClaimItem = item;
        const modal = document.getElementById('claimModal');
        const preview = document.getElementById('claimItemPreview');

        if (!modal || !preview) {
            console.error('Claim modal elements not found');
            return;
        }

        preview.innerHTML = `
            <div style="text-align: center;">
                <h4>Claim: ${item.itemName}</h4>
                <p><strong>Category:</strong> ${item.category}</p>
                <p><strong>Found At:</strong> ${item.location}</p>
                <p><strong>Found On:</strong> ${new Date(item.dateTime).toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${item.description}</p>
                ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" style="max-width: 200px; margin-top: 10px; border-radius: 5px;" />` : ''}
            </div>
        `;

        modal.classList.remove('hidden');
    }

    hideClaimModal() {
        const modal = document.getElementById('claimModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentClaimItem = null;
        
        // Reset claim form
        const claimForm = document.getElementById('claimForm');
        if (claimForm) claimForm.reset();
        this.hideImagePreview('claimProofPreview');
    }

    async handleClaimSubmit(e) {
        e.preventDefault();
        console.log('Claim form submitted');
        
        if (!auth || !auth.getCurrentUser()) {
            this.showNotification('Please log in to submit a claim', 'error');
            return;
        }

        if (!this.currentClaimItem) {
            this.showNotification('No item selected for claim', 'error');
            return;
        }

        const user = auth.getCurrentUser();
        const proofDescription = document.getElementById('proofDescription');

        if (!proofDescription || !proofDescription.value.trim()) {
            this.showNotification('Please provide proof of ownership', 'error');
            return;
        }

        const claimData = {
            id: database.generateId(),
            userId: user.id,
            userName: user.name,
            itemId: this.currentClaimItem.id,
            itemName: this.currentClaimItem.itemName,
            itemCategory: this.currentClaimItem.category,
            foundBy: this.currentClaimItem.foundBy,
            proofDescription: proofDescription.value.trim(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Handle proof photo upload
        const proofFile = document.getElementById('claimProof').files[0];
        if (proofFile) {
            try {
                claimData.proofPhoto = await database.saveImage(proofFile);
            } catch (error) {
                console.error('Error uploading proof image:', error);
            }
        }

        database.saveClaim(claimData);
        
        this.showNotification('Claim submitted successfully! It will be reviewed by an administrator.');
        this.hideClaimModal();
        this.loadStats();
        
        // Switch to My Claims tab
        this.showTab('myClaims');
    }

    loadMyLostItems() {
        if (!auth || !auth.getCurrentUser() || !database) {
            return;
        }

        const user = auth.getCurrentUser();
        const items = database.getLostItemsByUser(user.id);
        const container = document.getElementById('lostItemsList');
        const noItems = document.getElementById('noLostItems');

        if (!container) return;

        container.innerHTML = '';

        if (items.length === 0) {
            if (noItems) noItems.classList.remove('hidden');
            return;
        }

        if (noItems) noItems.classList.add('hidden');

        items.forEach(item => {
            const itemCard = this.createLostItemCard(item);
            container.appendChild(itemCard);
        });
    }

    createLostItemCard(item) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; flex: 1;">${item.itemName}</h3>
                <span class="item-category">${item.category}</span>
            </div>
            <p>${item.description}</p>
            <div class="item-meta">
                <span><i class="fas fa-map-marker-alt"></i> Lost at: ${item.location}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(item.dateTime).toLocaleString()}</span>
            </div>
            <div class="item-status" style="margin-top: 10px;">
                <span class="status-badge status-pending">Searching</span>
            </div>
            ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" style="max-width: 200px; margin-top: 10px; border-radius: 5px;" />` : ''}
        `;
        return card;
    }

    loadMyClaims() {
        if (!auth || !auth.getCurrentUser() || !database) {
            return;
        }

        const user = auth.getCurrentUser();
        const claims = database.getClaimsByUser(user.id);
        const container = document.getElementById('claimsList');
        const noClaims = document.getElementById('noClaims');

        if (!container) return;

        container.innerHTML = '';

        if (claims.length === 0) {
            if (noClaims) noClaims.classList.remove('hidden');
            return;
        }

        if (noClaims) noClaims.classList.add('hidden');

        claims.forEach(claim => {
            const claimCard = this.createClaimCard(claim);
            container.appendChild(claimCard);
        });
    }

    createClaimCard(claim) {
        const statusClass = `status-${claim.status}`;
        const statusText = claim.status.charAt(0).toUpperCase() + claim.status.slice(1);
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <h3 style="margin: 0; flex: 1;">${claim.itemName}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <p><strong>Category:</strong> ${claim.itemCategory}</p>
            <p><strong>Found By:</strong> ${claim.foundBy}</p>
            <p><strong>Proof Description:</strong> ${claim.proofDescription}</p>
            <div class="item-meta">
                <span><i class="fas fa-calendar"></i> Submitted: ${new Date(claim.createdAt).toLocaleString()}</span>
            </div>
            ${claim.proofPhoto ? `<img src="${claim.proofPhoto}" alt="Proof" style="max-width: 200px; margin-top: 10px; border-radius: 5px;" />` : ''}
        `;
        return card;
    }

    filterFoundItems() {
        const searchInput = document.getElementById('searchItems');
        const filterSelect = document.getElementById('filterCategory');
        
        if (!searchInput || !filterSelect || !database) return;

        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = filterSelect.value;
        
        const items = database.getAvailableFoundItems();
        const filteredItems = items.filter(item => {
            const matchesSearch = item.itemName.toLowerCase().includes(searchTerm) || 
                                item.description.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });

        const grid = document.getElementById('foundItemsGrid');
        const noItems = document.getElementById('noFoundItems');

        if (!grid) return;

        grid.innerHTML = '';

        if (filteredItems.length === 0) {
            if (noItems) noItems.classList.remove('hidden');
            return;
        }

        if (noItems) noItems.classList.add('hidden');

        filteredItems.forEach(item => {
            const itemCard = this.createFoundItemCard(item);
            grid.appendChild(itemCard);
        });
    }

    showNotification(message, type = 'success') {
        // Use auth's notification system if available, otherwise create simple alert
        if (auth && auth.showNotification) {
            auth.showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Add sample data for testing
    addSampleFoundItems() {
        if (!auth || !auth.getCurrentUser()) return;

        const user = auth.getCurrentUser();
        const sampleItems = [
            {
                id: database.generateId(),
                foundBy: user.name,
                foundByUserId: user.id,
                itemName: "Black Wireless Earbuds",
                category: "Electronics",
                description: "Black wireless earbuds in a charging case. Left earbud has a small scratch.",
                dateTime: new Date().toISOString(),
                location: "Library - Study Room 2",
                status: "available",
                createdAt: new Date().toISOString()
            },
            {
                id: database.generateId(),
                foundBy: user.name,
                foundByUserId: user.id,
                itemName: "Blue Water Bottle",
                category: "Accessories",
                description: "Blue Hydro Flask water bottle with stickers. 32oz capacity.",
                dateTime: new Date().toISOString(),
                location: "Student Center Cafeteria",
                status: "available",
                createdAt: new Date().toISOString()
            }
        ];

        sampleItems.forEach(item => {
            database.saveFoundItem(item);
        });

        this.showNotification('Sample found items added for testing!');
        this.loadFoundItems();
    }
}

// Initialize the app when everything is ready
function initializeApp() {
    console.log('Initializing LostFoundApp...');
    
    // Wait a bit for auth to initialize
    setTimeout(() => {
        if (typeof auth !== 'undefined' && auth.getCurrentUser()) {
            console.log('User is logged in, initializing app...');
            window.app = new LostFoundApp();
            window.app.init();
            
            // Add debug button to add sample data
            addDebugButton();
        } else {
            console.log('User not logged in, app will initialize after login');
        }
    }, 100);
}

// Add debug button for testing
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Add Sample Found Items (Debug)';
    debugBtn.style.position = 'fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '1000';
    debugBtn.style.padding = '10px';
    debugBtn.style.background = '#ff4444';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '5px';
    debugBtn.style.cursor = 'pointer';
    
    debugBtn.addEventListener('click', () => {
        if (window.app && window.app.addSampleFoundItems) {
            window.app.addSampleFoundItems();
        }
    });
    
    document.body.appendChild(debugBtn);
}

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting app initialization...');
    initializeApp();
});