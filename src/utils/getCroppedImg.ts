// src/utils/getCroppedImg.ts
import { Area } from 'react-easy-crop'

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', error => reject(error))
    img.src = url
  })
}

/**
 * @returns { blob, file }  — the cropped image as Blob + File
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ blob: Blob; file: File }> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas is empty'))
      const file = new File([blob], 'cropped.jpg', { type: blob.type })
      resolve({ blob, file })
    }, 'image/jpeg')
  })
}
