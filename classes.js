class Contenido {
	constructor(data) {
		console.log("construcor: ", data);
		this.title = data.title;
		this.poster = data.poster;
		this.type = data.type;
		this.year = data.year;
		this.imdbID = data.imdbID;
	}
}

window.Contenido = Contenido;
