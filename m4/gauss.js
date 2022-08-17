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
  uniform vec2 u_texelSize; 
  out vec4 cg_FragColor;
  uniform float u_sigma; // gaussian kernel size

  void main () {
      float x = v_texCoord.x;
      float y = v_texCoord.y;
      float dx = u_texelSize.x; // distance to the next pixel along x
      float dy = u_texelSize.y; // distance to the next pixel along y

      float twoSigma2 = 2.0 * u_sigma * u_sigma;
      vec4 sum = vec4(0.0, 0.0, 0.0, 0.0);
      float w_sum = 0.0;

      for (float s = -u_sigma; s <= u_sigma; s+=1.0) {	
        for (float t = -u_sigma; t <= u_sigma; t+=1.0) {
          float d = sqrt(s*s + t*t); // distance from center		
          float weight = exp(-d*d / twoSigma2); // gaussian function
          vec4 val = texture(u_image, vec2(x+dx*s, y+dy*t));
          sum += weight * val; // sum is float4
          w_sum += weight;
        }
      }		

      sum /= w_sum; // normalize weight to [0, 1]

      cg_FragColor = sum; // gaussian filtered color   
  }       
`;

let config = {
    BLUR_LEVEL: 5.0, // blur level  
}

function startGUI () {    
    var gui = new dat.GUI({ width: 300 });
    gui.add(config, 'BLUR_LEVEL', 0.1, 10.0).name('blur level').onFinishChange(main);        
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

  let u_sigma = gl.getUniformLocation(gl.program, 'u_sigma');
  gl.uniform1f(u_sigma, config.BLUR_LEVEL);

  // normalized texel size
  let u_texelSize = gl.getUniformLocation(gl.program, 'u_texelSize');
  gl.uniform2f(u_texelSize, 1.0/image.width, 1.0/image.height);

  // Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

