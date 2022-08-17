// dna.js
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
  this.offset = 0; // how many vertices before this polygon
}

let modelMatrix, u_ModelMatrix;
let half = 7; // half of total bars
let w = 1.2; // bar width
let h = 0.3; // bar height
let ty = 0; // initial vertical displacement of dna element 1
let ty2 = -half * h * 2; // initial vertical displacement of dna element 2

let rect = []; // rectangles array
let circles = []; // circles array

var rectBuffer, circleBuffer; // VBOs

function main() {
   var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  
  modelMatrix = new Matrix4();
  
  // Pass the model matrix to the vertex shader
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');  
  
  initRectangleVBO(gl); // create rectBuffer VBO
  initCircleVBO(gl); // create circleBuffer VBO

  // Animate
  (function update() {
    animate();  // Update the rotation angle
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);    
    
    drawRectangles(gl, ty); // dna elemnent 1
    drawRectangles(gl, ty2);  // dna elemnent 2

    drawCircles(gl, 1, ty, 61/255, 171/255, 252/255); // dna elemnent 1 (blue) 
    drawCircles(gl, -1, ty, 255/255, 120/255, 51/255); // dna elemnent 1 (orange)
    drawCircles(gl, 1, ty2, 61/255, 171/255, 252/255); // dna elemnent 2 (blue)
    drawCircles(gl, -1, ty2, 255/255, 120/255, 51/255); // dna elemnent 2 (orange)
      
    requestAnimationFrame(update); // Request that the browser calls update
  })();    
}

let iTime = 0; // total time
var prv = Date.now();
function animate() {
  // Calculate the elapsed time
  var now = Date.now();
  var deltaTime = (now - prv) * 0.001; // how many seconds have elapsed
  iTime += deltaTime; // update current time
  prv = now;
  
  ty += deltaTime * 0.2; // move dna element 1 up
  if (ty > half * h * 2) ty = -half * h * 2; // if out of window, move it back
  ty2 += deltaTime * 0.2; // move dna element 2 up 
  if (ty2 > half * h * 2) ty2 = -half * h * 2; // if out of window, move it back
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

function initRectangleVBO(gl) {
  
  let g_points = [];
  
  for (let i = -half; i <= half; i++) {
    
    let cx, cy;
    let x1, y1, x2, y2, x3, y3, x4, y4;     
    cx = 0;    
    cy = i * h; // [-7 * 0.3, 7 * 0.3]

    let ratio = 0.35; // create a little gap between bars
    x1 = cx - w * 0.5; y1 = cy - h * ratio * 0.5; // lower left
    x2 = cx - w * 0.5; y2 = cy + h * ratio * 0.5; // top left
    x3 = cx + w * 0.5; y3 = cy - h * ratio * 0.5; // lower right 
    x4 = cx + w * 0.5; y4 = cy + h * ratio * 0.5; // top right
    g_points.push(x1); g_points.push(y1);
    g_points.push(x2); g_points.push(y2);
    g_points.push(x3); g_points.push(y3);
    g_points.push(x4); g_points.push(y4);
    
    rect.push(new Polygon());
    rect[i+half].vert = 4; // quad    
    rect[i+half].center = [cx, cy];
    rect[i+half].w = w;
    rect[i+half].h = h;

    if (i > -half) rect[i+half].offset = rect[i+half-1].offset + rect[i+half-1].vert;       
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  rectBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function drawRectangles(gl, ty) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float
  
  let maxD = Math.PI;
  
  for (let i = -half; i <= half; i++) { // draw all bars  

    let x = i / half; // [-1, 1]
	x *= maxD; // [-PI, PI]
	let dist = x + maxD; // [0, 2PI]
	
	let sx = Math.sin(-iTime * 2 + dist); // [-1, 1]
	
    modelMatrix.setIdentity();  // Set identity matrix
    modelMatrix.translate(0, ty, 0); // move bars up    
    modelMatrix.scale(sx, 1, 1); // scale horizontally
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Bind the buffer object to rectBuffer VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);

    // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*rect[i+half].offset);
    gl.enableVertexAttribArray(a_Position);
    
    gl.uniform4f(u_Color, 1.0, 1.0, 0.2, 1.0); // yellow

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rect[i+half].vert); // TRIANGLE_STRIP for quad       
  }
}

function initCircleVBO(gl) {
  let g_points = [];

  let cx = 0;

  for (let i = -half; i <= half; i++) { // draw all circles
  
    let n = 30; // number of vertices
    let angle = 360.0 / n;  
    angle = (Math.PI * angle) / 180.0; // radian
    let radius = 0.12; // radius of polygon 

    let cy = i * h;
    
    g_points.push(cx); g_points.push(cy); // center

    for (let k = 0; k < n; k++) {    
      let x = cx + Math.cos(angle * k) * radius; 
      let y = cy + Math.sin(angle * k) * radius; 
      g_points.push(x); 
      g_points.push(y);    
    }

    g_points.push(cx + radius); g_points.push(cy); // st_vertex

    circles.push(new Polygon());     
    circles[i+half].vert = n + 2; // add center and last vertex       
    circles[i+half].center = [cx, cy];
    
    if (i > -half) circles[i+half].offset = circles[i+half-1].offset + circles[i+half-1].vert;       
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  circleBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function drawCircles(gl, sign, ty, r, g, b) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  let maxD = Math.PI;
  
  for (let i = -half; i <= half; i++) { // draw all stars    

    let x = i / half; // [-1, 1]
	x *= maxD; // [-PI, PI]
	let dist = x + maxD; // [0, 2PI]
	
	let sx = Math.sin(-iTime * 2 + dist); // [-1, 1]
	
    modelMatrix.setIdentity();  // Set identity matrix      
    modelMatrix.translate(0, ty, 0); // move circle vertically  
    modelMatrix.translate(sign * sx * w * 0.5, 0, 0); // move circle horizontally
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Bind the buffer object to circleBuffer VBO
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);

    // stride = 0, offset = FSIZE * 2 * polgons[i].offset 
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, FSIZE*2*circles[i+half].offset);
    gl.enableVertexAttribArray(a_Position);
    
    let c = circles[i+half].color;
    gl.uniform4f(u_Color, r, g, b, 1.0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, circles[i+half].vert); // TRIANGLE_FAN for circle
  }
}