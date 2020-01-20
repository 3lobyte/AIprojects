
// new labels
let labels = [];
let NUM_CLASSES = 0;
let LEARNING_RATE = 0.01;
let BATCH_SIZE = 10;
let EPOCHS = 10;

// new dataset
let xs = null;
let ys = null;
let y = [];

function trainNewModel() {

  // Tomar los parametros del usario
  LEARNING_RATE = parseFloat($("#param_lr").val());
  BATCH_SIZE = parseFloat($("#param_batch").val());
  EPOCHS = parseFloat($("#param_epoch").val());

  NUM_CLASSES = labels.length;

  // one-hot encoding
  y.forEach(function(label){
    const oneHotLabel = tf.tidy(() => tf.oneHot(tf.tensor1d([label]), NUM_CLASSES));
    if(ys == null)
      ys = tf.keep(oneHotLabel);
    else {
      const oldY = ys;
      ys = tf.keep(oldY.concat(oneHotLabel, 0));
      oldY.dispose();
      oneHotLabel.dispose();
    }
  });

  console.log(xs.shape.toString());

  // new model
  newModel = tf.sequential({
    layers: [
      // Flattens the input to a vector so we can use it in a dense layer. While
      // technically a layer, this only performs a reshape (and has no training
      // parameters).
      tf.layers.flatten({inputShape: [7, 7, 256]}),
      tf.layers.dense({
        units: 16,
        //units: ui.getDenseUnits(),
        activation: 'relu',
        kernelInitializer: 'varianceScaling',
        useBias: true
      }),
      // The number of units of the last layer should correspond
      // to the number of classes we want to predict.
      tf.layers.dense({
        units: NUM_CLASSES,
        kernelInitializer: 'varianceScaling',
        useBias: false,
        activation: 'softmax'
      })
    ]
  });

  const optimizer = tf.train.adam(LEARNING_RATE);
  newModel.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

  // train the model
  newModel.fit(xs, ys, {
    BATCH_SIZE, epochs: EPOCHS,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        // Log the cost for every batch that is fed.
        console.log('Epoch: ' + String(epoch+1) + ' Cost: ' + logs.loss.toFixed(5));
        title = 'Epoch: ' + String(epoch+1) + ' Loss: ' + logs.loss.toFixed(5);
        await tf.nextFrame();
      },
      onTrainEnd: async(logs) => {
        models.push(newModel);
        $('#selector_model').append($('<option>', {
            value: parseInt(models.length-1),
            text: $("#new_model_name").val()
        }));

        $('#selector_model').val(parseInt(models.length-1));
        $(".title_mode").text(title);

        xs = null;
        ys = null;
        y = [];

        $(".new_class_container").remove();
      }
    }
  });

}
  

// new predictions

async function predict2(video, model) {
  var last_prediction = "";
  var last_update = 99999999;
  while (predicting) {
    tf.tidy(() => {
      var t0 = performance.now();
      var preImg = capture(video)
      var activation = freezed.predict(preImg);
      let pred = model.predict(activation);
      let cls = pred.argMax().buffer().values[0];
      if(last_update>time_between_predictions && last_prediction!=labels[cls]){
        status(labels[cls]);
        last_update = 0;
        last_prediction = labels[cls];
      }
      var t1 = performance.now();
      last_update = last_update + (t1-t0);
    });
    await tf.nextFrame();
  }
}

// add new label and data
function addExample(example, label) {
    // a priori no se cuantas clases tengo, hacer el one-hot just antes del retrain !
    //const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]), numClasses));

    if(xs == null) {
      xs = tf.keep(example);
    } else {
      const oldX = xs;
      xs = tf.keep(oldX.concat(example, 0));
      oldX.dispose();
    }

    y.push(label);
    $(".title_mode").text("Total images: " + ('' + y.length));
}

var capturing = false;
$(document).on("click",".take_data_class_btn", function(){
  if(capturing) {
    capturing = false;
    $(this).text("Take data");
  } else {
    capturing = true;
    $(this).text("STOP");
    const label = $(this).siblings(".new_class_input").val();
    takeData(label);
  }
});


async function takeData(label) {

  const labelId = getIndexOfLabel(label);

  while(capturing) {
    // start taking examples
    tf.tidy(() => {
      var preImg = capture(video);
      addExample(freezed.predict(preImg), labelId);
    });
    await tf.nextFrame();
  }

}  

function getIndexOfLabel(label) {
  // id de la label
  for(var i=0; i<labels.length; i++) {
    if (labels[i] == label) 
      return i;
  }
  // si no está, añadirlo
  labels.push(label);
  return labels.length - 1;
}
