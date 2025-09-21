const fs = require('fs-extra');
const path = require('path');

class JsonDatabase {
    constructor(basePath, collectionName) {
        this.basePath = basePath;
        this.collectionName = collectionName;
        this.filePath = path.join(basePath, `${collectionName}.json`);
        
        // Ensure directory exists
        fs.ensureDirSync(basePath);
        
        // Initialize file if it doesn't exist
        if (!fs.existsSync(this.filePath)) {
            fs.writeJsonSync(this.filePath, []);
        }
    }
    
    async find(query = {}, options = {}) {
        try {
            let data = await fs.readJson(this.filePath);
            
            // Apply query filters
            if (Object.keys(query).length > 0) {
                data = data.filter(item => {
                    for (const [key, value] of Object.entries(query)) {
                        // Handle special query operators
                        if (key.startsWith('$')) {
                            switch (key) {
                                case '$or':
                                    return value.some(condition => {
                                        return Object.entries(condition).every(([k, v]) => {
                                            return this.matchValue(item[k], v);
                                        });
                                    });
                                    
                                case '$and':
                                    return value.every(condition => {
                                        return Object.entries(condition).every(([k, v]) => {
                                            return this.matchValue(item[k], v);
                                        });
                                    });
                                    
                                case '$not':
                                    return !Object.entries(value).every(([k, v]) => {
                                        return this.matchValue(item[k], v);
                                    });
                                    
                                default:
                                    return true;
                            }
                        }
                        
                        // Regular field matching
                        if (!this.matchValue(item[key], value)) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            
            // Apply sorting
            if (options.sort) {
                data.sort((a, b) => {
                    for (const [field, direction] of Object.entries(options.sort)) {
                        if (a[field] < b[field]) return direction === 1 ? -1 : 1;
                        if (a[field] > b[field]) return direction === 1 ? 1 : -1;
                    }
                    return 0;
                });
            }
            
            // Apply pagination
            if (options.skip) {
                data = data.slice(options.skip);
            }
            
            if (options.limit) {
                data = data.slice(0, options.limit);
            }
            
            return data;
        } catch (error) {
            console.error('Database find error:', error);
            throw error;
        }
    }
    
    async findOne(query = {}) {
        const results = await this.find(query, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }
    
    async findById(id) {
        return await this.findOne({ id });
    }
    
    async count(query = {}) {
        const results = await this.find(query);
        return results.length;
    }
    
    async create(item) {
        try {
            const data = await fs.readJson(this.filePath);
            data.push(item);
            await fs.writeJson(this.filePath, data, { spaces: 2 });
            return item;
        } catch (error) {
            console.error('Database create error:', error);
            throw error;
        }
    }
    
    async update(id, updates) {
        try {
            const data = await fs.readJson(this.filePath);
            const index = data.findIndex(item => item.id === id);
            
            if (index === -1) {
                throw new Error('Item not found');
            }
            
            data[index] = { ...data[index], ...updates };
            await fs.writeJson(this.filePath, data, { spaces: 2 });
            
            return data[index];
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }
    
    async delete(id) {
        try {
            const data = await fs.readJson(this.filePath);
            const filteredData = data.filter(item => item.id !== id);
            
            if (filteredData.length === data.length) {
                throw new Error('Item not found');
            }
            
            await fs.writeJson(this.filePath, filteredData, { spaces: 2 });
            return true;
        } catch (error) {
            console.error('Database delete error:', error);
            throw error;
        }
    }
    
    // Helper method for value matching with support for regex and operators
    matchValue(itemValue, queryValue) {
        if (typeof queryValue === 'object' && queryValue !== null) {
            // Handle query operators
            if (queryValue.$regex) {
                const regex = new RegExp(queryValue.$regex, queryValue.$options || '');
                return regex.test(itemValue);
            }
            
            if (queryValue.$gt !== undefined) return itemValue > queryValue.$gt;
            if (queryValue.$gte !== undefined) return itemValue >= queryValue.$gte;
            if (queryValue.$lt !== undefined) return itemValue < queryValue.$lt;
            if (queryValue.$lte !== undefined) return itemValue <= queryValue.$lte;
            if (queryValue.$ne !== undefined) return itemValue !== queryValue.$ne;
            if (queryValue.$in) return queryValue.$in.includes(itemValue);
            if (queryValue.$nin) return !queryValue.$nin.includes(itemValue);
        }
        
        // Default equality check
        return itemValue === queryValue;
    }
}

module.exports = JsonDatabase;