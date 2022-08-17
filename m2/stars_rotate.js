var VSHADER_SOURCE =`#version 300 es
   in vec4 a_Position;
   uniform mat4 u_ModelMatrix;
   void main() {     
     gl_Position = u_ModelMatrix * a_Position;
}`;

var FSHADER_SOURCE =`#version 300 es
   precision mediump float;
   uniform vec4 u_Color;
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = u_Color;     
}`;

function starObject() {   
  this.color = [0, 0, 0]; // color of this star
  this.center = [0, 0]; // center (x, y) of this star
  this.offset = 0; // how many vertices before this star
}

let stars = []; // stars array

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
    curAngle = updateAngle(curAngle);  // Update rotation angle
    drawStars(gl, curAngle, modelMatrix, u_ModelMatrix);   
    requestAnimationFrame(update); // Request that browser call update
  })();    
}

function drawStars(gl, curAngle, modelMatrix, u_ModelMatrix) {  
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position'); 
  let u_Color = gl.getUniformLocation(gl.program, 'u_Color');  
  const FSIZE = Float32Array.BYTES_PER_ELEMENT; // 4 bytes per float

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);    
  
  for (let i = 0; i < stars.length; i++) { // draw all stars    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 
                            FSIZE*2*stars[i].offset);
    gl.enableVertexAttribArray(a_Position);

    let cx = stars[i].center[0]; 
    let cy = stars[i].center[1];
    
    modelMatrix.setIdentity();  // Set identity matrix
    modelMatrix.translate(cx, cy, 0); // Move rotation center to star    
    modelMatrix.rotate(curAngle, 0, 0, 1);  // Set rotation matrix
    
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    let c = stars[i].color;
    gl.uniform4f(u_Color, c[0], c[1], c[2], 1.0);
      
    gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw 2 TRIANGLES
  }
}

// Last time that this function was called
var g_last = Date.now();
function updateAngle(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update current rotation angle 
  const ANGLE_STEP = 45;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function initVertexBuffers(gl) {
  let g_points = [];
  
  let m = 20; // total number of stars  
    
  for (let k = 0; k < m; k++) {
    let x = Math.random() * 2 - 1.0; // center x in [-1, 1]
    let y = Math.random() * 2 - 1.0; // center y in [-1, 1]
    let x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6;
    let d = 0.15; // radius of star
    x1 = x;           y1 = y + d;
    x2 = x - 0.85*d;  y2 = y - 0.5*d;
    x3 = x + 0.85*d;  y3 = y - 0.5*d;
    x4 = x;           y4 = y - d;
    x5 = x + 0.85*d;  y5 = y + 0.5*d;
    x6 = x - 0.85*d;  y6 = y + 0.5*d;

    // Store (x, y) values to g_points array
    g_points.push(x1);  g_points.push(y1);     
    g_points.push(x2);  g_points.push(y2);     
    g_points.push(x3);  g_points.push(y3);     
    g_points.push(x4);  g_points.push(y4);     
    g_points.push(x5);  g_points.push(y5); 
    g_points.push(x6);  g_points.push(y6);     
   
    stars.push(new starObject());      
    let r = Math.random();
    let g = Math.random();
    let b = Math.random();
    stars[k].color = [r, g, b];
    stars[k].center = [x, y];
    stars[k].offset = 6 * k;     
  }

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

