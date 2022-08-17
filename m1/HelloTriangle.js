// Vertex shader program
var VSHADER_SOURCE =`#version 300 es
  in vec4 a_Position;
  void main() {
   gl_Position = a_Position;
   gl_PointSize = 10.0;
}`;

// Fragment shader program
var FSHADER_SOURCE =`#version 300 es
  precision highp float;
  out vec4 cg_FragColor;
  void main() {
   cg_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = canvas.getContext('webgl2');
  
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // Write the positions of vertices to a vertex shader
  initVertexBuffers(gl);
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, 3); 
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  
  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
 
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
 
  // Assign buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
}
