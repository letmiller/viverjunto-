import sharp from '../node_modules/miniflare/node_modules/sharp/dist/index.mjs'
import path from 'node:path'

const dir = path.resolve('src/assets/config-financeira')

const names = [
  'cf-organizacao',
  'cf-dividas',
  'cf-reserva',
  'cf-emprestimos',
  'cf-financiamentos',
  'cf-contas-atrasadas',
  'cf-outros',
  'cf-reduzir-gastos',
  'cf-guardar-dinheiro',
  'cf-organizar-contas',
  'cf-planejar-metas',
  'cf-equilibrar-orcamento',
  'cf-leaf',
]

for (const name of names) {
  const inPath = path.join(dir, `${name}.png`)
  const outPath = path.join(dir, `${name}.webp`)
  await sharp(inPath).resize({ width: 80, withoutEnlargement: true }).webp({ quality: 90 }).toFile(outPath)
  console.log(name, 'done')
}
