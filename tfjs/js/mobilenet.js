var models = [];
async function loadMobilenet() {
    mobilenet = await tf.loadModel(MOBILENET_MODEL_PATH);
    mobilenet.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();
    const layer = mobilenet.getLayer('conv_pw_13_relu');
    freezed = tf.model({inputs: mobilenet.inputs, outputs: layer.output});
    models.push(mobilenet);
}

const demoStatusElement = document.getElementById('status');
const status = msg => demoStatusElement.innerText = msg;
var time_between_predictions = 200; //Milisegundos

async function predict(video) {
  var last_prediction = "";
  var last_update = 99999999;
  while (predicting) {
    tf.tidy(() => {
      var t0 = performance.now();
      var preImg = capture(video);
      let pred = mobilenet.predict(preImg);
      let cls = pred.argMax().buffer().values[0];
      if(last_update>time_between_predictions && last_prediction!=IMAGENET_CLASSES[cls]){
        status(IMAGENET_CLASSES[cls]);
        last_update = 0;
        last_prediction = IMAGENET_CLASSES[cls];
      }
      var t1 = performance.now();
      last_update = last_update + (t1-t0);
    });
    await tf.nextFrame();
  }
}

