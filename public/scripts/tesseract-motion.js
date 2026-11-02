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

  /* Icosahedron: 12 vertices on the unit sphere (cyclic permutations of (0, +-1, +-phi), normalised). */
  var ICO_VERTS = [
    { x: 0.0, y: -0.525731, z: -0.850651 },
    { x: -0.525731, y: -0.850651, z: 0.0 },
    { x: -0.850651, y: 0.0, z: -0.525731 },
    { x: 0.0, y: -0.525731, z: 0.850651 },
    { x: -0.525731, y: 0.850651, z: 0.0 },
    { x: 0.850651, y: 0.0, z: -0.525731 },
    { x: 0.0, y: 0.525731, z: -0.850651 },
    { x: 0.525731, y: -0.850651, z: 0.0 },
    { x: -0.850651, y: 0.0, z: 0.525731 },
    { x: 0.0, y: 0.525731, z: 0.850651 },
    { x: 0.525731, y: 0.850651, z: 0.0 },
    { x: 0.850651, y: 0.0, z: 0.525731 },
  ];
  /* Vertex triples of the 20 faces, each wound so that (v1-v0) x (v2-v0) points out of the solid. */
  var ICO_FACES = [
    [0, 1, 2], [0, 7, 1], [0, 2, 6], [0, 6, 5], [0, 5, 7],
    [1, 8, 2], [1, 7, 3], [1, 3, 8], [2, 4, 6], [2, 8, 4],
    [3, 7, 11], [3, 9, 8], [3, 11, 9], [4, 10, 6], [4, 8, 9],
    [4, 9, 10], [5, 6, 10], [5, 11, 7], [5, 10, 11], [9, 11, 10],
  ];
  /* Circumradius in camera units; the solid is rigid, only yaw/pitch touch it. */
  var ICO_R = 1.7;


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

  // z of the outward normal (v0->v1) x (v0->v2) in camera space; positive means the face looks at the camera.
  function facing(q) {
    return (q[1].x - q[0].x) * (q[2].y - q[0].y) - (q[1].y - q[0].y) * (q[2].x - q[0].x);
  }

  // Maps the image's local rect (0,0)-(1,1) onto the face: q0 top-left, local x to q1, local y to q2.
  function affineMatrix(q) {
    var a = q[1].x - q[0].x;
    var c = q[1].y - q[0].y;
    var b = q[2].x - q[0].x;
    var d = q[2].y - q[0].y;
    return a + " " + c + " " + b + " " + d + " " + q[0].x + " " + q[0].y;
  }

  var TRI_PERMS = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]];

  // Picks the vertex order that puts the photo upright and never mirrored.
  function uprightOrder(q) {
    var best = null, bestScore = -Infinity;
    for (var i = 0; i < TRI_PERMS.length; i += 1) {
      var p = TRI_PERMS[i];
      var t = [q[p[0]], q[p[1]], q[p[2]]];
      var rx = t[1].x - t[0].x, ry = t[1].y - t[0].y;
      var dx = t[2].x - t[0].x, dy = t[2].y - t[0].y;
      if (rx * dy - dx * ry <= 0) continue;
      var score = rx / (Math.hypot(rx, ry) || 1) + dy / (Math.hypot(dx, dy) || 1);
      if (score > bestScore) { bestScore = score; best = t; }
    }
    return best || q;
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

  // Camera-space vertex of the solid icosahedron; rigid, only yaw/pitch touch it.
  function icoVertex(v, rot) {
    return orbit3({ x: v.x * ICO_R, y: v.y * ICO_R, z: v.z * ICO_R }, rot.yaw, rot.pitch);
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
    var verts = ICO_VERTS.map(function (v) {
      return icoVertex(v, rot);
    });
    var cube = ICO_FACES.map(function (face, index) {
      var quad = face.map(function (i) {
        return verts[i];
      });
      var screen = quad.map(toScreen);
      return {
        side: index,
        points: screen
          .map(function (p) {
            return p.x.toFixed(2) + "," + p.y.toFixed(2);
          })
          .join(" "),
        cx: (screen[0].x + screen[1].x + screen[2].x) / 3,
        cy: (screen[0].y + screen[1].y + screen[2].y) / 3,
        depth: (quad[0].z + quad[1].z + quad[2].z) / 3,
        front: facing(quad) > 0,
        affine: affineMatrix(uprightOrder(screen)),
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
    var groups = ICO_FACES.map(function (_, i) {
      return facesLayer.querySelector('g[data-f="' + i + '"]');
    });
    var bases = ICO_FACES.map(function (_, i) {
      return facesLayer.querySelector('polygon[data-ft="' + i + '"]');
    });
    var clips = ICO_FACES.map(function (_, i) {
      return svg.querySelector('polygon[data-fc="' + i + '"]');
    });
    var images = ICO_FACES.map(function (_, i) {
      return facesLayer.querySelector('image[data-fi="' + i + '"]');
    });
    var plays = ICO_FACES.map(function (_, i) {
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
      var order = model.cube
        .map(function (_, idx) {
          return idx;
        })
        .sort(function (ia, ib) {
          return model.cube[ia].depth - model.cube[ib].depth;
        });
      for (var o = 0; o < order.length; o += 1) {
        var idx = order[o];
        var group = groups[idx];
        var item = model.cube[idx];
        if (!group) continue;
        group.setAttribute("display", item.front ? "block" : "none");
        if (!item.front) continue;
        facesLayer.appendChild(group);
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
