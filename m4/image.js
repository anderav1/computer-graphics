var VSHADER_SOURCE = `#version 300 es
  in vec4 a_position;
  in vec2 a_texCoord;
  out vec2 v_texCoord;
  void main() {
     gl_Position = a_position;   
     v_texCoord = a_texCoord;
  }
`;

var FSHADER_SOURCE = `#version 300 es
  precision mediump float;

  uniform sampler2D u_image;
  in vec2 v_texCoord;
  out vec4 cg_FragColor;
  void main() {
     cg_FragColor = texture(u_image, v_texCoord);
  }
`;

function main() {
  var canvas = document.getElementById('canvas');

  // Use webgl2 
  var gl = canvas.getContext("webgl2");
  
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  
  var image = new Image(); // javascript Image object  
  let url = "http://www.cs.umsl.edu/~kang/htdocs/images/butterfly.jpg";
  image.crossOrigin = ""; // request CORS permission 
  image.src = url; 
  image.onload = function() { render(canvas, gl, image); };
}

function render(canvas, gl, image) {  
  // look up where the vertex data needs to go
  var a_position = gl.getAttribLocation(gl.program, "a_position");
  var a_texCoord = gl.getAttribLocation(gl.program, "a_texCoord");

  var positionBuffer = gl.createBuffer();
  
  // provide vertex positions to create rectangle
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  // provide texture coordinates for the rectangle
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);

  // Create a texture
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE0); // this is current texture id of interest
  gl.bindTexture(gl.TEXTURE_2D, texture); // bound to TEXTURE0 

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  // Tell WebGL how to convert from clip space to pixels
  canvas.width = image.width;
  canvas.height = image.height;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // use entire canvas

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Turn on the position attribute
  gl.enableVertexAttribArray(a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(a_texCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

  // Supply uniform texture sampler value as 0
  let u_Sampler = gl.getUniformLocation(gl.program, 'u_image');
  gl.uniform1i(u_Sampler, 0); // texture id = 0
  
  // Draw the rectangle (6 vertices)
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

