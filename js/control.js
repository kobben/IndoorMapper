/**
 * Created by barendkobben on 02/12/16.
 */

var margins = 10;
var SVGwidth = window.innerWidth - (margins * 2),
    SVGheight = window.innerHeight - (margins * 2);

// CAD  coord system bounds:
var minx = 4000;
var miny = 4200;
var maxx = 97000;
var maxy = 80200;

var dataHeight, dataWidth;
var floordata, scale, y_offset, x_offset, mapDiv, mapSVG;


// var curLoc =  //GeoJSON point object
//     { "type": "Feature",
//         "geometry": {"type": "Point", "coordinates": [50000, 40000]},
//         "properties": {"timestamp": new Date()}
//     }
var curLoc;
var locationLayer;
var v; // for the refresh cycle

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
    mapDiv = d3.select("body");
    // d3.json("./data/floor0.topojson", function(json) {
    //     floordata=topojson.feature(json, json.objects.floor0).features;
    //     fitToBox(floordata);
    // });
    d3.json("./data/floor1.json", function (json) {
        floordata = json.features;
        fitToBox(floordata);
    	showLocation();
    });


}

function fitToBox(pathData) {
    if (mapSVG != null) {
        mapSVG.remove();
    }
    mapSVG = mapDiv.append("svg")
        .attr("id", "theMapSVG")
        .attr("width", SVGwidth)
        .attr("height", SVGheight)
        .on("click", function (d) {
            doLocate(d)
        })
    ;
    dataHeight = maxy - miny;
    dataWidth = maxx - minx;
    SVGwidth = window.innerWidth - (margins * 2);
    SVGheight = window.innerHeight - (margins * 2);
    //choose scale that fills box
    xscale = SVGwidth / dataWidth;
    yscale = SVGheight / dataHeight;
    scale = Math.min(xscale, yscale);
    y_offset = (maxy * scale);
    x_offset = (minx * scale);
    projTransform = AffineTransformation(scale, 0, 0, -scale, x_offset, y_offset);
    // projTransform = d3.geoIdentity()
    //     .fitSize([SVGwidth,SVGheight],pathData)
    // ;
    var projectedPath = d3.geoPath()
        .projection(projTransform);
    // mapSVG.selectAll("path")
    //     .data(pathData)
    //     .enter().append("path")
    //     .attr("class", "cadline")
    //     .attr("d", projectedPath)
    // ;
    mapSVG.append("path")
        .datum({type: "FeatureCollection", features: pathData})
        .attr("class", "cadline")
        .attr("d", projectedPath)
    ;
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

function doLocate(d) {
    var cX = d3.event.pageX - 8; //TODO:  -8 to account for strange shift in click X??
    var cY = d3.event.pageY;
    var XY = ReverseAffineTrans([cX, cY]);
    curLoc.properties.timestamp = new Date();
    curLoc.geometry.coordinates = XY;
    var theCircle = d3.selectAll(".location")
    	.attr("cx", AffineTrans(curLoc.geometry.coordinates)[0])
        .attr("cy", AffineTrans(curLoc.geometry.coordinates)[1])
        ;
    console.log(curLoc.geometry.coordinates);
    window.location = "updateLoc.py?x="
        + (curLoc.geometry.coordinates)[0] + "&y="
        + (curLoc.geometry.coordinates)[1]+ "&t="
        + curLoc.properties.timestamp 
        ;
}

function showLocation() {
    if (locationLayer != null) {
        locationLayer.remove();
    }
    v++; //to force reloading of json
    var URL = "./data/curLoc.json?v=" + v;
    d3.json(URL, function (json) {
        curLoc = json;
        locationLayer = mapSVG.append("circle")
            .attr("id", "curLoc")
            .attr("class", "location")
            .attr("r", 10)
            .attr("cx", AffineTrans(curLoc.geometry.coordinates)[0])
            .attr("cy", AffineTrans(curLoc.geometry.coordinates)[1])
        ;
    });
}