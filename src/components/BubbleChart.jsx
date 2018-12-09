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

    this.colorScale = null;

    this.node = null;
    this.nodes = null;
    this.offset = 0;
    this.simulation = null;

    this.svgRef = React.createRef();
  }

  componentDidMount() {
    const range = 20;
    const nodes = new Array(range).fill(1).map((d, i) => {
      return { name: `l${i + 1}`, colorIndex: i, r: Math.random() * 40 + 30 };
    });

    this.setState({ nodes }, this.initChart);
  }

  getChartSize = () => {
    const { width, height, margin } = this.props;
    const chartWidth = width - (margin.left + margin.right);
    const chartHeight = height - (margin.top + margin.bottom);

    return { chartWidth, chartHeight };
  };

  initChart = () => {
    const { chartWidth, chartHeight } = this.getChartSize();
    const { nodes } = this.state;

    this.colorScale = scaleSequential(interpolateSpectral).domain([
      0,
      nodes.length
    ]);

    this.simulation = forceSimulation()
      .force('link', forceLink().id(d => d.index))
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

    this.node = select('#svgId')
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle');
    // .data(nodes.slice(0, 10), d => d.name);

    this.update();

    this.simulation.nodes(nodes).on('tick', ticked(this.node));
    this.timeout = setInterval(this.update, this.props.DURATION);
  };

  update = () => {
    // Apply the general update pattern to the nodes.
    const { nodes: _nodes } = this.state;

    if (this.nodes && this.nodes.length === this.props.COUNT) {
      this.nodes.shift();
      this.offset = (this.offset + 1) % _nodes.length;
    } else {
      this.nodes = _nodes
        .concat(_nodes)
        .slice(this.offset, this.offset + this.props.COUNT);
    }

    this.updateSimulation(this.nodes);
  };

  updateSimulation = nodes => {
    const { DURATION } = this.props;
    //
    


    
    this.node = this.node.data(nodes, d => d.name);

    this.node
      .exit()
      .transition()
      //.delay(DURATION)
       .duration(DURATION)
       .attr('r', 0);

    this.node = this.node
      .enter()
      .append('circle')
      .attr('r', 0)
      .attr('fill', d => this.colorScale(d.colorIndex))
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

    return <svg id="svgId" ref={this.svgRef} width={width} height={height} />;
  }
}

export default BubbleChart;
