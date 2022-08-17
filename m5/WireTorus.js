var VSHADER_SOURCE = `#version 300 es
  in vec4 a_Position;   
  uniform mat4 u_MvpMatrix;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;
  }
`;

var FSHADER_SOURCE =  `#version 300 es
  precision mediump float;

  out vec4 cg_FragColor;
  
  void main() {
    cg_FragColor = vec4(1.0, 0.6, 0.0, 1.0);
  }
`;

function main() {
  var canvas = document.getElementById('canvas');

  var gl = canvas.getContext('webgl2');

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  // Set the vertex coordinates and color
  let n = initVertexBuffers(gl);
  
  // Set clear color 
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  
  // Set the eye point and the viewing volume
  var mvpMatrix = new Matrix4(); // identity matrix
  mvpMatrix.setPerspective(30, 1, 1, 100); // sets up P (4 x 4)
  //mvpMatrix.lookAt(4, 5, 10, 0, 0, 0, 0, 1, 0); // sets up V (4 x 4)
  mvpMatrix.lookAt(0, 10, 0, 0, 0, 0, 0, 0, 1); // sets up V (4 x 4)

  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  // Clear color buffer
  gl.clear(gl.COLOR_BUFFER_BIT); // no depth buffer needed here

  gl.drawElements(gl.LINE_LOOP, n, gl.UNSIGNED_SHORT, 0);
}

function initVertexBuffers(gl) {

  const RES = 30; // n in n-gon
  let outRad = 2; // outer radius
  let inRad = 1.3; // inner radius
  let mRad = (inRad + outRad) / 2; // middle radius of torus
  let sRad = (outRad - inRad) / 2; // cross section radius

  let vertices = [];

  for (let j = 0; j <= RES; ++j) {
    let phi = j * (2*Math.PI) / RES; // vertical angle
    let cosPhi = Math.cos(phi); // determines radius of current n-gon
    let sinPhi = Math.sin(phi); // determines height of current n-gon

    for (let i = 0; i <= RES; i++) {
      let theta = i * (2 * Math.PI) / RES; // horizontal angle
      let cosTheta = Math.cos(theta);
      let sinTheta = Math.sin(theta);

      let x = (mRad + sRad * cosPhi) * sinTheta;
      let z = (mRad + sRad * cosPhi) * cosTheta;
      let y = sRad * sinPhi; // height of current n-gon

      vertices.push(x);
      vertices.push(y);
      vertices.push(z);
    }
  }

  let indices = [];

  for (let j = 0; j < RES; j++) {
    for (let i = 0; i < RES; i++) {
      
      let down = j * (RES + 1) + i;
      let up = (j+1) * (RES + 1) + i;

      // upper triangle
      indices.push(up);
      indices.push(down);
      indices.push(up+1); 

      // lower triangle
      indices.push(down);
      indices.push(down+1);
      indices.push(up+1); 
    }
  }

  let vertexData = new Float32Array(vertices);
  let indexData = new Uint16Array(indices);

  // Write the vertex coordinates to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position); 

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

  return indices.length; // 36
}
