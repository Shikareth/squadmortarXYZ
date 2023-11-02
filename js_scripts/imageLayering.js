const Jimp = require('jimp');
const path = require('path');

// Get image filenames from command-line arguments
const image1Path = process.argv[2];
const image2Path = process.argv[3];
const outputPath = process.argv[4];

if (!image1Path || !image2Path || !outputPath) {
  process.exit(1);
}

Promise.all([Jimp.read(image1Path), Jimp.read(image2Path)])
  .then(images => {
    const image1 = images[0];
    const image2 = images[1];

    if (image1.getWidth() !== image2.getWidth() || image1.getHeight() !== image2.getHeight()) {
      image1.resize(image2.getWidth(), image2.getHeight());
    }

    image2.composite(image1, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacityDest: 1, 
      opacitySource: 0.3 
    });
    image2.write(outputPath);
  })
  .catch(err => {
  });
