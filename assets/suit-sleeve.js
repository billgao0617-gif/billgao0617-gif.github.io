/* A single textured strip runs from the suit's shoulder opening to the glove ring.
   Adjacent sections share vertices, including the folds on the inside of the elbow. */
window.createSuitSleeve = function(canvas, fabric) {
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, preserveDrawingBuffer:true});
  if (!gl) return null;

  const vs = 'attribute vec2 pos,uv; attribute float across; varying vec2 tex; varying float side; void main(){tex=uv;side=across;gl_Position=vec4((pos.x-390.)/325.-1.,1.-(pos.y-515.)/365.,0.,1.);}';
  const fs = 'precision mediump float; uniform sampler2D fabric; varying vec2 tex; varying float side; void main(){vec3 rgb=texture2D(fabric,tex).rgb; float edge=smoothstep(0.,.014,min(side,1.-side)); float shade=.80+.20*sin(3.14159*side);gl_FragColor=vec4(rgb*shade*edge,edge);}';
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result,source); gl.compileShader(result);
    if (!gl.getShaderParameter(result,gl.COMPILE_STATUS)) throw Error('Sleeve shader unavailable');
    return result;
  }
  const program = gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,fabric);
  for(const edge of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,edge,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);

  const rows=40, columns=12, stride=5;
  const vertices=new Float32Array((rows+1)*(columns+1)*stride), indices=[];
  for(let row=0;row<rows;row++) for(let col=0;col<columns;col++){
    const a=row*(columns+1)+col, b=a+columns+1;
    indices.push(a,b,a+1,a+1,b,b+1);
  }
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,vertices.byteLength,gl.DYNAMIC_DRAW);
  for(const [name,size,offset] of [['pos',2,0],['uv',2,2],['across',1,4]]){
    const at=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at,size,gl.FLOAT,false,stride*4,offset*4);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);

  // Cross-sections on the source sleeve, from shoulder cloth to metal wrist ring.
  const samples=[
    [766,469,916,575],[711,518,899,610],[672,559,866,643],
    [634,593,826,675],[584,631,764,679],[542,669,706,687],
    [508,705,672,691],[479,753,656,695],[475,818,651,692],
    [496,860,660,697],[535,903,681,694],[581,923,700,694],
    [633,916,722,692],[689,903,743,692],[743,888,777,697],
    [782,880,804,697],[822,872,833,693],[857,864,857,691]
  ];
  const mix=(a,b,t)=>a+(b-a)*t;
  for(let row=0;row<=rows;row++){
    const k=row/rows*(samples.length-1), j=Math.min(samples.length-2,Math.floor(k));
    const uv=samples[j].map((v,i)=>mix(v,samples[j+1][i],k-j));
    for(let col=0;col<=columns;col++){
      const u=col/columns, i=(row*(columns+1)+col)*stride;
      vertices[i+2]=mix(uv[0],uv[2],u)/1672;vertices[i+3]=mix(uv[1],uv[3],u)/941;vertices[i+4]=u;
    }
  }
  const socket=[880,645];
  return function draw(elbow,wrist,pitch){
    // Cubic spans share the same tangent at the elbow. The socket lip stays pinned.
    const ax=elbow[0]-socket[0], ay=elbow[1]-socket[1];
    const bx=wrist[0]-elbow[0], by=wrist[1]-elbow[1];
    const tx=ax/Math.hypot(ax,ay)+bx/Math.hypot(bx,by);
    const ty=ay/Math.hypot(ax,ay)+by/Math.hypot(bx,by);
    const length=Math.hypot(tx,ty), tangent=[tx/length,ty/length];
    const mid=[elbow[0]+(bx-ax)*.075,elbow[1]+(by-ay)*.075];
    const rad=pitch*Math.PI/180, dx=Math.cos(rad),dy=Math.sin(rad);
    const cuff=[wrist[0]+24*dx,wrist[1]+24*dy];
    const upper=[socket,[socket[0]-53,socket[1]+64],[mid[0]-66*tangent[0],mid[1]-66*tangent[1]],mid];
    const lower=[mid,[mid[0]+66*tangent[0],mid[1]+66*tangent[1]],[cuff[0]-82*dx,cuff[1]-82*dy],cuff];
    for(let row=0;row<=rows;row++){
      const z=row/rows, first=z<=.52, p=first?upper:lower;
      const t=first?z/.52:(z-.52)/.48, r=1-t;
      const component=k=>r*r*r*p[0][k]+3*r*r*t*p[1][k]+3*r*t*t*p[2][k]+t*t*t*p[3][k];
      const velocity=k=>r*r*(p[1][k]-p[0][k])+2*r*t*(p[2][k]-p[1][k])+t*t*(p[3][k]-p[2][k]);
      const vx=velocity(0),vy=velocity(1),speed=Math.hypot(vx,vy);
      const nx=-vy/speed,ny=vx/speed,x=component(0),y=component(1);
      const width=105-18*z+10*Math.sin(Math.PI*z), lip=Math.max(0,1-z/.2)**2;
      for(let col=0;col<=columns;col++){
        const u=col/columns, offset=(1-2*u)*width;
        const bow=Math.sin(Math.PI*u)*26*lip;
        const i=(row*(columns+1)+col)*stride;
        vertices[i]=x+nx*offset+bow*.64;
        vertices[i+1]=y+ny*offset-bow*.77;
      }
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  };
};
