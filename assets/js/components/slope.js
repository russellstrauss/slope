const { Vector3 } = require('three');

module.exports = function() {
	
	let message = document.querySelector('.message');
	var pastData;
	var settings = {
		defaultCameraLocation: {
			x: -90,
			y: 110,
			z: 80
		},
		messageDuration: 2000,
		colors: {
			worldColor: new THREE.Color('#000'),
			gridColor: new THREE.Color('#111')
		},
		gridSize: 100,
		axes: {
			color: 0xffffff,
			count: 20,
			tickLength: 1
		}
	};
	
	var uniqueCountries = []; // whiskey
	var colors = ['red', 'blue', 'green', 'white', 'purple', 'pink', 'orange', '#710C96']; // whiskey
	var bubbles = [], clickedLabels = [], dataPointLabels = [], bubbleOpacity = .15;
	
	var renderer, scene, camera, controls, floor;
	var targetList = [];
	var black = new THREE.Color('black'), white = new THREE.Color('white'), green = new THREE.Color(0x00ff00), red = new THREE.Color('#ED0000'), blue = new THREE.Color(0x0000ff);
	var stats = new Stats();
	var bottomLeft, nearestCorner;
	
	let interps = [d3.interpolateRainbow, d3.interpolateRgb('#450F66', '#B36002'), d3.interpolateRgb('white', 'red'), d3.interpolateSinebow, d3.interpolateYlOrRd, d3.interpolateYlGnBu,d3.interpolateRdPu, d3.interpolatePuBu, d3.interpolateGnBu, d3.interpolateBuPu, d3.interpolateCubehelixDefault, d3.interpolateCool, d3.interpolateWarm, d3.interpolateCividis, d3.interpolatePlasma, d3.interpolateMagma, d3.interpolateInferno, d3.interpolateViridis, d3.interpolateTurbo, d3.interpolatePurples, d3.interpolateReds, d3.interpolateOranges, d3.interpolateGreys, d3.interpolateGreens, d3.interpolateBlues, d3.interpolateSpectral, d3.interpolateRdYlBu, d3.interpolateRdBu, d3.interpolatePuOr, d3.interpolatePiYG, d3.interpolatePRGn]
	let colorSchemes = [d3.schemeCategory10, d3.schemeAccent, d3.schemeDark2, d3.schemePaired, d3.schemePastel1, d3.schemePastel2, d3.schemeSet1, d3.schemeSet2, d3.schemeSet3, d3.schemeTableau10];

	
	return {
		
		init: function() {
			let self = this;
			self.loadFont();
			self.loadData();
		},
		
		begin: function() {
			
			let self = this;
			scene = gfx.setUpScene();
			renderer = gfx.setUpRenderer(renderer);
			camera = gfx.setUpCamera(camera);
			floor = self.addGrid(settings.gridSize, settings.colors.worldColor, settings.colors.gridColor);
			controls = gfx.enableControls(controls, renderer, camera);
			gfx.resizeRendererOnWindowResize(renderer, camera);
			gfx.setUpLights();
			gfx.setCameraLocation(camera, settings.defaultCameraLocation);
			self.addStars();
			self.setUpButtons();
			
			var animate = function() {
				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
				self.everyFrame();
			};
			animate(); 
		},
		
		everyFrame: function() {
			
			dataPointLabels.forEach(function(label) {
				label.quaternion.copy(camera.quaternion);
			});
		},
		
		addStars: function() {
			let geometry = new THREE.BufferGeometry();
			let vertices = [];
			for (let i = 0; i < 10000; i ++ ) {
				vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
				vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
				vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z
			}
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
			let particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
			scene.add( particles );
		},
		
		reset: function() {
			
			message.textContent = '';
			
			for (let i = scene.children.length - 1; i >= 0; i--) {
				let obj = scene.children[i];
			}
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new THREE.FontLoader();
			let fontPath = '';
			fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';

			loader.load(fontPath, function(font) { // success event
				
				gfx.appSettings.font.smallFont.font = font;
				gfx.appSettings.font.largeFont.font = font;
				self.begin();
				if (gfx.appSettings.axesHelper.activateAxesHelper) gfx.labelAxesHelper();
			},
			function(event) {}, // in progress event
			function(event) { // error event
				gfx.appSettings.font.enable = false;
				self.begin();
			});
		},
		
		setUpButtons: function() {
			let self = this;
			let message = document.getElementById('message');
			document.addEventListener('keyup', function(event) {
				
				let one = 49;
				let two = 50;
				let three = 51;
				let four = 52;
				let r = 82;
				let space = 32;
				let a = 65;
				
				if (event.keyCode === one) {
					self.reset();
				}
				if (event.keyCode === two) {
					self.reset();
				}
				if (event.keyCode === three) {
					self.reset();
				}
				if (event.keyCode === four) {
					self.reset();
				}
				if (event.keyCode === r) {
					self.reset();
				}
				if (event.keyCode === space) {
					console.log(camera);
				}
				if (event.keyCode === a) {
					gfx.toggleAxesHelper();
				}
			});
			
			window.russells_magical_mouse = new THREE.Vector2();
			let onMouseMove = function(event) {
				window.russells_magical_mouse.x = ( (event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width ) * 2 - 1;
				window.russells_magical_mouse.y = -( (event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height ) * 2 + 1;
				
				let hoveredItems = gfx.intersects(event, camera, targetList);
				self.handleHovers(hoveredItems);
			};
			window.addEventListener('mousemove', onMouseMove, false);
			
			document.querySelector('canvas').addEventListener('click', function(event) {
				let clickedItems = gfx.intersects(event, camera, targetList);
				self.handleClicks(clickedItems);
			});
		},
		
		handleHovers: function(hoveredItems) {
			let self = this;
			self.hideAllBubbleLabels();
			
			if (hoveredItems) {
				self.showLabel(hoveredItems[0].object);
			}
		},
		
		showLabel: function(mesh) {
			mesh.line.visible = true;
			mesh.label.visible = true;
			mesh.material.opacity = bubbleOpacity + .25;
		},
		
		hideLabel: function(mesh) {
			mesh.line.visible = false;
			mesh.label.visible = false;
			mesh.material.opacity = bubbleOpacity;
		},
		
		handleClicks: function(clickedItems) {
			let self = this;
			let label;
			if (clickedItems) {
				self.showLabel(clickedItems[0].object);
				// clickedLabels.push(label[0], label[1]);
			}
			else {
				self.hideClickedBubbleLabels();
			}
		},
		
		d3Stripes: function(geometry, colorScheme) {
			let self = this;
			let colors = [];
			let vertexCount = geometry.attributes.position.count;
			for (let i = 0; i < vertexCount; i++) {
				let interpolator = (i/(vertexCount - 1));
				// console.log(Math.floor(interpolator*10), colorScheme[Math.floor(interpolator*10)]);
				colors[i] = self.hexStringToColor(colorScheme[i%colorScheme.length]);
			}
			return colors;
		},
		
		interpolateD3Colors: function(geometry, color1, color2, interpolatorFunc, reverse) {
			let self = this;
			reverse = reverse || false;
			let colors = [];
			let vertexCount = geometry.attributes.position.count;
			for (let i = 0; i < vertexCount; i++) {
				let interpolator = (i/(vertexCount - 1));
				// colors[i] = color1.clone().lerp(color2, interpolator);
				colors[i] = self.rgbStringToColor(interpolatorFunc(interpolator));
			}
			if (reverse) colors.reverse();
			return colors;
		},
		
		interpolateColors: function(geometry, color1, color2, reverse) {
			let self = this;
			reverse = reverse || false;
			let colors = [];
			let vertexCount = geometry.attributes.position.count;
			for (let i = 0; i < vertexCount; i++) {
				let interpolator = (i/(vertexCount - 1));
				colors[i] = color1.clone().lerp(color2, interpolator);
			}
			if (reverse) colors.reverse();
			return colors;
		},
		
		rgbStringToColor: function(rgbString) {
			rgbString = rgbString.replace('rgb(','').replace(')','').replace(' ','').split(',');
			return new THREE.Color(rgbString[0]/255, rgbString[1]/255, rgbString[2]/255);
		},
		
		hexStringToColor: function(hexString) {
			return new THREE.Color().set(hexString);
		},
		
		addGrid: function(size, worldColor, gridColor) {
				
			let zBuff = gfx.appSettings.zBuffer;
			var planeGeometry = new THREE.PlaneBufferGeometry(size, size);
			planeGeometry.rotateX(-Math.PI / 2);
			var planeMaterial = new THREE.ShadowMaterial();

			var plane = new THREE.Mesh(planeGeometry, planeMaterial);
			plane.position.y = -1;
			plane.receiveShadow = true;
			scene.add(plane);
			var helper = new THREE.GridHelper(size, 20, gridColor, gridColor);
			helper.material.opacity = .75;
			helper.material.transparent = true;
			helper.position.set(zBuff, 0, -zBuff);
			scene.add(helper);
			
			let wall = new THREE.GridHelper(size, 20, gridColor, gridColor);
			wall.material.opacity = .75;
			wall.material.transparent = true;
			
			let left = wall.clone();
			left.rotation.x = Math.PI/2;
			left.position.set(0, size/2, -size/2 - zBuff);
			scene.add(left);
			let right = helper.clone();
			right.rotation.set(Math.PI/2, 0, Math.PI/2);
			right.position.set(size/2, size/2, -zBuff);
			scene.add(right);
			
			let white = 0xffffff;
			bottomLeft = new THREE.Vector3(-size/2, 0, -size/2), nearestCorner = new THREE.Vector3(-size/2, 0, size/2);
			gfx.drawLineFromPoints(bottomLeft, new THREE.Vector3(-size/2, size, -size/2), white, .5);
			gfx.drawLineFromPoints(bottomLeft, new THREE.Vector3(-size/2, 0, size/2), white, .5);
			gfx.drawLineFromPoints(new THREE.Vector3(-size/2, 0, size/2), new THREE.Vector3(size/2, 0, size/2), white, .5);

			scene.background = worldColor;
			//scene.fog = new THREE.FogExp2(new THREE.Color('black'), 0.002);
			
			return plane;
		},
		
		loadData: function() {
				
			let self = this;
			let dataset = pastData;
			
			let preparePast = function(d, i) {
				let row = {};
				row.year = d['Year'];
				row.amount = d['Global plastics production (million tons)'];
				return row;
			};
				
			d3.csv('./assets/data/global-plastics-production.csv', preparePast).then(function(dataset) {
				pastData = dataset;
				self.lineChart();
				
				let length = settings.gridSize;
				let size = settings.gridSize;
				let interval = length/settings.axes.count;
				let bottomLeft = new THREE.Vector3(-size/2, 0, -size/2), nearestCorner = new THREE.Vector3(-size/2, 0, size/2);
				let axisScaleLabelColor = 0xffffff;
				let count = settings.axes.count;
				let tickLength = settings.axes.tickLength;
				let tick = new THREE.Vector3(-tickLength, 0, 0), tickRight = new THREE.Vector3(0, 0, tickLength);
				let maxValue = d3.max(dataset, function (d) { return +d.amount; });
				var yScale = d3.scaleLinear().domain([0, maxValue]).range([0, settings.gridSize]);
				
				let label = 'Production';
				let charWidth = size/50;
				gfx.labelLarge(new THREE.Vector3(-size/2 - (label.length * charWidth) - (maxValue.toString().length * charWidth) - 3, size/2, -size/2), label, 0xffffff);
				
				for (let i = 0; i < count+ 1; i += 2) { // y-axis ticks
					let tickOrigin = gfx.movePoint(bottomLeft, new THREE.Vector3(0, i*interval, 0));
					gfx.drawLine(tickOrigin, tick);
					let label = ((maxValue/20) * (i + 1));
					if (label > 1000000) label = label.toExponential();
					label = label.toString();
					let offset = new THREE.Vector3(-(interval/4)*(label.length+1) , -1, 0);
					gfx.labelPoint(gfx.movePoint(tickOrigin, offset), label, settings.axes.color);
				}
			});
		},
		
		lineChart: function() {
			
			let self = this;
			let dataset = pastData;
			let offset = settings.gridSize/2;
			var xScale = d3.scaleLinear().domain([1950, 2015]).range([-offset, settings.gridSize - offset]); 
			
			let maxValue = d3.max(dataset, function (d) { return +d.amount; });
			var yScale = d3.scaleLinear().domain([0, maxValue]).range([0, settings.gridSize]);
			
			let prevPoint = null, prevXYProjection = null, prevZYProjection = null;
			dataset.forEach(function(row, index) {
				let colorScheme = d3.interpolateRdBu;
				colorScheme = [d3.interpolateRainbow, d3.interpolateRgb('#450F66', '#B36002'), d3.interpolateRdBu];
				let color = self.ramp(interps[2], index, dataset.length);
				let currentPoint = new THREE.Vector3(xScale(row.year), yScale(row.amount), xScale(row.year));
				// gfx.showPoint(currentPoint, white, 4, .5);
				
				let fillLineChart = false;
				if (prevPoint !== null) gfx.drawLineFromPoints(prevPoint, currentPoint, color, 1);
				if (prevPoint !== null && fillLineChart) {
					
					let fillGeometry = new THREE.Geometry();
					
					fillGeometry.vertices.push(
						new THREE.Vector3(prevPoint.x, 0, prevPoint.z),
						new THREE.Vector3(prevPoint.x, prevPoint.y, prevPoint.z),
						new THREE.Vector3(currentPoint.x, currentPoint.y, currentPoint.z),
						new THREE.Vector3(currentPoint.x, 0, currentPoint.z)
					);

					fillGeometry.faces.push(new THREE.Face3(0, 1, 2));
					fillGeometry.faces.push(new THREE.Face3(2, 3, 0));
					var material = new THREE.MeshBasicMaterial({ color: color,
						side: THREE.DoubleSide
					});
					var mesh = new THREE.Mesh(fillGeometry, material);
					scene.add(mesh);
				}
				prevPoint = currentPoint;
				
				// gfx.drawLineFromPoints(new THREE.Vector3(currentPoint.x, 0, currentPoint.z), currentPoint, color, .1); // add pretty vertical lines
				
				let enableXYProjection = true;
				if (enableXYProjection) {
					let xyProjection = new THREE.Vector3(currentPoint.x, currentPoint.y, 0 - settings.gridSize/2);
					gfx.drawLineFromPoints(xyProjection, currentPoint, white, .05); // y-value indicators
					if (prevXYProjection !== null) gfx.drawLineFromPoints(prevXYProjection, xyProjection, red, 1);
					prevXYProjection = xyProjection;
				}
				
				let enableZYProjection = false;
				if (enableZYProjection) {
					let zyProjection = new THREE.Vector3(settings.gridSize/2, currentPoint.y, currentPoint.z);
					gfx.drawLineFromPoints(zyProjection, currentPoint, white, .1); // y-value indicators
					if (prevZYProjection !== null) gfx.drawLineFromPoints(prevZYProjection, zyProjection, blue, .5);
					prevZYProjection = zyProjection;
				}
			});
		},
		
		ramp: function(color, index, total) { // pass a color interpolator or array of colors. will return a color based on percentage index / total
			return color(index / (total - 1));
		}
	}
}