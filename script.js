// script.js - Altere todas as URLs para relativas
document.addEventListener('DOMContentLoaded', async function() {
  const form = document.getElementById('formCalculo');
  const origemSelect = document.getElementById('origem');
  const destinoSelect = document.getElementById('destino');
  const resultadosDiv = document.getElementById('tabelaResultados');
  
  // Mostrar mensagem de carregamento
  origemSelect.innerHTML = '<option value="">Carregando origens...</option>';
  destinoSelect.innerHTML = '<option value="">Carregando destinos...</option>';
  
  // Carregar opções de origem e destino
  try {
    console.log('Tentando carregar dados da API...');
    const response = await fetch('/api/tarifas'); // URL RELATIVA
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const tarifas = await response.json();
    console.log('Dados recebidos:', tarifas.length, 'registros');
    
    // Extrair origens e destinos únicos
    const origens = [...new Set(tarifas.map(t => t['SIGLA ORIGEM']))].sort();
    const destinos = [...new Set(tarifas.map(t => t['SIGLA DESTINO']))].sort();
    
    console.log('Origens encontradas:', origens);
    console.log('Destinos encontrados:', destinos);
    
    // Limpar e preencher selects
    origemSelect.innerHTML = '<option value="">Selecione a origem</option>';
    destinoSelect.innerHTML = '<option value="">Selecione o destino</option>';
    
    origens.forEach(origem => {
      const option = document.createElement('option');
      option.value = origem;
      option.textContent = origem;
      origemSelect.appendChild(option);
    });
    
    destinos.forEach(destino => {
      const option = document.createElement('option');
      option.value = destino;
      option.textContent = destino;
      destinoSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Erro ao carregar tarifas:', error);
    origemSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    destinoSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    resultadosDiv.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h3>Erro de conexão</h3>
        <p>Não foi possível conectar à API. Verifique:</p>
        <ul>
          <li>O servidor está rodando?</li>
          <li>Verifique o console para detalhes</li>
        </ul>
        <p>Erro: ${error.message}</p>
      </div>
    `;
  }
  
  // Processar formulário
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nota = parseFloat(document.getElementById('nota').value);
    const peso = parseFloat(document.getElementById('peso').value);
    const origem = origemSelect.value;
    const destino = destinoSelect.value;
    
    // Validação básica
    if (!origem || !destino) {
      alert('Por favor, selecione origem e destino.');
      return;
    }
    
    if (isNaN(nota) || nota <= 0) {
      alert('Por favor, informe um valor válido para a nota.');
      return;
    }
    
    if (isNaN(peso) || peso <= 0) {
      alert('Por favor, informe um peso válido.');
      return;
    }
    
    // Mostrar loading
    resultadosDiv.innerHTML = '<p>Calculando... Aguarde.</p>';
    
    try {
      const response = await fetch('/api/calcular', { // URL RELATIVA
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nota, peso, origem, destino })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const resultados = await response.json();
      
      // ... resto do código permanece igual
    } catch (error) {
      console.error('Erro ao calcular:', error);
      resultadosDiv.innerHTML = `
        <div style="color: red;">
          <p><strong>Erro ao calcular:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  });
});