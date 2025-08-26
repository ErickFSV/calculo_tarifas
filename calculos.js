// calculos.js
function calcularGris(nota, trecho, cia) {
  let calculo;
  
  if (trecho === "CAC" || trecho === "IGU") {
    calculo = 0.003 * nota;
  } else if (trecho === "GYM" || trecho === "CGR") {
    calculo = 0.012 * nota;
  } else if (trecho === "MAO") {
    calculo = 0.023 * nota;
  } else if (trecho === "BVB") {
    calculo = 0.063 * nota;
  } else {
    calculo = nota * 0.0007;
  }
  
  if (cia === "JEM") {
    return calculo < 3.7 ? 3.7 : calculo;
  } else if (cia === "SOL") {
    return 0.0007 * nota;
  }
  
  return calculo;
}

function calcularValorSimulado(peso, pesoCorte, pesoMinimo, pesoFinal, tarifaMinima, tarifaExcedente, cia, servico, gris) {
  let maxTarifaMinima = 0;
  let pesoExcedente = 0;
  
  if ((cia === "JEM" || cia === "SOL") && 
      peso > pesoMinimo && 
      peso <= pesoFinal && 
      pesoMinimo !== 0 && 
      pesoFinal < 10000) {
    maxTarifaMinima = tarifaMinima;
  }
  
  if (peso > 10 && peso <= pesoFinal) {
    pesoExcedente = (peso - 10) * tarifaExcedente;
  }
  
  // Primeira condição
  if ((cia === "JEM" || cia === "SOL") && 
      (pesoMinimo !== 0 && pesoFinal < 10000) &&
      peso > pesoMinimo && 
      peso <= pesoFinal) {
    return maxTarifaMinima + pesoExcedente + gris;
  }
  
  // Segunda condição
  if (cia !== "JEM" && cia !== "SOL" && 
      servico !== "Latam Veloz" && 
      pesoFinal > 0 && 
      pesoCorte !== pesoMinimo &&
      peso <= pesoCorte) {
    return tarifaMinima;
  }
  
  // Terceira condição
  if (cia !== "JEM" && cia !== "SOL" && 
      servico !== "Latam Veloz" && 
      pesoFinal > 0 && 
      pesoCorte !== pesoMinimo &&
      peso > pesoCorte) {
    return tarifaMinima + ((peso - pesoCorte) * tarifaExcedente);
  }
  
  // Quarta condição
  if (servico === "Latam Veloz" && 
      peso > pesoMinimo && 
      peso <= pesoFinal) {
    return tarifaMinima + ((peso - pesoCorte) * tarifaExcedente);
  }
  
  return 0;
}

module.exports = {
  calcularGris,
  calcularValorSimulado
};