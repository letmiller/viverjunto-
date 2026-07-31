import sharp from '../node_modules/miniflare/node_modules/sharp/dist/index.mjs'
import path from 'node:path'

const dir = path.resolve('src/assets/routine')

const names = [
  'rt-moradia-badge',
  'rt-moradia-sim',
  'rt-moradia-parcialmente',
  'rt-moradia-ainda-nao',
  'rt-pets-badge',
  'rt-pets-nao',
  'rt-pets-cachorro',
  'rt-pets-gato',
  'rt-pets-outros',
  'rt-filhos-badge',
  'rt-filhos-sim',
  'rt-trabalho-badge',
  'rt-trabalho-presencial',
  'rt-trabalho-hibrido',
  'rt-equilibrio-badge',
  'rt-equilibrio-concentradas',
  'rt-equilibrio-desorganizadas',
  'rt-equilibrio-dificeis',
]

for (const name of names) {
  const inPath = path.join(dir, `${name}.png`)
  const outPath = path.join(dir, `${name}.webp`)
  await sharp(inPath).resize({ width: 80, withoutEnlargement: true }).webp({ quality: 90 }).toFile(outPath)
  console.log(name, 'done')
}
