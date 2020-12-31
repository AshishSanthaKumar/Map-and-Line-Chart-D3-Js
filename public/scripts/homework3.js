
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
var countryGdp;
var text;



// This runs when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
  mapSvg = d3.select('#map');
  lineSvg = d3.select('#linechart');
  lineWidth = +lineSvg.style('width').replace('px','');
  lineHeight = +lineSvg.style('height').replace('px','');;
  lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right;
  lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;

  // Load both files before doing anything else
  Promise.all([d3.json('https://raw.githubusercontent.com/AshishSanthaKumar/Map-and-Line-Chart-D3-Js/master/public/data/africa.geojson'),
               d3.csv('https://raw.githubusercontent.com/AshishSanthaKumar/Map-and-Line-Chart-D3-Js/master/public/data/africa_gdp_per_capita.csv')])
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
  mapSvg.selectAll("*").remove();
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
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        val= 'N/A';
      //Setting Cyan Border and making the tooltip visible
      d3.select(this).style("stroke", 'cyan').style("stroke-width", 4);
      div.html("country: "+d.properties.name+" <br /> GDP: "+val)
      .style("left", (d3.event.pageX + 10) + "px")
      .style("top", (d3.event.pageY - 15) + "px")
      .style("visibility", "visible")
      .attr("data-html", "true");
               
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
      d3.select(this).style("stroke", 'black').style("stroke-width", 1);
      div.style("visibility", "hidden");
    })
    .on('click', function(d,i) {
      lineSvg.selectAll("*").remove();
      console.log('clicked on ' + d.properties.name);
      d3.select(this).style("stroke", 'cyan')
      .style("stroke-width", 4);
      let val = +yearData[d.properties.name];
      //Calling the drawlinechart function if the data is available
      if(!isNaN(val)) 
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
  //country GDP has the data of the GDP across the years for a country
  countryGdp= timeData.map(function(data){
    if(data[country]==="")
      data[country]="0"
    return {
              "year":parseInt(data["Year"]),
              "GDP":parseInt(data[country]) 
            }
  });

  //Calculating the min and max Year and GDP
  let min_Year=d3.min(countryGdp, function(d) {  return d.year;});
  let max_Year=d3.max(countryGdp, function(d) { return d.year;});
  let min_GDP=d3.min(countryGdp, function(d) { return d.GDP; });
  let max_GDP=d3.max(countryGdp, function(d) { return d.GDP; });

  //re assigning height,margin and width from lineHeight,lineMargin and lineWidth respectively
  let height = lineHeight;
  let margin = lineMargin;
  let width=lineWidth;


  //Scaling the X and Y axis 
  let yScale = d3.scaleLinear()
    .domain([min_GDP, max_GDP])
    .range([height - margin.bottom, margin.top]);
  let xScale = d3.scaleTime()
    .domain([new Date(min_Year, 1, 1), new Date(max_Year, 1, 1)])
    .range([margin.left, width - margin.right]);

  //Y Axis Label
  lineSvg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y",margin.left-60)
  .attr("x",0 - (height / 2))
  .attr("dy", "1em")
  .style("font-family", "sans-serif")
  .style("font-size", "17px")
  .style("font-weight",500)
  .style("text-anchor", "middle")
  .style("fill","grey")
  .text("GDP for "+ country+" (based on current USD)");  

  //X Axis label
  lineSvg.append("text")             
  .attr("transform",
        "translate(" + (width/2) + " ," + (height -margin.top) + ")")
  .style("text-anchor", "middle")
  .style("font-family", "sans-serif")
  .style("font-size", "17px")
  .style("font-weight",500)
  .style("fill","grey")
  .text("Year");
    
  //Drawing the Y Axis using the yScale
  const yAxis = d3.axisRight(yScale).tickSize(width - margin.left - margin.right);
  lineSvg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis)
            .call(g => g.selectAll(" line")
        .style("stroke","grey")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-dasharray", "5,10"))
        .call(g => g.selectAll(".tick text")
        .attr("x", -30))
        .call(g => g.select(".domain")
        .remove());
  
  //Drawing the X Axis using the X Scale
  const xAxis = d3.axisBottom(xScale).ticks(d3.timeYear.every(5));
  lineSvg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .style("font-family", "sans-serif")
        .call(xAxis)
        .style("stroke","grey")
        .attr("class","xAxis");
    
  //Ony alternate ticks visible in X Axis      
  var ticks = d3.selectAll(".xAxis .tick text");
  ticks.each(function(_,i){
                            if(i%2 == 0) d3.select(this).remove();
                          });

  //Rendering the first tick in the X Axis
  lineSvg 
    .append("g")
    .append("text")
    .text("1960")
    .style("font-size", "10px")
    .style("font-family", "sans-serif")
    .style("fill","grey")
    .attr("x",margin.left-10)
    .attr("y",height - margin.bottom+15)

  //Styling the Ticks                        
  lineSvg.selectAll(".domain").style("stroke","grey");
  lineSvg.selectAll('g.tick')
          .select('line')
          .style('stroke', 'grey'); 
  lineSvg.selectAll('g.tick')
          .select('text')
          .style('color', 'grey'); 

  //Forming the line to draw in the graph
  const valueline = d3.line()
        .x(function(d) { return xScale(new Date(d.year, 1, 1));})
        .y(function(d) { return yScale(d.GDP); });
  
  //Adding the line to the SVG
  lineSvg.append("path")
      .data([countryGdp])
      .attr("class", "line")
      .attr("d", valueline);

   //Tool tip with a focus circle 
   //Finding the nearest X to the mouse pointer
  var bisect = d3.bisector(function(d) { return new Date(d.year, 1, 1)}).left;

  // Create the circle that travels along the curve of chart
  var focus = lineSvg
              .append('g')
              .append('circle')
              .style("fill", "none")
              .attr("stroke", "black")
              .attr('r', 10)
              .style("opacity", 0)

  //Tooltip creatiion
  var toolTipdiv = d3.select("body")
    .append("div")
    .attr("class", "lineGraphTooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden");

  //Setting the area over which tooltip must be enabled and enabling the tooltip on mouse listeners
  lineSvg
      .append('rect')
      .style("fill", "none")
      .style("pointer-events", "all")
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.bottom-margin.top)
      .attr("x",margin.left )
      .attr("y", margin.top)

      .on('mouseover', function(){ 
        focus.style("opacity", 1);
        toolTipdiv.style("visibility", "visible");
      })

      .on('mousemove', function() {
        var x0 = xScale.invert(d3.mouse(this)[0]);
        var i = bisect(countryGdp, x0, 1);
        selectedData = countryGdp[i];
        focus.attr("cx", xScale(new Date(selectedData.year, 1, 1)))
              .attr("cy", yScale(selectedData.GDP))
        toolTipdiv.html("Year: "+selectedData.year+" <br /> GDP: "+selectedData.GDP)
                  .style("left", (d3.event.pageX + 10) + "px")
                  .style("top", (d3.event.pageY - 15) + "px")
                  .style("visibility", "visible")
                  .attr("data-html", "true");  
        })

      .on('mouseout', function(){
        focus.style("opacity", 0)
        toolTipdiv.style("visibility", "hidden");
        });  

  if(!country)
    return; 
}


