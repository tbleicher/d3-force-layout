import React from 'react';

import {
  forceCollide,
  forceSimulation,
  forceManyBody,
  forceX,
  forceY
} from 'd3-force';

import { scaleSequential } from 'd3-scale';

import { interpolateSpectral, select } from 'd3';

import './bubblechart.css';

const arrayBufferToBase64 = buffer => {
  var binary = '';
  var bytes = [].slice.call(new Uint8Array(buffer));

  bytes.forEach(b => (binary += String.fromCharCode(b)));

  return window.btoa(binary);
};

const drawNodeContent = (g, DURATION) => {
  g.append('circle')
    .attr('class', 'shadow')
    .attr('fill', 'grey')
    .attr('filter', 'url(#dropShadow)')
    .attr('r', 0)
    .transition()
    .duration(DURATION)
    .attr('r', d => d.radius + 3);

  g.append('clipPath')
    .attr('id', d => `clip_${d.name}`)
    .append('circle')
    .attr('cx', d => d.radius)
    .attr('cy', d => d.radius)
    .attr('r', d => d.radius);

  g.append('image')
    .attr('clip-path', d => `url(#clip_${d.name})`)
    .attr('href', d => d.logo_src)
    .attr('width', d => d.radius * 2)
    .attr('height', d => d.radius * 2)
    .attr('transform', 'translate(0,0) scale(0)')
    .transition()
    .duration(DURATION)
    .attr('transform', d => `translate(${-1 * d.radius} ${-1 * d.radius})`);

  g.append('circle')
    .attr('fill', 'red')
    .attr('r', 3);
};

const fetchCompanies = () => {
  const range = 21;

  const companies = new Array(range).fill('name').map((_, i) => ({
    name: `company_${i + 1}`,
    logo_image_url: `/logos/${i + 1}.png`
  }));

  return Promise.resolve(companies);
};

const load_company_logo = company => {
  return fetch(company.logo_image_url)
    .then(response => {
      return response.arrayBuffer().then(buffer => {
        const imageStr = arrayBufferToBase64(buffer);

        return { ...company, logo_src: 'data:image/png;base64,' + imageStr };
      });
    })
    .catch(error => {
      // console.error(error);
      return null;
    });
};

const ticked = node => () => {
  node.attr('transform', d => `translate (${d.x} ${d.y})`);
  node.attr('cx', d => d.x).attr('cy', d => d.y);
};

class BubbleChart extends React.Component {
  static defaultProps = {
    COUNT: 10,
    DURATION: 2000,
    height: 600,
    width: 600,
    margin: { top: 0, left: 0, bottom: 0, right: 0 }
  };

  constructor(props) {
    super(props);

    this.id = `bubblechart_${Math.random()}`.replace('.', '');
    this.node = null;
    this.nodes = null;
    this.offset = 0;
    this.simulation = null;
    this.svg = null;

    this.state = {
      companies: []
    };
  }

  componentDidMount() {
    const { width, height } = this.props;

    fetchCompanies()
      .then(companies => Promise.all(companies.map(load_company_logo)))
      .then(_companies => {
        const colorScale = scaleSequential(interpolateSpectral).domain([
          0,
          _companies.length
        ]);

        const companies = _companies.map((company, i) => {
          return {
            ...company,
            color: colorScale(i),
            pattern: `company_${i + 1}`,
            radius: Math.round(Math.random() * 40 + 30),
            // r: Math.round(Math.random() * 40 + 30),
            x: width * 0.1 + width * 0.8 * Math.random(),
            y: height * 0.1 + height * 0.8 * Math.random()
          };
        });

        this.setState({ companies }, this.initChart);
      });
  }

  getChartSize = () => {
    const { width, height, margin } = this.props;
    const chartWidth = width - (margin.left + margin.right);
    const chartHeight = height - (margin.top + margin.bottom);

    return { chartWidth, chartHeight };
  };

  initChart = () => {
    const { width, height } = this.props;
    const { chartWidth, chartHeight } = this.getChartSize();

    this.svg = select(`#${this.id}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.svg
      .append('defs')
      .append('filter')
      .attr('id', 'dropShadow')
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 5);

    this.node = this.svg.selectAll('.node');

    this.simulation = forceSimulation()
      .velocityDecay(0.8)
      .force('collide', forceCollide(d => d.radius + 10).strength(0.9))
      .force('charge', forceManyBody().strength(-800))
      .force('y', forceY(chartHeight / 2).strength(0.1))
      .force('x', forceX(chartWidth / 2).strength(0.1));

    this.update();

    this.timeout = setInterval(this.update, this.props.DURATION);
  };

  update = () => {
    const { companies } = this.state;

    if (this.nodes && this.nodes.length === this.props.COUNT) {
      this.nodes.shift();
      this.offset = (this.offset + 1) % companies.length;
    } else {
      this.nodes = companies
        .concat(companies)
        .slice(this.offset, this.offset + this.props.COUNT);
    }

    this.updateSimulation(this.nodes);
  };

  updateSimulation = nodes => {
    const { DURATION } = this.props;

    this.node = this.svg.selectAll('.node').data(nodes, d => d.name);

    this.node
      .exit()
      .transition()
      .duration(DURATION)
      .attr('transform', d => `translate (${d.x} ${d.y}) scale(0)`)
      .remove();

    const g = this.node
      .enter()
      .insert('g')
      .attr('class', 'node')
      .attr('id', d => d.name)
      .attr('transform', d => `translate(${d.x} ${d.y})  scale(0)`);

    g.transition()
      .duration(DURATION)
      .attr('transform', d => `translate(${d.x} ${d.y}) scale(1)`);

    drawNodeContent(g, DURATION);

    // Update and restart the simulation.
    this.simulation.nodes(nodes).on('tick', ticked(this.node));
    this.simulation.alphaTarget(1).restart();
  };

  render() {
    return <div id={this.id} />;
  }
}

export default BubbleChart;
