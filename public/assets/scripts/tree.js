export default function define(runtime, observer) {
	const main = runtime.module();
	
	function autoBox() {
		const {x, y, width, height} = this.getBBox();
		return [x, y, width, height];
	}
	var width = 3000;
	var radius = width/2;
	var tree;
	var data;
	var svg;
	
	var linkwieght = d3.scaleLinear()
		.range([13,1])
		.domain([0,11]);
	
	
	function fillStats(nodes) {
		var indicount = 0;
		var famcount = 0;
		var names = new Array();
		
		var grandroots = new Array();
		var mostdepth = 0;
		var groot = ["المجاديع", "ذوي حمد", "النوامين", "العبايين"];
		var gbrdata = new Array({name:"ذوي حمود", count:-4});
		
		nodes.each(function(d){
			gbrdata[0].count++;
			if(d.children) famcount++;
			var entry = names.find(x => x.name == d.data.name);
			if(entry) entry.count++;
			else names.push({name: d.data.name, count: 1});
			if(d.depth > mostdepth) mostdepth = d.depth;
			if(groot.some(s=>d.data.name.includes(s))){
				gbrdata.push({
					name: d.data.name,
					count: d.value
				});
			}
		
		});
		//gbrdata[0].count = indicount-4;
		names.sort(function(a,b) {
			return b.count - a.count;
		});
		
		var mostreach = getNodesAtDepth(nodes, mostdepth);
		d3.select('#indicount').html("");
		d3.select('#commonNames').html("");
		d3.select('#mostreached').html("");
		
		
		var slect = d3.select('#indicount').append('ul').classed('text-sm space-y-2 list-disc list-inside dark:text-gray-800', true)
		.selectAll('li')
		.data(gbrdata.sort((a,b)=> b.count - a .count))
		.enter()
		.append('li')
		.html(d=> d.name + ' ('+d.count+')');
		
		slect = d3.select('#commonNames').append('ul').classed('text-sm space-y-2 list-disc list-inside dark:text-gray-800', true);
		slect.selectAll('li')
		.data(names.filter(d => d.count >= 20))
		.enter()
		.append('li')
		.html(d=> d.name + ' ('+d.count+')');
		
		slect = d3.select('#mostreached').append('ul').classed('text-sm space-y-2 dark:text-gray-800', true);
		slect.selectAll('li')
		.data(mostreach)
		.enter()
		.append('li')
		.classed('border-b pb-2 border-slate-300 last:border-0 border-dashed', true)
		.html(d => getFullname(d,20)+ " الدلبحي");
	}
	function getNodesAtDepth(nodes, depth) {
		var list = [];
		nodes.each(d => d.depth == depth ? list.push(d):'');
		return list;
	}
	function getFullname(node, place, current) {
		if(current == null) current = 0;
		var name = "";

		var l = node.ancestors();
		name = l[0].data.name;
		current++;	
		if(place <= current) return name;
		
		if (l[0].parent) name = name + " بن " + getFullname(l[0].parent, place, current)

		return name;
	}
	window.dataUpdate = function(sjson){
		window.updateTree(sjson);
	}
	window.updateTree = function(data) {
		console.log(data);
		var root =  tree(d3.hierarchy(data).sum(d=> 1 ));
		svg.selectAll("*").remove();
		var link = svg.append("g")
			.attr("fill", "none")
			.attr("stroke-opacity", 1)  
			.selectAll("path")
			.data(root.links())
			.join("path")
			.attr("stroke-width", d => d.target.data.children ? linkwieght(d.source.depth) : linkwieght(d.source.depth)/2)
			.attr("stroke", d => d.target.data.isnew ? "#ff0000" : "#9e4d04")
			.attr("d", d3.linkRadial()
				.angle(d => d.x /2-0.5*Math.PI)
				.radius(d => d.y));
 
		var node = svg.append("g")
			.attr("stroke-linejoin", "round")
			.attr("stroke-width", 5)
			.selectAll("g")
			.data(root.descendants())
			.join("g")
			.attr("class", d => d.depth == 0 ? 'grandfather' : 'node')
			.attr("transform", d => `
				rotate(${d.depth != 0 ? d.x * 90/ Math.PI - 180 : 180})
				translate(${d.y},0)
			`);
	  
		node.append("circle")
			.attr("fill", function (d) {
				if (d.data.isnew) {
					return "#ff0000";
				}
				if (d.children) {
					return "#555";
				}
				return "#999";
				
			})
			.attr("r", 2.5); 
		
		node.append("image")
			.filter(d => d.depth == 0)
			.attr("xlink:href", "./assets/images/root.svg")
			.attr("fill", "#ff7b03")
			.attr("width", 200)
			.attr("height",60)
			.attr("x", d => d.x-100)
			.attr("y", d => d.y-30);
			
  
		node.append("text")
			.filter(d => d.depth != 0)
			.attr("direction", "rtl")
			.style("fill", d => d.data.isnew ? "#ff0000" : "#000")
			.attr("dy", "0.31em")
			.attr("x", d => d.x < Math.PI  === !d.children ? -6 : 6)
			.attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
			.attr("transform", d => d.x >= Math.PI ? "rotate(0)" : "rotate(180)")
			.text(d => d.data.name)
			.clone(true).lower()
			.attr("stroke", "white")
			.attr("stroke-width","1.5px");
			
		node.append("text")
			.filter(d => d.depth == 0)
			.attr("dy", "0.31em")
			.attr("x", -68)
			.attr("text-anchor", "end")
			.attr("direction", "rtl")
			.attr("transform", d => d.x >= Math.PI ? "rotate(180)" : "rotate(0)")
			.text("راضي بن مقبل  (الدلبحي) العتيبي")
			.clone(true).lower()
			.attr("stroke", "white")
			.attr("stroke-width","1px");
		
		svg.attr("viewBox", autoBox);
		fillStats(root);
    }
	main.variable(observer("chart")).define("chart", ["d3"], function*(d3)
	{

		tree = d3.tree()
			.size([2 * Math.PI, radius])
			.separation((a, b) => (a.parent == b.parent ? 1 : 1) / (a.depth > 2 ? a.depth : .5))
		svg = d3.create("svg")
			.style("max-width", "100%")
			.style("height", "auto")
			.style("font", "bold 8px 'Cairo',sans-serif")
			.style("margin", "5px");
  
		yield svg.node();

		d3.json("./assets/data/data.json?v=05052022").then(function(jdata){ window.updateTree(jdata); });

	});

	return main;
}