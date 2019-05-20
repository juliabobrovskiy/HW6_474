'use strict';

(function () {

  let data = "";
  let fullData = "";
  let svgContainer = ""; // keep SVG reference in global scope
  var tipChart;
  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 600);

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("/data/dataEveryYear.csv")
      .then((data) => makeInitialGraph(data));
  }

  function makeDropDown(csvData) {
    var country_codes = [...new Set(csvData.map((row) => (row["location"])))];
    var select = d3.select('body')
    .append('select')
      .attr('class','select')
      .attr('x', 559)
      .attr('y', 25)

    var options = select
        .selectAll('option')
        .data(country_codes)
        .enter()
        .append('option').text(function (d) { return d; })
        .text(function(d) {
                 return d;
        })
        .attr("value", function (d) { return d; 
        });
    select.on("change", function () {
        tipChart = "";
        displayCircles(this);
    });

  }

  function displayCircles(it) {
    svgContainer.selectAll(".axis").remove();
    svgContainer.selectAll(".circ").remove();
    svgContainer.selectAll(".line").remove();
    var filteredData = fullData.filter(function(d){ return d.location == it.value });
    makeScatterPlot(filteredData);

  }

  /* Makes initial Graph */
  function makeInitialGraph(csvData) {
    fullData = csvData; // assign data as global variable
    data = fullData.filter(function(d){ return d.location == "AUS" });

    let year_data = data.map((row) => parseFloat(row["time"]));
    let pop_data = data.map((row) => parseFloat(row["pop_mlns"]));

    let axesLimits = findMinMax(year_data, pop_data);
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns");
    makeDropDown(fullData);
    plotData(mapFunctions);
    makeLabels();
  }

  // make scatter plot with trend line
  function makeScatterPlot(filteredData) {
    data = filteredData;
    let year_data = data.map((row) => parseFloat(row["time"]));
    let pop_data = data.map((row) => parseFloat(row["pop_mlns"]));
    let axesLimits = findMinMax(year_data, pop_data);
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns");
    plotData(mapFunctions);
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 150)
      .attr('y', 20)
      .style('font-size', '14pt')
      .text("Population Around the World");

    svgContainer.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (Millions)');

    svgContainer.append('text')
      .attr('x', 559)
      .attr('y', 25)
      .style('font-size', '10pt')
      .text('Select a Country Code');
  }

  // Makes plot that goes on tooltip
  function makeTooltipPlot() {

    let xMin = d3.min(fullData.map((row) => parseFloat(row["fertility_rate"])));
    let yMin = d3.min(fullData.map((row) => parseFloat(row["life_expectancy"])));
    let xMax = d3.max(fullData.map((row) => parseFloat(row["fertility_rate"])));
    let yMax = d3.max(fullData.map((row) => parseFloat(row["life_expectancy"])));

    tipChart = d3.select("body").append("svg")
      .attr("class", "tooltip")
      .attr("id", "svgDiv")
      .attr('width', 300)
      .attr('height', 300)
      .style("opacity", 0)
      .style("fill", "#b34700");

    // X'S
    let xVal = function (d) { return +d["fertility_rate"]; }
    let xScale = d3.scaleLinear()
      .domain([xMin - 1, xMax + 4])
      .range([50, 450]);
    let xMap = function (d) { return xScale(xVal(d)); };
    let xAxis = d3.axisBottom().scale(xScale).ticks(6);

    tipChart.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .style('font-size', '9px')
      .attr("dx", "-1em")
      .attr("dy", "-.8em")
      .attr("transform", "rotate(-90)")
      .text(d => d);

    // Y'S
    let yVal = function (d) { return +d["life_expectancy"] }
    let yScale = d3.scaleLinear()
      .domain([yMax + 6, yMin - 35]) 
      .range([0, 250]);
    let yMap = function (d) { return yScale(yVal(d)); };
    let yAxis = d3.axisLeft().scale(yScale).ticks(3);

    tipChart.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    tipChart.selectAll('.dot')
      .data(fullData)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 4)
      .attr('location', (d) => d.location)
      .attr('fill', 'orange')
      .style('opacity', .5)
      .attr("stroke-width", .2)
      .attr("stroke", "black");

    //Text
    tipChart.append('text')
      .attr('transform', 'translate(-130, 325)rotate(-90)')
      .attr('y',  150)
      .attr('x',  150)
      .style('font-size', '9pt')
      .text('Life Expectancy');

    tipChart.append('text')
      .attr('x', 140)
      .attr('y', 285)
      .style('font-size', '9pt')
      .text('Fertility Rate');

    return tipChart;
  }

  function plotData(map) {

    // xMap = xScaled
    let xMap = map.x;
    let yMap = map.y;
    let xScale = map.xScale
    let yScale = map.yScale

    // Define the line
    var valueLine = d3.line()
        .x(function(d) { return xScale(d['time']); })
        .y(function(d) { return yScale(+d['pop_mlns']); })
        .curve(d3.curveMonotoneX)
    
    svgContainer.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "#660f58")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", valueLine);

    tipChart = makeTooltipPlot();
    
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr("class", "circ")
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 2)
      .attr('location', (d) => d.location)
      .attr('fill',  "#660f58")
      .style('opacity', .6)
      .attr('stroke', '#660f58')
      .attr('stroke-width', 1.5)
      .on("mouseover", (d) => {
        tipChart.transition()
          .duration(200)
          .style("opacity", 0.9)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 5) + "px");
      })
      .on("mouseout", (d) => {
        tipChart.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }
  
  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleTime()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr("class", "axis")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis.tickFormat(d3.format("d")));

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 0.5, limits.yMin - 0.5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr("class", "axis")
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);


    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();