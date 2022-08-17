var VSHADER_SOURCE = `#version 300 es
  in vec4 a_Position; 
  uniform mat4 u_ModelMatrix;  // 4x4 matrix 
  void main() {
    gl_Position = u_ModelMatrix * a_Position;
}`;

var FSHADER_SOURCE = `#version 300 es
  precision highp float;
  out vec4 cg_FragColor;
  void main() {
    cg_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;

let gl, canvas;
let u_ModelMatrix; // pointer to the uniform GPU variable u_ModelMatrix
let modelMatrix; // cpu-side translation matrix
let angle = 0; // displacement
let speed = 20; // speed of animation

function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('canvas');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl2");
  
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // Write the positions of vertices to a vertex shader
  initVertexBuffers();
  
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  modelMatrix = new Matrix4(); // identity matrix

  let update = function() {
    animate();
    draw();
    requestAnimationFrame(update); // request to call update again
  };
  update();
}

function draw() {
  modelMatrix.setRotate(angle, 0, 0, 1); 

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

let prev = Date.now();
function animate() {
  let now = Date.now(); // milliseconds
  let deltaTime = (now - prev) * 0.001; // how many seconds have elapsed
  prev = now;
  angle -= deltaTime * speed;
  angle %= 360; // keep angle within [0, 360]
}

function initVertexBuffers() {
  var vertices = new Float32Array ([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
}

