// Set hosts and ports
const host = "http://127.0.0.1:"
const ports = [8081,8082,8083,8084,8085]
var urls = []
// boolean displaying whether the simulation is currently playing
var playing = false;
// Id used for the callback function
var intervalID = undefined;
// Array for tracking inputs tagged as invalids
var invalidInputs = []
// Array storing the pendulum masses for display purpose
var masses = []



document.getElementById("body").onload = () => {

	// Set our urls for easier request building
	ports.forEach((port) => {
		urls.push(host + port)
	})

	// Repeat the first form content to the 4 others
	paramForms = document.getElementsByClassName("paramsForm");
	for (i = 2; i <= 5; i++) {
	  document.getElementById('paramsForm' + i).innerHTML = document.getElementById('paramsForm1').innerHTML;
	}

	// Change the form values so that the default configuration is valid
	for (i = 2; i <= 5; i++) {
	  var elems = document.getElementById('paramsForm' + i).elements;
	  for (let j=0; j < elems.length; j++) {
		elems[j].value = parseInt(elems[j].value) + (i-1)*10;
	  }
	}
	

};



// Submit the 5 forms
submitButton.onclick = async (e) => {
	
	// Stop the simulation
	pauseButton.onclick()
	
	// Clear fields previously marked as invalid
	while (invalidInputs.length > 0) {
		let elem = invalidInputs.pop()
		elem.style="border-color:"
	}
	
	// Get the max_wind parameter
	var max_wind = document.getElementById('windForm').elements[0]
	if (max_wind.checkValidity() == false) {
		return
	}
	
	// For each form...
	var formsData = []
    for (i = 1; i <= 5; i++) {
		// Fetch the parameters values
		var form = document.getElementById('paramsForm' + i)
		var data = {}
		for (j = 0; j < form.elements.length; j++) {
			const elem = form.elements[j]
			// check that all input are legals
			if (elem.checkValidity() == false) {
				return
			}
			// store the mass for display purpose
			if (elem.name=="mass") {
				masses[i-1] = elem.value
			}
			data[elem.name] = elem.value
		}
		// Add in the max wind factor
		data["maximum_wind_factor"] = max_wind.value;
		formsData.push(data);
	}
	
	// Check if two neighbours have the same parameters
	for (i = 2; i <= 5; i++) {
		var form = document.getElementById('paramsForm' + i)
		var prevForm = document.getElementById('paramsForm' + (i-1))
		for (j = 0; j < 3; j++) {
			if (form.elements[j].value == prevForm.elements[j].value) {
				form.elements[j].style="border-color:red"
				prevForm.elements[j].style="border-color:red"
				invalidInputs.push(form.elements[j])
				invalidInputs.push(prevForm.elements[j])
				return
			}
		}
	}
	
	
	// Send the post request with the form data to each server
	var responses = [];
	for (i = 1; i <= 5; i++) {
		postForm(formsData[i-1], i)
	}
	
	// Enable the correct controls
	document.getElementById('pauseButton').disabled = true;
	document.getElementById('playButton').disabled = false;
};


// Send the post request with the form data
// This part of the code has it own function to make sure the asynchronous thread executes correctly
async function postForm(formData, pendulumNumber) {
	var response = await fetch(urls[pendulumNumber-1] + "/parameters", {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(formData)
		});
		let result = await response.json();
			
		// Draw the starting position of the pendulum
		if (result != undefined) {
			printPendulum(result.x_position, result.y_position, pendulumNumber)
		}
		// Reset wind display
		printWind(0)	
}

// Save configuration as a .json file
saveButton.onclick = async (e) => {
	// For each form
	var formsData = {}
    for (i = 1; i <= 5; i++) {
		// Fetch the parameters values
		var form = document.getElementById('paramsForm' + i)
		var data = {}
		for (j = 0; j < form.elements.length; j++) {
			data[form.elements[j].name] = form.elements[j].value;
		}
		// Add in the max wind factor
		data["maximum_wind_factor"] = document.getElementById('windForm').elements[0].value;
		formsData["pendulum" + i] = data;
	}
	
	// Create a json string from the data
	json = JSON.stringify(formsData, null, 1)
	// Create a file from the string
	var data = new Blob([json], {type: 'application/json'});
	var url = window.URL.createObjectURL(data);
	
	// A strange method, but it works !
	// Create a download link
	let a = document.createElement('a')
	a.style.visibility = "hidden"
	// Set it to our new file
	a.href = url
	a.download = "configuration.json"
	// Click on it, then remove it
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)



}

playButton.onclick = async (e) => {
	if (playing == false) {
		
		// Play the simulation and set the actualisation function
		playing = true;
		intervalID = setInterval(getInfo, 100); // 0.1 second between two frames
		
		// Switch the pause/play button status
		document.getElementById('playButton').disabled = true;
		document.getElementById('pauseButton').disabled = false;
		
		// Send the play request to all five servers
		for (i = 1; i <= 5; i++) {
			let response = await fetch(urls[i-1] + "/simulation/play", {
				method: 'POST'
			});
		}
	}
}

// Function called by the pause button
pauseButton.onclick = async (e) => {
	if (playing == true) {
		
		// Pause the simulation and stop the actualisation function
		playing = false;
		clearInterval(intervalID);
		
		// Switch the pause/play button status
		document.getElementById('pauseButton').disabled = true;
		document.getElementById('playButton').disabled = false;
		
		// Send the pause request to all five servers
		for (i = 1; i <= 5; i++) {
			let response = await fetch(urls[i-1] + "/simulation/pause", {
				method: 'POST'
			});
		}
	}
}

// Callback function for setInterval
// It may seems simple, but it allows us to call the getPosition method asynchronously for each pendulum
async function getInfo() {
	for (i = 1; i <= 5; i++) {
		getPosition(i);
	}
}

// Fetch the position of a specified pendulum and call the drawing method at its coordinates
async function getPosition(pendulumNumber) {

	// Send the get position request and await its result
	let response = await fetch(urls[pendulumNumber-1] + "/position", {
		method: 'GET'
	});
	let result = await response.json();
	
	// If the simulation has been paused since the request was sent, ignore the response
	if (playing == false) {
		return
	}
	
	// If we've received a correct response, display the pendulum
	if (result != undefined) {
		printPendulum(result.x_position, result.y_position, pendulumNumber)
	}
	
	// Display the wind factor
	// Due to the wind factor being shared across the pendulums, we only need to do this for one of them
	if (pendulumNumber == 1 && result != undefined) {
		printWind(result.wind_factor)
	}
}

// Draw the pendulum on one of the 5 simulation canvas
function printPendulum(x,y, pendulumNumber) {
	
	// Get canvas information
    canvas = document.getElementById("canvas" + pendulumNumber);
    ctx = canvas.getContext("2d");
	var height = canvas.height; var width = canvas.width;
	
	// Set pendulum radius according to its mass
	var radius = masses[pendulumNumber-1] /5
	
	// Make coordinates html-friendly
    elem_x = width/2 + x

	// Clear previous drawing
    ctx.clearRect(0,0, width, height);
	
    // Draw the pendulum line
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(elem_x, y);
    ctx.stroke();
    ctx.closePath();
	
    // Draw the pendulum disc
    ctx.beginPath();
    ctx.arc(elem_x, y, radius, 0, Math.PI*2, false);
	ctx.fillStyle ='gold';
    ctx.fill();
    ctx.closePath();
}

// Draw the arrow displaying the wind direction and strength on the wind-o-meter canvas
function printWind(windFactor) {
	
	// Get canvas information
	canvas = document.getElementById("wind-o-meter");
	ctx = canvas.getContext("2d");
	var height = canvas.height; var width = canvas.width;
	
	// Make coordinates html-friendly
	wind_x_pos = width/2 + windFactor/100 * width/2;
	
	// Set the arrow direction and size
	var arrow_dir;
	if (windFactor > 0) {
		arrow_dir = 1
	} else {
		arrow_dir = -1
	}
	var arrow_size = Math.abs(windFactor) / 10
	
	// Clear previous drawing
	ctx.clearRect(0,0, width, height);
	
	// Draw the arrow shaft
	ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(width/2, height/2);
    ctx.lineTo(wind_x_pos, height/2);
    ctx.stroke();
    ctx.closePath();
	
	// Draw the arrow head
	ctx.beginPath();
	ctx.moveTo(wind_x_pos, height/2);
    ctx.lineTo(wind_x_pos - arrow_dir * arrow_size, height/2 + arrow_size);
	ctx.lineTo(wind_x_pos - arrow_dir * arrow_size, height/2 - arrow_size,);
	ctx.lineTo(wind_x_pos, height/2);
    ctx.fill();
    ctx.closePath();
}