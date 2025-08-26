// app.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const { calcularGris, calcularValorSimulado } = require('./calculos');
const path = require('path'); // ADICIONE ESTA LINHA

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// Configurar CORS
app.use(cors());
app.use(express.json());

// Middleware para conectar ao banco em cada requisição
app.use(async (req, res, next) => {
  try {
    req.dbConnection = await connectDB();
    next();
  } catch (error) {
    console.error('Erro ao conectar ao banco:', error);
    res.status(500).json({ error: 'Erro de conexão com o banco de dados' });
  }
});

// Middleware para fechar conexão após cada requisição
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.dbConnection) {
      req.dbConnection.end().catch(console.error);
    }
  });
  next();
});

// Rota principal - servir o HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para obter dados das tarifas
app.get('/api/tarifas', async (req, res) => {
  try {
    const query = `
      SELECT
        t_faixa.inicio as 'PESO MINIMO',
        t_faixa.fim as 'PESO FINAL',
        t_faixa.minimo as 'TARIFA MINIMA',
        t_faixa.franquia as 'PESO CORTE',
        CASE 
          WHEN t_faixa.id_tabela = 524 THEN t_faixa.excedente * 0.3
          ELSE t_faixa.excedente 
        END as 'TARIFA EXCEDENTE',
        r1.rota as 'ORIGEM',
        r2.rota as 'DESTINO',
        CASE
          WHEN a1.sigla = "BHZ" THEN "CNF"
          WHEN a1.sigla = "SAO" THEN "CGH"
          WHEN a1.sigla = "VCP" THEN "CPQ"
          WHEN a1.sigla = "RIO" THEN "SDU"
          ELSE a1.sigla
        END AS 'SIGLA ORIGEM',
        CASE
          WHEN a2.sigla = "BHZ" THEN "CNF"
          WHEN a2.sigla = "SAO" THEN "CGH"
          WHEN a2.sigla = "VCP" THEN "CPQ"
          WHEN a2.sigla = "RIO" THEN "SDU"
          ELSE a2.sigla 
        END as 'SIGLA DESTINO',
        CASE
          WHEN t_faixa.id_tabela = 265 THEN "SOL"
          WHEN t_faixa.id_tabela = 524 THEN "JEM"
          WHEN t_faixa.id_tabela = 275 THEN "LATAM"
          WHEN t_faixa.id_tabela = 280 THEN "GOL"
          WHEN t_faixa.id_tabela = 273 THEN "AZUL"
          ELSE t_frete.nome
        END AS 'CIA',
        CASE
          WHEN servico = 10 THEN "JEM - CONVENCIONAL"
          WHEN servico = 106 THEN "TRANSFERENCIA + ENTREGA"
          WHEN servico = 107 THEN "POSTJEM"
          WHEN servico = 0 THEN "SOL - CONVENCIONAL"
          WHEN servico = 57 THEN "SOL - RETIRA RODO"
          WHEN servico = 17 THEN "LATAM STANDARD"
          WHEN servico = 18 THEN "LATAM VELOZ"
          WHEN servico = 60 THEN "LATAM - E FACIL"
          WHEN servico = 40 THEN "AZUL 2 HORAS"
          WHEN servico = 41 THEN "AZUL AMANHA"
          WHEN servico = 42 THEN "AZUL STANDARD"
          WHEN servico = 63 THEN "GOL ECONOMICO"
          WHEN servico = 64 THEN "GOL RAPIDO"
          WHEN servico = 67 THEN "GOL RAPIDO FRACIONADO"
          WHEN servico = 66 THEN "GOL SAUDE"
          WHEN servico = 65 THEN "GOL URGENTE"
          WHEN servico = 100 THEN "GOL URGENTE FRACIONADO"
          ELSE 'VERIFICAR COM A PERFORMANCE'
        END AS 'SERVICO'
      FROM tabela_faixas as t_faixa
      LEFT JOIN tabela_frete as t_frete on (t_faixa.id_tabela = t_frete.id_tabela) 
      LEFT JOIN tabela_trecho as t_trecho on (t_faixa.id_trecho = t_trecho.id_trecho)
      LEFT JOIN rotas as r1 on (t_trecho.origem = r1.id_rota)
      LEFT JOIN rotas as r2 on (t_trecho.destino = r2.id_rota)
      LEFT JOIN aero as a1 on (t_trecho.origem = a1.cidade)
      LEFT JOIN aero as a2 on (t_trecho.destino = a2.cidade)
      WHERE
        t_faixa.id_tabela IN (265, 524, 275, 280, 273)
        AND t_trecho.status = 1
        AND a1.sigla IS NOT NULL
        AND a2.sigla IS NOT NULL  
        AND servico <> 106
    `;
    
    const [results] = await req.dbConnection.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar tarifas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para calcular valores
app.post('/api/calcular', async (req, res) => {
  try {
    const { nota, peso, origem, destino } = req.body;
    
    // Buscar todas as tarifas
    const query = `
      SELECT
        t_faixa.inicio as 'PESO MINIMO',
        t_faixa.fim as 'PESO FINAL',
        t_faixa.minimo as 'TARIFA MINIMA',
        t_faixa.franquia as 'PESO CORTE',
        CASE 
          WHEN t_faixa.id_tabela = 524 THEN t_faixa.excedente * 0.3
          ELSE t_faixa.excedente 
        END as 'TARIFA EXCEDENTE',
        r1.rota as 'ORIGEM',
        r2.rota as 'DESTINO',
        CASE
          WHEN a1.sigla = "BHZ" THEN "CNF"
          WHEN a1.sigla = "SAO" THEN "CGH"
          WHEN a1.sigla = "VCP" THEN "CPQ"
          WHEN a1.sigla = "RIO" THEN "SDU"
          ELSE a1.sigla
        END AS 'SIGLA ORIGEM',
        CASE
          WHEN a2.sigla = "BHZ" THEN "CNF"
          WHEN a2.sigla = "SAO" THEN "CGH"
          WHEN a2.sigla = "VCP" THEN "CPQ"
          WHEN a2.sigla = "RIO" THEN "SDU"
          ELSE a2.sigla 
        END as 'SIGLA DESTINO',
        CASE
          WHEN t_faixa.id_tabela = 265 THEN "SOL"
          WHEN t_faixa.id_tabela = 524 THEN "JEM"
          WHEN t_faixa.id_tabela = 275 THEN "LATAM"
          WHEN t_faixa.id_tabela = 280 THEN "GOL"
          WHEN t_faixa.id_tabela = 273 THEN "AZUL"
          ELSE t_frete.nome
        END AS 'CIA',
        CASE
          WHEN servico = 10 THEN "JEM - CONVENCIONAL"
          WHEN servico = 106 THEN "TRANSFERENCIA + ENTREGA"
          WHEN servico = 107 THEN "POSTJEM"
          WHEN servico = 0 THEN "SOL - CONVENCIONAL"
          WHEN servico = 57 THEN "SOL - RETIRA RODO"
          WHEN servico = 17 THEN "LATAM STANDARD"
          WHEN servico = 18 THEN "LATAM VELOZ"
          WHEN servico = 60 THEN "LATAM - E FACIL"
          WHEN servico = 40 THEN "AZUL 2 HORAS"
          WHEN servico = 41 THEN "AZUL AMANHA"
          WHEN servico = 42 THEN "AZUL STANDARD"
          WHEN servico = 63 THEN "GOL ECONOMICO"
          WHEN servico = 64 THEN "GOL RAPIDO"
          WHEN servico = 67 THEN "GOL RAPIDO FRACIONADO"
          WHEN servico = 66 THEN "GOL SAUDE"
          WHEN servico = 65 THEN "GOL URGENTE"
          WHEN servico = 100 THEN "GOL URGENTE FRACIONADO"
          ELSE 'VERIFICAR COM A PERFORMANCE'
        END AS 'SERVICO'
      FROM tabela_faixas as t_faixa
      LEFT JOIN tabela_frete as t_frete on (t_faixa.id_tabela = t_frete.id_tabela) 
      LEFT JOIN tabela_trecho as t_trecho on (t_faixa.id_trecho = t_trecho.id_trecho)
      LEFT JOIN rotas as r1 on (t_trecho.origem = r1.id_rota)
      LEFT JOIN rotas as r2 on (t_trecho.destino = r2.id_rota)
      LEFT JOIN aero as a1 on (t_trecho.origem = a1.cidade)
      LEFT JOIN aero as a2 on (t_trecho.destino = a2.cidade)
      WHERE
        t_faixa.id_tabela IN (265, 524, 275, 280, 273)
        AND t_trecho.status = 1
        AND a1.sigla IS NOT NULL
        AND a2.sigla IS NOT NULL  
        AND servico <> 106
    `;
    
    const [tarifas] = await req.dbConnection.execute(query);
    
    // Filtrar por origem e destino
    const tarifasFiltradas = tarifas.filter(tarifa => 
      tarifa['SIGLA ORIGEM'] === origem && tarifa['SIGLA DESTINO'] === destino
    );
    
    if (tarifasFiltradas.length === 0) {
      return res.status(404).json({ error: 'Nenhuma tarifa encontrada para a rota especificada' });
    }
    
    // Calcular valores para cada tarifa
    const resultados = tarifasFiltradas.map(tarifa => {
      const gris = calcularGris(nota, tarifa['SIGLA DESTINO'], tarifa.CIA);
      const valorSimulado = calcularValorSimulado(
        peso, 
        tarifa['PESO CORTE'], 
        tarifa['PESO MINIMO'], 
        tarifa['PESO FINAL'], 
        tarifa['TARIFA MINIMA'], 
        tarifa['TARIFA EXCEDENTE'], 
        tarifa.CIA, 
        tarifa.SERVICO, 
        gris
      );
      
      return {
        cia: tarifa.CIA,
        servico: tarifa.SERVICO,
        gris,
        valorSimulado,
        detalhes: tarifa
      };
    });
    
    res.json(resultados);
  } catch (error) {
    console.error('Erro ao calcular:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});