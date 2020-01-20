var agent_count = 0;
var stopped = false;
var initialized = false;
var agent_data = null;

$( document ).ready(function() {
 
$(".add_agent").click(function(event) {
        $(".agent_list").append('<div id="agent'+agent_count+'" class="simple_agent">\
                                    <div class="agent_main">\
                                        <div class="name">Name: <input type="text" name="name" value="Agent'+agent_count+'" class="input_name"></div>\
                                        <div class="estrategia">\
                                            <i class="fa fa-clock-o fa-estrategia soloUna" aria-hidden="true" data-checked="yes" data-estrategia="temporal" title="Estrategia temporal"></i>\
                                            <i class="fa fa-user fa-estrategia soloUna" aria-hidden="true" data-checked="no" data-estrategia="comportamiento" title="Estrategia comportamiento"></i>\
                                            <i class="fa fa-transgender-alt modoGenetico" aria-hidden="true" data-checked="no" data-estrategia="genetico" title="Genético"></i>\
                                        </div>\
                                    </div>\
                                    <div class="propiedades_temporal">\
                                        <div class="row">\
                                            <div class="ru floatL">Ru: <input type="text" name="ru" value="0.5"></div>\
                                            <div class="beta floatL">Beta: <input type="text" name="beta" value="1.0"></div>\
                                            <div class="ta floatL">Ta: <input type="text" name="ta" value="100.0"></div>\
                                            <div style="clear: both; padding-bottom: 1.2rem;"></div>\
                                        </div> \
                                    </div>\
                                    <div class="propiedades_comportamiento" style="display:none;">\
                                        <div class="row">\
                                            <div class="ru floatL comportamiento_ru">Ru: <input type="text" name="ru" value="0.5"></div>\
                                            <section class="comportamiento"> \
                                                <select name="estrategia_comportamiento" class="cs-select cs-skin-border" id="comportamiento_selector'+agent_count+'"> \
                                                    <option value="relativo" selected>Relative</option> \
                                                    <option value="absoluto">Absolute</option> \
                                                </select> \
                                            </section> \
                                            <div style="clear: both; padding-bottom: 1.2rem;"></div> \
                                        </div> \
                                    </div> \
                                    <section class="propiedades_profile"> \
                                        <select name="selector_profile" class="cs-select cs-skin-border" id="profile_selector'+agent_count+'"> \
                                            <option value="carBuyer">Car Buyer</option> \
                                            <option value="carSeller" selected>Car Seller</option> \
                                            <option value="bigBuyer3">Big Buyer 3</option> \
                                            <option value="bigSeller3">Big Seller 3</option> \
                                        </select> \
                                    </section> \
                                    <i class="fa fa-times remove_agent_btn" aria-hidden="true"></i>\
                                </div>');
        
        (function() {
            [].slice.call( document.querySelectorAll( 'select#profile_selector'+agent_count ) ).forEach( function(el) { 
                new SelectFx(el);
            } );
        })();
        (function() {
            [].slice.call( document.querySelectorAll( 'select#comportamiento_selector'+agent_count ) ).forEach( function(el) {  
                new SelectFx(el);
            } );
        })();
        agent_count+=1;
    });


    // PARA LAS ESTRATEGIAS
    $("div").on('click', '.fa-estrategia', function(event) {
        if($(this).attr("data-checked")=="no"){
            $(this).siblings(".soloUna").attr("data-checked","no");
            $(this).attr("data-checked","yes");
            $to_show = $(this).parent().parent().siblings(":hidden");
            $to_hide = $(this).parent().parent().siblings(":visible").first();
            $to_show.show();
            $to_hide.hide();
        }
    });

    $("div").on('click', '.modoGenetico', function(event) {
        event.stopPropagation();
        event.preventDefault();
        if($(this).attr("data-checked")=="no"){
            $(this).attr("data-checked","yes");
        }else{
            $(this).attr("data-checked","no");
        }
    });

    $("div").on('click', '.remove_agent_btn', function(event) {
        $(this).parent().remove();
    });

    $(".play_simulation").click(function(){
        $(".play_simulation").hide();
        $(".stop_simulation").show();

        $(".prev_simulation").hide();
        $(".simulation_stats").show();
        stopped = false;
/*
        if(agent_data==null){
            agent_data = take_agents_info();
        }
*/      
        // JUAN: lo cambio para que lo haga cada vez que lo doy al play
        agent_data = take_agents_info();

        run_battle()

    });

    $(".stop_simulation").click(function(){
        $(".stop_simulation").hide();
        $(".play_simulation").show();

        stopped = true;
        initialized = false;
        agent_data = null;

    });

    /* -- SIMULACION DE CLICKS PARA CREAR DOS PRIMEROS AGENTES -- */
    $(".add_agent").click();
    $(".add_agent").click();

});

function renderTable(agents) {
    $(".tabla").empty();
    $(".tabla").append(`<table style="width:100%"> \
                          <tr> \
                            <th>Agent</th> \
                            <th>Send</th> \
                            <th>Receive</th> \
                            <th>Aspiration</th> \
                          </tr> \
                          <tr> \
                            <td>${agents[0].name}</td> \
                            <td id="agentAsend">0</td> \
                            <td id="agentArec">0</td> \
                            <td id="agentAasp">0</td> \
                          </tr> \
                          <tr> \
                            <td>${agents[1].name}</td> \
                            <td id="agentBsend">0</td> \
                            <td id="agentBrec">0</td> \
                            <td id="agentBasp">0</td> \
                          </tr> \
                        </table>`);
}