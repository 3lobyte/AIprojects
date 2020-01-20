const MOBILENET_MODEL_PATH = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';
const IMAGE_SIZE = 224;

// Info modal show
// retrain mode
$("#let_info").click(function(){
    $("#myModalHelp").modal("show");
});

// start the webcam

var video = startWebcam(document.getElementById('webcam'));

// load mobilenet

// $('#loadModel_modal').modal('show');
// $("#modalLoad_body").html("Loading model...");

var mobilenet;
var freezed;
loadMobilenet();

// train a new model
$("#retrain").click(function(){

    $(".title_mode").text("Training...");
	var newModel;
	trainNewModel();

	// volver a modo predictivo con el nuevo modelo
    $(".retrain_card_body").hide();
    $(".train_params").hide();
    $("#status").show();
    $(".predict_card_body").show();

});

// prediction mode

$("#modalLoad_body").html("Done! <i class='fa fa-smile-o' aria-hidden='true'></i>");
setTimeout(function() {$('#loadModel_modal').modal('hide');}, 1250);

var predicting = false;
$("#predictButton").click(function(){
    if(predicting){
        predicting = false;
        $("#predictButton").text("Predict");
        $("#predictButton").removeClass("btn-danger");
        $("#predictButton").addClass("btn-primary");
    }else{
        predicting = true;
        if(parseInt($("#selector_model").val())!=0){
            predict2(video, models[parseInt($("#selector_model").val())]);
        }else{predict(video);} 
        $("#predictButton").text("Stop");
        $("#predictButton").removeClass("btn-primary");
        $("#predictButton").addClass("btn-danger");
    }
});

// retrain mode
$("#retrainButton").click(function(){

    // Si esta prediciendo lo paramos
    if(predicting){
        predicting = false;
        $("#predictButton").text("Predict");
        $("#predictButton").removeClass("btn-danger");
        $("#predictButton").addClass("btn-primary");
        stopPrediction();
    }
    
    $(".predict_card_body").hide();
    $("#status").hide();
    $(".train_params").show();    
    $(".retrain_card_body").show();
    var idModel = '' + models.length;

    $("#new_model_name").val("CustomModel"+idModel);
    if ($(window).width() >= 768 ){
        $(".card").animate({height:'40.5rem'},200);
    }else{
        $(".card").animate({height:'33.5rem'},200);
    }

    $(".title_mode").text("Retrain");

    $(".add_class_button").click();
    $(".add_class_button").click();

});

$(".add_class_button").click(function(){
    $(".new_classes").append('<div class="new_class_container">\
                                <input type="text" class="new_class_input" value="No label">\
                                <p class="waves-effect waves-light take_data_class_btn">Take data</p>\
                            </div>');
});





