'use strict'

const del = require('del').sync;
const fs = require('fs');
const glob = require('glob').sync;
const path = require('path');
const svg2png = require('svg2png').sync;

const assets = require('../assets/manifest.json').assets;

const pngExtension = '.png';
const svgExtension = '.svg';

function clean(asset, filePath, baseName, directory) {
  console.log(`Cleaning ${asset} assets under directory: ${directory}`);

  del([ `${directory}/${baseName}-*${pngExtension}` ]);
}

function generate(asset, filePath, baseName, directory, size) {
  console.log(`Generating ${asset} asset of size ${size} under directory: ${directory}`);

  let dimensions = size.split('x');
  let input = fs.readFileSync(filePath);
  let output = svg2png(input, { width: dimensions[0], height: dimensions[1] });

  fs.writeFileSync(`${directory}/${baseName}-${size}${pngExtension}`, output);
}

for (let asset of Object.keys(assets)) {
  console.log(`Building ${asset} assets...`);

  let filePaths = glob(`assets/${asset}/**/*${svgExtension}`);
  let sizes = assets[asset];

  for (let filePath of filePaths) {
    let baseName = path.basename(filePath, svgExtension);
    let directory = path.dirname(filePath);

    clean(asset, filePath, baseName, directory);

    for (let size of sizes) {
      generate(asset, filePath, baseName, directory, size);
    }
  }
}
