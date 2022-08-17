let VSHADER_SOURCE = `#version 300 es
  in vec4 a_Position; // attribute variable
  out vec4 v_Position; // [-1, 1]
  void main() {
    gl_Position = a_Position; // xyzw
    v_Position = a_Position; // send to fragment shader
    gl_PointSize = 10.0; // default: 1.0
  }`;

let FSHADER_SOURCE = `#version 300 es
  precision highp float;
  in vec4 v_Position; // passed from vertex shader
  out vec4 cg_FragColor;
  void main() {
    vec3 color = abs(v_Position.rgb); // take absolute values
    cg_FragColor = vec4(color, 1.0); // rgba
  }`;

function main() {
  
  var canvas = document.getElementById("canvas");

  let gl = canvas.getContext('webgl2'); // obtain context

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");

  gl.clearColor(0.0, 0.0, 0.0, 1.0); // rgba
  gl.clear(gl.COLOR_BUFFER_BIT); // clear the background

  for (let i = 0; i < 20; i++) {
    let x = Math.random() * 2 - 1; // [-1, 1]
    let y = Math.random() * 2 - 1; // [-1, 1]
    gl.vertexAttrib3f(a_Position, x, y, 0.0); // xyz 
    gl.drawArrays(gl.POINTS, 0, 1); // execute vertex shader once
  }
}

