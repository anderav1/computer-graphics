// zoom.js
var VSHADER_SOURCE = `#version 300 es
   in vec4 a_Position;
   in vec4 a_Color;
   out vec4 v_Color;
   uniform mat4 u_ModelMatrix;
   void main() {     
     gl_Position = u_ModelMatrix * a_Position;
     v_Color = a_Color;
}`;

var FSHADER_SOURCE = `#version 300 es
   precision mediump float;
   in vec4 v_Color;
   out vec4 cg_FragColor;
   void main() {
     vec2 uv = gl_FragCoord.xy / 400.0; // [0, 1]
     uv = uv * 2.0 - 1.0; // [-1, 1] 
     float s = distance(uv, vec2(0.0)) / sqrt(2.0); // [0, 1]
     s = 1.0 - s * s * s;
     cg_FragColor = vec4(v_Color.rgb * s, 1.0);
}`;

function Polygon() { 
  this.vert = 0; // how many vertices this polygon has
  this.offset = 0; // how many vertices before this polygon
  this.s = 1; // scale factor for this polygon 
  this.wait = 0; // wait time before scaling begins 
}

let polygons = []; // polygons array

let speed = 30; // animation speed
let angle = 0; // initial rotation angle
let hue = 80;
let si = 0; // starting index

function main() {
   var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  initVertexBuffers(gl);        
  
  let curAngle = 0.0;
  var modelMatrix = new Matrix4();
  
  // Pass the model matrix to the vertex shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');  
  
  // Animate
  (function update() {
    animate();  // Update the rotation angle
    drawPolygons(gl, curAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
    requestAnimationFrame(update); // Request that the browser calls tick
  })();    
}

function drawPolygons(gl, curAngle, modelMatrix, u_ModelMatrix) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);    
  
  let m = polygons.length;

  for (let i = 0; i < m; i++) { // draw all stars    
    
    let k = (si + i) % m; // starting index in this cycle

    let s = polygons[k].s;
    modelMatrix.setIdentity();  // Set identity matrix
    modelMatrix.scale(s, s, 1); // uniform scaling
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes for float

	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, FSIZE*5*polygons[k].offset);
	gl.enableVertexAttribArray(a_Position); 

	gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE*2+FSIZE*5*polygons[k].offset);
	gl.enableVertexAttribArray(a_Color); 

    gl.drawArrays(gl.TRIANGLE_FAN, 0, polygons[k].vert); // TRIANGLE_STRIP for thick stroke       
  }
}

let iTime = 0; // total time
let prv = Date.now();
function animate() {
  // Calculate the elapsed time
  var now = Date.now();
  var deltaTime = (now - prv) * 0.001;
  iTime += deltaTime;
  prv = now;
  let m = polygons.length; 
  for (let i = 0; i < m; i++) { // draw all hexagons
    if (iTime < polygons[i].wait) continue;
    let s = polygons[i].s; // scale factor for this polygon
    s += deltaTime * 0.2; // make polygon bigger
    if (s > 2) { // this polygon has grown out of screen
    	s = 0; // reset
    	si = (si + 1) % m; // make sure this polygon is drawn last
    }
    polygons[i].s = s; // update scale for this polygon
  }
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
  
  let m = 10; // total number of polygons
  let radius = 1; // radius of polygon 

  for (let k = 0; k < m; k++) {
    let n = 10; // must be even number
    let angle = 360.0 / n;  
    angle = (Math.PI * angle) / 180.0; // radian
    let st_angle = deg2rad(90); // 90 degree in radian
    let a = rad2deg(st_angle); // current angle in degrees

    let cx = 0;
    let cy = 0;
    let st_x, st_y;
    let col1, col2;

    col1 = [Math.random(), Math.random(), Math.random()];
    col2 = [Math.random(), Math.random(), Math.random()];
    
    g_points.push(cx); g_points.push(cy); // center
    let c = [0, 0, 0]; // center: black  
    g_points.push(c[0]); g_points.push(c[1]); g_points.push(c[2]);

    for (let i = 0; i < n; i++) { 
      a = st_angle + angle * i; // current angle in radian
      let x = Math.cos(a) * radius; 
      let y = Math.sin(a) * radius;   
      g_points.push(x); 
      g_points.push(y);
      a = rad2deg(a); // current angle in degrees    
      let c = i % 2 == 0 ? col1 : col2;
      g_points.push(c[0]); g_points.push(c[1]); g_points.push(c[2]); 

      if (i == 0) { st_x = x; st_y = y; }    
    }

    g_points.push(st_x); g_points.push(st_y); // st_vertex
    a = rad2deg(st_angle); // start angle in degrees    
    c = n % 2 == 0 ? col1 : col2;
    g_points.push(c[0]); g_points.push(c[1]); g_points.push(c[2]);
 
    polygons.push(new Polygon());  
    polygons[k].vert = n + 2; // add center and last vertex    
    polygons[k].wait = k * 1; // [0, 1]
    polygons[k].s = 0;

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

