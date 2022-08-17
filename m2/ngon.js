// ngon.js
var VSHADER_SOURCE =
  `attribute vec4 a_Position;
   void main() {
     gl_Position = a_Position;     
   }`;

var FSHADER_SOURCE =
  `void main() {
     gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);     
   }`;

function main() {
   var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
 
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
    
  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw triangle fan
  gl.drawArrays(gl.TRIANGLE_FAN, 0, n);  
}

function initVertexBuffers(gl) {
  let g_points = [];

  let n = 8; // number of vertices
  let angle = 360.0 / n;  
  angle = (Math.PI * angle) / 180.0; // radian
  let st_angle = Math.PI / 2.0; // 90 degree
    
  g_points.push(0.0); g_points.push(0.0); // origin
  for (let i = 0; i < n; i++) {    
    let x = Math.cos(st_angle + angle * i) * 0.5; // radius = 0.5
    let y = Math.sin(st_angle + angle * i) * 0.5; // radius = 0.5
    g_points.push(x); 
    g_points.push(y);    
  }
  g_points.push(0.0); g_points.push(0.5); // st_vertex

  let vertices = new Float32Array(g_points);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
 
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  return (n+2); // origin and st_vertex must be included 
}
