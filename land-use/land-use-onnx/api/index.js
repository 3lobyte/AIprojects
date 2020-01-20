const Minio = require('minio')
const { send, buffer } = require('micro')
const onnx = require('onnxjs')
const contentType = require('content-type')
const Jimp = require('jimp')
const ndarray = require('ndarray')
const ops = require('ndarray-ops')
const fs = require('fs')

const cats = [
    'parkinglot',
    'buildings',
    'tenniscourt',
    'storagetanks',
    'denseresidential',
    'baseballdiamond',
    'agricultural',
    'overpass',
    'sparseresidential',
    'mediumresidential',
    'river',
    'intersection',
    'forest',
    'chaparral',
    'beach',
    'mobilehomepark',
    'freeway',
    'golfcourse',
    'harbor',
    'airplane',
    'runway'
]

const warm = async (res) => {
    //if (!fs.existsSync('/tmp/test.onnx')) {
        var minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: parseInt(process.env.MINIO_PORT),
            useSSL: false,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_ACCESS_SECRET
        });
    
        minioClient.fGetObject('serverless-onnx', 'test.onnx', '/tmp/test.onnx', async err => {
            if (err)
                return console.log(err)
            return send(res, 200, 'model test.onnx downloaded')
        })
    //}

    //return send(res, 200, 'model test.onnx already available')    

}

const predict = async (req, res) => {
    if (!fs.existsSync('/tmp/test.onnx'))
        return send(res, 400, 'model test.onnx not found')

    const { type: mimeType } = contentType.parse(req)
    if (!['image/png'].includes(mimeType))
        return send(res, 400, 'only png images accepted');

    const buf = await buffer(req, { limit: '5mb' })

    const image = await Jimp.read(buf)
    const { width, height, data } = image.bitmap

    const session = new onnx.InferenceSession({ backendHint: 'cpu' });

    await session.loadModel("/tmp/test.onnx");

    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, 3, height, width]);

    // Normalize 0-255 to 0-1
    ops.divseq(dataFromImage, 255.0);

    // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
    ops.assign(dataProcessed.pick(0, 0, null, null), dataFromImage.pick(null, null, 2));
    ops.assign(dataProcessed.pick(0, 1, null, null), dataFromImage.pick(null, null, 1));
    ops.assign(dataProcessed.pick(0, 2, null, null), dataFromImage.pick(null, null, 0));

    const tensorX = new onnx.Tensor(dataProcessed.data, 'float32', [1, 3, height, width]);

    // Run model with Tensor inputs and get the result by output name defined in model.
    const output = await session.run([tensorX]);
    const pred = output.values().next().value.data;
    const lab = pred.indexOf(Math.max(...pred));

    return send(res, 200, { 'prediction': cats[lab] });
}

module.exports = async (req, res) => {
    if (req.url === '/api/warm')
        return warm(res)

    if (req.url === '/api/predict') 
        return predict(req, res)

    return send(res, 404, 'invalid route')
}