module.exports = {
	
    // Booleans tracking if the simulation is initialized, and the playing/paused status
	initialized: false,
	playing: false,
	
	// Parameters of the simulation
    initial_angular_offset : undefined,
    mass : undefined,
    string_length : undefined,
    maximum_wind_factor : undefined,
	
	// Simulation values
	x_position: undefined,
	y_position: undefined,
	angular_offset: undefined,
	wind_factor: undefined,
	
	// Simulation variables
	omega : 0,
	alpha : 0,
	prev_alpha : 0,
	
	// In which direction is the wind changing
	wind_change_direction : 0,
	// Seed for the random generation used in wind calculation
	random_seed :0,
	
	// Initialization routine
	initialize: function() {
		this.wind_factor = 0
		this.angular_offset = this.initial_angular_offset
		this.x_position = Math.sin(this.initial_angular_offset/180*Math.PI)*this.string_length
		this.y_position = Math.cos(this.initial_angular_offset/180*Math.PI)*this.string_length
		this.omega = 0
		this.alpha = 0
		this.prev_alpha = 0
		// Initialize the random seed according to the current time
		// The random synchronisation will thus work if all servers initialize at the same second, which is a reasonnable assumption to make
		date = new Date()
		this.random_seed = date.getSeconds() + date.getMinutes() *60
		this.playing= false
		this.initialized = true
		console.log("Initialized at (" + this.x_position + "," + this.y_position + "), " + this.angular_offset + "°")
	},
	
	// Main simulation loop
	simulationLoop: function () {
		// Save the execution context to access the local variables
		var sim = this
		setInterval(() => {
			if (this.playing == true) { 
				updateSimulation(sim)
			}
		}, 100); // 0.1 second
	}
}

// Set how fast "time" is passing in our simulation
const DELTA_T = 0.05

// Run one frame of our simulation
// Yeah, this function is a bit dense, but it should make sense
function updateSimulation(sim) {
	
	/// Update wind factor
	
	// If no wind has been set, start in a random incrementation direction
	if (sim.wind_change_direction == 0) {
		// Return either 1 or -1
		sim.wind_change_direction = (Math.round(random(sim)) * 2) - 1;
		
	// If wind has been set, there's a random chance (1/40) to change the incrementation direction
	} else if (random(sim) > 0.975) {
		sim.wind_change_direction *= -1
	}
	// Update the wind factor
	sim.wind_factor += sim.wind_change_direction
	// Keep the wind factor within its boundaries
	if (Math.abs(sim.wind_factor) > sim.maximum_wind_factor) {
		sim.wind_factor = sim.maximum_wind_factor * sim.wind_factor/Math.abs(sim.wind_factor)
	}
	
	
	/// Update pendulum physics
	
	// Update angular offset according to angular velocity and acceleration
	var dtheta = sim.omega * DELTA_T + (sim.alpha * DELTA_T * DELTA_T /2)
	sim.angular_offset = parseFloat(sim.angular_offset) + parseFloat(dtheta/Math.PI*180) // Unintuitively, the parseFloat here is needed. Without it, this line returned 90 + 0 = 900.
	if (Math.abs(sim.angular_offset) > 90) {
		sim.angular_offset = 90 * sim.angular_offset/Math.abs(sim.angular_offset)
	}
	
	// update angular acceleration by calculating forces
	// If you're an engineer in physics, you may want to look away
	sim.prev_alpha = sim.alpha
	var wind_force = sim.wind_factor * Math.cos(sim.angular_offset/180*Math.PI) // After many tests, directly pluging the wind_factor as a force gave the best results
	var force = sim.mass * 9.81 * -Math.sin(sim.angular_offset/180*Math.PI) + wind_force
	sim.alpha =  force / (sim.mass * sim.string_length /500 )
	
	// update angular velocity by averaging acceleration since last frame
	sim.omega += 0.5 * (sim.alpha + sim.prev_alpha) * DELTA_T

	// update cartesian position
	sim.x_position = Math.sin(sim.angular_offset/180*Math.PI)*sim.string_length
	sim.y_position = Math.cos(sim.angular_offset/180*Math.PI)*sim.string_length
}


// As javascript and node js don't contain default seeded random number generators, her is a very minimal one
// Should the random generation play a bigger role in the application, a more reliable one should be considered
// Source : https://webdevdesigner.com/q/seeding-the-random-number-generator-in-javascript-27936/
function random(sim) {
    var x = Math.sin(sim.random_seed++) * 10000;
    return x - Math.floor(x);
}