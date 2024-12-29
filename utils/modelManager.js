const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');

global.models = {
  mobilenet: null,
  faceapi: {
    ssdMobilenetv1: null,
    faceLandmark68Net: null,
    faceRecognitionNet: null,
    ageGenderNet: null,
    faceExpressionNet: null
  }
};

async function loadMobilenetModel() {
  if (!global.models.mobilenet) {
    global.models.mobilenet = await mobilenet.load();
  }
  return global.models.mobilenet;
}

async function loadFaceAPIModels() {
  if (!global.models.faceapi.ssdMobilenetv1) {
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    global.models.faceapi.ssdMobilenetv1 = await faceapi.nets.ssdMobilenetv1.loadFromDisk('./commands/cache/models');
    global.models.faceapi.faceLandmark68Net = await faceapi.nets.faceLandmark68Net.loadFromDisk('./commands/cache/models');
    global.models.faceapi.faceRecognitionNet = await faceapi.nets.faceRecognitionNet.loadFromDisk('./commands/cache/models');
    global.models.faceapi.ageGenderNet = await faceapi.nets.ageGenderNet.loadFromDisk('./commands/cache/models');
    global.models.faceapi.faceExpressionNet = await faceapi.nets.faceExpressionNet.loadFromDisk('./commands/cache/models');
  }
}

module.exports = {
  loadMobilenetModel,
  loadFaceAPIModels
};
