class LostFoundApp {
    constructor() {
        this.currentTab = 'home';
        this.currentClaimItem = null;
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.showTab('home');
    }

    bindEvents() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Action cards on home page
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Form submissions
        document.getElementById('lostItemForm').addEventListener('submit', (e) => this.handleLostItemSubmit(e));
        document.getElementById('foundItemForm').addEventListener('submit', (e) => this.handleFoundItemSubmit(e));
        document.getElementById('claimForm').addEventListener('submit', (e) => this.handleClaimSubmit(e));

        // File uploads
        this.setupFileUpload('lostPhoto', 'lostPhotoUpload', 'lostPhotoPreview', 'lostPhotoPreviewImg');
        this.setupFileUpload('foundPhoto', 'foundPhotoUpload', 'foundPhotoPreview', 'foundPhotoPreviewImg');
        this.setupFileUpload('claimProof', 'claimProofUpload', 'claimProofPreview', 'claimProofPreviewImg');

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
        document.getElementById('closeClaimModal').addEventListener('click', () => this.hideClaimModal());
        document.getElementById('cancelClaim').addEventListener('click', () => this.hideClaimModal());
        
        const claimModal = document.getElementById('claimModal');
        if (claimModal) {
            claimModal.addEventListener('click', (e) => {
                if (e.target.id === 'claimModal') {
                    this.hideClaimModal();
                }
            });
        }

        // Empty state buttons
        document.addEventListener('click', (e) => {
            if (e.target.dataset.tab) {
                this.showTab(e.target.dataset.tab);
            }
        });
    }

    showTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
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
        }
    }

    loadTabData(tabName) {
        console.log('Loading data for tab:', tabName);
        
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
                if (auth.isAdmin()) {
                    this.loadAdminClaims();
                }
                break;
            case 'adminDashboard':
                if (auth.isAdmin()) {
                    this.loadAdminDashboard();
                }
                break;
        }
    }

    loadStats() {
        const stats = database.getStats();
        
        // Update home page stats
        document.getElementById('lostItemsCount').textContent = stats.totalLostItems;
        document.getElementById('foundItemsCount').textContent = stats.totalFoundItems;
        document.getElementById('claimsCount').textContent = stats.pendingClaims;

        // Update admin dashboard stats if visible
        const adminLostCount = document.getElementById('adminLostCount');
        const adminFoundCount = document.getElementById('adminFoundCount');
        const adminClaimsCount = document.getElementById('adminClaimsCount');
        const adminUsersCount = document.getElementById('adminUsersCount');

        if (adminLostCount) adminLostCount.textContent = stats.totalLostItems;
        if (adminFoundCount) adminFoundCount.textContent = stats.totalFoundItems;
        if (adminClaimsCount) adminClaimsCount.textContent = stats.pendingClaims;
        if (adminUsersCount) adminUsersCount.textContent = stats.totalUsers;
    }

    async handleLostItemSubmit(e) {
        e.preventDefault();
        const user = auth.getCurrentUser();
        
        if (!user) {
            auth.showNotification('Please log in to report lost items', 'error');
            return;
        }

        const itemData = {
            id: database.generateId(),
            userId: user.id,
            userName: user.name,
            itemName: document.getElementById('lostItemName').value,
            category: document.getElementById('lostCategory').value,
            description: document.getElementById('lostDescription').value,
            dateTime: document.getElementById('lostDateTime').value,
            location: document.getElementById('lostLocation').value,
            status: 'lost',
            createdAt: new Date().toISOString()
        };

        // Handle photo upload
        const photoFile = document.getElementById('lostPhoto').files[0];
        if (photoFile) {
            itemData.photo = await database.saveImage(photoFile);
        }

        database.saveLostItem(itemData);
        
        auth.showNotification('Lost item reported successfully!');
        e.target.reset();
        this.hideImagePreview('lostPhotoPreview');
        this.loadStats();
        
        // Switch to My Lost Items tab
        this.showTab('myLostItems');
    }

    async handleFoundItemSubmit(e) {
        e.preventDefault();
        const user = auth.getCurrentUser();
        
        if (!user) {
            auth.showNotification('Please log in to report found items', 'error');
            return;
        }

        const itemData = {
            id: database.generateId(),
            foundBy: user.name,
            foundByUserId: user.id,
            itemName: document.getElementById('foundItemName').value,
            category: document.getElementById('foundCategory').value,
            description: document.getElementById('foundDescription').value,
            dateTime: document.getElementById('foundDateTime').value,
            location: document.getElementById('foundLocation').value,
            status: 'available',
            createdAt: new Date().toISOString()
        };

        // Handle photo upload
        const photoFile = document.getElementById('foundPhoto').files[0];
        if (photoFile) {
            itemData.photo = await database.saveImage(photoFile);
        } else {
            auth.showNotification('Please upload a photo of the found item', 'error');
            return;
        }

        database.saveFoundItem(itemData);
        
        auth.showNotification('Found item reported successfully!');
        e.target.reset();
        this.hideImagePreview('foundPhotoPreview');
        this.loadStats();
    }

    setupFileUpload(inputId, uploadId, previewId, previewImgId) {
        const fileInput = document.getElementById(inputId);
        const fileUpload = document.getElementById(uploadId);
        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(previewImgId);

        if (!fileInput || !fileUpload) return;

        fileUpload.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                    fileUpload.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    hideImagePreview(previewId) {
        const preview = document.getElementById(previewId);
        const uploadId = previewId.replace('Preview', 'Upload');
        const upload = document.getElementById(uploadId);
        
        if (preview) preview.classList.add('hidden');
        if (upload) upload.classList.remove('hidden');
    }

    loadFoundItems() {
        const items = database.getAvailableFoundItems();
        const grid = document.getElementById('foundItemsGrid');
        const noItems = document.getElementById('noFoundItems');

        if (!grid) return;

        grid.innerHTML = '';

        if (items.length === 0) {
            if (noItems) noItems.classList.remove('hidden');
            return;
        }

        if (noItems) noItems.classList.add('hidden');

        items.forEach(item => {
            const itemCard = this.createFoundItemCard(item);
            grid.appendChild(itemCard);
        });
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
                    <span><i class="fas fa-map-marker-alt"></i> ${item.location}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(item.dateTime).toLocaleDateString()}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-primary btn-sm claim-btn" data-item-id="${item.id}">
                        <i class="fas fa-hand-holding"></i> Claim Item
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

        if (preview) {
            preview.innerHTML = `
                <h4>${item.itemName}</h4>
                <p><strong>Category:</strong> ${item.category}</p>
                <p><strong>Found At:</strong> ${item.location}</p>
                <p><strong>Description:</strong> ${item.description}</p>
                ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" style="max-width: 200px; margin-top: 10px;" />` : ''}
            `;
        }

        modal.classList.remove('hidden');
    }

    hideClaimModal() {
        const modal = document.getElementById('claimModal');
        modal.classList.add('hidden');
        this.currentClaimItem = null;
        
        // Reset claim form
        const claimForm = document.getElementById('claimForm');
        if (claimForm) claimForm.reset();
        this.hideImagePreview('claimProofPreview');
    }

    async handleClaimSubmit(e) {
        e.preventDefault();
        const user = auth.getCurrentUser();
        
        if (!user) {
            auth.showNotification('Please log in to submit a claim', 'error');
            return;
        }

        if (!this.currentClaimItem) {
            auth.showNotification('No item selected for claim', 'error');
            return;
        }

        const claimData = {
            id: database.generateId(),
            userId: user.id,
            userName: user.name,
            itemId: this.currentClaimItem.id,
            itemName: this.currentClaimItem.itemName,
            proofDescription: document.getElementById('proofDescription').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Handle proof photo upload
        const proofFile = document.getElementById('claimProof').files[0];
        if (proofFile) {
            claimData.proofPhoto = await database.saveImage(proofFile);
        }

        database.saveClaim(claimData);
        
        auth.showNotification('Claim submitted successfully! It will be reviewed by an administrator.');
        this.hideClaimModal();
        this.loadStats();
    }

    loadMyLostItems() {
        const user = auth.getCurrentUser();
        if (!user) return;

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
            <div class="item-header">
                <h3>${item.itemName}</h3>
                <span class="item-category">${item.category}</span>
            </div>
            <p>${item.description}</p>
            <div class="item-meta">
                <span><i class="fas fa-map-marker-alt"></i> Lost at: ${item.location}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(item.dateTime).toLocaleString()}</span>
            </div>
            <div class="item-status">
                <span class="status-badge status-pending">Searching</span>
            </div>
        `;
        return card;
    }

    loadMyClaims() {
        const user = auth.getCurrentUser();
        if (!user) return;

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
            <div class="item-header">
                <h3>${claim.itemName}</h3>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <p><strong>Proof Description:</strong> ${claim.proofDescription}</p>
            <div class="item-meta">
                <span><i class="fas fa-calendar"></i> Submitted: ${new Date(claim.createdAt).toLocaleString()}</span>
            </div>
            ${claim.proofPhoto ? `<img src="${claim.proofPhoto}" alt="Proof" style="max-width: 200px; margin-top: 10px;" />` : ''}
        `;
        return card;
    }

    filterFoundItems() {
        const searchTerm = document.getElementById('searchItems').value.toLowerCase();
        const categoryFilter = document.getElementById('filterCategory').value;
        
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

    loadAdminClaims() {
        const claims = database.getPendingClaims();
        const container = document.getElementById('adminClaimsList');
        const noClaims = document.getElementById('noAdminClaims');

        if (!container) return;

        container.innerHTML = '';

        if (claims.length === 0) {
            if (noClaims) noClaims.classList.remove('hidden');
            return;
        }

        if (noClaims) noClaims.classList.add('hidden');

        claims.forEach(claim => {
            const claimCard = this.createAdminClaimCard(claim);
            container.appendChild(claimCard);
        });
    }

    createAdminClaimCard(claim) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="item-header">
                <h3>${claim.itemName}</h3>
                <span class="status-badge status-pending">Pending Review</span>
            </div>
            <p><strong>Claimant:</strong> ${claim.userName}</p>
            <p><strong>Proof Description:</strong> ${claim.proofDescription}</p>
            <div class="item-meta">
                <span><i class="fas fa-calendar"></i> Submitted: ${new Date(claim.createdAt).toLocaleString()}</span>
            </div>
            ${claim.proofPhoto ? `<img src="${claim.proofPhoto}" alt="Proof" style="max-width: 200px; margin-top: 10px;" />` : ''}
            <div class="item-actions" style="margin-top: 15px;">
                <button class="btn btn-success btn-sm approve-btn" data-claim-id="${claim.id}">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger btn-sm reject-btn" data-claim-id="${claim.id}">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;

        // Add event listeners for approve/reject buttons
        const approveBtn = card.querySelector('.approve-btn');
        const rejectBtn = card.querySelector('.reject-btn');

        approveBtn.addEventListener('click', () => this.handleClaimDecision(claim.id, 'approved'));
        rejectBtn.addEventListener('click', () => this.handleClaimDecision(claim.id, 'rejected'));

        return card;
    }

    handleClaimDecision(claimId, decision) {
        const claim = database.updateClaim(claimId, { status: decision });
        
        if (decision === 'approved') {
            // Update the found item status
            database.updateFoundItem(claim.itemId, { status: 'claimed' });
            auth.showNotification('Claim approved successfully!');
        } else {
            auth.showNotification('Claim rejected.');
        }

        // Reload the claims list
        this.loadAdminClaims();
        this.loadStats();
    }

    loadAdminDashboard() {
        this.loadStats();
        this.loadRecentActivity();
    }

    loadRecentActivity() {
        const activities = database.getRecentActivity(5);
        const container = document.getElementById('recentActivity');

        if (!container) return;

        container.innerHTML = '';

        if (activities.length === 0) {
            container.innerHTML = '<p>No recent activity</p>';
            return;
        }

        activities.forEach(activity => {
            const activityEl = document.createElement('div');
            activityEl.className = 'activity-item';
            activityEl.style.padding = '10px';
            activityEl.style.borderBottom = '1px solid #eee';
            activityEl.innerHTML = `
                <p style="margin: 0;">${activity.message}</p>
                <small style="color: #666;">${new Date(activity.timestamp).toLocaleString()}</small>
            `;
            container.appendChild(activityEl);
        });
    }
}

// Initialize the app when DOM is loaded and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be initialized, then initialize app
    setTimeout(() => {
        if (auth.getCurrentUser()) {
            window.app = new LostFoundApp();
            window.app.init();
        }
    }, 100);
});