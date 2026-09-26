import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LiquidEther.css";

export default function LiquidEther({
  mouseForce = 18,
  cursorSize = 92,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 24,
  iterationsPoisson = 28,
  dt = 0.014,
  BFECC = true,
  resolution = 0.45,
  isBounce = false,
  colors = ["#d4e4fb", "#b8cae3", "#8ab4ea"],
  style = {},
  className = "",
  autoDemo = true,
  autoSpeed = 0.42,
  autoIntensity = 1.9,
  takeoverDuration = 0.25,
  autoResumeDelay = 2200,
  autoRampDuration = 0.6
}) {
  const mountRef = useRef(null);
  const webglRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) {
      return undefined;
    }

    function makePaletteTexture(stops) {
      const paletteStops = Array.isArray(stops) && stops.length > 0 ? stops : ["#ffffff", "#ffffff"];
      const normalizedStops = paletteStops.length === 1 ? [paletteStops[0], paletteStops[0]] : paletteStops;
      const width = normalizedStops.length;
      const data = new Uint8Array(width * 4);

      for (let index = 0; index < width; index += 1) {
        const color = new THREE.Color(normalizedStops[index]);
        data[index * 4] = Math.round(color.r * 255);
        data[index * 4 + 1] = Math.round(color.g * 255);
        data[index * 4 + 2] = Math.round(color.b * 255);
        data[index * 4 + 3] = 255;
      }

      const texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      return texture;
    }

    const paletteTexture = makePaletteTexture(colors);
    const transparentBackground = new THREE.Vector4(0, 0, 0, 0);

    class CommonRuntime {
      constructor() {
        this.width = 0;
        this.height = 0;
        this.aspect = 1;
        this.pixelRatio = 1;
        this.fboWidth = null;
        this.fboHeight = null;
        this.time = 0;
        this.delta = 0;
        this.container = null;
        this.renderer = null;
        this.clock = null;
      }

      init(container) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        this.renderer.domElement.style.display = "block";
        this.clock = new THREE.Clock();
        this.clock.start();
      }

      resize() {
        if (!this.container) {
          return;
        }

        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;

        if (this.renderer) {
          this.renderer.setSize(this.width, this.height, false);
        }
      }

      update() {
        this.delta = this.clock.getDelta();
        this.time += this.delta;
      }
    }

    const Common = new CommonRuntime();

    class MouseRuntime {
      constructor() {
        this.mouseMoved = false;
        this.coords = new THREE.Vector2();
        this.coordsOld = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.container = null;
        this.docTarget = null;
        this.listenerTarget = null;
        this.isHoverInside = false;
        this.hasUserControl = false;
        this.isAutoActive = false;
        this.autoIntensity = 2.0;
        this.takeoverActive = false;
        this.takeoverStartTime = 0;
        this.takeoverDuration = 0.25;
        this.takeoverFrom = new THREE.Vector2();
        this.takeoverTo = new THREE.Vector2();
        this.onInteract = null;
        this.handleMouseMove = this.onDocumentMouseMove.bind(this);
        this.handleTouchStart = this.onDocumentTouchStart.bind(this);
        this.handleTouchMove = this.onDocumentTouchMove.bind(this);
        this.handleTouchEnd = this.onTouchEnd.bind(this);
        this.handleDocumentLeave = this.onDocumentLeave.bind(this);
      }

      init(container) {
        this.container = container;
        this.docTarget = container.ownerDocument || null;
        const defaultView = (this.docTarget && this.docTarget.defaultView) || window;

        if (!defaultView) {
          return;
        }

        this.listenerTarget = defaultView;
        this.listenerTarget.addEventListener("mousemove", this.handleMouseMove);
        this.listenerTarget.addEventListener("touchstart", this.handleTouchStart, { passive: true });
        this.listenerTarget.addEventListener("touchmove", this.handleTouchMove, { passive: true });
        this.listenerTarget.addEventListener("touchend", this.handleTouchEnd);

        if (this.docTarget) {
          this.docTarget.addEventListener("mouseleave", this.handleDocumentLeave);
        }
      }

      dispose() {
        if (this.listenerTarget) {
          this.listenerTarget.removeEventListener("mousemove", this.handleMouseMove);
          this.listenerTarget.removeEventListener("touchstart", this.handleTouchStart);
          this.listenerTarget.removeEventListener("touchmove", this.handleTouchMove);
          this.listenerTarget.removeEventListener("touchend", this.handleTouchEnd);
        }

        if (this.docTarget) {
          this.docTarget.removeEventListener("mouseleave", this.handleDocumentLeave);
        }
      }

      isPointInside(clientX, clientY) {
        if (!this.container) {
          return false;
        }

        const rect = this.container.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return false;
        }

        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      }

      updateHoverState(clientX, clientY) {
        this.isHoverInside = this.isPointInside(clientX, clientY);
        return this.isHoverInside;
      }

      setCoords(clientX, clientY) {
        if (!this.container) {
          return;
        }

        if (this.timer) {
          window.clearTimeout(this.timer);
        }

        const rect = this.container.getBoundingClientRect();
        if (!rect.width || !rect.height) {
          return;
        }

        const normalizedX = (clientX - rect.left) / rect.width;
        const normalizedY = (clientY - rect.top) / rect.height;
        this.coords.set(normalizedX * 2 - 1, -(normalizedY * 2 - 1));
        this.mouseMoved = true;

        this.timer = window.setTimeout(() => {
          this.mouseMoved = false;
        }, 100);
      }

      setNormalized(x, y) {
        this.coords.set(x, y);
        this.mouseMoved = true;
      }

      onDocumentMouseMove(event) {
        if (!this.updateHoverState(event.clientX, event.clientY)) {
          return;
        }

        if (this.onInteract) {
          this.onInteract();
        }

        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
          if (!this.container) {
            return;
          }

          const rect = this.container.getBoundingClientRect();
          if (!rect.width || !rect.height) {
            return;
          }

          const normalizedX = (event.clientX - rect.left) / rect.width;
          const normalizedY = (event.clientY - rect.top) / rect.height;
          this.takeoverFrom.copy(this.coords);
          this.takeoverTo.set(normalizedX * 2 - 1, -(normalizedY * 2 - 1));
          this.takeoverStartTime = performance.now();
          this.takeoverActive = true;
          this.hasUserControl = true;
          this.isAutoActive = false;
          return;
        }

        this.setCoords(event.clientX, event.clientY);
        this.hasUserControl = true;
      }

      onDocumentTouchStart(event) {
        if (event.touches.length !== 1) {
          return;
        }

        const touch = event.touches[0];
        if (!this.updateHoverState(touch.clientX, touch.clientY)) {
          return;
        }

        if (this.onInteract) {
          this.onInteract();
        }

        this.setCoords(touch.clientX, touch.clientY);
        this.hasUserControl = true;
      }

      onDocumentTouchMove(event) {
        if (event.touches.length !== 1) {
          return;
        }

        const touch = event.touches[0];
        if (!this.updateHoverState(touch.clientX, touch.clientY)) {
          return;
        }

        if (this.onInteract) {
          this.onInteract();
        }

        this.setCoords(touch.clientX, touch.clientY);
      }

      onTouchEnd() {
        this.isHoverInside = false;
      }

      onDocumentLeave() {
        this.isHoverInside = false;
      }

      update() {
        if (this.takeoverActive) {
          const progress = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);

          if (progress >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
            this.coordsOld.copy(this.coords);
            this.diff.set(0, 0);
          } else {
            const eased = progress * progress * (3 - 2 * progress);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, eased);
          }
        }

        this.diff.subVectors(this.coords, this.coordsOld);
        this.coordsOld.copy(this.coords);

        if (this.coordsOld.x === 0 && this.coordsOld.y === 0) {
          this.diff.set(0, 0);
        }

        if (this.isAutoActive && !this.takeoverActive) {
          this.diff.multiplyScalar(this.autoIntensity);
        }
      }
    }

    const Mouse = new MouseRuntime();

    class AutoDriver {
      constructor(mouse, manager, options) {
        this.mouse = mouse;
        this.manager = manager;
        this.enabled = options.enabled;
        this.speed = options.speed;
        this.resumeDelay = options.resumeDelay || 3000;
        this.rampDurationMs = (options.rampDuration || 0) * 1000;
        this.active = false;
        this.current = new THREE.Vector2(0, 0);
        this.target = new THREE.Vector2();
        this.lastTime = performance.now();
        this.activationTime = 0;
        this.margin = 0.2;
        this.tempDirection = new THREE.Vector2();
        this.pickNewTarget();
      }

      pickNewTarget() {
        this.target.set((Math.random() * 2 - 1) * (1 - this.margin), (Math.random() * 2 - 1) * (1 - this.margin));
      }

      forceStop() {
        this.active = false;
        this.mouse.isAutoActive = false;
      }

      update() {
        if (!this.enabled) {
          return;
        }

        const now = performance.now();
        const idleTime = now - this.manager.lastUserInteraction;

        if (idleTime < this.resumeDelay) {
          if (this.active) {
            this.forceStop();
          }
          return;
        }

        if (this.mouse.isHoverInside) {
          if (this.active) {
            this.forceStop();
          }
          return;
        }

        if (!this.active) {
          this.active = true;
          this.current.copy(this.mouse.coords);
          this.lastTime = now;
          this.activationTime = now;
        }

        if (!this.active) {
          return;
        }

        this.mouse.isAutoActive = true;
        let deltaSeconds = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (deltaSeconds > 0.2) {
          deltaSeconds = 0.016;
        }

        const direction = this.tempDirection.subVectors(this.target, this.current);
        const distance = direction.length();

        if (distance < 0.01) {
          this.pickNewTarget();
          return;
        }

        direction.normalize();
        let ramp = 1;

        if (this.rampDurationMs > 0) {
          const progress = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
          ramp = progress * progress * (3 - 2 * progress);
        }

        const step = this.speed * deltaSeconds * ramp;
        const move = Math.min(step, distance);
        this.current.addScaledVector(direction, move);
        this.mouse.setNormalized(this.current.x, this.current.y);
      }
    }

    const faceVertex = `
      attribute vec3 position;
      uniform vec2 boundarySpace;
      varying vec2 uv;
      precision highp float;
      void main() {
        vec3 pos = position;
        vec2 scale = 1.0 - boundarySpace * 2.0;
        pos.xy = pos.xy * scale;
        uv = vec2(0.5) + pos.xy * 0.5;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const lineVertex = `
      attribute vec3 position;
      uniform vec2 px;
      precision highp float;
      varying vec2 uv;
      void main() {
        vec3 pos = position;
        uv = 0.5 + pos.xy * 0.5;
        vec2 n = sign(pos.xy);
        pos.xy = abs(pos.xy) - px * 1.0;
        pos.xy *= n;
        gl_Position = vec4(pos, 1.0);
      }
    `;

    const mouseVertex = `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform vec2 center;
      uniform vec2 scale;
      uniform vec2 px;
      varying vec2 vUv;
      void main() {
        vec2 pos = position.xy * scale * 2.0 * px + center;
        vUv = uv;
        gl_Position = vec4(pos, 0.0, 1.0);
      }
    `;

    const advectionFragment = `
      precision highp float;
      uniform sampler2D velocity;
      uniform float dt;
      uniform bool isBFECC;
      uniform vec2 fboSize;
      varying vec2 uv;
      void main() {
        vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
        if (isBFECC == false) {
          vec2 vel = texture2D(velocity, uv).xy;
          vec2 uv2 = uv - vel * dt * ratio;
          vec2 newVel = texture2D(velocity, uv2).xy;
          gl_FragColor = vec4(newVel, 0.0, 0.0);
        } else {
          vec2 spotNew = uv;
          vec2 velOld = texture2D(velocity, uv).xy;
          vec2 spotOld = spotNew - velOld * dt * ratio;
          vec2 velNew1 = texture2D(velocity, spotOld).xy;
          vec2 spotNew2 = spotOld + velNew1 * dt * ratio;
          vec2 error = spotNew2 - spotNew;
          vec2 spotNew3 = spotNew - error / 2.0;
          vec2 vel2 = texture2D(velocity, spotNew3).xy;
          vec2 spotOld2 = spotNew3 - vel2 * dt * ratio;
          vec2 newVel2 = texture2D(velocity, spotOld2).xy;
          gl_FragColor = vec4(newVel2, 0.0, 0.0);
        }
      }
    `;

    const colorFragment = `
      precision highp float;
      uniform sampler2D velocity;
      uniform sampler2D palette;
      uniform vec4 bgColor;
      varying vec2 uv;
      void main() {
        vec2 vel = texture2D(velocity, uv).xy;
        float lenv = clamp(length(vel), 0.0, 1.0);
        vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
        vec3 outRGB = mix(bgColor.rgb, c, lenv);
        float outA = mix(bgColor.a, 1.0, lenv);
        gl_FragColor = vec4(outRGB, outA);
      }
    `;

    const divergenceFragment = `
      precision highp float;
      uniform sampler2D velocity;
      uniform float dt;
      uniform vec2 px;
      varying vec2 uv;
      void main() {
        float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
        float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
        float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
        float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
        float divergence = (x1 - x0 + y1 - y0) / 2.0;
        gl_FragColor = vec4(divergence / dt);
      }
    `;

    const externalForceFragment = `
      precision highp float;
      uniform vec2 force;
      uniform vec2 center;
      uniform vec2 scale;
      varying vec2 vUv;
      void main() {
        vec2 circle = (vUv - 0.5) * 2.0;
        float d = 1.0 - min(length(circle), 1.0);
        d *= d;
        gl_FragColor = vec4(force * d, 0.0, 1.0);
      }
    `;

    const poissonFragment = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D divergence;
      uniform vec2 px;
      varying vec2 uv;
      void main() {
        float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
        float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
        float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
        float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
        float div = texture2D(divergence, uv).r;
        float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
        gl_FragColor = vec4(newP);
      }
    `;

    const pressureFragment = `
      precision highp float;
      uniform sampler2D pressure;
      uniform sampler2D velocity;
      uniform vec2 px;
      uniform float dt;
      varying vec2 uv;
      void main() {
        float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
        float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
        float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
        float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
        vec2 v = texture2D(velocity, uv).xy;
        vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
        v = v - gradP * dt;
        gl_FragColor = vec4(v, 0.0, 1.0);
      }
    `;

    const viscousFragment = `
      precision highp float;
      uniform sampler2D velocity;
      uniform sampler2D velocityNew;
      uniform float v;
      uniform vec2 px;
      uniform float dt;
      varying vec2 uv;
      void main() {
        vec2 old = texture2D(velocity, uv).xy;
        vec2 new0 = texture2D(velocityNew, uv + vec2(px.x * 2.0, 0.0)).xy;
        vec2 new1 = texture2D(velocityNew, uv - vec2(px.x * 2.0, 0.0)).xy;
        vec2 new2 = texture2D(velocityNew, uv + vec2(0.0, px.y * 2.0)).xy;
        vec2 new3 = texture2D(velocityNew, uv - vec2(0.0, px.y * 2.0)).xy;
        vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
        newv /= 4.0 * (1.0 + v * dt);
        gl_FragColor = vec4(newv, 0.0, 0.0);
      }
    `;

    class ShaderPass {
      constructor(properties) {
        this.properties = properties || {};
        this.uniforms = this.properties.material?.uniforms;
        this.scene = null;
        this.camera = null;
        this.material = null;
        this.geometry = null;
        this.plane = null;
      }

      init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();

        if (this.uniforms) {
          this.material = new THREE.RawShaderMaterial(this.properties.material);
          this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
          this.plane = new THREE.Mesh(this.geometry, this.material);
          this.scene.add(this.plane);
        }
      }

      update() {
        Common.renderer.setRenderTarget(this.properties.output || null);
        Common.renderer.render(this.scene, this.camera);
        Common.renderer.setRenderTarget(null);
      }
    }

    class Advection extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: advectionFragment,
            uniforms: {
              boundarySpace: { value: simulationProperties.cellScale },
              fboSize: { value: simulationProperties.fboSize },
              velocity: { value: simulationProperties.src.texture },
              dt: { value: simulationProperties.dt },
              isBFECC: { value: true }
            }
          },
          output: simulationProperties.dst
        });
        this.uniforms = this.properties.material.uniforms;
        this.init();
      }

      init() {
        super.init();
        const boundaryGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          -1, -1, 0,
          -1, 1, 0,
          -1, 1, 0,
          1, 1, 0,
          1, 1, 0,
          1, -1, 0,
          1, -1, 0,
          -1, -1, 0
        ]);
        boundaryGeometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        const boundaryMaterial = new THREE.RawShaderMaterial({
          vertexShader: lineVertex,
          fragmentShader: advectionFragment,
          uniforms: {
            ...this.uniforms,
            px: { value: this.uniforms.boundarySpace.value }
          }
        });
        this.line = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
        this.scene.add(this.line);
      }

      update({ dt: deltaTime, isBounce: bounceEnabled, BFECC: isBFECCEnabled }) {
        this.uniforms.dt.value = deltaTime;
        this.uniforms.isBFECC.value = isBFECCEnabled;
        this.line.visible = bounceEnabled;
        super.update();
      }
    }

    class ExternalForce extends ShaderPass {
      constructor(simulationProperties) {
        super({ output: simulationProperties.dst });
        this.init(simulationProperties);
      }

      init(simulationProperties) {
        super.init();
        const mouseGeometry = new THREE.PlaneGeometry(1, 1);
        const mouseMaterial = new THREE.RawShaderMaterial({
          vertexShader: mouseVertex,
          fragmentShader: externalForceFragment,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            px: { value: simulationProperties.cellScale },
            force: { value: new THREE.Vector2(0.0, 0.0) },
            center: { value: new THREE.Vector2(0.0, 0.0) },
            scale: { value: new THREE.Vector2(simulationProperties.cursorSize, simulationProperties.cursorSize) }
          }
        });
        this.mouse = new THREE.Mesh(mouseGeometry, mouseMaterial);
        this.scene.add(this.mouse);
      }

      update(properties) {
        const forceX = (Mouse.diff.x / 2) * properties.mouseForce;
        const forceY = (Mouse.diff.y / 2) * properties.mouseForce;
        const cursorSizeX = properties.cursorSize * properties.cellScale.x;
        const cursorSizeY = properties.cursorSize * properties.cellScale.y;
        const centerX = Math.min(Math.max(Mouse.coords.x, -1 + cursorSizeX + properties.cellScale.x * 2), 1 - cursorSizeX - properties.cellScale.x * 2);
        const centerY = Math.min(Math.max(Mouse.coords.y, -1 + cursorSizeY + properties.cellScale.y * 2), 1 - cursorSizeY - properties.cellScale.y * 2);
        const uniforms = this.mouse.material.uniforms;
        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(properties.cursorSize, properties.cursorSize);
        super.update();
      }
    }

    class Viscous extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: viscousFragment,
            uniforms: {
              boundarySpace: { value: simulationProperties.boundarySpace },
              velocity: { value: simulationProperties.src.texture },
              velocityNew: { value: simulationProperties.dstBuffer.texture },
              v: { value: simulationProperties.viscous },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt }
            }
          },
          output: simulationProperties.dst,
          output0: simulationProperties.dstBuffer,
          output1: simulationProperties.dst
        });
        this.init();
      }

      update({ viscous: viscousValue, iterations, dt: deltaTime }) {
        let inputBuffer;
        let outputBuffer;
        this.uniforms.v.value = viscousValue;

        for (let index = 0; index < iterations; index += 1) {
          if (index % 2 === 0) {
            inputBuffer = this.properties.output0;
            outputBuffer = this.properties.output1;
          } else {
            inputBuffer = this.properties.output1;
            outputBuffer = this.properties.output0;
          }

          this.uniforms.velocityNew.value = inputBuffer.texture;
          this.properties.output = outputBuffer;
          this.uniforms.dt.value = deltaTime;
          super.update();
        }

        return outputBuffer;
      }
    }

    class Divergence extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: divergenceFragment,
            uniforms: {
              boundarySpace: { value: simulationProperties.boundarySpace },
              velocity: { value: simulationProperties.src.texture },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt }
            }
          },
          output: simulationProperties.dst
        });
        this.init();
      }

      update({ vel }) {
        this.uniforms.velocity.value = vel.texture;
        super.update();
      }
    }

    class Poisson extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: poissonFragment,
            uniforms: {
              boundarySpace: { value: simulationProperties.boundarySpace },
              pressure: { value: simulationProperties.dstBuffer.texture },
              divergence: { value: simulationProperties.src.texture },
              px: { value: simulationProperties.cellScale }
            }
          },
          output: simulationProperties.dst,
          output0: simulationProperties.dstBuffer,
          output1: simulationProperties.dst
        });
        this.init();
      }

      update({ iterations }) {
        let inputBuffer;
        let outputBuffer;

        for (let index = 0; index < iterations; index += 1) {
          if (index % 2 === 0) {
            inputBuffer = this.properties.output0;
            outputBuffer = this.properties.output1;
          } else {
            inputBuffer = this.properties.output1;
            outputBuffer = this.properties.output0;
          }

          this.uniforms.pressure.value = inputBuffer.texture;
          this.properties.output = outputBuffer;
          super.update();
        }

        return outputBuffer;
      }
    }

    class Pressure extends ShaderPass {
      constructor(simulationProperties) {
        super({
          material: {
            vertexShader: faceVertex,
            fragmentShader: pressureFragment,
            uniforms: {
              boundarySpace: { value: simulationProperties.boundarySpace },
              pressure: { value: simulationProperties.srcPressure.texture },
              velocity: { value: simulationProperties.srcVelocity.texture },
              px: { value: simulationProperties.cellScale },
              dt: { value: simulationProperties.dt }
            }
          },
          output: simulationProperties.dst
        });
        this.init();
      }

      update({ vel, pressure }) {
        this.uniforms.velocity.value = vel.texture;
        this.uniforms.pressure.value = pressure.texture;
        super.update();
      }
    }

    class Simulation {
      constructor(options) {
        this.options = {
          iterationsPoisson: 32,
          iterationsViscous: 32,
          mouseForce: 20,
          resolution: 0.5,
          cursorSize: 100,
          viscous: 30,
          isBounce: false,
          dt: 0.014,
          isViscous: false,
          BFECC: true,
          ...options
        };
        this.fbos = {
          vel0: null,
          vel1: null,
          velViscous0: null,
          velViscous1: null,
          div: null,
          pressure0: null,
          pressure1: null
        };
        this.fboSize = new THREE.Vector2();
        this.cellScale = new THREE.Vector2();
        this.boundarySpace = new THREE.Vector2();
        this.init();
      }

      init() {
        this.calculateSize();
        this.createAllFrameBuffers();
        this.createShaderPasses();
      }

      getFloatType() {
        return /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
      }

      createAllFrameBuffers() {
        const type = this.getFloatType();
        const options = {
          type,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping
        };

        Object.keys(this.fbos).forEach((key) => {
          this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, options);
        });
      }

      createShaderPasses() {
        this.advection = new Advection({
          cellScale: this.cellScale,
          fboSize: this.fboSize,
          dt: this.options.dt,
          src: this.fbos.vel0,
          dst: this.fbos.vel1
        });

        this.externalForce = new ExternalForce({
          cellScale: this.cellScale,
          cursorSize: this.options.cursorSize,
          dst: this.fbos.vel1
        });

        this.viscousPass = new Viscous({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          viscous: this.options.viscous,
          src: this.fbos.vel1,
          dst: this.fbos.velViscous1,
          dstBuffer: this.fbos.velViscous0,
          dt: this.options.dt
        });

        this.divergence = new Divergence({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.velViscous0,
          dst: this.fbos.div,
          dt: this.options.dt
        });

        this.poisson = new Poisson({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          src: this.fbos.div,
          dst: this.fbos.pressure1,
          dstBuffer: this.fbos.pressure0
        });

        this.pressurePass = new Pressure({
          cellScale: this.cellScale,
          boundarySpace: this.boundarySpace,
          srcPressure: this.fbos.pressure0,
          srcVelocity: this.fbos.velViscous0,
          dst: this.fbos.vel0,
          dt: this.options.dt
        });
      }

      calculateSize() {
        const width = Math.max(1, Math.round(this.options.resolution * Common.width));
        const height = Math.max(1, Math.round(this.options.resolution * Common.height));
        this.cellScale.set(1 / width, 1 / height);
        this.fboSize.set(width, height);
      }

      resize() {
        this.calculateSize();
        Object.values(this.fbos).forEach((buffer) => {
          buffer.setSize(this.fboSize.x, this.fboSize.y);
        });
      }

      update() {
        this.boundarySpace.copy(this.options.isBounce ? new THREE.Vector2(0, 0) : this.cellScale);

        this.advection.update({
          dt: this.options.dt,
          isBounce: this.options.isBounce,
          BFECC: this.options.BFECC
        });

        this.externalForce.update({
          cursorSize: this.options.cursorSize,
          mouseForce: this.options.mouseForce,
          cellScale: this.cellScale
        });

        let velocity = this.fbos.vel1;

        if (this.options.isViscous) {
          velocity = this.viscousPass.update({
            viscous: this.options.viscous,
            iterations: this.options.iterationsViscous,
            dt: this.options.dt
          });
        }

        this.divergence.update({ vel: velocity });
        const pressure = this.poisson.update({ iterations: this.options.iterationsPoisson });
        this.pressurePass.update({ vel: velocity, pressure });
      }
    }

    class OutputRenderer {
      constructor() {
        this.init();
      }

      init() {
        this.simulation = new Simulation();
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.output = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.RawShaderMaterial({
            vertexShader: faceVertex,
            fragmentShader: colorFragment,
            transparent: true,
            depthWrite: false,
            uniforms: {
              velocity: { value: this.simulation.fbos.vel0.texture },
              boundarySpace: { value: new THREE.Vector2() },
              palette: { value: paletteTexture },
              bgColor: { value: transparentBackground }
            }
          })
        );
        this.scene.add(this.output);
      }

      resize() {
        this.simulation.resize();
      }

      render() {
        Common.renderer.setRenderTarget(null);
        Common.renderer.render(this.scene, this.camera);
      }

      update() {
        this.simulation.update();
        this.render();
      }
    }

    class WebGLManager {
      constructor(properties) {
        this.properties = properties;
        Common.init(properties.wrapper);
        Mouse.init(properties.wrapper);
        Mouse.autoIntensity = properties.autoIntensity;
        Mouse.takeoverDuration = properties.takeoverDuration;
        this.lastUserInteraction = performance.now();
        Mouse.onInteract = () => {
          this.lastUserInteraction = performance.now();
          if (this.autoDriver) {
            this.autoDriver.forceStop();
          }
        };

        this.autoDriver = new AutoDriver(Mouse, this, {
          enabled: properties.autoDemo,
          speed: properties.autoSpeed,
          resumeDelay: properties.autoResumeDelay,
          rampDuration: properties.autoRampDuration
        });

        this.init();
        this.loop = this.loop.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener("resize", this.resize);
        this.onVisibilityChange = () => {
          if (document.hidden) {
            this.pause();
          } else if (isVisibleRef.current) {
            this.start();
          }
        };
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        this.running = false;
      }

      init() {
        this.properties.wrapper.prepend(Common.renderer.domElement);
        this.output = new OutputRenderer();
      }

      resize() {
        Common.resize();
        this.output.resize();
      }

      render() {
        if (this.autoDriver) {
          this.autoDriver.update();
        }

        Mouse.update();
        Common.update();
        this.output.update();
      }

      loop() {
        if (!this.running) {
          return;
        }

        this.render();
        rafRef.current = requestAnimationFrame(this.loop);
      }

      start() {
        if (this.running) {
          return;
        }

        this.running = true;
        this.loop();
      }

      pause() {
        this.running = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }

      dispose() {
        window.removeEventListener("resize", this.resize);
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        Mouse.dispose();

        if (Common.renderer) {
          const canvas = Common.renderer.domElement;
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          Common.renderer.dispose();
          Common.renderer.forceContextLoss();
        }
      }
    }

    const container = mountRef.current;
    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";

    const webgl = new WebGLManager({
      wrapper: container,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration
    });

    webglRef.current = webgl;

    const applyOptions = () => {
      if (!webglRef.current) {
        return;
      }

      const simulation = webglRef.current.output?.simulation;
      if (!simulation) {
        return;
      }

      const previousResolution = simulation.options.resolution;
      Object.assign(simulation.options, {
        mouseForce,
        cursorSize,
        isViscous,
        viscous,
        iterationsViscous,
        iterationsPoisson,
        dt,
        BFECC,
        resolution,
        isBounce
      });

      if (resolution !== previousResolution) {
        simulation.resize();
      }
    };

    applyOptions();
    webgl.start();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        isVisibleRef.current = isVisible;

        if (!webglRef.current) {
          return;
        }

        if (isVisible && !document.hidden) {
          webglRef.current.start();
        } else {
          webglRef.current.pause();
        }
      },
      { threshold: [0, 0.01, 0.1] }
    );

    intersectionObserver.observe(container);
    intersectionObserverRef.current = intersectionObserver;

    const resizeObserver = new ResizeObserver(() => {
      if (!webglRef.current) {
        return;
      }

      if (resizeRafRef.current) {
        cancelAnimationFrame(resizeRafRef.current);
      }

      resizeRafRef.current = requestAnimationFrame(() => {
        if (webglRef.current) {
          webglRef.current.resize();
        }
      });
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }

      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }

      if (webglRef.current) {
        webglRef.current.dispose();
      }

      webglRef.current = null;
    };
  }, [
    BFECC,
    colors,
    cursorSize,
    dt,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    viscous,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration
  ]);

  useEffect(() => {
    const webgl = webglRef.current;
    if (!webgl) {
      return;
    }

    const simulation = webgl.output?.simulation;
    if (!simulation) {
      return;
    }

    const previousResolution = simulation.options.resolution;
    Object.assign(simulation.options, {
      mouseForce,
      cursorSize,
      isViscous,
      viscous,
      iterationsViscous,
      iterationsPoisson,
      dt,
      BFECC,
      resolution,
      isBounce
    });

    if (webgl.autoDriver) {
      webgl.autoDriver.enabled = autoDemo;
      webgl.autoDriver.speed = autoSpeed;
      webgl.autoDriver.resumeDelay = autoResumeDelay;
      webgl.autoDriver.rampDurationMs = autoRampDuration * 1000;
      webgl.autoDriver.mouse.autoIntensity = autoIntensity;
      webgl.autoDriver.mouse.takeoverDuration = takeoverDuration;
    }

    if (resolution !== previousResolution) {
      simulation.resize();
    }
  }, [
    mouseForce,
    cursorSize,
    isViscous,
    viscous,
    iterationsViscous,
    iterationsPoisson,
    dt,
    BFECC,
    resolution,
    isBounce,
    autoDemo,
    autoSpeed,
    autoIntensity,
    takeoverDuration,
    autoResumeDelay,
    autoRampDuration
  ]);

  return <div ref={mountRef} className={`liquid-ether-container ${className}`.trim()} style={style} />;
}
