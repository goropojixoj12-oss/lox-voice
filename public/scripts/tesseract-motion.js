/**
 * 4D tesseract motion for listing galleries.
 * Runs even if the React island is late or never hydrates (preview iframes / SSR HTML).
 */
(function () {
  var VIEW = 1000;
  var D4 = 3;
  var D3 = 7.5;
  var XW_SPEED = 0.1;
  var YW_SPEED = 0.07;
  var YAW_SPEED = 0.035;
  var INITIAL = { xw: 0.08, yw: 0.1, zw: 0, xy: 0, yaw: 0.55, pitch: 0.38 };

  function vertex(i) {
    return { x: i & 1 ? 1 : -1, y: i & 2 ? 1 : -1, z: i & 4 ? 1 : -1, w: i & 8 ? 1 : -1 };
  }

  function squares() {
    var faces = [];
    for (var a = 0; a < 4; a += 1) {
      for (var b = a + 1; b < 4; b += 1) {
        var fixed = [];
        for (var d = 0; d < 4; d += 1) if (d !== a && d !== b) fixed.push(d);
        for (var s0 = 0; s0 <= 1; s0 += 1) {
          for (var s1 = 0; s1 <= 1; s1 += 1) {
            var ids = [];
            for (var va = 0; va <= 1; va += 1) {
              for (var vb = 0; vb <= 1; vb += 1) {
                var id = 0;
                if (va) id |= 1 << a;
                if (vb) id |= 1 << b;
                if (s0) id |= 1 << fixed[0];
                if (s1) id |= 1 << fixed[1];
                ids.push(id);
              }
            }
            faces.push({
              ids: [ids[0], ids[1], ids[3], ids[2]],
              cube: fixed[0] * 2 + s0,
              wCell: a !== 3 && b !== 3,
            });
          }
        }
      }
    }
    return faces;
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

  var SQUARES = squares();
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

  function facing(q) {
    return (q[1].x - q[0].x) * (q[3].y - q[0].y) - (q[1].y - q[0].y) * (q[3].x - q[0].x);
  }

  function affineMatrix(q) {
    var a = q[3].x - q[0].x;
    var c = q[3].y - q[0].y;
    var b = q[1].x - q[0].x;
    var d = q[1].y - q[0].y;
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

  function buildModel(rot) {
    var raw = projectRaw(rot);
    var pts = raw.map(function (p) {
      return {
        x: VIEW / 2 + (p.x - FIT.ox) * FIT.scale,
        y: VIEW / 2 - (p.y - FIT.oy) * FIT.scale,
        z: p.z,
      };
    });
    var faceModels = SQUARES.map(function (geom, faceIndex) {
      var quad = geom.ids.map(function (id) {
        return pts[id];
      });
      return {
        faceIndex: faceIndex,
        geom: geom,
        quad: quad,
        points: quad
          .map(function (p) {
            return p.x.toFixed(2) + "," + p.y.toFixed(2);
          })
          .join(" "),
        depth: (quad[0].z + quad[1].z + quad[2].z + quad[3].z) / 4,
        area: facing(quad),
        affine: affineMatrix(quad),
      };
    });
    return { pts: pts, faceModels: faceModels };
  }

  function attach(svg) {
    if (svg.getAttribute("data-live") === "1") return;
    var facesLayer = svg.querySelector("[data-layer='faces']");
    if (!facesLayer) return;

    var lines = EDGES.map(function (pair) {
      return svg.querySelector('line[data-e="' + pair[0] + "-" + pair[1] + '"]');
    });
    var groups = SQUARES.map(function (_, i) {
      return facesLayer.querySelector('g[data-f="' + i + '"]');
    });
    var tints = SQUARES.map(function (_, i) {
      return facesLayer.querySelector('polygon[data-ft="' + i + '"]');
    });
    var clips = SQUARES.map(function (_, i) {
      return svg.querySelector('polygon[data-fc="' + i + '"]');
    });
    var images = SQUARES.map(function (_, i) {
      return facesLayer.querySelector('image[data-fi="' + i + '"]');
    });
    var plays = SQUARES.map(function (_, i) {
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
      var order = model.faceModels
        .map(function (_, idx) {
          return idx;
        })
        .sort(function (ia, ib) {
          return model.faceModels[ia].depth - model.faceModels[ib].depth;
        });
      for (var o = 0; o < order.length; o += 1) {
        var idx = order[o];
        var group = groups[idx];
        var item = model.faceModels[idx];
        if (!group) continue;
        facesLayer.appendChild(group);
        var back = item.area < 0;
        if (tints[idx]) {
          tints[idx].setAttribute("points", item.points);
          tints[idx].setAttribute("fill-opacity", back ? "0.04" : "0.06");
        }
        if (clips[idx]) clips[idx].setAttribute("points", item.points);
        if (images[idx]) {
          images[idx].setAttribute("transform", "matrix(" + item.affine + ")");
          images[idx].setAttribute("opacity", back ? "0.88" : "1");
        }
        if (plays[idx]) {
          var cx = (item.quad[0].x + item.quad[2].x) / 2;
          var cy = (item.quad[0].y + item.quad[2].y) / 2;
          plays[idx].setAttribute("points", cx + 14 + "," + cy + " " + (cx - 9) + "," + (cy - 11) + " " + (cx - 9) + "," + (cy + 11));
          plays[idx].setAttribute("display", back ? "none" : "block");
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
        rot.yw = drag.yw + dx * 0.004;
        rot.xw = drag.xw + dy * 0.004;
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
