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
  uniform float u_saturation;
  out vec4 cg_FragColor;
  
  vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {     
      vec4 c = texture(u_image, v_texCoord);    
      vec3 hsv = rgb2hsv(c.rgb); // convert to hsv 
      hsv.g = clamp(hsv.g * u_saturation, 0.0, 1.0); // saturation adjust        
      vec3 rgb = hsv2rgb(hsv); // back to rgb

      cg_FragColor = vec4(rgb, 1.0);    
  }       
`;

let config = {
    SATURATION: 1.0, // saturation  
}

function startGUI () {    
    var gui = new dat.GUI({ width: 300 });
    gui.add(config, 'SATURATION', 0, 4.0).name('saturation').onFinishChange(main);    
}

startGUI();

function main() {
  var canvas = document.getElementById('canvas');

  // Use webgl2 
  var gl = canvas.getContext("webgl2");
  
  // Initialize shaders
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  
  var image = new Image();  
  let url = "http://www.cs.umsl.edu/~kang/htdocs/images/butterfly.jpg";
  image.crossOrigin = ""; // request CORS permission
  image.src = url; 
  image.onload = function() { render(canvas, gl, image); };
}

function render(canvas, gl, image) {  
  // look up where the vertex data needs to go.
  var a_position = gl.getAttribLocation(gl.program, "a_position");
  var a_texCoord = gl.getAttribLocation(gl.program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);

  // Create a texture.
  var texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

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
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Turn on the position attribute
  gl.enableVertexAttribArray(a_position);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

  // Turn on the teccord attribute
  gl.enableVertexAttribArray(a_texCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

  let u_Sampler = gl.getUniformLocation(gl.program, 'u_image');
  gl.uniform1i(u_Sampler, 0);

  let u_saturation = gl.getUniformLocation(gl.program, 'u_saturation');
  gl.uniform1f(u_saturation, config.SATURATION);

  // Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

