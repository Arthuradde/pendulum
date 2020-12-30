const express = require('express')
const bodyParser  = require('body-parser');
const cors = require('cors');
const app = express()
var os = require('os')
var fs = require('fs')
var port = 8080
const host = '127.0.0.1'

var simulation = require('./simulation.js');

// Get the port number from the arguments, if applicable
arg = process.argv.slice(2)[0]
if (!isNaN(arg)) {
	if (0 < arg && arg < 65536){
		port = arg;
	}
}
console.log("Starting server on port " + port);

// Middlewares helping to manage requests
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Ping request
app.get('/', (req, res) => {
	res.send('Hello World!')
})


// Get and post request, more info in the doc
app.get('/position', (req, res) => {
	// Check if the initial parameters are set
	if (simulation.initialized == false) {
		res.status(500).send("Simulation not initialized, parameters must be set first")
	} else {
		// If they are, send the simulation data in the response body
		res.json({
			x_position: simulation.x_position,
			y_position: simulation.y_position,
			angular_offset: simulation.angular_offset,
			wind_factor: simulation.wind_factor
		})
	}
})

app.post('/parameters', (req, res) => {
	// Fetch data from the request
	var data = req.body
	
	// Set simulation parameters accordingly
	// TODO : parameters check
	simulation.initial_angular_offset = data.initial_angular_offset
	simulation.mass = data.mass
	simulation.string_length = data.string_length
	simulation.maximum_wind_factor = data.maximum_wind_factor
	
	// Initialize the simulation
	simulation.initialize()
	
	// Send back the intial positions
	res.json({
			x_position: simulation.x_position,
			y_position: simulation.y_position,
			angular_offset: simulation.angular_offset,
			wind_factor: simulation.wind_factor
		})
	//res.status(200).send("Parameters received !")
})

app.post('/simulation/play', (req, res) => {
	// Check if the initial parameters are set
	if (simulation.initialized == false) {
		res.status(500).send("Simulation not initialized, parameters must be set first")
	} else {
		simulation.playing = true
	}
	res.status(200).send('Simulation playing')
})

app.post('/simulation/pause', (req, res) => {
	// Check if the initial parameters are set
	if (simulation.initialized == false) {
		res.status(500).send("Simulation not initialized, parameters must be set first")
	} else {
		simulation.playing = false
	}
	res.status(200).send('Simulation paused')
})

app.post('/pythonScript', (req, res) => {
	// Fetch data from the request
	var data = req.body
	// Build the assignation lines for the parameters
	var content = "initial_angular_offset = " + data.initial_angular_offset + os.EOL + "mass = " + data.mass + os.EOL + "string_length = " + data.string_length + os.EOL + "maximum_wind_factor = " + data.maximum_wind_factor + os.EOL

	// Read the rest of the python template
	file = fs.readFileSync("./template.py", "utf8")
	
	// Concatenate the two
	content += file
	
	// Write the result in a python file
	fs.writeFileSync("simulation.py", content)
	
	res.status(200).send("")
})

// Start the server on the specified port, and launch the main loop
app.listen(port, host, () => {
	simulation.simulationLoop()
})