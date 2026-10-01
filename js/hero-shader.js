// Liquid silver — molten metal pools drifting on black, pushed around by the cursor.
(function () {
    var canvas = document.querySelector('.hero-shader');
    if (!canvas) return;
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    var vert = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

    var frag = [
        'precision highp float;',
        'uniform vec2 uRes;',
        'uniform float uTime;',
        'uniform vec2 uMouse;',
        'uniform float uPush;',

        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
        '  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}',
        'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);',
        '  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}',

        // Metal "height": domain-warped noise, biased so the metal gathers on the right
        'float field(vec2 uv){',
        '  float t=uTime*.05;',
        '  vec2 m=(uMouse-.5*uRes)/uRes.y;',
        '  vec2 dm=uv-m; float d=dot(dm,dm);',
        '  uv-=dm*uPush*.35*exp(-d*7.);',
        '  vec2 p=uv*1.35;',
        '  vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,1.3)-t));',
        '  float h=fbm(p+2.2*q+vec2(t*1.3,-t));',
        '  float aspect=uRes.x/uRes.y;',
        '  float bias=smoothstep(-.6*aspect,.7*aspect,uv.x)*.3 - .08;',
        '  return h+bias;',
        '}',

        'void main(){',
        '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
        '  float e=1.5/uRes.y;',
        '  float h=field(uv);',
        '  float hx=field(uv+vec2(e,0.));',
        '  float hy=field(uv+vec2(0.,e));',
        '  float th=.6;',
        '  float mask=smoothstep(th-.004,th+.004,h);',
        // Domed surface: steepest at the edges, flat in the middle of each pool
        '  float depth=clamp((h-th)*9.,0.,1.);',
        '  float dome=sqrt(1.-pow(1.-depth,2.));',
        '  vec2 g=vec2(hx-h,hy-h)/e;',
        '  vec3 n=normalize(vec3(-g*.045*(1.15-dome),1.));',
        '  vec3 r=reflect(vec3(0.,0.,-1.),n);',
        // Studio environment: soft top light, hard softbox stripes, dark floor
        '  float sky=.28+.62*smoothstep(-.5,.8,r.y);',
        '  float s=r.y*2.6+r.x*.9;',
        '  float stripe=pow(.5+.5*cos(s*5.2+1.2),18.);',
        '  float rim=pow(1.-n.z,.6)*.45;',
        '  vec3 silver=vec3(.80,.80,.79)*sky + vec3(1.,.93,.84)*stripe*1.2;',
        '  silver+=vec3(.91,.79,.63)*rim*smoothstep(.2,-.6,r.y);',
        '  silver*=.72+.28*dome;',
        '  vec3 bg=vec3(.039,.039,.043);',
        // Faint caustic glow under the metal
        '  bg+=vec3(.91,.79,.63)*.05*smoothstep(th-.12,th,h)*(1.-mask);',
        '  vec3 col=mix(bg,silver,mask);',
        '  float vig=smoothstep(1.5,.3,length(uv*vec2(.8,1.)));',
        '  col*=.75+.25*vig;',
        '  gl_FragColor=vec4(col,1.);',
        '}'
    ].join('\n');

    function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.warn(gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    var vs = compile(gl.VERTEX_SHADER, vert);
    var fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'uRes');
    var uTime = gl.getUniformLocation(prog, 'uTime');
    var uMouse = gl.getUniformLocation(prog, 'uMouse');
    var uPush = gl.getUniformLocation(prog, 'uPush');

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0;
    function resize() {
        var rect = canvas.getBoundingClientRect();
        w = Math.max(1, Math.round(rect.width * dpr));
        h = Math.max(1, Math.round(rect.height * dpr));
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse eases toward the pointer; push swells while moving, settles when still
    var mouse = { x: w * 0.7, y: h * 0.5 }, target = { x: w * 0.7, y: h * 0.5 };
    var push = 0, pushTarget = 0;
    window.addEventListener('pointermove', function (ev) {
        var rect = canvas.getBoundingClientRect();
        target.x = (ev.clientX - rect.left) * dpr;
        target.y = (rect.bottom - ev.clientY) * dpr;
        pushTarget = 1;
    }, { passive: true });

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true, running = false;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible && !running && !reduceMotion) { running = true; requestAnimationFrame(frame); }
        }).observe(canvas);
    }

    var start = performance.now();
    function draw(t) {
        mouse.x += (target.x - mouse.x) * 0.06;
        mouse.y += (target.y - mouse.y) * 0.06;
        push += (pushTarget - push) * 0.04;
        pushTarget *= 0.97;
        gl.uniform2f(uRes, w, h);
        gl.uniform1f(uTime, t);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uPush, push);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(now) {
        if (!visible) { running = false; return; }
        draw((now - start) / 1000 + 40);
        requestAnimationFrame(frame);
    }

    canvas.closest('.hero').classList.add('has-shader');
    if (reduceMotion) draw(40);
    else if (!running) { running = true; requestAnimationFrame(frame); }
})();
