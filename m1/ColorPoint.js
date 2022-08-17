let VSHADER_SOURCE = `
  attribute vec4 a_Position; // attribute variable
  void main() {
    gl_Position = a_Position; // xyzw
    gl_PointSize = 10.0; // default: 1.0
  }`;

let FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_Color; // uniform variable
  void main() {
    gl_FragColor = u_Color; // rgba
  }`;

function main() {
  var canvas = document.getElementById("webgl");

  var gl = getWebGLContext(canvas); // obtain context

  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");

  let u_Color = gl.getUniformLocation(gl.program, "u_Color");

  canvas.onmousedown = function(e) {
    click(e, gl, canvas, a_Position, u_Color);
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0); // rgba

  gl.clear(gl.COLOR_BUFFER_BIT); // clear the background

  //gl.vertexAttrib3f(a_Position, 0.4, 0.3, 0.0); // xyz 

  //gl.drawArrays(gl.POINTS, 0, 1); // execute vertex shader once
}

let g_points = []; // array of mouse-click positions
let g_colors = []; // array of point colors

function click(e, gl, canvas, a_Position, u_Color) {

  let x = e.offsetX;
  let y = e.offsetY; 

  // normalize (x, y) to range in ([-1, 1], [-1, 1])
  x = x / canvas.width * 2 - 1; // [-1, 1]
  y = - (y / canvas.height * 2 - 1); // [-1, 1]

  g_points.push([x, y]);  
  // [{0.4, 0.3], [-0.6, 0.7], [-0.5, -0.4]]

  let r = Math.random(); // [0, 1]
  let g = Math.random(); // [0, 1]
  let b = Math.random(); // [0, 1]

  g_colors.push([r, g, b, 1]); // append new random color 

  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let i = 0; i < g_points.length; i++) {
    let p = g_points[i]; // [x, y]
    let c = g_colors[i]; // [r, g, b, a]

    gl.vertexAttrib3f(a_Position, p[0], p[1], 0.0);

    gl.uniform4f(u_Color, c[0], c[1], c[2], c[3]);

    gl.drawArrays(gl.POINTS, 0, 1); // execute vertex shader once

  }
}