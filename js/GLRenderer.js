"use strict";

class GLRenderer
{
    constructor(canvas)
    {
        this.vsSource = `
        #version 300 es

        // an attribute is an input (in) to a vertex shader.
        // It will receive data from a buffer
        in vec4 a_position;

        // all shaders have a main function
        void main() {

        // gl_Position is a special variable a vertex shader
        // is responsible for setting
        gl_Position = a_position;
        }
        `;

        this.fsSource = `
        #version 300 es

        // fragment shaders don't have a default precision so we need
        // to pick one. mediump is a good default. It means "medium precision"
        precision mediump float;

        // we need to declare an output for the fragment shader
        out vec4 outColor;

        void main() {
        // Just set the output to a constant redish-purple
        outColor = vec4(1, 0, 0.5, 1);
        }
        `;

        this.init(canvas);
    }

    createShader(gl, type, source)
    {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) 
        {
            return shader;
        }
      
        console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
        gl.deleteShader(shader);
        return undefined;
    }
      
    createProgram(gl, vertexShader, fragmentShader) 
    {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) 
        {
            return program;
        }
      
        console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
        gl.deleteProgram(program);
        return undefined;
    }
      
    resizeCanvasToDisplaySize(canvas, multiplier) 
    {
        multiplier = multiplier || 1;
        const width  = canvas.clientWidth  * multiplier | 0;
        const height = canvas.clientHeight * multiplier | 0;
        if (canvas.width !== width ||  canvas.height !== height) 
        {
            canvas.width  = width;
            canvas.height = height;
            return true;
        }
        return false;
    }
      
    init(canvas)
    {
        // Get A WebGL context
        this.canvas = canvas;
        this.gl = canvas.getContext("webgl2");

        if (!this.gl) 
        {
            return;
        }
        
        // create GLSL shaders, upload the GLSL source, compile the shaders
        this.vertexShader = this.createShader(this.gl, this.gl.VERTEX_SHADER, this.vsSource);
        this.fragmentShader = this.createShader(this.gl, this.gl.FRAGMENT_SHADER, this.fsSource);
        
        // Link the two shaders into a program
        this.program = this.createProgram(this.gl, this.vertexShader, this.fragmentShader);
        
        // look up where the vertex data needs to go.
        this.positionAttributeLocation = gl.getAttribLocation(this.program, "a_position");
        
        // Create a buffer and put three 2d clip space points in it
        this.positionBuffer = this.gl.createBuffer();
        
        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        
        var positions = [
            0, 0,
            0, 0.5,
            0.7, 0,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
        
        // Create a vertex array object (attribute state)
        this.vao = this.gl.createVertexArray();
        
        // and make it the one we're currently working with
        this.gl.bindVertexArray(this.vao);
        
        // Turn on the attribute
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        
        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        this.gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);
        
        this.resizeCanvasToDisplaySize(this.gl.canvas);
        
        // Tell WebGL how to convert from clip space to pixels
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        
        // Clear the canvas
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Tell it to use our program (pair of shaders)
        this.gl.useProgram(this.program);

        // Bind the attribute/buffer set we want.
        this.gl.bindVertexArray(this.vao);
        
        // draw
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        this.gl.drawArrays(primitiveType, offset, count);
    }
}

glRenderer = new GLRenderer(document.getElementById("main-canvas"));
