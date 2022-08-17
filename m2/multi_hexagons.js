// multi hexagons
var VSHADER_SOURCE =`#version 300 es
   in vec4 a_Position;
   void main() {     
     gl_Position = a_Position;
}`;

var FSHADER_SOURCE =`#version 300 es
   precision mediump float;
   uniform vec4 u_Color;
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = u_Color;     
}`;

function Polygon() {   
  this.vert = 0; // number of vertices for this polygon 
  this.color = [0, 0, 0]; // color of this star
  this.center = [0, 0]; // center (x, y) of this star
  this.offset = 0; // how many vertices before this star
}

let polygons = []; // polygons array

function main() {
   var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  initVertexBuffers(gl);        
  
  drawPolygons(gl);      
}

function drawPolygons(gl) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);    
  
  for (let i = 0; i < polygons.length; i++) { // draw all polygons    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 
                            FSIZE*2*polygons[i].offset);
    gl.enableVertexAttribArray(a_Position);

    let cx = polygons[i].center[0]; 
    let cy = polygons[i].center[1];
    
    let c = polygons[i].color;
    gl.uniform4f(u_Color, c[0], c[1], c[2], 1.0);
      
    gl.drawArrays(gl.TRIANGLE_FAN, 0, polygons[i].vert); // Draw 2 TRIANGLES
  }
}

function initVertexBuffers(gl) {
  let g_points = [];

  let m = 20; // total number of polygons

  for (let k = 0; k < m; k++) {

    let n = 6; // number of vertices
    let angle = 360.0 / n;  
    angle = (Math.PI * angle) / 180.0; // radian
    let radius = 0.15; // radius of polygon 

    let cx = Math.random() * 2 - 1.0; // center x in [-1, 1]
    let cy = Math.random() * 2 - 1.0; // center y in [-1, 1]
    
    g_points.push(cx); g_points.push(cy); // center

    for (let i = 0; i < n; i++) {    
      let x = cx + Math.cos(angle * i) * radius; 
      let y = cy + Math.sin(angle * i) * radius; 
      g_points.push(x); 
      g_points.push(y);    
    }

    g_points.push(cx + radius); g_points.push(cy); // st_vertex

    polygons.push(new Polygon());     
    polygons[k].vert = n + 2; // add center and last vertex   
    polygons[k].color = [Math.random(), Math.random(), Math.random()];
    polygons[k].center = [cx, cy];
    
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

