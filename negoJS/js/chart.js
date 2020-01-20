var chart;
function generate_chart(agents){

    if(!initialized){

        $(".simulation_stats").empty();
        $(".simulation_stats").append(`<div id="mychart" style="height: 400px; width: 500px; margin-top: 50px;"></div>`);
        
        chart = new CanvasJS.Chart("mychart", {
            title: {
                text: "Negotiation"
            },
            axisX: {
                title: `${agents[0].name}`
            },
            axisY: {
                title: `${agents[1].name}`
            },
            
            // begin data for 2 line graphs. Note dps1 and dps2 are
            //defined above as a json object. See http://www.w3schools.com/json/
            data: [
                { type: "line", dataPoints: [] },
                { type: "line", dataPoints: [] }
            ]
            // end of data for 2 line graphs
            

        }); // End of new chart variable

        chart.render();
        initialized = true;
    }
}