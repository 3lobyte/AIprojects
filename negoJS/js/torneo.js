function runTournament(agents) {

	$(".simulation_stats").empty();
	$(".tabla").empty();
	$("#stats").text(`time: 0 s   Iteration: 0.`);
	renderTournmantTable(agents);

	// torneo: el primero contra el resto
	//for(var i=0; i<agents.length; i++) {
		//var agentA = agents[i];
		var agentA = agents[0];
		//for(var j=i+1; j<agents.length; j++) {
		for(var j=1; j<agents.length; j++) {

			$("#stats").text(`time: 0 s   Iteration: 0.`);

			var agentB = agents[j];
			renderRow(agentA, agentB);

			var results = runTournamentIteration(agentA, agentB);

			$(`#status${agentA.name}vs${agentB.name}`).text(`Done`);
			$(`#winner${agentA.name}vs${agentB.name}`).text(`${results[0]}`);
			$(`#utility${agentA.name}vs${agentB.name}`).text(`${results[1]}`);
			$(`#iterations${agentA.name}vs${agentB.name}`).text(`${results[2]}`);
		}
	//}

	$("#stats").text(`time: 0 s   Iteration: 0.`);
	$(".stop_simulation").click();
}


function runTournamentIteration(agentA, agentB) {
	var results = ["-", "-", "-"];

	var it = 1;
    var itMax = 1000;
    var tMax = 100; // segundos
	var t = 0;
	var dt = 1; // 1 seg por iteración

    while(it < itMax && t < tMax) {
    	
    	it++;
    	t+=dt;

        $("#stats").text(`time: ${t.toFixed(3)} s   Iteration: ${it}.`);

    	var utilities = [0, 0];
        utilities = runIteration(agentA, agentB, it);
        if(utilities[2]) {
        	results = [utilities[0].toFixed(3), utilities[1].toFixed(3), it];
        	break;
        }

        utilities = runIteration(agentB, agentA, it);
		if(utilities[2]) {
        	results = [utilities[1].toFixed(3), utilities[0].toFixed(3), it];
        	break;
        }

		agentA.update(t);
		agentB.update(t);
    }

	return results;
}

function renderTournmantTable(agents) {
    $(".tabla").append(`<table id="tournamentTable" style="width:100%"> \
                          <tr> \
                            <th>Agents</th> \
                            <th>Status</th> \
                            <th>Utility A</th> \
                            <th>Utility B</th> \
                            <th>Iterations</th> \
                          </tr> \
                        </table>`);
}

function renderRow(agentA, agentB) {
	$("#tournamentTable").append(`<tr> \
                            		<td>${agentA.name} vs ${agentB.name}</th> \
                            		<td id="status${agentA.name}vs${agentB.name}"> In process ... </th> \
                            		<td id="winner${agentA.name}vs${agentB.name}">0</th> \
                            		<td id="utility${agentA.name}vs${agentB.name}">0</th> \
                            		<td id="iterations${agentA.name}vs${agentB.name}">0</th> \
                          		</tr>`);
}