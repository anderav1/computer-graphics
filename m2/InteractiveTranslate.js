var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';

var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n' +
  '}\n';

let Tx = 0.0; // displacement in x
let Ty = 0.0; // displacement in y
function main() {  
  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  
  window.addEventListener('keydown', e => keyDown(e, gl));

  // Create Matrix4 object for model transformation
  var modelMatrix = new Matrix4();

  // Calculate a model matrix
  modelMatrix.setIdentity();  // Set identity matrix
  modelMatrix.translate(Tx, Ty, 0); 
  
  // Pass the model matrix to the vertex shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function keyDown(e, gl) {
  if (e.key === 'ArrowRight') Tx += 0.1;
  if (e.key === 'ArrowLeft') Tx -= 0.1;
  if (e.key === 'ArrowUp') Ty += 0.1;
  if (e.key === 'ArrowDown') Ty -= 0.1;  
  drawTriangle(gl);
}

function drawTriangle(gl) { 
  var modelMatrix = new Matrix4();

  modelMatrix.setIdentity();  // Set identity matrix
  modelMatrix.translate(Tx, Ty, 0); 
  
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 3);  
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array([
    0, 0.3,   -0.3, -0.3,   0.3, -0.3
  ]);
  var n = 3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}


