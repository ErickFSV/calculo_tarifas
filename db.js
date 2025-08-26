// db.js
const mysql = require('mysql2/promise');

// Criar conexão
const dbConfig = {
  host: '52.22.104.75',
  port: 33066,
  user: 'bi_transcourierbh',
  password: '2XPiiPnQojkACX9VlHu7N7W63x3HuQb6',
  database: 'transcourierbh',
};

async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conexão ao banco MySQL realizada com sucesso!');
    return connection;
  } catch (err) {
    console.error('Erro ao conectar no MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;