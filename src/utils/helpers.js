// Arquivo: src/utils/helpers.js

/**
 * Pega uma string de cargo completa (ex: "Cidadão de Gápenver")
 * e retorna apenas o cargo-base em minúsculas (ex: "cidadão").
 * Para cargos simples (ex: "Admin"), retorna o próprio cargo em minúsculas.
 * @param {string} cargoCompleto - A string do cargo vinda do banco de dados.
 * @returns {string} O cargo-base em minúsculas.
 */
export const getBaseCargo = (cargoCompleto) => {
  if (!cargoCompleto) {
    return 'default';
  }

  const cargoLower = cargoCompleto.toLowerCase();

  if (cargoLower.startsWith('Cidadão de')) {
    return 'cidadão';
  }
  if (cargoLower.startsWith('Guardião de')) {
    return 'guardião';
  }
  if (cargoLower.startsWith('Veterano de')) {
    return 'veterano';
  }
  if (cargoLower.startsWith('Administrador')) {
    return 'admin';
  }
  if (cargoLower.startsWith('Luminir')) {
    return 'oficialreal';
  }
  if (cargoLower.startsWith('Mehalkir')) {
    return 'guardareal';
  }
  if (cargoLower.startsWith('Autor')) {
    return 'autor';
  }

    return cargoLower.split(' ')[0];
};

