var VSHADER_SOURCE =`#version 300 es
   in vec4 a_Position; // vertex position 
   in vec4 a_Normal; // vertex normal 

   uniform mat4 u_MvpMatrix;      // MVP matrix
   uniform mat4 u_ModelMatrix;    // Model matrix needed for light vector calculation
   uniform mat4 u_NormalMatrix;   // Transformation matrix of normal vector
   uniform vec3 u_LightColor;     // Light color
   uniform vec3 u_LightPosition;  // Position of light source
   uniform vec3 u_AmbientLight;   // Ambient light color
   uniform vec4 u_Color; // material color 
   out vec4 v_Color; // surface color on this vertex

   void main() {
     
     gl_Position = u_MvpMatrix * a_Position; // projected vertex coordinates
     
     // Perform model transformation of normal vector, then normalize it
     vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
     
     // Calculate world coordinate of vertex after model transformation
     vec4 vertexPosition = u_ModelMatrix * a_Position;
     
     // Calculate light vector and normalize it
     vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
     
     // dot product of light vector and normal vector
     float nDotL = max(dot(lightDirection, normal), 0.0);
     
     vec4 color = u_Color; // start out with material color

     // Calculate color due to diffuse reflection
     vec3 diffuse = u_LightColor * color.rgb * nDotL;
     
     // Calculate color due to ambient reflection
     vec3 ambient = u_AmbientLight * color.rgb;
     
     // Add surface color due to diffuse reflection and ambient reflection
     v_Color = vec4(diffuse + ambient, color.a);
}`;

var FSHADER_SOURCE =`#version 300 es
   precision mediump float;
  
   in vec4 v_Color; // interpolated surface color for current pixel
   out vec4 cg_FragColor; 
   
   void main() {
     cg_FragColor = v_Color; // output the interpolated surface color
}`;

let config = {
    OBJECT: 1,
    ROTATE: false,
    SPEED: 0.5,
    RAINBOW: false,
    COLOR: "#00ffff"
}

let gui = new dat.GUI({ width: 300 });
function startGUI () {    
    gui.add(config, 'OBJECT', { 'Sphere': 0, 'Torus': 1, 'Cone': 2, 'Cube': 3 }).name('object').onChange(update);  
    gui.add(config, 'ROTATE').name('rotate?').onChange(update);
    gui.add(config, 'SPEED', 0.0, 1.0).name('speed');
    gui.add(config, 'RAINBOW').name('rainbow?').onChange(update);
    gui.addColor(config, 'COLOR').name('color').onChange(update);
}
startGUI();

let gl, canvas;
let indices = []; // number of indices for each object
let vao = []; // vertex array object (VAO) for each object
let modelMatrix; // make it global to keep track of transformations being updated
let animID; // animation id 
let color, hsv;

function update() {
  color = new THREE.Color( config.COLOR );

  cancelAnimationFrame(animID); // to avoid duplicate animation requests 
  drawObject(); 
}

function main() {
  canvas = document.getElementById('canvas');
  gl = canvas.getContext('webgl2');
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  
  // Generate 3D models
  indices.push(generateSphere());
  indices.push(generateTorus());
  indices.push(generateCone());
  indices.push(generateCube());

  modelMatrix = new Matrix4();  // Model matrix

  color = new THREE.Color( config.COLOR ); // color for dat.gui 

  drawObject(); // render current object 
}

function drawObject() {
  
  // Set clear color and enable depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST); // needed for hidden surface removal

  // Get the storage locations of uniform variables and so on
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_Color = gl.getUniformLocation(gl.program, 'u_Color');

  // Set light color 
  gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
  // Set light position (point light)
  gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
  // Set ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // add (h, s, v) component to color
  if (config.RAINBOW) {
    color = color.offsetHSL(0.005, 0.0, 0.0); // adjust hue a little bit
    config.COLOR = "#" + color.getHexString(); // convert to hexadecimal color code
    gui.__controllers[4].updateDisplay(); // update GUI color
  }

  // Set material color 
  gl.uniform4f(u_Color, color.r, color.g, color.b, 1.0);

  var mvpMatrix = new Matrix4(); // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
  
  // Calculate the view projection matrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(4, 5, 6, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(modelMatrix); // multiply up-to-date modelMatrix
  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  modelMatrix.rotate(config.SPEED, 0, 1, 0); // y-roll
  modelMatrix.rotate(2 * config.SPEED, 1, 0, 0); // x-roll

  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Calculate matrix to transform normal vectors based on model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  // Pass transformation matrix for normals to u_NormalMatrix
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(vao[config.OBJECT]); // bind selected VAO as current object
  
  // draw selected object
  gl.drawElements(gl.TRIANGLES, indices[config.OBJECT], gl.UNSIGNED_SHORT, 0);

  if (config.ROTATE) // if rotate mode is on
      animID = requestAnimationFrame(drawObject);
} 

// create VBO for given vertex attribute
function initArrayBuffer(attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null); // unbind buffer

  return true;
}

function generateSphere() { // Create a sphere

  var RES = 50;
  let radius = 1.5;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= RES; j++) {
    aj = j * Math.PI / RES;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= RES; i++) {
      ai = i * (2 * Math.PI) / RES;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(radius * si * sj);  // X
      positions.push(radius * cj);       // Y
      positions.push(radius * ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < RES; j++) {
    for (i = 0; i < RES; i++) {
      p1 = j * (RES+1) + i;
      p2 = p1 + (RES+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  vao.push(gl.createVertexArray()); // add new VAO
  gl.bindVertexArray(vao[vao.length-1]); // bind to this VAO

  // Write the vertex property to buffers (vertex positions and normals)
  initArrayBuffer('a_Position', new Float32Array(positions), gl.FLOAT, 3);
  initArrayBuffer('a_Normal', new Float32Array(positions), gl.FLOAT, 3);
  // note that vertex positions also represent normal vectors
 
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null); // unbind this VAO

  return indices.length;
}

function generateTorus() { // Create a torus

  const RES = 50; // n in n-gon   
  let outRad = 2; // outer radius
  let inRad = 1.3; // inner radius
  let mRad = (inRad + outRad) / 2; // middle radius of torus
  let sRad = (outRad - inRad) / 2; // small radius of cross section

  let vertices = [];
  let normals = [];
  let indices = [];

  for (let j = 0; j <= RES; ++j) { // verticle vertices
    let phi = j * (2*Math.PI) / RES; // vertical angle [0, 360]
    let cosPhi = Math.cos(phi);
    let sinPhi = Math.sin(phi); 

    for (let i = 0; i <= RES; ++i) { // horizontal vertices
      let theta = i * (2*Math.PI) / RES; // horizontal angle [0, 360]
      let cosTheta = Math.cos(theta); // rotating from z to x axis
      let sinTheta = Math.sin(theta); // rotating from z to x axis 

      let x = (mRad + sRad * cosPhi) * sinTheta; 
      let y = sRad * sinPhi; 
      let z = (mRad + sRad * cosPhi) * cosTheta; 

      vertices.push(x);
      vertices.push(y);
      vertices.push(z);

      let nx = x - (mRad * sinTheta); // normal x
      let ny = y; // normal y
      let nz = z - (mRad * cosTheta); // normal z 

      normals.push(nx); 
      normals.push(ny);
      normals.push(nz);
    }
  }

  // Calculate torus indices
  for (let j = 0; j < RES; ++j) {
    for (let i = 0; i < RES; ++i) {

      let down = j * (RES + 1) + i;
      let up = (j+1) * (RES + 1) + i;

      // lower triangle of quadrangle cell
      indices.push(down);
      indices.push(down + 1);
      indices.push(up + 1);

      // upper triangle of quadrangle cell
      indices.push(up);
      indices.push(down);
      indices.push(up + 1);      
    }
  }

  vao.push(gl.createVertexArray()); // add new VAO
  gl.bindVertexArray(vao[vao.length-1]); // bind to this VAO

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  initArrayBuffer('a_Position', new Float32Array(vertices), gl.FLOAT, 3);
  initArrayBuffer('a_Normal', new Float32Array(normals), gl.FLOAT, 3);
  
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null); // unbind this VAO

  return indices.length;
}

function generateCone() { // Create a cone

  const RES = 50; 
  let height = 3; // height of cone
  let radius = 1.5; // radius of base circle

  let vertices = []; // vertex positions
  let normals = [];
  let faceVertices = []; // vertex list in each face
  let faceNormals = []; // normal list in each face
  let indices = [];
 
  // Calculate bottom vertex positions
  for (let i = 0; i <= RES; ++i) {
    let theta = i * (2*Math.PI) / RES; // horizontal angle [0, 360]
    let cosTheta = Math.cos(theta); // rotating from z to x axis
    let sinTheta = Math.sin(theta); // rotating from z to x axis 

    let x = radius * sinTheta; // sinPhi: radius of circle at that latitude
    let y = -height/2; // base circle's y coord
    let z = radius * cosTheta;  // sinPhi: radius of circle at that latitude

    vertices.push(x);
    vertices.push(y);
    vertices.push(z);    
  }

  // insert top vertex RES+1 times
  // this is because top vertex has a different normal vector for each side triangle
  for (let i = 0; i <= RES; ++i) {
    // top vertex
    vertices.push(0); // x
    vertices.push(height/2); // y
    vertices.push(0); // z   
  }

  // Calculate bottom vertex positions
  for (let i = 0; i <= RES; ++i) {
    let theta = i * (2*Math.PI) / RES; // horizontal angle [0, 360]
    let cosTheta = Math.cos(theta); // rotating from z to x axis
    let sinTheta = Math.sin(theta); // rotating from z to x axis 

    let x = radius * sinTheta; // sinPhi: radius of circle at that latitude
    let y = -height/2; // base circle's y coord
    let z = radius * cosTheta;  // sinPhi: radius of circle at that latitude

    vertices.push(x);
    vertices.push(y);
    vertices.push(z);    
  }
  
  // bottom vertex (circle center)
  vertices.push(0); // x
  vertices.push(-height/2); // y
  vertices.push(0); // z
   
  // normals
  for (let j = 0; j < 2; j++) {
    // Calculate normal vectors for base ngon vertices and corresponding top vertices
    // again, top vertex has a different normal vector for each side triangle
    for (let i = 0; i <= RES; ++i) {
      let theta = i * (2*Math.PI) / RES; // horizontal angle [0, 360]
      let cosTheta = Math.cos(theta); // rotating from z to x axis
      let sinTheta = Math.sin(theta); // rotating from z to x axis 

      let x = radius * sinTheta; // sinPhi: radius of circle at that latitude
      let y = -height/2; // base circle's y coord
      let z = radius * cosTheta;  // sinPhi: radius of circle at that latitude

      // compute normal vector for this vertex
      normals.push(x);
      normals.push(radius * radius / height); // same for base ngon vertex and top vertex
      normals.push(z);          
    }
  }

  // Calculate bottom normal vectors
  for (let i = 0; i <= RES; ++i) {
    normals.push(0);
    normals.push(-1);
    normals.push(0);    
  }
  // normal vector for bottom vertex
  normals.push(0);
  normals.push(-1);
  normals.push(0);   
  
  // form side faces
  for (let i = 0; i < RES; ++i) {
    let down = i;
    let up = (RES+1)+i;
    // side triangle
    indices.push(down);
    indices.push(down + 1);
    indices.push(up);
  }

  // form side faces
  for (let i = 0; i < RES; ++i) {
    let down = (RES+1)*2+i;
    let bottom = (RES+1)*3;

    // bottom triangle
    indices.push(down);
    indices.push(down + 1);
    indices.push(bottom);
  }

  vao.push(gl.createVertexArray()); // add new VAO
  gl.bindVertexArray(vao[vao.length-1]); // bind to this VAO

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  initArrayBuffer('a_Position', new Float32Array(vertices), gl.FLOAT, 3);
  initArrayBuffer('a_Normal', new Float32Array(normals), gl.FLOAT, 3);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null); // unbind this VAO

  return indices.length;
}

function generateCube() {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  let vertices = [
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ];

  // Normal
  let normals = [
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ];

  // Indices of the vertices
  let indices = [
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ];

  vao.push(gl.createVertexArray()); // add new VAO
  gl.bindVertexArray(vao[vao.length-1]); // bind to this VAO

  // Write the vertex property to buffers (coordinates, colors and normals)
  initArrayBuffer('a_Position', new Float32Array(vertices), gl.FLOAT, 3);
  initArrayBuffer('a_Normal', new Float32Array(normals), gl.FLOAT, 3);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null); // unbind this VAO

  return indices.length;
}
