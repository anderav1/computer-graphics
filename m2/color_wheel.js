// color_wheel.js
var VSHADER_SOURCE = `#version 300 es
   in vec4 a_Position;
   in vec4 a_Color;
   out vec4 v_Color;
   void main() {
     gl_Position = a_Position;
     v_Color = a_Color;
}`;

var FSHADER_SOURCE = `#version 300 es
   precision mediump float;
   
   in vec4 v_Color;
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = v_Color;
}`;

function main() {
  var canvas = document.getElementById('canvas');

  var gl = canvas.getContext("webgl2");
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
    
  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
    
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw triangle fan
  gl.drawArrays(gl.TRIANGLE_FAN, 0, n);  
}

function rad2deg(r) { // radian to degrees
  return (r * 180 / Math.PI) % 360; // angle in degrees
}

function deg2rad(a) { // degrees to radian
  return (Math.PI * a) / 180.0;   
}

function initVertexBuffers(gl) {
  let g_points = [];

  let n = 50; // number of vertices
  let radius = 0.8;  
  angle = deg2rad(360.0/n); // angle increment in radian  
  let st_angle = deg2rad(90); // 90 degree in radian
  let a = rad2deg(st_angle); // current angle in degrees
  
  // Store (x, y, r, g, b) values to g_points array  
  g_points.push(0.0); g_points.push(0.0); // center
  let c = hsv2rgb(a, 0, 1); // center: saturation = 0  
  g_points.push(c.r); g_points.push(c.g); g_points.push(c.b); 
  for (let i = 0; i < n; i++) {    
    a = st_angle + angle * i; // current angle in radian
    let x = Math.cos(a) * radius; 
    let y = Math.sin(a) * radius;   
    g_points.push(x); 
    g_points.push(y);    
    a = rad2deg(a); // current angle in degrees    
    c = hsv2rgb(a, 1, 1);    
    g_points.push(c.r); g_points.push(c.g); g_points.push(c.b); 
  }
  g_points.push(0.0); g_points.push(radius); // st_vertex  
  a = rad2deg(st_angle); // start angle in degrees    
  c = hsv2rgb(a, 1, 1);  
  g_points.push(c.r); g_points.push(c.g); g_points.push(c.b); 
   
  let vertices = new Float32Array(g_points);

  var vertexColorBuffer = gl.createBuffer();  

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
  const FSIZE = vertices.BYTES_PER_ELEMENT; // 4 bytes for float

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
  gl.enableVertexAttribArray(a_Position); 
  
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2);
  gl.enableVertexAttribArray(a_Color); 

  return (n+2); // origin and st_vertex must be included 
}

// h = [0,360], s = [0,1], v = [0,1]
// r, g, b range in [0, 1]
function hsv2rgb(h, s, v)
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

