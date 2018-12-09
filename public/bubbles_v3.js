const COUNT = 10;
const DURATION = 2000;
const width = 600;
const height = 600;

const arrayBufferToBase64 = buffer => {
  var binary = "";
  var bytes = [].slice.call(new Uint8Array(buffer));

  bytes.forEach(b => (binary += String.fromCharCode(b)));

  return window.btoa(binary);
};

const load_company_logo = company => {
  return fetch(company.logo_image_url)
    .then(response => {
      response.arrayBuffer().then(buffer => {
        const imageStr = arrayBufferToBase64(buffer);
        company.logo_src = "data:image/png;base64," + imageStr;

        return company;
      });
    })
    .catch(error => {
      return null;
    });
};

const load_images = companies => {
  return Promise.all(companies.map(load_company_logo)).then(companies => {
    return companies.filter(c => c);
  });
};

const create_patterns = (companies, svg) => {
  const defs = svg.append("defs");

  companies.forEach(company => {
    const pattern = defs
      .append("pattern")
      .attr("id", company.pattern)
      .attr("x", 0)
      .attr("y", 0)
      .attr("patternUnits", "objectBoundingBox")
      .attr("height", company.radius * 2)
      .attr("width", company.radius * 2);

    const img = pattern
      .append("image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", company.radius * 2)
      .attr("width", company.radius * 2)
      .attr("viewBox", "0 0 225 225")
      .attr("href", company.logo_src);
  });
};

function shiftNodes() {
  nodes.push(companies[nodes_offset]);
  if (nodes.length > COUNT) {
    nodes.shift();
  }
  nodes_offset = (nodes_offset + 1) % companies.length;
  restart();
}

function tick() {
  // node.attr("x", d => d.x).attr("y", d => d.y);
  node.attr("transform", d => `translate(${d.x} ${d.y})`);
}

function restart() {
  node = node.data(nodes, d => d.name);

  const g = node
    .enter()
    .insert("g")
    .attr("id", d => d.name);

  g.append("circle")
    .attr("class", "shadow")
    .attr("fill", "grey")
    .attr("filter", "url(#dropShadow)")
    .attr("r", 0)
    .transition()
    .duration(DURATION)
    .attr("r", d => d.radius + 3);

  g.append("clipPath")
    .attr("id", d => `clip_${d.name}`)
    .append("circle")
    .attr("cx", d => d.radius)
    .attr("cy", d => d.radius)
    .attr("r", d => d.radius);

  g.append("image")
    .attr("clip-path", d => `url(#clip_${d.name})`)
    .attr("href", d => d.logo_src)
    .attr("width", d => d.radius * 2)
    .attr("height", d => d.radius * 2)
    .attr("transform", "translate(0,0) scale(0)")
    .transition()
    .duration(DURATION)
    .attr("transform", d => `translate(${-1 * d.radius} ${-1 * d.radius})`);

  g.append("circle")
    .attr("fill", "red")
    .attr("r", 3);

  node
    .exit()
    .transition()
    .duration(DURATION)
    .attr("transform", d => `translate(${d.x} ${d.y}) scale(0)`)
    .remove();

  force.start();
}

const companies = new Array(21).fill("name").map((name, i) => ({
  name: `company_${i + 1}`,
  logo_image_url: `./logos/${i + 1}.png`,
  pattern: `company_${i + 1}`,
  radius: Math.round(Math.random() * 50 + 30),
  x: width * 0.1 + width * 0.8 * Math.random(),
  y: height * 0.1 + height * 0.8 * Math.random()
}));

// initialize global vars
var nodes;
var node;
var nodes_offset = COUNT;
var force;

// load images
load_images(companies).then(results => {
  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("defs")
    .append("filter")
    .attr("id", "dropShadow")
    .append("feGaussianBlur")
    .attr("in", "SourceGraphic")
    .attr("stdDeviation", 5);

  node = svg.selectAll(".node");
  // create_patterns(companies, svg);

  force = d3.layout
    .force()
    .size([width, height])
    .nodes(companies.slice(0, COUNT))
    .linkDistance(20)
    .charge(-1600)
    .friction(0.5)
    .on("tick", tick);

  nodes = force.nodes();
  console.log("nodes", nodes);
  // restart();
});

const addInterval = setInterval(shiftNodes, DURATION + 500);
