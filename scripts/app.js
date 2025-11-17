// Data storage (in a real app, this would be a database)
let lostItems = JSON.parse(localStorage.getItem('lostItems')) || [];
let foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
let claimRequests = JSON.parse(localStorage.getItem('claimRequests')) || [];

// App state
let currentUserRole = 'user'; // 'user' or 'admin'
let selectedItemForClaim = null;
let searchTerm = '';
let filterCategory = 'all';

// DOM Elements
const viewToggle = document.getElementById('viewToggle');
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');
const adminOnlyElements = document.querySelectorAll('.admin-only');

// Form elements
const lostItemForm = document.getElementById('lostItemForm');
const foundItemForm = document.getElementById('foundItemForm');
const claimForm = document.getElementById('claimForm');

// File upload elements
const lostPhotoUpload = document.getElementById('lostPhotoUpload');
const lostPhoto = document.getElementById('lostPhoto');
const lostPhotoPreview = document.getElementById('lostPhotoPreview');
const lostPhotoPreviewImg = document.getElementById('lostPhotoPreviewImg');

const foundPhotoUpload = document.getElementById('foundPhotoUpload');
const foundPhoto = document.getElementById('foundPhoto');
const foundPhotoPreview = document.getElementById('foundPhotoPreview');
const foundPhotoPreviewImg = document.getElementById('foundPhotoPreviewImg');

const claimProofUpload = document.getElementById('claimProofUpload');
const claimProof = document.getElementById('claimProof');
const claimProofPreview = document.getElementById('claimProofPreview');
const claimProofPreviewImg = document.getElementById('claimProofPreviewImg');

// Modal elements
const claimModal = document.getElementById('claimModal');
const closeClaimModal = document.getElementById('closeClaimModal');
const cancelClaim = document.getElementById('cancelClaim');
const claimItemPreview = document.getElementById('claimItemPreview');

// Notification elements
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');

// Search and filter elements
const searchItems = document.getElementById('searchItems');
const filterCategorySelect = document.getElementById('filterCategory');

// Stats elements
const lostItemsCount = document.getElementById('lostItemsCount');
const foundItemsCount = document.getElementById('foundItemsCount');
const claimsCount = document.getElementById('claimsCount');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateStats();
    renderFoundItems();
    renderLostItems();
    renderClaims();
    renderAdminClaims();
});

// Event Listeners
function initializeEventListeners() {
    // Navigation
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Action cards on home page
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const tabId = card.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // View toggle
    viewToggle.addEventListener('click', toggleUserRole);
    
    // Form submissions
    lostItemForm.addEventListener('submit', handleLostItemSubmit);
    foundItemForm.addEventListener('submit', handleFoundItemSubmit);
    claimForm.addEventListener('submit', handleClaimSubmit);
    
    // File uploads
    lostPhotoUpload.addEventListener('click', () => lostPhoto.click());
    lostPhoto.addEventListener('change', (e) => handleImageUpload(e, 'lost'));
    
    foundPhotoUpload.addEventListener('click', () => foundPhoto.click());
    foundPhoto.addEventListener('change', (e) => handleImageUpload(e, 'found'));
    
    claimProofUpload.addEventListener('click', () => claimProof.click());
    claimProof.addEventListener('change', (e) => handleImageUpload(e, 'claim'));
    
    // Modal controls
    closeClaimModal.addEventListener('click', closeModal);
    cancelClaim.addEventListener('click', closeModal);
    
    // Search and filter
    searchItems.addEventListener('input', handleSearch);
    filterCategorySelect.addEventListener('change', handleFilter);
    
    // Empty state buttons
    document.querySelectorAll('.empty-state .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });
}

// Tab Navigation
function switchTab(tabId) {
    // Update active tab
    navTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show selected tab content
    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
    
    // Special handling for certain tabs
    if (tabId === 'foundCatalog') {
        renderFoundItems();
    } else if (tabId === 'myLostItems') {
        renderLostItems();
    } else if (tabId === 'myClaims') {
        renderClaims();
    } else if (tabId === 'adminClaims') {
        renderAdminClaims();
    }
}

// User Role Toggle
function toggleUserRole() {
    currentUserRole = currentUserRole === 'user' ? 'admin' : 'user';
    viewToggle.textContent = currentUserRole === 'user' ? 'Admin View' : 'User View';
    
    // Show/hide admin-only elements
    adminOnlyElements.forEach(element => {
        if (currentUserRole === 'admin') {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
    
    // If on admin claims tab and switching to user, go to home
    const activeTab = document.querySelector('.nav-tab.active').getAttribute('data-tab');
    if (currentUserRole === 'user' && activeTab === 'adminClaims') {
        switchTab('home');
    }
}

// Form Handlers
function handleLostItemSubmit(e) {
    e.preventDefault();
    
    const newItem = {
        id: Date.now(),
        itemName: document.getElementById('lostItemName').value,
        category: document.getElementById('lostCategory').value,
        description: document.getElementById('lostDescription').value,
        dateTime: document.getElementById('lostDateTime').value,
        location: document.getElementById('lostLocation').value,
        photo: lostPhotoPreviewImg.src || null,
        ownerName: document.getElementById('lostOwnerName').value,
        contactEmail: document.getElementById('lostContactEmail').value,
        contactPhone: document.getElementById('lostContactPhone').value,
        status: 'Pending',
        dateSubmitted: new Date().toISOString(),
        potentialMatches: []
    };
    
    lostItems.push(newItem);
    saveToLocalStorage();
    updateStats();
    showNotification('Lost item reported successfully!');
    
    // Reset form
    lostItemForm.reset();
    lostPhotoPreview.classList.add('hidden');
    
    // Switch to my lost items tab
    switchTab('myLostItems');
}

function handleFoundItemSubmit(e) {
    e.preventDefault();
    
    const newItem = {
        id: Date.now(),
        itemName: document.getElementById('foundItemName').value,
        category: document.getElementById('foundCategory').value,
        description: document.getElementById('foundDescription').value,
        dateTime: document.getElementById('foundDateTime').value,
        location: document.getElementById('foundLocation').value,
        photo: foundPhotoPreviewImg.src || null,
        finderName: document.getElementById('finderName').value,
        contactInfo: document.getElementById('finderContact').value,
        status: 'Available',
        dateSubmitted: new Date().toISOString(),
        claimStatus: 'Unclaimed'
    };
    
    foundItems.push(newItem);
    saveToLocalStorage();
    updateStats();
    showNotification('Found item registered successfully!');
    
    // Reset form
    foundItemForm.reset();
    foundPhotoPreview.classList.add('hidden');
    
    // Switch to found catalog tab
    switchTab('foundCatalog');
}

function handleClaimSubmit(e) {
    e.preventDefault();
    
    const newClaim = {
        id: Date.now(),
        itemId: selectedItemForClaim.id,
        claimerName: document.getElementById('claimerName').value,
        claimerEmail: document.getElementById('claimerEmail').value,
        claimerPhone: document.getElementById('claimerPhone').value,
        proofDescription: document.getElementById('proofDescription').value,
        proofPhoto: claimProofPreviewImg.src || null,
        itemDetails: selectedItemForClaim,
        status: 'Pending',
        dateSubmitted: new Date().toISOString()
    };
    
    claimRequests.push(newClaim);
    
    // Update found item status
    const foundItemIndex = foundItems.findIndex(item => item.id === selectedItemForClaim.id);
    if (foundItemIndex !== -1) {
        foundItems[foundItemIndex].claimStatus = 'Claim Pending';
    }
    
    saveToLocalStorage();
    updateStats();
    showNotification('Claim request submitted successfully!');
    closeModal();
    
    // Switch to my claims tab
    switchTab('myClaims');
}

// Image Upload Handler
function handleImageUpload(e, type) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            if (type === 'lost') {
                lostPhotoPreviewImg.src = event.target.result;
                lostPhotoPreview.classList.remove('hidden');
            } else if (type === 'found') {
                foundPhotoPreviewImg.src = event.target.result;
                foundPhotoPreview.classList.remove('hidden');
            } else if (type === 'claim') {
                claimProofPreviewImg.src = event.target.result;
                claimProofPreview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Search and Filter Handlers
function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase();
    renderFoundItems();
}

function handleFilter(e) {
    filterCategory = e.target.value;
    renderFoundItems();
}

// Modal Functions
function openClaimModal(item) {
    selectedItemForClaim = item;
    
    // Populate item preview
    claimItemPreview.innerHTML = `
        <div class="item-preview-content">
            ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" class="item-preview-image">` : ''}
            <div class="item-preview-details">
                <h4>${item.itemName}</h4>
                <p>${item.description}</p>
                <p class="location">Found at: ${item.location}</p>
            </div>
        </div>
    `;
    
    // Reset form
    claimForm.reset();
    claimProofPreview.classList.add('hidden');
    
    // Show modal
    claimModal.classList.remove('hidden');
}

function closeModal() {
    claimModal.classList.add('hidden');
    selectedItemForClaim = null;
}

// Notification Function
function showNotification(message) {
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Rendering Functions
function renderFoundItems() {
    const foundItemsGrid = document.getElementById('foundItemsGrid');
    const noFoundItems = document.getElementById('noFoundItems');
    
    // Filter items
    const filteredItems = foundItems.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchTerm) ||
                             item.description.toLowerCase().includes(searchTerm);
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        return matchesSearch && matchesCategory && item.claimStatus !== 'Claimed';
    });
    
    if (filteredItems.length === 0) {
        foundItemsGrid.innerHTML = '';
        noFoundItems.classList.remove('hidden');
        return;
    }
    
    noFoundItems.classList.add('hidden');
    
    // Render items
    foundItemsGrid.innerHTML = filteredItems.map(item => `
        <div class="item-card">
            ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" class="item-image">` : ''}
            <div class="item-content">
                <div class="item-header">
                    <div class="item-name">${item.itemName}</div>
                    <div class="item-status ${item.claimStatus === 'Unclaimed' ? 'status-unclaimed' : 'status-pending'}">
                        ${item.claimStatus}
                    </div>
                </div>
                <p class="item-description">${item.description}</p>
                <div class="item-details">
                    <div class="item-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(item.dateTime).toLocaleDateString()}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-file-alt"></i>
                        <span>${item.category}</span>
                    </div>
                </div>
                ${item.claimStatus === 'Unclaimed' ? 
                    `<button class="btn btn-primary" onclick="openClaimModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">Claim This Item</button>` : 
                    `<button class="btn btn-secondary" disabled>Claim Pending</button>`
                }
            </div>
        </div>
    `).join('');
}

function renderLostItems() {
    const lostItemsList = document.getElementById('lostItemsList');
    const noLostItems = document.getElementById('noLostItems');
    
    if (lostItems.length === 0) {
        lostItemsList.innerHTML = '';
        noLostItems.classList.remove('hidden');
        return;
    }
    
    noLostItems.classList.add('hidden');
    
    lostItemsList.innerHTML = lostItems.map(item => `
        <div class="card">
            <div class="item-details-layout">
                ${item.photo ? `<img src="${item.photo}" alt="${item.itemName}" class="item-image-small">` : ''}
                <div class="item-details-content">
                    <div class="item-header">
                        <div>
                            <h3 class="item-name">${item.itemName}</h3>
                            <p class="item-category">Category: ${item.category}</p>
                        </div>
                        <span class="status-badge ${getStatusClass(item.status)}">${item.status}</span>
                    </div>
                    <p class="item-description">${item.description}</p>
                    <div class="item-meta">
                        <div class="item-meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Lost at: ${item.location}</span>
                        </div>
                        <div class="item-meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(item.dateTime).toLocaleString()}</span>
                        </div>
                        <div class="item-meta-item">
                            <i class="fas fa-user"></i>
                            <span>${item.ownerName}</span>
                        </div>
                        <div class="item-meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Reported: ${new Date(item.dateSubmitted).toLocaleDateString()}</span>
                        </div>
                    </div>
                    ${item.potentialMatches && item.potentialMatches.length > 0 ? `
                        <div class="alert alert-info">
                            <p><strong>🎯 ${item.potentialMatches.length} Potential Match(es) Found!</strong></p>
                            <p>Check the Found Items Catalog to see if any of these items are yours.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderClaims() {
    const claimsList = document.getElementById('claimsList');
    const noClaims = document.getElementById('noClaims');
    
    if (claimRequests.length === 0) {
        claimsList.innerHTML = '';
        noClaims.classList.remove('hidden');
        return;
    }
    
    noClaims.classList.add('hidden');
    
    claimsList.innerHTML = claimRequests.map(claim => `
        <div class="card">
            <div class="claim-header">
                <div>
                    <h3 class="item-name">${claim.itemDetails.itemName}</h3>
                    <p class="claim-id">Claim ID: #${claim.id}</p>
                </div>
                <span class="status-badge ${getStatusClass(claim.status)}">${claim.status}</span>
            </div>
            
            <div class="claim-details">
                <div class="claim-section">
                    <h4>Item Details</h4>
                    ${claim.itemDetails.photo ? `<img src="${claim.itemDetails.photo}" alt="${claim.itemDetails.itemName}" class="item-image-small">` : ''}
                    <p class="item-description">${claim.itemDetails.description}</p>
                    <div class="claim-info">
                        <div class="claim-info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>Found at: ${claim.itemDetails.location}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(claim.itemDetails.dateTime).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="claim-section">
                    <h4>Your Claim Information</h4>
                    <div class="claim-info">
                        <div class="claim-info-item">
                            <i class="fas fa-user"></i>
                            <span>Name: ${claim.claimerName}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-envelope"></i>
                            <span>Email: ${claim.claimerEmail}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-phone"></i>
                            <span>Phone: ${claim.claimerPhone}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-file-alt"></i>
                            <span>Proof: ${claim.proofDescription}</span>
                        </div>
                        ${claim.proofPhoto ? `
                            <div class="claim-info-item">
                                <i class="fas fa-image"></i>
                                <span>Proof Photo: <img src="${claim.proofPhoto}" alt="Proof" class="image-preview-small"></span>
                            </div>
                        ` : ''}
                        <div class="claim-info-item">
                            <i class="fas fa-clock"></i>
                            <span>Submitted: ${new Date(claim.dateSubmitted).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${claim.status === 'Approved' ? `
                <div class="alert alert-success">
                    ✓ Your claim has been approved! Please proceed to the Lost & Found office to pick up your item.
                </div>
            ` : ''}
            
            ${claim.status === 'Rejected' ? `
                <div class="alert alert-error">
                    ✗ Your claim was not approved. Please contact the office for more details.
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderAdminClaims() {
    const adminClaimsList = document.getElementById('adminClaimsList');
    const noAdminClaims = document.getElementById('noAdminClaims');
    
    if (claimRequests.length === 0) {
        adminClaimsList.innerHTML = '';
        noAdminClaims.classList.remove('hidden');
        return;
    }
    
    noAdminClaims.classList.add('hidden');
    
    adminClaimsList.innerHTML = claimRequests.map(claim => `
        <div class="card">
            <div class="claim-header">
                <div>
                    <h3 class="item-name">${claim.itemDetails.itemName}</h3>
                    <p class="claim-id">Claim ID: #${claim.id}</p>
                </div>
                <span class="status-badge ${getStatusClass(claim.status)}">${claim.status}</span>
            </div>

            <div class="claim-details">
                <div class="claim-section">
                    <h4>Found Item</h4>
                    ${claim.itemDetails.photo ? `<img src="${claim.itemDetails.photo}" alt="${claim.itemDetails.itemName}" class="item-image-small">` : ''}
                    <p class="item-description">${claim.itemDetails.description}</p>
                    <div class="claim-info">
                        <div class="claim-info-item">
                            <span>Category: ${claim.itemDetails.category}</span>
                        </div>
                        <div class="claim-info-item">
                            <span>Found at: ${claim.itemDetails.location}</span>
                        </div>
                        <div class="claim-info-item">
                            <span>Date: ${new Date(claim.itemDetails.dateTime).toLocaleDateString()}</span>
                        </div>
                        <div class="claim-info-item">
                            <span>Finder: ${claim.itemDetails.finderName}</span>
                        </div>
                    </div>
                </div>

                <div class="claim-section">
                    <h4>Claimer Info</h4>
                    <div class="claim-info">
                        <div class="claim-info-item">
                            <i class="fas fa-user"></i>
                            <span>${claim.claimerName}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-envelope"></i>
                            <span>${claim.claimerEmail}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-phone"></i>
                            <span>${claim.claimerPhone}</span>
                        </div>
                        <div class="claim-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${new Date(claim.dateSubmitted).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div class="claim-section">
                    <h4>Proof of Ownership</h4>
                    <p class="item-description">${claim.proofDescription}</p>
                    ${claim.proofPhoto ? `<img src="${claim.proofPhoto}" alt="Proof" class="item-image-small">` : ''}
                </div>
            </div>

            ${claim.status === 'Pending' ? `
                <div class="admin-actions">
                    <button class="btn btn-success" onclick="updateClaimStatus(${claim.id}, 'Approved')">
                        <i class="fas fa-check-circle"></i> Approve Claim
                    </button>
                    <button class="btn btn-warning" onclick="updateClaimStatus(${claim.id}, 'For Verification')">
                        Request More Info
                    </button>
                    <button class="btn btn-danger" onclick="updateClaimStatus(${claim.id}, 'Rejected')">
                        <i class="fas fa-times"></i> Reject Claim
                    </button>
                </div>
            ` : ''}

            ${claim.status === 'Approved' ? `
                <div class="admin-actions">
                    <button class="btn btn-primary" onclick="updateClaimStatus(${claim.id}, 'Picked Up')">
                        Mark as Picked Up
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Helper Functions
function getStatusClass(status) {
    switch (status) {
        case 'Pending': return 'status-pending';
        case 'Matched': return 'status-matched';
        case 'Returned': return 'status-returned';
        case 'Approved': return 'status-approved';
        case 'Rejected': return 'status-rejected';
        case 'Closed': return 'status-closed';
        case 'For Verification': return 'status-pending';
        case 'Picked Up': return 'status-returned';
        default: return 'status-pending';
    }
}

function updateClaimStatus(claimId, newStatus) {
    const claimIndex = claimRequests.findIndex(claim => claim.id === claimId);
    if (claimIndex !== -1) {
        claimRequests[claimIndex].status = newStatus;
        
        // Update found item status if needed
        const claim = claimRequests[claimIndex];
        if (claim) {
            const foundItemIndex = foundItems.findIndex(item => item.id === claim.itemId);
            if (foundItemIndex !== -1) {
                if (newStatus === 'Approved') {
                    foundItems[foundItemIndex].claimStatus = 'Claimed';
                    foundItems[foundItemIndex].status = 'Released';
                } else if (newStatus === 'Rejected') {
                    foundItems[foundItemIndex].claimStatus = 'Unclaimed';
                } else if (newStatus === 'Picked Up') {
                    foundItems[foundItemIndex].claimStatus = 'Claimed';
                    foundItems[foundItemIndex].status = 'Picked Up';
                }
            }
        }
        
        saveToLocalStorage();
        updateStats();
        showNotification(`Claim ${newStatus.toLowerCase()} successfully!`);
        renderAdminClaims();
        renderClaims();
        renderFoundItems();
    }
}

function updateStats() {
    lostItemsCount.textContent = lostItems.length;
    foundItemsCount.textContent = foundItems.filter(item => item.claimStatus === 'Unclaimed').length;
    claimsCount.textContent = claimRequests.filter(claim => claim.status === 'Pending').length;
}

function saveToLocalStorage() {
    localStorage.setItem('lostItems', JSON.stringify(lostItems));
    localStorage.setItem('foundItems', JSON.stringify(foundItems));
    localStorage.setItem('claimRequests', JSON.stringify(claimRequests));
}

// Auto-match items periodically
setInterval(() => {
    lostItems.forEach(lostItem => {
        if (lostItem.status !== 'Matched' && lostItem.status !== 'Returned') {
            const matches = foundItems.filter(foundItem => {
                const nameMatch = foundItem.itemName.toLowerCase().includes(lostItem.itemName.toLowerCase()) ||
                                 lostItem.itemName.toLowerCase().includes(foundItem.itemName.toLowerCase());
                const categoryMatch = foundItem.category === lostItem.category;
                const locationMatch = foundItem.location.toLowerCase().includes(lostItem.location.toLowerCase()) ||
                                     lostItem.location.toLowerCase().includes(foundItem.location.toLowerCase());
                
                return (nameMatch && categoryMatch) || (nameMatch && locationMatch) || (categoryMatch && locationMatch);
            });

            if (matches.length > 0 && lostItem.potentialMatches.length === 0) {
                lostItem.potentialMatches = matches.map(m => m.id);
                lostItem.status = 'Matched';
                showNotification(`Potential match found for your lost ${lostItem.itemName}!`);
                saveToLocalStorage();
                renderLostItems();
            }
        }
    });
}, 10000); // Check every 10 seconds

// Make functions available globally for onclick handlers
window.openClaimModal = openClaimModal;
window.updateClaimStatus = updateClaimStatus;