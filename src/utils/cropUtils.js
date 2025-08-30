// src/utils/cropUtils.js

/**
 * Cria uma imagem a partir de uma URL de arquivo.
 * @param {string} url - A URL da imagem.
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Necessário para evitar erros de CORS
    image.src = url;
  });

/**
 * Recorta uma imagem com base nas coordenadas fornecidas.
 * @param {string} imageSrc - A URL da imagem original.
 * @param {object} pixelCrop - As coordenadas de recorte em pixels.
 * @returns {Promise<Blob>} - O arquivo da imagem recortada (Blob).
 */
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Define o tamanho do canvas para o tamanho do recorte
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Desenha a imagem recortada no canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Retorna a imagem do canvas como um Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = 'avatar.jpeg';
      resolve(blob);
    }, 'image/jpeg', 0.9); // Qualidade da imagem de 90%
  });
};