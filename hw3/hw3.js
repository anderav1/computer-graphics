// Author: Lexi Anderson (derived from Wave lecture)
// Date: October 10, 2021
// Description: Draw a sine wave animation that is 
// symmetric about the y-axis.

// wave.js
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
  this.center = [0, 0]; // center (x, y) of this star
  this.st_angle = 0; // starting angle
  this.offset = 0; // how many vertices before this polygon
  this.s = 1; // scale factor for this polygon 
}

let polygons = []; // polygons array
let half = 9; // half of total bars
let PI = 3.14159265;

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

  let maxD = PI;
  
  for (let i = -half; i <= half; i++) { // draw all stars    

    //let x = i / half; // [-1, 1] // original assignment
    
    /* use abs to produce symmetry */
    let x = Math.abs(i / half);
	x *= maxD; // [-PI, PI]
	let dist = x + maxD; // [0, 2PI]
	
	let sy = Math.sin(-iTime * 2 + dist); // [-1, 1]

	sy = 1.5 + sy; // [0.5, 2.5] make sure height stay positive

	let h = polygons[i+half].h;
	
    modelMatrix.setIdentity();  // Set identity matrix
    modelMatrix.translate(0, h * 0.5 * sy - 0.6, 0); // make all bars align horizontally
    modelMatrix.scale(1, sy, 1); // scaling up and down
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*polygons[i+half].offset);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_Color, 0.3, 0.9, 0.8, 1.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, polygons[i+half].vert); // TRIANGLE_STRIP for quad       

  }
}

let iTime = 0; // total time
var prv = Date.now();
function animate() {
  // Calculate the elapsed time
  var now = Date.now();
  var deltaTime = (now - prv) * 0.001; // how many seconds have elapsed
  iTime += deltaTime; // update current time
  prv = now;
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
  
  let h = 0.5; // bar height
  let w = 0.1; // bar width
  
  for (let i = -half; i <= half; i++) {
    
    let cx, cy;
    let x1, y1, x2, y2, x3, y3, x4, y4; 
    cx = i * w;
    cy = 0;
    let ratio = 0.8; // create a little gap between bars
    x1 = cx - w * ratio * 0.5; y1 = cy - h * 0.5; // lower left
    x2 = cx - w * ratio * 0.5; y2 = cy + h * 0.5; // top left
    x3 = cx + w * ratio * 0.5; y3 = cy - h * 0.5; // lower right 
    x4 = cx + w * ratio * 0.5; y4 = cy + h * 0.5; // top right
    g_points.push(x1); g_points.push(y1);
    g_points.push(x2); g_points.push(y2);
    g_points.push(x3); g_points.push(y3);
    g_points.push(x4); g_points.push(y4);
    
    polygons.push(new Polygon());
    polygons[i+half].vert = 4; // quad    
    polygons[i+half].center = [cx, cy];
    polygons[i+half].w = w;
    polygons[i+half].h = h;

    if (i > -half) polygons[i+half].offset = polygons[i+half-1].offset + polygons[i+half-1].vert;       
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

