//In producton, the apiKey should not be exposed like this. It should be stored in a .env file
const apiKey = "4b682881";

//Global variable for paginated API calls
let page = 1;

//Adds event listeners
function init() {
	// get the necessary elements

	const mainNav = document.getElementById("mainNav");
	const botonBuscar = document.getElementById("botonBuscar");
	const botonReset = document.getElementById("botonReset");

	//Adds change filter functionality to the main navigation
	mainNav.querySelectorAll("li").forEach((li) => {
		li.addEventListener("click", cambiarFiltro);
	});

	//Adds search functionality to the search button
	botonBuscar.addEventListener("click", buscar);
	//Adds reset functionality to the reset button
	botonReset.addEventListener("click", reset);
}

// Function to change the filter
function cambiarFiltro() {
	// Remove 'seleccionado' class from all li elements
	mainNav.querySelectorAll("li").forEach((li) => {
		li.classList.remove("seleccionado");
	});

	// Add 'seleccionado' class to the clicked li element
	this.classList.add("seleccionado");

	// Get the value from the dataset and store it in the 'tipo' variable
	tipo = this.dataset.tipo;

	// Clear the list of searched contents in the aside
	const listado = document.getElementById("listado");
	listado.innerHTML = "";
}

function reset() {
	// Clear the list of searched contents in the aside
	const listado = document.getElementById("listado");
	listado.innerHTML = "";

	// reseet the page number to 1
	page = 1;
}

async function buscar(e) {
	// Prevent the default behavior of the form to avoid page reload
	e.preventDefault();

	//reset page number to 1 is needed for edge cases where the user does not reset before performing a new search. If they then click "Cargar más", the page number will be incorrect
	page = 1;

	// Clear the list
	const listado = document.getElementById("listado");
	listado.innerHTML = "";

	// Get the search input value and remove preceding and trailing whitespaces
	const buscador = document.getElementById("buscador").value.trim();

	// Check if search input is empty
	if (buscador === "") {
		alert("Please enter a search term");
		return;
	}

	// Get the selected type
	const tipoSeleccionado = document.querySelector("#mainNav .seleccionado");
	const tipo = tipoSeleccionado ? tipoSeleccionado.dataset.tipo : "";

	// Construct the API URL
	const url = `http://www.omdbapi.com/?apikey=${apiKey}&s=${buscador}&type=${tipo}&page=1`;

	// Call the loadData function to fetch data from the API
	try {
		const data = await loadData(url);

		// Render the list of contents in the aside
		renderLista(data);
	} catch (error) {
		console.log(error);
	}
}

// Asynchronous function to fetch data from the API. Returns an object with the total number of records and a list of contents. If no results are found, it returns an empty list.
async function loadData(url) {
	try {
		//will be returned empty if no results are found
		let totales = 0;
		let lista = [];

		const response = await fetch(url);

		// Check if the response is not ok
		if (!response.ok) {
			console.log("No results found");
			return { totales, lista };
		}

		// Parse the response to JSON
		const data = await response.json();

		// Check if data.Search exists and is not empty
		if (data.Search && data.Search.length > 0) {
			// Map through the list and convert first letter of each key to lower case so that it matches the Contenido object properties
			lista = data.Search.map((content) => {
				const newContent = {};
				for (const key in content) {
					const newKey = key.charAt(0).toLowerCase() + key.slice(1);
					newContent[newKey] = content[key];
				}
				return newContent;
			});

			// Convert the list of contents to an array of Contenido objects
			lista = lista.map((content) => new Contenido(content));
		}

		// Get the total number of records
		totales = data.totalResults;

		// Return an object literal with the totales and lista

		return { totales, lista };
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
}

function renderLista(data) {
	const listado = document.getElementById("listado");

	// Get the list of contents from the data object
	const list = data.lista;

	if (list.length === 0) {
		// Create a div with "no-content" class and "No hay contenidos" text
		const noContentDiv = document.createElement("div");
		noContentDiv.classList.add("no-content");
		noContentDiv.textContent = "No hay contenidos";
		listado.appendChild(noContentDiv);

		//Eearly return to prevent further execution and improve readability by avoiding having to use an else block
		return;
	}

	// Check if ul element already exists inside listado. If it doesn't, create and add it.
	let listadoUl = listado.querySelector("ul");
	if (!listadoUl) {
		listadoUl = document.createElement("ul");
		listado.appendChild(listadoUl);
	}

	// Check if ul element already exists inside seleccionados. If it doesn't, create and add it.
	const seleccionados = document.getElementById("seleccionados");
	let seleccionadosUl = seleccionados.querySelector("ul");
	if (!seleccionadosUl) {
		seleccionadosUl = document.createElement("ul");
		seleccionados.appendChild(seleccionadosUl);
	}

	// Sort the contents by year
	list.sort((a, b) => a.year - b.year);

	// Loop through the contents and create li elements
	list.forEach((content) => {
		const li = document.createElement("li");

		li.textContent = `${content.title}, ${content.year}, ${content.type} `;

		// Create a button with "Seleccionar" text
		const button = document.createElement("button");
		button.textContent = "Seleccionar";

		// Add click event listener to the button
		button.addEventListener("click", () => {
			seleccionContenido(content);
		});

		// Append the button to the li element
		li.appendChild(button);

		// Append the li element to the ul element
		listadoUl.appendChild(li);
	});

	// Check if the "Cargar más" button already exists in the listado element
	// Add the button only if there are more results to load and it doesn't already exist
	let cargarMasButton = listado.querySelector("#cargarMasButton");
	if (!cargarMasButton && data.totales > list.length) {
		// Create a button with "Cargar más" text to allow pagination
		cargarMasButton = document.createElement("button");
		cargarMasButton.id = "cargarMasButton"; // Add unique id
		cargarMasButton.textContent = "Cargar más";

		// Add click event listener to the button
		cargarMasButton.addEventListener("click", cargarMasContenidos);

		// Append the button to the listado element
		listado.appendChild(cargarMasButton);
	}
}

function seleccionContenido(content) {
	const seleccionados = document.getElementById("seleccionados");
	//select the ul element
	const ul = seleccionados.querySelector("ul");

	// Check if the content already exists in the list
	const exists = seleccionados.querySelector(`li[data-id="${content.imdbID}"]`);

	if (exists) {
		console.log("Content already selected");
		return;
	}

	// Create a li element
	const li = document.createElement("li");

	// Set the data-id attribute to the imdbID of the content
	li.setAttribute("data-id", content.imdbID);

	// Set the text content of the li element
	li.textContent = `${content.title}, ${content.type}, ${content.year}`;

	// Create a button with "Eliminar" text
	const button = document.createElement("button");
	button.textContent = "Eliminar";

	// Add the poster image to the li element;
	const img = document.createElement("img");

	// Check if the content has a poster. If not, set a default image to sin-imagen.jpg
	if (content.poster === "N/A") {
		img.src = "sin-imagen.jpg";
	} else {
		img.src = content.poster;
	}

	li.appendChild(img);

	// Add click event listener to the button
	button.addEventListener("click", () => {
		ul.removeChild(li);
	});

	// Append the button to the li element
	li.appendChild(button);

	//append the li element to the ul element
	ul.appendChild(li);
}

//Async function to load more contents
async function cargarMasContenidos() {
	//increment the page number on each successive call
	page++;

	// Get the search input value
	const buscador = document.getElementById("buscador").value.trim();

	// Get the selected type
	const tipoSeleccionado = document.querySelector("#mainNav .seleccionado");
	const tipo = tipoSeleccionado ? tipoSeleccionado.dataset.tipo : "";

	// Construct the API URL
	const url = `http://www.omdbapi.com/?apikey=${apiKey}&s=${buscador}&type=${tipo}&page=${page}`;

	// Call the loadData function to fetch data from the API asynchronously
	const data = await loadData(url);

	// Render the list of contents in the aside
	renderLista(data);
}

//init must be called at the end of main.js
init();

/**Suggestions for improved UX**/
// 1. The cargarMasContenidos function should be called when the user scrolls to the bottom of the page. This way, the user does not have to click the "Cargar más" button to load more content.
// 2. The cargar más button should be removed when there are no more results to load. This would also prevent unncessary API calls.

/**Suggestions for improved code quality**/
// 1. renderLista function can be refactored to be more modular. it currently has too many responsibilities, which can make it hard to understand and maintain.

/** Other considerations **/
// 1. CSS styling can be improved to closer match the images provided in the examples, but the intrunctions did not specify the need for this.
