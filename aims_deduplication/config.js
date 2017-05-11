var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5433/AIMS';

module.exports = connectionString;