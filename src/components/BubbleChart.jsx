import React from 'react';

import {
  forceCollide,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY
} from 'd3-force';

import { scaleSequential } from 'd3-scale';

import { interpolateSpectral, select } from 'd3';

import './bubblechart.css';

const fetchCompanies = () => {
  const range = 21;

  const companies = new Array(range).fill('name').map((_, i) => ({
    name: `company_${i + 1}`,
    logo_image_url: `./logos/${i + 1}.png`
  }));

  return Promise.resolve(companies);
};

const ticked = node => () => {
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

    this.state = {
      companies: []
    };

    this.svgRef = React.createRef();
  }

  componentDidMount() {
    const { width, height } = this.props;

    fetchCompanies().then(_companies => {
      const colorScale = scaleSequential(interpolateSpectral).domain([
        0,
        _companies.length
      ]);

      const companies = _companies.map((company, i) => {
        return {
          ...company,
          color: colorScale(i),
          pattern: `company_${i + 1}`,
          radius: Math.round(Math.random() * 50 + 30),
          r: Math.round(Math.random() * 50 + 30),
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
    const { COUNT, width, height } = this.props;
    const { chartWidth, chartHeight } = this.getChartSize();
    const { companies } = this.state;

    const svg = select(`#${this.id}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg
      .append('defs')
      .append('filter')
      .attr('id', 'dropShadow')
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 5);

    this.node = svg.selectAll('.node');

    this.simulation = forceSimulation()
      .force(
        'collide',
        forceCollide(d => d.r + 5)
          .strength(0.9)
          .iterations(16)
      )
      .force('charge', forceManyBody().strength(-800))
      // .force('center', d3.forceCenter(chartWidth / 2, chartHeight / 2))
      .force('y', forceY(chartHeight / 2))
      .force('x', forceX(chartWidth / 2));

    // this.node = select('#svgId')
    //  .append('g')
    //  .attr('class', 'nodes')
    //  .selectAll('circle');
    // .data(nodes.slice(0, 10), d => d.name);

    this.update();

    this.simulation
      .nodes(companies.slice(0, COUNT))
      .on('tick', ticked(this.node));
    this.timeout = setInterval(this.update, this.props.DURATION);
  };

  update = () => {
    // Apply the general update pattern to the nodes.
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

    this.node = this.node.data(nodes, d => d.name);

    this.node
      .exit()
      .transition()
      .duration(DURATION)
      .attr('r', 0);

    this.node = this.node
      .enter()
      .append('circle')
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('class', 'node')
      .attr('filter', 'url(#dropShadow)')
      .merge(this.node);

    this.node
      .transition()
      .duration(DURATION)
      .attr('r', d => d.r);

    // Update and restart the simulation.
    this.simulation.nodes(nodes).on('tick', ticked(this.node));
    this.simulation.alpha(0.5).restart();
  };

  render() {
    const { width, height } = this.props;

    // return <svg id="svgId" ref={this.svgRef} width={width} height={height} />;
    return <div id={this.id} />;
  }
}

export default BubbleChart;
