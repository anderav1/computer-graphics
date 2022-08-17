// hexswirl.js
var VSHADER_SOURCE = `#version 300 es
   in vec4 a_Position;
   uniform mat4 u_ModelMatrix;
   void main() {     
     gl_Position = u_ModelMatrix * a_Position;
}`;

var FSHADER_SOURCE = `#version 300 es
   precision mediump float;
   uniform vec4 u_Color;
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = u_Color;     
}`;

function Polygon() { 
  this.vert = 0; // how many vertices this polygon has
  this.color = [0, 0, 0]; // color of this polygon
  this.offset = 0; // how many vertices before this polygon
  this.s = 1; // scale factor for this polygon 
}

let polygons = []; // polygons array

let speed = 30; // animation speed
let angle = 0; // initial rotation angle
let hue = 80;
let rotation_scale = 1;

function main() {
   var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  initVertexBuffers(gl);        
  
  var modelMatrix = new Matrix4();
  
  // Pass the model matrix to the vertex shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');  
  
  // Animate
  (function update() {
    animate();  // Update the rotation angle
    drawPolygons(gl, modelMatrix, u_ModelMatrix);   // Draw the triangle
    requestAnimationFrame(update); // Request that the browser calls tick
  })();    
}

function drawPolygons(gl, modelMatrix, u_ModelMatrix) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);    
  
  for (let i = 0; i < polygons.length; i++) { // draw all stars    
    
    let s = polygons[i].s;
    modelMatrix.setIdentity();  // Set identity matrix
    modelMatrix.rotate(angle + rotation_scale * i, 0, 0, 1); // bigger rotation for inner hex 
    modelMatrix.scale(s, s, 1); // uniform scaling
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*polygons[i].offset);
    gl.enableVertexAttribArray(a_Position);

    let c = polygons[i].color;
    gl.uniform4f(u_Color, c[0], c[1], c[2], 1.0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, polygons[i].vert); // TRIANGLE_FAN for hexagon       

  }
}

var prv = Date.now();
function animate() {
  var now = Date.now();
  var deltaTime = (now - prv) * 0.001; // how many seconds have elapsed
  prv = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  angle += deltaTime * speed;
  angle %= 360; // keep within [0, 360]
  rotation_scale += deltaTime * 3;
  rotation_scale %= 360; // keep within [0, 360]
}

function rad2deg(a) { // radian to degrees
  a = a * 180 / Math.PI; // angle in degrees
  a = a % 360; // keep in [0, 360]
  return a;
}

function deg2rad(a) { // degrees to radian
  a = (Math.PI * a) / 180.0;   
  return a;
}

function initVertexBuffers(gl) {
  let g_points = [];
  
  let m = 20; // total number of polygons
  let radius = 1; // default radius of polygon 

  for (let k = 0; k < m; k++) {
    let n = 6;
    let angle = 360.0 / n;  
    angle = (Math.PI * angle) / 180.0; // radian
    let st_angle = 90; // 90 degrees

    let cx = 0; // center x
    let cy = 0; // center y
    let st_x, st_y;

    g_points.push(cx); g_points.push(cy); // center

    for (let i = 0; i < n; i++) {    
      let x = cx + Math.cos(deg2rad(st_angle) + angle * i) * radius; 
      let y = cy + Math.sin(deg2rad(st_angle) + angle * i) * radius; 
      g_points.push(x); 
      g_points.push(y);
      if (i == 0) { st_x = x; st_y = y; }    
    }
    g_points.push(st_x); g_points.push(st_y); // starting vertex

    polygons.push(new Polygon());  
    polygons[k].vert = n + 2; // add center and last vertex    
    
    let val = (m - k) * 0.05; // inner hexagons are darker
    let c = hsv2rgb(hue, 1, val); // val means luminance
    polygons[k].color = [c.r, c.g, c.b];

    let s = (m - k) * 0.1; // inner hexagons are smaller
    polygons[k].s = s;

    if (k > 0) polygons[k].offset = polygons[k-1].offset + polygons[k-1].vert;       
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function hsv2rgb(h, s, v)
// h = [0,360], s = [0,1], v = [0,1]
// r, g, b range in [0, 1]
{
	if (s < 0.00001) { // saturation = 0
		// achromatic (grey)
		r = g = b = v;
		return { r, g, b }; // return object 		
	}
	h /= 60; // sector 0 to 5
	i = Math.floor(h); // convert to int
	f = h - i;	// factorial part of h
	p = v * ( 1 - s );
	q = v * ( 1 - s * f );
	t = v * ( 1 - s * ( 1 - f ) );
	switch (i) {
		case 0: r = v; g = t; b = p; break;
		case 1: r = q; g = v; b = p; break;
		case 2: r = p; g = v; b = t; break;
		case 3: r = p; g = q; b = v; break;
		case 4: r = t; g = p; b = v; break;
		default: r = v;	g = p; b = q; break;
	}
	return { r, g, b }; // return object 
}

function rgb2hsv(r, g, b) {
// h = [0,360], s = [0,1], v = [0,1]
// r, g, b range in [0, 1]

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }
  h *= 360;
  
  return { h, s, v }; // return object
}