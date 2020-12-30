function functi() {
	const form = document.querySelector('#signup-form');


	form.addEventListener('submit', (event) => {

		// disable default action
		event.preventDefault();

		// configure a request
		const xhr = new XMLHttpRequest();
		xhr.open('POST', 'localhost:8080');

		// prepare form data
		let data = new FormData(form);

		// set headers
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

		// send request
		xhr.send(data);

		// listen for `load` event
		xhr.onload = () => {
			console.log(xhr.responseText);
		}
		
	});
}



function loadDoc() {
  var xhttp = new XMLHttpRequest();
  var url = "http://127.0.0.1:8080/";
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
     document.getElementById("demo").innerHTML = this.responseText;
    }
  };
  xhttp.open("POST", url, true);
  //xhttp.setRequestHeader("Access-Control-Allow-Origin", "*")
  xhttp.setRequestHeader("Content-Type", "multipart/form-data")
  //document.getElementById("Malfunctions").value
  var data = new FormData("signup-form");

  xhttp.send(data);
}