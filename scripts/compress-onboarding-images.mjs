import sharp from '../node_modules/miniflare/node_modules/sharp/dist/index.mjs'
import path from 'node:path'

const dir = path.resolve('src/assets')

const jobs = [
  { in: 'figma-welcome-hero.png', out: 'welcome-hero.webp', width: 700 },
  { in: 'figma-feat-financas.png', out: 'feat-financas.webp', width: 64 },
  { in: 'figma-feat-rotina.png', out: 'feat-rotina.webp', width: 64 },
  { in: 'figma-feat-metas.png', out: 'feat-metas.webp', width: 64 },
  { in: 'carousel-1-financas.png', out: 'carousel-1-financas.webp', width: 700 },
  { in: 'carousel-2-rotina.png', out: 'carousel-2-rotina.webp', width: 700 },
  { in: 'carousel-3-cargamental.png', out: 'carousel-3-cargamental.webp', width: 700 },
  { in: 'carousel-4-metas.png', out: 'carousel-4-metas.webp', width: 700 },
  { in: 'carousel-5-vidacompartilhada.png', out: 'carousel-5-vidacompartilhada.webp', width: 700 },
]

for (const job of jobs) {
  const inPath = path.join(dir, job.in)
  const outPath = path.join(dir, job.out)
  await sharp(inPath).resize({ width: job.width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outPath)
  console.log(job.out, 'done')
}
