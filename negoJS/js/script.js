var profiles = [];

function take_agents_info(){
    agents_info = [];
    agents_count = 0
    $('.agent_list').children('.simple_agent').each(function(i) {
        tmp_obj = {}
        $this_name = $(this).children(".agent_main").children(".name").children(".input_name").val();
        tmp_obj["name"] = $this_name;
        if($(this).children(".propiedades_temporal").is(":visible")){
            tmp_obj["type"] = "temporal";
            $(this).children(".propiedades_temporal").find("div").each(function(i){
                if($(this).hasClass("floatL")){
                    $this_attr_name = $(this).children("input").attr("name");
                    $this_attr_val = $(this).children("input").val();
                    tmp_obj[$this_attr_name] = $this_attr_val;
                }
            });
        }else{ //Entonces propiedades_comportamiento esta visible/activo!
            tmp_obj["type"] = "comportamiento";
            $(this).children(".propiedades_comportamiento").find("div").each(function(i){
                if($(this).hasClass("floatL")){
                    $this_attr_name = $(this).children("input").attr("name");
                    $this_attr_val = $(this).children("input").val();
                    tmp_obj[$this_attr_name] = $this_attr_val;
                }
            });
            // Tipo de estrategia de comportamiento y ponerlo en objeto !!!
            $this_estrategia_comportamiento = $this_profile = $(this).find(".comportamiento").children(".cs-select")[0].innerText.toLowerCase();
            tmp_obj["estrategia_comportamiento"] = $this_estrategia_comportamiento;
        }
        $gentico_value = $(this).find(".modoGenetico").attr("data-checked");
        tmp_obj["genetico"] = $gentico_value; // Toma valor yes o no
        $this_profile = $this_profile = $(this).children(".propiedades_profile").children(".cs-select")[0].innerText.replace(/ +/g, "");
        tmp_obj["profile"] = $this_profile;
        profiles.push($this_profile);
        agents_info.push(tmp_obj)
        agents_count++;
    });

   return agents_info;
}

function initAgents() {
    var agents = [];
    agent_data.forEach(function(agent) {

        // creo el agente
        var newAgent = null;
        if(agent.type == "temporal")
            newAgent = new TemporalAgent;
        else if(agent.type == "comportamiento")
            newAgent = new BehaviorAgent;

        agents.push(newAgent);

    });
        
    return agents;
}

$.ajaxSetup({
    async: false
});

function run_battle(){

    // crear agentes
    var agents = initAgents();

    // leer perfiles e inicializar
    for(var i=0; i<agents.length; i++) {
        var path = document.location.toString();
        var url = `${path}js/profiles/${agent_data[i].profile}.json`
        console.log(url);
        $.getJSON(url, function(data) {
            agents[i].profile = data;
            //console.log("Loaded");
        });
        agents[i].init(agent_data[i]);
        //console.log(agents[i].profile);
    }

    // run negotiation
    if(agents.length == 2) {
        generate_chart(agent_data);
        renderTable(agent_data);
        runNegotiation(agents);
    } else {
        runTournament(agents);
    }

}

function runNegotiation(agents) {

    var it = 1;
    var itMax = 1000;
    var tMax = 100; // segundos
    var t0 = performance.now();
    var id = window.setInterval(function(){

        console.clear();

        var t = (performance.now() - t0)*0.001;
        console.log(`time: ${t} It: ${it}.`);
        $("#stats").text(`time: ${t.toFixed(3)} s   Iteration: ${it}.`);

        if(stopped || it >= itMax || t>=tMax) {
            $(".stop_simulation").click();
            window.clearInterval(id);
        }
/*
	   agents.forEach(function(agent) {
	         agent.print();
	    });
    
*/
        var utilities = [0, 0];
        
        // agent A bids, agent B responds
        utilities = runIteration(agents[0], agents[1], it);
            // stop if b acceptes
        console.log(`Agent ${agents[0].name} bids ${utilities[0]} and ${agents[1].name} recieves ${utilities[1]}.`);
        console.log(`Agent ${agents[1].name} acceptes at ${agents[1].acceptance}.`);

        $("#agentAsend").text(utilities[0].toFixed(3));
        $("#agentBrec").text(utilities[1].toFixed(3));
        $("#agentBasp").text(agents[1].acceptance.toFixed(3));

        if(utilities[2]) {
            console.log(`Agent ${agents[1].name} accepted !`);
            chart.data[0].dataPoints.push({ x: utilities[0], y: utilities[1], markerColor: "yellow", markerType: "square", markerSize: 15, markerBorderColor: "black",markerBorderThickness: 2});
        	chart.render();
            $(".stop_simulation").click();
            window.clearInterval(id);
        } else {
        	chart.data[0].dataPoints.push({ x: utilities[0], y: utilities[1]});
        }
        
        // agent B bids, agent A responds
        utilities = runIteration(agents[1], agents[0], it);
            // stop if a acceptes
        console.log(`Agent ${agents[1].name} bids ${utilities[0]} and ${agents[0].name} recieves ${utilities[1]}.`);
        console.log(`Agent ${agents[0].name} acceptes at ${agents[0].acceptance}.`);
        
        $("#agentBsend").text(utilities[0].toFixed(3));
        $("#agentArec").text(utilities[1].toFixed(3));
        $("#agentAasp").text(agents[0].acceptance.toFixed(3));

        if(utilities[2]) {
            console.log(`Agent ${agents[0].name} accepted !`);
            chart.data[1].dataPoints.push({ x: utilities[1], y: utilities[0], markerColor: "yellow", markerType: "square", markerSize: 15, markerBorderColor: "black",markerBorderThickness: 2});
        	chart.render();
            //console.log(chart.data[1].dataPoints);
            $(".stop_simulation").click();
            window.clearInterval(id);
        } else {
        	chart.data[1].dataPoints.push({ x: utilities[1], y: utilities[0]});
        }
        // update for next round
        agents.forEach(function(agent) {
            agent.update(t);
        });

        chart.render();
        //updateTable();
        it++;

    }, 100);



}

function runIteration(agentA, agentB, it) {
    var offer = agentA.generateOffer();
    //console.log(offer);
    var uA = agentA.computeUtility(offer);
    var uB = agentB.recieveOffer(offer);
    var accepted = agentB.acceptOffer(uB);
    return [uA, uB, accepted];
}
