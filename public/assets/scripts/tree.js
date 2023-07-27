export default function define(runtime, observer) {
	const main = runtime.module();

	// Variables
	let linkWeightScale = d3.scaleLinear().range([13, 1]).domain([0, 11]);
	let chartWidth = 3000;
	let chartRadius = chartWidth / 2;
	let treeData;
	let chartSVG;

	// Function to select elements by ID
	function selectElementByID(id) {
		return d3.select(`#${id}`);
	}

	function calculateBBox() {
		const {x, y, width, height} = this.getBBox();
		return [x, y, width, height];
	}

	function updateStatistics(nodes) {
		let familyCount = 0;
		let names = new Array();

		let mostDepth = 0;
		let groot = ['المجاديع', 'ذوي حمد', 'النوامين', 'العبايين'];
		let gbrdata = new Array({name: 'ذوي حمود', count: -4});

		nodes.each(function (d) {
			gbrdata[0].count++;
			if (d.children) familyCount++;
			let entry = names.find(x => x.name == d.data.name);
			if (entry) entry.count++;
			else names.push({name: d.data.name, count: 1});
			if (d.depth > mostDepth) mostDepth = d.depth;
			if (groot.some(s => d.data.name.includes(s))) {
				gbrdata.push({
					name: d.data.name,
					count: d.value,
				});
			}
		});

		names.sort(function (a, b) {
			return b.count - a.count;
		});

		let mostReach = getNodesAtDepth(nodes, mostDepth);
		selectElementByID('indicount').html('');
		selectElementByID('commonNames').html('');
		selectElementByID('mostreached').html('');

		let selected = d3
			.select('#indicount')
			.append('ul')
			.classed('text-sm space-y-2 list-disc list-inside dark:text-gray-800', true)
			.selectAll('li')
			.data(gbrdata.sort((a, b) => b.count - a.count))
			.enter()
			.append('li')
			.html(d => d.name + ' <b class="text-xs italic">(' + d.count + ')</b>');

		selected = selectElementByID('commonNames').append('ul').classed('text-sm space-y-2 list-disc list-inside dark:text-gray-800', true);
		selected
			.selectAll('li')
			.data(names.filter(d => d.count >= 20))
			.enter()
			.append('li')
			.html(d => d.name + ' <b class="text-xs italic">(' + d.count + ')</b>');

		selected = selectElementByID('mostreached').append('ul').classed('text-sm space-y-2 dark:text-gray-800', true);
		selected
			.selectAll('li')
			.data(mostReach)
			.enter()
			.append('li')
			.classed('border-b pb-2 border-slate-300 last:border-0 border-dashed', true)
			.html(d => getFullname(d, 20) + ' الدلبحي' + ' <b class="text-xs italic">(' + (d.depth + 2) + ')</b>');
			console.log(mostReach)
	}

	function getNodesAtDepth(nodes, depth) {
		let list = [];
		nodes.each(d => (d.depth == depth ? list.push(d) : ''));
		return list;
	}

	function getFullname(node, place, current) {
		if (current == null) current = 0;
		let name = '';

		let l = node.ancestors();
		name = l[0].data.name;
		current++;

		if (place <= current) {
			return name;
		}

		if (l[0].parent) {
			name = name + ' بن ' + getFullname(l[0].parent, place, current);
		} 
		else {
			//console.log('Long Names', 'node', node, 'place', place, 'current', current);
		}

		return name;
	}

	window.dataUpdate = sjson => {
		window.updateTree(sjson);
	};

	window.updateTree = data => {
		//console.log(data);
		let root = treeData(d3.hierarchy(data).sum(d => 1));
		chartSVG.selectAll('*').remove();
		let link = chartSVG
			.append('g')
			.attr('fill', 'none')
			.attr('stroke-opacity', 1)
			.selectAll('path')
			.data(root.links())
			.join('path')
			.attr('stroke-width', d => (d.target.data.children ? linkWeightScale(d.source.depth) : linkWeightScale(d.source.depth) / 2))
			.attr('stroke', d => (d.target.data.isnew ? '#ff0000' : '#9e4d04'))
			.attr(
				'd',
				d3
					.linkRadial()
					.angle(d => d.x / 2 - 0.5 * Math.PI)
					.radius(d => d.y),
			);

		let node = chartSVG
			.append('g')
			.attr('stroke-linejoin', 'round')
			.attr('stroke-width', 5)
			.selectAll('g')
			.data(root.descendants())
			.join('g')
			.attr('class', d => (d.depth == 0 ? 'grandfather' : 'node'))
			.attr(
				'transform',
				d => `
				rotate(${d.depth != 0 ? (d.x * 90) / Math.PI - 180 : 180})
				translate(${d.y},0)
			`,
			);

		node.append('circle')
			.attr('fill', function (d) {
				if (d.data.isnew) {
					return 'red';
				}
				if (d.children) {
					return '#555555';
				}
				return '#999';
			})
			.attr('r', 2.5);

		node.append('image')
			.filter(d => d.depth == 0)
			.attr('xlink:href', './assets/images/root.svg')
			.attr('fill', '#ff7b03')
			.attr('width', 200)
			.attr('height', 60)
			.attr('x', d => d.x - 100)
			.attr('y', d => d.y - 30);

		node.append('text')
			.filter(d => d.depth != 0)
			.attr('direction', 'rtl')
			.style('fill', d => (d.data.isnew ? '#ff0000' : '#000'))
			.attr('dy', '0.31em')
			.attr('x', d => (d.x < Math.PI === !d.children ? -6 : 6))
			.attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
			.attr('transform', d => (d.x >= Math.PI ? 'rotate(0)' : 'rotate(180)'))
			.text(d => d.data.name)
			.clone(true)
			.lower()
			.attr('stroke', 'white')
			.attr('stroke-width', '1.5px');

		node.append('text')
			.filter(d => d.depth == 0)
			.attr('dy', '0.31em')
			.attr('x', -68)
			.attr('text-anchor', 'end')
			.attr('direction', 'rtl')
			.attr('transform', d => (d.x >= Math.PI ? 'rotate(180)' : 'rotate(0)'))
			.text('راضي بن مقبل  (الدلبحي) العتيبي')
			.clone(true)
			.lower()
			.attr('stroke', 'white')
			.attr('stroke-width', '1px');

		chartSVG.attr('viewBox', calculateBBox);
		updateStatistics(root);
	};

	main.variable(observer('chart')).define('chart', ['d3'], function* (d3) {
		treeData = d3
			.tree()
			.size([2 * Math.PI, chartRadius])
			.separation((a, b) => (a.parent == b.parent ? 1 : 1) / (a.depth > 2 ? a.depth : 0.5));
		chartSVG = d3.create('svg').style('max-width', '100%').style('height', 'auto').style('font', "bold 8px 'Cairo',sans-serif").style('margin', '5px');

		yield chartSVG.node();

		d3.json('./assets/data/data.json?v=05052022').then(function (jdata) {
			window.updateTree(jdata);
		});
	});

	return main;
}
