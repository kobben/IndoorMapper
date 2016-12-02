/**
 * Created by barendkobben on 02/12/16.
 */

var margins = 10;
var SVGwidth = window.innerWidth - (margins * 2), SVGheight = window.innerHeight - (margins * 2);

// CAD  coord system bounds:
var minx = 4000;
var miny = 4200;
var maxx = 97000;
var maxy = 80200;
// use  limits to calculate scale and bounds needed for
// affine transformation of RD coordinates to screen coordinates
var dataHeight = maxy - miny;
var dataWidth = maxx - minx;
var floordata, scale, y_offset, x_offset, mapDiv, mapSVG;

// AffineTransformation as a basic pseudo-projection of RD coords to screen coords
// http://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
function AffineTransformation(a, b, c, d, tx, ty) {
    return {
        //overrides normal D3 projection stream (to avoid adaptive sampling)
        stream: function(output) {
            return {
                point: function(x, y) { output.point(a * x + b * y + tx, c * x + d * y + ty); },
                sphere: function() { output.sphere(); },
                lineStart: function() { output.lineStart(); },
                lineEnd: function() { output.lineEnd(); },
                polygonStart: function() { output.polygonStart(); },
                polygonEnd: function() { output.polygonEnd(); }
            };
        }
    };
}

function init() {
    mapDiv = d3.select("body");
    d3.json("./data/floor0.geojson", function(json) {
        floordata=json;
        fitToBox(floordata);
    });
}

function fitToBox(pathData) {
    if (mapSVG != null) {mapSVG.remove();}
    mapSVG = mapDiv.append("svg")
        .attr("id", "theMapSVG")
        .attr("width", SVGwidth)
        .attr("height", SVGheight)
    ;
    SVGwidth = window.innerWidth - (margins * 2);
    SVGheight = window.innerHeight - (margins * 2);
    //choose scale that fills box
    xscale = SVGwidth/dataWidth;
    yscale = SVGheight/dataHeight;
    scale = Math.min(xscale,yscale);
    y_offset = (maxy * scale);
    x_offset = -(minx * scale);
    var projectedPath = d3.geoPath()
        .projection(AffineTransformation(scale, 0, 0, -scale, x_offset, y_offset));
    mapSVG.selectAll("path")
        .data(pathData.features)
        .enter().append("path")
        .attr("class", "cadline")
        .attr("d", projectedPath)
    ;
}
