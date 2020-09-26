
var mapSvg;
var lineSvg;
var lineWidth;
var lineHeight;
var lineInnerHeight;
var lineInnerWidth;
var lineMargin = { top: 20, right: 60, bottom: 60, left: 100 };
var country;
var mapData;
var timeData;
var gdp;
var div;
var xscale;
var yscale;
var width;
var height;
var valueline;
var selectedCountry;
var countryGdp;



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

  div = d3.select("body").append("div")
     .attr("class", "tooltip-map")
     .style("opacity", 0);

  
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
      d3.select(this).transition()
               .duration('50')
               .attr('opacity', '.85');
          div.transition()
               .duration(50)
               .style("opacity", 1);
          country = d.properties.name;
          gdp = +yearData[d.properties.name];
          div.html("Country: "+country +"<br/> GDP:"+gdp)
               .style("left", (d3.event.pageX + 10) + "px")
               .style("top", (d3.event.pageY - 15) + "px");
               
    })
    .on('mousemove',function(d,i) {
          d3.select(this).transition()
          .duration('50')
          .attr('opacity', '.85');
    div.transition()
          .duration(50)
          .style("opacity", 1);
    country = d.properties.name;
    gdp = +yearData[d.properties.name];
          div.html("Country: "+country+"<br/>GDP:   "+gdp)
               .style("left", (d3.event.pageX + 10) + "px")
               .style("top", (d3.event.pageY - 15) + "px");
    })
    .on('mouseout', function(d,i) {
      d3.select(this).transition()
               .duration('50')
               .attr('opacity', '1');
          div.transition()
               .duration('50')
               .style("opacity", 0);
    })
    .on('click', function(d,i) {
      drawLineChart(d.properties.name);
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

  lineSvg.selectAll("*").remove();
  console.log(timeData);
  countryGdp= timeData.map(function(data){
    if(data[country]==="")
      data[country]="0"

    return {
      "year":parseInt(data["Year"]),
      "GDP":parseInt(data[country])
    }  
  });

  console.log(countryGdp);

var year_min = d3.min(countryGdp, function(d) { return d['year']; })
var year_max = d3.max(countryGdp, function(d) { return d['year']; })
var gdp_min = d3.min(countryGdp, function(d) { return d['GDP']; })
var gdp_max = d3.max(countryGdp, function(d) { return d['GDP']; })

  height = 500;
  margin = ({top: 20, right: 0, bottom: 30, left: 0});

  y = d3.scaleLinear()
    .domain([0, 2e6])
    .range([gdp_min, gdp_max]);

  x = d3.scaleTime()
    .domain([year_min, year_max])
    .range([margin.left, width - margin.right])



 
  if(!country)
    return;
    
}

