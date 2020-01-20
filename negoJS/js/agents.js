var TemporalAgent = function() {

	// se sobreescribe antes del init !
	this.profile = null;

	this.init = function (data) {
		this.name = data.name;
		this.ru = data.ru;
		this.beta = data.beta;
		this.ta = data.ta;
		this.acceptance = 1.0;
		this.t0 = performance.now();
		this.maxRandomIt = 10;
		this.genetic = (data.genetico == "yes"); 
		this.genGen = null;
		if(this.genetic) {
			this.genGen = new GeneticGenerator();
			this.genGen.init();
			this.genGen.generateOffers(this);
		}
	}

	this.generateOffer = function () {
		if (this.genetic)
			return this.genGen.offers[Math.floor(Math.random()*this.genGen.numOfOffers)];
		return generateRandomOffers(this);
	}

	this.recieveOffer = function (offer) {
		return this.computeUtility(offer);
	}

	this.computeUtility = function(offer) {
		// calcula utilidad de la oferta
		return computeUtility(this, offer);
	}

	this.acceptOffer = function(utility) {
		if(utility > this.acceptance) 
			return true;
		return false;
	}

	this.update = function(time) {
		// el criterio de aceptación decrece con el tiempo
		this.acceptance = 1.0 - (1.0 - this.ru)*Math.pow((time/this.ta),(1/this.beta));
	}

	this.print = function() {
		console.log(`Temporal Agent ${this.name} with properties:`);
		console.log(`ru: ${this.ru}.`);
		console.log(`beta: ${this.beta}.`);
		console.log(`ta: ${this.ta}.`);
		console.log(this.profile);
	}
}

var BehaviorAgent = function() {

	// se sobreescribe antes del init !
	this.profile = null;
		
	this.init = function (data) {
		this.name = data.name;
		this.ru = data.ru;
		this.estrategia = data.estrategia_comportamiento;
		this.acceptance = 1.0;
		this.t0 = performance.now();
		this.maxRandomIt = 10;

		this.lastOffer = {};
		this.lastRecievedOffer = {};
		this.newRecievedOffer = {};

		this.genetic = (data.genetico == "yes"); 
		this.genGen = null;
		if(this.genetic) {
			this.genGen = new GeneticGenerator();
			this.genGen.init();
			this.genGen.generateOffers(this);
		}
	}

	this.generateOffer = function () {
		var offer = {}
		if (this.genetic)
			offer = this.genGen.offers[Math.floor(Math.random()*this.genGen.numOfOffers)];
		else
			offer = generateRandomOffers(this);
		this.lastOffer = offer;
		return offer;
	}

	this.recieveOffer = function (offer) {
		this.lastRecievedOffer = this.newRecievedOffer;
		this.newRecievedOffer = offer;
		return this.computeUtility(offer);
	}

	this.computeUtility = function(offer) {
		return computeUtility(this, offer);
	}

	this.acceptOffer = function(utility) {
		if(utility > this.acceptance) 
			return true;
		return false;
	}

	this.update = function(time) {

		var lastUtility = this.computeUtility(this.lastRecievedOffer);
		var newUtility = this.computeUtility(this.newRecievedOffer);
		var myUtility = this.computeUtility(this.lastOffer);

		if(this.estrategia[0] == "r")
			this.acceptance = Math.min(1. , Math.max(this.ru, (1-newUtility)/(1-lastUtility)*myUtility) );
		else if (this.estrategia[0]=="a")
			this.acceptance = Math.min(1. , Math.max(this.ru, myUtility - (newUtility - lastUtility)) );
		else
			console.log("estrategia no válida!", this.estrategia);
	}

	this.print = function() {
		console.log(`Behaviour Agent ${this.name} with properties:`);
		console.log(`ru: ${this.ru}.`);
		console.log(`strategy: ${this.estrategia}.`);
		console.log(this.profile);
	}
}

function computeUtility(agent, offer) {
	var profile = agent.profile;
	var utility = 0.;
	for (feature in profile) {
		var type = profile[feature].type;
		var w = profile[feature].w;
		var values = profile[feature].V;
		if (type == "list") {
			for(var i=0; i<values.length; i++) {
				if(values[i][1] == offer[feature]) {
					utility += w*values[i][0];
					break;
				}
			}
		} else if (type == "range") {
			for(var i=0; i<values.length; i++) {
				if(values[i][1] <= offer[feature] && values[i][2] >= offer[feature]) {
					utility += w*values[i][0];
					break;
				}
			}
		} else {
			console.log(feature);
			alert("Value not found!"+type);
		}
	}
	return utility;
}

function generateRandomOffers(agent) {
	// crea ofertas aleatorias y envía la mejor
	var profile = agent.profile;
	var bestOffer = {};
	var bestUtility = 0.;
	for(var i=0; i<agent.maxRandomIt; i++) {
		var offer = {};
		for (feature in profile) {
			//if(i==0) console.log(feature);
			var type = profile[feature].type;
			var value = null;
			if (type == "list") {
				var list = profile[feature].list;
				value = list[Math.floor(Math.random()*list.length)];
			} else if (type == "range") {
				var range = profile[feature].range;
				value = range[0] + Math.random()*(range[1] - range[0]);
			} else {
							console.log(feature);

				alert("Value not found!"+type);
			}
			offer[feature] = value;
		}
		var utility = agent.computeUtility(offer);
		if (utility > bestUtility) {
			bestUtility = utility;
			bestOffer = offer;
		}
	}
	return bestOffer;
}

// generación de ofertas con genético

var GeneticGenerator = function() {

	this.init = function(params) {
		// numero de ofertas que se van a generar y guardar
		// que sea par siempre porfa !!!!!!
		this.numOfOffers = 30;//params.numOfOffers;
		// ofertas
		this.offers = [];
		this.utilities = [];
		this.maxIt = 3;
		this.mutProb = 0.1;
	}

	this.generateOffers = function(agent) {
		console.log(`Generando ofertas para ${agent.name}`);
		//console.log(agent.profile);
		// genero un numero de ofertas aleatorias determinadas
		for(var i=0; i<this.numOfOffers; i++) {
			this.offers.push(generateRandomOffer(agent));
			this.utilities.push(agent.computeUtility(this.offers[i]));
		}

		// bucle genético
		for(var it = 0; it < this.maxIt; it++) {

			// por cada individuo
			var newOffers = []
			var newUtilities = [];
			var aux = [];
			for(var i=0; i<this.numOfOffers; i++) {

				// cogo dos aleatorios y los cruzo
				var idA = Math.floor(Math.random()*this.numOfOffers);
				var idB = Math.floor(Math.random()*this.numOfOffers);
				var offerA = this.offers[idA];
				var offerB = this.offers[idB];
				newOffers.push(cross(offerA, offerB));

				// mutación
				if(Math.random() < this.mutProb) {
					console.log("mutación !")
					newOffer = generateRandomOffer(agent);
				}

				newUtilities.push(agent.computeUtility(newOffers[i])); 

				aux.push({"util": this.utilities[i], "id": i});
				aux.push({"util": newUtilities[i], "id": i + this.numOfOffers});

			}

			// sustituyo los peores por los mejores

			aux.sort(function(a,b){
				return b.util - a.util;
			});

			this.offers = this.offers.concat(newOffers);
			this.utilities = this.utilities.concat(newUtilities);
			for(var i=0; i<this.numOfOffers; i++) {
				newOffers[i] = this.offers[aux[i].id];
				newUtilities[i] = this.utilities[aux[i].id];
			}
			this.offers = newOffers;
			this.utilities = newUtilities;
			
		}

	}
}

function cross(offerA, offerB) {
	// intercalo las propiedades
	var newOffer = {};

	var features = [];
	for (feature in offerA)
		features.push(feature);

	for (var i=0; i<features.length; i+=2) {
		newOffer[features[i]] = offerA[features[i]];
	}
	for (var i=1; i<features.length; i+=2) 
		newOffer[features[i]] = offerB[features[i]];

	return newOffer;
}

function generateRandomOffer(agent) {
	// crea una oferta aleatoria
	var profile = agent.profile;
	//console.log(profile);
	var offer = {};
	for (feature in profile) {
		var type = profile[feature].type;
		var value = null;
		if (type == "list") {
			var list = profile[feature].list;
			value = list[Math.floor(Math.random()*list.length)];
		} else if (type == "range") {
			var range = profile[feature].range;
			value = range[0] + Math.random()*(range[1] - range[0]);
		} else {
						console.log(feature);

			alert("Value not found!"+type);
		}
		offer[feature] = value;
	}
	return offer;
}