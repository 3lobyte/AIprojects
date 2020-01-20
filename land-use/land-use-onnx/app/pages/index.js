import { useEffect, useState } from 'react'
import Head from 'next/head';

if (typeof window !== 'undefined') {
    require('leaflet');
    var leafletImage = require('leaflet-image');
    require('leaflet-control-geocoder');
}

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

export default () => {

    const [map, setMap] = useState(null)
    const [text, setText] = useState(null)

    useEffect(() => {
        const _map = L.map('map', {
            drawControls: true,
            maxZoom: 22
        }).setView([41.2985, 2.0705], 18);
        _map.zoomControl.setPosition("bottomright");
        L.tileLayer('https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 22,
            id: 'mapbox.satellite',
            accessToken: 'pk.eyJ1IjoianVhbnNlbnNpbyIsImEiOiJjanA5bmk4MHYyNWVjM3Fyd2Q4ZXA5eXl4In0.R6LVB2M2OVwaR4KIFYg6dA'
        }).addTo(_map)
        setMap(_map)
        // search
        const mapSearch = new L.Control.geocoder({
            'position': 'bottomleft',
            defaultMarkGeocode: false // if true, leaflet-image does not work
        })
            .on('markgeocode', function (e) {
                var bbox = e.geocode.bbox;
                var poly = L.polygon([
                    bbox.getSouthEast(),
                    bbox.getNorthEast(),
                    bbox.getNorthWest(),
                    bbox.getSouthWest()
                ])
                _map.fitBounds(poly.getBounds());
            });
        _map.addControl(mapSearch);

        fetch('/api/warm')
            .then(res => res.text())
            .then(console.log)

    }, [])

    const predict_client = () => {
        setText("taking image ...")
        // take screenshoot
        leafletImage(map, function (err, canvas) {
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

            setText("predicting ...")

            const imageData = auxCanvas.getContext('2d').getImageData(0, 0, auxCanvas.width, auxCanvas.height)

            const width = auxCanvas.width
            const height = auxCanvas.height

            const dataFromImage = ndarray(new Float32Array(imageData.data), [width, height, 4]);

            const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, 3, height, width]);

            // Normalize 0-255 to 0-1
            ndarray.ops.divseq(dataFromImage, 255.0);

            // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
            ndarray.ops.assign(dataProcessed.pick(0, 0, null, null), dataFromImage.pick(null, null, 2));
            ndarray.ops.assign(dataProcessed.pick(0, 1, null, null), dataFromImage.pick(null, null, 1));
            ndarray.ops.assign(dataProcessed.pick(0, 2, null, null), dataFromImage.pick(null, null, 0));

            const tensorX = new onnx.Tensor(dataProcessed.data, 'float32', [1, 3, height, width]);

            const session = new onnx.InferenceSession();

            session.loadModel("/static/test.onnx")
                .then(() => {
                    session.run([tensorX]).then(output => {
                        // consume the output
                        const pred = output.values().next().value.data;
                        const lab = pred.indexOf(Math.max(...pred));
                        setText(cats[lab])

                    })
                })
        });
    }

    const predict_server = () => {
        setText("taking image ...")
        // take screenshoot
        leafletImage(map, function (err, canvas) {
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

            auxCanvas.toBlob(blob => {
                //const image = new File([blob], 'image.png', { type: 'image/png', lastModified: Date.now() });
                //window.location.href = URL.createObjectURL(image)

                setText("predicting ...")

                // fetch prediction from API                
                //const formData = new FormData();
                //formData.append('file', image);
                fetch('/api/predict', {
                    //fetch('http://localhost:3001/predict', {
                    //fetch('http://192.168.1.191:3001/predict', {
                    method: 'post',
                    body: blob
                })
                    .then(res => {
                        if (res.status === 200) return res.json()
                        else return res.text().then(text => {
                            throw new Error(text)
                        })
                    })
                    .then(({ prediction }) => {
                        setText(prediction)
                    })
                    .catch(err => console.error(err.message))

            })

        });
    }

    return (
        <div>
            <Head>
                <title>Land Use ONNX</title>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet-control-geocoder/dist/Control.Geocoder.css" />
                <script src="https://cdn.jsdelivr.net/npm/onnxjs/dist/onnx.min.js"></script>
                <script src="/static/ndarray-browser-min.js"></script>
            </Head>
            <div id="map"></div>
            <div id="focus"></div>
            <div className="panel">
                <div>
                    <button className="predict" onClick={predict_client}>CLIENT</button>
                    <button className="predict" onClick={predict_server}>SERVER</button>
                </div>
                <p id="prediction">{text}</p>
            </div>
            <canvas id="auxCanvas" width="224" height="224"></canvas>
            <style global jsx>{`
                body {
                    margin: 0;
                    padding: 0;
                }
            `}</style>
            <style jsx>{`
                #map {
                    width: 100%;
                    height: 100vh;
                    z-index: 0;
                }
                #focus {
                    border: 3px solid red;
                    width: 224px;
                    height: 224px;
                    position: absolute;
                    top: 50vh;
                    left: 50%;
                    z-index: 1;
                    margin-left: -112px;
                    margin-top: -112px;
                    pointer-events: none;
                }
                .panel {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 250px;
                    height: 100px;
                    z-index: 1;
                    background-color: rgba(0,0,0,0.5);
                    display: grid;
                    grid-template-rows: 50% 50%;
                    align-items: center;
                    justify-items: center;
                }
                
                .predict {
                    width: 90px;
                    height: 30px;
                    margin: 10px;
                    border: none;
                    border-radius: 10px;
                    background-color: rgb(99, 179, 182);
                    color: white;
                    font-size: 18px;
                    outline: none;
                }
                
                #predict:hover{
                    cursor: pointer;
                }
                
                #auxCanvas {
                    display: none;
                }
                
                #prediction {
                    color: white;
                    padding: 10px;
                }
            `}</style>
        </div>
    )

}