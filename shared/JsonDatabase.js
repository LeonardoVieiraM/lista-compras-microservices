const fs = require("fs-extra");
const path = require("path");

class JsonDatabase {
  constructor(basePath, collectionName) {
    this.filePath = path.join(basePath, `${collectionName}.json`);
    this.collection = [];
    this.initialize();
  }

  initialize() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf8");
        this.collection = JSON.parse(data);
      } else {
        // Create directory if it doesn't exist
        fs.ensureDirSync(path.dirname(this.filePath));
        this.save();
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      this.collection = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.collection, null, 2));
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }

  async create(item) {
    this.collection.push(item);
    this.save();
    return item;
  }

  async find(filter = {}, options = {}) {
    console.log("🔍 JsonDatabase find:");
    console.log("Filter:", JSON.stringify(filter, null, 2));
    console.log("Options:", options);

    let results = [...this.collection];

    // Apply filters
    if (Object.keys(filter).length > 0) {
      results = results.filter((item) => {
        for (const key in filter) {
          if (key.startsWith("$")) {
            // Handle special operators
            if (key === "$or") {
              const orConditions = filter[key];
              const orMatch = orConditions.some((condition) => {
                for (const orKey in condition) {
                  if (item[orKey] !== condition[orKey]) {
                    return false;
                  }
                }
                return true;
              });
              if (!orMatch) return false;
            } else if (key === "$regex") {
              // ✅ CORRIGIDO: Regex filter
              const regexPattern = filter[key];
              const regexOptions = filter.$options || "i";
              const field = filter.$field || "name"; // default field

              const regex = new RegExp(regexPattern, regexOptions);
              if (!regex.test(item[field])) {
                return false;
              }
            }
          } else if (item[key] !== filter[key]) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (options.sort) {
      const sortKey = Object.keys(options.sort)[0];
      const sortDirection = options.sort[sortKey];
      results.sort((a, b) => {
        if (a[sortKey] < b[sortKey]) return sortDirection === 1 ? -1 : 1;
        if (a[sortKey] > b[sortKey]) return sortDirection === 1 ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options.skip) {
      results = results.slice(options.skip);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async findOne(filter = {}) {
    const results = await this.find(filter, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async findById(id) {
    return this.collection.find((item) => item.id === id) || null;
  }

  async update(id, updates) {
    const index = this.collection.findIndex((item) => item.id === id);
    if (index === -1) return null;

    this.collection[index] = { ...this.collection[index], ...updates };
    this.save();
    return this.collection[index];
  }

  async delete(id) {
    const index = this.collection.findIndex((item) => item.id === id);
    if (index === -1) return false;

    this.collection.splice(index, 1);
    this.save();
    return true;
  }

  async count(filter = {}) {
    const results = await this.find(filter);
    return results.length;
  }
}

module.exports = JsonDatabase;
