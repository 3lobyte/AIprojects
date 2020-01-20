document.addEventListener("DOMContentLoaded", e => {

    // set map
    const map = L.map('map').setView([41.38879, 2.15899], 13);
    map.zoomControl.setPosition('bottomleft');

    // set tile source
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoiYmFyY2Vsb25hc2Nob29sb2ZhaSIsImEiOiJjanNoZDJnc3EwNmh6NDNsaTNjdDJqZ2s4In0.xx52N8ZSuJ3NyW2B3uaUGw'
    }).addTo(map);

    // add search bar
    L.Control.geocoder({
        defaultMarkGeocode: false,
        position: 'topleft',
        collapsed: window.innerWidth < 400
    }).on('markgeocode', function (e) {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
        ]);
        map.fitBounds(poly.getBounds());
    }).addTo(map);

    // set actions when button clicked
    document.getElementById("predict").addEventListener('click', e => {
        document.getElementById('prediction').innerHTML = "taking image ...";
        // take screenshoot
        leafletImage(map, function(err, canvas) {
            // here we have the canvas with the visible map painted in
            // resize to fit the center square
            const auxCanvas = document.getElementById('auxCanvas');
            const w = auxCanvas.width;
            const h = auxCanvas.height;
            const start = [
                (canvas.width - auxCanvas.width) / 2,
                (canvas.height - auxCanvas.height) / 2
            ]
            auxCanvas.getContext('2d').drawImage(canvas, start[0], start[1], w, h, 0, 0, w, h)
            // convert to blob
            auxCanvas.toBlob(blob => {
                const image = new File([blob], 'image.png', {type: 'image/png', lastModified: Date.now()});
                //window.location.href = URL.createObjectURL(image)
                
                // fetch prediction from API
                document.getElementById('prediction').innerHTML = "predicting ...";
                const formData = new FormData();
                formData.append('file', image);
                fetch('https://land-use.herokuapp.com/predict', {
                //fetch('http://localhost:8000/predict', {
                        method: 'post',
                    body: formData
                })
                .then(res => res.json())
                .then(({prediction}) => {
                    document.getElementById('prediction').innerHTML = prediction;
                })
                .catch(err => console.error(err.message))

            })
        });
    })
})