import sharp from 'sharp';

const SIZES = {
  destaque: { width: 1200, height: 675 },
  cardLg: { width: 800, height: 450 },
  cardSm: { width: 400, height: 225 },
  insta: { width: 1080, height: 1080 }
};

export async function processImage(base64Image) {
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
  const results = {};

  for (const [key, size] of Object.entries(SIZES)) {
    results[key] = await sharp(buffer)
      .resize(size.width, size.height, { 
        fit: key === 'insta' ? 'cover' : 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer()
      .then(b => b.toString('base64'));
  }

  return results;
}
