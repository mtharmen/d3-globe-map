// TODO: Resize on window change
//       Fix Zoom to reset position

var jsonCallPromise = function(url) {  
  return new Promise((resolve, reject) => {
    d3.json(url, (err, data) => { 
      if (err) {
        reject(err)
      }
      else {
        resolve(data)
      }
    })
  })  
}

const mapUrl = "https://unpkg.com/world-atlas@1/world/110m.json"
const meteorUrl = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json"
  
var mapPromise = jsonCallPromise(mapUrl)
var meteorPromise = jsonCallPromise(meteorUrl)
  
Promise.all([mapPromise, meteorPromise])
          .then(data => {
            [mapData, meteorData] = data
            document.getElementById("chart").onload = makeChart(mapData, meteorData)
          })
          .catch(err => {
            console.log(err)
          })

const makeChart = function(mapData, meteorData, width, height) {

  var width = window.innerWidth
  var height = window.innerHeight
  var scale = Math.sqrt(height*height + width*width) / 4
  scale -= scale/10
  
  // Sorting Meteor Data by mass so smaller meteors are on top of larger ones
  meteorData.features.sort((a,b) => b.properties.mass - a.properties.mass)
  
  // Scale for masses so it translates to size of circle
  var masses = meteorData.features.map(meteor => parseInt(meteor.properties.mass, 10))
  var convertMass = d3.scalePow().exponent(0.4)
                    .domain([d3.min(masses), d3.max(masses)])
                    .range([2,32])
  
  // Setting up SVG
  var svg = d3.select("#chart")
                  .attr("width", width)
                  .attr("height", height)
                .append("svg")
                  .attr("class", "chart-content")
                  .attr("width", "100%")
                  .attr("height", "100%")
  
  // Projection for mapData
  var projection = d3.geoOrthographic()
                        .translate([scale + 50, height / 2])
                        .scale(scale)
  
  var path = d3.geoPath()
                  .projection(projection)
  
  // Dragging functionality modified from http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
  var drag = d3.drag()
              .on("start", dragStartGlobe)
              .on("drag", draggingGlobe)
  
  var p0
  var e0
  
  function dragStartGlobe() {
    p0 = projection.invert(d3.mouse(this))
    // Note: Getting jerky motion if this seemingly redundant assignment isn't here?
    e0 = projection.rotate()
  }
  
  function draggingGlobe() {
    e0 = projection.rotate()
    
    let p1 = projection.invert(d3.mouse(this))
    let e1 = getEulerAngles(p0, p1, e0)
    
    projection.rotate(e1)
    
    svg.selectAll("path.land")
        .attr("d", path)
    
    svg.selectAll("path.meteor")
        .attr("d", path)
  }
  
  // TODO: Temp fix for zoom panning, double click to reset
  function doubleClick() {
    globe.call(zoom.transform, d3.zoomIdentity)
  }

  // Zoom functionality
  var zoom = d3.zoom().scaleExtent([1,6]).on("zoom", zoomed)

  function zoomed() {
    globe.attr("transform", d3.event.transform)
    // To keep width constant
    land.style("stroke-width", 1/d3.event.transform.k)
    meteors.style("stroke-width", 1/d3.event.transform.k)
  }
  
  // Drawing Globe
  var globe = svg.append("g")
  
  globe.append("path")
            .datum({type: "Sphere"})
            .attr("class", "water")
            .attr("d", path)
  
  // Drawing Land
  var land = globe.selectAll(".land")
                      .data(topojson.feature(mapData, mapData.objects.countries).features).enter()
                      .append("path")
                        .attr("class", "land")
                        .attr("d", path)
  // Drawing Meteors
  // http://bl.ocks.org/PatrickStotz/1f19b3e4cb848100ffd7 for variable circle radius      
  path.pointRadius(d => convertMass(d.properties.mass))

  var meteors = globe.selectAll("meteor")
                  .data(meteorData.features).enter()
                  .append("path")
                    .attr("class", "meteor")
                    .attr("d", path)
                    .attr("fill", "red")
                    .attr("opacity", 0.5)
                    .attr("stroke", "white")
                    .attr("stroke-width", 1)
                    .on("mouseover", mouseOver)
                    .on("mousemove", mouseMove)
                    .on("mouseout" , mouseOut)
  
  
  // Tooltip
  var tooltip = d3.select("#chart")
                    .append("div")
                      .attr("class", "tooltip")
                      .style("width", width*0.3 + "px")
                      //.style("height", height - 100 + "px")
                      .style("height", "auto")
                      .style("font-size", 30 + "px")
                      .style("display", "none")
                      .style("opacity", 0)
                      .style("left", "60%")
                      .style("top", "10%")
  
  function formatDate(date) {
    return date.substr(0,4)
  }
  
  function formatInfo(info) {
    let mass = !info.mass ? "N/A" : (info.mass / 1000).toFixed(1) + " kg"
    
    return "Name: "     + info.name + "<br />" +
           "NameType: " + info.nametype + "<br />" +
           "ID: "       + info.id + "<br />" +
           "Mass: "     + mass + "<br />" +
           "Class: "    + info.recclass + "<br />" +
           "Year: "     + formatDate(info.year) + "<br />" +                 
           "Status: "   + info.fall
  }
  
  function mouseOver() {
    tooltip
      .style("display", "inline")
      .transition()
        .duration(100)
        .style("opacity", 1)
  }

  function mouseMove(d) {
    tooltip.html(formatInfo(d.properties))       
  }

  function mouseOut() {
    tooltip
      .transition()
        .delay(1000)
        .duration(500)
        .style("opacity", 0)
    
    tooltip
      .transition()
        .delay(1500)
        .style("display", "none")
  }

  globe.call(drag)
       .call(zoom).on("dblclick.zoom", doubleClick)
}