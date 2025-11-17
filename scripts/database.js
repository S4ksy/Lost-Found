// Database simulation using localStorage
class Database {
    constructor() {
        this.usersKey = 'lostFoundUsers';
        this.lostItemsKey = 'lostFoundLostItems';
        this.foundItemsKey = 'lostFoundFoundItems';
        this.claimsKey = 'lostFoundClaims';
        this.init();
    }

    init() {
        // Initialize default data if not exists
        if (!this.getUsers().length) {
            const defaultAdmin = {
                id: this.generateId(),
                name: 'System Administrator',
                email: 'admin@campus.edu',
                password: 'admin123', // In real app, this should be hashed
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            this.saveUser(defaultAdmin);
        }
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // User management
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    }

    saveUser(user) {
        const users = this.getUsers();
        users.push(user);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
        return user;
    }

    findUserByEmail(email) {
        const users = this.getUsers();
        return users.find(user => user.email === email);
    }

    findUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    // Lost Items management
    getLostItems() {
        return JSON.parse(localStorage.getItem(this.lostItemsKey) || '[]');
    }

    saveLostItem(item) {
        const items = this.getLostItems();
        items.push(item);
        localStorage.setItem(this.lostItemsKey, JSON.stringify(items));
        return item;
    }

    updateLostItem(id, updates) {
        const items = this.getLostItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(this.lostItemsKey, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    getLostItemsByUser(userId) {
        const items = this.getLostItems();
        return items.filter(item => item.userId === userId);
    }

    // Found Items management
    getFoundItems() {
        return JSON.parse(localStorage.getItem(this.foundItemsKey) || '[]');
    }

    saveFoundItem(item) {
        const items = this.getFoundItems();
        items.push(item);
        localStorage.setItem(this.foundItemsKey, JSON.stringify(items));
        return item;
    }

    updateFoundItem(id, updates) {
        const items = this.getFoundItems();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(this.foundItemsKey, JSON.stringify(items));
            return items[index];
        }
        return null;
    }

    getAvailableFoundItems() {
        const items = this.getFoundItems();
        return items.filter(item => item.status === 'available');
    }

    // Claims management
    getClaims() {
        return JSON.parse(localStorage.getItem(this.claimsKey) || '[]');
    }

    saveClaim(claim) {
        const claims = this.getClaims();
        claims.push(claim);
        localStorage.setItem(this.claimsKey, JSON.stringify(claims));
        return claim;
    }

    updateClaim(id, updates) {
        const claims = this.getClaims();
        const index = claims.findIndex(claim => claim.id === id);
        if (index !== -1) {
            claims[index] = { ...claims[index], ...updates };
            localStorage.setItem(this.claimsKey, JSON.stringify(claims));
            return claims[index];
        }
        return null;
    }

    getClaimsByUser(userId) {
        const claims = this.getClaims();
        return claims.filter(claim => claim.userId === userId);
    }

    getPendingClaims() {
        const claims = this.getClaims();
        return claims.filter(claim => claim.status === 'pending');
    }

    // Image handling (simplified - in real app, upload to server)
    saveImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Statistics
    getStats() {
        const lostItems = this.getLostItems();
        const foundItems = this.getAvailableFoundItems();
        const claims = this.getClaims();
        const users = this.getUsers();

        return {
            totalLostItems: lostItems.length,
            totalFoundItems: foundItems.length,
            pendingClaims: claims.filter(c => c.status === 'pending').length,
            totalUsers: users.length,
            resolvedClaims: claims.filter(c => c.status === 'approved').length
        };
    }

    // Recent activity
    getRecentActivity(limit = 10) {
        const lostItems = this.getLostItems();
        const foundItems = this.getFoundItems();
        const claims = this.getClaims();

        const activities = [
            ...lostItems.map(item => ({
                type: 'lost_item',
                message: `${item.userName} reported a lost ${item.itemName}`,
                timestamp: item.createdAt,
                itemId: item.id
            })),
            ...foundItems.map(item => ({
                type: 'found_item',
                message: `${item.foundBy} found a ${item.itemName}`,
                timestamp: item.createdAt,
                itemId: item.id
            })),
            ...claims.map(claim => ({
                type: 'claim',
                message: `New claim submitted for ${claim.itemName}`,
                timestamp: claim.createdAt,
                itemId: claim.itemId
            }))
        ];

        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
}

// Create global database instance
const database = new Database();