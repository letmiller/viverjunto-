const AVATAR_SIZE = 160

export function resizeImageToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2

      const canvas = document.createElement('canvas')
      canvas.width = AVATAR_SIZE
      canvas.height = AVATAR_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas indisponível'))

      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem'))
    }

    img.src = objectUrl
  })
}
