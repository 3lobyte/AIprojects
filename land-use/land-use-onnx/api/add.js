const { send } = require('micro')
const assert = require('assert');
const onnx = require('onnxjs')
const Minio = require('minio')

module.exports = async (req, res) => {

    var minioClient = new Minio.Client({
        endPoint: process.env.MINIO_ENDPOINT,
        port: parseInt(process.env.MINIO_PORT),
        useSSL: false,
        accessKey: process.env.MINIO_ACCESS_KEY,
        secretKey: process.env.MINIO_ACCESS_SECRET
    });    

    // Create an ONNX inference session with WebAssembly backend.
    const session = new onnx.InferenceSession({ backendHint: 'cpu' });
    // Load an ONNX model. This model is Resnet50 that takes a 1*3*224*224 image and classifies it.

    minioClient.fGetObject('serverless-onnx', 'add.onnx', '/tmp/add.onnx', async err => {
        if (err)
            return console.log(err)
        console.log('success')

        await session.loadModel('/tmp/add.onnx');

        const x = new Float32Array(3 * 4 * 5).fill(1);
        const y = new Float32Array(3 * 4 * 5).fill(2);
        const tensorX = new onnx.Tensor(x, 'float32', [3, 4, 5]);
        const tensorY = new onnx.Tensor(y, 'float32', [3, 4, 5]);

        // Run model with Tensor inputs and get the result by output name defined in model.
        const outputMap = await session.run([tensorX, tensorY]);
        const outputData = outputMap.get('sum');

        // Check if result is expected.
        assert.deepEqual(outputData.dims, [3, 4, 5]);
        assert(outputData.data.every((value) => value === 3));

        send(res, 200, `Got a Tensor of size ${outputData.data.length} with all elements being ${outputData.data[0]}`);
    })

}