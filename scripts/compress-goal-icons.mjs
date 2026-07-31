import sharp from '../node_modules/miniflare/node_modules/sharp/dist/index.mjs'
import path from 'node:path'

const dir = path.resolve('src/assets/goals')

const names = [
  'g-organizar-contas',
  'g-organizacao-casa',
  'g-esquecimentos',
  'g-dividir-tarefas',
  'g-ansiedade-financeira',
  'g-sonhos',
  'g-dividas',
  'g-compras',
  'g-reserva',
  'g-rotina',
  'g-gastos',
  'g-guardar-dinheiro',
]

for (const name of names) {
  const inPath = path.join(dir, `${name}.png`)
  const outPath = path.join(dir, `${name}.webp`)
  await sharp(inPath).resize({ width: 64, withoutEnlargement: true }).webp({ quality: 90 }).toFile(outPath)
  console.log(name, 'done')
}
