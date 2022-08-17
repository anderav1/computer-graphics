// Author: Lexi Anderson (derived from ColorTriangle lecture)
// Date: September 23, 2021
// Description: Draw a triangle whose vertex positions and colors
//  are calculated randomly at runtime.

var VSHADER_SOURCE = `#version 300 es
   in vec4 a_Position; // per-vertex position
   in vec4 a_Color; // per-vertex color
   out vec4 v_Color; // varying variable
   void main() {
     gl_Position = a_Position;
     v_Color = a_Color; // pass color to fragment shader
}`;

var FSHADER_SOURCE = `#version 300 es
   precision mediump float;
   in vec4 v_Color; // per-fragment color (linearly interpolated)
   out vec4 cg_FragColor;
   void main() {
     cg_FragColor = v_Color;
}`;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL  
  var gl = canvas.getContext("webgl2");
  
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  initVertexBuffers(gl);
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw triangle
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function initVertexBuffers(gl) { 
  var verticesColors = new Float32Array(15); 

  // get random vertex positions
  for (let i = 0; i < 15; i++) {
    if (i % 5 == 0 || i % 5 == 1) { // x, y coords
      verticesColors[i] = 2 * Math.random() - 1;  // [-1, 1]
    } else {  // r, g, b values
      verticesColors[i] = Math.random();  // [0, 1]
    }
  }

  // Create VBO
  var vertexColorBuffer = gl.createBuffer();  
  
  // Bind VBO to ARRAY_BUFFER
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = Float32Array.BYTES_PER_ELEMENT;
  
  // Get storage location of a_Position, assign VBO and enable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of VBO

  // Get storage location of a_Color, assign VBO and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
  gl.enableVertexAttribArray(a_Color);  // Enable assignment of VBO

  // Unbind VBO
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}
