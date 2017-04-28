'use strict';

const async = require('async');
const del = require('del');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const pngToIco = require('png-to-ico');
const svg2png = require('svg2png');

const manifest = require('../assets/manifest.json');

const extensions = {
  ico: '.ico',
  png: '.png',
  svg: '.svg'
};

function build(callback) {
  async.series([
    async.apply(convertAllSvgToPng, manifest.assets.svg2png),
    async.apply(convertAllPngToIco, manifest.assets.png2ico)
  ], callback);
}

function convertAllPngToIco(assets, callback) {
  async.eachOfSeries(assets, (sizes, asset, next) => {
    console.log(`Converting ${asset} PNG assets to ICO...`);

    async.eachSeries(sizes, async.apply(convertAllPngToIcoForSize, asset), next);
  }, callback);
}

function convertAllPngToIcoForSize(asset, size, callback) {
  async.waterfall([
    async.apply(glob, `assets/${asset}/**/*-${size}${extensions.png}`),
    (filePaths, next) => async.eachSeries(filePaths, async.apply(convertPngToIcoForFile, asset, size), next)
  ], callback);
}

function convertAllSvgToPng(assets, callback) {
  async.eachOfSeries(assets, (sizes, asset, next) => {
    console.log(`Converting ${asset} SVG assets to PNG...`);

    async.waterfall([
      async.apply(glob, `assets/${asset}/**/*${extensions.svg}`),
      (filePaths, _next) => async.eachSeries(filePaths, async.apply(convertSvgToPngForFile, asset, sizes), _next)
    ], next);
  }, callback);
}

function convertPngToIco(asset, filePath, baseName, directory, size, callback) {
  console.log(`Converting ${directory} PNG asset of size ${size} to ICO...`);

  async.waterfall([
    async.apply(fs.readFile, filePath),
    async.asyncify((input) => pngToIco(input)),
    async.apply(fs.writeFile, `${directory}/${baseName}${extensions.ico}`)
  ], callback);
}

function convertPngToIcoForFile(asset, size, filePath, callback) {
  let baseName = path.basename(filePath, extensions.png);
  baseName = baseName.substring(0, baseName.indexOf(`-${size}`));
  const directory = path.dirname(filePath);

  async.series([
    async.asyncify(() => del([ `${directory}/${baseName}${extensions.ico}` ])),
    async.apply(convertPngToIco, asset, filePath, baseName, directory, size)
  ], callback);
}

function convertSvgToPng(asset, filePath, baseName, directory, size, callback) {
  console.log(`Converting ${directory} SVG asset of size ${size} to PNG...`);

  const dimensions = size.split('x');

  async.waterfall([
    async.apply(fs.readFile, filePath),
    async.asyncify((input) => svg2png(input, { width: dimensions[0], height: dimensions[1] })),
    async.apply(fs.writeFile, `${directory}/${baseName}-${size}${extensions.png}`)
  ], callback);
}

function convertSvgToPngForFile(asset, sizes, filePath, callback) {
  const baseName = path.basename(filePath, extensions.svg);
  const directory = path.dirname(filePath);

  async.series([
    async.asyncify(() => del([ `${directory}/${baseName}-*${extensions.png}` ])),
    (next) => async.each(sizes, async.apply(convertSvgToPng, asset, filePath, baseName, directory), next)
  ], callback);
}

build((error) => {
  if (error) {
    throw error;
  } else {
    console.log('Done!');
  }
});
