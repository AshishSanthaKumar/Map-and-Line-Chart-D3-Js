
var mapSvg;
var lineSvg;
var lineWidth;
var lineHeight;
var lineInnerHeight;
var lineInnerWidth;
var lineMargin = { top: 20, right: 60, bottom: 60, left: 100 };

var mapData;
var timeData;


// This runs when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
  mapSvg = d3.select('#map');
  lineSvg = d3.select('#linechart');
  lineWidth = +lineSvg.style('width').replace('px','');
  lineHeight = +lineSvg.style('height').replace('px','');;
  lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right;
  lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;

  // Load both files before doing anything else
  Promise.all([d3.json('data/africa.geojson'),
               d3.csv('data/africa_gdp_per_capita.csv')])
          .then(function(values){
    
    mapData = values[0];
    timeData = values[1];
   
    drawMap();
  })

});

// Get the min/max values for a year and return as an array
// of size=2. You shouldn't need to update this function.
function getExtentsForYear(yearData) {
  var max = Number.MIN_VALUE;
  var min = Number.MAX_VALUE;
  for(var key in yearData) {
    if(key == 'Year') 
      continue;
    let val = +yearData[key];
    if(val > max)
      max = val;
    if(val < min)
      min = val;
  }
  return [min,max];
}

// Draw the map in the #map svg
function drawMap() {

  // create the map projection and geoPath
  let projection = d3.geoMercator()
                      .scale(400)
                      .center(d3.geoCentroid(mapData))
                      .translate([+mapSvg.style('width').replace('px','')/2,
                                  +mapSvg.style('height').replace('px','')/2.3]);
  let path = d3.geoPath()
               .projection(projection);

  

  // get the selected year based on the input box's value
  
  var year = document.getElementById('year-input').value;
 
  // get the GDP values for countries for the selected year
  let yearData = timeData.filter( d => d.Year == year)[0];
  
  // get the min/max GDP values for the selected year
  let extent = getExtentsForYear(yearData);

  

  
  // get the selected color scale based on the dropdown value
  var colorScale = d3.scaleSequential(d3[d3.select("#color-scale-select").property("value")])
                     .domain(extent);
  
  //draw the map on the #map svg
  let g = mapSvg.append('g');
  g.selectAll('path')
    .data(mapData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('id', d => { return d.properties.name})
    .attr('class','countrymap')
    .style('fill', d => {
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        return 'white';
      return colorScale(val);
    })
    .on('mouseover', function(d,i) {
      console.log('mouseover on ' + d.properties.name);
    })
    .on('mousemove',function(d,i) {
       console.log('mousemove on ' + d.properties.name);
    })
    .on('mouseout', function(d,i) {
       console.log('mouseout on ' + d.properties.name);
    })
    .on('click', function(d,i) {
       console.log('clicked on ' + d.properties.name);
    });
  
  //Legend
   
  d3.select(".legend").remove();
  d3.select(".x-axis").remove();
  d3.select(".lg").remove();
  
  let height = 100;
  let barHeight = 20;
  let width = 200;  

  let axisBottom = g => g
    .attr("class", `x-axis`)
    .attr("transform", `translate(0,${height+400})`)
    .call(d3.axisBottom(axisScale)
      .ticks(width / 40)
      .tickSize(-barHeight))
      .style("font-size","8px");
  
  let axisScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([30, width+30]);
  
  const defs = mapSvg.append("defs");
  
  const linearGradient = defs.append("linearGradient")
      .attr("id", "linear-gradient")
      .attr("class","lg");
  
  linearGradient.selectAll("stop")
    .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color)
    ;
  
  mapSvg.append('g')
    .attr("transform", `translate(0,${height- barHeight+400})`)
    .attr("class","legend")
    .append("rect")
    .attr('transform', `translate(${30}, 0)`)
    .attr("width", width)
    .attr("height", barHeight)
    .style("fill", "url(#linear-gradient)");
    
  mapSvg.append('g')
    .call(axisBottom);
  
}



// Draw the line chart in the #linechart svg for
// the country argument (e.g., `Algeria').
function drawLineChart(country) {

  if(!country)
    return;
  
}

