/**
 * 4D tesseract cage + solid photo cube for listing galleries.
 * Runs even if the React island is late or never hydrates (preview iframes / SSR HTML).
 * Mirrors src/components/property/property-gallery-3d.tsx — keep the two in sync.
 */
(function () {
  var VIEW = 1000;
  var D4 = 3;
  var D3 = 7.5;
  var XW_SPEED = 0.1;
  var YW_SPEED = 0.07;
  var YAW_SPEED = 0.035;
  var INITIAL = { xw: 0.08, yw: 0.1, zw: 0, xy: 0, yaw: 0.55, pitch: 0.38 };

  /* Solid corner radius in camera units - stays inside the projected outer cell (radius 1.5). */
  var CUBE_HALF = 0.72;

  /*
   * The 6 faces as corner rings [top-left, top-right, bottom-right, bottom-left] of the photo.
   * Wound clockwise when seen from outside, with the photo's own up edge first.
   * Corners are indexed by bits: bit0 = x, bit1 = y, bit2 = z, set means +CUBE_HALF.
   */
  var CUBE_FACES = [
    [6, 7, 5, 4], // +z front
    [7, 3, 1, 5], // +x right
    [3, 2, 0, 1], // -z back
    [2, 6, 4, 0], // -x left
    [2, 3, 7, 6], // +y top, up edge meets the back face
    [4, 5, 1, 0], // -y bottom, up edge meets the front face
  ];

  function vertex(i) {
    return { x: i & 1 ? 1 : -1, y: i & 2 ? 1 : -1, z: i & 4 ? 1 : -1, w: i & 8 ? 1 : -1 };
  }

  function edges() {
    var out = [];
    for (var i = 0; i < 16; i += 1) {
      for (var b = 0; b < 4; b += 1) {
        var j = i | (1 << b);
        if (j > i) out.push([i, j]);
      }
    }
    return out;
  }

  var EDGES = edges();

  function rotate4(v, plane, angle) {
    var arr = [v.x, v.y, v.z, v.w];
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var i = plane[0];
    var j = plane[1];
    var vi = arr[i];
    var vj = arr[j];
    arr[i] = vi * c - vj * s;
    arr[j] = vi * s + vj * c;
    return { x: arr[0], y: arr[1], z: arr[2], w: arr[3] };
  }

  function orbit3(p, yaw, pitch) {
    var cy = Math.cos(yaw);
    var sy = Math.sin(yaw);
    var x1 = p.x * cy - p.z * sy;
    var z1 = p.x * sy + p.z * cy;
    var cp = Math.cos(pitch);
    var sp = Math.sin(pitch);
    return { x: x1, y: p.y * cp - z1 * sp, z: p.y * sp + z1 * cp };
  }

  /*
   * dot(outward normal, face centre - camera) for the ring [TL,TR,BR,BL] in camera space.
   * Negative means the face looks at the camera. Measured from the camera point rather than
   * from its z alone, so a face seen almost edge-on is never culled on the wrong side.
   */
  function facing(q) {
    var e1x = q[1].x - q[0].x, e1y = q[1].y - q[0].y, e1z = q[1].z - q[0].z;
    var e3x = q[3].x - q[0].x, e3y = q[3].y - q[0].y, e3z = q[3].z - q[0].z;
    var nx = e3y * e1z - e3z * e1y;
    var ny = e3z * e1x - e3x * e1z;
    var nz = e3x * e1y - e3y * e1x;
    var cx = (q[0].x + q[2].x) / 2, cy = (q[0].y + q[2].y) / 2, cz = (q[0].z + q[2].z) / 2 - D3;
    return nx * cx + ny * cy + nz * cz;
  }

  /*
   * Maps the square photo onto the ring [TL,TR,BR,BL]: local x runs TL->TR, local y runs TL->BL.
   * The determinant is positive, so the photo is never mirrored, and it needs no vertex search.
   */
  function affineMatrix(q) {
    var a = q[1].x - q[0].x, c = q[1].y - q[0].y;
    var b = q[3].x - q[0].x, d = q[3].y - q[0].y;
    return a + " " + c + " " + b + " " + d + " " + q[0].x + " " + q[0].y;
  }

  function projectRaw(rot) {
    var cam = [];
    for (var i = 0; i < 16; i += 1) {
      var v = vertex(i);
      v = rotate4(v, [0, 1], rot.xy);
      v = rotate4(v, [0, 3], rot.xw);
      v = rotate4(v, [1, 3], rot.yw);
      v = rotate4(v, [2, 3], rot.zw);
      var k4 = D4 / (D4 - v.w);
      cam.push(orbit3({ x: v.x * k4, y: v.y * k4, z: v.z * k4 }, rot.yaw, rot.pitch));
    }
    return cam.map(function (p) {
      var z = Math.min(p.z, D3 - 0.6);
      var k = D3 / (D3 - z);
      return { x: p.x * k, y: p.y * k, z: p.z };
    });
  }

  var rest = projectRaw(INITIAL);
  var minX = Infinity;
  var maxX = -Infinity;
  var minY = Infinity;
  var maxY = -Infinity;
  rest.forEach(function (p) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  var span = Math.max(maxX - minX, maxY - minY, 0.2);
  var FIT = { scale: (VIEW * 0.82) / span, ox: (minX + maxX) / 2, oy: (minY + maxY) / 2 };

  /* Camera-space corner of the solid photo cube; rigid, only yaw/pitch touch it. */
  function cubeCorner(i, rot) {
    return orbit3(
      {
        x: i & 1 ? CUBE_HALF : -CUBE_HALF,
        y: i & 2 ? CUBE_HALF : -CUBE_HALF,
        z: i & 4 ? CUBE_HALF : -CUBE_HALF,
      },
      rot.yaw,
      rot.pitch
    );
  }

  function toScreen(p) {
    var z = Math.min(p.z, D3 - 0.6);
    var k = D3 / (D3 - z);
    return {
      x: VIEW / 2 + (p.x * k - FIT.ox) * FIT.scale,
      y: VIEW / 2 - (p.y * k - FIT.oy) * FIT.scale,
      z: p.z,
    };
  }

  function buildModel(rot) {
    var raw = projectRaw(rot);
    var pts = raw.map(function (p) {
      return {
        x: VIEW / 2 + (p.x - FIT.ox) * FIT.scale,
        y: VIEW / 2 - (p.y - FIT.oy) * FIT.scale,
        z: p.z,
      };
    });
    var cube = CUBE_FACES.map(function (face, index) {
      var quad = face.map(function (i) {
        return cubeCorner(i, rot);
      });
      var screen = quad.map(toScreen);
      return {
        side: index,
        points: screen
          .map(function (p) {
            return p.x.toFixed(2) + "," + p.y.toFixed(2);
          })
          .join(" "),
        cx: (screen[0].x + screen[1].x + screen[2].x + screen[3].x) / 4,
        cy: (screen[0].y + screen[1].y + screen[2].y + screen[3].y) / 4,
        front: facing(quad) < 0,
        affine: affineMatrix(screen),
      };
    });
    return { pts: pts, cube: cube };
  }

  function attach(svg) {
    if (svg.getAttribute("data-live") === "1") return;
    var facesLayer = svg.querySelector("[data-layer='faces']");
    if (!facesLayer) return;

    var lines = EDGES.map(function (pair) {
      return svg.querySelector('line[data-e="' + pair[0] + "-" + pair[1] + '"]');
    });
    var groups = CUBE_FACES.map(function (_, i) {
      return facesLayer.querySelector('g[data-f="' + i + '"]');
    });
    var bases = CUBE_FACES.map(function (_, i) {
      return facesLayer.querySelector('polygon[data-ft="' + i + '"]');
    });
    var clips = CUBE_FACES.map(function (_, i) {
      return svg.querySelector('polygon[data-fc="' + i + '"]');
    });
    var images = CUBE_FACES.map(function (_, i) {
      return facesLayer.querySelector('image[data-fi="' + i + '"]');
    });
    var plays = CUBE_FACES.map(function (_, i) {
      return facesLayer.querySelector('polygon[data-fpb="' + i + '"]');
    });
    var circles = [];
    for (var ci = 0; ci < 16; ci += 1) circles.push(svg.querySelector('circle[data-v="' + ci + '"]'));

    var rot = {
      xw: INITIAL.xw,
      yw: INITIAL.yw,
      zw: INITIAL.zw,
      xy: INITIAL.xy,
      yaw: INITIAL.yaw,
      pitch: INITIAL.pitch,
    };
    var base = {
      xw: rot.xw,
      yw: rot.yw,
      zw: rot.zw,
      xy: rot.xy,
      yaw: rot.yaw,
      pitch: rot.pitch,
    };
    var spinning = true;
    var spinStartedAt = performance.now();
    var frames = 0;
    var drag = null;

    function paint() {
      var model = buildModel(rot);
      svg.setAttribute("data-xw", rot.xw.toFixed(4));
      svg.setAttribute("data-yw", rot.yw.toFixed(4));
      svg.setAttribute("data-yaw", rot.yaw.toFixed(4));
      svg.setAttribute("data-frames", String(frames));
      for (var i = 0; i < EDGES.length; i += 1) {
        var line = lines[i];
        if (!line) continue;
        var a = EDGES[i][0];
        var b = EDGES[i][1];
        line.setAttribute("x1", model.pts[a].x.toFixed(2));
        line.setAttribute("y1", model.pts[a].y.toFixed(2));
        line.setAttribute("x2", model.pts[b].x.toFixed(2));
        line.setAttribute("y2", model.pts[b].y.toFixed(2));
      }
      /* Visible faces of a convex solid never overlap, so the DOM order stays untouched —
         moving nodes here would desynchronise them from React's hydration pairing. */
      for (var idx = 0; idx < model.cube.length; idx += 1) {
        var group = groups[idx];
        var item = model.cube[idx];
        if (!group) continue;
        group.setAttribute("display", item.front ? "block" : "none");
        if (!item.front) continue;
        if (bases[idx]) bases[idx].setAttribute("points", item.points);
        if (clips[idx]) clips[idx].setAttribute("points", item.points);
        if (images[idx]) images[idx].setAttribute("transform", "matrix(" + item.affine + ")");
        if (plays[idx]) {
          plays[idx].setAttribute(
            "points",
            item.cx + 14 + "," + item.cy + " " + (item.cx - 9) + "," + (item.cy - 11) + " " + (item.cx - 9) + "," + (item.cy + 11),
          );
        }
      }
      for (var v = 0; v < 16; v += 1) {
        if (!circles[v]) continue;
        circles[v].setAttribute("cx", model.pts[v].x.toFixed(2));
        circles[v].setAttribute("cy", model.pts[v].y.toFixed(2));
      }
    }

    function tick(now) {
      var spin = svg.getAttribute("data-paused") !== "1" && svg.getAttribute("data-dragging") !== "1";
      if (spin) {
        if (!spinning) {
          spinStartedAt = now;
          base = {
            xw: rot.xw,
            yw: rot.yw,
            zw: rot.zw,
            xy: rot.xy,
            yaw: rot.yaw,
            pitch: rot.pitch,
          };
        }
        var elapsed = (now - spinStartedAt) / 1000;
        rot.xw = base.xw + elapsed * XW_SPEED;
        rot.yw = base.yw + elapsed * YW_SPEED;
        rot.yaw = base.yaw + elapsed * YAW_SPEED;
      }
      spinning = spin;
      frames += 1;
      paint();
    }

    function loop(now) {
      tick(now);
      window.requestAnimationFrame(loop);
    }

    svg.setAttribute("data-live", "1");
    tick(performance.now());
    window.requestAnimationFrame(loop);
    window.setInterval(function () {
      tick(performance.now());
    }, 16);

    var host = svg.parentElement;
    if (host && !host.getAttribute("data-tesseract-drag")) {
      host.setAttribute("data-tesseract-drag", "1");
      host.addEventListener("pointerdown", function (event) {
        if (event.target && event.target.closest && event.target.closest("button")) return;
        host.setPointerCapture(event.pointerId);
        svg.setAttribute("data-dragging", "1");
        drag = { x: event.clientX, y: event.clientY, yaw: rot.yaw, pitch: rot.pitch, xw: rot.xw, yw: rot.yw };
      });
      host.addEventListener("pointermove", function (event) {
        if (!drag) return;
        var dx = event.clientX - drag.x;
        var dy = event.clientY - drag.y;
        rot.yaw = drag.yaw + dx * 0.008;
        rot.pitch = Math.max(-1.15, Math.min(1.15, drag.pitch + dy * 0.008));
        rot.xw = drag.xw + dy * 0.004;
        rot.yw = drag.yw + dx * 0.004;
        paint();
      });
      function endDrag() {
        drag = null;
        svg.setAttribute("data-dragging", "0");
        base = {
          xw: rot.xw,
          yw: rot.yw,
          zw: rot.zw,
          xy: rot.xy,
          yaw: rot.yaw,
          pitch: rot.pitch,
        };
        spinStartedAt = performance.now();
        spinning = false;
      }
      host.addEventListener("pointerup", endDrag);
      host.addEventListener("pointercancel", endDrag);
    }
  }

  function scan() {
    document.querySelectorAll("svg[data-tesseract]").forEach(attach);
  }

  window.__tesseractBoot = "script";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();
  window.requestAnimationFrame(scan);
  window.setInterval(scan, 200);
})();
