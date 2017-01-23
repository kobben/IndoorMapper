/**
 * Created by barendkobben on 02/12/16.
 */

//start by taking initial ones. Will be recalculated later
var margins = 0;
var mySVGwidth, mySVGheight;

// CAD  coord system bounds.
// Fixed globally to ensure unity over the different floorplans:
var minx = 3800;
var miny = 4000;
var maxx = 105000;
var maxy = 84000;

var scale, scaleFactor;
var y_offset, x_offset;
var keepCentered;

var projectedPath;
var mapDiv, mapSVG;
var fl0data, fl1data, fl2data, fl3data, floordata;
var fl0pntdata, fl1pntdata, fl2pntdata, fl3pntdata, floorpntdata;
var floorLayer, floorpntLayer, textLayer, locationLayer;
var curLoc = [(maxx - minx) / 2, (maxy - miny) / 2]; //center of data;
var curFloor = 0;
var floorNrElem;

var timer; // for the refresh cycle
var webSockConn;

// AffineTransformation as a basic pseudo-projection of CAD coords to screen coords
// http://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
function AffineTransformation(a, b, c, d, tx, ty) {
	return {
		//overrides normal D3 projection stream (to avoid adaptive sampling)
		stream: function (output) {
			return {
				point: function (x, y) {
					output.point(a * x + b * y + tx, c * x + d * y + ty);
				},
				sphere: function () {
					output.sphere();
				},
				lineStart: function () {
					output.lineStart();
				},
				lineEnd: function () {
					output.lineEnd();
				},
				polygonStart: function () {
					output.polygonStart();
				},
				polygonEnd: function () {
					output.polygonEnd();
				}
			};
		}
	};
}


function init() {

	// *** WEBSOCKET STUFF ****
	// ************************
	// webSockConn = new WebSocket('ws://kartoweb.itc.nl:8080/locate');
	webSockConn = new WebSocket('ws://localhost:8080/locate');


	// When the webSockConn is open, send some data to the server
	webSockConn.onopen = function () {
		console.log("Opened webSockConn: " + webSockConn.url);
	};
	// Log errors
	webSockConn.onerror = function (error) {
		console.log('WebSocket Error: ' + error);
		alert('WebSocket Error: ' + error);
	};
	// Log messages from the server
	webSockConn.onmessage = function (e) {
		console.log('Server: ' + e.data);
		showLocation(e.data);
	};
	// ************************


	// load data
	d3.json("./data/fl0.geojson", function (json) {
		fl0data = json.features;
		d3.json("./data/fl1.geojson", function (json) {
			fl1data = json.features;
			d3.json("./data/fl2.geojson", function (json) {
				fl2data = json.features;
				d3.json("./data/fl3.geojson", function (json) {
					fl3data = json.features;
					d3.json("./data/fl0p.geojson", function (json) {
						fl0pntdata = json.features;
						d3.json("./data/fl1p.geojson", function (json) {
							fl1pntdata = json.features;
							d3.json("./data/fl2p.geojson", function (json) {
								fl2pntdata = json.features;
								d3.json("./data/fl3p.geojson", function (json) {
									fl3pntdata = json.features;


									floorNrElem = document.getElementById("floorNr");
									floorNrElem.style.opacity = .9;


									keepCentered = true;
									scaleFactor = 1.5;
									setProjection();

									mapDiv = d3.select("#mapDiv");
									mapSVG = mapDiv.append("svg")
										.attr("id", "theMapSVG")
										.attr("width", mySVGwidth)
										.attr("height", mySVGheight)
									;

									LoadAndDrawFloor(curFloor);

									if (webSockConn.readyState !== 1) {
										var errorStrs = ["The connection is not yet open.",
											"The connection is open and ready to communicate.",
											"The connection is in the process of closing.",
											"The connection is closed or couldn't be opened."
										];
										console.log("Websocket error: " + errorStrs[webSockConn.readyState]);
										alert("Websocket error: " + errorStrs[webSockConn.readyState]);
										return
									}
									// set up timer to do showLocation every X milliseconds
									timer = setInterval(getLocation, 1000);
								});
							});
						});
					});
				});
			});
		});
	});
}

function resizeWindow() {
	setProjection()
	mapSVG.attr("width", mySVGwidth)
		.attr("height", mySVGheight)
	;
	drawMap();
}


function LoadAndDrawFloor(floor) {

	if (floor == 0) {
		floordata = fl0data;
		floorpntdata = fl0pntdata;
	} else if (floor == 1) {
		floordata = fl1data;
		floorpntdata = fl1pntdata;
	} else if (floor == 2) {
		floordata = fl2data;
		floorpntdata = fl2pntdata;
	} else if (floor == 3) {
		floordata = fl3data;
		floorpntdata = fl3pntdata;
	} else {
		alert("Cannot load floor nr. " + floor);
	}


	if (mapSVG != null) {
		mapSVG.remove();
		mapSVG = mapDiv.append("svg")
			.attr("id", "theMapSVG")
			.attr("width", mySVGwidth)
			.attr("height", mySVGheight)
		;
	}

	floorLayer = mapSVG.selectAll("path")
		.data(floordata).enter().append("path")
		.attr("class", function (d) {
			if (d.properties.FuncName != null) {
				return d.properties.FuncName;
			} else {
				return "generic";
			}
		})
		.attr("d", projectedPath)
	;
	textLayer = mapSVG.selectAll("text")
		.data(floordata.filter(function (d) {
			return d.properties.FuncName == "lectureroom" || d.properties.FuncName == "office";
		}))
		.enter().append("text")
		.text(function (d) {
			return d.properties.RUIMTE_NUM;
		})
		.attr("class", "roomnr")
		.attr("text-anchor", "middle")
		.attr("x", function (d) {
			return projectedPath.centroid(d)[0];
		})
		.attr("y", function (d) {
			return projectedPath.centroid(d)[1];
		})
	;
	floorpntLayer = mapSVG.selectAll("image")
		.data(floorpntdata.filter(function (d) {
			return d.properties.FuncName == "stairs" ||
				d.properties.FuncName == "elevator" ||
				d.properties.FuncName == "mentoilet" ||
				d.properties.FuncName == "womentoilet" ||
				d.properties.FuncName == "locker" ||
				d.properties.FuncName == "printer" ||
				d.properties.FuncName == "reception" ||
				d.properties.FuncName == "automaticdoor" ||
				d.properties.FuncName == "sittingarea" ||
				d.properties.FuncName == "coffeemachine" ||
				d.properties.FuncName == "restaurant" ||
				d.properties.FuncName == "postbox" ||
				d.properties.FuncName == "lockeddoor"
				;
		}))
		.enter().append("image")
		.attr("xlink:href", function (d) {
			var imgURL = "./img/" + d.properties.FuncName + ".png";
			console.log(imgURL);
			return imgURL;
		})
		.attr("x", function (d) {
			return projectedPath.centroid(d)[0] - 10;
		})
		.attr("y", function (d) {
			return projectedPath.centroid(d)[1] - 10;
		})
	;
	locationLayer = mapSVG.append("circle")
		.attr("id", "curLoc")
		.attr("class", "location")
		.attr("r", 10)
		.attr("cx", AffineTrans(curLoc)[0])
		.attr("cy", AffineTrans(curLoc)[1])
	;

}

function drawMap() {
	floorLayer
		.attr("d", projectedPath);
	textLayer
		.attr("x", function (d) {
			return projectedPath.centroid(d)[0];
		})
		.attr("y", function (d) {
			return projectedPath.centroid(d)[1];
		})
	;
	floorpntLayer
		.attr("x", function (d) {
			return projectedPath.centroid(d)[0] - 10;
		})
		.attr("y", function (d) {
			return projectedPath.centroid(d)[1] - 10;
		});
	locationLayer
		.attr("cx", AffineTrans(curLoc)[0])
		.attr("cy", AffineTrans(curLoc)[1])
	;
}

function doZoom(percentage) {
	scaleFactor = scaleFactor + (percentage / 100);
	setProjection();
	drawMap();

}


function setProjection() {
	mySVGwidth = window.innerWidth - (margins * 2);
	mySVGheight = window.innerHeight - (margins * 2);
	var dataHeight = maxy - miny;
	var dataWidth = maxx - minx;
	var xscale = mySVGwidth / dataWidth;
	var yscale = mySVGheight / dataHeight;
	scale = Math.min(xscale, yscale) * scaleFactor;
	x_offset = (minx * scale);
	y_offset = (maxy * scale);
	if (keepCentered) {
		x_offset = (minx * scale) - (scale * curLoc[0] + x_offset) + (mySVGwidth / 2);
		y_offset = (maxy * scale) - (-scale * curLoc[1] + y_offset) + (mySVGheight / 2);
	}
	// console.log("O: " + AffineTrans(curLoc) + " , " + x_offset + " , " + y_offset );
	projectedPath = d3.geoPath()
		.projection(AffineTransformation(scale, 0, 0, -scale, x_offset, y_offset));
	// console.log(scale + ", " + x_offset + ", " + y_offset );
}

function AffineTrans(XY) {
	var X = XY[0];
	var Y = XY[1];
	X = scale * X + x_offset;
	Y = -scale * Y + y_offset;
	return [X, Y];
}

function ReverseAffineTrans(xy) {
	var x = xy[0];
	var y = xy[1];
	x = (xy[0] - x_offset) / scale;
	y = -(xy[1] - y_offset) / scale;
	return [x, y];
}


function getLocation() {
	webSockConn.send('giveLocation');
	//should trigger a response, and then a showLocation()
}

function showLocation(locStr) {
	curLoc[0] = +locStr.split(";")[0]; // X
	curLoc[1] = +locStr.split(";")[1]; // Y
	var floorAsked = +locStr.split(";")[2]; // F

	if (floorAsked != curFloor) {
		LoadAndDrawFloor(floorAsked);
	} else {
		setProjection();
		drawMap();
	}
	curFloor = floorAsked;
	floorNrElem.value = curFloor;
}

