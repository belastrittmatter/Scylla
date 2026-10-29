/*!
 * DrawSVGPlugin 3.13.0
 * https://gsap.com
 *
 * @license Copyright 2025, GreenSock. All rights reserved.
 * Subject to the terms at https://gsap.com/standard-license.
 * @author: Jack Doyle, jack@greensock.com
 */
(!(function (e, t) {
  "object" == typeof exports && "undefined" != typeof module
    ? t(exports)
    : "function" == typeof define && define.amd
      ? define(["exports"], t)
      : t(((e = e || self).window = e.window || {}));
})(this, function (e) {
  "use strict";
  function t() {
    return "undefined" != typeof window;
  }
  function i() {
    return h || (t() && (h = window.gsap) && h.registerPlugin && h);
  }
  function n(e) {
    return Math.round(1e4 * e) / 1e4;
  }
  function r(e) {
    return parseFloat(e) || 0;
  }
  function a(e, t) {
    var i = r(e);
    return ~e.indexOf("%") ? (i / 100) * t : i;
  }
  function s(e, t) {
    return r(e.getAttribute(t));
  }
  function o(e, t, i, n, a, s) {
    return T(Math.pow((r(i) - r(e)) * a, 2) + Math.pow((r(n) - r(t)) * s, 2));
  }
  function l(e) {
    return console.warn(e);
  }
  function d(e) {
    return "non-scaling-stroke" === e.getAttribute("vector-effect");
  }
  function c(e) {
    if (!(e = f(e)[0])) return 0;
    var t,
      i,
      r,
      a,
      c,
      u,
      p,
      h = e.tagName.toLowerCase(),
      v = e.style,
      g = 1,
      m = 1;
    d(e) &&
      ((m = e.getScreenCTM()),
      (g = T(m.a * m.a + m.b * m.b)),
      (m = T(m.d * m.d + m.c * m.c)));
    try {
      i = e.getBBox();
    } catch (e) {
      l(
        "Some browsers won't measure invisible elements (like display:none or masks inside defs).",
      );
    }
    var x = i || { x: 0, y: 0, width: 0, height: 0 },
      y = x.x,
      E = x.y,
      C = x.width,
      M = x.height;
    if (
      ((i && (C || M)) ||
        !S[h] ||
        ((C = s(e, S[h][0])),
        (M = s(e, S[h][1])),
        "rect" !== h && "line" !== h && ((C *= 2), (M *= 2)),
        "line" === h &&
          ((y = s(e, "x1")),
          (E = s(e, "y1")),
          (C = Math.abs(C - y)),
          (M = Math.abs(M - E)))),
      "path" === h)
    )
      ((a = v.strokeDasharray),
        (v.strokeDasharray = "none"),
        (t = e.getTotalLength() || 0),
        n(g) !== n(m) &&
          !b &&
          (b = 1) &&
          l(
            "Warning: <path> length cannot be measured when vector-effect is non-scaling-stroke and the element isn't proportionally scaled.",
          ),
        (t *= (g + m) / 2),
        (v.strokeDasharray = a));
    else if ("rect" === h) t = 2 * C * g + 2 * M * m;
    else if ("line" === h) t = o(y, E, y + C, E + M, g, m);
    else if ("polyline" === h || "polygon" === h)
      for (
        r = e.getAttribute("points").match(w) || [],
          "polygon" === h && r.push(r[0], r[1]),
          t = 0,
          c = 2;
        c < r.length;
        c += 2
      )
        t += o(r[c - 2], r[c - 1], r[c], r[c + 1], g, m) || 0;
    else
      ("circle" !== h && "ellipse" !== h) ||
        ((u = (C / 2) * g),
        (p = (M / 2) * m),
        (t = Math.PI * (3 * (u + p) - T((3 * u + p) * (u + 3 * p)))));
    return t || 0;
  }
  function u(e, t) {
    if (!(e = f(e)[0])) return [0, 0];
    t = t || c(e) + 1;
    var i = v.getComputedStyle(e),
      n = i.strokeDasharray || "",
      a = r(i.strokeDashoffset),
      s = n.indexOf(",");
    return (
      s < 0 && (s = n.indexOf(" ")),
      t < (n = s < 0 ? t : r(n.substr(0, s))) && (n = t),
      [-a || 0, n - a || 0]
    );
  }
  function p() {
    t() &&
      ((v = window),
      (m = h = i()),
      (f = h.utils.toArray),
      (x = h.core.getStyleSaver),
      (y = h.core.reverting || function () {}),
      (g = -1 !== ((v.navigator || {}).userAgent || "").indexOf("Edge")));
  }
  var h,
    f,
    v,
    g,
    m,
    b,
    x,
    y,
    w = /[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,
    S = {
      rect: ["width", "height"],
      circle: ["r", "r"],
      ellipse: ["rx", "ry"],
      line: ["x2", "y2"],
    },
    T = Math.sqrt,
    E = {
      version: "3.13.0",
      name: "drawSVG",
      register: function (e) {
        ((h = e), p());
      },
      init: function (e, t, i) {
        if (!e.getBBox) return !1;
        m || p();
        var s,
          o,
          l,
          h = c(e);
        return (
          (this.styles =
            x && x(e, "strokeDashoffset,strokeDasharray,strokeMiterlimit")),
          (this.tween = i),
          (this._style = e.style),
          (this._target = e),
          t + "" == "true"
            ? (t = "0 100%")
            : t
              ? -1 === (t + "").indexOf(" ") && (t = "0 " + t)
              : (t = "0 0"),
          (o = (function (e, t, i) {
            var n,
              r,
              s = e.indexOf(" ");
            return (
              (r =
                s < 0
                  ? ((n = void 0 !== i ? i + "" : e), e)
                  : ((n = e.substr(0, s)), e.substr(s + 1))),
              (n = a(n, t)),
              (r = a(r, t)) < n ? [r, n] : [n, r]
            );
          })(t, h, (s = u(e, h))[0])),
          (this._length = n(h)),
          (this._dash = n(s[1] - s[0])),
          (this._offset = n(-s[0])),
          (this._dashPT = this.add(
            this,
            "_dash",
            this._dash,
            n(o[1] - o[0]),
            0,
            0,
            0,
            0,
            0,
            1,
          )),
          (this._offsetPT = this.add(
            this,
            "_offset",
            this._offset,
            n(-o[0]),
            0,
            0,
            0,
            0,
            0,
            1,
          )),
          g &&
            (l = v.getComputedStyle(e)).strokeLinecap !== l.strokeLinejoin &&
            ((o = r(l.strokeMiterlimit)),
            this.add(e.style, "strokeMiterlimit", o, o + 0.01)),
          (this._live = d(e) || ~(t + "").indexOf("live")),
          (this._nowrap = ~(t + "").indexOf("nowrap")),
          this._props.push("drawSVG"),
          1
        );
      },
      render: function (e, t) {
        if (t.tween._time || !y()) {
          var i,
            n,
            r,
            a,
            s = t._pt,
            o = t._style;
          if (s) {
            for (
              t._live &&
              (i = c(t._target)) !== t._length &&
              ((n = i / t._length),
              (t._length = i),
              t._offsetPT && ((t._offsetPT.s *= n), (t._offsetPT.c *= n)),
              t._dashPT
                ? ((t._dashPT.s *= n), (t._dashPT.c *= n))
                : (t._dash *= n));
              s;
            )
              (s.r(e, s.d), (s = s._next));
            ((r = t._dash || (e && 1 !== e && 1e-4) || 0),
              (i = t._length - r + 0.1),
              (a = t._offset),
              r &&
                a &&
                r + Math.abs(a % t._length) > t._length - 0.05 &&
                (a += a < 0 ? 0.005 : -0.005) &&
                (i += 0.005),
              (o.strokeDashoffset = r ? a : a + 0.001),
              (o.strokeDasharray =
                i < 0.1
                  ? "none"
                  : r
                    ? r + "px," + (t._nowrap ? 999999 : i) + "px"
                    : "0px, 999999px"));
          }
        } else t.styles.revert();
      },
      getLength: c,
      getPosition: u,
    };
  (i() && h.registerPlugin(E),
    (e.DrawSVGPlugin = E),
    (e.default = E),
    "undefined" == typeof window || window !== e
      ? Object.defineProperty(e, "__esModule", { value: !0 })
      : delete e.default);
}),
  (function (e, t) {
    if ("object" == typeof exports && "object" == typeof module)
      module.exports = t();
    else if ("function" == typeof define && define.amd) define([], t);
    else {
      var i = t();
      for (var n in i) ("object" == typeof exports ? exports : e)[n] = i[n];
    }
  })(window, function () {
    return (function (e) {
      var t = {};
      function i(n) {
        if (t[n]) return t[n].exports;
        var r = (t[n] = { i: n, l: !1, exports: {} });
        return (e[n].call(r.exports, r, r.exports, i), (r.l = !0), r.exports);
      }
      return (
        (i.m = e),
        (i.c = t),
        (i.d = function (e, t, n) {
          i.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: n });
        }),
        (i.r = function (e) {
          ("undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 }));
        }),
        (i.t = function (e, t) {
          if ((1 & t && (e = i(e)), 8 & t)) return e;
          if (4 & t && "object" == typeof e && e && e.__esModule) return e;
          var n = Object.create(null);
          if (
            (i.r(n),
            Object.defineProperty(n, "default", { enumerable: !0, value: e }),
            2 & t && "string" != typeof e)
          )
            for (var r in e)
              i.d(
                n,
                r,
                function (t) {
                  return e[t];
                }.bind(null, r),
              );
          return n;
        }),
        (i.n = function (e) {
          var t =
            e && e.__esModule
              ? function () {
                  return e.default;
                }
              : function () {
                  return e;
                };
          return (i.d(t, "a", t), t);
        }),
        (i.o = function (e, t) {
          return Object.prototype.hasOwnProperty.call(e, t);
        }),
        (i.p = ""),
        i((i.s = 0))
      );
    })([
      function (e, t, i) {
        "use strict";
        i.r(t);
        var n,
          r = "fslightbox-",
          a = "".concat(r, "styles"),
          s = "".concat(r, "cursor-grabbing"),
          o = "".concat(r, "full-dimension"),
          l = "".concat(r, "flex-centered"),
          d = "".concat(r, "open"),
          c = "".concat(r, "transform-transition"),
          u = "".concat(r, "absoluted"),
          p = "".concat(r, "slide-btn"),
          h = "".concat(p, "-container"),
          f = "".concat(r, "fade-in"),
          v = "".concat(r, "fade-out"),
          g = f + "-strong",
          m = v + "-strong",
          b = "".concat(r, "opacity-"),
          x = "".concat(b, "1"),
          y = "".concat(r, "source"),
          w = "".concat(y, "-outer");
        function S(e) {
          return (S =
            "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
              ? function (e) {
                  return typeof e;
                }
              : function (e) {
                  return e &&
                    "function" == typeof Symbol &&
                    e.constructor === Symbol &&
                    e !== Symbol.prototype
                    ? "symbol"
                    : typeof e;
                })(e);
        }
        "object" ===
          ("undefined" == typeof document ? "undefined" : S(document)) &&
          (((n = document.createElement("style")).className = a),
          n.appendChild(
            document.createTextNode(
              ".fslightbox-absoluted{position:absolute;top:0;left:0}.fslightbox-fade-in{animation:fslightbox-fade-in .25s cubic-bezier(0,0,.7,1)}.fslightbox-fade-out{animation:fslightbox-fade-out .25s ease}.fslightbox-fade-in-strong{animation:fslightbox-fade-in-strong .25s cubic-bezier(0,0,.7,1)}.fslightbox-fade-out-strong{animation:fslightbox-fade-out-strong .25s ease}@keyframes fslightbox-fade-in{from{opacity:.65}to{opacity:1}}@keyframes fslightbox-fade-out{from{opacity:.35}to{opacity:0}}@keyframes fslightbox-fade-in-strong{from{opacity:.3}to{opacity:1}}@keyframes fslightbox-fade-out-strong{from{opacity:1}to{opacity:0}}.fslightbox-cursor-grabbing{cursor:grabbing}.fslightbox-full-dimension{width:100%;height:100%}.fslightbox-open{overflow:hidden;height:100%}.fslightbox-flex-centered{display:flex;justify-content:center;align-items:center}.fslightbox-opacity-0{opacity:0!important}.fslightbox-opacity-1{opacity:1!important}.fslightbox-scrollbarfix{padding-right:17px}.fslightbox-transform-transition{transition:transform .3s}.fslightbox-container{font-family:Helvetica,sans-serif;position:fixed;top:0;left:0;background:linear-gradient(rgba(30,30,30,.9),#000 1810%);z-index:9999999;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}.fslightbox-container *{box-sizing:border-box}.fslightbox-svg-path{transition:fill .15s ease;fill:#ddd}.fslightbox-nav{height:45px;width:100%;position:absolute;top:0;left:0}.fslightbox-slide-number-container{height:100%;font-size:15px;color:#d7d7d7;z-index:0;max-width:55px}.fslightbox-slide-number-container div{padding:0 2px}.fslightbox-slash{margin-top:2px;font-size:16px;font-weight:500}.fslightbox-toolbar{position:absolute;z-index:3;right:0;top:0;height:100%;display:flex;background:rgba(35,35,35,.65)}.fslightbox-toolbar-button{height:100%;width:45px;cursor:pointer}.fslightbox-toolbar-button:hover .fslightbox-svg-path{fill:#fff}.fslightbox-slide-btn-container{display:flex;align-items:center;padding:12px 12px 12px 6px;position:absolute;top:50%;cursor:pointer;z-index:3;transform:translateY(-50%)}@media (min-width:476px){.fslightbox-slide-btn-container{padding:22px 22px 22px 6px}}@media (min-width:768px){.fslightbox-slide-btn-container{padding:30px 30px 30px 6px}}.fslightbox-slide-btn-container:hover .fslightbox-svg-path{fill:#f1f1f1}.fslightbox-slide-btn{padding:9px;font-size:26px;background:rgba(35,35,35,.65)}@media (min-width:768px){.fslightbox-slide-btn{padding:10px}}@media (min-width:1600px){.fslightbox-slide-btn{padding:11px}}.fslightbox-slide-btn-container-previous{left:0}@media (max-width:475.99px){.fslightbox-slide-btn-container-previous{padding-left:3px}}.fslightbox-slide-btn-container-next{right:0;padding-left:12px;padding-right:3px}@media (min-width:476px){.fslightbox-slide-btn-container-next{padding-left:22px}}@media (min-width:768px){.fslightbox-slide-btn-container-next{padding-left:30px}}@media (min-width:476px){.fslightbox-slide-btn-container-next{padding-right:6px}}.fslightbox-down-event-detector{position:absolute;z-index:1}.fslightbox-slide-swiping-hoverer{z-index:4}.fslightbox-invalid-file-wrapper{font-size:22px;color:#eaebeb;margin:auto}.fslightbox-video{object-fit:cover}.fslightbox-youtube-iframe{border:0}.fslightbox-loader{display:block;margin:auto;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:67px;height:67px}.fslightbox-loader div{box-sizing:border-box;display:block;position:absolute;width:54px;height:54px;margin:6px;border:5px solid;border-color:#999 transparent transparent transparent;border-radius:50%;animation:fslightbox-loader 1.2s cubic-bezier(.5,0,.5,1) infinite}.fslightbox-loader div:nth-child(1){animation-delay:-.45s}.fslightbox-loader div:nth-child(2){animation-delay:-.3s}.fslightbox-loader div:nth-child(3){animation-delay:-.15s}@keyframes fslightbox-loader{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.fslightbox-source{position:relative;margin:auto;opacity:0;z-index:2;backface-visibility:hidden;transform:translateZ(0);transition:opacity .3s;will-change:opacity}.fslightbox-source-outer{will-change:transform}",
            ),
          ),
          document.head.appendChild(n));
        var T = "fslightbox-types",
          E = "fslightbox-scrollbar-width";
        function C(e) {
          var t,
            i = e.props,
            n = 0,
            r = {};
          ((this.getSourceTypeFromLocalStorageByUrl = function (e) {
            return t[e] ? t[e] : a(e);
          }),
            (this.handleReceivedSourceTypeForUrl = function (e, i) {
              void 0 !== r[i] &&
                (n--,
                (r[i] = e),
                0 === n &&
                  ((function (e, t) {
                    for (var i in t) e[i] = t[i];
                  })(t, r),
                  localStorage.setItem(T, JSON.stringify(t))));
            }));
          var a = function (e) {
            (n++, (r[e] = !1));
          };
          i.disableLocalStorage
            ? ((this.getSourceTypeFromLocalStorageByUrl = function () {}),
              (this.handleReceivedSourceTypeForUrl = function () {}))
            : (t = JSON.parse(localStorage.getItem(T))) ||
              ((t = {}), (this.getSourceTypeFromLocalStorageByUrl = a));
        }
        var M = "image",
          P = "video",
          k = "youtube",
          z = "custom",
          L = "invalid";
        function I(e, t, i, n) {
          var r = e.data,
            a = e.elements.sources,
            s = i / n,
            o = 0;
          this.styleSize = function () {
            if ((o = r.maxSourceWidth / s) < r.maxSourceHeight)
              return (i < r.maxSourceWidth && (o = n), l());
            ((o = n > r.maxSourceHeight ? r.maxSourceHeight : n), l());
          };
          var l = function () {
            ((a[t].style.width = o * s + "px"), (a[t].style.height = o + "px"));
          };
        }
        function A(e, t, i, n) {
          var r = this,
            a = e.collections.sourcesStylers,
            s = e.elements,
            o = s.sources,
            l = s.sourcesInners,
            d = s.sourcesOuters,
            c = e.resolve;
          ((this.runNormalLoadActions = function () {
            (o[t].classList.add(x),
              l[t].classList.add(g),
              d[t].removeChild(d[t].firstChild));
          }),
            (this.runInitialLoadActions = function () {
              r.runNormalLoadActions();
              var e = c(I, [t, i, n]);
              (e.styleSize(), (a[t] = e));
            }));
        }
        function O(e, t) {
          var i,
            n = this,
            r = e.elements.sources,
            a = e.props,
            s = e.resolve;
          ((this.handleImageLoad = function (e) {
            var t = e.target,
              i = t.width,
              r = t.height;
            n.handleImageLoad = o(i, r);
          }),
            (this.handleVideoLoad = function (e) {
              var t = e.target,
                r = t.videoWidth,
                a = t.videoHeight;
              ((i = !0), (n.handleVideoLoad = o(r, a)));
            }),
            (this.handleNotMetaDatedVideoLoad = function () {
              i || n.handleYoutubeLoad();
            }),
            (this.handleYoutubeLoad = function () {
              var e = 1920,
                t = 1080;
              (a.maxYoutubeDimensions &&
                ((e = a.maxYoutubeDimensions.width),
                (t = a.maxYoutubeDimensions.height)),
                (n.handleYoutubeLoad = o(e, t)));
            }),
            (this.handleCustomLoad = function () {
              setTimeout(function () {
                n.handleCustomLoad = o(r[t].offsetWidth, r[t].offsetHeight);
              });
            }));
          var o = function (e, i) {
            var n = s(A, [t, e, i]);
            return (n.runInitialLoadActions(), n.runNormalLoadActions);
          };
        }
        function _(e, t) {
          var i = e.collections.sourcesLoadsHandlers,
            n = e.elements,
            r = n.sources,
            a = n.sourcesInners,
            s = e.props.sources;
          ((r[t] = document.createElement("img")),
            (r[t].className = y),
            (r[t].src = s[t]),
            (r[t].onload = i[t].handleImageLoad),
            a[t].appendChild(r[t]));
        }
        function D(e, t) {
          var i = e.collections,
            n = i.sourcesLoadsHandlers,
            r = (i.sourcesStylers, e.elements),
            a = r.sources,
            s = r.sourcesInners,
            o = e.props,
            l = o.sources;
          ((a[t] = document.createElement("video")),
            (a[t].className = y),
            (a[t].src = l[t]),
            (a[t].onloadedmetadata = function (e) {
              n[t].handleVideoLoad(e);
            }),
            (a[t].controls = !0),
            o.videosPosters[t] && (a[t].poster = o.videosPosters[t]));
          var d = document.createElement("source");
          ((d.src = l[t]),
            a[t].appendChild(d),
            setTimeout(function () {
              n[t].handleNotMetaDatedVideoLoad();
            }, 3e3),
            s[t].appendChild(a[t]));
        }
        function N(e, t) {
          var i = e.collections.sourcesLoadsHandlers,
            n = e.elements,
            a = n.sources,
            s = n.sourcesInners,
            o = e.props.sources;
          ((a[t] = document.createElement("iframe")),
            (a[t].className = "".concat(y, " ").concat(r, "youtube-iframe")),
            (a[t].src = "https://www.youtube.com/embed/".concat(
              o[t].match(
                /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
              )[2],
            )),
            (a[t].allowFullscreen = !0),
            s[t].appendChild(a[t]),
            i[t].handleYoutubeLoad());
        }
        function $(e, t) {
          var i = e.collections.sourcesLoadsHandlers,
            n = e.elements,
            r = n.sources,
            a = n.sourcesInners,
            s = e.props,
            o = s.sources;
          ((r[t] = o[t]),
            r[t].classList.add(y),
            s.customClasses[t] && r[t].classList.add(s.customClasses[t]),
            a[t].appendChild(r[t]),
            i[t].handleCustomLoad());
        }
        function F(e, t) {
          var i = e.elements,
            n = i.sources,
            a = i.sourcesInners,
            s = i.sourcesOuters;
          (e.props.sources,
            (n[t] = document.createElement("div")),
            (n[t].className = "".concat(r, "invalid-file-wrapper ").concat(l)),
            (n[t].innerHTML = "Invalid source"),
            a[t].classList.add(g),
            a[t].appendChild(n[t]),
            s[t].removeChild(s[t].firstChild));
        }
        function H(e) {
          var t = e.collections,
            i = t.sourcesLoadsHandlers,
            n = t.sourcesRenderFunctions,
            r = e.core.stageManager,
            a = e.resolve;
          this.runActionsForSourceTypeAndIndex = function (t, s) {
            var o;
            switch ((t !== L && (i[s] = a(O, [s])), t)) {
              case M:
                o = _;
                break;
              case P:
                o = D;
                break;
              case k:
                o = N;
                break;
              case z:
                o = $;
                break;
              default:
                o = F;
            }
            r.isSourceInStage(s)
              ? o(e, s)
              : (n[s] = function () {
                  return o(e, s);
                });
          };
        }
        function R() {
          var e,
            t,
            i,
            n,
            r,
            a = function (e) {
              var t = document.createElement("a");
              return ((t.href = e), "www.youtube.com" === t.hostname);
            },
            s = function (e) {
              return e.slice(0, e.indexOf("/"));
            };
          ((this.setUrlToCheck = function (t) {
            e = t;
          }),
            (this.getSourceType = function (t) {
              if (a(e)) return t(k);
              ((i = t),
                (n = new XMLHttpRequest()).open("GET", e, !0),
                (n.onreadystatechange = o),
                n.send());
            }));
          var o = function () {
              if (4 === n.readyState && 0 === n.status && !r) return l();
              if (2 === n.readyState) {
                if (200 !== n.status && 206 !== n.status)
                  return ((r = !0), l());
                ((r = !0), c(s(n.getResponseHeader("content-type"))), d());
              }
            },
            l = function () {
              ((t = L), d());
            },
            d = function () {
              (n.abort(), i(t));
            },
            c = function (e) {
              switch (e) {
                case "image":
                  t = M;
                  break;
                case "video":
                  t = P;
                  break;
                default:
                  t = L;
              }
            };
        }
        function B(e, t, i) {
          var n = e.props,
            r = n.types,
            a = n.type,
            s = n.sources,
            o = e.resolve;
          ((this.getTypeSetByClientForIndex = function (e) {
            var t;
            return (r && r[e] ? (t = r[e]) : a && (t = a), t);
          }),
            (this.retrieveTypeWithXhrForIndex = function (e) {
              var n = o(R);
              (n.setUrlToCheck(s[e]),
                n.getSourceType(function (n) {
                  (t.handleReceivedSourceTypeForUrl(n, s[e]),
                    i.runActionsForSourceTypeAndIndex(n, e));
                }));
            }));
        }
        function X(e, t) {
          var i = e.elements,
            n = i.sourcesOutersWrapper,
            r = i.sourcesOuters;
          ((r[t] = document.createElement("div")),
            (r[t].className = ""
              .concat(w, " ")
              .concat(u, " ")
              .concat(o, " ")
              .concat(l)),
            (r[t].innerHTML =
              '<div class="fslightbox-loader"><div></div><div></div><div></div><div></div></div>'),
            n.appendChild(r[t]),
            (function (e, t) {
              var i = e.elements,
                n = i.sourcesOuters,
                r = i.sourcesInners;
              ((r[t] = document.createElement("div")), n[t].appendChild(r[t]));
            })(e, t));
        }
        function Y(e, t, i, n) {
          var a = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          (a.setAttributeNS(null, "width", t),
            a.setAttributeNS(null, "height", t),
            a.setAttributeNS(null, "viewBox", i));
          var s = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          return (
            s.setAttributeNS(null, "class", "".concat(r, "svg-path")),
            s.setAttributeNS(null, "d", n),
            a.appendChild(s),
            e.appendChild(a),
            a
          );
        }
        function V(e, t) {
          var i = document.createElement("div");
          return (
            (i.className = "".concat(r, "toolbar-button ").concat(l)),
            (i.title = t),
            e.appendChild(i),
            i
          );
        }
        function G(e) {
          var t = e.props.sources,
            i = e.elements.container,
            n = document.createElement("div");
          ((n.className = "".concat(r, "nav")),
            i.appendChild(n),
            (function (e, t) {
              var i = document.createElement("div");
              ((i.className = "".concat(r, "toolbar")),
                t.appendChild(i),
                (function (e, t) {
                  var i,
                    n = e.core.fullscreenToggler,
                    r = e.componentsServices,
                    a = e.data,
                    s =
                      "M4.5 11H3v4h4v-1.5H4.5V11zM3 7h1.5V4.5H7V3H3v4zm10.5 6.5H11V15h4v-4h-1.5v2.5zM11 3v1.5h2.5V7H15V3h-4z",
                    o =
                      "M682 342h128v84h-212v-212h84v128zM598 810v-212h212v84h-128v128h-84zM342 342v-128h84v212h-212v-84h128zM214 682v-84h212v212h-84v-128h-128z",
                    l = V(t);
                  ((a.isFullscreenOpen = !!document.fullscreenElement),
                    a.isFullscreenOpen
                      ? ((i = Y(l, "24px", "0 0 950 1024", o)),
                        (l.title = "Exit fullscreen"))
                      : ((i = Y(l, "20px", "0 0 18 18", s)),
                        (l.title = "Enter fullscreen")),
                    (r.enterFullscreen = function () {
                      ((a.isFullscreenOpen = !0),
                        (l.title = "Exit fullscreen"),
                        i.setAttributeNS(null, "width", "24px"),
                        i.setAttributeNS(null, "height", "24px"),
                        i.setAttributeNS(null, "viewBox", "0 0 950 1024"),
                        i.firstChild.setAttributeNS(null, "d", o));
                    }),
                    (r.exitFullscreen = function () {
                      ((a.isFullscreenOpen = !1),
                        (l.title = "Enter fullscreen"),
                        i.setAttributeNS(null, "width", "20px"),
                        i.setAttributeNS(null, "height", "20px"),
                        i.setAttributeNS(null, "viewBox", "0 0 18 18"),
                        i.firstChild.setAttributeNS(null, "d", s));
                    }),
                    (l.onclick = function () {
                      a.isFullscreenOpen
                        ? (r.exitFullscreen(), n.exitFullscreen())
                        : (r.enterFullscreen(), n.enterFullscreen());
                    }));
                })(e, i),
                (function (e, t) {
                  var i = V(t, "Close");
                  ((i.onclick = e.core.lightboxCloser.close),
                    Y(
                      i,
                      "20px",
                      "0 0 24 24",
                      "M 4.7070312 3.2929688 L 3.2929688 4.7070312 L 10.585938 12 L 3.2929688 19.292969 L 4.7070312 20.707031 L 12 13.414062 L 19.292969 20.707031 L 20.707031 19.292969 L 13.414062 12 L 20.707031 4.7070312 L 19.292969 3.2929688 L 12 10.585938 L 4.7070312 3.2929688 z",
                    ));
                })(e, i));
            })(e, n),
            t.length > 1 &&
              (function (e, t) {
                var i = e.componentsServices,
                  n = e.props.sources,
                  a = (e.stageIndexes, document.createElement("div"));
                a.className = "".concat(r, "slide-number-container ").concat(l);
                var s = document.createElement("div");
                i.setSlideNumber = function (e) {
                  return (s.innerHTML = e);
                };
                var o = document.createElement("div");
                ((o.className = "".concat(r, "slash")), (o.innerHTML = "/"));
                var d = document.createElement("div");
                ((d.innerHTML = n.length),
                  a.appendChild(s),
                  a.appendChild(o),
                  a.appendChild(d),
                  t.appendChild(a));
              })(e, n));
        }
        function W(e, t) {
          var i = this,
            n = e.elements.sourcesOuters,
            r = e.props,
            a = 0;
          ((this.byValue = function (e) {
            return ((a = e), i);
          }),
            (this.negative = function () {
              s(-o());
            }),
            (this.zero = function () {
              s(0);
            }),
            (this.positive = function () {
              s(o());
            }));
          var s = function (e) {
              ((n[t].style.transform = "translateX(".concat(e + a, "px)")),
                (a = 0));
            },
            o = function () {
              return (1 + r.slideDistance) * innerWidth;
            };
        }
        function j(e, t, i, n) {
          var r = e.elements.container,
            a = i.charAt(0).toUpperCase() + i.slice(1),
            s = document.createElement("div");
          ((s.className = "".concat(h, " ").concat(h, "-").concat(i)),
            (s.title = "".concat(a, " slide")),
            (s.onclick = t),
            (function (e, t) {
              var i = document.createElement("div");
              ((i.className = "".concat(p, " ").concat(l)),
                Y(i, "20px", "0 0 20 20", t),
                e.appendChild(i));
            })(s, n),
            r.appendChild(s));
        }
        function q(e, t) {
          var i = e.classList;
          i.contains(t) && i.remove(t);
        }
        function U(e) {
          var t = this,
            i = e.core,
            n = i.eventsDispatcher,
            r = i.fullscreenToggler,
            a = i.globalEventsController,
            s = i.scrollbarRecompensor,
            o = e.data,
            l = e.elements,
            c = e.slideSwipingProps;
          ((this.isLightboxFadingOut = !1),
            (this.runActions = function () {
              ((t.isLightboxFadingOut = !0),
                l.container.classList.add(m),
                a.removeListeners(),
                o.isFullscreenOpen && r.exitFullscreen(),
                setTimeout(function () {
                  ((t.isLightboxFadingOut = !1),
                    (c.isSwiping = !1),
                    l.container.classList.remove(m),
                    document.documentElement.classList.remove(d),
                    s.removeRecompense(),
                    document.body.removeChild(l.container),
                    n.dispatch("onClose"));
                }, 220));
            }));
        }
        var K = "sourcesOuters";
        function Z(e) {
          return e.touches ? e.touches[0].clientX : e.clientX;
        }
        function Q(e) {
          var t = e.componentsServices,
            i = e.core,
            n = i.lightboxCloser,
            r = i.fullscreenToggler,
            a = i.slideChangeFacade;
          this.listener = function (e) {
            switch (e.keyCode) {
              case 27:
                n.close();
                break;
              case 37:
                a.changeToPrevious();
                break;
              case 39:
                a.changeToNext();
                break;
              case 122:
                (e.preventDefault(), t.enterFullscreen(), r.enterFullscreen());
            }
          };
        }
        function J(e) {
          var t = e.collections.sourcesOutersTransformers,
            i = e.elements,
            n = e.slideSwipingProps,
            r = e.stageIndexes;
          this.runActionsForEvent = function (e) {
            var t, o, l;
            (i.container.contains(i.slideSwipingHoverer) ||
              i.container.appendChild(i.slideSwipingHoverer),
              (t = i.container),
              (o = s),
              (l = t.classList).contains(o) || l.add(o),
              (n.swipedX = Z(e) - n.downClientX),
              a(r.current, "zero"),
              void 0 !== r.previous && n.swipedX > 0
                ? a(r.previous, "negative")
                : void 0 !== r.next && n.swipedX < 0 && a(r.next, "positive"));
          };
          var a = function (e, i) {
            t[e].byValue(n.swipedX)[i]();
          };
        }
        function ee(e) {
          var t,
            i = e.props.sources,
            n = e.resolve,
            r = e.slideSwipingProps,
            a = n(J),
            s =
              ((t = !1),
              function () {
                return (
                  !t &&
                  ((t = !0),
                  requestAnimationFrame(function () {
                    t = !1;
                  }),
                  !0)
                );
              });
          1 === i.length
            ? (this.listener = function () {
                r.swipedX = 1;
              })
            : (this.listener = function (e) {
                r.isSwiping && s() && a.runActionsForEvent(e);
              });
        }
        function te(e) {
          var t = e.collections.sourcesOutersTransformers,
            i = e.core.slideIndexChanger,
            n = e.elements.sourcesOuters,
            r = e.stageIndexes;
          ((this.runPositiveSwipedXActions = function () {
            (void 0 === r.previous || (a("positive"), i.changeTo(r.previous)),
              a("zero"));
          }),
            (this.runNegativeSwipedXActions = function () {
              (void 0 === r.next || (a("negative"), i.changeTo(r.next)),
                a("zero"));
            }));
          var a = function (e) {
            (n[r.current].classList.add(c), t[r.current][e]());
          };
        }
        function ie(e) {
          var t = e.core.lightboxCloser,
            i = e.elements,
            n = e.resolve,
            r = e.slideSwipingProps,
            a = n(te);
          ((this.runNoSwipeActions = function () {
            (r.isSourceDownEventTarget || t.close(), (r.isSwiping = !1));
          }),
            (this.runActions = function () {
              (r.swipedX > 0
                ? a.runPositiveSwipedXActions()
                : a.runNegativeSwipedXActions(),
                i.container.contains(i.slideSwipingHoverer) &&
                  i.container.removeChild(i.slideSwipingHoverer),
                i.container.classList.remove(s),
                (r.isSwiping = !1));
            }));
        }
        function ne(e) {
          var t = e.resolve,
            i = e.slideSwipingProps,
            n = t(ie);
          this.listener = function () {
            i.isSwiping && (i.swipedX ? n.runActions() : n.runNoSwipeActions());
          };
        }
        function re(e) {
          var t, i, n;
          ((i = (t = e).core.classFacade),
            (n = t.elements),
            (i.removeFromEachElementClassIfContains = function (e, t) {
              for (var i = 0; i < n[e].length; i++) q(n[e][i], t);
            }),
            (function (e) {
              var t = e.core.eventsDispatcher,
                i = e.props;
              t.dispatch = function (e) {
                i[e] && i[e]();
              };
            })(e),
            (function (e) {
              var t = e.core.fullscreenToggler;
              ((t.enterFullscreen = function () {
                var e = document.documentElement;
                e.requestFullscreen
                  ? e.requestFullscreen()
                  : e.mozRequestFullScreen
                    ? e.mozRequestFullScreen()
                    : e.webkitRequestFullscreen
                      ? e.webkitRequestFullscreen()
                      : e.msRequestFullscreen && e.msRequestFullscreen();
              }),
                (t.exitFullscreen = function () {
                  document.exitFullscreen
                    ? document.exitFullscreen()
                    : document.mozCancelFullScreen
                      ? document.mozCancelFullScreen()
                      : document.webkitExitFullscreen
                        ? document.webkitExitFullscreen()
                        : document.msExitFullscreen &&
                          document.msExitFullscreen();
                }));
            })(e),
            (function (e) {
              var t = e.core,
                i = t.globalEventsController,
                n = t.windowResizeActioner,
                r = e.resolve,
                a = r(Q),
                s = r(ee),
                o = r(ne);
              ((i.attachListeners = function () {
                (document.addEventListener("mousemove", s.listener),
                  document.addEventListener("touchmove", s.listener, {
                    passive: !0,
                  }),
                  document.addEventListener("mouseup", o.listener),
                  document.addEventListener("touchend", o.listener, {
                    passive: !0,
                  }),
                  addEventListener("resize", n.runActions),
                  document.addEventListener("keydown", a.listener));
              }),
                (i.removeListeners = function () {
                  (document.removeEventListener("mousemove", s.listener),
                    document.removeEventListener("touchmove", s.listener),
                    document.removeEventListener("mouseup", o.listener),
                    document.removeEventListener("touchend", o.listener),
                    removeEventListener("resize", n.runActions),
                    document.removeEventListener("keydown", a.listener));
                }));
            })(e),
            (function (e) {
              var t = e.core.lightboxCloser,
                i = (0, e.resolve)(U);
              t.close = function () {
                i.isLightboxFadingOut || i.runActions();
              };
            })(e),
            se(e),
            (function (e) {
              var t = e.data,
                i = e.core.scrollbarRecompensor;
              i.addRecompense = function () {
                "complete" === document.readyState
                  ? n()
                  : addEventListener("load", function () {
                      (n(), (i.addRecompense = n));
                    });
              };
              var n = function () {
                document.body.offsetHeight > innerHeight &&
                  (document.body.style.marginRight = t.scrollbarWidth + "px");
              };
              i.removeRecompense = function () {
                document.body.style.removeProperty("margin-right");
              };
            })(e),
            (function (e) {
              var t = e.core,
                i = t.slideChangeFacade,
                n = t.slideIndexChanger,
                r = t.stageManager;
              e.props.sources.length > 1
                ? ((i.changeToPrevious = function () {
                    n.jumpTo(r.getPreviousSlideIndex());
                  }),
                  (i.changeToNext = function () {
                    n.jumpTo(r.getNextSlideIndex());
                  }))
                : ((i.changeToPrevious = function () {}),
                  (i.changeToNext = function () {}));
            })(e),
            (function (e) {
              var t,
                i,
                n = e.collections.sourcesOutersTransformers,
                r = e.componentsServices,
                a = e.core,
                s = a.classFacade,
                o = a.slideIndexChanger,
                l = a.sourceDisplayFacade,
                d = a.stageManager,
                u = e.elements.sourcesInners,
                p = e.stageIndexes,
                h =
                  ((t = function () {
                    s.removeFromEachElementClassIfContains("sourcesInners", v);
                  }),
                  (i = []),
                  function () {
                    (i.push(!0),
                      setTimeout(function () {
                        (i.pop(), i.length || t());
                      }, 250));
                  });
              ((o.changeTo = function (e) {
                ((p.current = e),
                  d.updateStageIndexes(),
                  r.setSlideNumber(e + 1),
                  l.displayStageSourcesIfNotYet());
              }),
                (o.jumpTo = function (e) {
                  var t = p.current;
                  (o.changeTo(e),
                    s.removeFromEachElementClassIfContains(K, c),
                    q(u[t], g),
                    q(u[t], f),
                    u[t].classList.add(v),
                    q(u[e], g),
                    q(u[e], v),
                    u[e].classList.add(f),
                    h(),
                    n[e].zero(),
                    setTimeout(function () {
                      t !== p.current && n[t].negative();
                    }, 220));
                }));
            })(e),
            (function (e) {
              var t = e.core,
                i = t.classFacade,
                n = t.slideSwipingDown,
                r = e.elements.sources,
                a = e.slideSwipingProps,
                s = e.stageIndexes;
              n.listener = function (e) {
                ((a.isSwiping = !0),
                  (a.downClientX = Z(e)),
                  (a.swipedX = 0),
                  "VIDEO" === e.target.tagName ||
                    e.touches ||
                    e.preventDefault());
                var t = r[s.current];
                (t && t.contains(e.target)
                  ? (a.isSourceDownEventTarget = !0)
                  : (a.isSourceDownEventTarget = !1),
                  i.removeFromEachElementClassIfContains(K, c));
              };
            })(e),
            (function (e) {
              var t = e.collections.sourcesRenderFunctions,
                i = e.core.sourceDisplayFacade,
                n = e.stageIndexes;
              i.displayStageSourcesIfNotYet = function () {
                for (var e in n) t[n[e]] && (t[n[e]](), delete t[n[e]]);
              };
            })(e),
            (function (e) {
              var t = e.stageIndexes,
                i = e.core.stageManager,
                n = e.props.sources.length - 1;
              ((i.getPreviousSlideIndex = function () {
                return 0 === t.current ? n : t.current - 1;
              }),
                (i.getNextSlideIndex = function () {
                  return t.current === n ? 0 : t.current + 1;
                }),
                (i.updateStageIndexes =
                  0 === n
                    ? function () {}
                    : 1 === n
                      ? function () {
                          0 === t.current
                            ? ((t.next = 1), delete t.previous)
                            : ((t.previous = 0), delete t.next);
                        }
                      : function () {
                          ((t.previous = i.getPreviousSlideIndex()),
                            (t.next = i.getNextSlideIndex()));
                        }),
                (i.isSourceInStage =
                  n <= 2
                    ? function () {
                        return !0;
                      }
                    : function (e) {
                        var i = t.current;
                        if ((0 === i && e === n) || (i === n && 0 === e))
                          return !0;
                        var r = i - e;
                        return -1 === r || 0 === r || 1 === r;
                      }));
            })(e),
            (function (e) {
              var t = e.collections,
                i = t.sourcesOutersTransformers,
                n = t.sourcesStylers,
                r = e.core.windowResizeActioner,
                a = e.componentsServices,
                s = e.data,
                o = e.elements.sourcesOuters,
                l = e.props,
                d = e.stageIndexes;
              r.runActions = function () {
                (innerWidth < 992
                  ? (s.maxSourceWidth = innerWidth)
                  : (s.maxSourceWidth = 0.9 * innerWidth),
                  (s.maxSourceHeight = 0.9 * innerHeight),
                  s.isFullscreenOpen &&
                    screen.height !== innerHeight &&
                    a.exitFullscreen());
                for (var e = 0; e < l.sources.length; e++)
                  (q(o[e], c),
                    e !== d.current && i[e].negative(),
                    n[e] && n[e].styleSize());
              };
            })(e));
        }
        function ae(e) {
          var t = e.core.eventsDispatcher,
            i = e.data,
            n = e.elements,
            a = e.props.sources;
          ((i.isInitialized = !0),
            (function (e) {
              for (
                var t = e.collections.sourcesOutersTransformers,
                  i = e.props.sources,
                  n = e.resolve,
                  r = 0;
                r < i.length;
                r++
              )
                t[r] = n(W, [r]);
            })(e),
            re(e),
            (n.container = document.createElement("div")),
            (n.container.className = ""
              .concat(r, "container ")
              .concat(o, " ")
              .concat(g)),
            (function (e) {
              var t = e.elements;
              ((t.slideSwipingHoverer = document.createElement("div")),
                (t.slideSwipingHoverer.className = ""
                  .concat(r, "slide-swiping-hoverer ")
                  .concat(o, " ")
                  .concat(u)));
            })(e),
            G(e),
            (function (e) {
              var t = e.core.slideSwipingDown,
                i = e.elements,
                n = e.props.sources;
              ((i.sourcesOutersWrapper = document.createElement("div")),
                (i.sourcesOutersWrapper.className = ""
                  .concat(u, " ")
                  .concat(o)),
                i.container.appendChild(i.sourcesOutersWrapper),
                i.sourcesOutersWrapper.addEventListener(
                  "mousedown",
                  t.listener,
                ),
                i.sourcesOutersWrapper.addEventListener(
                  "touchstart",
                  t.listener,
                  { passive: !0 },
                ));
              for (var r = 0; r < n.length; r++) X(e, r);
            })(e),
            a.length > 1 &&
              (function (e) {
                var t = e.core.slideChangeFacade;
                (j(
                  e,
                  t.changeToPrevious,
                  "previous",
                  "M18.271,9.212H3.615l4.184-4.184c0.306-0.306,0.306-0.801,0-1.107c-0.306-0.306-0.801-0.306-1.107,0L1.21,9.403C1.194,9.417,1.174,9.421,1.158,9.437c-0.181,0.181-0.242,0.425-0.209,0.66c0.005,0.038,0.012,0.071,0.022,0.109c0.028,0.098,0.075,0.188,0.142,0.271c0.021,0.026,0.021,0.061,0.045,0.085c0.015,0.016,0.034,0.02,0.05,0.033l5.484,5.483c0.306,0.307,0.801,0.307,1.107,0c0.306-0.305,0.306-0.801,0-1.105l-4.184-4.185h14.656c0.436,0,0.788-0.353,0.788-0.788S18.707,9.212,18.271,9.212z",
                ),
                  j(
                    e,
                    t.changeToNext,
                    "next",
                    "M1.729,9.212h14.656l-4.184-4.184c-0.307-0.306-0.307-0.801,0-1.107c0.305-0.306,0.801-0.306,1.106,0l5.481,5.482c0.018,0.014,0.037,0.019,0.053,0.034c0.181,0.181,0.242,0.425,0.209,0.66c-0.004,0.038-0.012,0.071-0.021,0.109c-0.028,0.098-0.075,0.188-0.143,0.271c-0.021,0.026-0.021,0.061-0.045,0.085c-0.015,0.016-0.034,0.02-0.051,0.033l-5.483,5.483c-0.306,0.307-0.802,0.307-1.106,0c-0.307-0.305-0.307-0.801,0-1.105l4.184-4.185H1.729c-0.436,0-0.788-0.353-0.788-0.788S1.293,9.212,1.729,9.212z",
                  ));
              })(e),
            (function (e) {
              for (
                var t = e.props.sources,
                  i = e.resolve,
                  n = i(C),
                  r = i(H),
                  a = i(B, [n, r]),
                  s = 0;
                s < t.length;
                s++
              )
                if ("string" == typeof t[s]) {
                  var o = a.getTypeSetByClientForIndex(s);
                  if (o) r.runActionsForSourceTypeAndIndex(o, s);
                  else {
                    var l = n.getSourceTypeFromLocalStorageByUrl(t[s]);
                    l
                      ? r.runActionsForSourceTypeAndIndex(l, s)
                      : a.retrieveTypeWithXhrForIndex(s);
                  }
                } else r.runActionsForSourceTypeAndIndex(z, s);
            })(e),
            t.dispatch("onInit"));
        }
        function se(e) {
          var t = e.collections.sourcesOutersTransformers,
            i = e.componentsServices,
            n = e.core,
            r = n.eventsDispatcher,
            a = n.lightboxOpener,
            s = n.globalEventsController,
            o = n.scrollbarRecompensor,
            l = n.sourceDisplayFacade,
            c = n.stageManager,
            u = n.windowResizeActioner,
            p = e.data,
            h = e.elements,
            f = e.stageIndexes;
          a.open = function () {
            var n =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : 0;
            ((f.current = n),
              p.isInitialized ? r.dispatch("onShow") : ae(e),
              c.updateStageIndexes(),
              l.displayStageSourcesIfNotYet(),
              i.setSlideNumber(f.current + 1),
              document.body.appendChild(h.container),
              document.documentElement.classList.add(d),
              o.addRecompense(),
              s.attachListeners(),
              r.dispatch("onOpen"),
              t[f.current].zero(),
              u.runActions());
          };
        }
        function oe() {
          var e = localStorage.getItem(E);
          if (e) return e;
          var t = (function () {
              var e = document.createElement("div"),
                t = e.style;
              return (
                (t.visibility = "hidden"),
                (t.width = "100px"),
                (t.msOverflowStyle = "scrollbar"),
                (t.overflow = "scroll"),
                e
              );
            })(),
            i = (function () {
              var e = document.createElement("div");
              return ((e.style.width = "100%"), e);
            })();
          document.body.appendChild(t);
          var n = t.offsetWidth;
          t.appendChild(i);
          var r = i.offsetWidth;
          document.body.removeChild(t);
          var a = n - r;
          return (localStorage.setItem(E, a.toString()), a);
        }
        function le(e, t, i) {
          return (le = (function () {
            if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
            if (Reflect.construct.sham) return !1;
            if ("function" == typeof Proxy) return !0;
            try {
              return (
                Date.prototype.toString.call(
                  Reflect.construct(Date, [], function () {}),
                ),
                !0
              );
            } catch (e) {
              return !1;
            }
          })()
            ? Reflect.construct
            : function (e, t, i) {
                var n = [null];
                n.push.apply(n, t);
                var r = new (Function.bind.apply(e, n))();
                return (i && de(r, i.prototype), r);
              }).apply(null, arguments);
        }
        function de(e, t) {
          return (de =
            Object.setPrototypeOf ||
            function (e, t) {
              return ((e.__proto__ = t), e);
            })(e, t);
        }
        function ce() {
          for (
            var e = document.getElementsByTagName("a"),
              t = function (t) {
                if (!e[t].hasAttribute("data-fslightbox")) return "continue";
                var i = e[t].getAttribute("data-fslightbox"),
                  n = e[t].getAttribute("href");
                fsLightboxInstances[i] ||
                  ((fsLightboxInstances[i] = new FsLightbox()),
                  fsLightboxInstances[i].setup());
                var r;
                ((r =
                  "#" === n.charAt(0)
                    ? document.getElementById(n.substring(1))
                    : n),
                  fsLightboxInstances[i].props.sources.push(r),
                  fsLightboxInstances[i].elements.a.push(e[t]));
                var a = fsLightboxInstances[i].props.sources.length - 1;
                function s(n, r) {
                  e[t].hasAttribute(r) &&
                    (fsLightboxInstances[i].props[n][a] = e[t].getAttribute(r));
                }
                ((e[t].onclick = function (e) {
                  (e.preventDefault(), fsLightboxInstances[i].open(a));
                }),
                  s("types", "data-type"),
                  s("videosPosters", "data-video-poster"),
                  s("customClasses", "data-custom-class"));
              },
              i = 0;
            i < e.length;
            i++
          )
            t(i);
          var n = Object.keys(fsLightboxInstances);
          window.fsLightbox = fsLightboxInstances[n[n.length - 1]];
        }
        ((window.FsLightbox = function () {
          var e = this;
          ((this.props = {
            sources: [],
            customClasses: [],
            types: [],
            videosPosters: [],
            maxYoutubeDimensions: null,
            slideDistance: 0.3,
          }),
            (this.data = {
              isInitialized: !1,
              maxSourceWidth: 0,
              maxSourceHeight: 0,
              scrollbarWidth: oe(),
              isFullscreenOpen: !1,
            }),
            (this.slideSwipingProps = {
              isSwiping: !1,
              downClientX: null,
              isSourceDownEventTarget: !1,
              swipedX: 0,
            }),
            (this.stageIndexes = {}),
            (this.elements = {
              a: [],
              container: null,
              slideSwipingHoverer: null,
              sourcesOutersWrapper: null,
              sources: [],
              sourcesOuters: [],
              sourcesInners: [],
            }),
            (this.componentsServices = {
              setSlideNumber: function () {},
              enterFullscreen: null,
              exitFullscreen: null,
            }),
            (this.resolve = function (t) {
              var i =
                arguments.length > 1 && void 0 !== arguments[1]
                  ? arguments[1]
                  : [];
              return (
                i.unshift(e),
                le(
                  t,
                  (function (e) {
                    return (
                      (function (e) {
                        if (Array.isArray(e)) {
                          for (
                            var t = 0, i = new Array(e.length);
                            t < e.length;
                            t++
                          )
                            i[t] = e[t];
                          return i;
                        }
                      })(e) ||
                      (function (e) {
                        if (
                          Symbol.iterator in Object(e) ||
                          "[object Arguments]" ===
                            Object.prototype.toString.call(e)
                        )
                          return Array.from(e);
                      })(e) ||
                      (function () {
                        throw new TypeError(
                          "Invalid attempt to spread non-iterable instance",
                        );
                      })()
                    );
                  })(i),
                )
              );
            }),
            (this.collections = {
              sourcesOutersTransformers: [],
              sourcesLoadsHandlers: [],
              sourcesRenderFunctions: [],
              sourcesStylers: [],
            }),
            (this.core = {
              classFacade: {},
              eventsDispatcher: {},
              fullscreenToggler: {},
              globalEventsController: {},
              lightboxCloser: {},
              lightboxOpener: {},
              lightboxUpdater: {},
              scrollbarRecompensor: {},
              slideChangeFacade: {},
              slideIndexChanger: {},
              slideSwipingDown: {},
              sourceDisplayFacade: {},
              stageManager: {},
              windowResizeActioner: {},
            }),
            (this.setup = function () {
              se(e);
            }),
            (this.open = function (t) {
              return e.core.lightboxOpener.open(t);
            }),
            (this.close = function () {
              return e.core.lightboxCloser.close();
            }));
        }),
          (window.fsLightboxInstances = {}),
          (window.refreshFsLightbox = function () {
            for (var e in fsLightboxInstances) {
              var t = fsLightboxInstances[e].props;
              ((fsLightboxInstances[e] = new FsLightbox()),
                (fsLightboxInstances[e].props = t),
                (fsLightboxInstances[e].props.sources = []),
                (fsLightboxInstances[e].elements.a = []),
                fsLightboxInstances[e].setup());
            }
            ce();
          }),
          ce());
      },
    ]);
  }),
  (function (e, t) {
    "object" == typeof exports && "undefined" != typeof module
      ? t(exports)
      : "function" == typeof define && define.amd
        ? define(["exports"], t)
        : t(((e = e || self).window = e.window || {}));
  })(this, function (e) {
    "use strict";
    function t(e) {
      return "string" == typeof e;
    }
    var i = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,
      n = /(?:(-)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/gi,
      r = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/gi,
      a = /(^[#\.][a-z]|[a-y][a-z])/i,
      s = Math.PI / 180,
      o = Math.sin,
      l = Math.cos,
      d = Math.abs,
      c = Math.sqrt,
      u = function (e) {
        return "number" == typeof e;
      },
      p = function (e) {
        return Math.round(1e5 * e) / 1e5 || 0;
      };
    function h(e) {
      var t,
        i = 0;
      for (e.reverse(); i < e.length; i += 2)
        ((t = e[i]), (e[i] = e[i + 1]), (e[i + 1] = t));
      e.reversed = !e.reversed;
    }
    var f = {
      rect: "rx,ry,x,y,width,height",
      circle: "r,cx,cy",
      ellipse: "rx,ry,cx,cy",
      line: "x1,x2,y1,y2",
    };
    function v(e, t) {
      var i,
        r,
        a,
        s,
        o,
        l,
        d,
        c,
        u,
        p,
        h,
        v,
        g,
        x,
        y,
        w,
        S,
        T,
        E,
        C,
        M,
        P,
        k = e.tagName.toLowerCase(),
        z = 0.552284749831;
      return "path" !== k && e.getBBox
        ? ((l = (function (e, t) {
            var i,
              n = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path",
              ),
              r = [].slice.call(e.attributes),
              a = r.length;
            for (t = "," + t + ","; -1 < --a;)
              ((i = r[a].nodeName.toLowerCase()),
                t.indexOf("," + i + ",") < 0 &&
                  n.setAttributeNS(null, i, r[a].nodeValue));
            return n;
          })(e, "x,y,width,height,cx,cy,rx,ry,r,x1,x2,y1,y2,points")),
          (P = (function (e, t) {
            for (var i = t ? t.split(",") : [], n = {}, r = i.length; -1 < --r;)
              n[i[r]] = +e.getAttribute(i[r]) || 0;
            return n;
          })(e, f[k])),
          "rect" === k
            ? ((s = P.rx),
              (o = P.ry || s),
              (r = P.x),
              (a = P.y),
              (p = P.width - 2 * s),
              (h = P.height - 2 * o),
              (i =
                s || o
                  ? "M" +
                    (w = (x = (g = r + s) + p) + s) +
                    "," +
                    (T = a + o) +
                    " V" +
                    (E = T + h) +
                    " C" +
                    [
                      w,
                      (C = E + o * z),
                      (y = x + s * z),
                      (M = E + o),
                      x,
                      M,
                      x - (x - g) / 3,
                      M,
                      g + (x - g) / 3,
                      M,
                      g,
                      M,
                      (v = r + s * (1 - z)),
                      M,
                      r,
                      C,
                      r,
                      E,
                      r,
                      E - (E - T) / 3,
                      r,
                      T + (E - T) / 3,
                      r,
                      T,
                      r,
                      (S = a + o * (1 - z)),
                      v,
                      a,
                      g,
                      a,
                      g + (x - g) / 3,
                      a,
                      x - (x - g) / 3,
                      a,
                      x,
                      a,
                      y,
                      a,
                      w,
                      S,
                      w,
                      T,
                    ].join(",") +
                    "z"
                  : "M" +
                    (r + p) +
                    "," +
                    a +
                    " v" +
                    h +
                    " h" +
                    -p +
                    " v" +
                    -h +
                    " h" +
                    p +
                    "z"))
            : "circle" === k || "ellipse" === k
              ? ((c =
                  "circle" === k
                    ? (s = o = P.r) * z
                    : ((s = P.rx), (o = P.ry) * z)),
                (i =
                  "M" +
                  ((r = P.cx) + s) +
                  "," +
                  (a = P.cy) +
                  " C" +
                  [
                    r + s,
                    a + c,
                    r + (d = s * z),
                    a + o,
                    r,
                    a + o,
                    r - d,
                    a + o,
                    r - s,
                    a + c,
                    r - s,
                    a,
                    r - s,
                    a - c,
                    r - d,
                    a - o,
                    r,
                    a - o,
                    r + d,
                    a - o,
                    r + s,
                    a - c,
                    r + s,
                    a,
                  ].join(",") +
                  "z"))
              : "line" === k
                ? (i = "M" + P.x1 + "," + P.y1 + " L" + P.x2 + "," + P.y2)
                : ("polyline" !== k && "polygon" !== k) ||
                  ((i =
                    "M" +
                    (r = (u =
                      (e.getAttribute("points") + "").match(n) || []).shift()) +
                    "," +
                    (a = u.shift()) +
                    " L" +
                    u.join(",")),
                  "polygon" === k && (i += "," + r + "," + a + "z")),
          l.setAttribute("d", b((l._gsRawPath = m(i)))),
          t &&
            e.parentNode &&
            (e.parentNode.insertBefore(l, e), e.parentNode.removeChild(e)),
          l)
        : e;
    }
    function g(e, t, i, n, r, a, u, p, h) {
      if (e !== p || t !== h) {
        ((i = d(i)), (n = d(n)));
        var f = (r % 360) * s,
          v = l(f),
          g = o(f),
          m = Math.PI,
          b = 2 * m,
          x = (e - p) / 2,
          y = (t - h) / 2,
          w = v * x + g * y,
          S = -g * x + v * y,
          T = w * w,
          E = S * S,
          C = T / (i * i) + E / (n * n);
        1 < C && ((i = c(C) * i), (n = c(C) * n));
        var M = i * i,
          P = n * n,
          k = (M * P - M * E - P * T) / (M * E + P * T);
        k < 0 && (k = 0);
        var z = (a === u ? -1 : 1) * c(k),
          L = ((i * S) / n) * z,
          I = ((-n * w) / i) * z,
          A = v * L - g * I + (e + p) / 2,
          O = g * L + v * I + (t + h) / 2,
          _ = (w - L) / i,
          D = (S - I) / n,
          N = (-w - L) / i,
          $ = (-S - I) / n,
          F = _ * _ + D * D,
          H = (D < 0 ? -1 : 1) * Math.acos(_ / c(F)),
          R =
            (_ * $ - D * N < 0 ? -1 : 1) *
            Math.acos((_ * N + D * $) / c(F * (N * N + $ * $)));
        (isNaN(R) && (R = m),
          !u && 0 < R ? (R -= b) : u && R < 0 && (R += b),
          (H %= b),
          (R %= b));
        var B,
          X = Math.ceil(d(R) / (b / 4)),
          Y = [],
          V = R / X,
          G = ((4 / 3) * o(V / 2)) / (1 + l(V / 2)),
          W = v * i,
          j = g * i,
          q = g * -n,
          U = v * n;
        for (B = 0; B < X; B++)
          ((w = l((r = H + B * V))),
            (S = o(r)),
            (_ = l((r += V))),
            (D = o(r)),
            Y.push(w - G * S, S + G * w, _ + G * D, D - G * _, _, D));
        for (B = 0; B < Y.length; B += 2)
          ((w = Y[B]),
            (S = Y[B + 1]),
            (Y[B] = w * W + S * q + A),
            (Y[B + 1] = w * j + S * U + O));
        return ((Y[B - 2] = p), (Y[B - 1] = h), Y);
      }
    }
    function m(e) {
      function t(e, t, i, n) {
        ((f = (i - e) / 3),
          (v = (n - t) / 3),
          u.push(e + f, t + v, i - f, n - v, i, n));
      }
      var n,
        a,
        s,
        o,
        l,
        c,
        u,
        p,
        h,
        f,
        v,
        m,
        b,
        x,
        y,
        w =
          (e + "")
            .replace(r, function (e) {
              var t = +e;
              return t < 1e-4 && -1e-4 < t ? 0 : t;
            })
            .match(i) || [],
        S = [],
        T = 0,
        E = 0,
        C = w.length,
        M = 0,
        P = "ERROR: malformed path: " + e;
      if (!e || !isNaN(w[0]) || isNaN(w[1])) return (console.log(P), S);
      for (n = 0; n < C; n++)
        if (
          ((b = l),
          isNaN(w[n]) ? (c = (l = w[n].toUpperCase()) !== w[n]) : n--,
          (s = +w[n + 1]),
          (o = +w[n + 2]),
          c && ((s += T), (o += E)),
          n || ((p = s), (h = o)),
          "M" === l)
        )
          (u && (u.length < 8 ? --S.length : (M += u.length)),
            (T = p = s),
            (E = h = o),
            (u = [s, o]),
            S.push(u),
            (n += 2),
            (l = "L"));
        else if ("C" === l)
          (c || (T = E = 0),
            (u = u || [0, 0]).push(
              s,
              o,
              T + 1 * w[n + 3],
              E + 1 * w[n + 4],
              (T += 1 * w[n + 5]),
              (E += 1 * w[n + 6]),
            ),
            (n += 6));
        else if ("S" === l)
          ((f = T),
            (v = E),
            ("C" !== b && "S" !== b) ||
              ((f += T - u[u.length - 4]), (v += E - u[u.length - 3])),
            c || (T = E = 0),
            u.push(f, v, s, o, (T += 1 * w[n + 3]), (E += 1 * w[n + 4])),
            (n += 4));
        else if ("Q" === l)
          ((f = T + (2 / 3) * (s - T)),
            (v = E + (2 / 3) * (o - E)),
            c || (T = E = 0),
            (T += 1 * w[n + 3]),
            (E += 1 * w[n + 4]),
            u.push(f, v, T + (2 / 3) * (s - T), E + (2 / 3) * (o - E), T, E),
            (n += 4));
        else if ("T" === l)
          ((f = T - u[u.length - 4]),
            (v = E - u[u.length - 3]),
            u.push(
              T + f,
              E + v,
              s + (2 / 3) * (T + 1.5 * f - s),
              o + (2 / 3) * (E + 1.5 * v - o),
              (T = s),
              (E = o),
            ),
            (n += 2));
        else if ("H" === l) (t(T, E, (T = s), E), (n += 1));
        else if ("V" === l) (t(T, E, T, (E = s + (c ? E - T : 0))), (n += 1));
        else if ("L" === l || "Z" === l)
          ("Z" === l && ((s = p), (o = h), (u.closed = !0)),
            ("L" === l || 0.5 < d(T - s) || 0.5 < d(E - o)) &&
              (t(T, E, s, o), "L" === l && (n += 2)),
            (T = s),
            (E = o));
        else if ("A" === l) {
          if (
            ((x = w[n + 4]),
            (y = w[n + 5]),
            (f = w[n + 6]),
            (v = w[n + 7]),
            (a = 7),
            1 < x.length &&
              (x.length < 3
                ? ((v = f), (f = y), a--)
                : ((v = y), (f = x.substr(2)), (a -= 2)),
              (y = x.charAt(1)),
              (x = x.charAt(0))),
            (m = g(
              T,
              E,
              +w[n + 1],
              +w[n + 2],
              +w[n + 3],
              +x,
              +y,
              (c ? T : 0) + 1 * f,
              (c ? E : 0) + 1 * v,
            )),
            (n += a),
            m)
          )
            for (a = 0; a < m.length; a++) u.push(m[a]);
          ((T = u[u.length - 2]), (E = u[u.length - 1]));
        } else console.log(P);
      return (
        (n = u.length) < 6
          ? (S.pop(), (n = 0))
          : u[0] === u[n - 2] && u[1] === u[n - 1] && (u.closed = !0),
        (S.totalPoints = M + n),
        S
      );
    }
    function b(e) {
      u(e[0]) && (e = [e]);
      var t,
        i,
        n,
        r,
        a = "",
        s = e.length;
      for (i = 0; i < s; i++) {
        for (
          r = e[i],
            a += "M" + p(r[0]) + "," + p(r[1]) + " C",
            t = r.length,
            n = 2;
          n < t;
          n++
        )
          a +=
            p(r[n++]) +
            "," +
            p(r[n++]) +
            " " +
            p(r[n++]) +
            "," +
            p(r[n++]) +
            " " +
            p(r[n++]) +
            "," +
            p(r[n]) +
            " ";
        r.closed && (a += "z");
      }
      return a;
    }
    function x() {
      return (
        B ||
        ("undefined" != typeof window &&
          (B = window.gsap) &&
          B.registerPlugin &&
          B)
      );
    }
    function y(e) {
      return "function" == typeof e;
    }
    function w(e) {
      return console && console.warn(e);
    }
    function S(e) {
      var t,
        i = e.length,
        n = 0,
        r = 0;
      for (t = 0; t < i; t++) ((n += e[t++]), (r += e[t]));
      return [n / (i / 2), r / (i / 2)];
    }
    function T(e) {
      var t,
        i,
        n,
        r = e.length,
        a = e[0],
        s = a,
        o = e[1],
        l = o;
      for (n = 6; n < r; n += 6)
        (a < (t = e[n]) ? (a = t) : t < s && (s = t),
          o < (i = e[n + 1]) ? (o = i) : i < l && (l = i));
      return (
        (e.centerX = (a + s) / 2),
        (e.centerY = (o + l) / 2),
        (e.size = (a - s) * (o - l))
      );
    }
    function E(e, t) {
      void 0 === t && (t = 3);
      for (
        var i,
          n,
          r,
          a,
          s,
          o,
          l,
          d,
          c,
          u,
          p,
          h,
          f,
          v,
          g,
          m,
          b = e.length,
          x = e[0][0],
          y = x,
          w = e[0][1],
          S = w,
          T = 1 / t;
        -1 < --b;
      )
        for (i = (s = e[b]).length, a = 6; a < i; a += 6)
          for (
            c = s[a],
              u = s[a + 1],
              p = s[a + 2] - c,
              v = s[a + 3] - u,
              h = s[a + 4] - c,
              g = s[a + 5] - u,
              f = s[a + 6] - c,
              m = s[a + 7] - u,
              o = t;
            -1 < --o;
          )
            (x <
            (n =
              ((l = T * o) * l * f + 3 * (d = 1 - l) * (l * h + d * p)) * l + c)
              ? (x = n)
              : n < y && (y = n),
              w < (r = (l * l * m + 3 * d * (l * g + d * v)) * l + u)
                ? (w = r)
                : r < S && (S = r));
      return (
        (e.centerX = (x + y) / 2),
        (e.centerY = (w + S) / 2),
        (e.left = y),
        (e.width = x - y),
        (e.top = S),
        (e.height = w - S),
        (e.size = (x - y) * (w - S))
      );
    }
    function C(e, t) {
      return t.length - e.length;
    }
    function M(e, t) {
      var i = e.size || T(e),
        n = t.size || T(t);
      return Math.abs(n - i) < (i + n) / 20
        ? t.centerX - e.centerX || t.centerY - e.centerY
        : n - i;
    }
    function P(e, t) {
      var i,
        n,
        r = e.slice(0),
        a = e.length,
        s = a - 2;
      for (t |= 0, i = 0; i < a; i++)
        ((n = (i + t) % s), (e[i++] = r[n]), (e[i] = r[1 + n]));
    }
    function k(e, t, i, n, r) {
      var a,
        s,
        o,
        l,
        d = e.length,
        c = 0,
        u = d - 2;
      for (i *= 6, s = 0; s < d; s += 6)
        ((l = e[(a = (s + i) % u)] - (t[s] - n)),
          (o = e[1 + a] - (t[s + 1] - r)),
          (c += U(o * o + l * l)));
      return c;
    }
    function z(e, t, i) {
      var n,
        r,
        a,
        s = e.length,
        o = S(e),
        l = S(t),
        d = l[0] - o[0],
        c = l[1] - o[1],
        u = k(e, t, 0, d, c),
        p = 0;
      for (a = 6; a < s; a += 6)
        (r = k(e, t, a / 6, d, c)) < u && ((u = r), (p = a));
      if (i)
        for (h((n = e.slice(0))), a = 6; a < s; a += 6)
          (r = k(n, t, a / 6, d, c)) < u && ((u = r), (p = -a));
      return p / 6;
    }
    function L(e, t, i) {
      for (
        var n, r, a, s, o, l, d = e.length, c = 1e20, u = 0, p = 0;
        -1 < --d;
      )
        for (l = (n = e[d]).length, o = 0; o < l; o += 6)
          ((r = n[o] - t),
            (a = n[o + 1] - i),
            (s = U(r * r + a * a)) < c &&
              ((c = s), (u = n[o]), (p = n[o + 1])));
      return [u, p];
    }
    function I(e, t, i, n, r, a) {
      var s,
        o,
        l,
        d,
        c = t.length,
        u = 0,
        p = Math.min(e.size || T(e), t[i].size || T(t[i])) * n,
        h = 1e20,
        f = e.centerX + r,
        v = e.centerY + a;
      for (s = i; s < c && !((t[s].size || T(t[s])) < p); s++)
        ((o = t[s].centerX - f),
          (l = t[s].centerY - v),
          (d = U(o * o + l * l)) < h && ((u = s), (h = d)));
      return ((d = t[u]), t.splice(u, 1), d);
    }
    function A(e, t) {
      var i,
        n,
        r,
        a,
        s,
        o,
        l,
        d,
        c,
        u,
        p,
        h,
        f,
        v,
        g = 0,
        m = e.length,
        b = t / ((m - 2) / 6);
      for (f = 2; f < m; f += 6)
        for (g += b; 0.999999 < g;)
          ((i = e[f - 2]),
            (n = e[f - 1]),
            (r = e[f]),
            (a = e[f + 1]),
            (s = e[f + 2]),
            (o = e[f + 3]),
            (l = e[f + 4]),
            (d = e[f + 5]),
            (c = i + (r - i) * (v = 1 / ((Math.floor(g) || 1) + 1))),
            (c += ((p = r + (s - r) * v) - c) * v),
            (p += (s + (l - s) * v - p) * v),
            (u = n + (a - n) * v),
            (u += ((h = a + (o - a) * v) - u) * v),
            (h += (o + (d - o) * v - h) * v),
            e.splice(
              f,
              4,
              i + (r - i) * v,
              n + (a - n) * v,
              c,
              u,
              c + (p - c) * v,
              u + (h - u) * v,
              p,
              h,
              s + (l - s) * v,
              o + (d - o) * v,
            ),
            (f += 6),
            (m += 6),
            g--);
      return e;
    }
    function O(e, t, i, n, r) {
      var a,
        s,
        o,
        l,
        d,
        c,
        u,
        p = t.length - e.length,
        f = 0 < p ? t : e,
        v = 0 < p ? e : t,
        g = 0,
        m = "complexity" === n ? C : M,
        b = "position" === n ? 0 : "number" == typeof n ? n : 0.8,
        x = v.length,
        y = "object" == typeof i && i.push ? i.slice(0) : [i],
        S = "reverse" === y[0] || y[0] < 0,
        k = "log" === i;
      if (v[0]) {
        if (
          1 < f.length &&
          (e.sort(m),
          t.sort(m),
          f.size || E(f),
          v.size || E(v),
          (c = f.centerX - v.centerX),
          (u = f.centerY - v.centerY),
          m === M)
        )
          for (x = 0; x < v.length; x++) f.splice(x, 0, I(v[x], f, x, b, c, u));
        if (p)
          for (
            p < 0 && (p = -p),
              f[0].length > v[0].length &&
                A(v[0], ((f[0].length - v[0].length) / 6) | 0),
              x = v.length;
            g < p;
          )
            (f[x].size || T(f[x]),
              (l = (o = L(v, f[x].centerX, f[x].centerY))[0]),
              (d = o[1]),
              (v[x++] = [l, d, l, d, l, d, l, d]),
              (v.totalPoints += 8),
              g++);
        for (x = 0; x < e.length; x++)
          ((a = t[x]),
            (s = e[x]),
            (p = a.length - s.length) < 0
              ? A(a, (-p / 6) | 0)
              : 0 < p && A(s, (p / 6) | 0),
            S && !1 !== r && !s.reversed && h(s),
            (i = y[x] || 0 === y[x] ? y[x] : "auto") &&
              (s.closed ||
              (Math.abs(s[0] - s[s.length - 2]) < 0.5 &&
                Math.abs(s[1] - s[s.length - 1]) < 0.5)
                ? "auto" === i || "log" === i
                  ? ((y[x] = i = z(s, a, !x || !1 === r)),
                    i < 0 && ((S = !0), h(s), (i = -i)),
                    P(s, 6 * i))
                  : "reverse" !== i &&
                    (x && i < 0 && h(s), P(s, 6 * (i < 0 ? -i : i)))
                : !S &&
                    (("auto" === i &&
                      Math.abs(a[0] - s[0]) +
                        Math.abs(a[1] - s[1]) +
                        Math.abs(a[a.length - 2] - s[s.length - 2]) +
                        Math.abs(a[a.length - 1] - s[s.length - 1]) >
                        Math.abs(a[0] - s[s.length - 2]) +
                          Math.abs(a[1] - s[s.length - 1]) +
                          Math.abs(a[a.length - 2] - s[0]) +
                          Math.abs(a[a.length - 1] - s[1])) ||
                      i % 2)
                  ? (h(s), (y[x] = -1), (S = !0))
                  : "auto" === i
                    ? (y[x] = 0)
                    : "reverse" === i && (y[x] = -1),
              s.closed !== a.closed && (s.closed = a.closed = !1)));
        return (k && w("shapeIndex:[" + y.join(",") + "]"), (e.shapeIndex = y));
      }
    }
    function _(e, t, i, n, r) {
      var a = m(e[0]),
        s = m(e[1]);
      O(a, s, t || 0 === t ? t : "auto", i, r) &&
        ((e[0] = b(a)),
        (e[1] = b(s)),
        ("log" !== n && !0 !== n) ||
          w('precompile:["' + e[0] + '","' + e[1] + '"]'));
    }
    function D(e, t) {
      var i,
        n,
        r,
        a,
        s,
        o,
        l,
        d = 0,
        c = parseFloat(e[0]),
        u = parseFloat(e[1]),
        p = c + "," + u + " ";
      for (
        i = (0.5 * t) / (0.5 * (r = e.length) - 1), n = 0;
        n < r - 2;
        n += 2
      ) {
        if (
          ((d += i),
          (o = parseFloat(e[n + 2])),
          (l = parseFloat(e[n + 3])),
          0.999999 < d)
        )
          for (s = 1 / (Math.floor(d) + 1), a = 1; 0.999999 < d;)
            ((p +=
              (c + (o - c) * s * a).toFixed(2) +
              "," +
              (u + (l - u) * s * a).toFixed(2) +
              " "),
              d--,
              a++);
        ((p += o + "," + l + " "), (c = o), (u = l));
      }
      return p;
    }
    function N(e) {
      var t = e[0].match(ee) || [],
        i = e[1].match(ee) || [],
        n = i.length - t.length;
      0 < n ? (e[0] = D(t, n)) : (e[1] = D(i, -n));
    }
    function $(e, t) {
      for (
        var i,
          n,
          r,
          a,
          s,
          o,
          l,
          d,
          c,
          u,
          p,
          h,
          f = e.length,
          v = 0.2 * (t || 1);
        -1 < --f;
      ) {
        for (
          p = (n = e[f]).isSmooth = n.isSmooth || [0, 0, 0, 0],
            h = n.smoothData = n.smoothData || [0, 0, 0, 0],
            p.length = 4,
            d = n.length - 2,
            l = 6;
          l < d;
          l += 6
        )
          ((r = n[l] - n[l - 2]),
            (a = n[l + 1] - n[l - 1]),
            (s = n[l + 2] - n[l]),
            (o = n[l + 3] - n[l + 1]),
            (c = W(a, r)),
            (u = W(o, s)),
            (i = Math.abs(c - u) < v) &&
              ((h[l - 2] = c),
              (h[l + 2] = u),
              (h[l - 1] = U(r * r + a * a)),
              (h[l + 3] = U(s * s + o * o))),
            p.push(i, i, 0, 0, i, i));
        n[d] === n[0] &&
          n[1 + d] === n[1] &&
          ((r = n[0] - n[d - 2]),
          (a = n[1] - n[d - 1]),
          (s = n[2] - n[0]),
          (o = n[3] - n[1]),
          (c = W(a, r)),
          (u = W(o, s)),
          Math.abs(c - u) < v &&
            ((h[d - 2] = c),
            (h[2] = u),
            (h[d - 1] = U(r * r + a * a)),
            (h[3] = U(s * s + o * o)),
            (p[d - 2] = p[d - 1] = !0)));
      }
      return e;
    }
    function F(e) {
      var t = e.trim().split(" ");
      return {
        x:
          (~e.indexOf("left")
            ? 0
            : ~e.indexOf("right")
              ? 100
              : isNaN(parseFloat(t[0]))
                ? 50
                : parseFloat(t[0])) / 100,
        y:
          (~e.indexOf("top")
            ? 0
            : ~e.indexOf("bottom")
              ? 100
              : isNaN(parseFloat(t[1]))
                ? 50
                : parseFloat(t[1])) / 100,
      };
    }
    function H(e, t, i, n) {
      var r,
        a,
        s = this._origin,
        o = this._eOrigin,
        l = e[i] - s.x,
        d = e[i + 1] - s.y,
        c = U(l * l + d * d),
        u = W(d, l);
      return (
        (l = t[i] - o.x),
        (d = t[i + 1] - o.y),
        (a = (function (e) {
          return e !== e % K ? e + (e < 0 ? Z : -Z) : e;
        })((r = W(d, l) - u))),
        !n && Y && Math.abs(a + Y.ca) < Q && (n = Y),
        (this._anchorPT = Y =
          {
            _next: this._anchorPT,
            t: e,
            sa: u,
            ca: n && a * n.ca < 0 && Math.abs(a) > J ? r : a,
            sl: c,
            cl: U(l * l + d * d) - c,
            i: i,
          })
      );
    }
    function R(e) {
      ((B = x()),
        (G = G || (B && B.plugins.morphSVG)),
        B && G
          ? ((X = B.utils.toArray), (G.prototype._tweenRotation = H), (V = 1))
          : e && w("Please gsap.registerPlugin(MorphSVGPlugin)"));
    }
    var B,
      X,
      Y,
      V,
      G,
      W = Math.atan2,
      j = Math.cos,
      q = Math.sin,
      U = Math.sqrt,
      K = Math.PI,
      Z = 2 * K,
      Q = 0.3 * K,
      J = 0.7 * K,
      ee = /[-+=\.]*\d+[\.e\-\+]*\d*[e\-\+]*\d*/gi,
      te = /(^[#\.][a-z]|[a-y][a-z])/i,
      ie = /[achlmqstvz]/i,
      ne =
        "Use MorphSVGPlugin.convertToPath() to convert to a path before morphing.",
      re = {
        version: "3.13.0",
        name: "morphSVG",
        rawVars: 1,
        register: function (e, t) {
          ((B = e), (G = t), R());
        },
        init: function (e, t, i, n, r) {
          if ((V || R(1), !t)) return (w("invalid shape"), !1);
          var a, s, o, l, d, c, u, p, h, f, g, x, S, T, C, M, P, k, z, L, I, A;
          if (
            (y(t) && (t = t.call(i, n, e, r)),
            "string" == typeof t || t.getBBox || t[0])
          )
            t = { shape: t };
          else if ("object" == typeof t) {
            for (s in ((a = {}), t))
              a[s] = y(t[s]) && "render" !== s ? t[s].call(i, n, e, r) : t[s];
            t = a;
          }
          var _ = e.nodeType ? window.getComputedStyle(e) : {},
            D = _.fill + "",
            H = !(
              "none" === D ||
              "0" === (D.match(ee) || [])[3] ||
              "evenodd" === _.fillRule
            ),
            B = (t.origin || "50 50").split(",");
          if (
            ((d =
              "POLYLINE" === (a = (e.nodeName + "").toUpperCase()) ||
              "POLYGON" === a),
            "PATH" !== a && !d && !t.prop)
          )
            return (w("Cannot morph a <" + a + "> element. " + ne), !1);
          if (
            ((s = "PATH" === a ? "d" : "points"), !t.prop && !y(e.setAttribute))
          )
            return !1;
          if (
            ((l = (function (e, t, i) {
              var n, r;
              return (
                (!("string" == typeof e) ||
                  te.test(e) ||
                  (e.match(ee) || []).length < 3) &&
                  ((n = X(e)[0])
                    ? ((r = (n.nodeName + "").toUpperCase()),
                      t && "PATH" !== r && ((n = v(n, !1)), (r = "PATH")),
                      (e = n.getAttribute("PATH" === r ? "d" : "points") || ""),
                      n === i &&
                        (e = n.getAttributeNS(null, "data-original") || e))
                    : (w("WARNING: invalid morph to: " + e), (e = !1))),
                e
              );
            })(t.shape || t.d || t.points || "", "d" === s, e)),
            d && ie.test(l))
          )
            return (w("A <" + a + "> cannot accept path data. " + ne), !1);
          if (
            ((c = t.shapeIndex || 0 === t.shapeIndex ? t.shapeIndex : "auto"),
            (u = t.map || re.defaultMap),
            (this._prop = t.prop),
            (this._render = t.render || re.defaultRender),
            (this._apply =
              "updateTarget" in t ? t.updateTarget : re.defaultUpdateTarget),
            (this._rnd = Math.pow(10, isNaN(t.precision) ? 2 : +t.precision)),
            (this._tween = i),
            l)
          ) {
            if (
              ((this._target = e),
              (P = "object" == typeof t.precompile),
              (f = this._prop ? e[this._prop] : e.getAttribute(s)),
              this._prop ||
                e.getAttributeNS(null, "data-original") ||
                e.setAttributeNS(null, "data-original", f),
              "d" === s || this._prop)
            ) {
              if (
                ((f = m(P ? t.precompile[0] : f)),
                (g = m(P ? t.precompile[1] : l)),
                !P && !O(f, g, c, u, H))
              )
                return !1;
              for (
                ("log" !== t.precompile && !0 !== t.precompile) ||
                  w('precompile:["' + b(f) + '","' + b(g) + '"]'),
                  (I = "linear" !== (t.type || re.defaultType)) &&
                    ((f = $(f, t.smoothTolerance)),
                    (g = $(g, t.smoothTolerance)),
                    f.size || E(f),
                    g.size || E(g),
                    (L = F(B[0])),
                    (this._origin = f.origin =
                      { x: f.left + L.x * f.width, y: f.top + L.y * f.height }),
                    B[1] && (L = F(B[1])),
                    (this._eOrigin = {
                      x: g.left + L.x * g.width,
                      y: g.top + L.y * g.height,
                    })),
                  this._rawPath = e._gsRawPath = f,
                  S = f.length;
                -1 < --S;
              )
                for (
                  C = f[S],
                    M = g[S],
                    p = C.isSmooth || [],
                    h = M.isSmooth || [],
                    T = C.length,
                    x = Y = 0;
                  x < T;
                  x += 2
                )
                  (M[x] === C[x] && M[x + 1] === C[x + 1]) ||
                    (I
                      ? p[x] && h[x]
                        ? ((k = C.smoothData),
                          (z = M.smoothData),
                          (A = x + (x === T - 4 ? 7 - T : 5)),
                          (this._controlPT = {
                            _next: this._controlPT,
                            i: x,
                            j: S,
                            l1s: k[x + 1],
                            l1c: z[x + 1] - k[x + 1],
                            l2s: k[A],
                            l2c: z[A] - k[A],
                          }),
                          (o = this._tweenRotation(C, M, x + 2)),
                          this._tweenRotation(C, M, x, o),
                          this._tweenRotation(C, M, A - 1, o),
                          (x += 4))
                        : this._tweenRotation(C, M, x)
                      : ((o = this.add(C, x, C[x], M[x], 0, 0, 0, 0, 0, 1)),
                        (o =
                          this.add(
                            C,
                            x + 1,
                            C[x + 1],
                            M[x + 1],
                            0,
                            0,
                            0,
                            0,
                            0,
                            1,
                          ) || o)));
            } else
              o = this.add(
                e,
                "setAttribute",
                e.getAttribute(s) + "",
                l + "",
                n,
                r,
                0,
                (function (e) {
                  return isNaN(e)
                    ? N
                    : function (t) {
                        (N(t),
                          (t[1] = (function (e, t) {
                            if (!t) return e;
                            var i,
                              n,
                              r,
                              a = e.match(ee) || [],
                              s = a.length,
                              o = "";
                            for (
                              i =
                                "reverse" === t
                                  ? ((n = s - 1), -2)
                                  : ((n =
                                      (2 * (parseInt(t, 10) || 0) +
                                        1 +
                                        100 * s) %
                                      s),
                                    2),
                                r = 0;
                              r < s;
                              r += 2
                            )
                              ((o += a[n - 1] + "," + a[n] + " "),
                                (n = (n + i) % s));
                            return o;
                          })(t[1], parseInt(e, 10))));
                      };
                })(c),
                s,
              );
            (I &&
              (this.add(
                this._origin,
                "x",
                this._origin.x,
                this._eOrigin.x,
                0,
                0,
                0,
                0,
                0,
                1,
              ),
              (o = this.add(
                this._origin,
                "y",
                this._origin.y,
                this._eOrigin.y,
                0,
                0,
                0,
                0,
                0,
                1,
              ))),
              o &&
                (this._props.push("morphSVG"), (o.end = l), (o.endProp = s)));
          }
          return 1;
        },
        render: function (e, t) {
          for (
            var i,
              n,
              r,
              a,
              s,
              o,
              l,
              d,
              c,
              u,
              p,
              h,
              f = t._rawPath,
              v = t._controlPT,
              g = t._anchorPT,
              m = t._rnd,
              b = t._target,
              x = t._pt;
            x;
          )
            (x.r(e, x.d), (x = x._next));
          if (1 === e && t._apply)
            for (x = t._pt; x;)
              (x.end &&
                (t._prop
                  ? (b[t._prop] = x.end)
                  : b.setAttribute(x.endProp, x.end)),
                (x = x._next));
          else if (f) {
            for (; g;)
              ((s = g.sa + e * g.ca),
                (a = g.sl + e * g.cl),
                (g.t[g.i] = t._origin.x + j(s) * a),
                (g.t[g.i + 1] = t._origin.y + q(s) * a),
                (g = g._next));
            for (n = e < 0.5 ? 2 * e * e : (4 - 2 * e) * e - 1; v;)
              ((h =
                (o = v.i) + (o === (r = f[v.j]).length - 4 ? 7 - r.length : 5)),
                (s = W(r[h] - r[o + 1], r[h - 1] - r[o])),
                (u = q(s)),
                (p = j(s)),
                (d = r[o + 2]),
                (c = r[o + 3]),
                (a = v.l1s + n * v.l1c),
                (r[o] = d - p * a),
                (r[o + 1] = c - u * a),
                (a = v.l2s + n * v.l2c),
                (r[h - 1] = d + p * a),
                (r[h] = c + u * a),
                (v = v._next));
            if (((b._gsRawPath = f), t._apply)) {
              for (i = "", l = 0; l < f.length; l++)
                for (
                  a = (r = f[l]).length,
                    i +=
                      "M" +
                      ((r[0] * m) | 0) / m +
                      " " +
                      ((r[1] * m) | 0) / m +
                      " C",
                    o = 2;
                  o < a;
                  o++
                )
                  i += ((r[o] * m) | 0) / m + " ";
              t._prop ? (b[t._prop] = i) : b.setAttribute("d", i);
            }
          }
          t._render && f && t._render.call(t._tween, f, b);
        },
        kill: function () {
          this._pt = this._rawPath = 0;
        },
        getRawPath: function (e) {
          var i,
            n = (e = (t(e) && a.test(e) && document.querySelector(e)) || e)
              .getAttribute
              ? e
              : 0;
          return n && (e = e.getAttribute("d"))
            ? (n._gsPath || (n._gsPath = {}),
              (i = n._gsPath[e]) && !i._dirty ? i : (n._gsPath[e] = m(e)))
            : e
              ? t(e)
                ? m(e)
                : u(e[0])
                  ? [e]
                  : e
              : console.warn(
                  "Expecting a <path> element or an SVG path data string",
                );
        },
        stringToRawPath: m,
        rawPathToString: b,
        normalizeStrings: function (e, t, i) {
          var n = [e, t];
          return (_(n, i.shapeIndex, i.map), n);
        },
        pathFilter: _,
        pointsFilter: N,
        getTotalSize: E,
        equalizeSegmentQuantity: O,
        convertToPath: function (e, t) {
          return X(e).map(function (e) {
            return v(e, !1 !== t);
          });
        },
        defaultType: "linear",
        defaultUpdateTarget: !0,
        defaultMap: "size",
      };
    (x() && B.registerPlugin(re),
      (e.MorphSVGPlugin = re),
      (e.default = re),
      "undefined" == typeof window || window !== e
        ? Object.defineProperty(e, "__esModule", { value: !0 })
        : delete e.default);
  }),
  (function (e, t) {
    "object" == typeof exports && "undefined" != typeof module
      ? t(exports)
      : "function" == typeof define && define.amd
        ? define(["exports"], t)
        : t(((e = e || self).window = e.window || {}));
  })(this, function (e) {
    "use strict";
    function t(e, t) {
      for (var i = 0; i < t.length; i++) {
        var n = t[i];
        ((n.enumerable = n.enumerable || !1),
          (n.configurable = !0),
          "value" in n && (n.writable = !0),
          Object.defineProperty(e, n.key, n));
      }
    }
    function i() {
      return "undefined" != typeof window;
    }
    function n() {
      return a || (i() && (a = window.gsap) && a.registerPlugin && a);
    }
    function r(e) {
      return h.maxScroll(e || o);
    }
    var a,
      s,
      o,
      l,
      d,
      c,
      u,
      p,
      h,
      f,
      v,
      g,
      m,
      b,
      x,
      y =
        ((w.register = function (e) {
          return (
            s ||
              ((a = e || n()),
              i() &&
                window.document &&
                ((o = window),
                (l = document),
                (d = l.documentElement),
                (c = l.body)),
              a &&
                ((u = a.utils.toArray),
                (p = a.utils.clamp),
                (v = a.parseEase("expo")),
                (b = a.core.context || function () {}),
                (h = a.core.globals().ScrollTrigger),
                a.core.globals("ScrollSmoother", w),
                c &&
                  h &&
                  ((x = a
                    .delayedCall(0.2, function () {
                      return h.isRefreshing || (f && f.refresh());
                    })
                    .pause()),
                  (g = h.core._getVelocityProp),
                  (m = h.core._inputObserver),
                  (w.refresh = h.refresh),
                  (s = 1)))),
            s
          );
        }),
        (function (e, i, n) {
          (i && t(e.prototype, i), n && t(e, n));
        })(w, [
          {
            key: "progress",
            get: function () {
              return this.scrollTrigger
                ? this.scrollTrigger.animation._time / 100
                : 0;
            },
          },
        ]),
        w);
    function w(e) {
      var t = this;
      function i() {
        return ce.update(-oe);
      }
      function n() {
        return (O.style.overflow = "visible");
      }
      function y(e) {
        e.update();
        var t = e.getTween();
        (t && (t.pause(), (t._time = t._dur), (t._tTime = t._tDur)),
          (j = !1),
          e.animation.progress(e.progress, !0));
      }
      function S(e, t) {
        ((e !== oe && !X) || t) &&
          (te && (e = Math.round(e)),
          ae &&
            ((O.style.transform =
              "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " +
              e +
              ", 0, 1)"),
            (O._gsap.y = e + "px")),
          (le = e - oe),
          (oe = e),
          h.isUpdating || w.isRefreshing || h.update());
      }
      function T(e) {
        return arguments.length
          ? (e < 0 && (e = 0),
            (ue.y = -e),
            (j = !0),
            X ? (oe = -e) : S(-e),
            h.isRefreshing ? N.update() : re(e / se),
            this)
          : -oe;
      }
      function E(e) {
        ((_.scrollTop = 0),
          (e.target.contains && e.target.contains(_)) ||
            (J && !1 === J(t, e)) ||
            (h.isInViewport(e.target) ||
              e.target === q ||
              t.scrollTo(e.target, !1, "center center"),
            (q = e.target)));
      }
      function C(e, t) {
        if (e < t.start) return e;
        var i = isNaN(t.ratio) ? 1 : t.ratio,
          n = t.end - t.start,
          a = e - t.start,
          s = t.offset || 0,
          o = t.pins || [],
          l = o.offset || 0,
          d =
            (t._startClamp && t.start <= 0) || (t.pins && t.pins.offset)
              ? 0
              : t._endClamp && t.end === r()
                ? 1
                : 0.5;
        return (
          o.forEach(function (t) {
            ((n -= t.distance), t.nativeStart <= e && (a -= t.distance));
          }),
          l && (a *= (n - l / i) / n),
          e + (a - s * d) / i - a
        );
      }
      function M(e, t) {
        $.forEach(function (i) {
          return (function e(t, i, n) {
            n || (t.pins.length = t.pins.offset = 0);
            var r,
              s,
              o,
              l,
              d,
              c,
              u,
              p,
              h = t.pins,
              f = t.markers;
            for (u = 0; u < i.length; u++)
              if (
                ((p = i[u]),
                t.trigger &&
                  p.trigger &&
                  t !== p &&
                  (p.trigger === t.trigger ||
                    p.pinnedContainer === t.trigger ||
                    t.trigger.contains(p.trigger)) &&
                  ((d = p._startNative || p._startClamp || p.start),
                  (c = p._endNative || p._endClamp || p.end),
                  (o = C(d, t)),
                  (l = p.pin && 0 < c ? o + (c - d) : C(c, t)),
                  p.setPositions(
                    o,
                    l,
                    !0,
                    (p._startClamp ? Math.max(0, o) : o) - d,
                  ),
                  p.markerStart &&
                    f.push(
                      a.quickSetter([p.markerStart, p.markerEnd], "y", "px"),
                    ),
                  p.pin && 0 < p.end && !n))
              ) {
                if (
                  ((r = p.end - p.start), (s = t._startClamp && p.start < 0))
                ) {
                  if (0 < t.start)
                    return (
                      t.setPositions(0, t.end + (t._startNative - t.start), !0),
                      void e(t, i)
                    );
                  ((r += p.start), (h.offset = -p.start));
                }
                (h.push({
                  start: p.start,
                  nativeStart: d,
                  end: p.end,
                  distance: r,
                  trig: p,
                }),
                  t.setPositions(t.start, t.end + (s ? -p.start : r), !0));
              }
          })(i, e, t);
        });
      }
      function P() {
        ((d = l.documentElement),
          (c = l.body),
          n(),
          requestAnimationFrame(n),
          $ &&
            (h.getAll().forEach(function (e) {
              ((e._startNative = e.start), (e._endNative = e.end));
            }),
            $.forEach(function (e) {
              var t = e._startClamp || e.start,
                i = e.autoSpeed
                  ? Math.min(r(), e.end)
                  : t + Math.abs((e.end - t) / e.ratio),
                n = i - e.end;
              if ((i -= n / 2) < (t -= n / 2)) {
                var a = t;
                ((t = i), (i = a));
              }
              (e._startClamp && t < 0
                ? ((n = (i = e.ratio < 0 ? r() : e.end / e.ratio) - e.end),
                  (t = 0))
                : (e.ratio < 0 || (e._endClamp && i >= r())) &&
                  (n =
                    ((i = r()) -
                      (t =
                        e.ratio < 0 || 1 < e.ratio
                          ? 0
                          : i - (i - e.start) / e.ratio)) *
                      e.ratio -
                    (e.end - e.start)),
                (e.offset = n || 1e-4),
                (e.pins.length = e.pins.offset = 0),
                e.setPositions(t, i, !0));
            }),
            M(h.sort())),
          ce.reset());
      }
      function k() {
        return h.addEventListener("refresh", P);
      }
      function z() {
        return (
          $ &&
          $.forEach(function (e) {
            return e.vars.onRefresh(e);
          })
        );
      }
      function L() {
        return (
          $ &&
            $.forEach(function (e) {
              return e.vars.onRefreshInit(e);
            }),
          z
        );
      }
      function I(e, t, i, n) {
        return function () {
          var r = "function" == typeof t ? t(i, n) : t;
          (r ||
            0 === r ||
            (r = n.getAttribute("data-" + ne + e) || ("speed" === e ? 1 : 0)),
            n.setAttribute("data-" + ne + e, r));
          var a = "clamp(" === (r + "").substr(0, 6);
          return { clamp: a, value: a ? r.substr(6, r.length - 7) : r };
        };
      }
      function A(e, t, i, n, s) {
        function l() {
          ((t = w()),
            (i = parseFloat(S().value)),
            (f = parseFloat(t.value) || 1),
            (m = "auto" === t.value),
            (x =
              m || (g && g._startClamp && g.start <= 0) || C.offset
                ? 0
                : g && g._endClamp && g.end === r()
                  ? 1
                  : 0.5),
            b && b.kill(),
            (b =
              i && a.to(e, { ease: v, overwrite: !1, y: "+=0", duration: i })),
            g && ((g.ratio = f), (g.autoSpeed = m)));
        }
        function c() {
          ((E.y = T + "px"), E.renderTransform(1), l());
        }
        function u(t) {
          if (m) {
            c();
            var i = (function (e, t) {
              var i,
                n,
                r = e.parentNode || d,
                a = e.getBoundingClientRect(),
                s = r.getBoundingClientRect(),
                l = s.top - a.top,
                c = s.bottom - a.bottom,
                u = (Math.abs(l) > Math.abs(c) ? l : c) / (1 - t),
                p = -u * t;
              return (
                0 < u &&
                  ((n =
                    0.5 == (i = s.height / (o.innerHeight + s.height))
                      ? 2 * s.height
                      : 2 *
                        Math.min(s.height, Math.abs((-u * i) / (2 * i - 1))) *
                        (t || 1)),
                  (p += t ? -n * t : -n / 2),
                  (u += n)),
                { change: u, offset: p }
              );
            })(e, p(0, 1, -t.start / (t.end - t.start)));
            ((P = i.change), (y = i.offset));
          } else ((y = C.offset || 0), (P = (t.end - t.start - y) * (1 - f)));
          (C.forEach(function (e) {
            return (P -= e.distance * (1 - f));
          }),
            (t.offset = P || 0.001),
            t.vars.onUpdate(t),
            b && b.progress(1));
        }
        s = ("function" == typeof s ? s(n, e) : s) || 0;
        var f,
          g,
          m,
          b,
          x,
          y,
          w = I("speed", t, n, e),
          S = I("lag", i, n, e),
          T = a.getProperty(e, "y"),
          E = e._gsap,
          C = [],
          M = [],
          P = 0;
        return (
          l(),
          (1 !== f || m || b) &&
            (u(
              (g = h.create({
                trigger: m ? e.parentNode : e,
                start: function () {
                  return t.clamp
                    ? "clamp(top bottom+=" + s + ")"
                    : "top bottom+=" + s;
                },
                end: function () {
                  return t.value < 0
                    ? "max"
                    : t.clamp
                      ? "clamp(bottom top-=" + s + ")"
                      : "bottom top-=" + s;
                },
                scroller: _,
                scrub: !0,
                refreshPriority: -999,
                onRefreshInit: c,
                onRefresh: u,
                onKill: function (e) {
                  var t = $.indexOf(e);
                  (0 <= t && $.splice(t, 1), c());
                },
                onUpdate: function (e) {
                  var t,
                    i,
                    n,
                    r = T + P * (e.progress - x),
                    s = C.length,
                    o = 0;
                  if (e.offset) {
                    if (s) {
                      for (i = -oe, n = e.end; s--;) {
                        if (
                          (t = C[s]).trig.isActive ||
                          (i >= t.start && i <= t.end)
                        )
                          return void (
                            b &&
                            ((t.trig.progress +=
                              t.trig.direction < 0 ? 0.001 : -0.001),
                            t.trig.update(0, 0, 1),
                            b.resetTo("y", parseFloat(E.y), -le, !0),
                            de && b.progress(1))
                          );
                        (i > t.end && (o += t.distance), (n -= t.distance));
                      }
                      r =
                        T +
                        o +
                        P *
                          ((a.utils.clamp(e.start, e.end, i) - e.start - o) /
                            (n - e.start) -
                            x);
                    }
                    (M.length &&
                      !m &&
                      M.forEach(function (e) {
                        return e(r - o);
                      }),
                      (r = (function (e) {
                        return Math.round(1e5 * e) / 1e5 || 0;
                      })(r + y)),
                      b
                        ? (b.resetTo("y", r, -le, !0), de && b.progress(1))
                        : ((E.y = r + "px"), E.renderTransform(1)));
                  }
                },
              })),
            ),
            (a.core.getCache(g.trigger).stRevert = L),
            (g.startY = T),
            (g.pins = C),
            (g.markers = M),
            (g.ratio = f),
            (g.autoSpeed = m),
            (e.style.willChange = "transform")),
          g
        );
      }
      (s ||
        w.register(a) ||
        console.warn("Please gsap.registerPlugin(ScrollSmoother)"),
        (e = this.vars = e || {}),
        f && f.kill(),
        b((f = this)));
      var O,
        _,
        D,
        N,
        $,
        F,
        H,
        R,
        B,
        X,
        Y,
        V,
        G,
        W,
        j,
        q,
        U = e.smoothTouch,
        K = e.onUpdate,
        Z = e.onStop,
        Q = e.smooth,
        J = e.onFocusIn,
        ee = e.normalizeScroll,
        te = e.wholePixels,
        ie = this,
        ne = e.effectsPrefix || "",
        re = h.getScrollFunc(o),
        ae =
          1 === h.isTouch
            ? !0 === U
              ? 0.8
              : parseFloat(U) || 0
            : 0 === Q || !1 === Q
              ? 0
              : parseFloat(Q) || 0.8,
        se = (ae && +e.speed) || 1,
        oe = 0,
        le = 0,
        de = 1,
        ce = g(0),
        ue = { y: 0 },
        pe =
          "undefined" != typeof ResizeObserver &&
          !1 !== e.autoResize &&
          new ResizeObserver(function () {
            if (!h.isRefreshing) {
              var e = r(_) * se;
              (e < -oe && T(e), x.restart(!0));
            }
          });
      function he() {
        return (
          (D = O.clientHeight),
          (O.style.overflow = "visible"),
          (c.style.height = o.innerHeight + (D - o.innerHeight) / se + "px"),
          D - o.innerHeight
        );
      }
      (k(),
        h.addEventListener("killAll", k),
        a.delayedCall(0.5, function () {
          return (de = 0);
        }),
        (this.scrollTop = T),
        (this.scrollTo = function (e, i, n) {
          var s = a.utils.clamp(
            0,
            r(),
            isNaN(e) ? t.offset(e, n, !!i && !X) : +e,
          );
          i
            ? X
              ? a.to(t, {
                  duration: ae,
                  scrollTop: s,
                  overwrite: "auto",
                  ease: v,
                })
              : re(s)
            : T(s);
        }),
        (this.offset = function (e, t, i) {
          var n,
            r = (e = u(e)[0]).style.cssText,
            s = h.create({ trigger: e, start: t || "top top" });
          return (
            $ && (de ? h.refresh() : M([s], !0)),
            (n = s.start / (i ? se : 1)),
            s.kill(!1),
            (e.style.cssText = r),
            (a.core.getCache(e).uncache = 1),
            n
          );
        }),
        (this.content = function (e) {
          if (arguments.length) {
            var t =
              u(e || "#smooth-content")[0] ||
              console.warn("ScrollSmoother needs a valid content element.") ||
              c.children[0];
            return (
              t !== O &&
                ((B = (O = t).getAttribute("style") || ""),
                pe && pe.observe(O),
                a.set(O, {
                  overflow: "visible",
                  width: "100%",
                  boxSizing: "border-box",
                  y: "+=0",
                }),
                ae || a.set(O, { clearProps: "transform" })),
              this
            );
          }
          return O;
        }),
        (this.wrapper = function (e) {
          return arguments.length
            ? ((_ =
                u(e || "#smooth-wrapper")[0] ||
                (function (e) {
                  var t = l.querySelector(".ScrollSmoother-wrapper");
                  return (
                    t ||
                      ((t = l.createElement("div")).classList.add(
                        "ScrollSmoother-wrapper",
                      ),
                      e.parentNode.insertBefore(t, e),
                      t.appendChild(e)),
                    t
                  );
                })(O)),
              (R = _.getAttribute("style") || ""),
              he(),
              a.set(
                _,
                ae
                  ? {
                      overflow: "hidden",
                      position: "fixed",
                      height: "100%",
                      width: "100%",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }
                  : {
                      overflow: "visible",
                      position: "relative",
                      width: "100%",
                      height: "auto",
                      top: "auto",
                      bottom: "auto",
                      left: "auto",
                      right: "auto",
                    },
              ),
              this)
            : _;
        }),
        (this.effects = function (e, t) {
          if ((($ = $ || []), !e)) return $.slice(0);
          (e = u(e)).forEach(function (e) {
            for (var t = $.length; t--;) $[t].trigger === e && $[t].kill();
          });
          var i,
            n,
            r = (t = t || {}).speed,
            a = t.lag,
            s = t.effectsPadding,
            o = [];
          for (i = 0; i < e.length; i++) (n = A(e[i], r, a, i, s)) && o.push(n);
          return ($.push.apply($, o), !1 !== t.refresh && h.refresh(), o);
        }),
        (this.sections = function (e, t) {
          if (((F = F || []), !e)) return F.slice(0);
          var i = u(e).map(function (e) {
            return h.create({
              trigger: e,
              start: "top 120%",
              end: "bottom -20%",
              onToggle: function (t) {
                ((e.style.opacity = t.isActive ? "1" : "0"),
                  (e.style.pointerEvents = t.isActive ? "all" : "none"));
              },
            });
          });
          return (t && t.add ? F.push.apply(F, i) : (F = i.slice(0)), i);
        }),
        this.content(e.content),
        this.wrapper(e.wrapper),
        (this.render = function (e) {
          return S(e || 0 === e ? e : oe);
        }),
        (this.getVelocity = function () {
          return ce.getVelocity(-oe);
        }),
        h.scrollerProxy(_, {
          scrollTop: T,
          scrollHeight: function () {
            return he() && c.scrollHeight;
          },
          fixedMarkers: !1 !== e.fixedMarkers && !!ae,
          content: O,
          getBoundingClientRect: function () {
            return {
              top: 0,
              left: 0,
              width: o.innerWidth,
              height: o.innerHeight,
            };
          },
        }),
        h.defaults({ scroller: _ }));
      var fe = h.getAll().filter(function (e) {
        return e.scroller === o || e.scroller === _;
      });
      (fe.forEach(function (e) {
        return e.revert(!0, !0);
      }),
        (N = h.create({
          animation: a.fromTo(
            ue,
            {
              y: function () {
                return (W = 0);
              },
            },
            {
              y: function () {
                return ((W = 1), -he());
              },
              immediateRender: !1,
              ease: "none",
              data: "ScrollSmoother",
              duration: 100,
              onUpdate: function () {
                if (W) {
                  var e = j;
                  (e && (y(N), (ue.y = oe)), S(ue.y, e), i(), K && !X && K(ie));
                }
              },
            },
          ),
          onRefreshInit: function (e) {
            if (!w.isRefreshing) {
              if (((w.isRefreshing = !0), $)) {
                var t = h.getAll().filter(function (e) {
                  return !!e.pin;
                });
                $.forEach(function (e) {
                  e.vars.pinnedContainer ||
                    t.forEach(function (t) {
                      if (t.pin.contains(e.trigger)) {
                        var i = e.vars;
                        ((i.pinnedContainer = t.pin),
                          (e.vars = null),
                          e.init(i, e.animation));
                      }
                    });
                });
              }
              var i = e.getTween();
              ((G = i && i._end > i._dp._time),
                (V = oe),
                (ue.y = 0),
                ae &&
                  (1 === h.isTouch && (_.style.position = "absolute"),
                  (_.scrollTop = 0),
                  1 === h.isTouch && (_.style.position = "fixed")));
            }
          },
          onRefresh: function (e) {
            (e.animation.invalidate(),
              e.setPositions(e.start, he() / se),
              G || y(e),
              (ue.y = -re() * se),
              S(ue.y),
              de ||
                (G && (j = !1),
                e.animation.progress(a.utils.clamp(0, 1, V / se / -e.end))),
              G && ((e.progress -= 0.001), e.update()),
              (w.isRefreshing = !1));
          },
          id: "ScrollSmoother",
          scroller: o,
          invalidateOnRefresh: !0,
          start: 0,
          refreshPriority: -9999,
          end: function () {
            return he() / se;
          },
          onScrubComplete: function () {
            (ce.reset(), Z && Z(t));
          },
          scrub: ae || !0,
        })),
        (this.smooth = function (t) {
          return (
            arguments.length &&
              ((se = ((ae = t || 0) && +e.speed) || 1), N.scrubDuration(t)),
            N.getTween() ? N.getTween().duration() : 0
          );
        }),
        N.getTween() && (N.getTween().vars.ease = e.ease || v),
        (this.scrollTrigger = N),
        e.effects &&
          this.effects(
            !0 === e.effects
              ? "[data-" + ne + "speed], [data-" + ne + "lag]"
              : e.effects,
            { effectsPadding: e.effectsPadding, refresh: !1 },
          ),
        e.sections &&
          this.sections(!0 === e.sections ? "[data-section]" : e.sections),
        fe.forEach(function (e) {
          ((e.vars.scroller = _),
            e.revert(!1, !0),
            e.init(e.vars, e.animation));
        }),
        (this.paused = function (e, t) {
          return arguments.length
            ? (!!X !== e &&
                (e
                  ? (N.getTween() && N.getTween().pause(),
                    re(-oe / se),
                    ce.reset(),
                    (Y = h.normalizeScroll()) && Y.disable(),
                    ((X = h.observe({
                      preventDefault: !0,
                      type: "wheel,touch,scroll",
                      debounce: !1,
                      allowClicks: !0,
                      onChangeY: function () {
                        return T(-oe);
                      },
                    })).nested = m(d, "wheel,touch,scroll", !0, !1 !== t)))
                  : (X.nested.kill(),
                    X.kill(),
                    (X = 0),
                    Y && Y.enable(),
                    (N.progress = (-oe / se - N.start) / (N.end - N.start)),
                    y(N))),
              this)
            : !!X;
        }),
        (this.kill = this.revert =
          function () {
            (t.paused(!1), y(N), N.kill());
            for (var e = ($ || []).concat(F || []), i = e.length; i--;)
              e[i].kill();
            (h.scrollerProxy(_),
              h.removeEventListener("killAll", k),
              h.removeEventListener("refresh", P),
              (_.style.cssText = R),
              (O.style.cssText = B));
            var n = h.defaults({});
            (n && n.scroller === _ && h.defaults({ scroller: o }),
              t.normalizer && h.normalizeScroll(!1),
              clearInterval(H),
              (f = null),
              pe && pe.disconnect(),
              c.style.removeProperty("height"),
              o.removeEventListener("focusin", E));
          }),
        (this.refresh = function (e, t) {
          return N.refresh(e, t);
        }),
        ee &&
          (this.normalizer = h.normalizeScroll(
            !0 === ee ? { debounce: !0, content: !ae && O } : ee,
          )),
        h.config(e),
        "scrollBehavior" in o.getComputedStyle(c) &&
          a.set([c, d], { scrollBehavior: "auto" }),
        o.addEventListener("focusin", E),
        (H = setInterval(i, 250)),
        "loading" === l.readyState ||
          requestAnimationFrame(function () {
            return h.refresh();
          }));
    }
    ((y.version = "3.13.0"),
      (y.create = function (e) {
        return f && e && f.content() === u(e.content)[0] ? f : new y(e);
      }),
      (y.get = function () {
        return f;
      }),
      n() && a.registerPlugin(y),
      (e.ScrollSmoother = y),
      (e.default = y),
      "undefined" == typeof window || window !== e
        ? Object.defineProperty(e, "__esModule", { value: !0 })
        : delete e.default);
  }),
  (function (e, t) {
    "object" == typeof exports && "undefined" != typeof module
      ? t(exports)
      : "function" == typeof define && define.amd
        ? define(["exports"], t)
        : t(((e = e || self).window = e.window || {}));
  })(this, function (e) {
    "use strict";
    function t(e, t) {
      for (var i = 0; i < t.length; i++) {
        var n = t[i];
        ((n.enumerable = n.enumerable || !1),
          (n.configurable = !0),
          "value" in n && (n.writable = !0),
          Object.defineProperty(e, n.key, n));
      }
    }
    function i() {
      return (
        g ||
        ("undefined" != typeof window &&
          (g = window.gsap) &&
          g.registerPlugin &&
          g)
      );
    }
    function n(e, t) {
      return ~A.indexOf(e) && A[A.indexOf(e) + 1][t];
    }
    function r(e) {
      return !!~C.indexOf(e);
    }
    function a(e, t, i, n, r) {
      return e.addEventListener(t, i, { passive: !1 !== n, capture: !!r });
    }
    function s(e, t, i, n) {
      return e.removeEventListener(t, i, !!n);
    }
    function o() {
      return (M && M.isPressed) || I.cache++;
    }
    function l(e, t) {
      function i(n) {
        if (n || 0 === n) {
          z && (b.history.scrollRestoration = "manual");
          var r = M && M.isPressed;
          ((n = i.v = Math.round(n) || (M && M.iOS ? 1 : 0)),
            e(n),
            (i.cacheID = I.cache),
            r && _("ss", n));
        } else
          (t || I.cache !== i.cacheID || _("ref")) &&
            ((i.cacheID = I.cache), (i.v = e()));
        return i.v + i.offset;
      }
      return ((i.offset = 0), e && i);
    }
    function d(e, t) {
      return (
        ((t && t._ctx && t._ctx.selector) || g.utils.toArray)(e)[0] ||
        ("string" == typeof e && !1 !== g.config().nullTargetWarn
          ? console.warn("Element not found:", e)
          : null)
      );
    }
    function c(e, t) {
      var i = t.s,
        s = t.sc;
      r(e) && (e = x.scrollingElement || y);
      var d = I.indexOf(e),
        c = s === F.sc ? 1 : 2;
      (~d || (d = I.push(e) - 1), I[d + c] || a(e, "scroll", o));
      var u = I[d + c],
        p =
          u ||
          (I[d + c] =
            l(n(e, i), !0) ||
            (r(e)
              ? s
              : l(function (t) {
                  return arguments.length ? (e[i] = t) : e[i];
                })));
      return (
        (p.target = e),
        u || (p.smooth = "smooth" === g.getProperty(e, "scrollBehavior")),
        p
      );
    }
    function u(e, t, i) {
      function n(e, t) {
        var n = O();
        t || l < n - s
          ? ((a = r), (r = e), (o = s), (s = n))
          : i
            ? (r += e)
            : (r = a + ((e - a) / (n - o)) * (s - o));
      }
      var r = e,
        a = e,
        s = O(),
        o = s,
        l = t || 50,
        d = Math.max(500, 3 * l);
      return {
        update: n,
        reset: function () {
          ((a = r = i ? 0 : r), (o = s = 0));
        },
        getVelocity: function (e) {
          var t = o,
            l = a,
            c = O();
          return (
            (!e && 0 !== e) || e === r || n(e),
            s === o || d < c - o
              ? 0
              : ((r + (i ? l : -l)) / ((i ? c : s) - t)) * 1e3
          );
        },
      };
    }
    function p(e, t) {
      return (
        t && !e._gsapAllow && e.preventDefault(),
        e.changedTouches ? e.changedTouches[0] : e
      );
    }
    function h(e) {
      var t = Math.max.apply(Math, e),
        i = Math.min.apply(Math, e);
      return Math.abs(t) >= Math.abs(i) ? t : i;
    }
    function f() {
      (E = g.core.globals().ScrollTrigger) &&
        E.core &&
        (function () {
          var e = E.core,
            t = e.bridge || {},
            i = e._scrollers,
            n = e._proxies;
          (i.push.apply(i, I),
            n.push.apply(n, A),
            (I = i),
            (A = n),
            (_ = function (e, i) {
              return t[e](i);
            }));
        })();
    }
    function v(e) {
      return (
        (g = e || i()),
        !m &&
          g &&
          "undefined" != typeof document &&
          document.body &&
          ((b = window),
          (y = (x = document).documentElement),
          (w = x.body),
          (C = [b, x, y, w]),
          g.utils.clamp,
          (k = g.core.context || function () {}),
          (T = "onpointerenter" in w ? "pointer" : "mouse"),
          (S = H.isTouch =
            b.matchMedia &&
            b.matchMedia("(hover: none), (pointer: coarse)").matches
              ? 1
              : "ontouchstart" in b ||
                  0 < navigator.maxTouchPoints ||
                  0 < navigator.msMaxTouchPoints
                ? 2
                : 0),
          (P = H.eventTypes =
            (
              "ontouchstart" in y
                ? "touchstart,touchmove,touchcancel,touchend"
                : "onpointerdown" in y
                  ? "pointerdown,pointermove,pointercancel,pointerup"
                  : "mousedown,mousemove,mouseup,mouseup"
            ).split(",")),
          setTimeout(function () {
            return (z = 0);
          }, 500),
          f(),
          (m = 1)),
        m
      );
    }
    var g,
      m,
      b,
      x,
      y,
      w,
      S,
      T,
      E,
      C,
      M,
      P,
      k,
      z = 1,
      L = [],
      I = [],
      A = [],
      O = Date.now,
      _ = function (e, t) {
        return t;
      },
      D = "scrollLeft",
      N = "scrollTop",
      $ = {
        s: D,
        p: "left",
        p2: "Left",
        os: "right",
        os2: "Right",
        d: "width",
        d2: "Width",
        a: "x",
        sc: l(function (e) {
          return arguments.length
            ? b.scrollTo(e, F.sc())
            : b.pageXOffset || x[D] || y[D] || w[D] || 0;
        }),
      },
      F = {
        s: N,
        p: "top",
        p2: "Top",
        os: "bottom",
        os2: "Bottom",
        d: "height",
        d2: "Height",
        a: "y",
        op: $,
        sc: l(function (e) {
          return arguments.length
            ? b.scrollTo($.sc(), e)
            : b.pageYOffset || x[N] || y[N] || w[N] || 0;
        }),
      };
    (($.op = F), (I.cache = 0));
    var H =
      ((R.prototype.init = function (e) {
        (m || v(g) || console.warn("Please gsap.registerPlugin(Observer)"),
          E || f());
        var t = e.tolerance,
          i = e.dragMinimum,
          n = e.type,
          l = e.target,
          C = e.lineHeight,
          z = e.debounce,
          I = e.preventDefault,
          A = e.onStop,
          _ = e.onStopDelay,
          D = e.ignore,
          N = e.wheelSpeed,
          H = e.event,
          R = e.onDragStart,
          B = e.onDragEnd,
          X = e.onDrag,
          Y = e.onPress,
          V = e.onRelease,
          G = e.onRight,
          W = e.onLeft,
          j = e.onUp,
          q = e.onDown,
          U = e.onChangeX,
          K = e.onChangeY,
          Z = e.onChange,
          Q = e.onToggleX,
          J = e.onToggleY,
          ee = e.onHover,
          te = e.onHoverEnd,
          ie = e.onMove,
          ne = e.ignoreCheck,
          re = e.isNormalizer,
          ae = e.onGestureStart,
          se = e.onGestureEnd,
          oe = e.onWheel,
          le = e.onEnable,
          de = e.onDisable,
          ce = e.onClick,
          ue = e.scrollSpeed,
          pe = e.capture,
          he = e.allowClicks,
          fe = e.lockAxis,
          ve = e.onLockAxis;
        function ge() {
          return (Ke = O());
        }
        function me(e, t) {
          return (
            (($e.event = e) &&
              D &&
              (function (e, t) {
                for (var i = t.length; i--;)
                  if (t[i] === e || t[i].contains(e)) return !0;
                return !1;
              })(e.target, D)) ||
            (t && Ge && "touch" !== e.pointerType) ||
            (ne && ne(e, t))
          );
        }
        function be() {
          var e = ($e.deltaX = h(qe)),
            i = ($e.deltaY = h(Ue)),
            n = Math.abs(e) >= t,
            r = Math.abs(i) >= t;
          (Z && (n || r) && Z($e, e, i, qe, Ue),
            n &&
              (G && 0 < $e.deltaX && G($e),
              W && $e.deltaX < 0 && W($e),
              U && U($e),
              Q && $e.deltaX < 0 != Fe < 0 && Q($e),
              (Fe = $e.deltaX),
              (qe[0] = qe[1] = qe[2] = 0)),
            r &&
              (q && 0 < $e.deltaY && q($e),
              j && $e.deltaY < 0 && j($e),
              K && K($e),
              J && $e.deltaY < 0 != He < 0 && J($e),
              (He = $e.deltaY),
              (Ue[0] = Ue[1] = Ue[2] = 0)),
            (Oe || Ae) &&
              (ie && ie($e),
              Ae && (R && 1 === Ae && R($e), X && X($e), (Ae = 0)),
              (Oe = !1)),
            De && !(De = !1) && ve && ve($e),
            _e && (oe($e), (_e = !1)),
            (Le = 0));
        }
        function xe(e, t, i) {
          ((qe[i] += e),
            (Ue[i] += t),
            $e._vx.update(e),
            $e._vy.update(t),
            z ? (Le = Le || requestAnimationFrame(be)) : be());
        }
        function ye(e, t) {
          (fe &&
            !Ne &&
            (($e.axis = Ne = Math.abs(e) > Math.abs(t) ? "x" : "y"), (De = !0)),
            "y" !== Ne && ((qe[2] += e), $e._vx.update(e, !0)),
            "x" !== Ne && ((Ue[2] += t), $e._vy.update(t, !0)),
            z ? (Le = Le || requestAnimationFrame(be)) : be());
        }
        function we(e) {
          if (!me(e, 1)) {
            var t = (e = p(e, I)).clientX,
              n = e.clientY,
              r = t - $e.x,
              a = n - $e.y,
              s = $e.isDragging;
            (($e.x = t),
              ($e.y = n),
              (s ||
                ((r || a) &&
                  (Math.abs($e.startX - t) >= i ||
                    Math.abs($e.startY - n) >= i))) &&
                ((Ae = s ? 2 : 1), s || ($e.isDragging = !0), ye(r, a)));
          }
        }
        function Se(e) {
          return (
            e.touches &&
            1 < e.touches.length &&
            ($e.isGesturing = !0) &&
            ae(e, $e.isDragging)
          );
        }
        function Te() {
          return ($e.isGesturing = !1) || se($e);
        }
        function Ee(e) {
          if (!me(e)) {
            var t = Be(),
              i = Xe();
            (xe((t - Ye) * ue, (i - Ve) * ue, 1),
              (Ye = t),
              (Ve = i),
              A && Ie.restart(!0));
          }
        }
        function Ce(e) {
          if (!me(e)) {
            ((e = p(e, I)), oe && (_e = !0));
            var t =
              (1 === e.deltaMode ? C : 2 === e.deltaMode ? b.innerHeight : 1) *
              N;
            (xe(e.deltaX * t, e.deltaY * t, 0), A && !re && Ie.restart(!0));
          }
        }
        function Me(e) {
          if (!me(e)) {
            var t = e.clientX,
              i = e.clientY,
              n = t - $e.x,
              r = i - $e.y;
            (($e.x = t),
              ($e.y = i),
              (Oe = !0),
              A && Ie.restart(!0),
              (n || r) && ye(n, r));
          }
        }
        function Pe(e) {
          (($e.event = e), ee($e));
        }
        function ke(e) {
          (($e.event = e), te($e));
        }
        function ze(e) {
          return me(e) || (p(e, I) && ce($e));
        }
        ((this.target = l = d(l) || y),
          (this.vars = e),
          (D = D && g.utils.toArray(D)),
          (t = t || 1e-9),
          (i = i || 0),
          (N = N || 1),
          (ue = ue || 1),
          (n = n || "wheel,touch,pointer"),
          (z = !1 !== z),
          (C = C || parseFloat(b.getComputedStyle(w).lineHeight) || 22));
        var Le,
          Ie,
          Ae,
          Oe,
          _e,
          De,
          Ne,
          $e = this,
          Fe = 0,
          He = 0,
          Re = e.passive || (!I && !1 !== e.passive),
          Be = c(l, $),
          Xe = c(l, F),
          Ye = Be(),
          Ve = Xe(),
          Ge =
            ~n.indexOf("touch") &&
            !~n.indexOf("pointer") &&
            "pointerdown" === P[0],
          We = r(l),
          je = l.ownerDocument || x,
          qe = [0, 0, 0],
          Ue = [0, 0, 0],
          Ke = 0,
          Ze = ($e.onPress = function (e) {
            me(e, 1) ||
              (e && e.button) ||
              (($e.axis = Ne = null),
              Ie.pause(),
              ($e.isPressed = !0),
              (e = p(e)),
              (Fe = He = 0),
              ($e.startX = $e.x = e.clientX),
              ($e.startY = $e.y = e.clientY),
              $e._vx.reset(),
              $e._vy.reset(),
              a(re ? l : je, P[1], we, Re, !0),
              ($e.deltaX = $e.deltaY = 0),
              Y && Y($e));
          }),
          Qe = ($e.onRelease = function (e) {
            if (!me(e, 1)) {
              s(re ? l : je, P[1], we, !0);
              var t = !isNaN($e.y - $e.startY),
                i = $e.isDragging,
                n =
                  i &&
                  (3 < Math.abs($e.x - $e.startX) ||
                    3 < Math.abs($e.y - $e.startY)),
                r = p(e);
              (!n &&
                t &&
                ($e._vx.reset(),
                $e._vy.reset(),
                I &&
                  he &&
                  g.delayedCall(0.08, function () {
                    if (300 < O() - Ke && !e.defaultPrevented)
                      if (e.target.click) e.target.click();
                      else if (je.createEvent) {
                        var t = je.createEvent("MouseEvents");
                        (t.initMouseEvent(
                          "click",
                          !0,
                          !0,
                          b,
                          1,
                          r.screenX,
                          r.screenY,
                          r.clientX,
                          r.clientY,
                          !1,
                          !1,
                          !1,
                          !1,
                          0,
                          null,
                        ),
                          e.target.dispatchEvent(t));
                      }
                  })),
                ($e.isDragging = $e.isGesturing = $e.isPressed = !1),
                A && i && !re && Ie.restart(!0),
                Ae && be(),
                B && i && B($e),
                V && V($e, n));
            }
          });
        ((Ie = $e._dc =
          g
            .delayedCall(_ || 0.25, function () {
              ($e._vx.reset(), $e._vy.reset(), Ie.pause(), A && A($e));
            })
            .pause()),
          ($e.deltaX = $e.deltaY = 0),
          ($e._vx = u(0, 50, !0)),
          ($e._vy = u(0, 50, !0)),
          ($e.scrollX = Be),
          ($e.scrollY = Xe),
          ($e.isDragging = $e.isGesturing = $e.isPressed = !1),
          k(this),
          ($e.enable = function (e) {
            return (
              $e.isEnabled ||
                (a(We ? je : l, "scroll", o),
                0 <= n.indexOf("scroll") &&
                  a(We ? je : l, "scroll", Ee, Re, pe),
                0 <= n.indexOf("wheel") && a(l, "wheel", Ce, Re, pe),
                ((0 <= n.indexOf("touch") && S) || 0 <= n.indexOf("pointer")) &&
                  (a(l, P[0], Ze, Re, pe),
                  a(je, P[2], Qe),
                  a(je, P[3], Qe),
                  he && a(l, "click", ge, !0, !0),
                  ce && a(l, "click", ze),
                  ae && a(je, "gesturestart", Se),
                  se && a(je, "gestureend", Te),
                  ee && a(l, T + "enter", Pe),
                  te && a(l, T + "leave", ke),
                  ie && a(l, T + "move", Me)),
                ($e.isEnabled = !0),
                ($e.isDragging = $e.isGesturing = $e.isPressed = Oe = Ae = !1),
                $e._vx.reset(),
                $e._vy.reset(),
                (Ye = Be()),
                (Ve = Xe()),
                e && e.type && Ze(e),
                le && le($e)),
              $e
            );
          }),
          ($e.disable = function () {
            $e.isEnabled &&
              (L.filter(function (e) {
                return e !== $e && r(e.target);
              }).length || s(We ? je : l, "scroll", o),
              $e.isPressed &&
                ($e._vx.reset(), $e._vy.reset(), s(re ? l : je, P[1], we, !0)),
              s(We ? je : l, "scroll", Ee, pe),
              s(l, "wheel", Ce, pe),
              s(l, P[0], Ze, pe),
              s(je, P[2], Qe),
              s(je, P[3], Qe),
              s(l, "click", ge, !0),
              s(l, "click", ze),
              s(je, "gesturestart", Se),
              s(je, "gestureend", Te),
              s(l, T + "enter", Pe),
              s(l, T + "leave", ke),
              s(l, T + "move", Me),
              ($e.isEnabled = $e.isPressed = $e.isDragging = !1),
              de && de($e));
          }),
          ($e.kill = $e.revert =
            function () {
              $e.disable();
              var e = L.indexOf($e);
              (0 <= e && L.splice(e, 1), M === $e && (M = 0));
            }),
          L.push($e),
          re && r(l) && (M = $e),
          $e.enable(H));
      }),
      (function (e, i, n) {
        (i && t(e.prototype, i), n && t(e, n));
      })(R, [
        {
          key: "velocityX",
          get: function () {
            return this._vx.getVelocity();
          },
        },
        {
          key: "velocityY",
          get: function () {
            return this._vy.getVelocity();
          },
        },
      ]),
      R);
    function R(e) {
      this.init(e);
    }
    function B(e, t, i) {
      var n = St(e) && ("clamp(" === e.substr(0, 6) || -1 < e.indexOf("max"));
      return (i["_" + t + "Clamp"] = n) ? e.substr(6, e.length - 7) : e;
    }
    function X(e, t) {
      return !t || (St(e) && "clamp(" === e.substr(0, 6))
        ? e
        : "clamp(" + e + ")";
    }
    function Y() {
      return (We = 1);
    }
    function V() {
      return (We = 0);
    }
    function G(e) {
      return e;
    }
    function W(e) {
      return Math.round(1e5 * e) / 1e5 || 0;
    }
    function j() {
      return "undefined" != typeof window;
    }
    function q() {
      return Oe || (j() && (Oe = window.gsap) && Oe.registerPlugin && Oe);
    }
    function U(e) {
      return !!~He.indexOf(e);
    }
    function K(e) {
      return (
        ("Height" === e ? dt : De["inner" + e]) ||
        $e["client" + e] ||
        Fe["client" + e]
      );
    }
    function Z(e) {
      return (
        n(e, "getBoundingClientRect") ||
        (U(e)
          ? function () {
              return ((ii.width = De.innerWidth), (ii.height = dt), ii);
            }
          : function () {
              return Nt(e);
            })
      );
    }
    function Q(e, t) {
      var i = t.s,
        r = t.d2,
        a = t.d,
        s = t.a;
      return Math.max(
        0,
        (i = "scroll" + r) && (s = n(e, i))
          ? s() - Z(e)()[a]
          : U(e)
            ? ($e[i] || Fe[i]) - K(r)
            : e[i] - e["offset" + r],
      );
    }
    function J(e, t) {
      for (var i = 0; i < Ze.length; i += 3)
        (t && !~t.indexOf(Ze[i + 1])) || e(Ze[i], Ze[i + 1], Ze[i + 2]);
    }
    function ee(e) {
      return "function" == typeof e;
    }
    function te(e) {
      return "number" == typeof e;
    }
    function ie(e) {
      return "object" == typeof e;
    }
    function ne(e, t, i) {
      return e && e.progress(t ? 0 : 1) && i && e.pause();
    }
    function re(e, t) {
      if (e.enabled) {
        var i = e._ctx
          ? e._ctx.add(function () {
              return t(e);
            })
          : t(e);
        i && i.totalTime && (e.callbackAnimation = i);
      }
    }
    function ae(e) {
      return De.getComputedStyle(e);
    }
    function se(e, t) {
      for (var i in t) i in e || (e[i] = t[i]);
      return e;
    }
    function oe(e, t) {
      var i = t.d2;
      return e["offset" + i] || e["client" + i] || 0;
    }
    function le(e) {
      var t,
        i = [],
        n = e.labels,
        r = e.duration();
      for (t in n) i.push(n[t] / r);
      return i;
    }
    function de(e) {
      var t = Oe.utils.snap(e),
        i =
          Array.isArray(e) &&
          e.slice(0).sort(function (e, t) {
            return e - t;
          });
      return i
        ? function (e, n, r) {
            var a;
            if ((void 0 === r && (r = 0.001), !n)) return t(e);
            if (0 < n) {
              for (e -= r, a = 0; a < i.length; a++) if (i[a] >= e) return i[a];
              return i[a - 1];
            }
            for (a = i.length, e += r; a--;) if (i[a] <= e) return i[a];
            return i[0];
          }
        : function (i, n, r) {
            void 0 === r && (r = 0.001);
            var a = t(i);
            return !n || Math.abs(a - i) < r || a - i < 0 == n < 0
              ? a
              : t(n < 0 ? i - e : i + e);
          };
    }
    function ce(e, t, i, n) {
      return i.split(",").forEach(function (i) {
        return e(t, i, n);
      });
    }
    function ue(e, t, i, n, r) {
      return e.addEventListener(t, i, { passive: !n, capture: !!r });
    }
    function pe(e, t, i, n) {
      return e.removeEventListener(t, i, !!n);
    }
    function he(e, t, i) {
      (i = i && i.wheelHandler) && (e(t, "wheel", i), e(t, "touchmove", i));
    }
    function fe(e, t) {
      if (St(e)) {
        var i = e.indexOf("="),
          n = ~i ? (e.charAt(i - 1) + 1) * parseFloat(e.substr(i + 1)) : 0;
        (~i && (e.indexOf("%") > i && (n *= t / 100), (e = e.substr(0, i - 1))),
          (e =
            n +
            (e in Ht
              ? Ht[e] * t
              : ~e.indexOf("%")
                ? (parseFloat(e) * t) / 100
                : parseFloat(e) || 0)));
      }
      return e;
    }
    function ve(e, t, i, r, a, s, o, l) {
      var d = a.startColor,
        c = a.endColor,
        u = a.fontSize,
        p = a.indent,
        h = a.fontWeight,
        f = Ne.createElement("div"),
        v = U(i) || "fixed" === n(i, "pinType"),
        g = -1 !== e.indexOf("scroller"),
        m = v ? Fe : i,
        b = -1 !== e.indexOf("start"),
        x = b ? d : c,
        y =
          "border-color:" +
          x +
          ";font-size:" +
          u +
          ";color:" +
          x +
          ";font-weight:" +
          h +
          ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
      return (
        (y += "position:" + ((g || l) && v ? "fixed;" : "absolute;")),
        (!g && !l && v) ||
          (y += (r === F ? Et : Ct) + ":" + (s + parseFloat(p)) + "px;"),
        o &&
          (y +=
            "box-sizing:border-box;text-align:left;width:" +
            o.offsetWidth +
            "px;"),
        (f._isStart = b),
        f.setAttribute("class", "gsap-marker-" + e + (t ? " marker-" + t : "")),
        (f.style.cssText = y),
        (f.innerText = t || 0 === t ? e + "-" + t : e),
        m.children[0] ? m.insertBefore(f, m.children[0]) : m.appendChild(f),
        (f._offset = f["offset" + r.op.d2]),
        Rt(f, 0, r, b),
        f
      );
    }
    function ge() {
      return 34 < bt() - yt && (ht = ht || requestAnimationFrame(Zt));
    }
    function me() {
      (tt && tt.isPressed && !(tt.startX > Fe.clientWidth)) ||
        (I.cache++,
        tt ? (ht = ht || requestAnimationFrame(Zt)) : Zt(),
        yt || Gt("scrollStart"),
        (yt = bt()));
    }
    function be() {
      ((rt = De.innerWidth), (nt = De.innerHeight));
    }
    function xe(e) {
      (I.cache++,
        (!0 !== e &&
          (Ge ||
            et ||
            Ne.fullscreenElement ||
            Ne.webkitFullscreenElement ||
            (it &&
              rt === De.innerWidth &&
              !(Math.abs(De.innerHeight - nt) > 0.25 * De.innerHeight)))) ||
          Re.restart(!0));
    }
    function ye() {
      return pe(ri, "scrollEnd", ye) || qt(!0);
    }
    function we(e) {
      for (var t = 0; t < Wt.length; t += 5)
        (!e || (Wt[t + 4] && Wt[t + 4].query === e)) &&
          ((Wt[t].style.cssText = Wt[t + 1]),
          Wt[t].getBBox && Wt[t].setAttribute("transform", Wt[t + 2] || ""),
          (Wt[t + 3].uncache = 1));
    }
    function Se(e, t) {
      var i;
      for (qe = 0; qe < Bt.length; qe++)
        !(i = Bt[qe]) ||
          (t && i._ctx !== t) ||
          (e ? i.kill(1) : i.revert(!0, !0));
      ((ct = !0), t && we(t), t || Gt("revert"));
    }
    function Te(e, t) {
      (I.cache++,
        (!t && ft) ||
          I.forEach(function (e) {
            return ee(e) && e.cacheID++ && (e.rec = 0);
          }),
        St(e) && (De.history.scrollRestoration = ot = e));
    }
    function Ee() {
      (Fe.appendChild(lt),
        (dt = (!tt && lt.offsetHeight) || De.innerHeight),
        Fe.removeChild(lt));
    }
    function Ce(e) {
      return Be(
        ".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end",
      ).forEach(function (t) {
        return (t.style.display = e ? "none" : "block");
      });
    }
    function Me(e, t, i, n) {
      if (!e._gsap.swappedIn) {
        for (var r, a = Qt.length, s = t.style, o = e.style; a--;)
          s[(r = Qt[a])] = i[r];
        ((s.position = "absolute" === i.position ? "absolute" : "relative"),
          "inline" === i.display && (s.display = "inline-block"),
          (o[Ct] = o[Et] = "auto"),
          (s.flexBasis = i.flexBasis || "auto"),
          (s.overflow = "visible"),
          (s.boxSizing = "border-box"),
          (s[Mt] = oe(e, $) + Dt),
          (s[Pt] = oe(e, F) + Dt),
          (s[At] = o[Ot] = o.top = o.left = "0"),
          ti(n),
          (o[Mt] = o.maxWidth = i[Mt]),
          (o[Pt] = o.maxHeight = i[Pt]),
          (o[At] = i[At]),
          e.parentNode !== t &&
            (e.parentNode.insertBefore(t, e), t.appendChild(e)),
          (e._gsap.swappedIn = !0));
      }
    }
    function Pe(e) {
      for (var t = Jt.length, i = e.style, n = [], r = 0; r < t; r++)
        n.push(Jt[r], i[Jt[r]]);
      return ((n.t = e), n);
    }
    function ke(e, t, i, n, r, a, s, o, l, c, u, p, h, f) {
      (ee(e) && (e = e(o)),
        St(e) &&
          "max" === e.substr(0, 3) &&
          (e = p + ("=" === e.charAt(4) ? fe("0" + e.substr(3), i) : 0)));
      var v,
        g,
        m,
        b = h ? h.time() : 0;
      if ((h && h.seek(0), isNaN(e) || (e = +e), te(e)))
        (h &&
          (e = Oe.utils.mapRange(
            h.scrollTrigger.start,
            h.scrollTrigger.end,
            0,
            p,
            e,
          )),
          s && Rt(s, i, n, !0));
      else {
        ee(t) && (t = t(o));
        var x,
          y,
          w,
          S,
          T = (e || "0").split(" ");
        ((m = d(t, o) || Fe),
          ((x = Nt(m) || {}) && (x.left || x.top)) ||
            "none" !== ae(m).display ||
            ((S = m.style.display),
            (m.style.display = "block"),
            (x = Nt(m)),
            S ? (m.style.display = S) : m.style.removeProperty("display")),
          (y = fe(T[0], x[n.d])),
          (w = fe(T[1] || "0", i)),
          (e = x[n.p] - l[n.p] - c + y + r - w),
          s && Rt(s, w, n, i - w < 20 || (s._isStart && 20 < w)),
          (i -= i - w));
      }
      if ((f && ((o[f] = e || -0.001), e < 0 && (e = 0)), a)) {
        var E = e + i,
          C = a._isStart;
        ((v = "scroll" + n.d2),
          Rt(
            a,
            E,
            n,
            (C && 20 < E) ||
              (!C && (u ? Math.max(Fe[v], $e[v]) : a.parentNode[v]) <= E + 1),
          ),
          u &&
            ((l = Nt(s)),
            u && (a.style[n.op.p] = l[n.op.p] - n.op.m - a._offset + Dt)));
      }
      return (
        h &&
          m &&
          ((v = Nt(m)),
          h.seek(p),
          (g = Nt(m)),
          (h._caScrollDist = v[n.p] - g[n.p]),
          (e = (e / h._caScrollDist) * p)),
        h && h.seek(b),
        h ? e : Math.round(e)
      );
    }
    function ze(e, t, i, n) {
      if (e.parentNode !== t) {
        var r,
          a,
          s = e.style;
        if (t === Fe) {
          for (r in ((e._stOrig = s.cssText), (a = ae(e))))
            +r ||
              ni.test(r) ||
              !a[r] ||
              "string" != typeof s[r] ||
              "0" === r ||
              (s[r] = a[r]);
          ((s.top = i), (s.left = n));
        } else s.cssText = e._stOrig;
        ((Oe.core.getCache(e).uncache = 1), t.appendChild(e));
      }
    }
    function Le(e, t, i) {
      var n = t,
        r = n;
      return function (t) {
        var a = Math.round(e());
        return (
          a !== n &&
            a !== r &&
            3 < Math.abs(a - n) &&
            3 < Math.abs(a - r) &&
            ((t = a), i && i()),
          (r = n),
          (n = Math.round(t))
        );
      };
    }
    function Ie(e, t, i) {
      var n = {};
      ((n[t.p] = "+=" + i), Oe.set(e, n));
    }
    function Ae(e, t) {
      function i(t, a, s, o, l) {
        var d = i.tween,
          c = a.onComplete;
        s = s || n();
        var u = Le(n, s, function () {
          (d.kill(), (i.tween = 0));
        });
        return (
          (l = (o && l) || 0),
          (o = o || t - s),
          d && d.kill(),
          (a[r] = t),
          (a.inherit = !1),
          ((a.modifiers = {})[r] = function () {
            return u(s + o * d.ratio + l * d.ratio * d.ratio);
          }),
          (a.onUpdate = function () {
            (I.cache++, i.tween && Zt());
          }),
          (a.onComplete = function () {
            ((i.tween = 0), c && c.call(d));
          }),
          (d = i.tween = Oe.to(e, a))
        );
      }
      var n = c(e, t),
        r = "_scroll" + t.p2;
      return (
        ((e[r] = n).wheelHandler = function () {
          return i.tween && i.tween.kill() && (i.tween = 0);
        }),
        ue(e, "wheel", n.wheelHandler),
        ri.isTouch && ue(e, "touchmove", n.wheelHandler),
        i
      );
    }
    ((H.version = "3.13.0"),
      (H.create = function (e) {
        return new H(e);
      }),
      (H.register = v),
      (H.getAll = function () {
        return L.slice();
      }),
      (H.getById = function (e) {
        return L.filter(function (t) {
          return t.vars.id === e;
        })[0];
      }),
      i() && g.registerPlugin(H));
    var Oe,
      _e,
      De,
      Ne,
      $e,
      Fe,
      He,
      Re,
      Be,
      Xe,
      Ye,
      Ve,
      Ge,
      We,
      je,
      qe,
      Ue,
      Ke,
      Ze,
      Qe,
      Je,
      et,
      tt,
      it,
      nt,
      rt,
      at,
      st,
      ot,
      lt,
      dt,
      ct,
      ut,
      pt,
      ht,
      ft,
      vt,
      gt,
      mt = 1,
      bt = Date.now,
      xt = bt(),
      yt = 0,
      wt = 0,
      St = function (e) {
        return "string" == typeof e;
      },
      Tt = Math.abs,
      Et = "right",
      Ct = "bottom",
      Mt = "width",
      Pt = "height",
      kt = "Right",
      zt = "Left",
      Lt = "Top",
      It = "Bottom",
      At = "padding",
      Ot = "margin",
      _t = "Width",
      Dt = "px",
      Nt = function (e, t) {
        var i =
            t &&
            "matrix(1, 0, 0, 1, 0, 0)" !== ae(e)[je] &&
            Oe.to(e, {
              x: 0,
              y: 0,
              xPercent: 0,
              yPercent: 0,
              rotation: 0,
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              skewX: 0,
              skewY: 0,
            }).progress(1),
          n = e.getBoundingClientRect();
        return (i && i.progress(0).kill(), n);
      },
      $t = {
        startColor: "green",
        endColor: "red",
        indent: 0,
        fontSize: "16px",
        fontWeight: "normal",
      },
      Ft = { toggleActions: "play", anticipatePin: 0 },
      Ht = { top: 0, left: 0, center: 0.5, bottom: 1, right: 1 },
      Rt = function (e, t, i, n) {
        var r = { display: "block" },
          a = i[n ? "os2" : "p2"],
          s = i[n ? "p2" : "os2"];
        ((e._isFlipped = n),
          (r[i.a + "Percent"] = n ? -100 : 0),
          (r[i.a] = n ? "1px" : 0),
          (r["border" + a + _t] = 1),
          (r["border" + s + _t] = 0),
          (r[i.p] = t + "px"),
          Oe.set(e, r));
      },
      Bt = [],
      Xt = {},
      Yt = {},
      Vt = [],
      Gt = function (e) {
        return (
          (Yt[e] &&
            Yt[e].map(function (e) {
              return e();
            })) ||
          Vt
        );
      },
      Wt = [],
      jt = 0,
      qt = function (e, t) {
        if (
          (($e = Ne.documentElement),
          (Fe = Ne.body),
          (He = [De, Ne, $e, Fe]),
          !yt || e || ct)
        ) {
          (Ee(),
            (ft = ri.isRefreshing = !0),
            I.forEach(function (e) {
              return ee(e) && ++e.cacheID && (e.rec = e());
            }));
          var i = Gt("refreshInit");
          (Qe && ri.sort(),
            t || Se(),
            I.forEach(function (e) {
              ee(e) &&
                (e.smooth && (e.target.style.scrollBehavior = "auto"), e(0));
            }),
            Bt.slice(0).forEach(function (e) {
              return e.refresh();
            }),
            (ct = !1),
            Bt.forEach(function (e) {
              if (e._subPinOffset && e.pin) {
                var t = e.vars.horizontal ? "offsetWidth" : "offsetHeight",
                  i = e.pin[t];
                (e.revert(!0, 1),
                  e.adjustPinSpacing(e.pin[t] - i),
                  e.refresh());
              }
            }),
            (ut = 1),
            Ce(!0),
            Bt.forEach(function (e) {
              var t = Q(e.scroller, e._dir),
                i = "max" === e.vars.end || (e._endClamp && e.end > t),
                n = e._startClamp && e.start >= t;
              (i || n) &&
                e.setPositions(
                  n ? t - 1 : e.start,
                  i ? Math.max(n ? t : e.start + 1, t) : e.end,
                  !0,
                );
            }),
            Ce(!1),
            (ut = 0),
            i.forEach(function (e) {
              return e && e.render && e.render(-1);
            }),
            I.forEach(function (e) {
              ee(e) &&
                (e.smooth &&
                  requestAnimationFrame(function () {
                    return (e.target.style.scrollBehavior = "smooth");
                  }),
                e.rec && e(e.rec));
            }),
            Te(ot, 1),
            Re.pause(),
            jt++,
            Zt((ft = 2)),
            Bt.forEach(function (e) {
              return ee(e.vars.onRefresh) && e.vars.onRefresh(e);
            }),
            (ft = ri.isRefreshing = !1),
            Gt("refresh"));
        } else ue(ri, "scrollEnd", ye);
      },
      Ut = 0,
      Kt = 1,
      Zt = function (e) {
        if (2 === e || (!ft && !ct)) {
          ((ri.isUpdating = !0), gt && gt.update(0));
          var t = Bt.length,
            i = bt(),
            n = 50 <= i - xt,
            r = t && Bt[0].scroll();
          if (
            ((Kt = r < Ut ? -1 : 1),
            ft || (Ut = r),
            n &&
              (yt && !We && 200 < i - yt && ((yt = 0), Gt("scrollEnd")),
              (Ye = xt),
              (xt = i)),
            Kt < 0)
          ) {
            for (qe = t; 0 < qe--;) Bt[qe] && Bt[qe].update(0, n);
            Kt = 1;
          } else for (qe = 0; qe < t; qe++) Bt[qe] && Bt[qe].update(0, n);
          ri.isUpdating = !1;
        }
        ht = 0;
      },
      Qt = [
        "left",
        "top",
        Ct,
        Et,
        Ot + It,
        Ot + kt,
        Ot + Lt,
        Ot + zt,
        "display",
        "flexShrink",
        "float",
        "zIndex",
        "gridColumnStart",
        "gridColumnEnd",
        "gridRowStart",
        "gridRowEnd",
        "gridArea",
        "justifySelf",
        "alignSelf",
        "placeSelf",
        "order",
      ],
      Jt = Qt.concat([
        Mt,
        Pt,
        "boxSizing",
        "max" + _t,
        "maxHeight",
        "position",
        Ot,
        At,
        At + Lt,
        At + kt,
        At + It,
        At + zt,
      ]),
      ei = /([A-Z])/g,
      ti = function (e) {
        if (e) {
          var t,
            i,
            n = e.t.style,
            r = e.length,
            a = 0;
          for ((e.t._gsap || Oe.core.getCache(e.t)).uncache = 1; a < r; a += 2)
            ((i = e[a + 1]),
              (t = e[a]),
              i
                ? (n[t] = i)
                : n[t] && n.removeProperty(t.replace(ei, "-$1").toLowerCase()));
        }
      },
      ii = { left: 0, top: 0 },
      ni = /(webkit|moz|length|cssText|inset)/i,
      ri =
        ((ai.prototype.init = function (e, t) {
          if (
            ((this.progress = this.start = 0),
            this.vars && this.kill(!0, !0),
            wt)
          ) {
            var i,
              r,
              a,
              s,
              o,
              l,
              u,
              p,
              h,
              f,
              v,
              g,
              m,
              b,
              x,
              y,
              w,
              S,
              T,
              E,
              C,
              M,
              P,
              k,
              z,
              L,
              O,
              _,
              D,
              N,
              H,
              R,
              Y,
              V,
              j,
              q,
              J,
              ce,
              he,
              ge = (e = se(
                St(e) || te(e) || e.nodeType ? { trigger: e } : e,
                Ft,
              )).onUpdate,
              be = e.toggleClass,
              we = e.id,
              Se = e.onToggle,
              Te = e.onRefresh,
              Ee = e.scrub,
              Ce = e.trigger,
              Le = e.pin,
              _e = e.pinSpacing,
              He = e.invalidateOnRefresh,
              Re = e.anticipatePin,
              Ve = e.onScrubComplete,
              je = e.onSnapComplete,
              Ue = e.once,
              Ke = e.snap,
              Ze = e.pinReparent,
              et = e.pinSpacer,
              tt = e.containerAnimation,
              it = e.fastScrollEnd,
              nt = e.preventOverlaps,
              rt =
                e.horizontal || (e.containerAnimation && !1 !== e.horizontal)
                  ? $
                  : F,
              at = !Ee && 0 !== Ee,
              st = d(e.scroller || De),
              ot = Oe.core.getCache(st),
              lt = U(st),
              dt =
                "fixed" ===
                ("pinType" in e
                  ? e.pinType
                  : n(st, "pinType") || (lt && "fixed")),
              ct = [e.onEnter, e.onLeave, e.onEnterBack, e.onLeaveBack],
              ht = at && e.toggleActions.split(" "),
              xt = "markers" in e ? e.markers : Ft.markers,
              Et = lt ? 0 : parseFloat(ae(st)["border" + rt.p2 + _t]) || 0,
              Ct = this,
              Ht =
                e.onRefreshInit &&
                function () {
                  return e.onRefreshInit(Ct);
                },
              Rt = (function (e, t, i) {
                var r = i.d,
                  a = i.d2,
                  s = i.a;
                return (s = n(e, "getBoundingClientRect"))
                  ? function () {
                      return s()[r];
                    }
                  : function () {
                      return (t ? K(a) : e["client" + a]) || 0;
                    };
              })(st, lt, rt),
              Yt = (function (e, t) {
                return !t || ~A.indexOf(e)
                  ? Z(e)
                  : function () {
                      return ii;
                    };
              })(st, lt),
              Vt = 0,
              Gt = 0,
              Wt = 0,
              Ut = c(st, rt);
            if (
              ((Ct._startClamp = Ct._endClamp = !1),
              (Ct._dir = rt),
              (Re *= 45),
              (Ct.scroller = st),
              (Ct.scroll = tt ? tt.time.bind(tt) : Ut),
              (s = Ut()),
              (Ct.vars = e),
              (t = t || e.animation),
              "refreshPriority" in e &&
                ((Qe = 1), -9999 === e.refreshPriority && (gt = Ct)),
              (ot.tweenScroll = ot.tweenScroll || {
                top: Ae(st, F),
                left: Ae(st, $),
              }),
              (Ct.tweenTo = i = ot.tweenScroll[rt.p]),
              (Ct.scrubDuration = function (e) {
                (Y = te(e) && e)
                  ? R
                    ? R.duration(e)
                    : (R = Oe.to(t, {
                        ease: "expo",
                        totalProgress: "+=0",
                        inherit: !1,
                        duration: Y,
                        paused: !0,
                        onComplete: function () {
                          return Ve && Ve(Ct);
                        },
                      }))
                  : (R && R.progress(1).kill(), (R = 0));
              }),
              t &&
                ((t.vars.lazy = !1),
                (t._initted && !Ct.isReverted) ||
                  (!1 !== t.vars.immediateRender &&
                    !1 !== e.immediateRender &&
                    t.duration() &&
                    t.render(0, !0, !0)),
                (Ct.animation = t.pause()),
                (t.scrollTrigger = Ct).scrubDuration(Ee),
                (N = 0),
                (we = we || t.vars.id)),
              Ke &&
                ((ie(Ke) && !Ke.push) || (Ke = { snapTo: Ke }),
                "scrollBehavior" in Fe.style &&
                  Oe.set(lt ? [Fe, $e] : st, { scrollBehavior: "auto" }),
                I.forEach(function (e) {
                  return (
                    ee(e) &&
                    e.target === (lt ? Ne.scrollingElement || $e : st) &&
                    (e.smooth = !1)
                  );
                }),
                (a = ee(Ke.snapTo)
                  ? Ke.snapTo
                  : "labels" === Ke.snapTo
                    ? (function (e) {
                        return function (t) {
                          return Oe.utils.snap(le(e), t);
                        };
                      })(t)
                    : "labelsDirectional" === Ke.snapTo
                      ? (function (e) {
                          return function (t, i) {
                            return de(le(e))(t, i.direction);
                          };
                        })(t)
                      : !1 !== Ke.directional
                        ? function (e, t) {
                            return de(Ke.snapTo)(
                              e,
                              bt() - Gt < 500 ? 0 : t.direction,
                            );
                          }
                        : Oe.utils.snap(Ke.snapTo)),
                (V = ie((V = Ke.duration || { min: 0.1, max: 2 }))
                  ? Xe(V.min, V.max)
                  : Xe(V, V)),
                (j = Oe.delayedCall(Ke.delay || Y / 2 || 0.1, function () {
                  var e = Ut(),
                    n = bt() - Gt < 500,
                    r = i.tween;
                  if (
                    !(n || Math.abs(Ct.getVelocity()) < 10) ||
                    r ||
                    We ||
                    Vt === e
                  )
                    Ct.isActive && Vt !== e && j.restart(!0);
                  else {
                    var s,
                      o,
                      d = (e - l) / b,
                      c = t && !at ? t.totalProgress() : d,
                      p = n ? 0 : ((c - H) / (bt() - Ye)) * 1e3 || 0,
                      h = Oe.utils.clamp(-d, 1 - d, (Tt(p / 2) * p) / 0.185),
                      f = d + (!1 === Ke.inertia ? 0 : h),
                      v = Ke.onStart,
                      g = Ke.onInterrupt,
                      m = Ke.onComplete;
                    if (
                      (te((s = a(f, Ct))) || (s = f),
                      (o = Math.max(0, Math.round(l + s * b))),
                      e <= u && l <= e && o !== e)
                    ) {
                      if (r && !r._initted && r.data <= Tt(o - e)) return;
                      (!1 === Ke.inertia && (h = s - d),
                        i(
                          o,
                          {
                            duration: V(
                              Tt(
                                (0.185 * Math.max(Tt(f - c), Tt(s - c))) /
                                  p /
                                  0.05 || 0,
                              ),
                            ),
                            ease: Ke.ease || "power3",
                            data: Tt(o - e),
                            onInterrupt: function () {
                              return j.restart(!0) && g && g(Ct);
                            },
                            onComplete: function () {
                              (Ct.update(),
                                (Vt = Ut()),
                                t &&
                                  !at &&
                                  (R
                                    ? R.resetTo(
                                        "totalProgress",
                                        s,
                                        t._tTime / t._tDur,
                                      )
                                    : t.progress(s)),
                                (N = H =
                                  t && !at ? t.totalProgress() : Ct.progress),
                                je && je(Ct),
                                m && m(Ct));
                            },
                          },
                          e,
                          h * b,
                          o - e - h * b,
                        ),
                        v && v(Ct, i.tween));
                    }
                  }
                }).pause())),
              we && (Xt[we] = Ct),
              (he =
                (he =
                  (Ce = Ct.trigger = d(Ce || (!0 !== Le && Le))) &&
                  Ce._gsap &&
                  Ce._gsap.stRevert) && he(Ct)),
              (Le = !0 === Le ? Ce : d(Le)),
              St(be) && (be = { targets: Ce, className: be }),
              Le &&
                (!1 === _e ||
                  _e === Ot ||
                  (_e =
                    !(
                      !_e &&
                      Le.parentNode &&
                      Le.parentNode.style &&
                      "flex" === ae(Le.parentNode).display
                    ) && At),
                (Ct.pin = Le),
                (r = Oe.core.getCache(Le)).spacer
                  ? (x = r.pinState)
                  : (et &&
                      ((et = d(et)) &&
                        !et.nodeType &&
                        (et = et.current || et.nativeElement),
                      (r.spacerIsNative = !!et),
                      et && (r.spacerState = Pe(et))),
                    (r.spacer = S = et || Ne.createElement("div")),
                    S.classList.add("pin-spacer"),
                    we && S.classList.add("pin-spacer-" + we),
                    (r.pinState = x = Pe(Le))),
                !1 !== e.force3D && Oe.set(Le, { force3D: !0 }),
                (Ct.spacer = S = r.spacer),
                (D = ae(Le)),
                (k = D[_e + rt.os2]),
                (E = Oe.getProperty(Le)),
                (C = Oe.quickSetter(Le, rt.a, Dt)),
                Me(Le, S, D),
                (w = Pe(Le))),
              xt)
            ) {
              ((g = ie(xt) ? se(xt, $t) : $t),
                (f = ve("scroller-start", we, st, rt, g, 0)),
                (v = ve("scroller-end", we, st, rt, g, 0, f)),
                (T = f["offset" + rt.op.d2]));
              var Zt = d(n(st, "content") || st);
              ((p = this.markerStart = ve("start", we, Zt, rt, g, T, 0, tt)),
                (h = this.markerEnd = ve("end", we, Zt, rt, g, T, 0, tt)),
                tt && (ce = Oe.quickSetter([p, h], rt.a, Dt)),
                dt ||
                  (A.length && !0 === n(st, "fixedMarkers")) ||
                  ((function (e) {
                    var t = ae(e).position;
                    e.style.position =
                      "absolute" === t || "fixed" === t ? t : "relative";
                  })(lt ? Fe : st),
                  Oe.set([f, v], { force3D: !0 }),
                  (L = Oe.quickSetter(f, rt.a, Dt)),
                  (_ = Oe.quickSetter(v, rt.a, Dt))));
            }
            if (tt) {
              var Qt = tt.vars.onUpdate,
                Jt = tt.vars.onUpdateParams;
              tt.eventCallback("onUpdate", function () {
                (Ct.update(0, 0, 1), Qt && Qt.apply(tt, Jt || []));
              });
            }
            if (
              ((Ct.previous = function () {
                return Bt[Bt.indexOf(Ct) - 1];
              }),
              (Ct.next = function () {
                return Bt[Bt.indexOf(Ct) + 1];
              }),
              (Ct.revert = function (e, i) {
                if (!i) return Ct.kill(!0);
                var n = !1 !== e || !Ct.enabled,
                  r = Ge;
                n !== Ct.isReverted &&
                  (n &&
                    ((q = Math.max(Ut(), Ct.scroll.rec || 0)),
                    (Wt = Ct.progress),
                    (J = t && t.progress())),
                  p &&
                    [p, h, f, v].forEach(function (e) {
                      return (e.style.display = n ? "none" : "block");
                    }),
                  n && (Ge = Ct).update(n),
                  !Le ||
                    (Ze && Ct.isActive) ||
                    (n
                      ? (function (e, t, i) {
                          ti(i);
                          var n = e._gsap;
                          if (n.spacerIsNative) ti(n.spacerState);
                          else if (e._gsap.swappedIn) {
                            var r = t.parentNode;
                            r && (r.insertBefore(e, t), r.removeChild(t));
                          }
                          e._gsap.swappedIn = !1;
                        })(Le, S, x)
                      : Me(Le, S, ae(Le), z)),
                  n || Ct.update(n),
                  (Ge = r),
                  (Ct.isReverted = n));
              }),
              (Ct.refresh = function (n, r, a, g) {
                if ((!Ge && Ct.enabled) || r)
                  if (Le && n && yt) ue(ai, "scrollEnd", ye);
                  else {
                    (!ft && Ht && Ht(Ct),
                      (Ge = Ct),
                      i.tween && !a && (i.tween.kill(), (i.tween = 0)),
                      R && R.pause(),
                      He &&
                        t &&
                        (t.revert({ kill: !1 }).invalidate(),
                        t.getChildren &&
                          t.getChildren(!0, !0, !1).forEach(function (e) {
                            return (
                              e.vars.immediateRender && e.render(0, !0, !0)
                            );
                          })),
                      Ct.isReverted || Ct.revert(!0, !0),
                      (Ct._subPinOffset = !1));
                    var T,
                      C,
                      k,
                      L,
                      I,
                      A,
                      _,
                      D,
                      N,
                      H,
                      X,
                      Y,
                      V,
                      G = Rt(),
                      W = Yt(),
                      U = tt ? tt.duration() : Q(st, rt),
                      K = b <= 0.01 || !b,
                      Z = 0,
                      te = g || 0,
                      ne = ie(a) ? a.end : e.end,
                      re = e.endTrigger || Ce,
                      se = ie(a)
                        ? a.start
                        : e.start ||
                          (0 !== e.start && Ce ? (Le ? "0 0" : "0 100%") : 0),
                      le = (Ct.pinnedContainer =
                        e.pinnedContainer && d(e.pinnedContainer, Ct)),
                      de = (Ce && Math.max(0, Bt.indexOf(Ct))) || 0,
                      ce = de;
                    for (
                      xt &&
                      ie(a) &&
                      ((Y = Oe.getProperty(f, rt.p)),
                      (V = Oe.getProperty(v, rt.p)));
                      0 < ce--;
                    )
                      ((A = Bt[ce]).end || A.refresh(0, 1) || (Ge = Ct),
                        !(_ = A.pin) ||
                          (_ !== Ce && _ !== Le && _ !== le) ||
                          A.isReverted ||
                          ((H = H || []).unshift(A), A.revert(!0, !0)),
                        A !== Bt[ce] && (de--, ce--));
                    for (
                      ee(se) && (se = se(Ct)),
                        se = B(se, "start", Ct),
                        l =
                          ke(
                            se,
                            Ce,
                            G,
                            rt,
                            Ut(),
                            p,
                            f,
                            Ct,
                            W,
                            Et,
                            dt,
                            U,
                            tt,
                            Ct._startClamp && "_startClamp",
                          ) || (Le ? -0.001 : 0),
                        ee(ne) && (ne = ne(Ct)),
                        St(ne) &&
                          !ne.indexOf("+=") &&
                          (~ne.indexOf(" ")
                            ? (ne = (St(se) ? se.split(" ")[0] : "") + ne)
                            : ((Z = fe(ne.substr(2), G)),
                              (ne = St(se)
                                ? se
                                : (tt
                                    ? Oe.utils.mapRange(
                                        0,
                                        tt.duration(),
                                        tt.scrollTrigger.start,
                                        tt.scrollTrigger.end,
                                        l,
                                      )
                                    : l) + Z),
                              (re = Ce))),
                        ne = B(ne, "end", Ct),
                        u =
                          Math.max(
                            l,
                            ke(
                              ne || (re ? "100% 0" : U),
                              re,
                              G,
                              rt,
                              Ut() + Z,
                              h,
                              v,
                              Ct,
                              W,
                              Et,
                              dt,
                              U,
                              tt,
                              Ct._endClamp && "_endClamp",
                            ),
                          ) || -0.001,
                        Z = 0,
                        ce = de;
                      ce--;
                    )
                      (_ = (A = Bt[ce]).pin) &&
                        A.start - A._pinPush <= l &&
                        !tt &&
                        0 < A.end &&
                        ((T =
                          A.end -
                          (Ct._startClamp ? Math.max(0, A.start) : A.start)),
                        ((_ === Ce && A.start - A._pinPush < l) || _ === le) &&
                          isNaN(se) &&
                          (Z += T * (1 - A.progress)),
                        _ === Le && (te += T));
                    if (
                      ((l += Z),
                      (u += Z),
                      Ct._startClamp && (Ct._startClamp += Z),
                      Ct._endClamp &&
                        !ft &&
                        ((Ct._endClamp = u || -0.001),
                        (u = Math.min(u, Q(st, rt)))),
                      (b = u - l || ((l -= 0.01) && 0.001)),
                      K &&
                        (Wt = Oe.utils.clamp(
                          0,
                          1,
                          Oe.utils.normalize(l, u, q),
                        )),
                      (Ct._pinPush = te),
                      p &&
                        Z &&
                        (((T = {})[rt.a] = "+=" + Z),
                        le && (T[rt.p] = "-=" + Ut()),
                        Oe.set([p, h], T)),
                      !Le || (ut && Ct.end >= Q(st, rt)))
                    ) {
                      if (Ce && Ut() && !tt)
                        for (C = Ce.parentNode; C && C !== Fe;)
                          (C._pinOffset &&
                            ((l -= C._pinOffset), (u -= C._pinOffset)),
                            (C = C.parentNode));
                    } else
                      ((T = ae(Le)),
                        (L = rt === F),
                        (k = Ut()),
                        (M = parseFloat(E(rt.a)) + te),
                        !U &&
                          1 < u &&
                          ((X = {
                            style: (X = (lt ? Ne.scrollingElement || $e : st)
                              .style),
                            value: X["overflow" + rt.a.toUpperCase()],
                          }),
                          lt &&
                            "scroll" !==
                              ae(Fe)["overflow" + rt.a.toUpperCase()] &&
                            (X.style["overflow" + rt.a.toUpperCase()] =
                              "scroll")),
                        Me(Le, S, T),
                        (w = Pe(Le)),
                        (C = Nt(Le, !0)),
                        (D = dt && c(st, L ? $ : F)()),
                        _e
                          ? (((z = [_e + rt.os2, b + te + Dt]).t = S),
                            (ce = _e === At ? oe(Le, rt) + b + te : 0) &&
                              (z.push(rt.d, ce + Dt),
                              "auto" !== S.style.flexBasis &&
                                (S.style.flexBasis = ce + Dt)),
                            ti(z),
                            le &&
                              Bt.forEach(function (e) {
                                e.pin === le &&
                                  !1 !== e.vars.pinSpacing &&
                                  (e._subPinOffset = !0);
                              }),
                            dt && Ut(q))
                          : (ce = oe(Le, rt)) &&
                            "auto" !== S.style.flexBasis &&
                            (S.style.flexBasis = ce + Dt),
                        dt &&
                          (((I = {
                            top: C.top + (L ? k - l : D) + Dt,
                            left: C.left + (L ? D : k - l) + Dt,
                            boxSizing: "border-box",
                            position: "fixed",
                          })[Mt] = I.maxWidth =
                            Math.ceil(C.width) + Dt),
                          (I[Pt] = I.maxHeight = Math.ceil(C.height) + Dt),
                          (I[Ot] =
                            I[Ot + Lt] =
                            I[Ot + kt] =
                            I[Ot + It] =
                            I[Ot + zt] =
                              "0"),
                          (I[At] = T[At]),
                          (I[At + Lt] = T[At + Lt]),
                          (I[At + kt] = T[At + kt]),
                          (I[At + It] = T[At + It]),
                          (I[At + zt] = T[At + zt]),
                          (y = (function (e, t, i) {
                            for (
                              var n, r = [], a = e.length, s = i ? 8 : 0;
                              s < a;
                              s += 2
                            )
                              ((n = e[s]), r.push(n, n in t ? t[n] : e[s + 1]));
                            return ((r.t = e.t), r);
                          })(x, I, Ze)),
                          ft && Ut(0)),
                        t
                          ? ((N = t._initted),
                            Je(1),
                            t.render(t.duration(), !0, !0),
                            (P = E(rt.a) - M + b + te),
                            (O = 1 < Math.abs(b - P)),
                            dt && O && y.splice(y.length - 2, 2),
                            t.render(0, !0, !0),
                            N || t.invalidate(!0),
                            t.parent || t.totalTime(t.totalTime()),
                            Je(0))
                          : (P = b),
                        X &&
                          (X.value
                            ? (X.style["overflow" + rt.a.toUpperCase()] =
                                X.value)
                            : X.style.removeProperty("overflow-" + rt.a)));
                    (H &&
                      H.forEach(function (e) {
                        return e.revert(!1, !0);
                      }),
                      (Ct.start = l),
                      (Ct.end = u),
                      (s = o = ft ? q : Ut()),
                      tt || ft || (s < q && Ut(q), (Ct.scroll.rec = 0)),
                      Ct.revert(!1, !0),
                      (Gt = bt()),
                      j && ((Vt = -1), j.restart(!0)),
                      (Ge = 0),
                      t &&
                        at &&
                        (t._initted || J) &&
                        t.progress() !== J &&
                        t.progress(J || 0, !0).render(t.time(), !0, !0),
                      (K ||
                        Wt !== Ct.progress ||
                        tt ||
                        He ||
                        (t && !t._initted)) &&
                        (t &&
                          !at &&
                          (t._initted || Wt || !1 !== t.vars.immediateRender) &&
                          t.totalProgress(
                            tt && l < -0.001 && !Wt
                              ? Oe.utils.normalize(l, u, 0)
                              : Wt,
                            !0,
                          ),
                        (Ct.progress = K || (s - l) / b === Wt ? 0 : Wt)),
                      Le && _e && (S._pinOffset = Math.round(Ct.progress * P)),
                      R && R.invalidate(),
                      isNaN(Y) ||
                        ((Y -= Oe.getProperty(f, rt.p)),
                        (V -= Oe.getProperty(v, rt.p)),
                        Ie(f, rt, Y),
                        Ie(p, rt, Y - (g || 0)),
                        Ie(v, rt, V),
                        Ie(h, rt, V - (g || 0))),
                      K && !ft && Ct.update(),
                      !Te || ft || m || ((m = !0), Te(Ct), (m = !1)));
                  }
              }),
              (Ct.getVelocity = function () {
                return ((Ut() - o) / (bt() - Ye)) * 1e3 || 0;
              }),
              (Ct.endAnimation = function () {
                (ne(Ct.callbackAnimation),
                  t &&
                    (R
                      ? R.progress(1)
                      : t.paused()
                        ? at || ne(t, Ct.direction < 0, 1)
                        : ne(t, t.reversed())));
              }),
              (Ct.labelToScroll = function (e) {
                return (
                  (t &&
                    t.labels &&
                    (l || Ct.refresh() || l) +
                      (t.labels[e] / t.duration()) * b) ||
                  0
                );
              }),
              (Ct.getTrailing = function (e) {
                var t = Bt.indexOf(Ct),
                  i =
                    0 < Ct.direction
                      ? Bt.slice(0, t).reverse()
                      : Bt.slice(t + 1);
                return (
                  St(e)
                    ? i.filter(function (t) {
                        return t.vars.preventOverlaps === e;
                      })
                    : i
                ).filter(function (e) {
                  return 0 < Ct.direction ? e.end <= l : e.start >= u;
                });
              }),
              (Ct.update = function (e, n, r) {
                if (!tt || r || e) {
                  var a,
                    d,
                    c,
                    p,
                    h,
                    v,
                    g,
                    m = !0 === ft ? q : Ct.scroll(),
                    x = e ? 0 : (m - l) / b,
                    T = x < 0 ? 0 : 1 < x ? 1 : x || 0,
                    E = Ct.progress;
                  if (
                    (n &&
                      ((o = s),
                      (s = tt ? Ut() : m),
                      Ke && ((H = N), (N = t && !at ? t.totalProgress() : T))),
                    Re &&
                      Le &&
                      !Ge &&
                      !mt &&
                      yt &&
                      (!T && l < m + ((m - o) / (bt() - Ye)) * Re
                        ? (T = 1e-4)
                        : 1 === T &&
                          u > m + ((m - o) / (bt() - Ye)) * Re &&
                          (T = 0.9999)),
                    T !== E && Ct.enabled)
                  ) {
                    if (
                      ((p =
                        (h =
                          (a = Ct.isActive = !!T && T < 1) != (!!E && E < 1)) ||
                        !!T != !!E),
                      (Ct.direction = E < T ? 1 : -1),
                      (Ct.progress = T),
                      p &&
                        !Ge &&
                        ((d = T && !E ? 0 : 1 === T ? 1 : 1 === E ? 2 : 3),
                        at &&
                          ((c =
                            (!h && "none" !== ht[d + 1] && ht[d + 1]) || ht[d]),
                          (g =
                            t &&
                            ("complete" === c || "reset" === c || c in t)))),
                      nt &&
                        (h || g) &&
                        (g || Ee || !t) &&
                        (ee(nt)
                          ? nt(Ct)
                          : Ct.getTrailing(nt).forEach(function (e) {
                              return e.endAnimation();
                            })),
                      at ||
                        (!R || Ge || mt
                          ? t && t.totalProgress(T, !(!Ge || (!Gt && !e)))
                          : (R._dp._time - R._start !== R._time &&
                              R.render(R._dp._time - R._start),
                            R.resetTo
                              ? R.resetTo(
                                  "totalProgress",
                                  T,
                                  t._tTime / t._tDur,
                                )
                              : ((R.vars.totalProgress = T),
                                R.invalidate().restart()))),
                      Le)
                    )
                      if ((e && _e && (S.style[_e + rt.os2] = k), dt)) {
                        if (p) {
                          if (
                            ((v =
                              !e && E < T && m < u + 1 && m + 1 >= Q(st, rt)),
                            Ze)
                          )
                            if (e || (!a && !v)) ze(Le, S);
                            else {
                              var z = Nt(Le, !0),
                                I = m - l;
                              ze(
                                Le,
                                Fe,
                                z.top + (rt === F ? I : 0) + Dt,
                                z.left + (rt === F ? 0 : I) + Dt,
                              );
                            }
                          (ti(a || v ? y : w),
                            (O && T < 1 && a) || C(M + (1 !== T || v ? 0 : P)));
                        }
                      } else C(W(M + P * T));
                    (!Ke || i.tween || Ge || mt || j.restart(!0),
                      be &&
                        (h || (Ue && T && (T < 1 || !pt))) &&
                        Be(be.targets).forEach(function (e) {
                          return e.classList[a || Ue ? "add" : "remove"](
                            be.className,
                          );
                        }),
                      !ge || at || e || ge(Ct),
                      p && !Ge
                        ? (at &&
                            (g &&
                              ("complete" === c
                                ? t.pause().totalProgress(1)
                                : "reset" === c
                                  ? t.restart(!0).pause()
                                  : "restart" === c
                                    ? t.restart(!0)
                                    : t[c]()),
                            ge && ge(Ct)),
                          (!h && pt) ||
                            (Se && h && re(Ct, Se),
                            ct[d] && re(Ct, ct[d]),
                            Ue && (1 === T ? Ct.kill(!1, 1) : (ct[d] = 0)),
                            h || (ct[(d = 1 === T ? 1 : 3)] && re(Ct, ct[d]))),
                          it &&
                            !a &&
                            Math.abs(Ct.getVelocity()) > (te(it) ? it : 2500) &&
                            (ne(Ct.callbackAnimation),
                            R
                              ? R.progress(1)
                              : ne(t, "reverse" === c ? 1 : !T, 1)))
                        : at && ge && !Ge && ge(Ct));
                  }
                  if (_) {
                    var A = tt
                      ? (m / tt.duration()) * (tt._caScrollDist || 0)
                      : m;
                    (L(A + (f._isFlipped ? 1 : 0)), _(A));
                  }
                  ce && ce((-m / tt.duration()) * (tt._caScrollDist || 0));
                }
              }),
              (Ct.enable = function (e, t) {
                Ct.enabled ||
                  ((Ct.enabled = !0),
                  ue(st, "resize", xe),
                  lt || ue(st, "scroll", me),
                  Ht && ue(ai, "refreshInit", Ht),
                  !1 !== e && ((Ct.progress = Wt = 0), (s = o = Vt = Ut())),
                  !1 !== t && Ct.refresh());
              }),
              (Ct.getTween = function (e) {
                return e && i ? i.tween : R;
              }),
              (Ct.setPositions = function (e, t, i, n) {
                if (tt) {
                  var r = tt.scrollTrigger,
                    a = tt.duration(),
                    s = r.end - r.start;
                  ((e = r.start + (s * e) / a), (t = r.start + (s * t) / a));
                }
                (Ct.refresh(
                  !1,
                  !1,
                  {
                    start: X(e, i && !!Ct._startClamp),
                    end: X(t, i && !!Ct._endClamp),
                  },
                  n,
                ),
                  Ct.update());
              }),
              (Ct.adjustPinSpacing = function (e) {
                if (z && e) {
                  var t = z.indexOf(rt.d) + 1;
                  ((z[t] = parseFloat(z[t]) + e + Dt),
                    (z[1] = parseFloat(z[1]) + e + Dt),
                    ti(z));
                }
              }),
              (Ct.disable = function (e, t) {
                if (
                  Ct.enabled &&
                  (!1 !== e && Ct.revert(!0, !0),
                  (Ct.enabled = Ct.isActive = !1),
                  t || (R && R.pause()),
                  (q = 0),
                  r && (r.uncache = 1),
                  Ht && pe(ai, "refreshInit", Ht),
                  j && (j.pause(), i.tween && i.tween.kill() && (i.tween = 0)),
                  !lt)
                ) {
                  for (var n = Bt.length; n--;)
                    if (Bt[n].scroller === st && Bt[n] !== Ct) return;
                  (pe(st, "resize", xe), lt || pe(st, "scroll", me));
                }
              }),
              (Ct.kill = function (i, n) {
                (Ct.disable(i, n), R && !n && R.kill(), we && delete Xt[we]);
                var a = Bt.indexOf(Ct);
                (0 <= a && Bt.splice(a, 1),
                  a === qe && 0 < Kt && qe--,
                  (a = 0),
                  Bt.forEach(function (e) {
                    return e.scroller === Ct.scroller && (a = 1);
                  }),
                  a || ft || (Ct.scroll.rec = 0),
                  t &&
                    ((t.scrollTrigger = null),
                    i && t.revert({ kill: !1 }),
                    n || t.kill()),
                  p &&
                    [p, h, f, v].forEach(function (e) {
                      return e.parentNode && e.parentNode.removeChild(e);
                    }),
                  gt === Ct && (gt = 0),
                  Le &&
                    (r && (r.uncache = 1),
                    (a = 0),
                    Bt.forEach(function (e) {
                      return e.pin === Le && a++;
                    }),
                    a || (r.spacer = 0)),
                  e.onKill && e.onKill(Ct));
              }),
              Bt.push(Ct),
              Ct.enable(!1, !1),
              he && he(Ct),
              t && t.add && !b)
            ) {
              var ei = Ct.update;
              ((Ct.update = function () {
                ((Ct.update = ei), I.cache++, l || u || Ct.refresh());
              }),
                Oe.delayedCall(0.01, Ct.update),
                (b = 0.01),
                (l = u = 0));
            } else Ct.refresh();
            Le &&
              (function () {
                if (vt !== jt) {
                  var e = (vt = jt);
                  requestAnimationFrame(function () {
                    return e === jt && qt(!0);
                  });
                }
              })();
          } else this.update = this.refresh = this.kill = G;
        }),
        (ai.register = function (e) {
          return (
            _e ||
              ((Oe = e || q()),
              j() && window.document && ai.enable(),
              (_e = wt)),
            _e
          );
        }),
        (ai.defaults = function (e) {
          if (e) for (var t in e) Ft[t] = e[t];
          return Ft;
        }),
        (ai.disable = function (e, t) {
          ((wt = 0),
            Bt.forEach(function (i) {
              return i[t ? "kill" : "disable"](e);
            }),
            pe(De, "wheel", me),
            pe(Ne, "scroll", me),
            clearInterval(Ve),
            pe(Ne, "touchcancel", G),
            pe(Fe, "touchstart", G),
            ce(pe, Ne, "pointerdown,touchstart,mousedown", Y),
            ce(pe, Ne, "pointerup,touchend,mouseup", V),
            Re.kill(),
            J(pe));
          for (var i = 0; i < I.length; i += 3)
            (he(pe, I[i], I[i + 1]), he(pe, I[i], I[i + 2]));
        }),
        (ai.enable = function () {
          if (
            ((De = window),
            (Ne = document),
            ($e = Ne.documentElement),
            (Fe = Ne.body),
            Oe &&
              ((Be = Oe.utils.toArray),
              (Xe = Oe.utils.clamp),
              (st = Oe.core.context || G),
              (Je = Oe.core.suppressOverwrites || G),
              (ot = De.history.scrollRestoration || "auto"),
              (Ut = De.pageYOffset || 0),
              Oe.core.globals("ScrollTrigger", ai),
              Fe))
          ) {
            ((wt = 1),
              ((lt = document.createElement("div")).style.height = "100vh"),
              (lt.style.position = "absolute"),
              Ee(),
              (function e() {
                return wt && requestAnimationFrame(e);
              })(),
              H.register(Oe),
              (ai.isTouch = H.isTouch),
              (at =
                H.isTouch &&
                /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent)),
              (it = 1 === H.isTouch),
              ue(De, "wheel", me),
              (He = [De, Ne, $e, Fe]),
              Oe.matchMedia
                ? ((ai.matchMedia = function (e) {
                    var t,
                      i = Oe.matchMedia();
                    for (t in e) i.add(t, e[t]);
                    return i;
                  }),
                  Oe.addEventListener("matchMediaInit", function () {
                    return Se();
                  }),
                  Oe.addEventListener("matchMediaRevert", function () {
                    return we();
                  }),
                  Oe.addEventListener("matchMedia", function () {
                    (qt(0, 1), Gt("matchMedia"));
                  }),
                  Oe.matchMedia().add("(orientation: portrait)", function () {
                    return (be(), be);
                  }))
                : console.warn("Requires GSAP 3.11.0 or later"),
              be(),
              ue(Ne, "scroll", me));
            var e,
              t,
              i = Fe.hasAttribute("style"),
              n = Fe.style,
              r = n.borderTopStyle,
              a = Oe.core.Animation.prototype;
            for (
              a.revert ||
                Object.defineProperty(a, "revert", {
                  value: function () {
                    return this.time(-0.01, !0);
                  },
                }),
                n.borderTopStyle = "solid",
                e = Nt(Fe),
                F.m = Math.round(e.top + F.sc()) || 0,
                $.m = Math.round(e.left + $.sc()) || 0,
                r
                  ? (n.borderTopStyle = r)
                  : n.removeProperty("border-top-style"),
                i ||
                  (Fe.setAttribute("style", ""), Fe.removeAttribute("style")),
                Ve = setInterval(ge, 250),
                Oe.delayedCall(0.5, function () {
                  return (mt = 0);
                }),
                ue(Ne, "touchcancel", G),
                ue(Fe, "touchstart", G),
                ce(ue, Ne, "pointerdown,touchstart,mousedown", Y),
                ce(ue, Ne, "pointerup,touchend,mouseup", V),
                je = Oe.utils.checkPrefix("transform"),
                Jt.push(je),
                _e = bt(),
                Re = Oe.delayedCall(0.2, qt).pause(),
                Ze = [
                  Ne,
                  "visibilitychange",
                  function () {
                    var e = De.innerWidth,
                      t = De.innerHeight;
                    Ne.hidden
                      ? ((Ue = e), (Ke = t))
                      : (Ue === e && Ke === t) || xe();
                  },
                  Ne,
                  "DOMContentLoaded",
                  qt,
                  De,
                  "load",
                  qt,
                  De,
                  "resize",
                  xe,
                ],
                J(ue),
                Bt.forEach(function (e) {
                  return e.enable(0, 1);
                }),
                t = 0;
              t < I.length;
              t += 3
            )
              (he(pe, I[t], I[t + 1]), he(pe, I[t], I[t + 2]));
          }
        }),
        (ai.config = function (e) {
          "limitCallbacks" in e && (pt = !!e.limitCallbacks);
          var t = e.syncInterval;
          ((t && clearInterval(Ve)) || ((Ve = t) && setInterval(ge, t)),
            "ignoreMobileResize" in e &&
              (it = 1 === ai.isTouch && e.ignoreMobileResize),
            "autoRefreshEvents" in e &&
              (J(pe) || J(ue, e.autoRefreshEvents || "none"),
              (et = -1 === (e.autoRefreshEvents + "").indexOf("resize"))));
        }),
        (ai.scrollerProxy = function (e, t) {
          var i = d(e),
            n = I.indexOf(i),
            r = U(i);
          (~n && I.splice(n, r ? 6 : 2),
            t && (r ? A.unshift(De, t, Fe, t, $e, t) : A.unshift(i, t)));
        }),
        (ai.clearMatchMedia = function (e) {
          Bt.forEach(function (t) {
            return t._ctx && t._ctx.query === e && t._ctx.kill(!0, !0);
          });
        }),
        (ai.isInViewport = function (e, t, i) {
          var n = (St(e) ? d(e) : e).getBoundingClientRect(),
            r = n[i ? Mt : Pt] * t || 0;
          return i
            ? 0 < n.right - r && n.left + r < De.innerWidth
            : 0 < n.bottom - r && n.top + r < De.innerHeight;
        }),
        (ai.positionInViewport = function (e, t, i) {
          St(e) && (e = d(e));
          var n = e.getBoundingClientRect(),
            r = n[i ? Mt : Pt],
            a =
              null == t
                ? r / 2
                : t in Ht
                  ? Ht[t] * r
                  : ~t.indexOf("%")
                    ? (parseFloat(t) * r) / 100
                    : parseFloat(t) || 0;
          return i
            ? (n.left + a) / De.innerWidth
            : (n.top + a) / De.innerHeight;
        }),
        (ai.killAll = function (e) {
          if (
            (Bt.slice(0).forEach(function (e) {
              return "ScrollSmoother" !== e.vars.id && e.kill();
            }),
            !0 !== e)
          ) {
            var t = Yt.killAll || [];
            ((Yt = {}),
              t.forEach(function (e) {
                return e();
              }));
          }
        }),
        ai);
    function ai(e, t) {
      (_e ||
        ai.register(Oe) ||
        console.warn("Please gsap.registerPlugin(ScrollTrigger)"),
        st(this),
        this.init(e, t));
    }
    function si(e, t, i, n) {
      return (
        n < t ? e(n) : t < 0 && e(0),
        n < i ? (n - t) / (i - t) : i < 0 ? t / (t - i) : 1
      );
    }
    function oi(e, t) {
      (!0 === t
        ? e.style.removeProperty("touch-action")
        : (e.style.touchAction =
            !0 === t
              ? "auto"
              : t
                ? "pan-" + t + (H.isTouch ? " pinch-zoom" : "")
                : "none"),
        e === $e && oi(Fe, t));
    }
    function li(e) {
      var t,
        i = e.event,
        n = e.target,
        r = e.axis,
        a = (i.changedTouches ? i.changedTouches[0] : i).target,
        s = a._gsap || Oe.core.getCache(a),
        o = bt();
      if (!s._isScrollT || 2e3 < o - s._isScrollT) {
        for (
          ;
          a &&
          a !== Fe &&
          ((a.scrollHeight <= a.clientHeight &&
            a.scrollWidth <= a.clientWidth) ||
            (!ui[(t = ae(a)).overflowY] && !ui[t.overflowX]));
        )
          a = a.parentNode;
        ((s._isScroll =
          a &&
          a !== n &&
          !U(a) &&
          (ui[(t = ae(a)).overflowY] || ui[t.overflowX])),
          (s._isScrollT = o));
      }
      (!s._isScroll && "x" !== r) || (i.stopPropagation(), (i._gsapAllow = !0));
    }
    function di(e, t, i, n) {
      return H.create({
        target: e,
        capture: !0,
        debounce: !1,
        lockAxis: !0,
        type: t,
        onWheel: (n = n && li),
        onPress: n,
        onDrag: n,
        onScroll: n,
        onEnable: function () {
          return i && ue(Ne, H.eventTypes[0], hi, !1, !0);
        },
        onDisable: function () {
          return pe(Ne, H.eventTypes[0], hi, !0);
        },
      });
    }
    ((ri.version = "3.13.0"),
      (ri.saveStyles = function (e) {
        return e
          ? Be(e).forEach(function (e) {
              if (e && e.style) {
                var t = Wt.indexOf(e);
                (0 <= t && Wt.splice(t, 5),
                  Wt.push(
                    e,
                    e.style.cssText,
                    e.getBBox && e.getAttribute("transform"),
                    Oe.core.getCache(e),
                    st(),
                  ));
              }
            })
          : Wt;
      }),
      (ri.revert = function (e, t) {
        return Se(!e, t);
      }),
      (ri.create = function (e, t) {
        return new ri(e, t);
      }),
      (ri.refresh = function (e) {
        return e ? xe(!0) : (_e || ri.register()) && qt(!0);
      }),
      (ri.update = function (e) {
        return ++I.cache && Zt(!0 === e ? 2 : 0);
      }),
      (ri.clearScrollMemory = Te),
      (ri.maxScroll = function (e, t) {
        return Q(e, t ? $ : F);
      }),
      (ri.getScrollFunc = function (e, t) {
        return c(d(e), t ? $ : F);
      }),
      (ri.getById = function (e) {
        return Xt[e];
      }),
      (ri.getAll = function () {
        return Bt.filter(function (e) {
          return "ScrollSmoother" !== e.vars.id;
        });
      }),
      (ri.isScrolling = function () {
        return !!yt;
      }),
      (ri.snapDirectional = de),
      (ri.addEventListener = function (e, t) {
        var i = Yt[e] || (Yt[e] = []);
        ~i.indexOf(t) || i.push(t);
      }),
      (ri.removeEventListener = function (e, t) {
        var i = Yt[e],
          n = i && i.indexOf(t);
        0 <= n && i.splice(n, 1);
      }),
      (ri.batch = function (e, t) {
        function i(e, t) {
          var i = [],
            n = [],
            r = Oe.delayedCall(s, function () {
              (t(i, n), (i = []), (n = []));
            }).pause();
          return function (e) {
            (i.length || r.restart(!0),
              i.push(e.trigger),
              n.push(e),
              o <= i.length && r.progress(1));
          };
        }
        var n,
          r = [],
          a = {},
          s = t.interval || 0.016,
          o = t.batchMax || 1e9;
        for (n in t)
          a[n] =
            "on" === n.substr(0, 2) && ee(t[n]) && "onRefreshInit" !== n
              ? i(0, t[n])
              : t[n];
        return (
          ee(o) &&
            ((o = o()),
            ue(ri, "refresh", function () {
              return (o = t.batchMax());
            })),
          Be(e).forEach(function (e) {
            var t = {};
            for (n in a) t[n] = a[n];
            ((t.trigger = e), r.push(ri.create(t)));
          }),
          r
        );
      }));
    var ci,
      ui = { auto: 1, scroll: 1 },
      pi = /(input|label|select|textarea)/i,
      hi = function (e) {
        var t = pi.test(e.target.tagName);
        (t || ci) && ((e._gsapAllow = !0), (ci = t));
      };
    ((ri.sort = function (e) {
      if (ee(e)) return Bt.sort(e);
      var t = De.pageYOffset || 0;
      return (
        ri.getAll().forEach(function (e) {
          return (e._sortY = e.trigger
            ? t + e.trigger.getBoundingClientRect().top
            : e.start + De.innerHeight);
        }),
        Bt.sort(
          e ||
            function (e, t) {
              return (
                -1e6 * (e.vars.refreshPriority || 0) +
                (e.vars.containerAnimation ? 1e6 : e._sortY) -
                ((t.vars.containerAnimation ? 1e6 : t._sortY) +
                  -1e6 * (t.vars.refreshPriority || 0))
              );
            },
        )
      );
    }),
      (ri.observe = function (e) {
        return new H(e);
      }),
      (ri.normalizeScroll = function (e) {
        if (void 0 === e) return tt;
        if (!0 === e && tt) return tt.enable();
        if (!1 === e) return (tt && tt.kill(), void (tt = e));
        var t =
          e instanceof H
            ? e
            : (function (e) {
                function t() {
                  return (l = !1);
                }
                function i() {
                  ((s = Q(x, F)),
                    (A = Xe(at ? 1 : 0, s)),
                    v && (L = Xe(0, Q(x, $))),
                    (o = jt));
                }
                function n() {
                  ((S._gsap.y = W(parseFloat(S._gsap.y) + T.offset) + "px"),
                    (S.style.transform =
                      "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " +
                      parseFloat(S._gsap.y) +
                      ", 0, 1)"),
                    (T.offset = T.cacheID = 0));
                }
                function r() {
                  (i(),
                    u.isActive() &&
                      u.vars.scrollY > s &&
                      (T() > s
                        ? u.progress(1) && T(s)
                        : u.resetTo("scrollY", s)));
                }
                (ie(e) || (e = {}),
                  (e.preventDefault = e.isNormalizer = e.allowClicks = !0),
                  e.type || (e.type = "wheel,touch"),
                  (e.debounce = !!e.debounce),
                  (e.id = e.id || "normalizer"));
                var a,
                  s,
                  o,
                  l,
                  u,
                  p,
                  h,
                  f,
                  v = e.normalizeScrollX,
                  g = e.momentum,
                  m = e.allowNestedScroll,
                  b = e.onRelease,
                  x = d(e.target) || $e,
                  y = Oe.core.globals().ScrollSmoother,
                  w = y && y.get(),
                  S =
                    at &&
                    ((e.content && d(e.content)) ||
                      (w && !1 !== e.content && !w.smooth() && w.content())),
                  T = c(x, F),
                  E = c(x, $),
                  C = 1,
                  M =
                    (H.isTouch && De.visualViewport
                      ? De.visualViewport.scale * De.visualViewport.width
                      : De.outerWidth) / De.innerWidth,
                  P = 0,
                  k = ee(g)
                    ? function () {
                        return g(a);
                      }
                    : function () {
                        return g || 2.8;
                      },
                  z = di(x, e.type, !0, m),
                  L = G,
                  A = G;
                return (
                  S && Oe.set(S, { y: "+=0" }),
                  (e.ignoreCheck = function (e) {
                    return (
                      (at &&
                        "touchmove" === e.type &&
                        (function () {
                          if (l) {
                            requestAnimationFrame(t);
                            var e = W(a.deltaY / 2),
                              i = A(T.v - e);
                            if (S && i !== T.v + T.offset) {
                              T.offset = i - T.v;
                              var r = W(
                                (parseFloat(S && S._gsap.y) || 0) - T.offset,
                              );
                              ((S.style.transform =
                                "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " +
                                r +
                                ", 0, 1)"),
                                (S._gsap.y = r + "px"),
                                (T.cacheID = I.cache),
                                Zt());
                            }
                            return !0;
                          }
                          (T.offset && n(), (l = !0));
                        })()) ||
                      (1.05 < C && "touchstart" !== e.type) ||
                      a.isGesturing ||
                      (e.touches && 1 < e.touches.length)
                    );
                  }),
                  (e.onPress = function () {
                    l = !1;
                    var e = C;
                    ((C = W(
                      ((De.visualViewport && De.visualViewport.scale) || 1) / M,
                    )),
                      u.pause(),
                      e !== C && oi(x, 1.01 < C || (!v && "x")),
                      (p = E()),
                      (h = T()),
                      i(),
                      (o = jt));
                  }),
                  (e.onRelease = e.onGestureStart =
                    function (e, t) {
                      if ((T.offset && n(), t)) {
                        I.cache++;
                        var i,
                          a,
                          o = k();
                        (v &&
                          ((a = (i = E()) + (0.05 * o * -e.velocityX) / 0.227),
                          (o *= si(E, i, a, Q(x, $))),
                          (u.vars.scrollX = L(a))),
                          (a = (i = T()) + (0.05 * o * -e.velocityY) / 0.227),
                          (o *= si(T, i, a, Q(x, F))),
                          (u.vars.scrollY = A(a)),
                          u.invalidate().duration(o).play(0.01),
                          ((at && u.vars.scrollY >= s) || s - 1 <= i) &&
                            Oe.to({}, { onUpdate: r, duration: o }));
                      } else f.restart(!0);
                      b && b(e);
                    }),
                  (e.onWheel = function () {
                    (u._ts && u.pause(),
                      1e3 < bt() - P && ((o = 0), (P = bt())));
                  }),
                  (e.onChange = function (e, t, r, a, s) {
                    if (
                      (jt !== o && i(),
                      t &&
                        v &&
                        E(
                          L(a[2] === t ? p + (e.startX - e.x) : E() + t - a[1]),
                        ),
                      r)
                    ) {
                      T.offset && n();
                      var l = s[2] === r,
                        d = l ? h + e.startY - e.y : T() + r - s[1],
                        c = A(d);
                      (l && d !== c && (h += c - d), T(c));
                    }
                    (r || t) && Zt();
                  }),
                  (e.onEnable = function () {
                    (oi(x, !v && "x"),
                      ri.addEventListener("refresh", r),
                      ue(De, "resize", r),
                      T.smooth &&
                        ((T.target.style.scrollBehavior = "auto"),
                        (T.smooth = E.smooth = !1)),
                      z.enable());
                  }),
                  (e.onDisable = function () {
                    (oi(x, !0),
                      pe(De, "resize", r),
                      ri.removeEventListener("refresh", r),
                      z.kill());
                  }),
                  (e.lockAxis = !1 !== e.lockAxis),
                  ((a = new H(e)).iOS = at) && !T() && T(1),
                  at && Oe.ticker.add(G),
                  (f = a._dc),
                  (u = Oe.to(a, {
                    ease: "power4",
                    paused: !0,
                    inherit: !1,
                    scrollX: v ? "+=0.1" : "+=0",
                    scrollY: "+=0.1",
                    modifiers: {
                      scrollY: Le(T, T(), function () {
                        return u.pause();
                      }),
                    },
                    onUpdate: Zt,
                    onComplete: f.vars.onComplete,
                  })),
                  a
                );
              })(e);
        return (
          tt && tt.target === t.target && tt.kill(),
          U(t.target) && (tt = t),
          t
        );
      }),
      (ri.core = {
        _getVelocityProp: u,
        _inputObserver: di,
        _scrollers: I,
        _proxies: A,
        bridge: {
          ss: function () {
            (yt || Gt("scrollStart"), (yt = bt()));
          },
          ref: function () {
            return Ge;
          },
        },
      }),
      q() && Oe.registerPlugin(ri),
      (e.ScrollTrigger = ri),
      (e.default = ri),
      "undefined" == typeof window || window !== e
        ? Object.defineProperty(e, "__esModule", { value: !0 })
        : delete e.default);
  }),
  /*!
   * SplitText 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2025, GreenSock. All rights reserved. Subject to the terms at https://gsap.com/standard-license.
   * @author: Jack Doyle
   */
  (function (e, t) {
    "object" == typeof exports && "undefined" != typeof module
      ? t(exports)
      : "function" == typeof define && define.amd
        ? define(["exports"], t)
        : t(
            ((e =
              "undefined" != typeof globalThis
                ? globalThis
                : e || self).window = e.window || {}),
          );
  })(this, function (e) {
    "use strict";
    let t,
      i,
      n,
      r = "undefined" != typeof Intl ? new Intl.Segmenter() : 0,
      a = (e) =>
        "string" == typeof e
          ? a(document.querySelectorAll(e))
          : "length" in e
            ? Array.from(e)
            : [e],
      s = (e) => a(e).filter((e) => e instanceof HTMLElement),
      o = [],
      l = function () {},
      d = /\s+/g,
      c = new RegExp(
        "\\p{RI}\\p{RI}|\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?(\\u{200D}\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?)*|.",
        "gu",
      ),
      u = { left: 0, top: 0, width: 0, height: 0 },
      p = (e, t) => {
        if (t) {
          let i,
            n,
            r,
            a,
            s = new Set(e.join("").match(t) || o),
            l = e.length;
          if (s.size)
            for (; --l > -1;)
              for (r of ((n = e[l]), s))
                if (r.startsWith(n) && r.length > n.length) {
                  for (
                    i = 0, a = n;
                    r.startsWith((a += e[l + ++i])) && a.length < r.length;
                  );
                  if (i && a.length === r.length) {
                    ((e[l] = r), e.splice(l + 1, i));
                    break;
                  }
                }
        }
        return e;
      },
      h = (e) =>
        "inline" === window.getComputedStyle(e).display &&
        (e.style.display = "inline-block"),
      f = (e, t, i) =>
        t.insertBefore(
          "string" == typeof e ? document.createTextNode(e) : e,
          i,
        ),
      v = (e, t, i) => {
        let n = t[e + "sClass"] || "",
          { tag: r = "div", aria: a = "auto", propIndex: s = !1 } = t,
          o = "line" === e ? "block" : "inline-block",
          l = n.indexOf("++") > -1,
          d = (t) => {
            let d = document.createElement(r),
              c = i.length + 1;
            return (
              n && (d.className = n + (l ? " " + n + c : "")),
              s && d.style.setProperty("--" + e, c + ""),
              "none" !== a && d.setAttribute("aria-hidden", "true"),
              "span" !== r &&
                ((d.style.position = "relative"), (d.style.display = o)),
              (d.textContent = t),
              i.push(d),
              d
            );
          };
        return (l && (n = n.replace("++", "")), (d.collection = i), d);
      },
      g = (e, t, i, n, a, s, l, c, u, v) => {
        var m;
        let b,
          x,
          y,
          w,
          S,
          T,
          E,
          C,
          M,
          P,
          k,
          z,
          L,
          I,
          A,
          O,
          _,
          D,
          N = Array.from(e.childNodes),
          $ = 0,
          { wordDelimiter: F, reduceWhiteSpace: H = !0, prepareText: R } = t,
          B = e.getBoundingClientRect(),
          X = B,
          Y =
            !H &&
            "pre" === window.getComputedStyle(e).whiteSpace.substring(0, 3),
          V = 0,
          G = i.collection;
        for (
          "object" == typeof F
            ? ((y = F.delimiter || F), (x = F.replaceWith || ""))
            : (x = "" === F ? "" : F || " "),
            b = " " !== x;
          $ < N.length;
          $++
        )
          if (((w = N[$]), 3 === w.nodeType)) {
            for (
              A = w.textContent || "",
                H
                  ? (A = A.replace(d, " "))
                  : Y && (A = A.replace(/\n/g, x + "\n")),
                R && (A = R(A, e)),
                w.textContent = A,
                S = x || y ? A.split(y || x) : A.match(c) || o,
                _ = S[S.length - 1],
                C = b ? " " === _.slice(-1) : !_,
                _ || S.pop(),
                X = B,
                E = b ? " " === S[0].charAt(0) : !S[0],
                E && f(" ", e, w),
                S[0] || S.shift(),
                p(S, u),
                (s && v) || (w.textContent = ""),
                M = 1;
              M <= S.length;
              M++
            )
              if (
                ((O = S[M - 1]),
                !H &&
                  Y &&
                  "\n" === O.charAt(0) &&
                  (null == (m = w.previousSibling) || m.remove(),
                  f(document.createElement("br"), e, w),
                  (O = O.slice(1))),
                H || "" !== O)
              )
                if (" " === O) e.insertBefore(document.createTextNode(" "), w);
                else {
                  if (
                    (b && " " === O.charAt(0) && f(" ", e, w),
                    V && 1 === M && !E && G.indexOf(V.parentNode) > -1
                      ? ((T = G[G.length - 1]),
                        T.appendChild(document.createTextNode(n ? "" : O)))
                      : ((T = i(n ? "" : O)),
                        f(T, e, w),
                        V && 1 === M && !E && T.insertBefore(V, T.firstChild)),
                    n)
                  )
                    for (
                      k = r
                        ? p(
                            [...r.segment(O)].map((e) => e.segment),
                            u,
                          )
                        : O.match(c) || o,
                        D = 0;
                      D < k.length;
                      D++
                    )
                      T.appendChild(
                        " " === k[D] ? document.createTextNode(" ") : n(k[D]),
                      );
                  if (s && v) {
                    if (
                      ((A = w.textContent =
                        A.substring(O.length + 1, A.length)),
                      (P = T.getBoundingClientRect()),
                      P.top > X.top && P.left <= X.left)
                    ) {
                      for (
                        z = e.cloneNode(), L = e.childNodes[0];
                        L && L !== T;
                      )
                        ((I = L), (L = L.nextSibling), z.appendChild(I));
                      (e.parentNode.insertBefore(z, e), a && h(z));
                    }
                    X = P;
                  }
                  (M < S.length || C) &&
                    f(
                      M >= S.length
                        ? " "
                        : b && " " === O.slice(-1)
                          ? " " + x
                          : x,
                      e,
                      w,
                    );
                }
              else f(x, e, w);
            (e.removeChild(w), (V = 0));
          } else
            1 === w.nodeType &&
              (l && l.indexOf(w) > -1
                ? (G.indexOf(w.previousSibling) > -1 &&
                    G[G.length - 1].appendChild(w),
                  (V = w))
                : (g(w, t, i, n, a, s, l, c, u, !0), (V = 0)),
              a && h(w));
      };
    const m = class e {
      constructor(e, t) {
        ((this.isSplit = !1),
          n || b.register(window.gsap),
          (this.elements = s(e)),
          (this.chars = []),
          (this.words = []),
          (this.lines = []),
          (this.masks = []),
          (this.vars = t),
          (this._split = () => this.isSplit && this.split(this.vars)));
        let i,
          r = [],
          a = () => {
            let e,
              t = r.length;
            for (; t--;) {
              e = r[t];
              let i = e.element.offsetWidth;
              if (i !== e.width) return ((e.width = i), void this._split());
            }
          };
        ((this._data = {
          orig: r,
          obs:
            "undefined" != typeof ResizeObserver &&
            new ResizeObserver(() => {
              (clearTimeout(i), (i = setTimeout(a, 200)));
            }),
        }),
          l(this),
          this.split(t));
      }
      split(e) {
        (this.isSplit && this.revert(), (this.vars = e = e || this.vars || {}));
        let t,
          {
            type: n = "chars,words,lines",
            aria: r = "auto",
            deepSlice: o = !0,
            smartWrap: l,
            onSplit: d,
            autoSplit: p = !1,
            specialChars: h,
            mask: f,
          } = this.vars,
          m = n.indexOf("lines") > -1,
          b = n.indexOf("chars") > -1,
          x = n.indexOf("words") > -1,
          y = b && !x && !m,
          w =
            h &&
            ("push" in h ? new RegExp("(?:" + h.join("|") + ")", "gu") : h),
          S = w ? new RegExp(w.source + "|" + c.source, "gu") : c,
          T = !!e.ignore && s(e.ignore),
          { orig: E, animTime: C, obs: M } = this._data;
        return (
          (b || x || m) &&
            (this.elements.forEach((t, i) => {
              ((E[i] = {
                element: t,
                html: t.innerHTML,
                ariaL: t.getAttribute("aria-label"),
                ariaH: t.getAttribute("aria-hidden"),
              }),
                "auto" === r
                  ? t.setAttribute("aria-label", (t.textContent || "").trim())
                  : "hidden" === r && t.setAttribute("aria-hidden", "true"));
              let n,
                s,
                d,
                c,
                p = [],
                h = [],
                f = [],
                C = b ? v("char", e, p) : null,
                M = v("word", e, h);
              if ((g(t, e, M, C, y, o && (m || y), T, S, w, !1), m)) {
                let i,
                  r = a(t.childNodes),
                  s = ((e, t, i, n) => {
                    let r = v("line", i, n),
                      a = window.getComputedStyle(e).textAlign || "left";
                    return (i, n) => {
                      let s = r("");
                      for (
                        s.style.textAlign = a, e.insertBefore(s, t[i]);
                        i < n;
                        i++
                      )
                        s.appendChild(t[i]);
                      s.normalize();
                    };
                  })(t, r, e, f),
                  o = [],
                  l = 0,
                  d = r.map((e) =>
                    1 === e.nodeType ? e.getBoundingClientRect() : u,
                  ),
                  c = u;
                for (n = 0; n < r.length; n++)
                  ((i = r[n]),
                    1 === i.nodeType &&
                      ("BR" === i.nodeName
                        ? (o.push(i), s(l, n + 1), (l = n + 1), (c = d[l]))
                        : (n &&
                            d[n].top > c.top &&
                            d[n].left <= c.left &&
                            (s(l, n), (l = n)),
                          (c = d[n]))));
                (l < n && s(l, n),
                  o.forEach((e) => {
                    var t;
                    return null == (t = e.parentNode)
                      ? void 0
                      : t.removeChild(e);
                  }));
              }
              if (!x) {
                for (n = 0; n < h.length; n++)
                  if (
                    ((s = h[n]),
                    b || !s.nextSibling || 3 !== s.nextSibling.nodeType)
                  )
                    if (l && !m) {
                      for (
                        d = document.createElement("span"),
                          d.style.whiteSpace = "nowrap";
                        s.firstChild;
                      )
                        d.appendChild(s.firstChild);
                      s.replaceWith(d);
                    } else s.replaceWith(...s.childNodes);
                  else
                    ((c = s.nextSibling),
                      c &&
                        3 === c.nodeType &&
                        ((c.textContent =
                          (s.textContent || "") + (c.textContent || "")),
                        s.remove()));
                ((h.length = 0), t.normalize());
              }
              (this.lines.push(...f),
                this.words.push(...h),
                this.chars.push(...p));
            }),
            f &&
              this[f] &&
              this.masks.push(
                ...this[f].map((e) => {
                  let t = e.cloneNode();
                  return (
                    e.replaceWith(t),
                    t.appendChild(e),
                    e.className &&
                      (t.className = e.className.replace(
                        /(\b\w+\b)/g,
                        "$1-mask",
                      )),
                    (t.style.overflow = "clip"),
                    t
                  );
                }),
              )),
          (this.isSplit = !0),
          i &&
            (p
              ? i.addEventListener("loadingdone", this._split)
              : "loading" === i.status &&
                console.warn("SplitText called before fonts loaded")),
          (t = d && d(this)) &&
            t.totalTime &&
            (this._data.anim = C ? t.totalTime(C) : t),
          m &&
            p &&
            this.elements.forEach((e, t) => {
              ((E[t].width = e.offsetWidth), M && M.observe(e));
            }),
          this
        );
      }
      revert() {
        var e, t;
        let { orig: n, anim: r, obs: a } = this._data;
        return (
          a && a.disconnect(),
          n.forEach(({ element: e, html: t, ariaL: i, ariaH: n }) => {
            ((e.innerHTML = t),
              i
                ? e.setAttribute("aria-label", i)
                : e.removeAttribute("aria-label"),
              n
                ? e.setAttribute("aria-hidden", n)
                : e.removeAttribute("aria-hidden"));
          }),
          (this.chars.length =
            this.words.length =
            this.lines.length =
            n.length =
            this.masks.length =
              0),
          (this.isSplit = !1),
          null == i || i.removeEventListener("loadingdone", this._split),
          r && ((this._data.animTime = r.totalTime()), r.revert()),
          null == (t = (e = this.vars).onRevert) || t.call(e, this),
          this
        );
      }
      static create(t, i) {
        return new e(t, i);
      }
      static register(e) {
        ((t = t || e || window.gsap),
          t && ((a = t.utils.toArray), (l = t.core.context || l)),
          !n && window.innerWidth > 0 && ((i = document.fonts), (n = !0)));
      }
    };
    m.version = "3.13.0";
    let b = m;
    ((e.SplitText = b),
      (e.default = b),
      Object.defineProperty(e, "__esModule", { value: !0 }));
  }),
  (function (e, t) {
    "object" == typeof exports && "undefined" != typeof module
      ? (module.exports = t())
      : "function" == typeof define && define.amd
        ? define(t)
        : ((e = e || self).Swiper = t());
  })(this, function () {
    "use strict";
    var e =
        "undefined" == typeof document
          ? {
              body: {},
              addEventListener: function () {},
              removeEventListener: function () {},
              activeElement: { blur: function () {}, nodeName: "" },
              querySelector: function () {
                return null;
              },
              querySelectorAll: function () {
                return [];
              },
              getElementById: function () {
                return null;
              },
              createEvent: function () {
                return { initEvent: function () {} };
              },
              createElement: function () {
                return {
                  children: [],
                  childNodes: [],
                  style: {},
                  setAttribute: function () {},
                  getElementsByTagName: function () {
                    return [];
                  },
                };
              },
              location: { hash: "" },
            }
          : document,
      t =
        "undefined" == typeof window
          ? {
              document: e,
              navigator: { userAgent: "" },
              location: {},
              history: {},
              CustomEvent: function () {
                return this;
              },
              addEventListener: function () {},
              removeEventListener: function () {},
              getComputedStyle: function () {
                return {
                  getPropertyValue: function () {
                    return "";
                  },
                };
              },
              Image: function () {},
              Date: function () {},
              screen: {},
              setTimeout: function () {},
              clearTimeout: function () {},
            }
          : window,
      i = function (e) {
        for (var t = 0; t < e.length; t += 1) this[t] = e[t];
        return ((this.length = e.length), this);
      };
    function n(n, r) {
      var a = [],
        s = 0;
      if (n && !r && n instanceof i) return n;
      if (n)
        if ("string" == typeof n) {
          var o,
            l,
            d = n.trim();
          if (0 <= d.indexOf("<") && 0 <= d.indexOf(">")) {
            var c = "div";
            for (
              0 === d.indexOf("<li") && (c = "ul"),
                0 === d.indexOf("<tr") && (c = "tbody"),
                (0 !== d.indexOf("<td") && 0 !== d.indexOf("<th")) ||
                  (c = "tr"),
                0 === d.indexOf("<tbody") && (c = "table"),
                0 === d.indexOf("<option") && (c = "select"),
                (l = e.createElement(c)).innerHTML = d,
                s = 0;
              s < l.childNodes.length;
              s += 1
            )
              a.push(l.childNodes[s]);
          } else
            for (
              o =
                r || "#" !== n[0] || n.match(/[ .<>:~]/)
                  ? (r || e).querySelectorAll(n.trim())
                  : [e.getElementById(n.trim().split("#")[1])],
                s = 0;
              s < o.length;
              s += 1
            )
              o[s] && a.push(o[s]);
        } else if (n.nodeType || n === t || n === e) a.push(n);
        else if (0 < n.length && n[0].nodeType)
          for (s = 0; s < n.length; s += 1) a.push(n[s]);
      return new i(a);
    }
    function r(e) {
      for (var t = [], i = 0; i < e.length; i += 1)
        -1 === t.indexOf(e[i]) && t.push(e[i]);
      return t;
    }
    ((n.fn = i.prototype), (n.Class = i), (n.Dom7 = i));
    var a = {
      addClass: function (e) {
        if (void 0 === e) return this;
        for (var t = e.split(" "), i = 0; i < t.length; i += 1)
          for (var n = 0; n < this.length; n += 1)
            void 0 !== this[n] &&
              void 0 !== this[n].classList &&
              this[n].classList.add(t[i]);
        return this;
      },
      removeClass: function (e) {
        for (var t = e.split(" "), i = 0; i < t.length; i += 1)
          for (var n = 0; n < this.length; n += 1)
            void 0 !== this[n] &&
              void 0 !== this[n].classList &&
              this[n].classList.remove(t[i]);
        return this;
      },
      hasClass: function (e) {
        return !!this[0] && this[0].classList.contains(e);
      },
      toggleClass: function (e) {
        for (var t = e.split(" "), i = 0; i < t.length; i += 1)
          for (var n = 0; n < this.length; n += 1)
            void 0 !== this[n] &&
              void 0 !== this[n].classList &&
              this[n].classList.toggle(t[i]);
        return this;
      },
      attr: function (e, t) {
        var i = arguments;
        if (1 === arguments.length && "string" == typeof e)
          return this[0] ? this[0].getAttribute(e) : void 0;
        for (var n = 0; n < this.length; n += 1)
          if (2 === i.length) this[n].setAttribute(e, t);
          else
            for (var r in e)
              ((this[n][r] = e[r]), this[n].setAttribute(r, e[r]));
        return this;
      },
      removeAttr: function (e) {
        for (var t = 0; t < this.length; t += 1) this[t].removeAttribute(e);
        return this;
      },
      data: function (e, t) {
        var i;
        if (void 0 !== t) {
          for (var n = 0; n < this.length; n += 1)
            ((i = this[n]).dom7ElementDataStorage ||
              (i.dom7ElementDataStorage = {}),
              (i.dom7ElementDataStorage[e] = t));
          return this;
        }
        if ((i = this[0]))
          return i.dom7ElementDataStorage && e in i.dom7ElementDataStorage
            ? i.dom7ElementDataStorage[e]
            : i.getAttribute("data-" + e) || void 0;
      },
      transform: function (e) {
        for (var t = 0; t < this.length; t += 1) {
          var i = this[t].style;
          ((i.webkitTransform = e), (i.transform = e));
        }
        return this;
      },
      transition: function (e) {
        "string" != typeof e && (e += "ms");
        for (var t = 0; t < this.length; t += 1) {
          var i = this[t].style;
          ((i.webkitTransitionDuration = e), (i.transitionDuration = e));
        }
        return this;
      },
      on: function () {
        for (var e, t = [], i = arguments.length; i--;) t[i] = arguments[i];
        var r = t[0],
          a = t[1],
          s = t[2],
          o = t[3];
        function l(e) {
          var t = e.target;
          if (t) {
            var i = e.target.dom7EventData || [];
            if ((i.indexOf(e) < 0 && i.unshift(e), n(t).is(a))) s.apply(t, i);
            else
              for (var r = n(t).parents(), o = 0; o < r.length; o += 1)
                n(r[o]).is(a) && s.apply(r[o], i);
          }
        }
        function d(e) {
          var t = (e && e.target && e.target.dom7EventData) || [];
          (t.indexOf(e) < 0 && t.unshift(e), s.apply(this, t));
        }
        ("function" == typeof t[1] &&
          ((r = (e = t)[0]), (s = e[1]), (o = e[2]), (a = void 0)),
          o || (o = !1));
        for (var c, u = r.split(" "), p = 0; p < this.length; p += 1) {
          var h = this[p];
          if (a)
            for (c = 0; c < u.length; c += 1) {
              var f = u[c];
              (h.dom7LiveListeners || (h.dom7LiveListeners = {}),
                h.dom7LiveListeners[f] || (h.dom7LiveListeners[f] = []),
                h.dom7LiveListeners[f].push({ listener: s, proxyListener: l }),
                h.addEventListener(f, l, o));
            }
          else
            for (c = 0; c < u.length; c += 1) {
              var v = u[c];
              (h.dom7Listeners || (h.dom7Listeners = {}),
                h.dom7Listeners[v] || (h.dom7Listeners[v] = []),
                h.dom7Listeners[v].push({ listener: s, proxyListener: d }),
                h.addEventListener(v, d, o));
            }
        }
        return this;
      },
      off: function () {
        for (var e, t = [], i = arguments.length; i--;) t[i] = arguments[i];
        var n = t[0],
          r = t[1],
          a = t[2],
          s = t[3];
        ("function" == typeof t[1] &&
          ((n = (e = t)[0]), (a = e[1]), (s = e[2]), (r = void 0)),
          s || (s = !1));
        for (var o = n.split(" "), l = 0; l < o.length; l += 1)
          for (var d = o[l], c = 0; c < this.length; c += 1) {
            var u = this[c],
              p = void 0;
            if (
              (!r && u.dom7Listeners
                ? (p = u.dom7Listeners[d])
                : r && u.dom7LiveListeners && (p = u.dom7LiveListeners[d]),
              p && p.length)
            )
              for (var h = p.length - 1; 0 <= h; h -= 1) {
                var f = p[h];
                (a && f.listener === a) ||
                (a &&
                  f.listener &&
                  f.listener.dom7proxy &&
                  f.listener.dom7proxy === a)
                  ? (u.removeEventListener(d, f.proxyListener, s),
                    p.splice(h, 1))
                  : a ||
                    (u.removeEventListener(d, f.proxyListener, s),
                    p.splice(h, 1));
              }
          }
        return this;
      },
      trigger: function () {
        for (var i = [], n = arguments.length; n--;) i[n] = arguments[n];
        for (var r = i[0].split(" "), a = i[1], s = 0; s < r.length; s += 1)
          for (var o = r[s], l = 0; l < this.length; l += 1) {
            var d = this[l],
              c = void 0;
            try {
              c = new t.CustomEvent(o, {
                detail: a,
                bubbles: !0,
                cancelable: !0,
              });
            } catch (i) {
              ((c = e.createEvent("Event")).initEvent(o, !0, !0),
                (c.detail = a));
            }
            ((d.dom7EventData = i.filter(function (e, t) {
              return 0 < t;
            })),
              d.dispatchEvent(c),
              (d.dom7EventData = []),
              delete d.dom7EventData);
          }
        return this;
      },
      transitionEnd: function (e) {
        var t,
          i = ["webkitTransitionEnd", "transitionend"],
          n = this;
        function r(a) {
          if (a.target === this)
            for (e.call(this, a), t = 0; t < i.length; t += 1) n.off(i[t], r);
        }
        if (e) for (t = 0; t < i.length; t += 1) n.on(i[t], r);
        return this;
      },
      outerWidth: function (e) {
        if (0 < this.length) {
          if (e) {
            var t = this.styles();
            return (
              this[0].offsetWidth +
              parseFloat(t.getPropertyValue("margin-right")) +
              parseFloat(t.getPropertyValue("margin-left"))
            );
          }
          return this[0].offsetWidth;
        }
        return null;
      },
      outerHeight: function (e) {
        if (0 < this.length) {
          if (e) {
            var t = this.styles();
            return (
              this[0].offsetHeight +
              parseFloat(t.getPropertyValue("margin-top")) +
              parseFloat(t.getPropertyValue("margin-bottom"))
            );
          }
          return this[0].offsetHeight;
        }
        return null;
      },
      offset: function () {
        if (0 < this.length) {
          var i = this[0],
            n = i.getBoundingClientRect(),
            r = e.body,
            a = i.clientTop || r.clientTop || 0,
            s = i.clientLeft || r.clientLeft || 0,
            o = i === t ? t.scrollY : i.scrollTop,
            l = i === t ? t.scrollX : i.scrollLeft;
          return { top: n.top + o - a, left: n.left + l - s };
        }
        return null;
      },
      css: function (e, i) {
        var n;
        if (1 === arguments.length) {
          if ("string" != typeof e) {
            for (n = 0; n < this.length; n += 1)
              for (var r in e) this[n].style[r] = e[r];
            return this;
          }
          if (this[0])
            return t.getComputedStyle(this[0], null).getPropertyValue(e);
        }
        if (2 === arguments.length && "string" == typeof e) {
          for (n = 0; n < this.length; n += 1) this[n].style[e] = i;
          return this;
        }
        return this;
      },
      each: function (e) {
        if (!e) return this;
        for (var t = 0; t < this.length; t += 1)
          if (!1 === e.call(this[t], t, this[t])) return this;
        return this;
      },
      html: function (e) {
        if (void 0 === e) return this[0] ? this[0].innerHTML : void 0;
        for (var t = 0; t < this.length; t += 1) this[t].innerHTML = e;
        return this;
      },
      text: function (e) {
        if (void 0 === e) return this[0] ? this[0].textContent.trim() : null;
        for (var t = 0; t < this.length; t += 1) this[t].textContent = e;
        return this;
      },
      is: function (r) {
        var a,
          s,
          o = this[0];
        if (!o || void 0 === r) return !1;
        if ("string" == typeof r) {
          if (o.matches) return o.matches(r);
          if (o.webkitMatchesSelector) return o.webkitMatchesSelector(r);
          if (o.msMatchesSelector) return o.msMatchesSelector(r);
          for (a = n(r), s = 0; s < a.length; s += 1) if (a[s] === o) return !0;
          return !1;
        }
        if (r === e) return o === e;
        if (r === t) return o === t;
        if (r.nodeType || r instanceof i) {
          for (a = r.nodeType ? [r] : r, s = 0; s < a.length; s += 1)
            if (a[s] === o) return !0;
          return !1;
        }
        return !1;
      },
      index: function () {
        var e,
          t = this[0];
        if (t) {
          for (e = 0; null !== (t = t.previousSibling);)
            1 === t.nodeType && (e += 1);
          return e;
        }
      },
      eq: function (e) {
        if (void 0 === e) return this;
        var t,
          n = this.length;
        return new i(
          n - 1 < e
            ? []
            : e < 0
              ? (t = n + e) < 0
                ? []
                : [this[t]]
              : [this[e]],
        );
      },
      append: function () {
        for (var t, n = [], r = arguments.length; r--;) n[r] = arguments[r];
        for (var a = 0; a < n.length; a += 1) {
          t = n[a];
          for (var s = 0; s < this.length; s += 1)
            if ("string" == typeof t) {
              var o = e.createElement("div");
              for (o.innerHTML = t; o.firstChild;)
                this[s].appendChild(o.firstChild);
            } else if (t instanceof i)
              for (var l = 0; l < t.length; l += 1) this[s].appendChild(t[l]);
            else this[s].appendChild(t);
        }
        return this;
      },
      prepend: function (t) {
        var n, r;
        for (n = 0; n < this.length; n += 1)
          if ("string" == typeof t) {
            var a = e.createElement("div");
            for (a.innerHTML = t, r = a.childNodes.length - 1; 0 <= r; r -= 1)
              this[n].insertBefore(a.childNodes[r], this[n].childNodes[0]);
          } else if (t instanceof i)
            for (r = 0; r < t.length; r += 1)
              this[n].insertBefore(t[r], this[n].childNodes[0]);
          else this[n].insertBefore(t, this[n].childNodes[0]);
        return this;
      },
      next: function (e) {
        return 0 < this.length
          ? e
            ? this[0].nextElementSibling && n(this[0].nextElementSibling).is(e)
              ? new i([this[0].nextElementSibling])
              : new i([])
            : this[0].nextElementSibling
              ? new i([this[0].nextElementSibling])
              : new i([])
          : new i([]);
      },
      nextAll: function (e) {
        var t = [],
          r = this[0];
        if (!r) return new i([]);
        for (; r.nextElementSibling;) {
          var a = r.nextElementSibling;
          (e ? n(a).is(e) && t.push(a) : t.push(a), (r = a));
        }
        return new i(t);
      },
      prev: function (e) {
        if (0 < this.length) {
          var t = this[0];
          return e
            ? t.previousElementSibling && n(t.previousElementSibling).is(e)
              ? new i([t.previousElementSibling])
              : new i([])
            : t.previousElementSibling
              ? new i([t.previousElementSibling])
              : new i([]);
        }
        return new i([]);
      },
      prevAll: function (e) {
        var t = [],
          r = this[0];
        if (!r) return new i([]);
        for (; r.previousElementSibling;) {
          var a = r.previousElementSibling;
          (e ? n(a).is(e) && t.push(a) : t.push(a), (r = a));
        }
        return new i(t);
      },
      parent: function (e) {
        for (var t = [], i = 0; i < this.length; i += 1)
          null !== this[i].parentNode &&
            (e
              ? n(this[i].parentNode).is(e) && t.push(this[i].parentNode)
              : t.push(this[i].parentNode));
        return n(r(t));
      },
      parents: function (e) {
        for (var t = [], i = 0; i < this.length; i += 1)
          for (var a = this[i].parentNode; a;)
            (e ? n(a).is(e) && t.push(a) : t.push(a), (a = a.parentNode));
        return n(r(t));
      },
      closest: function (e) {
        var t = this;
        return void 0 === e
          ? new i([])
          : (t.is(e) || (t = t.parents(e).eq(0)), t);
      },
      find: function (e) {
        for (var t = [], n = 0; n < this.length; n += 1)
          for (var r = this[n].querySelectorAll(e), a = 0; a < r.length; a += 1)
            t.push(r[a]);
        return new i(t);
      },
      children: function (e) {
        for (var t = [], a = 0; a < this.length; a += 1)
          for (var s = this[a].childNodes, o = 0; o < s.length; o += 1)
            e
              ? 1 === s[o].nodeType && n(s[o]).is(e) && t.push(s[o])
              : 1 === s[o].nodeType && t.push(s[o]);
        return new i(r(t));
      },
      remove: function () {
        for (var e = 0; e < this.length; e += 1)
          this[e].parentNode && this[e].parentNode.removeChild(this[e]);
        return this;
      },
      add: function () {
        for (var e = [], t = arguments.length; t--;) e[t] = arguments[t];
        var i, r;
        for (i = 0; i < e.length; i += 1) {
          var a = n(e[i]);
          for (r = 0; r < a.length; r += 1)
            ((this[this.length] = a[r]), (this.length += 1));
        }
        return this;
      },
      styles: function () {
        return this[0] ? t.getComputedStyle(this[0], null) : {};
      },
    };
    Object.keys(a).forEach(function (e) {
      n.fn[e] = a[e];
    });
    var s,
      o,
      l,
      d,
      c = {
        deleteProps: function (e) {
          var t = e;
          Object.keys(t).forEach(function (e) {
            try {
              t[e] = null;
            } catch (e) {}
            try {
              delete t[e];
            } catch (e) {}
          });
        },
        nextTick: function (e, t) {
          return (void 0 === t && (t = 0), setTimeout(e, t));
        },
        now: function () {
          return Date.now();
        },
        getTranslate: function (e, i) {
          var n, r, a;
          void 0 === i && (i = "x");
          var s = t.getComputedStyle(e, null);
          return (
            t.WebKitCSSMatrix
              ? (6 < (r = s.transform || s.webkitTransform).split(",").length &&
                  (r = r
                    .split(", ")
                    .map(function (e) {
                      return e.replace(",", ".");
                    })
                    .join(", ")),
                (a = new t.WebKitCSSMatrix("none" === r ? "" : r)))
              : (n = (a =
                  s.MozTransform ||
                  s.OTransform ||
                  s.MsTransform ||
                  s.msTransform ||
                  s.transform ||
                  s
                    .getPropertyValue("transform")
                    .replace("translate(", "matrix(1, 0, 0, 1,"))
                  .toString()
                  .split(",")),
            "x" === i &&
              (r = t.WebKitCSSMatrix
                ? a.m41
                : 16 === n.length
                  ? parseFloat(n[12])
                  : parseFloat(n[4])),
            "y" === i &&
              (r = t.WebKitCSSMatrix
                ? a.m42
                : 16 === n.length
                  ? parseFloat(n[13])
                  : parseFloat(n[5])),
            r || 0
          );
        },
        parseUrlQuery: function (e) {
          var i,
            n,
            r,
            a,
            s = {},
            o = e || t.location.href;
          if ("string" == typeof o && o.length)
            for (
              a = (n = (o = -1 < o.indexOf("?") ? o.replace(/\S*\?/, "") : "")
                .split("&")
                .filter(function (e) {
                  return "" !== e;
                })).length,
                i = 0;
              i < a;
              i += 1
            )
              ((r = n[i].replace(/#\S+/g, "").split("=")),
                (s[decodeURIComponent(r[0])] =
                  void 0 === r[1] ? void 0 : decodeURIComponent(r[1]) || ""));
          return s;
        },
        isObject: function (e) {
          return (
            "object" == typeof e &&
            null !== e &&
            e.constructor &&
            e.constructor === Object
          );
        },
        extend: function () {
          for (var e = [], t = arguments.length; t--;) e[t] = arguments[t];
          for (var i = Object(e[0]), n = 1; n < e.length; n += 1) {
            var r = e[n];
            if (null != r)
              for (
                var a = Object.keys(Object(r)), s = 0, o = a.length;
                s < o;
                s += 1
              ) {
                var l = a[s],
                  d = Object.getOwnPropertyDescriptor(r, l);
                void 0 !== d &&
                  d.enumerable &&
                  (c.isObject(i[l]) && c.isObject(r[l])
                    ? c.extend(i[l], r[l])
                    : !c.isObject(i[l]) && c.isObject(r[l])
                      ? ((i[l] = {}), c.extend(i[l], r[l]))
                      : (i[l] = r[l]));
              }
          }
          return i;
        },
      },
      u =
        ((l = e.createElement("div")),
        {
          touch:
            (t.Modernizr && !0 === t.Modernizr.touch) ||
            !!(
              0 < t.navigator.maxTouchPoints ||
              "ontouchstart" in t ||
              (t.DocumentTouch && e instanceof t.DocumentTouch)
            ),
          pointerEvents: !!(
            t.navigator.pointerEnabled ||
            t.PointerEvent ||
            ("maxTouchPoints" in t.navigator && 0 < t.navigator.maxTouchPoints)
          ),
          prefixedPointerEvents: !!t.navigator.msPointerEnabled,
          transition:
            ((o = l.style),
            "transition" in o ||
              "webkitTransition" in o ||
              "MozTransition" in o),
          transforms3d:
            (t.Modernizr && !0 === t.Modernizr.csstransforms3d) ||
            ((s = l.style),
            "webkitPerspective" in s ||
              "MozPerspective" in s ||
              "OPerspective" in s ||
              "MsPerspective" in s ||
              "perspective" in s),
          flexbox: (function () {
            for (
              var e = l.style,
                t =
                  "alignItems webkitAlignItems webkitBoxAlign msFlexAlign mozBoxAlign webkitFlexDirection msFlexDirection mozBoxDirection mozBoxOrient webkitBoxDirection webkitBoxOrient".split(
                    " ",
                  ),
                i = 0;
              i < t.length;
              i += 1
            )
              if (t[i] in e) return !0;
            return !1;
          })(),
          observer: "MutationObserver" in t || "WebkitMutationObserver" in t,
          passiveListener: (function () {
            var e = !1;
            try {
              var i = Object.defineProperty({}, "passive", {
                get: function () {
                  e = !0;
                },
              });
              t.addEventListener("testPassiveListener", null, i);
            } catch (e) {}
            return e;
          })(),
          gestures: "ongesturestart" in t,
        }),
      p = {
        isIE:
          !!t.navigator.userAgent.match(/Trident/g) ||
          !!t.navigator.userAgent.match(/MSIE/g),
        isEdge: !!t.navigator.userAgent.match(/Edge/g),
        isSafari:
          ((d = t.navigator.userAgent.toLowerCase()),
          0 <= d.indexOf("safari") &&
            d.indexOf("chrome") < 0 &&
            d.indexOf("android") < 0),
        isUiWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(
          t.navigator.userAgent,
        ),
      },
      h = function (e) {
        void 0 === e && (e = {});
        var t = this;
        ((t.params = e),
          (t.eventsListeners = {}),
          t.params &&
            t.params.on &&
            Object.keys(t.params.on).forEach(function (e) {
              t.on(e, t.params.on[e]);
            }));
      },
      f = { components: { configurable: !0 } };
    ((h.prototype.on = function (e, t, i) {
      var n = this;
      if ("function" != typeof t) return n;
      var r = i ? "unshift" : "push";
      return (
        e.split(" ").forEach(function (e) {
          (n.eventsListeners[e] || (n.eventsListeners[e] = []),
            n.eventsListeners[e][r](t));
        }),
        n
      );
    }),
      (h.prototype.once = function (e, t, i) {
        var n = this;
        if ("function" != typeof t) return n;
        function r() {
          for (var i = [], a = arguments.length; a--;) i[a] = arguments[a];
          (t.apply(n, i), n.off(e, r), r.f7proxy && delete r.f7proxy);
        }
        return ((r.f7proxy = t), n.on(e, r, i));
      }),
      (h.prototype.off = function (e, t) {
        var i = this;
        return (
          i.eventsListeners &&
            e.split(" ").forEach(function (e) {
              void 0 === t
                ? (i.eventsListeners[e] = [])
                : i.eventsListeners[e] &&
                  i.eventsListeners[e].length &&
                  i.eventsListeners[e].forEach(function (n, r) {
                    (n === t || (n.f7proxy && n.f7proxy === t)) &&
                      i.eventsListeners[e].splice(r, 1);
                  });
            }),
          i
        );
      }),
      (h.prototype.emit = function () {
        for (var e = [], t = arguments.length; t--;) e[t] = arguments[t];
        var i,
          n,
          r,
          a = this;
        return (
          a.eventsListeners &&
            ("string" == typeof e[0] || Array.isArray(e[0])
              ? ((i = e[0]), (n = e.slice(1, e.length)), (r = a))
              : ((i = e[0].events), (n = e[0].data), (r = e[0].context || a)),
            (Array.isArray(i) ? i : i.split(" ")).forEach(function (e) {
              if (a.eventsListeners && a.eventsListeners[e]) {
                var t = [];
                (a.eventsListeners[e].forEach(function (e) {
                  t.push(e);
                }),
                  t.forEach(function (e) {
                    e.apply(r, n);
                  }));
              }
            })),
          a
        );
      }),
      (h.prototype.useModulesParams = function (e) {
        var t = this;
        t.modules &&
          Object.keys(t.modules).forEach(function (i) {
            var n = t.modules[i];
            n.params && c.extend(e, n.params);
          });
      }),
      (h.prototype.useModules = function (e) {
        void 0 === e && (e = {});
        var t = this;
        t.modules &&
          Object.keys(t.modules).forEach(function (i) {
            var n = t.modules[i],
              r = e[i] || {};
            (n.instance &&
              Object.keys(n.instance).forEach(function (e) {
                var i = n.instance[e];
                t[e] = "function" == typeof i ? i.bind(t) : i;
              }),
              n.on &&
                t.on &&
                Object.keys(n.on).forEach(function (e) {
                  t.on(e, n.on[e]);
                }),
              n.create && n.create.bind(t)(r));
          });
      }),
      (f.components.set = function (e) {
        this.use && this.use(e);
      }),
      (h.installModule = function (e) {
        for (var t = [], i = arguments.length - 1; 0 < i--;)
          t[i] = arguments[i + 1];
        var n = this;
        n.prototype.modules || (n.prototype.modules = {});
        var r =
          e.name || Object.keys(n.prototype.modules).length + "_" + c.now();
        return (
          (n.prototype.modules[r] = e).proto &&
            Object.keys(e.proto).forEach(function (t) {
              n.prototype[t] = e.proto[t];
            }),
          e.static &&
            Object.keys(e.static).forEach(function (t) {
              n[t] = e.static[t];
            }),
          e.install && e.install.apply(n, t),
          n
        );
      }),
      (h.use = function (e) {
        for (var t = [], i = arguments.length - 1; 0 < i--;)
          t[i] = arguments[i + 1];
        var n = this;
        return Array.isArray(e)
          ? (e.forEach(function (e) {
              return n.installModule(e);
            }),
            n)
          : n.installModule.apply(n, [e].concat(t));
      }),
      Object.defineProperties(h, f));
    var v = {
        updateSize: function () {
          var e,
            t,
            i = this,
            n = i.$el;
          ((e = void 0 !== i.params.width ? i.params.width : n[0].clientWidth),
            (t =
              void 0 !== i.params.height ? i.params.height : n[0].clientHeight),
            (0 === e && i.isHorizontal()) ||
              (0 === t && i.isVertical()) ||
              ((e =
                e -
                parseInt(n.css("padding-left"), 10) -
                parseInt(n.css("padding-right"), 10)),
              (t =
                t -
                parseInt(n.css("padding-top"), 10) -
                parseInt(n.css("padding-bottom"), 10)),
              c.extend(i, {
                width: e,
                height: t,
                size: i.isHorizontal() ? e : t,
              })));
        },
        updateSlides: function () {
          var e = this,
            i = e.params,
            n = e.$wrapperEl,
            r = e.size,
            a = e.rtlTranslate,
            s = e.wrongRTL,
            o = e.virtual && i.virtual.enabled,
            l = o ? e.virtual.slides.length : e.slides.length,
            d = n.children("." + e.params.slideClass),
            p = o ? e.virtual.slides.length : d.length,
            h = [],
            f = [],
            v = [],
            g = i.slidesOffsetBefore;
          "function" == typeof g && (g = i.slidesOffsetBefore.call(e));
          var m = i.slidesOffsetAfter;
          "function" == typeof m && (m = i.slidesOffsetAfter.call(e));
          var b = e.snapGrid.length,
            x = e.snapGrid.length,
            y = i.spaceBetween,
            w = -g,
            S = 0,
            T = 0;
          if (void 0 !== r) {
            var E, C;
            ("string" == typeof y &&
              0 <= y.indexOf("%") &&
              (y = (parseFloat(y.replace("%", "")) / 100) * r),
              (e.virtualSize = -y),
              a
                ? d.css({ marginLeft: "", marginTop: "" })
                : d.css({ marginRight: "", marginBottom: "" }),
              1 < i.slidesPerColumn &&
                ((E =
                  Math.floor(p / i.slidesPerColumn) ===
                  p / e.params.slidesPerColumn
                    ? p
                    : Math.ceil(p / i.slidesPerColumn) * i.slidesPerColumn),
                "auto" !== i.slidesPerView &&
                  "row" === i.slidesPerColumnFill &&
                  (E = Math.max(E, i.slidesPerView * i.slidesPerColumn))));
            for (
              var M,
                P = i.slidesPerColumn,
                k = E / P,
                z = Math.floor(p / i.slidesPerColumn),
                L = 0;
              L < p;
              L += 1
            ) {
              C = 0;
              var I = d.eq(L);
              if (1 < i.slidesPerColumn) {
                var A = void 0,
                  O = void 0,
                  _ = void 0;
                ("column" === i.slidesPerColumnFill
                  ? ((_ = L - (O = Math.floor(L / P)) * P),
                    (z < O || (O === z && _ === P - 1)) &&
                      P <= (_ += 1) &&
                      ((_ = 0), (O += 1)),
                    (A = O + (_ * E) / P),
                    I.css({
                      "-webkit-box-ordinal-group": A,
                      "-moz-box-ordinal-group": A,
                      "-ms-flex-order": A,
                      "-webkit-order": A,
                      order: A,
                    }))
                  : (O = L - (_ = Math.floor(L / k)) * k),
                  I.css(
                    "margin-" + (e.isHorizontal() ? "top" : "left"),
                    0 !== _ && i.spaceBetween && i.spaceBetween + "px",
                  )
                    .attr("data-swiper-column", O)
                    .attr("data-swiper-row", _));
              }
              if ("none" !== I.css("display")) {
                if ("auto" === i.slidesPerView) {
                  var D = t.getComputedStyle(I[0], null),
                    N = I[0].style.transform,
                    $ = I[0].style.webkitTransform;
                  if (
                    (N && (I[0].style.transform = "none"),
                    $ && (I[0].style.webkitTransform = "none"),
                    i.roundLengths)
                  )
                    C = e.isHorizontal() ? I.outerWidth(!0) : I.outerHeight(!0);
                  else if (e.isHorizontal()) {
                    var F = parseFloat(D.getPropertyValue("width")),
                      H = parseFloat(D.getPropertyValue("padding-left")),
                      R = parseFloat(D.getPropertyValue("padding-right")),
                      B = parseFloat(D.getPropertyValue("margin-left")),
                      X = parseFloat(D.getPropertyValue("margin-right")),
                      Y = D.getPropertyValue("box-sizing");
                    C = Y && "border-box" === Y ? F + B + X : F + H + R + B + X;
                  } else {
                    var V = parseFloat(D.getPropertyValue("height")),
                      G = parseFloat(D.getPropertyValue("padding-top")),
                      W = parseFloat(D.getPropertyValue("padding-bottom")),
                      j = parseFloat(D.getPropertyValue("margin-top")),
                      q = parseFloat(D.getPropertyValue("margin-bottom")),
                      U = D.getPropertyValue("box-sizing");
                    C = U && "border-box" === U ? V + j + q : V + G + W + j + q;
                  }
                  (N && (I[0].style.transform = N),
                    $ && (I[0].style.webkitTransform = $),
                    i.roundLengths && (C = Math.floor(C)));
                } else
                  ((C = (r - (i.slidesPerView - 1) * y) / i.slidesPerView),
                    i.roundLengths && (C = Math.floor(C)),
                    d[L] &&
                      (e.isHorizontal()
                        ? (d[L].style.width = C + "px")
                        : (d[L].style.height = C + "px")));
                (d[L] && (d[L].swiperSlideSize = C),
                  v.push(C),
                  i.centeredSlides
                    ? ((w = w + C / 2 + S / 2 + y),
                      0 === S && 0 !== L && (w = w - r / 2 - y),
                      0 === L && (w = w - r / 2 - y),
                      Math.abs(w) < 0.001 && (w = 0),
                      i.roundLengths && (w = Math.floor(w)),
                      T % i.slidesPerGroup == 0 && h.push(w),
                      f.push(w))
                    : (i.roundLengths && (w = Math.floor(w)),
                      T % i.slidesPerGroup == 0 && h.push(w),
                      f.push(w),
                      (w = w + C + y)),
                  (e.virtualSize += C + y),
                  (S = C),
                  (T += 1));
              }
            }
            if (
              ((e.virtualSize = Math.max(e.virtualSize, r) + m),
              a &&
                s &&
                ("slide" === i.effect || "coverflow" === i.effect) &&
                n.css({ width: e.virtualSize + i.spaceBetween + "px" }),
              (u.flexbox && !i.setWrapperSize) ||
                (e.isHorizontal()
                  ? n.css({ width: e.virtualSize + i.spaceBetween + "px" })
                  : n.css({ height: e.virtualSize + i.spaceBetween + "px" })),
              1 < i.slidesPerColumn &&
                ((e.virtualSize = (C + i.spaceBetween) * E),
                (e.virtualSize =
                  Math.ceil(e.virtualSize / i.slidesPerColumn) -
                  i.spaceBetween),
                e.isHorizontal()
                  ? n.css({ width: e.virtualSize + i.spaceBetween + "px" })
                  : n.css({ height: e.virtualSize + i.spaceBetween + "px" }),
                i.centeredSlides))
            ) {
              M = [];
              for (var K = 0; K < h.length; K += 1) {
                var Z = h[K];
                (i.roundLengths && (Z = Math.floor(Z)),
                  h[K] < e.virtualSize + h[0] && M.push(Z));
              }
              h = M;
            }
            if (!i.centeredSlides) {
              M = [];
              for (var Q = 0; Q < h.length; Q += 1) {
                var J = h[Q];
                (i.roundLengths && (J = Math.floor(J)),
                  h[Q] <= e.virtualSize - r && M.push(J));
              }
              ((h = M),
                1 <
                  Math.floor(e.virtualSize - r) - Math.floor(h[h.length - 1]) &&
                  h.push(e.virtualSize - r));
            }
            if (
              (0 === h.length && (h = [0]),
              0 !== i.spaceBetween &&
                (e.isHorizontal()
                  ? a
                    ? d.css({ marginLeft: y + "px" })
                    : d.css({ marginRight: y + "px" })
                  : d.css({ marginBottom: y + "px" })),
              i.centerInsufficientSlides)
            ) {
              var ee = 0;
              if (
                (v.forEach(function (e) {
                  ee += e + (i.spaceBetween ? i.spaceBetween : 0);
                }),
                (ee -= i.spaceBetween) < r)
              ) {
                var te = (r - ee) / 2;
                (h.forEach(function (e, t) {
                  h[t] = e - te;
                }),
                  f.forEach(function (e, t) {
                    f[t] = e + te;
                  }));
              }
            }
            (c.extend(e, {
              slides: d,
              snapGrid: h,
              slidesGrid: f,
              slidesSizesGrid: v,
            }),
              p !== l && e.emit("slidesLengthChange"),
              h.length !== b &&
                (e.params.watchOverflow && e.checkOverflow(),
                e.emit("snapGridLengthChange")),
              f.length !== x && e.emit("slidesGridLengthChange"),
              (i.watchSlidesProgress || i.watchSlidesVisibility) &&
                e.updateSlidesOffset());
          }
        },
        updateAutoHeight: function (e) {
          var t,
            i = this,
            n = [],
            r = 0;
          if (
            ("number" == typeof e
              ? i.setTransition(e)
              : !0 === e && i.setTransition(i.params.speed),
            "auto" !== i.params.slidesPerView && 1 < i.params.slidesPerView)
          )
            for (t = 0; t < Math.ceil(i.params.slidesPerView); t += 1) {
              var a = i.activeIndex + t;
              if (a > i.slides.length) break;
              n.push(i.slides.eq(a)[0]);
            }
          else n.push(i.slides.eq(i.activeIndex)[0]);
          for (t = 0; t < n.length; t += 1)
            if (void 0 !== n[t]) {
              var s = n[t].offsetHeight;
              r = r < s ? s : r;
            }
          r && i.$wrapperEl.css("height", r + "px");
        },
        updateSlidesOffset: function () {
          for (var e = this.slides, t = 0; t < e.length; t += 1)
            e[t].swiperSlideOffset = this.isHorizontal()
              ? e[t].offsetLeft
              : e[t].offsetTop;
        },
        updateSlidesProgress: function (e) {
          void 0 === e && (e = (this && this.translate) || 0);
          var t = this,
            i = t.params,
            r = t.slides,
            a = t.rtlTranslate;
          if (0 !== r.length) {
            void 0 === r[0].swiperSlideOffset && t.updateSlidesOffset();
            var s = -e;
            (a && (s = e),
              r.removeClass(i.slideVisibleClass),
              (t.visibleSlidesIndexes = []),
              (t.visibleSlides = []));
            for (var o = 0; o < r.length; o += 1) {
              var l = r[o],
                d =
                  (s +
                    (i.centeredSlides ? t.minTranslate() : 0) -
                    l.swiperSlideOffset) /
                  (l.swiperSlideSize + i.spaceBetween);
              if (i.watchSlidesVisibility) {
                var c = -(s - l.swiperSlideOffset),
                  u = c + t.slidesSizesGrid[o];
                ((0 <= c && c < t.size) ||
                  (0 < u && u <= t.size) ||
                  (c <= 0 && u >= t.size)) &&
                  (t.visibleSlides.push(l),
                  t.visibleSlidesIndexes.push(o),
                  r.eq(o).addClass(i.slideVisibleClass));
              }
              l.progress = a ? -d : d;
            }
            t.visibleSlides = n(t.visibleSlides);
          }
        },
        updateProgress: function (e) {
          void 0 === e && (e = (this && this.translate) || 0);
          var t = this,
            i = t.params,
            n = t.maxTranslate() - t.minTranslate(),
            r = t.progress,
            a = t.isBeginning,
            s = t.isEnd,
            o = a,
            l = s;
          (0 === n
            ? (s = a = !(r = 0))
            : ((a = (r = (e - t.minTranslate()) / n) <= 0), (s = 1 <= r)),
            c.extend(t, { progress: r, isBeginning: a, isEnd: s }),
            (i.watchSlidesProgress || i.watchSlidesVisibility) &&
              t.updateSlidesProgress(e),
            a && !o && t.emit("reachBeginning toEdge"),
            s && !l && t.emit("reachEnd toEdge"),
            ((o && !a) || (l && !s)) && t.emit("fromEdge"),
            t.emit("progress", r));
        },
        updateSlidesClasses: function () {
          var e,
            t = this,
            i = t.slides,
            n = t.params,
            r = t.$wrapperEl,
            a = t.activeIndex,
            s = t.realIndex,
            o = t.virtual && n.virtual.enabled;
          (i.removeClass(
            n.slideActiveClass +
              " " +
              n.slideNextClass +
              " " +
              n.slidePrevClass +
              " " +
              n.slideDuplicateActiveClass +
              " " +
              n.slideDuplicateNextClass +
              " " +
              n.slideDuplicatePrevClass,
          ),
            (e = o
              ? t.$wrapperEl.find(
                  "." + n.slideClass + '[data-swiper-slide-index="' + a + '"]',
                )
              : i.eq(a)).addClass(n.slideActiveClass),
            n.loop &&
              (e.hasClass(n.slideDuplicateClass)
                ? r
                    .children(
                      "." +
                        n.slideClass +
                        ":not(." +
                        n.slideDuplicateClass +
                        ')[data-swiper-slide-index="' +
                        s +
                        '"]',
                    )
                    .addClass(n.slideDuplicateActiveClass)
                : r
                    .children(
                      "." +
                        n.slideClass +
                        "." +
                        n.slideDuplicateClass +
                        '[data-swiper-slide-index="' +
                        s +
                        '"]',
                    )
                    .addClass(n.slideDuplicateActiveClass)));
          var l = e
            .nextAll("." + n.slideClass)
            .eq(0)
            .addClass(n.slideNextClass);
          n.loop && 0 === l.length && (l = i.eq(0)).addClass(n.slideNextClass);
          var d = e
            .prevAll("." + n.slideClass)
            .eq(0)
            .addClass(n.slidePrevClass);
          (n.loop &&
            0 === d.length &&
            (d = i.eq(-1)).addClass(n.slidePrevClass),
            n.loop &&
              (l.hasClass(n.slideDuplicateClass)
                ? r
                    .children(
                      "." +
                        n.slideClass +
                        ":not(." +
                        n.slideDuplicateClass +
                        ')[data-swiper-slide-index="' +
                        l.attr("data-swiper-slide-index") +
                        '"]',
                    )
                    .addClass(n.slideDuplicateNextClass)
                : r
                    .children(
                      "." +
                        n.slideClass +
                        "." +
                        n.slideDuplicateClass +
                        '[data-swiper-slide-index="' +
                        l.attr("data-swiper-slide-index") +
                        '"]',
                    )
                    .addClass(n.slideDuplicateNextClass),
              d.hasClass(n.slideDuplicateClass)
                ? r
                    .children(
                      "." +
                        n.slideClass +
                        ":not(." +
                        n.slideDuplicateClass +
                        ')[data-swiper-slide-index="' +
                        d.attr("data-swiper-slide-index") +
                        '"]',
                    )
                    .addClass(n.slideDuplicatePrevClass)
                : r
                    .children(
                      "." +
                        n.slideClass +
                        "." +
                        n.slideDuplicateClass +
                        '[data-swiper-slide-index="' +
                        d.attr("data-swiper-slide-index") +
                        '"]',
                    )
                    .addClass(n.slideDuplicatePrevClass)));
        },
        updateActiveIndex: function (e) {
          var t,
            i = this,
            n = i.rtlTranslate ? i.translate : -i.translate,
            r = i.slidesGrid,
            a = i.snapGrid,
            s = i.params,
            o = i.activeIndex,
            l = i.realIndex,
            d = i.snapIndex,
            u = e;
          if (void 0 === u) {
            for (var p = 0; p < r.length; p += 1)
              void 0 !== r[p + 1]
                ? n >= r[p] && n < r[p + 1] - (r[p + 1] - r[p]) / 2
                  ? (u = p)
                  : n >= r[p] && n < r[p + 1] && (u = p + 1)
                : n >= r[p] && (u = p);
            s.normalizeSlideIndex && (u < 0 || void 0 === u) && (u = 0);
          }
          if (
            ((t =
              0 <= a.indexOf(n)
                ? a.indexOf(n)
                : Math.floor(u / s.slidesPerGroup)) >= a.length &&
              (t = a.length - 1),
            u !== o)
          ) {
            var h = parseInt(
              i.slides.eq(u).attr("data-swiper-slide-index") || u,
              10,
            );
            (c.extend(i, {
              snapIndex: t,
              realIndex: h,
              previousIndex: o,
              activeIndex: u,
            }),
              i.emit("activeIndexChange"),
              i.emit("snapIndexChange"),
              l !== h && i.emit("realIndexChange"),
              i.emit("slideChange"));
          } else t !== d && ((i.snapIndex = t), i.emit("snapIndexChange"));
        },
        updateClickedSlide: function (e) {
          var t = this,
            i = t.params,
            r = n(e.target).closest("." + i.slideClass)[0],
            a = !1;
          if (r)
            for (var s = 0; s < t.slides.length; s += 1)
              t.slides[s] === r && (a = !0);
          if (!r || !a)
            return ((t.clickedSlide = void 0), void (t.clickedIndex = void 0));
          ((t.clickedSlide = r),
            t.virtual && t.params.virtual.enabled
              ? (t.clickedIndex = parseInt(
                  n(r).attr("data-swiper-slide-index"),
                  10,
                ))
              : (t.clickedIndex = n(r).index()),
            i.slideToClickedSlide &&
              void 0 !== t.clickedIndex &&
              t.clickedIndex !== t.activeIndex &&
              t.slideToClickedSlide());
        },
      },
      g = {
        getTranslate: function (e) {
          void 0 === e && (e = this.isHorizontal() ? "x" : "y");
          var t = this.params,
            i = this.rtlTranslate,
            n = this.translate,
            r = this.$wrapperEl;
          if (t.virtualTranslate) return i ? -n : n;
          var a = c.getTranslate(r[0], e);
          return (i && (a = -a), a || 0);
        },
        setTranslate: function (e, t) {
          var i = this,
            n = i.rtlTranslate,
            r = i.params,
            a = i.$wrapperEl,
            s = i.progress,
            o = 0,
            l = 0;
          (i.isHorizontal() ? (o = n ? -e : e) : (l = e),
            r.roundLengths && ((o = Math.floor(o)), (l = Math.floor(l))),
            r.virtualTranslate ||
              (u.transforms3d
                ? a.transform("translate3d(" + o + "px, " + l + "px, 0px)")
                : a.transform("translate(" + o + "px, " + l + "px)")),
            (i.previousTranslate = i.translate),
            (i.translate = i.isHorizontal() ? o : l));
          var d = i.maxTranslate() - i.minTranslate();
          ((0 === d ? 0 : (e - i.minTranslate()) / d) !== s &&
            i.updateProgress(e),
            i.emit("setTranslate", i.translate, t));
        },
        minTranslate: function () {
          return -this.snapGrid[0];
        },
        maxTranslate: function () {
          return -this.snapGrid[this.snapGrid.length - 1];
        },
      },
      m = {
        slideTo: function (e, t, i, n) {
          (void 0 === e && (e = 0),
            void 0 === t && (t = this.params.speed),
            void 0 === i && (i = !0));
          var r = this,
            a = e;
          a < 0 && (a = 0);
          var s = r.params,
            o = r.snapGrid,
            l = r.slidesGrid,
            d = r.previousIndex,
            c = r.activeIndex,
            p = r.rtlTranslate;
          if (r.animating && s.preventInteractionOnTransition) return !1;
          var h = Math.floor(a / s.slidesPerGroup);
          (h >= o.length && (h = o.length - 1),
            (c || s.initialSlide || 0) === (d || 0) &&
              i &&
              r.emit("beforeSlideChangeStart"));
          var f,
            v = -o[h];
          if ((r.updateProgress(v), s.normalizeSlideIndex))
            for (var g = 0; g < l.length; g += 1)
              -Math.floor(100 * v) >= Math.floor(100 * l[g]) && (a = g);
          if (r.initialized && a !== c) {
            if (!r.allowSlideNext && v < r.translate && v < r.minTranslate())
              return !1;
            if (
              !r.allowSlidePrev &&
              v > r.translate &&
              v > r.maxTranslate() &&
              (c || 0) !== a
            )
              return !1;
          }
          return (
            (f = c < a ? "next" : a < c ? "prev" : "reset"),
            (p && -v === r.translate) || (!p && v === r.translate)
              ? (r.updateActiveIndex(a),
                s.autoHeight && r.updateAutoHeight(),
                r.updateSlidesClasses(),
                "slide" !== s.effect && r.setTranslate(v),
                "reset" !== f &&
                  (r.transitionStart(i, f), r.transitionEnd(i, f)),
                !1)
              : (0 !== t && u.transition
                  ? (r.setTransition(t),
                    r.setTranslate(v),
                    r.updateActiveIndex(a),
                    r.updateSlidesClasses(),
                    r.emit("beforeTransitionStart", t, n),
                    r.transitionStart(i, f),
                    r.animating ||
                      ((r.animating = !0),
                      r.onSlideToWrapperTransitionEnd ||
                        (r.onSlideToWrapperTransitionEnd = function (e) {
                          r &&
                            !r.destroyed &&
                            e.target === this &&
                            (r.$wrapperEl[0].removeEventListener(
                              "transitionend",
                              r.onSlideToWrapperTransitionEnd,
                            ),
                            r.$wrapperEl[0].removeEventListener(
                              "webkitTransitionEnd",
                              r.onSlideToWrapperTransitionEnd,
                            ),
                            (r.onSlideToWrapperTransitionEnd = null),
                            delete r.onSlideToWrapperTransitionEnd,
                            r.transitionEnd(i, f));
                        }),
                      r.$wrapperEl[0].addEventListener(
                        "transitionend",
                        r.onSlideToWrapperTransitionEnd,
                      ),
                      r.$wrapperEl[0].addEventListener(
                        "webkitTransitionEnd",
                        r.onSlideToWrapperTransitionEnd,
                      )))
                  : (r.setTransition(0),
                    r.setTranslate(v),
                    r.updateActiveIndex(a),
                    r.updateSlidesClasses(),
                    r.emit("beforeTransitionStart", t, n),
                    r.transitionStart(i, f),
                    r.transitionEnd(i, f)),
                !0)
          );
        },
        slideToLoop: function (e, t, i, n) {
          (void 0 === e && (e = 0),
            void 0 === t && (t = this.params.speed),
            void 0 === i && (i = !0));
          var r = e;
          return (
            this.params.loop && (r += this.loopedSlides),
            this.slideTo(r, t, i, n)
          );
        },
        slideNext: function (e, t, i) {
          (void 0 === e && (e = this.params.speed), void 0 === t && (t = !0));
          var n = this,
            r = n.params,
            a = n.animating;
          return r.loop
            ? !a &&
                (n.loopFix(),
                (n._clientLeft = n.$wrapperEl[0].clientLeft),
                n.slideTo(n.activeIndex + r.slidesPerGroup, e, t, i))
            : n.slideTo(n.activeIndex + r.slidesPerGroup, e, t, i);
        },
        slidePrev: function (e, t, i) {
          (void 0 === e && (e = this.params.speed), void 0 === t && (t = !0));
          var n = this,
            r = n.params,
            a = n.animating,
            s = n.snapGrid,
            o = n.slidesGrid,
            l = n.rtlTranslate;
          if (r.loop) {
            if (a) return !1;
            (n.loopFix(), (n._clientLeft = n.$wrapperEl[0].clientLeft));
          }
          function d(e) {
            return e < 0 ? -Math.floor(Math.abs(e)) : Math.floor(e);
          }
          var c,
            u = d(l ? n.translate : -n.translate),
            p = s.map(function (e) {
              return d(e);
            }),
            h =
              (o.map(function (e) {
                return d(e);
              }),
              s[p.indexOf(u)],
              s[p.indexOf(u) - 1]);
          return (
            void 0 !== h && (c = o.indexOf(h)) < 0 && (c = n.activeIndex - 1),
            n.slideTo(c, e, t, i)
          );
        },
        slideReset: function (e, t, i) {
          return (
            void 0 === e && (e = this.params.speed),
            void 0 === t && (t = !0),
            this.slideTo(this.activeIndex, e, t, i)
          );
        },
        slideToClosest: function (e, t, i) {
          (void 0 === e && (e = this.params.speed), void 0 === t && (t = !0));
          var n = this,
            r = n.activeIndex,
            a = Math.floor(r / n.params.slidesPerGroup);
          if (a < n.snapGrid.length - 1) {
            var s = n.rtlTranslate ? n.translate : -n.translate,
              o = n.snapGrid[a];
            (n.snapGrid[a + 1] - o) / 2 < s - o &&
              (r = n.params.slidesPerGroup);
          }
          return n.slideTo(r, e, t, i);
        },
        slideToClickedSlide: function () {
          var e,
            t = this,
            i = t.params,
            r = t.$wrapperEl,
            a =
              "auto" === i.slidesPerView
                ? t.slidesPerViewDynamic()
                : i.slidesPerView,
            s = t.clickedIndex;
          if (i.loop) {
            if (t.animating) return;
            ((e = parseInt(
              n(t.clickedSlide).attr("data-swiper-slide-index"),
              10,
            )),
              i.centeredSlides
                ? s < t.loopedSlides - a / 2 ||
                  s > t.slides.length - t.loopedSlides + a / 2
                  ? (t.loopFix(),
                    (s = r
                      .children(
                        "." +
                          i.slideClass +
                          '[data-swiper-slide-index="' +
                          e +
                          '"]:not(.' +
                          i.slideDuplicateClass +
                          ")",
                      )
                      .eq(0)
                      .index()),
                    c.nextTick(function () {
                      t.slideTo(s);
                    }))
                  : t.slideTo(s)
                : s > t.slides.length - a
                  ? (t.loopFix(),
                    (s = r
                      .children(
                        "." +
                          i.slideClass +
                          '[data-swiper-slide-index="' +
                          e +
                          '"]:not(.' +
                          i.slideDuplicateClass +
                          ")",
                      )
                      .eq(0)
                      .index()),
                    c.nextTick(function () {
                      t.slideTo(s);
                    }))
                  : t.slideTo(s));
          } else t.slideTo(s);
        },
      },
      b = {
        loopCreate: function () {
          var t = this,
            i = t.params,
            r = t.$wrapperEl;
          r.children("." + i.slideClass + "." + i.slideDuplicateClass).remove();
          var a = r.children("." + i.slideClass);
          if (i.loopFillGroupWithBlank) {
            var s = i.slidesPerGroup - (a.length % i.slidesPerGroup);
            if (s !== i.slidesPerGroup) {
              for (var o = 0; o < s; o += 1) {
                var l = n(e.createElement("div")).addClass(
                  i.slideClass + " " + i.slideBlankClass,
                );
                r.append(l);
              }
              a = r.children("." + i.slideClass);
            }
          }
          ("auto" !== i.slidesPerView ||
            i.loopedSlides ||
            (i.loopedSlides = a.length),
            (t.loopedSlides = parseInt(i.loopedSlides || i.slidesPerView, 10)),
            (t.loopedSlides += i.loopAdditionalSlides),
            t.loopedSlides > a.length && (t.loopedSlides = a.length));
          var d = [],
            c = [];
          a.each(function (e, i) {
            var r = n(i);
            (e < t.loopedSlides && c.push(i),
              e < a.length && e >= a.length - t.loopedSlides && d.push(i),
              r.attr("data-swiper-slide-index", e));
          });
          for (var u = 0; u < c.length; u += 1)
            r.append(n(c[u].cloneNode(!0)).addClass(i.slideDuplicateClass));
          for (var p = d.length - 1; 0 <= p; p -= 1)
            r.prepend(n(d[p].cloneNode(!0)).addClass(i.slideDuplicateClass));
        },
        loopFix: function () {
          var e,
            t = this,
            i = t.params,
            n = t.activeIndex,
            r = t.slides,
            a = t.loopedSlides,
            s = t.allowSlidePrev,
            o = t.allowSlideNext,
            l = t.snapGrid,
            d = t.rtlTranslate;
          ((t.allowSlidePrev = !0), (t.allowSlideNext = !0));
          var c = -l[n] - t.getTranslate();
          (n < a
            ? ((e = r.length - 3 * a + n),
              (e += a),
              t.slideTo(e, 0, !1, !0) &&
                0 !== c &&
                t.setTranslate((d ? -t.translate : t.translate) - c))
            : (("auto" === i.slidesPerView && 2 * a <= n) ||
                n >= r.length - a) &&
              ((e = -r.length + n + a),
              (e += a),
              t.slideTo(e, 0, !1, !0) &&
                0 !== c &&
                t.setTranslate((d ? -t.translate : t.translate) - c)),
            (t.allowSlidePrev = s),
            (t.allowSlideNext = o));
        },
        loopDestroy: function () {
          var e = this.$wrapperEl,
            t = this.params,
            i = this.slides;
          (e
            .children(
              "." +
                t.slideClass +
                "." +
                t.slideDuplicateClass +
                ",." +
                t.slideClass +
                "." +
                t.slideBlankClass,
            )
            .remove(),
            i.removeAttr("data-swiper-slide-index"));
        },
      },
      x = {
        setGrabCursor: function (e) {
          if (!(
            u.touch ||
            !this.params.simulateTouch ||
            (this.params.watchOverflow && this.isLocked)
          )) {
            var t = this.el;
            ((t.style.cursor = "move"),
              (t.style.cursor = e ? "-webkit-grabbing" : "-webkit-grab"),
              (t.style.cursor = e ? "-moz-grabbin" : "-moz-grab"),
              (t.style.cursor = e ? "grabbing" : "grab"));
          }
        },
        unsetGrabCursor: function () {
          u.touch ||
            (this.params.watchOverflow && this.isLocked) ||
            (this.el.style.cursor = "");
        },
      },
      y = {
        appendSlide: function (e) {
          var t = this,
            i = t.$wrapperEl,
            n = t.params;
          if (
            (n.loop && t.loopDestroy(), "object" == typeof e && "length" in e)
          )
            for (var r = 0; r < e.length; r += 1) e[r] && i.append(e[r]);
          else i.append(e);
          (n.loop && t.loopCreate(), (n.observer && u.observer) || t.update());
        },
        prependSlide: function (e) {
          var t = this,
            i = t.params,
            n = t.$wrapperEl,
            r = t.activeIndex;
          i.loop && t.loopDestroy();
          var a = r + 1;
          if ("object" == typeof e && "length" in e) {
            for (var s = 0; s < e.length; s += 1) e[s] && n.prepend(e[s]);
            a = r + e.length;
          } else n.prepend(e);
          (i.loop && t.loopCreate(),
            (i.observer && u.observer) || t.update(),
            t.slideTo(a, 0, !1));
        },
        addSlide: function (e, t) {
          var i = this,
            n = i.$wrapperEl,
            r = i.params,
            a = i.activeIndex;
          r.loop &&
            ((a -= i.loopedSlides),
            i.loopDestroy(),
            (i.slides = n.children("." + r.slideClass)));
          var s = i.slides.length;
          if (e <= 0) i.prependSlide(t);
          else if (s <= e) i.appendSlide(t);
          else {
            for (var o = e < a ? a + 1 : a, l = [], d = s - 1; e <= d; d -= 1) {
              var c = i.slides.eq(d);
              (c.remove(), l.unshift(c));
            }
            if ("object" == typeof t && "length" in t) {
              for (var p = 0; p < t.length; p += 1) t[p] && n.append(t[p]);
              o = e < a ? a + t.length : a;
            } else n.append(t);
            for (var h = 0; h < l.length; h += 1) n.append(l[h]);
            (r.loop && i.loopCreate(),
              (r.observer && u.observer) || i.update(),
              r.loop
                ? i.slideTo(o + i.loopedSlides, 0, !1)
                : i.slideTo(o, 0, !1));
          }
        },
        removeSlide: function (e) {
          var t = this,
            i = t.params,
            n = t.$wrapperEl,
            r = t.activeIndex;
          i.loop &&
            ((r -= t.loopedSlides),
            t.loopDestroy(),
            (t.slides = n.children("." + i.slideClass)));
          var a,
            s = r;
          if ("object" == typeof e && "length" in e) {
            for (var o = 0; o < e.length; o += 1)
              ((a = e[o]),
                t.slides[a] && t.slides.eq(a).remove(),
                a < s && (s -= 1));
            s = Math.max(s, 0);
          } else
            ((a = e),
              t.slides[a] && t.slides.eq(a).remove(),
              a < s && (s -= 1),
              (s = Math.max(s, 0)));
          (i.loop && t.loopCreate(),
            (i.observer && u.observer) || t.update(),
            i.loop
              ? t.slideTo(s + t.loopedSlides, 0, !1)
              : t.slideTo(s, 0, !1));
        },
        removeAllSlides: function () {
          for (var e = [], t = 0; t < this.slides.length; t += 1) e.push(t);
          this.removeSlide(e);
        },
      },
      w = (function () {
        var i = t.navigator.userAgent,
          n = {
            ios: !1,
            android: !1,
            androidChrome: !1,
            desktop: !1,
            windows: !1,
            iphone: !1,
            ipod: !1,
            ipad: !1,
            cordova: t.cordova || t.phonegap,
            phonegap: t.cordova || t.phonegap,
          },
          r = i.match(/(Windows Phone);?[\s\/]+([\d.]+)?/),
          a = i.match(/(Android);?[\s\/]+([\d.]+)?/),
          s = i.match(/(iPad).*OS\s([\d_]+)/),
          o = i.match(/(iPod)(.*OS\s([\d_]+))?/),
          l = !s && i.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
        if (
          (r && ((n.os = "windows"), (n.osVersion = r[2]), (n.windows = !0)),
          a &&
            !r &&
            ((n.os = "android"),
            (n.osVersion = a[2]),
            (n.android = !0),
            (n.androidChrome = 0 <= i.toLowerCase().indexOf("chrome"))),
          (s || l || o) && ((n.os = "ios"), (n.ios = !0)),
          l && !o && ((n.osVersion = l[2].replace(/_/g, ".")), (n.iphone = !0)),
          s && ((n.osVersion = s[2].replace(/_/g, ".")), (n.ipad = !0)),
          o &&
            ((n.osVersion = o[3] ? o[3].replace(/_/g, ".") : null),
            (n.iphone = !0)),
          n.ios &&
            n.osVersion &&
            0 <= i.indexOf("Version/") &&
            "10" === n.osVersion.split(".")[0] &&
            (n.osVersion = i.toLowerCase().split("version/")[1].split(" ")[0]),
          (n.desktop = !(n.os || n.android || n.webView)),
          (n.webView = (l || s || o) && i.match(/.*AppleWebKit(?!.*Safari)/i)),
          n.os && "ios" === n.os)
        ) {
          var d = n.osVersion.split("."),
            c = e.querySelector('meta[name="viewport"]');
          n.minimalUi =
            !n.webView &&
            (o || l) &&
            (1 * d[0] == 7 ? 1 <= 1 * d[1] : 7 < 1 * d[0]) &&
            c &&
            0 <= c.getAttribute("content").indexOf("minimal-ui");
        }
        return ((n.pixelRatio = t.devicePixelRatio || 1), n);
      })();
    function S() {
      var e = this,
        t = e.params,
        i = e.el;
      if (!i || 0 !== i.offsetWidth) {
        t.breakpoints && e.setBreakpoint();
        var n = e.allowSlideNext,
          r = e.allowSlidePrev,
          a = e.snapGrid;
        if (
          ((e.allowSlideNext = !0),
          (e.allowSlidePrev = !0),
          e.updateSize(),
          e.updateSlides(),
          t.freeMode)
        ) {
          var s = Math.min(
            Math.max(e.translate, e.maxTranslate()),
            e.minTranslate(),
          );
          (e.setTranslate(s),
            e.updateActiveIndex(),
            e.updateSlidesClasses(),
            t.autoHeight && e.updateAutoHeight());
        } else
          (e.updateSlidesClasses(),
            ("auto" === t.slidesPerView || 1 < t.slidesPerView) &&
            e.isEnd &&
            !e.params.centeredSlides
              ? e.slideTo(e.slides.length - 1, 0, !1, !0)
              : e.slideTo(e.activeIndex, 0, !1, !0));
        ((e.allowSlidePrev = r),
          (e.allowSlideNext = n),
          e.params.watchOverflow && a !== e.snapGrid && e.checkOverflow());
      }
    }
    var T = {
        init: !0,
        direction: "horizontal",
        touchEventsTarget: "container",
        initialSlide: 0,
        speed: 300,
        preventInteractionOnTransition: !1,
        edgeSwipeDetection: !1,
        edgeSwipeThreshold: 20,
        freeMode: !1,
        freeModeMomentum: !0,
        freeModeMomentumRatio: 1,
        freeModeMomentumBounce: !0,
        freeModeMomentumBounceRatio: 1,
        freeModeMomentumVelocityRatio: 1,
        freeModeSticky: !1,
        freeModeMinimumVelocity: 0.02,
        autoHeight: !1,
        setWrapperSize: !1,
        virtualTranslate: !1,
        effect: "slide",
        breakpoints: void 0,
        breakpointsInverse: !1,
        spaceBetween: 0,
        slidesPerView: 1,
        slidesPerColumn: 1,
        slidesPerColumnFill: "column",
        slidesPerGroup: 1,
        centeredSlides: !1,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
        normalizeSlideIndex: !0,
        centerInsufficientSlides: !1,
        watchOverflow: !1,
        roundLengths: !1,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: !0,
        shortSwipes: !0,
        longSwipes: !0,
        longSwipesRatio: 0.5,
        longSwipesMs: 300,
        followFinger: !0,
        allowTouchMove: !0,
        threshold: 0,
        touchMoveStopPropagation: !0,
        touchStartPreventDefault: !0,
        touchStartForcePreventDefault: !1,
        touchReleaseOnEdges: !1,
        uniqueNavElements: !0,
        resistance: !0,
        resistanceRatio: 0.85,
        watchSlidesProgress: !1,
        watchSlidesVisibility: !1,
        grabCursor: !1,
        preventClicks: !0,
        preventClicksPropagation: !0,
        slideToClickedSlide: !1,
        preloadImages: !0,
        updateOnImagesReady: !0,
        loop: !1,
        loopAdditionalSlides: 0,
        loopedSlides: null,
        loopFillGroupWithBlank: !1,
        allowSlidePrev: !0,
        allowSlideNext: !0,
        swipeHandler: null,
        noSwiping: !0,
        noSwipingClass: "swiper-no-swiping",
        noSwipingSelector: null,
        passiveListeners: !0,
        containerModifierClass: "swiper-container-",
        slideClass: "swiper-slide",
        slideBlankClass: "swiper-slide-invisible-blank",
        slideActiveClass: "swiper-slide-active",
        slideDuplicateActiveClass: "swiper-slide-duplicate-active",
        slideVisibleClass: "swiper-slide-visible",
        slideDuplicateClass: "swiper-slide-duplicate",
        slideNextClass: "swiper-slide-next",
        slideDuplicateNextClass: "swiper-slide-duplicate-next",
        slidePrevClass: "swiper-slide-prev",
        slideDuplicatePrevClass: "swiper-slide-duplicate-prev",
        wrapperClass: "swiper-wrapper",
        runCallbacksOnInit: !0,
      },
      E = {
        update: v,
        translate: g,
        transition: {
          setTransition: function (e, t) {
            (this.$wrapperEl.transition(e), this.emit("setTransition", e, t));
          },
          transitionStart: function (e, t) {
            void 0 === e && (e = !0);
            var i = this,
              n = i.activeIndex,
              r = i.params,
              a = i.previousIndex;
            r.autoHeight && i.updateAutoHeight();
            var s = t;
            if (
              (s || (s = a < n ? "next" : n < a ? "prev" : "reset"),
              i.emit("transitionStart"),
              e && n !== a)
            ) {
              if ("reset" === s)
                return void i.emit("slideResetTransitionStart");
              (i.emit("slideChangeTransitionStart"),
                "next" === s
                  ? i.emit("slideNextTransitionStart")
                  : i.emit("slidePrevTransitionStart"));
            }
          },
          transitionEnd: function (e, t) {
            void 0 === e && (e = !0);
            var i = this,
              n = i.activeIndex,
              r = i.previousIndex;
            ((i.animating = !1), i.setTransition(0));
            var a = t;
            if (
              (a || (a = r < n ? "next" : n < r ? "prev" : "reset"),
              i.emit("transitionEnd"),
              e && n !== r)
            ) {
              if ("reset" === a) return void i.emit("slideResetTransitionEnd");
              (i.emit("slideChangeTransitionEnd"),
                "next" === a
                  ? i.emit("slideNextTransitionEnd")
                  : i.emit("slidePrevTransitionEnd"));
            }
          },
        },
        slide: m,
        loop: b,
        grabCursor: x,
        manipulation: y,
        events: {
          attachEvents: function () {
            var i = this,
              r = i.params,
              a = i.touchEvents,
              s = i.el,
              o = i.wrapperEl;
            ((i.onTouchStart = function (i) {
              var r = this,
                a = r.touchEventsData,
                s = r.params,
                o = r.touches;
              if (!r.animating || !s.preventInteractionOnTransition) {
                var l = i;
                if (
                  (l.originalEvent && (l = l.originalEvent),
                  (a.isTouchEvent = "touchstart" === l.type),
                  (a.isTouchEvent || !("which" in l) || 3 !== l.which) &&
                    !(
                      (!a.isTouchEvent && "button" in l && 0 < l.button) ||
                      (a.isTouched && a.isMoved)
                    ))
                )
                  if (
                    s.noSwiping &&
                    n(l.target).closest(
                      s.noSwipingSelector
                        ? s.noSwipingSelector
                        : "." + s.noSwipingClass,
                    )[0]
                  )
                    r.allowClick = !0;
                  else if (!s.swipeHandler || n(l).closest(s.swipeHandler)[0]) {
                    ((o.currentX =
                      "touchstart" === l.type
                        ? l.targetTouches[0].pageX
                        : l.pageX),
                      (o.currentY =
                        "touchstart" === l.type
                          ? l.targetTouches[0].pageY
                          : l.pageY));
                    var d = o.currentX,
                      u = o.currentY,
                      p = s.edgeSwipeDetection || s.iOSEdgeSwipeDetection,
                      h = s.edgeSwipeThreshold || s.iOSEdgeSwipeThreshold;
                    if (!p || !(d <= h || d >= t.screen.width - h)) {
                      if (
                        (c.extend(a, {
                          isTouched: !0,
                          isMoved: !1,
                          allowTouchCallbacks: !0,
                          isScrolling: void 0,
                          startMoving: void 0,
                        }),
                        (o.startX = d),
                        (o.startY = u),
                        (a.touchStartTime = c.now()),
                        (r.allowClick = !0),
                        r.updateSize(),
                        (r.swipeDirection = void 0),
                        0 < s.threshold && (a.allowThresholdMove = !1),
                        "touchstart" !== l.type)
                      ) {
                        var f = !0;
                        (n(l.target).is(a.formElements) && (f = !1),
                          e.activeElement &&
                            n(e.activeElement).is(a.formElements) &&
                            e.activeElement !== l.target &&
                            e.activeElement.blur());
                        var v =
                          f && r.allowTouchMove && s.touchStartPreventDefault;
                        (s.touchStartForcePreventDefault || v) &&
                          l.preventDefault();
                      }
                      r.emit("touchStart", l);
                    }
                  }
              }
            }.bind(i)),
              (i.onTouchMove = function (t) {
                var i = this,
                  r = i.touchEventsData,
                  a = i.params,
                  s = i.touches,
                  o = i.rtlTranslate,
                  l = t;
                if ((l.originalEvent && (l = l.originalEvent), r.isTouched)) {
                  if (!r.isTouchEvent || "mousemove" !== l.type) {
                    var d =
                        "touchmove" === l.type
                          ? l.targetTouches[0].pageX
                          : l.pageX,
                      u =
                        "touchmove" === l.type
                          ? l.targetTouches[0].pageY
                          : l.pageY;
                    if (l.preventedByNestedSwiper)
                      return ((s.startX = d), void (s.startY = u));
                    if (!i.allowTouchMove)
                      return (
                        (i.allowClick = !1),
                        void (
                          r.isTouched &&
                          (c.extend(s, {
                            startX: d,
                            startY: u,
                            currentX: d,
                            currentY: u,
                          }),
                          (r.touchStartTime = c.now()))
                        )
                      );
                    if (r.isTouchEvent && a.touchReleaseOnEdges && !a.loop)
                      if (i.isVertical()) {
                        if (
                          (u < s.startY && i.translate <= i.maxTranslate()) ||
                          (u > s.startY && i.translate >= i.minTranslate())
                        )
                          return ((r.isTouched = !1), void (r.isMoved = !1));
                      } else if (
                        (d < s.startX && i.translate <= i.maxTranslate()) ||
                        (d > s.startX && i.translate >= i.minTranslate())
                      )
                        return;
                    if (
                      r.isTouchEvent &&
                      e.activeElement &&
                      l.target === e.activeElement &&
                      n(l.target).is(r.formElements)
                    )
                      return ((r.isMoved = !0), void (i.allowClick = !1));
                    if (
                      (r.allowTouchCallbacks && i.emit("touchMove", l),
                      !(l.targetTouches && 1 < l.targetTouches.length))
                    ) {
                      ((s.currentX = d), (s.currentY = u));
                      var p,
                        h = s.currentX - s.startX,
                        f = s.currentY - s.startY;
                      if (!(
                        i.params.threshold &&
                        Math.sqrt(Math.pow(h, 2) + Math.pow(f, 2)) <
                          i.params.threshold
                      ))
                        if (
                          (void 0 === r.isScrolling &&
                            ((i.isHorizontal() && s.currentY === s.startY) ||
                            (i.isVertical() && s.currentX === s.startX)
                              ? (r.isScrolling = !1)
                              : 25 <= h * h + f * f &&
                                ((p =
                                  (180 * Math.atan2(Math.abs(f), Math.abs(h))) /
                                  Math.PI),
                                (r.isScrolling = i.isHorizontal()
                                  ? p > a.touchAngle
                                  : 90 - p > a.touchAngle))),
                          r.isScrolling && i.emit("touchMoveOpposite", l),
                          void 0 === r.startMoving &&
                            ((s.currentX === s.startX &&
                              s.currentY === s.startY) ||
                              (r.startMoving = !0)),
                          r.isScrolling)
                        )
                          r.isTouched = !1;
                        else if (r.startMoving) {
                          ((i.allowClick = !1),
                            l.preventDefault(),
                            a.touchMoveStopPropagation &&
                              !a.nested &&
                              l.stopPropagation(),
                            r.isMoved ||
                              (a.loop && i.loopFix(),
                              (r.startTranslate = i.getTranslate()),
                              i.setTransition(0),
                              i.animating &&
                                i.$wrapperEl.trigger(
                                  "webkitTransitionEnd transitionend",
                                ),
                              (r.allowMomentumBounce = !1),
                              !a.grabCursor ||
                                (!0 !== i.allowSlideNext &&
                                  !0 !== i.allowSlidePrev) ||
                                i.setGrabCursor(!0),
                              i.emit("sliderFirstMove", l)),
                            i.emit("sliderMove", l),
                            (r.isMoved = !0));
                          var v = i.isHorizontal() ? h : f;
                          ((s.diff = v),
                            (v *= a.touchRatio),
                            o && (v = -v),
                            (i.swipeDirection = 0 < v ? "prev" : "next"),
                            (r.currentTranslate = v + r.startTranslate));
                          var g = !0,
                            m = a.resistanceRatio;
                          if (
                            (a.touchReleaseOnEdges && (m = 0),
                            0 < v && r.currentTranslate > i.minTranslate()
                              ? ((g = !1),
                                a.resistance &&
                                  (r.currentTranslate =
                                    i.minTranslate() -
                                    1 +
                                    Math.pow(
                                      -i.minTranslate() + r.startTranslate + v,
                                      m,
                                    )))
                              : v < 0 &&
                                r.currentTranslate < i.maxTranslate() &&
                                ((g = !1),
                                a.resistance &&
                                  (r.currentTranslate =
                                    i.maxTranslate() +
                                    1 -
                                    Math.pow(
                                      i.maxTranslate() - r.startTranslate - v,
                                      m,
                                    ))),
                            g && (l.preventedByNestedSwiper = !0),
                            !i.allowSlideNext &&
                              "next" === i.swipeDirection &&
                              r.currentTranslate < r.startTranslate &&
                              (r.currentTranslate = r.startTranslate),
                            !i.allowSlidePrev &&
                              "prev" === i.swipeDirection &&
                              r.currentTranslate > r.startTranslate &&
                              (r.currentTranslate = r.startTranslate),
                            0 < a.threshold)
                          ) {
                            if (!(
                              Math.abs(v) > a.threshold || r.allowThresholdMove
                            ))
                              return void (r.currentTranslate =
                                r.startTranslate);
                            if (!r.allowThresholdMove)
                              return (
                                (r.allowThresholdMove = !0),
                                (s.startX = s.currentX),
                                (s.startY = s.currentY),
                                (r.currentTranslate = r.startTranslate),
                                void (s.diff = i.isHorizontal()
                                  ? s.currentX - s.startX
                                  : s.currentY - s.startY)
                              );
                          }
                          a.followFinger &&
                            ((a.freeMode ||
                              a.watchSlidesProgress ||
                              a.watchSlidesVisibility) &&
                              (i.updateActiveIndex(), i.updateSlidesClasses()),
                            a.freeMode &&
                              (0 === r.velocities.length &&
                                r.velocities.push({
                                  position:
                                    s[i.isHorizontal() ? "startX" : "startY"],
                                  time: r.touchStartTime,
                                }),
                              r.velocities.push({
                                position:
                                  s[i.isHorizontal() ? "currentX" : "currentY"],
                                time: c.now(),
                              })),
                            i.updateProgress(r.currentTranslate),
                            i.setTranslate(r.currentTranslate));
                        }
                    }
                  }
                } else
                  r.startMoving &&
                    r.isScrolling &&
                    i.emit("touchMoveOpposite", l);
              }.bind(i)),
              (i.onTouchEnd = function (e) {
                var t = this,
                  i = t.touchEventsData,
                  n = t.params,
                  r = t.touches,
                  a = t.rtlTranslate,
                  s = t.$wrapperEl,
                  o = t.slidesGrid,
                  l = t.snapGrid,
                  d = e;
                if (
                  (d.originalEvent && (d = d.originalEvent),
                  i.allowTouchCallbacks && t.emit("touchEnd", d),
                  (i.allowTouchCallbacks = !1),
                  !i.isTouched)
                )
                  return (
                    i.isMoved && n.grabCursor && t.setGrabCursor(!1),
                    (i.isMoved = !1),
                    void (i.startMoving = !1)
                  );
                n.grabCursor &&
                  i.isMoved &&
                  i.isTouched &&
                  (!0 === t.allowSlideNext || !0 === t.allowSlidePrev) &&
                  t.setGrabCursor(!1);
                var u,
                  p = c.now(),
                  h = p - i.touchStartTime;
                if (
                  (t.allowClick &&
                    (t.updateClickedSlide(d),
                    t.emit("tap", d),
                    h < 300 &&
                      300 < p - i.lastClickTime &&
                      (i.clickTimeout && clearTimeout(i.clickTimeout),
                      (i.clickTimeout = c.nextTick(function () {
                        t && !t.destroyed && t.emit("click", d);
                      }, 300))),
                    h < 300 &&
                      p - i.lastClickTime < 300 &&
                      (i.clickTimeout && clearTimeout(i.clickTimeout),
                      t.emit("doubleTap", d))),
                  (i.lastClickTime = c.now()),
                  c.nextTick(function () {
                    t.destroyed || (t.allowClick = !0);
                  }),
                  !i.isTouched ||
                    !i.isMoved ||
                    !t.swipeDirection ||
                    0 === r.diff ||
                    i.currentTranslate === i.startTranslate)
                )
                  return (
                    (i.isTouched = !1),
                    (i.isMoved = !1),
                    void (i.startMoving = !1)
                  );
                if (
                  ((i.isTouched = !1),
                  (i.isMoved = !1),
                  (i.startMoving = !1),
                  (u = n.followFinger
                    ? a
                      ? t.translate
                      : -t.translate
                    : -i.currentTranslate),
                  n.freeMode)
                ) {
                  if (u < -t.minTranslate())
                    return void t.slideTo(t.activeIndex);
                  if (u > -t.maxTranslate())
                    return void (t.slides.length < l.length
                      ? t.slideTo(l.length - 1)
                      : t.slideTo(t.slides.length - 1));
                  if (n.freeModeMomentum) {
                    if (1 < i.velocities.length) {
                      var f = i.velocities.pop(),
                        v = i.velocities.pop(),
                        g = f.position - v.position,
                        m = f.time - v.time;
                      ((t.velocity = g / m),
                        (t.velocity /= 2),
                        Math.abs(t.velocity) < n.freeModeMinimumVelocity &&
                          (t.velocity = 0),
                        (150 < m || 300 < c.now() - f.time) &&
                          (t.velocity = 0));
                    } else t.velocity = 0;
                    ((t.velocity *= n.freeModeMomentumVelocityRatio),
                      (i.velocities.length = 0));
                    var b = 1e3 * n.freeModeMomentumRatio,
                      x = t.velocity * b,
                      y = t.translate + x;
                    a && (y = -y);
                    var w,
                      S,
                      T = !1,
                      E =
                        20 *
                        Math.abs(t.velocity) *
                        n.freeModeMomentumBounceRatio;
                    if (y < t.maxTranslate())
                      (n.freeModeMomentumBounce
                        ? (y + t.maxTranslate() < -E &&
                            (y = t.maxTranslate() - E),
                          (w = t.maxTranslate()),
                          (T = !0),
                          (i.allowMomentumBounce = !0))
                        : (y = t.maxTranslate()),
                        n.loop && n.centeredSlides && (S = !0));
                    else if (y > t.minTranslate())
                      (n.freeModeMomentumBounce
                        ? (y - t.minTranslate() > E &&
                            (y = t.minTranslate() + E),
                          (w = t.minTranslate()),
                          (T = !0),
                          (i.allowMomentumBounce = !0))
                        : (y = t.minTranslate()),
                        n.loop && n.centeredSlides && (S = !0));
                    else if (n.freeModeSticky) {
                      for (var C, M = 0; M < l.length; M += 1)
                        if (l[M] > -y) {
                          C = M;
                          break;
                        }
                      y = -(y =
                        Math.abs(l[C] - y) < Math.abs(l[C - 1] - y) ||
                        "next" === t.swipeDirection
                          ? l[C]
                          : l[C - 1]);
                    }
                    if (
                      (S &&
                        t.once("transitionEnd", function () {
                          t.loopFix();
                        }),
                      0 !== t.velocity)
                    )
                      b = a
                        ? Math.abs((-y - t.translate) / t.velocity)
                        : Math.abs((y - t.translate) / t.velocity);
                    else if (n.freeModeSticky) return void t.slideToClosest();
                    (n.freeModeMomentumBounce && T
                      ? (t.updateProgress(w),
                        t.setTransition(b),
                        t.setTranslate(y),
                        t.transitionStart(!0, t.swipeDirection),
                        (t.animating = !0),
                        s.transitionEnd(function () {
                          t &&
                            !t.destroyed &&
                            i.allowMomentumBounce &&
                            (t.emit("momentumBounce"),
                            t.setTransition(n.speed),
                            t.setTranslate(w),
                            s.transitionEnd(function () {
                              t && !t.destroyed && t.transitionEnd();
                            }));
                        }))
                      : t.velocity
                        ? (t.updateProgress(y),
                          t.setTransition(b),
                          t.setTranslate(y),
                          t.transitionStart(!0, t.swipeDirection),
                          t.animating ||
                            ((t.animating = !0),
                            s.transitionEnd(function () {
                              t && !t.destroyed && t.transitionEnd();
                            })))
                        : t.updateProgress(y),
                      t.updateActiveIndex(),
                      t.updateSlidesClasses());
                  } else if (n.freeModeSticky) return void t.slideToClosest();
                  (!n.freeModeMomentum || h >= n.longSwipesMs) &&
                    (t.updateProgress(),
                    t.updateActiveIndex(),
                    t.updateSlidesClasses());
                } else {
                  for (
                    var P = 0, k = t.slidesSizesGrid[0], z = 0;
                    z < o.length;
                    z += n.slidesPerGroup
                  )
                    void 0 !== o[z + n.slidesPerGroup]
                      ? u >= o[z] &&
                        u < o[z + n.slidesPerGroup] &&
                        (k = o[(P = z) + n.slidesPerGroup] - o[z])
                      : u >= o[z] &&
                        ((P = z), (k = o[o.length - 1] - o[o.length - 2]));
                  var L = (u - o[P]) / k;
                  if (h > n.longSwipesMs) {
                    if (!n.longSwipes) return void t.slideTo(t.activeIndex);
                    ("next" === t.swipeDirection &&
                      (L >= n.longSwipesRatio
                        ? t.slideTo(P + n.slidesPerGroup)
                        : t.slideTo(P)),
                      "prev" === t.swipeDirection &&
                        (L > 1 - n.longSwipesRatio
                          ? t.slideTo(P + n.slidesPerGroup)
                          : t.slideTo(P)));
                  } else {
                    if (!n.shortSwipes) return void t.slideTo(t.activeIndex);
                    ("next" === t.swipeDirection &&
                      t.slideTo(P + n.slidesPerGroup),
                      "prev" === t.swipeDirection && t.slideTo(P));
                  }
                }
              }.bind(i)),
              (i.onClick = function (e) {
                this.allowClick ||
                  (this.params.preventClicks && e.preventDefault(),
                  this.params.preventClicksPropagation &&
                    this.animating &&
                    (e.stopPropagation(), e.stopImmediatePropagation()));
              }.bind(i)));
            var l = "container" === r.touchEventsTarget ? s : o,
              d = !!r.nested;
            if (u.touch || (!u.pointerEvents && !u.prefixedPointerEvents)) {
              if (u.touch) {
                var p = !(
                  "touchstart" !== a.start ||
                  !u.passiveListener ||
                  !r.passiveListeners
                ) && { passive: !0, capture: !1 };
                (l.addEventListener(a.start, i.onTouchStart, p),
                  l.addEventListener(
                    a.move,
                    i.onTouchMove,
                    u.passiveListener ? { passive: !1, capture: d } : d,
                  ),
                  l.addEventListener(a.end, i.onTouchEnd, p));
              }
              ((r.simulateTouch && !w.ios && !w.android) ||
                (r.simulateTouch && !u.touch && w.ios)) &&
                (l.addEventListener("mousedown", i.onTouchStart, !1),
                e.addEventListener("mousemove", i.onTouchMove, d),
                e.addEventListener("mouseup", i.onTouchEnd, !1));
            } else
              (l.addEventListener(a.start, i.onTouchStart, !1),
                e.addEventListener(a.move, i.onTouchMove, d),
                e.addEventListener(a.end, i.onTouchEnd, !1));
            ((r.preventClicks || r.preventClicksPropagation) &&
              l.addEventListener("click", i.onClick, !0),
              i.on(
                w.ios || w.android
                  ? "resize orientationchange observerUpdate"
                  : "resize observerUpdate",
                S,
                !0,
              ));
          },
          detachEvents: function () {
            var t = this,
              i = t.params,
              n = t.touchEvents,
              r = t.el,
              a = t.wrapperEl,
              s = "container" === i.touchEventsTarget ? r : a,
              o = !!i.nested;
            if (u.touch || (!u.pointerEvents && !u.prefixedPointerEvents)) {
              if (u.touch) {
                var l = !(
                  "onTouchStart" !== n.start ||
                  !u.passiveListener ||
                  !i.passiveListeners
                ) && { passive: !0, capture: !1 };
                (s.removeEventListener(n.start, t.onTouchStart, l),
                  s.removeEventListener(n.move, t.onTouchMove, o),
                  s.removeEventListener(n.end, t.onTouchEnd, l));
              }
              ((i.simulateTouch && !w.ios && !w.android) ||
                (i.simulateTouch && !u.touch && w.ios)) &&
                (s.removeEventListener("mousedown", t.onTouchStart, !1),
                e.removeEventListener("mousemove", t.onTouchMove, o),
                e.removeEventListener("mouseup", t.onTouchEnd, !1));
            } else
              (s.removeEventListener(n.start, t.onTouchStart, !1),
                e.removeEventListener(n.move, t.onTouchMove, o),
                e.removeEventListener(n.end, t.onTouchEnd, !1));
            ((i.preventClicks || i.preventClicksPropagation) &&
              s.removeEventListener("click", t.onClick, !0),
              t.off(
                w.ios || w.android
                  ? "resize orientationchange observerUpdate"
                  : "resize observerUpdate",
                S,
              ));
          },
        },
        breakpoints: {
          setBreakpoint: function () {
            var e = this,
              t = e.activeIndex,
              i = e.initialized,
              n = e.loopedSlides;
            void 0 === n && (n = 0);
            var r = e.params,
              a = r.breakpoints;
            if (a && (!a || 0 !== Object.keys(a).length)) {
              var s = e.getBreakpoint(a);
              if (s && e.currentBreakpoint !== s) {
                var o = s in a ? a[s] : void 0;
                o &&
                  ["slidesPerView", "spaceBetween", "slidesPerGroup"].forEach(
                    function (e) {
                      var t = o[e];
                      void 0 !== t &&
                        (o[e] =
                          "slidesPerView" !== e ||
                          ("AUTO" !== t && "auto" !== t)
                            ? "slidesPerView" === e
                              ? parseFloat(t)
                              : parseInt(t, 10)
                            : "auto");
                    },
                  );
                var l = o || e.originalParams,
                  d = l.direction && l.direction !== r.direction,
                  u = r.loop && (l.slidesPerView !== r.slidesPerView || d);
                (d && i && e.changeDirection(),
                  c.extend(e.params, l),
                  c.extend(e, {
                    allowTouchMove: e.params.allowTouchMove,
                    allowSlideNext: e.params.allowSlideNext,
                    allowSlidePrev: e.params.allowSlidePrev,
                  }),
                  (e.currentBreakpoint = s),
                  u &&
                    i &&
                    (e.loopDestroy(),
                    e.loopCreate(),
                    e.updateSlides(),
                    e.slideTo(t - n + e.loopedSlides, 0, !1)),
                  e.emit("breakpoint", l));
              }
            }
          },
          getBreakpoint: function (e) {
            if (e) {
              var i = !1,
                n = [];
              (Object.keys(e).forEach(function (e) {
                n.push(e);
              }),
                n.sort(function (e, t) {
                  return parseInt(e, 10) - parseInt(t, 10);
                }));
              for (var r = 0; r < n.length; r += 1) {
                var a = n[r];
                this.params.breakpointsInverse
                  ? a <= t.innerWidth && (i = a)
                  : a >= t.innerWidth && !i && (i = a);
              }
              return i || "max";
            }
          },
        },
        checkOverflow: {
          checkOverflow: function () {
            var e = this,
              t = e.isLocked;
            ((e.isLocked = 1 === e.snapGrid.length),
              (e.allowSlideNext = !e.isLocked),
              (e.allowSlidePrev = !e.isLocked),
              t !== e.isLocked && e.emit(e.isLocked ? "lock" : "unlock"),
              t && t !== e.isLocked && ((e.isEnd = !1), e.navigation.update()));
          },
        },
        classes: {
          addClasses: function () {
            var e = this.classNames,
              t = this.params,
              i = this.rtl,
              n = this.$el,
              r = [];
            (r.push("initialized"),
              r.push(t.direction),
              t.freeMode && r.push("free-mode"),
              u.flexbox || r.push("no-flexbox"),
              t.autoHeight && r.push("autoheight"),
              i && r.push("rtl"),
              1 < t.slidesPerColumn && r.push("multirow"),
              w.android && r.push("android"),
              w.ios && r.push("ios"),
              (p.isIE || p.isEdge) &&
                (u.pointerEvents || u.prefixedPointerEvents) &&
                r.push("wp8-" + t.direction),
              r.forEach(function (i) {
                e.push(t.containerModifierClass + i);
              }),
              n.addClass(e.join(" ")));
          },
          removeClasses: function () {
            var e = this.$el,
              t = this.classNames;
            e.removeClass(t.join(" "));
          },
        },
        images: {
          loadImage: function (e, i, n, r, a, s) {
            var o;
            function l() {
              s && s();
            }
            e.complete && a
              ? l()
              : i
                ? (((o = new t.Image()).onload = l),
                  (o.onerror = l),
                  r && (o.sizes = r),
                  n && (o.srcset = n),
                  i && (o.src = i))
                : l();
          },
          preloadImages: function () {
            var e = this;
            function t() {
              null != e &&
                e &&
                !e.destroyed &&
                (void 0 !== e.imagesLoaded && (e.imagesLoaded += 1),
                e.imagesLoaded === e.imagesToLoad.length &&
                  (e.params.updateOnImagesReady && e.update(),
                  e.emit("imagesReady")));
            }
            e.imagesToLoad = e.$el.find("img");
            for (var i = 0; i < e.imagesToLoad.length; i += 1) {
              var n = e.imagesToLoad[i];
              e.loadImage(
                n,
                n.currentSrc || n.getAttribute("src"),
                n.srcset || n.getAttribute("srcset"),
                n.sizes || n.getAttribute("sizes"),
                !0,
                t,
              );
            }
          },
        },
      },
      C = {},
      M = (function (e) {
        function t() {
          for (var i, r, a, s = [], o = arguments.length; o--;)
            s[o] = arguments[o];
          (1 === s.length && s[0].constructor && s[0].constructor === Object
            ? (a = s[0])
            : ((r = (i = s)[0]), (a = i[1])),
            a || (a = {}),
            (a = c.extend({}, a)),
            r && !a.el && (a.el = r),
            e.call(this, a),
            Object.keys(E).forEach(function (e) {
              Object.keys(E[e]).forEach(function (i) {
                t.prototype[i] || (t.prototype[i] = E[e][i]);
              });
            }));
          var l = this;
          (void 0 === l.modules && (l.modules = {}),
            Object.keys(l.modules).forEach(function (e) {
              var t = l.modules[e];
              if (t.params) {
                var i = Object.keys(t.params)[0],
                  n = t.params[i];
                if ("object" != typeof n || null === n) return;
                if (!(i in a) || !("enabled" in n)) return;
                (!0 === a[i] && (a[i] = { enabled: !0 }),
                  "object" != typeof a[i] ||
                    "enabled" in a[i] ||
                    (a[i].enabled = !0),
                  a[i] || (a[i] = { enabled: !1 }));
              }
            }));
          var d = c.extend({}, T);
          (l.useModulesParams(d),
            (l.params = c.extend({}, d, C, a)),
            (l.originalParams = c.extend({}, l.params)),
            (l.passedParams = c.extend({}, a)));
          var p = (l.$ = n)(l.params.el);
          if ((r = p[0])) {
            if (1 < p.length) {
              var h = [];
              return (
                p.each(function (e, i) {
                  var n = c.extend({}, a, { el: i });
                  h.push(new t(n));
                }),
                h
              );
            }
            ((r.swiper = l), p.data("swiper", l));
            var f,
              v,
              g = p.children("." + l.params.wrapperClass);
            return (
              c.extend(l, {
                $el: p,
                el: r,
                $wrapperEl: g,
                wrapperEl: g[0],
                classNames: [],
                slides: n(),
                slidesGrid: [],
                snapGrid: [],
                slidesSizesGrid: [],
                isHorizontal: function () {
                  return "horizontal" === l.params.direction;
                },
                isVertical: function () {
                  return "vertical" === l.params.direction;
                },
                rtl:
                  "rtl" === r.dir.toLowerCase() || "rtl" === p.css("direction"),
                rtlTranslate:
                  "horizontal" === l.params.direction &&
                  ("rtl" === r.dir.toLowerCase() ||
                    "rtl" === p.css("direction")),
                wrongRTL: "-webkit-box" === g.css("display"),
                activeIndex: 0,
                realIndex: 0,
                isBeginning: !0,
                isEnd: !1,
                translate: 0,
                previousTranslate: 0,
                progress: 0,
                velocity: 0,
                animating: !1,
                allowSlideNext: l.params.allowSlideNext,
                allowSlidePrev: l.params.allowSlidePrev,
                touchEvents:
                  ((f = ["touchstart", "touchmove", "touchend"]),
                  (v = ["mousedown", "mousemove", "mouseup"]),
                  u.pointerEvents
                    ? (v = ["pointerdown", "pointermove", "pointerup"])
                    : u.prefixedPointerEvents &&
                      (v = ["MSPointerDown", "MSPointerMove", "MSPointerUp"]),
                  (l.touchEventsTouch = { start: f[0], move: f[1], end: f[2] }),
                  (l.touchEventsDesktop = {
                    start: v[0],
                    move: v[1],
                    end: v[2],
                  }),
                  u.touch || !l.params.simulateTouch
                    ? l.touchEventsTouch
                    : l.touchEventsDesktop),
                touchEventsData: {
                  isTouched: void 0,
                  isMoved: void 0,
                  allowTouchCallbacks: void 0,
                  touchStartTime: void 0,
                  isScrolling: void 0,
                  currentTranslate: void 0,
                  startTranslate: void 0,
                  allowThresholdMove: void 0,
                  formElements:
                    "input, select, option, textarea, button, video",
                  lastClickTime: c.now(),
                  clickTimeout: void 0,
                  velocities: [],
                  allowMomentumBounce: void 0,
                  isTouchEvent: void 0,
                  startMoving: void 0,
                },
                allowClick: !0,
                allowTouchMove: l.params.allowTouchMove,
                touches: {
                  startX: 0,
                  startY: 0,
                  currentX: 0,
                  currentY: 0,
                  diff: 0,
                },
                imagesToLoad: [],
                imagesLoaded: 0,
              }),
              l.useModules(),
              l.params.init && l.init(),
              l
            );
          }
        }
        e && (t.__proto__ = e);
        var i = {
          extendedDefaults: { configurable: !0 },
          defaults: { configurable: !0 },
          Class: { configurable: !0 },
          $: { configurable: !0 },
        };
        return (
          (((t.prototype = Object.create(e && e.prototype)).constructor =
            t).prototype.slidesPerViewDynamic = function () {
            var e = this,
              t = e.params,
              i = e.slides,
              n = e.slidesGrid,
              r = e.size,
              a = e.activeIndex,
              s = 1;
            if (t.centeredSlides) {
              for (
                var o, l = i[a].swiperSlideSize, d = a + 1;
                d < i.length;
                d += 1
              )
                i[d] &&
                  !o &&
                  ((s += 1), r < (l += i[d].swiperSlideSize) && (o = !0));
              for (var c = a - 1; 0 <= c; c -= 1)
                i[c] &&
                  !o &&
                  ((s += 1), r < (l += i[c].swiperSlideSize) && (o = !0));
            } else
              for (var u = a + 1; u < i.length; u += 1)
                n[u] - n[a] < r && (s += 1);
            return s;
          }),
          (t.prototype.update = function () {
            var e = this;
            if (e && !e.destroyed) {
              var t = e.snapGrid,
                i = e.params;
              (i.breakpoints && e.setBreakpoint(),
                e.updateSize(),
                e.updateSlides(),
                e.updateProgress(),
                e.updateSlidesClasses(),
                e.params.freeMode
                  ? (n(), e.params.autoHeight && e.updateAutoHeight())
                  : (("auto" === e.params.slidesPerView ||
                      1 < e.params.slidesPerView) &&
                    e.isEnd &&
                    !e.params.centeredSlides
                      ? e.slideTo(e.slides.length - 1, 0, !1, !0)
                      : e.slideTo(e.activeIndex, 0, !1, !0)) || n(),
                i.watchOverflow && t !== e.snapGrid && e.checkOverflow(),
                e.emit("update"));
            }
            function n() {
              var t = e.rtlTranslate ? -1 * e.translate : e.translate,
                i = Math.min(Math.max(t, e.maxTranslate()), e.minTranslate());
              (e.setTranslate(i),
                e.updateActiveIndex(),
                e.updateSlidesClasses());
            }
          }),
          (t.prototype.changeDirection = function (e, t) {
            void 0 === t && (t = !0);
            var i = this,
              n = i.params.direction;
            return (
              e || (e = "horizontal" === n ? "vertical" : "horizontal"),
              e === n ||
                ("horizontal" !== e && "vertical" !== e) ||
                ("vertical" === n &&
                  (i.$el
                    .removeClass(
                      i.params.containerModifierClass + "vertical wp8-vertical",
                    )
                    .addClass("" + i.params.containerModifierClass + e),
                  (p.isIE || p.isEdge) &&
                    (u.pointerEvents || u.prefixedPointerEvents) &&
                    i.$el.addClass(
                      i.params.containerModifierClass + "wp8-" + e,
                    )),
                "horizontal" === n &&
                  (i.$el
                    .removeClass(
                      i.params.containerModifierClass +
                        "horizontal wp8-horizontal",
                    )
                    .addClass("" + i.params.containerModifierClass + e),
                  (p.isIE || p.isEdge) &&
                    (u.pointerEvents || u.prefixedPointerEvents) &&
                    i.$el.addClass(
                      i.params.containerModifierClass + "wp8-" + e,
                    )),
                (i.params.direction = e),
                i.slides.each(function (t, i) {
                  "vertical" === e
                    ? (i.style.width = "")
                    : (i.style.height = "");
                }),
                i.emit("changeDirection"),
                t && i.update()),
              i
            );
          }),
          (t.prototype.init = function () {
            var e = this;
            e.initialized ||
              (e.emit("beforeInit"),
              e.params.breakpoints && e.setBreakpoint(),
              e.addClasses(),
              e.params.loop && e.loopCreate(),
              e.updateSize(),
              e.updateSlides(),
              e.params.watchOverflow && e.checkOverflow(),
              e.params.grabCursor && e.setGrabCursor(),
              e.params.preloadImages && e.preloadImages(),
              e.params.loop
                ? e.slideTo(
                    e.params.initialSlide + e.loopedSlides,
                    0,
                    e.params.runCallbacksOnInit,
                  )
                : e.slideTo(
                    e.params.initialSlide,
                    0,
                    e.params.runCallbacksOnInit,
                  ),
              e.attachEvents(),
              (e.initialized = !0),
              e.emit("init"));
          }),
          (t.prototype.destroy = function (e, t) {
            (void 0 === e && (e = !0), void 0 === t && (t = !0));
            var i = this,
              n = i.params,
              r = i.$el,
              a = i.$wrapperEl,
              s = i.slides;
            return (
              void 0 === i.params ||
                i.destroyed ||
                (i.emit("beforeDestroy"),
                (i.initialized = !1),
                i.detachEvents(),
                n.loop && i.loopDestroy(),
                t &&
                  (i.removeClasses(),
                  r.removeAttr("style"),
                  a.removeAttr("style"),
                  s &&
                    s.length &&
                    s
                      .removeClass(
                        [
                          n.slideVisibleClass,
                          n.slideActiveClass,
                          n.slideNextClass,
                          n.slidePrevClass,
                        ].join(" "),
                      )
                      .removeAttr("style")
                      .removeAttr("data-swiper-slide-index")
                      .removeAttr("data-swiper-column")
                      .removeAttr("data-swiper-row")),
                i.emit("destroy"),
                Object.keys(i.eventsListeners).forEach(function (e) {
                  i.off(e);
                }),
                !1 !== e &&
                  ((i.$el[0].swiper = null),
                  i.$el.data("swiper", null),
                  c.deleteProps(i)),
                (i.destroyed = !0)),
              null
            );
          }),
          (t.extendDefaults = function (e) {
            c.extend(C, e);
          }),
          (i.extendedDefaults.get = function () {
            return C;
          }),
          (i.defaults.get = function () {
            return T;
          }),
          (i.Class.get = function () {
            return e;
          }),
          (i.$.get = function () {
            return n;
          }),
          Object.defineProperties(t, i),
          t
        );
      })(h),
      P = { name: "device", proto: { device: w }, static: { device: w } },
      k = { name: "support", proto: { support: u }, static: { support: u } },
      z = { name: "browser", proto: { browser: p }, static: { browser: p } },
      L = {
        name: "resize",
        create: function () {
          var e = this;
          c.extend(e, {
            resize: {
              resizeHandler: function () {
                e &&
                  !e.destroyed &&
                  e.initialized &&
                  (e.emit("beforeResize"), e.emit("resize"));
              },
              orientationChangeHandler: function () {
                e &&
                  !e.destroyed &&
                  e.initialized &&
                  e.emit("orientationchange");
              },
            },
          });
        },
        on: {
          init: function () {
            (t.addEventListener("resize", this.resize.resizeHandler),
              t.addEventListener(
                "orientationchange",
                this.resize.orientationChangeHandler,
              ));
          },
          destroy: function () {
            (t.removeEventListener("resize", this.resize.resizeHandler),
              t.removeEventListener(
                "orientationchange",
                this.resize.orientationChangeHandler,
              ));
          },
        },
      },
      I = {
        func: t.MutationObserver || t.WebkitMutationObserver,
        attach: function (e, i) {
          void 0 === i && (i = {});
          var n = this,
            r = new I.func(function (e) {
              if (1 !== e.length) {
                var i = function () {
                  n.emit("observerUpdate", e[0]);
                };
                t.requestAnimationFrame
                  ? t.requestAnimationFrame(i)
                  : t.setTimeout(i, 0);
              } else n.emit("observerUpdate", e[0]);
            });
          (r.observe(e, {
            attributes: void 0 === i.attributes || i.attributes,
            childList: void 0 === i.childList || i.childList,
            characterData: void 0 === i.characterData || i.characterData,
          }),
            n.observer.observers.push(r));
        },
        init: function () {
          var e = this;
          if (u.observer && e.params.observer) {
            if (e.params.observeParents)
              for (var t = e.$el.parents(), i = 0; i < t.length; i += 1)
                e.observer.attach(t[i]);
            (e.observer.attach(e.$el[0], {
              childList: e.params.observeSlideChildren,
            }),
              e.observer.attach(e.$wrapperEl[0], { attributes: !1 }));
          }
        },
        destroy: function () {
          (this.observer.observers.forEach(function (e) {
            e.disconnect();
          }),
            (this.observer.observers = []));
        },
      },
      A = {
        name: "observer",
        params: { observer: !1, observeParents: !1, observeSlideChildren: !1 },
        create: function () {
          c.extend(this, {
            observer: {
              init: I.init.bind(this),
              attach: I.attach.bind(this),
              destroy: I.destroy.bind(this),
              observers: [],
            },
          });
        },
        on: {
          init: function () {
            this.observer.init();
          },
          destroy: function () {
            this.observer.destroy();
          },
        },
      },
      O = {
        update: function (e) {
          var t = this,
            i = t.params,
            n = i.slidesPerView,
            r = i.slidesPerGroup,
            a = i.centeredSlides,
            s = t.params.virtual,
            o = s.addSlidesBefore,
            l = s.addSlidesAfter,
            d = t.virtual,
            u = d.from,
            p = d.to,
            h = d.slides,
            f = d.slidesGrid,
            v = d.renderSlide,
            g = d.offset;
          t.updateActiveIndex();
          var m,
            b,
            x,
            y = t.activeIndex || 0;
          ((m = t.rtlTranslate ? "right" : t.isHorizontal() ? "left" : "top"),
            a
              ? ((b = Math.floor(n / 2) + r + o),
                (x = Math.floor(n / 2) + r + l))
              : ((b = n + (r - 1) + o), (x = r + l)));
          var w = Math.max((y || 0) - x, 0),
            S = Math.min((y || 0) + b, h.length - 1),
            T = (t.slidesGrid[w] || 0) - (t.slidesGrid[0] || 0);
          function E() {
            (t.updateSlides(),
              t.updateProgress(),
              t.updateSlidesClasses(),
              t.lazy && t.params.lazy.enabled && t.lazy.load());
          }
          if (
            (c.extend(t.virtual, {
              from: w,
              to: S,
              offset: T,
              slidesGrid: t.slidesGrid,
            }),
            u === w && p === S && !e)
          )
            return (
              t.slidesGrid !== f && T !== g && t.slides.css(m, T + "px"),
              void t.updateProgress()
            );
          if (t.params.virtual.renderExternal)
            return (
              t.params.virtual.renderExternal.call(t, {
                offset: T,
                from: w,
                to: S,
                slides: (function () {
                  for (var e = [], t = w; t <= S; t += 1) e.push(h[t]);
                  return e;
                })(),
              }),
              void E()
            );
          var C = [],
            M = [];
          if (e) t.$wrapperEl.find("." + t.params.slideClass).remove();
          else
            for (var P = u; P <= p; P += 1)
              (P < w || S < P) &&
                t.$wrapperEl
                  .find(
                    "." +
                      t.params.slideClass +
                      '[data-swiper-slide-index="' +
                      P +
                      '"]',
                  )
                  .remove();
          for (var k = 0; k < h.length; k += 1)
            w <= k &&
              k <= S &&
              (void 0 === p || e
                ? M.push(k)
                : (p < k && M.push(k), k < u && C.push(k)));
          (M.forEach(function (e) {
            t.$wrapperEl.append(v(h[e], e));
          }),
            C.sort(function (e, t) {
              return t - e;
            }).forEach(function (e) {
              t.$wrapperEl.prepend(v(h[e], e));
            }),
            t.$wrapperEl.children(".swiper-slide").css(m, T + "px"),
            E());
        },
        renderSlide: function (e, t) {
          var i = this,
            r = i.params.virtual;
          if (r.cache && i.virtual.cache[t]) return i.virtual.cache[t];
          var a = r.renderSlide
            ? n(r.renderSlide.call(i, e, t))
            : n(
                '<div class="' +
                  i.params.slideClass +
                  '" data-swiper-slide-index="' +
                  t +
                  '">' +
                  e +
                  "</div>",
              );
          return (
            a.attr("data-swiper-slide-index") ||
              a.attr("data-swiper-slide-index", t),
            r.cache && (i.virtual.cache[t] = a),
            a
          );
        },
        appendSlide: function (e) {
          if ("object" == typeof e && "length" in e)
            for (var t = 0; t < e.length; t += 1)
              e[t] && this.virtual.slides.push(e[t]);
          else this.virtual.slides.push(e);
          this.virtual.update(!0);
        },
        prependSlide: function (e) {
          var t = this,
            i = t.activeIndex,
            n = i + 1,
            r = 1;
          if (Array.isArray(e)) {
            for (var a = 0; a < e.length; a += 1)
              e[a] && t.virtual.slides.unshift(e[a]);
            ((n = i + e.length), (r = e.length));
          } else t.virtual.slides.unshift(e);
          if (t.params.virtual.cache) {
            var s = t.virtual.cache,
              o = {};
            (Object.keys(s).forEach(function (e) {
              o[parseInt(e, 10) + r] = s[e];
            }),
              (t.virtual.cache = o));
          }
          (t.virtual.update(!0), t.slideTo(n, 0));
        },
        removeSlide: function (e) {
          var t = this;
          if (null != e) {
            var i = t.activeIndex;
            if (Array.isArray(e))
              for (var n = e.length - 1; 0 <= n; n -= 1)
                (t.virtual.slides.splice(e[n], 1),
                  t.params.virtual.cache && delete t.virtual.cache[e[n]],
                  e[n] < i && (i -= 1),
                  (i = Math.max(i, 0)));
            else
              (t.virtual.slides.splice(e, 1),
                t.params.virtual.cache && delete t.virtual.cache[e],
                e < i && (i -= 1),
                (i = Math.max(i, 0)));
            (t.virtual.update(!0), t.slideTo(i, 0));
          }
        },
        removeAllSlides: function () {
          var e = this;
          ((e.virtual.slides = []),
            e.params.virtual.cache && (e.virtual.cache = {}),
            e.virtual.update(!0),
            e.slideTo(0, 0));
        },
      },
      _ = {
        name: "virtual",
        params: {
          virtual: {
            enabled: !1,
            slides: [],
            cache: !0,
            renderSlide: null,
            renderExternal: null,
            addSlidesBefore: 0,
            addSlidesAfter: 0,
          },
        },
        create: function () {
          var e = this;
          c.extend(e, {
            virtual: {
              update: O.update.bind(e),
              appendSlide: O.appendSlide.bind(e),
              prependSlide: O.prependSlide.bind(e),
              removeSlide: O.removeSlide.bind(e),
              removeAllSlides: O.removeAllSlides.bind(e),
              renderSlide: O.renderSlide.bind(e),
              slides: e.params.virtual.slides,
              cache: {},
            },
          });
        },
        on: {
          beforeInit: function () {
            var e = this;
            if (e.params.virtual.enabled) {
              e.classNames.push(e.params.containerModifierClass + "virtual");
              var t = { watchSlidesProgress: !0 };
              (c.extend(e.params, t),
                c.extend(e.originalParams, t),
                e.params.initialSlide || e.virtual.update());
            }
          },
          setTranslate: function () {
            this.params.virtual.enabled && this.virtual.update();
          },
        },
      },
      D = {
        handle: function (i) {
          var n = this,
            r = n.rtlTranslate,
            a = i;
          a.originalEvent && (a = a.originalEvent);
          var s = a.keyCode || a.charCode;
          if (
            !n.allowSlideNext &&
            ((n.isHorizontal() && 39 === s) || (n.isVertical() && 40 === s))
          )
            return !1;
          if (
            !n.allowSlidePrev &&
            ((n.isHorizontal() && 37 === s) || (n.isVertical() && 38 === s))
          )
            return !1;
          if (!(
            a.shiftKey ||
            a.altKey ||
            a.ctrlKey ||
            a.metaKey ||
            (e.activeElement &&
              e.activeElement.nodeName &&
              ("input" === e.activeElement.nodeName.toLowerCase() ||
                "textarea" === e.activeElement.nodeName.toLowerCase()))
          )) {
            if (
              n.params.keyboard.onlyInViewport &&
              (37 === s || 39 === s || 38 === s || 40 === s)
            ) {
              var o = !1;
              if (
                0 < n.$el.parents("." + n.params.slideClass).length &&
                0 === n.$el.parents("." + n.params.slideActiveClass).length
              )
                return;
              var l = t.innerWidth,
                d = t.innerHeight,
                c = n.$el.offset();
              r && (c.left -= n.$el[0].scrollLeft);
              for (
                var u = [
                    [c.left, c.top],
                    [c.left + n.width, c.top],
                    [c.left, c.top + n.height],
                    [c.left + n.width, c.top + n.height],
                  ],
                  p = 0;
                p < u.length;
                p += 1
              ) {
                var h = u[p];
                0 <= h[0] && h[0] <= l && 0 <= h[1] && h[1] <= d && (o = !0);
              }
              if (!o) return;
            }
            (n.isHorizontal()
              ? ((37 !== s && 39 !== s) ||
                  (a.preventDefault
                    ? a.preventDefault()
                    : (a.returnValue = !1)),
                ((39 === s && !r) || (37 === s && r)) && n.slideNext(),
                ((37 === s && !r) || (39 === s && r)) && n.slidePrev())
              : ((38 !== s && 40 !== s) ||
                  (a.preventDefault
                    ? a.preventDefault()
                    : (a.returnValue = !1)),
                40 === s && n.slideNext(),
                38 === s && n.slidePrev()),
              n.emit("keyPress", s));
          }
        },
        enable: function () {
          this.keyboard.enabled ||
            (n(e).on("keydown", this.keyboard.handle),
            (this.keyboard.enabled = !0));
        },
        disable: function () {
          this.keyboard.enabled &&
            (n(e).off("keydown", this.keyboard.handle),
            (this.keyboard.enabled = !1));
        },
      },
      N = {
        name: "keyboard",
        params: { keyboard: { enabled: !1, onlyInViewport: !0 } },
        create: function () {
          c.extend(this, {
            keyboard: {
              enabled: !1,
              enable: D.enable.bind(this),
              disable: D.disable.bind(this),
              handle: D.handle.bind(this),
            },
          });
        },
        on: {
          init: function () {
            this.params.keyboard.enabled && this.keyboard.enable();
          },
          destroy: function () {
            this.keyboard.enabled && this.keyboard.disable();
          },
        },
      },
      $ = {
        lastScrollTime: c.now(),
        event:
          -1 < t.navigator.userAgent.indexOf("firefox")
            ? "DOMMouseScroll"
            : (function () {
                  var t = "onwheel",
                    i = t in e;
                  if (!i) {
                    var n = e.createElement("div");
                    (n.setAttribute(t, "return;"),
                      (i = "function" == typeof n[t]));
                  }
                  return (
                    !i &&
                      e.implementation &&
                      e.implementation.hasFeature &&
                      !0 !== e.implementation.hasFeature("", "") &&
                      (i = e.implementation.hasFeature("Events.wheel", "3.0")),
                    i
                  );
                })()
              ? "wheel"
              : "mousewheel",
        normalize: function (e) {
          var t = 0,
            i = 0,
            n = 0,
            r = 0;
          return (
            "detail" in e && (i = e.detail),
            "wheelDelta" in e && (i = -e.wheelDelta / 120),
            "wheelDeltaY" in e && (i = -e.wheelDeltaY / 120),
            "wheelDeltaX" in e && (t = -e.wheelDeltaX / 120),
            "axis" in e && e.axis === e.HORIZONTAL_AXIS && ((t = i), (i = 0)),
            (n = 10 * t),
            (r = 10 * i),
            "deltaY" in e && (r = e.deltaY),
            "deltaX" in e && (n = e.deltaX),
            (n || r) &&
              e.deltaMode &&
              (1 === e.deltaMode
                ? ((n *= 40), (r *= 40))
                : ((n *= 800), (r *= 800))),
            n && !t && (t = n < 1 ? -1 : 1),
            r && !i && (i = r < 1 ? -1 : 1),
            { spinX: t, spinY: i, pixelX: n, pixelY: r }
          );
        },
        handleMouseEnter: function () {
          this.mouseEntered = !0;
        },
        handleMouseLeave: function () {
          this.mouseEntered = !1;
        },
        handle: function (e) {
          var i = e,
            n = this,
            r = n.params.mousewheel;
          if (!n.mouseEntered && !r.releaseOnEdges) return !0;
          i.originalEvent && (i = i.originalEvent);
          var a = 0,
            s = n.rtlTranslate ? -1 : 1,
            o = $.normalize(i);
          if (r.forceToAxis)
            if (n.isHorizontal()) {
              if (!(Math.abs(o.pixelX) > Math.abs(o.pixelY))) return !0;
              a = o.pixelX * s;
            } else {
              if (!(Math.abs(o.pixelY) > Math.abs(o.pixelX))) return !0;
              a = o.pixelY;
            }
          else
            a =
              Math.abs(o.pixelX) > Math.abs(o.pixelY)
                ? -o.pixelX * s
                : -o.pixelY;
          if (0 === a) return !0;
          if ((r.invert && (a = -a), n.params.freeMode)) {
            n.params.loop && n.loopFix();
            var l = n.getTranslate() + a * r.sensitivity,
              d = n.isBeginning,
              u = n.isEnd;
            if (
              (l >= n.minTranslate() && (l = n.minTranslate()),
              l <= n.maxTranslate() && (l = n.maxTranslate()),
              n.setTransition(0),
              n.setTranslate(l),
              n.updateProgress(),
              n.updateActiveIndex(),
              n.updateSlidesClasses(),
              ((!d && n.isBeginning) || (!u && n.isEnd)) &&
                n.updateSlidesClasses(),
              n.params.freeModeSticky &&
                (clearTimeout(n.mousewheel.timeout),
                (n.mousewheel.timeout = c.nextTick(function () {
                  n.slideToClosest();
                }, 300))),
              n.emit("scroll", i),
              n.params.autoplay &&
                n.params.autoplayDisableOnInteraction &&
                n.autoplay.stop(),
              l === n.minTranslate() || l === n.maxTranslate())
            )
              return !0;
          } else {
            if (60 < c.now() - n.mousewheel.lastScrollTime)
              if (a < 0)
                if ((n.isEnd && !n.params.loop) || n.animating) {
                  if (r.releaseOnEdges) return !0;
                } else (n.slideNext(), n.emit("scroll", i));
              else if ((n.isBeginning && !n.params.loop) || n.animating) {
                if (r.releaseOnEdges) return !0;
              } else (n.slidePrev(), n.emit("scroll", i));
            n.mousewheel.lastScrollTime = new t.Date().getTime();
          }
          return (
            i.preventDefault ? i.preventDefault() : (i.returnValue = !1),
            !1
          );
        },
        enable: function () {
          var e = this;
          if (!$.event) return !1;
          if (e.mousewheel.enabled) return !1;
          var t = e.$el;
          return (
            "container" !== e.params.mousewheel.eventsTarged &&
              (t = n(e.params.mousewheel.eventsTarged)),
            t.on("mouseenter", e.mousewheel.handleMouseEnter),
            t.on("mouseleave", e.mousewheel.handleMouseLeave),
            t.on($.event, e.mousewheel.handle),
            (e.mousewheel.enabled = !0)
          );
        },
        disable: function () {
          var e = this;
          if (!$.event) return !1;
          if (!e.mousewheel.enabled) return !1;
          var t = e.$el;
          return (
            "container" !== e.params.mousewheel.eventsTarged &&
              (t = n(e.params.mousewheel.eventsTarged)),
            t.off($.event, e.mousewheel.handle),
            !(e.mousewheel.enabled = !1)
          );
        },
      },
      F = {
        update: function () {
          var e = this,
            t = e.params.navigation;
          if (!e.params.loop) {
            var i = e.navigation,
              n = i.$nextEl,
              r = i.$prevEl;
            (r &&
              0 < r.length &&
              (e.isBeginning
                ? r.addClass(t.disabledClass)
                : r.removeClass(t.disabledClass),
              r[
                e.params.watchOverflow && e.isLocked
                  ? "addClass"
                  : "removeClass"
              ](t.lockClass)),
              n &&
                0 < n.length &&
                (e.isEnd
                  ? n.addClass(t.disabledClass)
                  : n.removeClass(t.disabledClass),
                n[
                  e.params.watchOverflow && e.isLocked
                    ? "addClass"
                    : "removeClass"
                ](t.lockClass)));
          }
        },
        onPrevClick: function (e) {
          (e.preventDefault(),
            (this.isBeginning && !this.params.loop) || this.slidePrev());
        },
        onNextClick: function (e) {
          (e.preventDefault(),
            (this.isEnd && !this.params.loop) || this.slideNext());
        },
        init: function () {
          var e,
            t,
            i = this,
            r = i.params.navigation;
          (r.nextEl || r.prevEl) &&
            (r.nextEl &&
              ((e = n(r.nextEl)),
              i.params.uniqueNavElements &&
                "string" == typeof r.nextEl &&
                1 < e.length &&
                1 === i.$el.find(r.nextEl).length &&
                (e = i.$el.find(r.nextEl))),
            r.prevEl &&
              ((t = n(r.prevEl)),
              i.params.uniqueNavElements &&
                "string" == typeof r.prevEl &&
                1 < t.length &&
                1 === i.$el.find(r.prevEl).length &&
                (t = i.$el.find(r.prevEl))),
            e && 0 < e.length && e.on("click", i.navigation.onNextClick),
            t && 0 < t.length && t.on("click", i.navigation.onPrevClick),
            c.extend(i.navigation, {
              $nextEl: e,
              nextEl: e && e[0],
              $prevEl: t,
              prevEl: t && t[0],
            }));
        },
        destroy: function () {
          var e = this,
            t = e.navigation,
            i = t.$nextEl,
            n = t.$prevEl;
          (i &&
            i.length &&
            (i.off("click", e.navigation.onNextClick),
            i.removeClass(e.params.navigation.disabledClass)),
            n &&
              n.length &&
              (n.off("click", e.navigation.onPrevClick),
              n.removeClass(e.params.navigation.disabledClass)));
        },
      },
      H = {
        update: function () {
          var e = this,
            t = e.rtl,
            i = e.params.pagination;
          if (
            i.el &&
            e.pagination.el &&
            e.pagination.$el &&
            0 !== e.pagination.$el.length
          ) {
            var r,
              a =
                e.virtual && e.params.virtual.enabled
                  ? e.virtual.slides.length
                  : e.slides.length,
              s = e.pagination.$el,
              o = e.params.loop
                ? Math.ceil((a - 2 * e.loopedSlides) / e.params.slidesPerGroup)
                : e.snapGrid.length;
            if (
              (e.params.loop
                ? ((r = Math.ceil(
                    (e.activeIndex - e.loopedSlides) / e.params.slidesPerGroup,
                  )) >
                    a - 1 - 2 * e.loopedSlides && (r -= a - 2 * e.loopedSlides),
                  o - 1 < r && (r -= o),
                  r < 0 && "bullets" !== e.params.paginationType && (r = o + r))
                : (r =
                    void 0 !== e.snapIndex ? e.snapIndex : e.activeIndex || 0),
              "bullets" === i.type &&
                e.pagination.bullets &&
                0 < e.pagination.bullets.length)
            ) {
              var l,
                d,
                c,
                u = e.pagination.bullets;
              if (
                (i.dynamicBullets &&
                  ((e.pagination.bulletSize = u
                    .eq(0)
                    [e.isHorizontal() ? "outerWidth" : "outerHeight"](!0)),
                  s.css(
                    e.isHorizontal() ? "width" : "height",
                    e.pagination.bulletSize * (i.dynamicMainBullets + 4) + "px",
                  ),
                  1 < i.dynamicMainBullets &&
                    void 0 !== e.previousIndex &&
                    ((e.pagination.dynamicBulletIndex += r - e.previousIndex),
                    e.pagination.dynamicBulletIndex > i.dynamicMainBullets - 1
                      ? (e.pagination.dynamicBulletIndex =
                          i.dynamicMainBullets - 1)
                      : e.pagination.dynamicBulletIndex < 0 &&
                        (e.pagination.dynamicBulletIndex = 0)),
                  (l = r - e.pagination.dynamicBulletIndex),
                  (c =
                    ((d = l + (Math.min(u.length, i.dynamicMainBullets) - 1)) +
                      l) /
                    2)),
                u.removeClass(
                  i.bulletActiveClass +
                    " " +
                    i.bulletActiveClass +
                    "-next " +
                    i.bulletActiveClass +
                    "-next-next " +
                    i.bulletActiveClass +
                    "-prev " +
                    i.bulletActiveClass +
                    "-prev-prev " +
                    i.bulletActiveClass +
                    "-main",
                ),
                1 < s.length)
              )
                u.each(function (e, t) {
                  var a = n(t),
                    s = a.index();
                  (s === r && a.addClass(i.bulletActiveClass),
                    i.dynamicBullets &&
                      (l <= s &&
                        s <= d &&
                        a.addClass(i.bulletActiveClass + "-main"),
                      s === l &&
                        a
                          .prev()
                          .addClass(i.bulletActiveClass + "-prev")
                          .prev()
                          .addClass(i.bulletActiveClass + "-prev-prev"),
                      s === d &&
                        a
                          .next()
                          .addClass(i.bulletActiveClass + "-next")
                          .next()
                          .addClass(i.bulletActiveClass + "-next-next")));
                });
              else if (
                (u.eq(r).addClass(i.bulletActiveClass), i.dynamicBullets)
              ) {
                for (var p = u.eq(l), h = u.eq(d), f = l; f <= d; f += 1)
                  u.eq(f).addClass(i.bulletActiveClass + "-main");
                (p
                  .prev()
                  .addClass(i.bulletActiveClass + "-prev")
                  .prev()
                  .addClass(i.bulletActiveClass + "-prev-prev"),
                  h
                    .next()
                    .addClass(i.bulletActiveClass + "-next")
                    .next()
                    .addClass(i.bulletActiveClass + "-next-next"));
              }
              if (i.dynamicBullets) {
                var v = Math.min(u.length, i.dynamicMainBullets + 4),
                  g =
                    (e.pagination.bulletSize * v - e.pagination.bulletSize) /
                      2 -
                    c * e.pagination.bulletSize,
                  m = t ? "right" : "left";
                u.css(e.isHorizontal() ? m : "top", g + "px");
              }
            }
            if (
              ("fraction" === i.type &&
                (s
                  .find("." + i.currentClass)
                  .text(i.formatFractionCurrent(r + 1)),
                s.find("." + i.totalClass).text(i.formatFractionTotal(o))),
              "progressbar" === i.type)
            ) {
              var b;
              b = i.progressbarOpposite
                ? e.isHorizontal()
                  ? "vertical"
                  : "horizontal"
                : e.isHorizontal()
                  ? "horizontal"
                  : "vertical";
              var x = (r + 1) / o,
                y = 1,
                w = 1;
              ("horizontal" === b ? (y = x) : (w = x),
                s
                  .find("." + i.progressbarFillClass)
                  .transform(
                    "translate3d(0,0,0) scaleX(" + y + ") scaleY(" + w + ")",
                  )
                  .transition(e.params.speed));
            }
            ("custom" === i.type && i.renderCustom
              ? (s.html(i.renderCustom(e, r + 1, o)),
                e.emit("paginationRender", e, s[0]))
              : e.emit("paginationUpdate", e, s[0]),
              s[
                e.params.watchOverflow && e.isLocked
                  ? "addClass"
                  : "removeClass"
              ](i.lockClass));
          }
        },
        render: function () {
          var e = this,
            t = e.params.pagination;
          if (
            t.el &&
            e.pagination.el &&
            e.pagination.$el &&
            0 !== e.pagination.$el.length
          ) {
            var i =
                e.virtual && e.params.virtual.enabled
                  ? e.virtual.slides.length
                  : e.slides.length,
              n = e.pagination.$el,
              r = "";
            if ("bullets" === t.type) {
              for (
                var a = e.params.loop
                    ? Math.ceil(
                        (i - 2 * e.loopedSlides) / e.params.slidesPerGroup,
                      )
                    : e.snapGrid.length,
                  s = 0;
                s < a;
                s += 1
              )
                t.renderBullet
                  ? (r += t.renderBullet.call(e, s, t.bulletClass))
                  : (r +=
                      "<" +
                      t.bulletElement +
                      ' class="' +
                      t.bulletClass +
                      '"></' +
                      t.bulletElement +
                      ">");
              (n.html(r), (e.pagination.bullets = n.find("." + t.bulletClass)));
            }
            ("fraction" === t.type &&
              ((r = t.renderFraction
                ? t.renderFraction.call(e, t.currentClass, t.totalClass)
                : '<span class="' +
                  t.currentClass +
                  '"></span> / <span class="' +
                  t.totalClass +
                  '"></span>'),
              n.html(r)),
              "progressbar" === t.type &&
                ((r = t.renderProgressbar
                  ? t.renderProgressbar.call(e, t.progressbarFillClass)
                  : '<span class="' + t.progressbarFillClass + '"></span>'),
                n.html(r)),
              "custom" !== t.type &&
                e.emit("paginationRender", e.pagination.$el[0]));
          }
        },
        init: function () {
          var e = this,
            t = e.params.pagination;
          if (t.el) {
            var i = n(t.el);
            0 !== i.length &&
              (e.params.uniqueNavElements &&
                "string" == typeof t.el &&
                1 < i.length &&
                1 === e.$el.find(t.el).length &&
                (i = e.$el.find(t.el)),
              "bullets" === t.type &&
                t.clickable &&
                i.addClass(t.clickableClass),
              i.addClass(t.modifierClass + t.type),
              "bullets" === t.type &&
                t.dynamicBullets &&
                (i.addClass("" + t.modifierClass + t.type + "-dynamic"),
                (e.pagination.dynamicBulletIndex = 0),
                t.dynamicMainBullets < 1 && (t.dynamicMainBullets = 1)),
              "progressbar" === t.type &&
                t.progressbarOpposite &&
                i.addClass(t.progressbarOppositeClass),
              t.clickable &&
                i.on("click", "." + t.bulletClass, function (t) {
                  t.preventDefault();
                  var i = n(this).index() * e.params.slidesPerGroup;
                  (e.params.loop && (i += e.loopedSlides), e.slideTo(i));
                }),
              c.extend(e.pagination, { $el: i, el: i[0] }));
          }
        },
        destroy: function () {
          var e = this,
            t = e.params.pagination;
          if (
            t.el &&
            e.pagination.el &&
            e.pagination.$el &&
            0 !== e.pagination.$el.length
          ) {
            var i = e.pagination.$el;
            (i.removeClass(t.hiddenClass),
              i.removeClass(t.modifierClass + t.type),
              e.pagination.bullets &&
                e.pagination.bullets.removeClass(t.bulletActiveClass),
              t.clickable && i.off("click", "." + t.bulletClass));
          }
        },
      },
      R = {
        setTranslate: function () {
          var e = this;
          if (e.params.scrollbar.el && e.scrollbar.el) {
            var t = e.scrollbar,
              i = e.rtlTranslate,
              n = e.progress,
              r = t.dragSize,
              a = t.trackSize,
              s = t.$dragEl,
              o = t.$el,
              l = e.params.scrollbar,
              d = r,
              c = (a - r) * n;
            (i
              ? 0 < (c = -c)
                ? ((d = r - c), (c = 0))
                : a < -c + r && (d = a + c)
              : c < 0
                ? ((d = r + c), (c = 0))
                : a < c + r && (d = a - c),
              e.isHorizontal()
                ? (u.transforms3d
                    ? s.transform("translate3d(" + c + "px, 0, 0)")
                    : s.transform("translateX(" + c + "px)"),
                  (s[0].style.width = d + "px"))
                : (u.transforms3d
                    ? s.transform("translate3d(0px, " + c + "px, 0)")
                    : s.transform("translateY(" + c + "px)"),
                  (s[0].style.height = d + "px")),
              l.hide &&
                (clearTimeout(e.scrollbar.timeout),
                (o[0].style.opacity = 1),
                (e.scrollbar.timeout = setTimeout(function () {
                  ((o[0].style.opacity = 0), o.transition(400));
                }, 1e3))));
          }
        },
        setTransition: function (e) {
          this.params.scrollbar.el &&
            this.scrollbar.el &&
            this.scrollbar.$dragEl.transition(e);
        },
        updateSize: function () {
          var e = this;
          if (e.params.scrollbar.el && e.scrollbar.el) {
            var t = e.scrollbar,
              i = t.$dragEl,
              n = t.$el;
            ((i[0].style.width = ""), (i[0].style.height = ""));
            var r,
              a = e.isHorizontal() ? n[0].offsetWidth : n[0].offsetHeight,
              s = e.size / e.virtualSize,
              o = s * (a / e.size);
            ((r =
              "auto" === e.params.scrollbar.dragSize
                ? a * s
                : parseInt(e.params.scrollbar.dragSize, 10)),
              e.isHorizontal()
                ? (i[0].style.width = r + "px")
                : (i[0].style.height = r + "px"),
              (n[0].style.display = 1 <= s ? "none" : ""),
              e.params.scrollbar.hide && (n[0].style.opacity = 0),
              c.extend(t, {
                trackSize: a,
                divider: s,
                moveDivider: o,
                dragSize: r,
              }),
              t.$el[
                e.params.watchOverflow && e.isLocked
                  ? "addClass"
                  : "removeClass"
              ](e.params.scrollbar.lockClass));
          }
        },
        setDragPosition: function (e) {
          var t,
            i = this,
            n = i.scrollbar,
            r = i.rtlTranslate,
            a = n.$el,
            s = n.dragSize,
            o = n.trackSize;
          ((t =
            ((i.isHorizontal()
              ? "touchstart" === e.type || "touchmove" === e.type
                ? e.targetTouches[0].pageX
                : e.pageX || e.clientX
              : "touchstart" === e.type || "touchmove" === e.type
                ? e.targetTouches[0].pageY
                : e.pageY || e.clientY) -
              a.offset()[i.isHorizontal() ? "left" : "top"] -
              s / 2) /
            (o - s)),
            (t = Math.max(Math.min(t, 1), 0)),
            r && (t = 1 - t));
          var l = i.minTranslate() + (i.maxTranslate() - i.minTranslate()) * t;
          (i.updateProgress(l),
            i.setTranslate(l),
            i.updateActiveIndex(),
            i.updateSlidesClasses());
        },
        onDragStart: function (e) {
          var t = this,
            i = t.params.scrollbar,
            n = t.scrollbar,
            r = t.$wrapperEl,
            a = n.$el,
            s = n.$dragEl;
          ((t.scrollbar.isTouched = !0),
            e.preventDefault(),
            e.stopPropagation(),
            r.transition(100),
            s.transition(100),
            n.setDragPosition(e),
            clearTimeout(t.scrollbar.dragTimeout),
            a.transition(0),
            i.hide && a.css("opacity", 1),
            t.emit("scrollbarDragStart", e));
        },
        onDragMove: function (e) {
          var t = this.scrollbar,
            i = this.$wrapperEl,
            n = t.$el,
            r = t.$dragEl;
          this.scrollbar.isTouched &&
            (e.preventDefault ? e.preventDefault() : (e.returnValue = !1),
            t.setDragPosition(e),
            i.transition(0),
            n.transition(0),
            r.transition(0),
            this.emit("scrollbarDragMove", e));
        },
        onDragEnd: function (e) {
          var t = this,
            i = t.params.scrollbar,
            n = t.scrollbar.$el;
          t.scrollbar.isTouched &&
            ((t.scrollbar.isTouched = !1),
            i.hide &&
              (clearTimeout(t.scrollbar.dragTimeout),
              (t.scrollbar.dragTimeout = c.nextTick(function () {
                (n.css("opacity", 0), n.transition(400));
              }, 1e3))),
            t.emit("scrollbarDragEnd", e),
            i.snapOnRelease && t.slideToClosest());
        },
        enableDraggable: function () {
          var t = this;
          if (t.params.scrollbar.el) {
            var i = t.scrollbar,
              n = t.touchEventsTouch,
              r = t.touchEventsDesktop,
              a = t.params,
              s = i.$el[0],
              o = !(!u.passiveListener || !a.passiveListeners) && {
                passive: !1,
                capture: !1,
              },
              l = !(!u.passiveListener || !a.passiveListeners) && {
                passive: !0,
                capture: !1,
              };
            u.touch
              ? (s.addEventListener(n.start, t.scrollbar.onDragStart, o),
                s.addEventListener(n.move, t.scrollbar.onDragMove, o),
                s.addEventListener(n.end, t.scrollbar.onDragEnd, l))
              : (s.addEventListener(r.start, t.scrollbar.onDragStart, o),
                e.addEventListener(r.move, t.scrollbar.onDragMove, o),
                e.addEventListener(r.end, t.scrollbar.onDragEnd, l));
          }
        },
        disableDraggable: function () {
          var t = this;
          if (t.params.scrollbar.el) {
            var i = t.scrollbar,
              n = t.touchEventsTouch,
              r = t.touchEventsDesktop,
              a = t.params,
              s = i.$el[0],
              o = !(!u.passiveListener || !a.passiveListeners) && {
                passive: !1,
                capture: !1,
              },
              l = !(!u.passiveListener || !a.passiveListeners) && {
                passive: !0,
                capture: !1,
              };
            u.touch
              ? (s.removeEventListener(n.start, t.scrollbar.onDragStart, o),
                s.removeEventListener(n.move, t.scrollbar.onDragMove, o),
                s.removeEventListener(n.end, t.scrollbar.onDragEnd, l))
              : (s.removeEventListener(r.start, t.scrollbar.onDragStart, o),
                e.removeEventListener(r.move, t.scrollbar.onDragMove, o),
                e.removeEventListener(r.end, t.scrollbar.onDragEnd, l));
          }
        },
        init: function () {
          var e = this;
          if (e.params.scrollbar.el) {
            var t = e.scrollbar,
              i = e.$el,
              r = e.params.scrollbar,
              a = n(r.el);
            e.params.uniqueNavElements &&
              "string" == typeof r.el &&
              1 < a.length &&
              1 === i.find(r.el).length &&
              (a = i.find(r.el));
            var s = a.find("." + e.params.scrollbar.dragClass);
            (0 === s.length &&
              ((s = n(
                '<div class="' + e.params.scrollbar.dragClass + '"></div>',
              )),
              a.append(s)),
              c.extend(t, { $el: a, el: a[0], $dragEl: s, dragEl: s[0] }),
              r.draggable && t.enableDraggable());
          }
        },
        destroy: function () {
          this.scrollbar.disableDraggable();
        },
      },
      B = {
        setTransform: function (e, t) {
          var i = this.rtl,
            r = n(e),
            a = i ? -1 : 1,
            s = r.attr("data-swiper-parallax") || "0",
            o = r.attr("data-swiper-parallax-x"),
            l = r.attr("data-swiper-parallax-y"),
            d = r.attr("data-swiper-parallax-scale"),
            c = r.attr("data-swiper-parallax-opacity");
          if (
            (o || l
              ? ((o = o || "0"), (l = l || "0"))
              : this.isHorizontal()
                ? ((o = s), (l = "0"))
                : ((l = s), (o = "0")),
            (o =
              0 <= o.indexOf("%")
                ? parseInt(o, 10) * t * a + "%"
                : o * t * a + "px"),
            (l =
              0 <= l.indexOf("%") ? parseInt(l, 10) * t + "%" : l * t + "px"),
            null != c)
          ) {
            var u = c - (c - 1) * (1 - Math.abs(t));
            r[0].style.opacity = u;
          }
          if (null == d) r.transform("translate3d(" + o + ", " + l + ", 0px)");
          else {
            var p = d - (d - 1) * (1 - Math.abs(t));
            r.transform(
              "translate3d(" + o + ", " + l + ", 0px) scale(" + p + ")",
            );
          }
        },
        setTranslate: function () {
          var e = this,
            t = e.$el,
            i = e.slides,
            r = e.progress,
            a = e.snapGrid;
          (t
            .children(
              "[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]",
            )
            .each(function (t, i) {
              e.parallax.setTransform(i, r);
            }),
            i.each(function (t, i) {
              var s = i.progress;
              (1 < e.params.slidesPerGroup &&
                "auto" !== e.params.slidesPerView &&
                (s += Math.ceil(t / 2) - r * (a.length - 1)),
                (s = Math.min(Math.max(s, -1), 1)),
                n(i)
                  .find(
                    "[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]",
                  )
                  .each(function (t, i) {
                    e.parallax.setTransform(i, s);
                  }));
            }));
        },
        setTransition: function (e) {
          (void 0 === e && (e = this.params.speed),
            this.$el
              .find(
                "[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y]",
              )
              .each(function (t, i) {
                var r = n(i),
                  a =
                    parseInt(r.attr("data-swiper-parallax-duration"), 10) || e;
                (0 === e && (a = 0), r.transition(a));
              }));
        },
      },
      X = {
        getDistanceBetweenTouches: function (e) {
          if (e.targetTouches.length < 2) return 1;
          var t = e.targetTouches[0].pageX,
            i = e.targetTouches[0].pageY,
            n = e.targetTouches[1].pageX,
            r = e.targetTouches[1].pageY;
          return Math.sqrt(Math.pow(n - t, 2) + Math.pow(r - i, 2));
        },
        onGestureStart: function (e) {
          var t = this,
            i = t.params.zoom,
            r = t.zoom,
            a = r.gesture;
          if (
            ((r.fakeGestureTouched = !1),
            (r.fakeGestureMoved = !1),
            !u.gestures)
          ) {
            if (
              "touchstart" !== e.type ||
              ("touchstart" === e.type && e.targetTouches.length < 2)
            )
              return;
            ((r.fakeGestureTouched = !0),
              (a.scaleStart = X.getDistanceBetweenTouches(e)));
          }
          (a.$slideEl && a.$slideEl.length) ||
          ((a.$slideEl = n(e.target).closest(".swiper-slide")),
          0 === a.$slideEl.length && (a.$slideEl = t.slides.eq(t.activeIndex)),
          (a.$imageEl = a.$slideEl.find("img, svg, canvas")),
          (a.$imageWrapEl = a.$imageEl.parent("." + i.containerClass)),
          (a.maxRatio = a.$imageWrapEl.attr("data-swiper-zoom") || i.maxRatio),
          0 !== a.$imageWrapEl.length)
            ? (a.$imageEl.transition(0), (t.zoom.isScaling = !0))
            : (a.$imageEl = void 0);
        },
        onGestureChange: function (e) {
          var t = this.params.zoom,
            i = this.zoom,
            n = i.gesture;
          if (!u.gestures) {
            if (
              "touchmove" !== e.type ||
              ("touchmove" === e.type && e.targetTouches.length < 2)
            )
              return;
            ((i.fakeGestureMoved = !0),
              (n.scaleMove = X.getDistanceBetweenTouches(e)));
          }
          n.$imageEl &&
            0 !== n.$imageEl.length &&
            ((i.scale = u.gestures
              ? e.scale * i.currentScale
              : (n.scaleMove / n.scaleStart) * i.currentScale),
            i.scale > n.maxRatio &&
              (i.scale =
                n.maxRatio - 1 + Math.pow(i.scale - n.maxRatio + 1, 0.5)),
            i.scale < t.minRatio &&
              (i.scale =
                t.minRatio + 1 - Math.pow(t.minRatio - i.scale + 1, 0.5)),
            n.$imageEl.transform("translate3d(0,0,0) scale(" + i.scale + ")"));
        },
        onGestureEnd: function (e) {
          var t = this.params.zoom,
            i = this.zoom,
            n = i.gesture;
          if (!u.gestures) {
            if (!i.fakeGestureTouched || !i.fakeGestureMoved) return;
            if (
              "touchend" !== e.type ||
              ("touchend" === e.type &&
                e.changedTouches.length < 2 &&
                !w.android)
            )
              return;
            ((i.fakeGestureTouched = !1), (i.fakeGestureMoved = !1));
          }
          n.$imageEl &&
            0 !== n.$imageEl.length &&
            ((i.scale = Math.max(Math.min(i.scale, n.maxRatio), t.minRatio)),
            n.$imageEl
              .transition(this.params.speed)
              .transform("translate3d(0,0,0) scale(" + i.scale + ")"),
            (i.currentScale = i.scale),
            (i.isScaling = !1),
            1 === i.scale && (n.$slideEl = void 0));
        },
        onTouchStart: function (e) {
          var t = this.zoom,
            i = t.gesture,
            n = t.image;
          i.$imageEl &&
            0 !== i.$imageEl.length &&
            (n.isTouched ||
              (w.android && e.preventDefault(),
              (n.isTouched = !0),
              (n.touchesStart.x =
                "touchstart" === e.type ? e.targetTouches[0].pageX : e.pageX),
              (n.touchesStart.y =
                "touchstart" === e.type ? e.targetTouches[0].pageY : e.pageY)));
        },
        onTouchMove: function (e) {
          var t = this,
            i = t.zoom,
            n = i.gesture,
            r = i.image,
            a = i.velocity;
          if (
            n.$imageEl &&
            0 !== n.$imageEl.length &&
            ((t.allowClick = !1), r.isTouched && n.$slideEl)
          ) {
            r.isMoved ||
              ((r.width = n.$imageEl[0].offsetWidth),
              (r.height = n.$imageEl[0].offsetHeight),
              (r.startX = c.getTranslate(n.$imageWrapEl[0], "x") || 0),
              (r.startY = c.getTranslate(n.$imageWrapEl[0], "y") || 0),
              (n.slideWidth = n.$slideEl[0].offsetWidth),
              (n.slideHeight = n.$slideEl[0].offsetHeight),
              n.$imageWrapEl.transition(0),
              t.rtl && ((r.startX = -r.startX), (r.startY = -r.startY)));
            var s = r.width * i.scale,
              o = r.height * i.scale;
            if (!(s < n.slideWidth && o < n.slideHeight)) {
              if (
                ((r.minX = Math.min(n.slideWidth / 2 - s / 2, 0)),
                (r.maxX = -r.minX),
                (r.minY = Math.min(n.slideHeight / 2 - o / 2, 0)),
                (r.maxY = -r.minY),
                (r.touchesCurrent.x =
                  "touchmove" === e.type ? e.targetTouches[0].pageX : e.pageX),
                (r.touchesCurrent.y =
                  "touchmove" === e.type ? e.targetTouches[0].pageY : e.pageY),
                !r.isMoved && !i.isScaling)
              ) {
                if (
                  t.isHorizontal() &&
                  ((Math.floor(r.minX) === Math.floor(r.startX) &&
                    r.touchesCurrent.x < r.touchesStart.x) ||
                    (Math.floor(r.maxX) === Math.floor(r.startX) &&
                      r.touchesCurrent.x > r.touchesStart.x))
                )
                  return void (r.isTouched = !1);
                if (
                  !t.isHorizontal() &&
                  ((Math.floor(r.minY) === Math.floor(r.startY) &&
                    r.touchesCurrent.y < r.touchesStart.y) ||
                    (Math.floor(r.maxY) === Math.floor(r.startY) &&
                      r.touchesCurrent.y > r.touchesStart.y))
                )
                  return void (r.isTouched = !1);
              }
              (e.preventDefault(),
                e.stopPropagation(),
                (r.isMoved = !0),
                (r.currentX = r.touchesCurrent.x - r.touchesStart.x + r.startX),
                (r.currentY = r.touchesCurrent.y - r.touchesStart.y + r.startY),
                r.currentX < r.minX &&
                  (r.currentX =
                    r.minX + 1 - Math.pow(r.minX - r.currentX + 1, 0.8)),
                r.currentX > r.maxX &&
                  (r.currentX =
                    r.maxX - 1 + Math.pow(r.currentX - r.maxX + 1, 0.8)),
                r.currentY < r.minY &&
                  (r.currentY =
                    r.minY + 1 - Math.pow(r.minY - r.currentY + 1, 0.8)),
                r.currentY > r.maxY &&
                  (r.currentY =
                    r.maxY - 1 + Math.pow(r.currentY - r.maxY + 1, 0.8)),
                a.prevPositionX || (a.prevPositionX = r.touchesCurrent.x),
                a.prevPositionY || (a.prevPositionY = r.touchesCurrent.y),
                a.prevTime || (a.prevTime = Date.now()),
                (a.x =
                  (r.touchesCurrent.x - a.prevPositionX) /
                  (Date.now() - a.prevTime) /
                  2),
                (a.y =
                  (r.touchesCurrent.y - a.prevPositionY) /
                  (Date.now() - a.prevTime) /
                  2),
                Math.abs(r.touchesCurrent.x - a.prevPositionX) < 2 && (a.x = 0),
                Math.abs(r.touchesCurrent.y - a.prevPositionY) < 2 && (a.y = 0),
                (a.prevPositionX = r.touchesCurrent.x),
                (a.prevPositionY = r.touchesCurrent.y),
                (a.prevTime = Date.now()),
                n.$imageWrapEl.transform(
                  "translate3d(" + r.currentX + "px, " + r.currentY + "px,0)",
                ));
            }
          }
        },
        onTouchEnd: function () {
          var e = this.zoom,
            t = e.gesture,
            i = e.image,
            n = e.velocity;
          if (t.$imageEl && 0 !== t.$imageEl.length) {
            if (!i.isTouched || !i.isMoved)
              return ((i.isTouched = !1), void (i.isMoved = !1));
            ((i.isTouched = !1), (i.isMoved = !1));
            var r = 300,
              a = 300,
              s = n.x * r,
              o = i.currentX + s,
              l = n.y * a,
              d = i.currentY + l;
            (0 !== n.x && (r = Math.abs((o - i.currentX) / n.x)),
              0 !== n.y && (a = Math.abs((d - i.currentY) / n.y)));
            var c = Math.max(r, a);
            ((i.currentX = o), (i.currentY = d));
            var u = i.width * e.scale,
              p = i.height * e.scale;
            ((i.minX = Math.min(t.slideWidth / 2 - u / 2, 0)),
              (i.maxX = -i.minX),
              (i.minY = Math.min(t.slideHeight / 2 - p / 2, 0)),
              (i.maxY = -i.minY),
              (i.currentX = Math.max(Math.min(i.currentX, i.maxX), i.minX)),
              (i.currentY = Math.max(Math.min(i.currentY, i.maxY), i.minY)),
              t.$imageWrapEl
                .transition(c)
                .transform(
                  "translate3d(" + i.currentX + "px, " + i.currentY + "px,0)",
                ));
          }
        },
        onTransitionEnd: function () {
          var e = this.zoom,
            t = e.gesture;
          t.$slideEl &&
            this.previousIndex !== this.activeIndex &&
            (t.$imageEl.transform("translate3d(0,0,0) scale(1)"),
            t.$imageWrapEl.transform("translate3d(0,0,0)"),
            (e.scale = 1),
            (e.currentScale = 1),
            (t.$slideEl = void 0),
            (t.$imageEl = void 0),
            (t.$imageWrapEl = void 0));
        },
        toggle: function (e) {
          var t = this.zoom;
          t.scale && 1 !== t.scale ? t.out() : t.in(e);
        },
        in: function (e) {
          var t,
            i,
            r,
            a,
            s,
            o,
            l,
            d,
            c,
            u,
            p,
            h,
            f,
            v,
            g,
            m,
            b = this,
            x = b.zoom,
            y = b.params.zoom,
            w = x.gesture,
            S = x.image;
          (w.$slideEl ||
            ((w.$slideEl = b.clickedSlide
              ? n(b.clickedSlide)
              : b.slides.eq(b.activeIndex)),
            (w.$imageEl = w.$slideEl.find("img, svg, canvas")),
            (w.$imageWrapEl = w.$imageEl.parent("." + y.containerClass))),
            w.$imageEl &&
              0 !== w.$imageEl.length &&
              (w.$slideEl.addClass("" + y.zoomedSlideClass),
              void 0 === S.touchesStart.x && e
                ? ((t =
                    "touchend" === e.type
                      ? e.changedTouches[0].pageX
                      : e.pageX),
                  (i =
                    "touchend" === e.type
                      ? e.changedTouches[0].pageY
                      : e.pageY))
                : ((t = S.touchesStart.x), (i = S.touchesStart.y)),
              (x.scale = w.$imageWrapEl.attr("data-swiper-zoom") || y.maxRatio),
              (x.currentScale =
                w.$imageWrapEl.attr("data-swiper-zoom") || y.maxRatio),
              e
                ? ((g = w.$slideEl[0].offsetWidth),
                  (m = w.$slideEl[0].offsetHeight),
                  (r = w.$slideEl.offset().left + g / 2 - t),
                  (a = w.$slideEl.offset().top + m / 2 - i),
                  (l = w.$imageEl[0].offsetWidth),
                  (d = w.$imageEl[0].offsetHeight),
                  (c = l * x.scale),
                  (u = d * x.scale),
                  (f = -(p = Math.min(g / 2 - c / 2, 0))),
                  (v = -(h = Math.min(m / 2 - u / 2, 0))),
                  (s = r * x.scale) < p && (s = p),
                  f < s && (s = f),
                  (o = a * x.scale) < h && (o = h),
                  v < o && (o = v))
                : (o = s = 0),
              w.$imageWrapEl
                .transition(300)
                .transform("translate3d(" + s + "px, " + o + "px,0)"),
              w.$imageEl
                .transition(300)
                .transform("translate3d(0,0,0) scale(" + x.scale + ")")));
        },
        out: function () {
          var e = this,
            t = e.zoom,
            i = e.params.zoom,
            r = t.gesture;
          (r.$slideEl ||
            ((r.$slideEl = e.clickedSlide
              ? n(e.clickedSlide)
              : e.slides.eq(e.activeIndex)),
            (r.$imageEl = r.$slideEl.find("img, svg, canvas")),
            (r.$imageWrapEl = r.$imageEl.parent("." + i.containerClass))),
            r.$imageEl &&
              0 !== r.$imageEl.length &&
              ((t.scale = 1),
              (t.currentScale = 1),
              r.$imageWrapEl.transition(300).transform("translate3d(0,0,0)"),
              r.$imageEl
                .transition(300)
                .transform("translate3d(0,0,0) scale(1)"),
              r.$slideEl.removeClass("" + i.zoomedSlideClass),
              (r.$slideEl = void 0)));
        },
        enable: function () {
          var e = this,
            t = e.zoom;
          if (!t.enabled) {
            t.enabled = !0;
            var i = !(
              "touchstart" !== e.touchEvents.start ||
              !u.passiveListener ||
              !e.params.passiveListeners
            ) && { passive: !0, capture: !1 };
            (u.gestures
              ? (e.$wrapperEl.on(
                  "gesturestart",
                  ".swiper-slide",
                  t.onGestureStart,
                  i,
                ),
                e.$wrapperEl.on(
                  "gesturechange",
                  ".swiper-slide",
                  t.onGestureChange,
                  i,
                ),
                e.$wrapperEl.on(
                  "gestureend",
                  ".swiper-slide",
                  t.onGestureEnd,
                  i,
                ))
              : "touchstart" === e.touchEvents.start &&
                (e.$wrapperEl.on(
                  e.touchEvents.start,
                  ".swiper-slide",
                  t.onGestureStart,
                  i,
                ),
                e.$wrapperEl.on(
                  e.touchEvents.move,
                  ".swiper-slide",
                  t.onGestureChange,
                  i,
                ),
                e.$wrapperEl.on(
                  e.touchEvents.end,
                  ".swiper-slide",
                  t.onGestureEnd,
                  i,
                )),
              e.$wrapperEl.on(
                e.touchEvents.move,
                "." + e.params.zoom.containerClass,
                t.onTouchMove,
              ));
          }
        },
        disable: function () {
          var e = this,
            t = e.zoom;
          if (t.enabled) {
            e.zoom.enabled = !1;
            var i = !(
              "touchstart" !== e.touchEvents.start ||
              !u.passiveListener ||
              !e.params.passiveListeners
            ) && { passive: !0, capture: !1 };
            (u.gestures
              ? (e.$wrapperEl.off(
                  "gesturestart",
                  ".swiper-slide",
                  t.onGestureStart,
                  i,
                ),
                e.$wrapperEl.off(
                  "gesturechange",
                  ".swiper-slide",
                  t.onGestureChange,
                  i,
                ),
                e.$wrapperEl.off(
                  "gestureend",
                  ".swiper-slide",
                  t.onGestureEnd,
                  i,
                ))
              : "touchstart" === e.touchEvents.start &&
                (e.$wrapperEl.off(
                  e.touchEvents.start,
                  ".swiper-slide",
                  t.onGestureStart,
                  i,
                ),
                e.$wrapperEl.off(
                  e.touchEvents.move,
                  ".swiper-slide",
                  t.onGestureChange,
                  i,
                ),
                e.$wrapperEl.off(
                  e.touchEvents.end,
                  ".swiper-slide",
                  t.onGestureEnd,
                  i,
                )),
              e.$wrapperEl.off(
                e.touchEvents.move,
                "." + e.params.zoom.containerClass,
                t.onTouchMove,
              ));
          }
        },
      },
      Y = {
        loadInSlide: function (e, t) {
          void 0 === t && (t = !0);
          var i = this,
            r = i.params.lazy;
          if (void 0 !== e && 0 !== i.slides.length) {
            var a =
                i.virtual && i.params.virtual.enabled
                  ? i.$wrapperEl.children(
                      "." +
                        i.params.slideClass +
                        '[data-swiper-slide-index="' +
                        e +
                        '"]',
                    )
                  : i.slides.eq(e),
              s = a.find(
                "." +
                  r.elementClass +
                  ":not(." +
                  r.loadedClass +
                  "):not(." +
                  r.loadingClass +
                  ")",
              );
            (!a.hasClass(r.elementClass) ||
              a.hasClass(r.loadedClass) ||
              a.hasClass(r.loadingClass) ||
              (s = s.add(a[0])),
              0 !== s.length &&
                s.each(function (e, s) {
                  var o = n(s);
                  o.addClass(r.loadingClass);
                  var l = o.attr("data-background"),
                    d = o.attr("data-src"),
                    c = o.attr("data-srcset"),
                    u = o.attr("data-sizes");
                  (i.loadImage(o[0], d || l, c, u, !1, function () {
                    if (null != i && i && (!i || i.params) && !i.destroyed) {
                      if (
                        (l
                          ? (o.css("background-image", 'url("' + l + '")'),
                            o.removeAttr("data-background"))
                          : (c &&
                              (o.attr("srcset", c),
                              o.removeAttr("data-srcset")),
                            u &&
                              (o.attr("sizes", u), o.removeAttr("data-sizes")),
                            d && (o.attr("src", d), o.removeAttr("data-src"))),
                        o.addClass(r.loadedClass).removeClass(r.loadingClass),
                        a.find("." + r.preloaderClass).remove(),
                        i.params.loop && t)
                      ) {
                        var e = a.attr("data-swiper-slide-index");
                        if (a.hasClass(i.params.slideDuplicateClass)) {
                          var n = i.$wrapperEl.children(
                            '[data-swiper-slide-index="' +
                              e +
                              '"]:not(.' +
                              i.params.slideDuplicateClass +
                              ")",
                          );
                          i.lazy.loadInSlide(n.index(), !1);
                        } else {
                          var s = i.$wrapperEl.children(
                            "." +
                              i.params.slideDuplicateClass +
                              '[data-swiper-slide-index="' +
                              e +
                              '"]',
                          );
                          i.lazy.loadInSlide(s.index(), !1);
                        }
                      }
                      i.emit("lazyImageReady", a[0], o[0]);
                    }
                  }),
                    i.emit("lazyImageLoad", a[0], o[0]));
                }));
          }
        },
        load: function () {
          var e = this,
            t = e.$wrapperEl,
            i = e.params,
            r = e.slides,
            a = e.activeIndex,
            s = e.virtual && i.virtual.enabled,
            o = i.lazy,
            l = i.slidesPerView;
          function d(e) {
            if (s) {
              if (
                t.children(
                  "." + i.slideClass + '[data-swiper-slide-index="' + e + '"]',
                ).length
              )
                return !0;
            } else if (r[e]) return !0;
            return !1;
          }
          function c(e) {
            return s ? n(e).attr("data-swiper-slide-index") : n(e).index();
          }
          if (
            ("auto" === l && (l = 0),
            e.lazy.initialImageLoaded || (e.lazy.initialImageLoaded = !0),
            e.params.watchSlidesVisibility)
          )
            t.children("." + i.slideVisibleClass).each(function (t, i) {
              var r = s ? n(i).attr("data-swiper-slide-index") : n(i).index();
              e.lazy.loadInSlide(r);
            });
          else if (1 < l)
            for (var u = a; u < a + l; u += 1) d(u) && e.lazy.loadInSlide(u);
          else e.lazy.loadInSlide(a);
          if (o.loadPrevNext)
            if (1 < l || (o.loadPrevNextAmount && 1 < o.loadPrevNextAmount)) {
              for (
                var p = o.loadPrevNextAmount,
                  h = l,
                  f = Math.min(a + h + Math.max(p, h), r.length),
                  v = Math.max(a - Math.max(h, p), 0),
                  g = a + l;
                g < f;
                g += 1
              )
                d(g) && e.lazy.loadInSlide(g);
              for (var m = v; m < a; m += 1) d(m) && e.lazy.loadInSlide(m);
            } else {
              var b = t.children("." + i.slideNextClass);
              0 < b.length && e.lazy.loadInSlide(c(b));
              var x = t.children("." + i.slidePrevClass);
              0 < x.length && e.lazy.loadInSlide(c(x));
            }
        },
      },
      V = {
        LinearSpline: function (e, t) {
          var i, n, r, a, s;
          return (
            (this.x = e),
            (this.y = t),
            (this.lastIndex = e.length - 1),
            (this.interpolate = function (e) {
              return e
                ? ((s = (function (e, t) {
                    for (n = -1, i = e.length; 1 < i - n;)
                      e[(r = (i + n) >> 1)] <= t ? (n = r) : (i = r);
                    return i;
                  })(this.x, e)),
                  (a = s - 1),
                  ((e - this.x[a]) * (this.y[s] - this.y[a])) /
                    (this.x[s] - this.x[a]) +
                    this.y[a])
                : 0;
            }),
            this
          );
        },
        getInterpolateFunction: function (e) {
          var t = this;
          t.controller.spline ||
            (t.controller.spline = t.params.loop
              ? new V.LinearSpline(t.slidesGrid, e.slidesGrid)
              : new V.LinearSpline(t.snapGrid, e.snapGrid));
        },
        setTranslate: function (e, t) {
          var i,
            n,
            r = this,
            a = r.controller.control;
          function s(e) {
            var t = r.rtlTranslate ? -r.translate : r.translate;
            ("slide" === r.params.controller.by &&
              (r.controller.getInterpolateFunction(e),
              (n = -r.controller.spline.interpolate(-t))),
              (n && "container" !== r.params.controller.by) ||
                ((i =
                  (e.maxTranslate() - e.minTranslate()) /
                  (r.maxTranslate() - r.minTranslate())),
                (n = (t - r.minTranslate()) * i + e.minTranslate())),
              r.params.controller.inverse && (n = e.maxTranslate() - n),
              e.updateProgress(n),
              e.setTranslate(n, r),
              e.updateActiveIndex(),
              e.updateSlidesClasses());
          }
          if (Array.isArray(a))
            for (var o = 0; o < a.length; o += 1)
              a[o] !== t && a[o] instanceof M && s(a[o]);
          else a instanceof M && t !== a && s(a);
        },
        setTransition: function (e, t) {
          var i,
            n = this,
            r = n.controller.control;
          function a(t) {
            (t.setTransition(e, n),
              0 !== e &&
                (t.transitionStart(),
                t.params.autoHeight &&
                  c.nextTick(function () {
                    t.updateAutoHeight();
                  }),
                t.$wrapperEl.transitionEnd(function () {
                  r &&
                    (t.params.loop &&
                      "slide" === n.params.controller.by &&
                      t.loopFix(),
                    t.transitionEnd());
                })));
          }
          if (Array.isArray(r))
            for (i = 0; i < r.length; i += 1)
              r[i] !== t && r[i] instanceof M && a(r[i]);
          else r instanceof M && t !== r && a(r);
        },
      },
      G = {
        makeElFocusable: function (e) {
          return (e.attr("tabIndex", "0"), e);
        },
        addElRole: function (e, t) {
          return (e.attr("role", t), e);
        },
        addElLabel: function (e, t) {
          return (e.attr("aria-label", t), e);
        },
        disableEl: function (e) {
          return (e.attr("aria-disabled", !0), e);
        },
        enableEl: function (e) {
          return (e.attr("aria-disabled", !1), e);
        },
        onEnterKey: function (e) {
          var t = this,
            i = t.params.a11y;
          if (13 === e.keyCode) {
            var r = n(e.target);
            (t.navigation &&
              t.navigation.$nextEl &&
              r.is(t.navigation.$nextEl) &&
              ((t.isEnd && !t.params.loop) || t.slideNext(),
              t.isEnd
                ? t.a11y.notify(i.lastSlideMessage)
                : t.a11y.notify(i.nextSlideMessage)),
              t.navigation &&
                t.navigation.$prevEl &&
                r.is(t.navigation.$prevEl) &&
                ((t.isBeginning && !t.params.loop) || t.slidePrev(),
                t.isBeginning
                  ? t.a11y.notify(i.firstSlideMessage)
                  : t.a11y.notify(i.prevSlideMessage)),
              t.pagination &&
                r.is("." + t.params.pagination.bulletClass) &&
                r[0].click());
          }
        },
        notify: function (e) {
          var t = this.a11y.liveRegion;
          0 !== t.length && (t.html(""), t.html(e));
        },
        updateNavigation: function () {
          var e = this;
          if (!e.params.loop) {
            var t = e.navigation,
              i = t.$nextEl,
              n = t.$prevEl;
            (n &&
              0 < n.length &&
              (e.isBeginning ? e.a11y.disableEl(n) : e.a11y.enableEl(n)),
              i &&
                0 < i.length &&
                (e.isEnd ? e.a11y.disableEl(i) : e.a11y.enableEl(i)));
          }
        },
        updatePagination: function () {
          var e = this,
            t = e.params.a11y;
          e.pagination &&
            e.params.pagination.clickable &&
            e.pagination.bullets &&
            e.pagination.bullets.length &&
            e.pagination.bullets.each(function (i, r) {
              var a = n(r);
              (e.a11y.makeElFocusable(a),
                e.a11y.addElRole(a, "button"),
                e.a11y.addElLabel(
                  a,
                  t.paginationBulletMessage.replace(/{{index}}/, a.index() + 1),
                ));
            });
        },
        init: function () {
          var e = this;
          e.$el.append(e.a11y.liveRegion);
          var t,
            i,
            n = e.params.a11y;
          (e.navigation && e.navigation.$nextEl && (t = e.navigation.$nextEl),
            e.navigation && e.navigation.$prevEl && (i = e.navigation.$prevEl),
            t &&
              (e.a11y.makeElFocusable(t),
              e.a11y.addElRole(t, "button"),
              e.a11y.addElLabel(t, n.nextSlideMessage),
              t.on("keydown", e.a11y.onEnterKey)),
            i &&
              (e.a11y.makeElFocusable(i),
              e.a11y.addElRole(i, "button"),
              e.a11y.addElLabel(i, n.prevSlideMessage),
              i.on("keydown", e.a11y.onEnterKey)),
            e.pagination &&
              e.params.pagination.clickable &&
              e.pagination.bullets &&
              e.pagination.bullets.length &&
              e.pagination.$el.on(
                "keydown",
                "." + e.params.pagination.bulletClass,
                e.a11y.onEnterKey,
              ));
        },
        destroy: function () {
          var e,
            t,
            i = this;
          (i.a11y.liveRegion &&
            0 < i.a11y.liveRegion.length &&
            i.a11y.liveRegion.remove(),
            i.navigation && i.navigation.$nextEl && (e = i.navigation.$nextEl),
            i.navigation && i.navigation.$prevEl && (t = i.navigation.$prevEl),
            e && e.off("keydown", i.a11y.onEnterKey),
            t && t.off("keydown", i.a11y.onEnterKey),
            i.pagination &&
              i.params.pagination.clickable &&
              i.pagination.bullets &&
              i.pagination.bullets.length &&
              i.pagination.$el.off(
                "keydown",
                "." + i.params.pagination.bulletClass,
                i.a11y.onEnterKey,
              ));
        },
      },
      W = {
        init: function () {
          var e = this;
          if (e.params.history) {
            if (!t.history || !t.history.pushState)
              return (
                (e.params.history.enabled = !1),
                void (e.params.hashNavigation.enabled = !0)
              );
            var i = e.history;
            ((i.initialized = !0),
              (i.paths = W.getPathValues()),
              (i.paths.key || i.paths.value) &&
                (i.scrollToSlide(0, i.paths.value, e.params.runCallbacksOnInit),
                e.params.history.replaceState ||
                  t.addEventListener(
                    "popstate",
                    e.history.setHistoryPopState,
                  )));
          }
        },
        destroy: function () {
          this.params.history.replaceState ||
            t.removeEventListener("popstate", this.history.setHistoryPopState);
        },
        setHistoryPopState: function () {
          ((this.history.paths = W.getPathValues()),
            this.history.scrollToSlide(
              this.params.speed,
              this.history.paths.value,
              !1,
            ));
        },
        getPathValues: function () {
          var e = t.location.pathname
              .slice(1)
              .split("/")
              .filter(function (e) {
                return "" !== e;
              }),
            i = e.length;
          return { key: e[i - 2], value: e[i - 1] };
        },
        setHistory: function (e, i) {
          if (this.history.initialized && this.params.history.enabled) {
            var n = this.slides.eq(i),
              r = W.slugify(n.attr("data-history"));
            t.location.pathname.includes(e) || (r = e + "/" + r);
            var a = t.history.state;
            (a && a.value === r) ||
              (this.params.history.replaceState
                ? t.history.replaceState({ value: r }, null, r)
                : t.history.pushState({ value: r }, null, r));
          }
        },
        slugify: function (e) {
          return e
            .toString()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
        },
        scrollToSlide: function (e, t, i) {
          var n = this;
          if (t)
            for (var r = 0, a = n.slides.length; r < a; r += 1) {
              var s = n.slides.eq(r);
              if (
                W.slugify(s.attr("data-history")) === t &&
                !s.hasClass(n.params.slideDuplicateClass)
              ) {
                var o = s.index();
                n.slideTo(o, e, i);
              }
            }
          else n.slideTo(0, e, i);
        },
      },
      j = {
        onHashCange: function () {
          var t = this,
            i = e.location.hash.replace("#", "");
          if (i !== t.slides.eq(t.activeIndex).attr("data-hash")) {
            var n = t.$wrapperEl
              .children("." + t.params.slideClass + '[data-hash="' + i + '"]')
              .index();
            if (void 0 === n) return;
            t.slideTo(n);
          }
        },
        setHash: function () {
          var i = this;
          if (i.hashNavigation.initialized && i.params.hashNavigation.enabled)
            if (
              i.params.hashNavigation.replaceState &&
              t.history &&
              t.history.replaceState
            )
              t.history.replaceState(
                null,
                null,
                "#" + i.slides.eq(i.activeIndex).attr("data-hash") || "",
              );
            else {
              var n = i.slides.eq(i.activeIndex),
                r = n.attr("data-hash") || n.attr("data-history");
              e.location.hash = r || "";
            }
        },
        init: function () {
          var i = this;
          if (!(
            !i.params.hashNavigation.enabled ||
            (i.params.history && i.params.history.enabled)
          )) {
            i.hashNavigation.initialized = !0;
            var r = e.location.hash.replace("#", "");
            if (r)
              for (var a = 0, s = i.slides.length; a < s; a += 1) {
                var o = i.slides.eq(a);
                if (
                  (o.attr("data-hash") || o.attr("data-history")) === r &&
                  !o.hasClass(i.params.slideDuplicateClass)
                ) {
                  var l = o.index();
                  i.slideTo(l, 0, i.params.runCallbacksOnInit, !0);
                }
              }
            i.params.hashNavigation.watchState &&
              n(t).on("hashchange", i.hashNavigation.onHashCange);
          }
        },
        destroy: function () {
          this.params.hashNavigation.watchState &&
            n(t).off("hashchange", this.hashNavigation.onHashCange);
        },
      },
      q = {
        run: function () {
          var e = this,
            t = e.slides.eq(e.activeIndex),
            i = e.params.autoplay.delay;
          (t.attr("data-swiper-autoplay") &&
            (i = t.attr("data-swiper-autoplay") || e.params.autoplay.delay),
            (e.autoplay.timeout = c.nextTick(function () {
              e.params.autoplay.reverseDirection
                ? e.params.loop
                  ? (e.loopFix(),
                    e.slidePrev(e.params.speed, !0, !0),
                    e.emit("autoplay"))
                  : e.isBeginning
                    ? e.params.autoplay.stopOnLastSlide
                      ? e.autoplay.stop()
                      : (e.slideTo(e.slides.length - 1, e.params.speed, !0, !0),
                        e.emit("autoplay"))
                    : (e.slidePrev(e.params.speed, !0, !0), e.emit("autoplay"))
                : e.params.loop
                  ? (e.loopFix(),
                    e.slideNext(e.params.speed, !0, !0),
                    e.emit("autoplay"))
                  : e.isEnd
                    ? e.params.autoplay.stopOnLastSlide
                      ? e.autoplay.stop()
                      : (e.slideTo(0, e.params.speed, !0, !0),
                        e.emit("autoplay"))
                    : (e.slideNext(e.params.speed, !0, !0), e.emit("autoplay"));
            }, i)));
        },
        start: function () {
          var e = this;
          return (
            void 0 === e.autoplay.timeout &&
            !e.autoplay.running &&
            ((e.autoplay.running = !0),
            e.emit("autoplayStart"),
            e.autoplay.run(),
            !0)
          );
        },
        stop: function () {
          var e = this;
          return (
            !!e.autoplay.running &&
            void 0 !== e.autoplay.timeout &&
            (e.autoplay.timeout &&
              (clearTimeout(e.autoplay.timeout), (e.autoplay.timeout = void 0)),
            (e.autoplay.running = !1),
            e.emit("autoplayStop"),
            !0)
          );
        },
        pause: function (e) {
          var t = this;
          t.autoplay.running &&
            (t.autoplay.paused ||
              (t.autoplay.timeout && clearTimeout(t.autoplay.timeout),
              (t.autoplay.paused = !0),
              0 !== e && t.params.autoplay.waitForTransition
                ? (t.$wrapperEl[0].addEventListener(
                    "transitionend",
                    t.autoplay.onTransitionEnd,
                  ),
                  t.$wrapperEl[0].addEventListener(
                    "webkitTransitionEnd",
                    t.autoplay.onTransitionEnd,
                  ))
                : ((t.autoplay.paused = !1), t.autoplay.run())));
        },
      },
      U = {
        setTranslate: function () {
          for (var e = this, t = e.slides, i = 0; i < t.length; i += 1) {
            var n = e.slides.eq(i),
              r = -n[0].swiperSlideOffset;
            e.params.virtualTranslate || (r -= e.translate);
            var a = 0;
            e.isHorizontal() || ((a = r), (r = 0));
            var s = e.params.fadeEffect.crossFade
              ? Math.max(1 - Math.abs(n[0].progress), 0)
              : 1 + Math.min(Math.max(n[0].progress, -1), 0);
            n.css({ opacity: s }).transform(
              "translate3d(" + r + "px, " + a + "px, 0px)",
            );
          }
        },
        setTransition: function (e) {
          var t = this,
            i = t.slides,
            n = t.$wrapperEl;
          if ((i.transition(e), t.params.virtualTranslate && 0 !== e)) {
            var r = !1;
            i.transitionEnd(function () {
              if (!r && t && !t.destroyed) {
                ((r = !0), (t.animating = !1));
                for (
                  var e = ["webkitTransitionEnd", "transitionend"], i = 0;
                  i < e.length;
                  i += 1
                )
                  n.trigger(e[i]);
              }
            });
          }
        },
      },
      K = {
        setTranslate: function () {
          var e,
            t = this,
            i = t.$el,
            r = t.$wrapperEl,
            a = t.slides,
            s = t.width,
            o = t.height,
            l = t.rtlTranslate,
            d = t.size,
            c = t.params.cubeEffect,
            u = t.isHorizontal(),
            h = t.virtual && t.params.virtual.enabled,
            f = 0;
          c.shadow &&
            (u
              ? (0 === (e = r.find(".swiper-cube-shadow")).length &&
                  ((e = n('<div class="swiper-cube-shadow"></div>')),
                  r.append(e)),
                e.css({ height: s + "px" }))
              : 0 === (e = i.find(".swiper-cube-shadow")).length &&
                ((e = n('<div class="swiper-cube-shadow"></div>')),
                i.append(e)));
          for (var v = 0; v < a.length; v += 1) {
            var g = a.eq(v),
              m = v;
            h && (m = parseInt(g.attr("data-swiper-slide-index"), 10));
            var b = 90 * m,
              x = Math.floor(b / 360);
            l && ((b = -b), (x = Math.floor(-b / 360)));
            var y = Math.max(Math.min(g[0].progress, 1), -1),
              w = 0,
              S = 0,
              T = 0;
            (m % 4 == 0
              ? ((w = 4 * -x * d), (T = 0))
              : (m - 1) % 4 == 0
                ? ((w = 0), (T = 4 * -x * d))
                : (m - 2) % 4 == 0
                  ? ((w = d + 4 * x * d), (T = d))
                  : (m - 3) % 4 == 0 && ((w = -d), (T = 3 * d + 4 * d * x)),
              l && (w = -w),
              u || ((S = w), (w = 0)));
            var E =
              "rotateX(" +
              (u ? 0 : -b) +
              "deg) rotateY(" +
              (u ? b : 0) +
              "deg) translate3d(" +
              w +
              "px, " +
              S +
              "px, " +
              T +
              "px)";
            if (
              (y <= 1 &&
                -1 < y &&
                ((f = 90 * m + 90 * y), l && (f = 90 * -m - 90 * y)),
              g.transform(E),
              c.slideShadows)
            ) {
              var C = u
                  ? g.find(".swiper-slide-shadow-left")
                  : g.find(".swiper-slide-shadow-top"),
                M = u
                  ? g.find(".swiper-slide-shadow-right")
                  : g.find(".swiper-slide-shadow-bottom");
              (0 === C.length &&
                ((C = n(
                  '<div class="swiper-slide-shadow-' +
                    (u ? "left" : "top") +
                    '"></div>',
                )),
                g.append(C)),
                0 === M.length &&
                  ((M = n(
                    '<div class="swiper-slide-shadow-' +
                      (u ? "right" : "bottom") +
                      '"></div>',
                  )),
                  g.append(M)),
                C.length && (C[0].style.opacity = Math.max(-y, 0)),
                M.length && (M[0].style.opacity = Math.max(y, 0)));
            }
          }
          if (
            (r.css({
              "-webkit-transform-origin": "50% 50% -" + d / 2 + "px",
              "-moz-transform-origin": "50% 50% -" + d / 2 + "px",
              "-ms-transform-origin": "50% 50% -" + d / 2 + "px",
              "transform-origin": "50% 50% -" + d / 2 + "px",
            }),
            c.shadow)
          )
            if (u)
              e.transform(
                "translate3d(0px, " +
                  (s / 2 + c.shadowOffset) +
                  "px, " +
                  -s / 2 +
                  "px) rotateX(90deg) rotateZ(0deg) scale(" +
                  c.shadowScale +
                  ")",
              );
            else {
              var P = Math.abs(f) - 90 * Math.floor(Math.abs(f) / 90),
                k =
                  1.5 -
                  (Math.sin((2 * P * Math.PI) / 360) / 2 +
                    Math.cos((2 * P * Math.PI) / 360) / 2),
                z = c.shadowScale,
                L = c.shadowScale / k,
                I = c.shadowOffset;
              e.transform(
                "scale3d(" +
                  z +
                  ", 1, " +
                  L +
                  ") translate3d(0px, " +
                  (o / 2 + I) +
                  "px, " +
                  -o / 2 / L +
                  "px) rotateX(-90deg)",
              );
            }
          var A = p.isSafari || p.isUiWebView ? -d / 2 : 0;
          r.transform(
            "translate3d(0px,0," +
              A +
              "px) rotateX(" +
              (t.isHorizontal() ? 0 : f) +
              "deg) rotateY(" +
              (t.isHorizontal() ? -f : 0) +
              "deg)",
          );
        },
        setTransition: function (e) {
          var t = this.$el;
          (this.slides
            .transition(e)
            .find(
              ".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left",
            )
            .transition(e),
            this.params.cubeEffect.shadow &&
              !this.isHorizontal() &&
              t.find(".swiper-cube-shadow").transition(e));
        },
      },
      Z = {
        setTranslate: function () {
          for (
            var e = this, t = e.slides, i = e.rtlTranslate, r = 0;
            r < t.length;
            r += 1
          ) {
            var a = t.eq(r),
              s = a[0].progress;
            e.params.flipEffect.limitRotation &&
              (s = Math.max(Math.min(a[0].progress, 1), -1));
            var o = -180 * s,
              l = 0,
              d = -a[0].swiperSlideOffset,
              c = 0;
            if (
              (e.isHorizontal()
                ? i && (o = -o)
                : ((c = d), (l = -o), (o = d = 0)),
              (a[0].style.zIndex = -Math.abs(Math.round(s)) + t.length),
              e.params.flipEffect.slideShadows)
            ) {
              var u = e.isHorizontal()
                  ? a.find(".swiper-slide-shadow-left")
                  : a.find(".swiper-slide-shadow-top"),
                p = e.isHorizontal()
                  ? a.find(".swiper-slide-shadow-right")
                  : a.find(".swiper-slide-shadow-bottom");
              (0 === u.length &&
                ((u = n(
                  '<div class="swiper-slide-shadow-' +
                    (e.isHorizontal() ? "left" : "top") +
                    '"></div>',
                )),
                a.append(u)),
                0 === p.length &&
                  ((p = n(
                    '<div class="swiper-slide-shadow-' +
                      (e.isHorizontal() ? "right" : "bottom") +
                      '"></div>',
                  )),
                  a.append(p)),
                u.length && (u[0].style.opacity = Math.max(-s, 0)),
                p.length && (p[0].style.opacity = Math.max(s, 0)));
            }
            a.transform(
              "translate3d(" +
                d +
                "px, " +
                c +
                "px, 0px) rotateX(" +
                l +
                "deg) rotateY(" +
                o +
                "deg)",
            );
          }
        },
        setTransition: function (e) {
          var t = this,
            i = t.slides,
            n = t.activeIndex,
            r = t.$wrapperEl;
          if (
            (i
              .transition(e)
              .find(
                ".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left",
              )
              .transition(e),
            t.params.virtualTranslate && 0 !== e)
          ) {
            var a = !1;
            i.eq(n).transitionEnd(function () {
              if (!a && t && !t.destroyed) {
                ((a = !0), (t.animating = !1));
                for (
                  var e = ["webkitTransitionEnd", "transitionend"], i = 0;
                  i < e.length;
                  i += 1
                )
                  r.trigger(e[i]);
              }
            });
          }
        },
      },
      Q = {
        setTranslate: function () {
          for (
            var e = this,
              t = e.width,
              i = e.height,
              r = e.slides,
              a = e.$wrapperEl,
              s = e.slidesSizesGrid,
              o = e.params.coverflowEffect,
              l = e.isHorizontal(),
              d = e.translate,
              c = l ? t / 2 - d : i / 2 - d,
              p = l ? o.rotate : -o.rotate,
              h = o.depth,
              f = 0,
              v = r.length;
            f < v;
            f += 1
          ) {
            var g = r.eq(f),
              m = s[f],
              b = ((c - g[0].swiperSlideOffset - m / 2) / m) * o.modifier,
              x = l ? p * b : 0,
              y = l ? 0 : p * b,
              w = -h * Math.abs(b),
              S = l ? 0 : o.stretch * b,
              T = l ? o.stretch * b : 0;
            (Math.abs(T) < 0.001 && (T = 0),
              Math.abs(S) < 0.001 && (S = 0),
              Math.abs(w) < 0.001 && (w = 0),
              Math.abs(x) < 0.001 && (x = 0),
              Math.abs(y) < 0.001 && (y = 0));
            var E =
              "translate3d(" +
              T +
              "px," +
              S +
              "px," +
              w +
              "px)  rotateX(" +
              y +
              "deg) rotateY(" +
              x +
              "deg)";
            if (
              (g.transform(E),
              (g[0].style.zIndex = 1 - Math.abs(Math.round(b))),
              o.slideShadows)
            ) {
              var C = l
                  ? g.find(".swiper-slide-shadow-left")
                  : g.find(".swiper-slide-shadow-top"),
                M = l
                  ? g.find(".swiper-slide-shadow-right")
                  : g.find(".swiper-slide-shadow-bottom");
              (0 === C.length &&
                ((C = n(
                  '<div class="swiper-slide-shadow-' +
                    (l ? "left" : "top") +
                    '"></div>',
                )),
                g.append(C)),
                0 === M.length &&
                  ((M = n(
                    '<div class="swiper-slide-shadow-' +
                      (l ? "right" : "bottom") +
                      '"></div>',
                  )),
                  g.append(M)),
                C.length && (C[0].style.opacity = 0 < b ? b : 0),
                M.length && (M[0].style.opacity = 0 < -b ? -b : 0));
            }
          }
          (u.pointerEvents || u.prefixedPointerEvents) &&
            (a[0].style.perspectiveOrigin = c + "px 50%");
        },
        setTransition: function (e) {
          this.slides
            .transition(e)
            .find(
              ".swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left",
            )
            .transition(e);
        },
      },
      J = {
        init: function () {
          var e = this,
            t = e.params.thumbs,
            i = e.constructor;
          (t.swiper instanceof i
            ? ((e.thumbs.swiper = t.swiper),
              c.extend(e.thumbs.swiper.originalParams, {
                watchSlidesProgress: !0,
                slideToClickedSlide: !1,
              }),
              c.extend(e.thumbs.swiper.params, {
                watchSlidesProgress: !0,
                slideToClickedSlide: !1,
              }))
            : c.isObject(t.swiper) &&
              ((e.thumbs.swiper = new i(
                c.extend({}, t.swiper, {
                  watchSlidesVisibility: !0,
                  watchSlidesProgress: !0,
                  slideToClickedSlide: !1,
                }),
              )),
              (e.thumbs.swiperCreated = !0)),
            e.thumbs.swiper.$el.addClass(e.params.thumbs.thumbsContainerClass),
            e.thumbs.swiper.on("tap", e.thumbs.onThumbClick));
        },
        onThumbClick: function () {
          var e = this,
            t = e.thumbs.swiper;
          if (t) {
            var i = t.clickedIndex,
              r = t.clickedSlide;
            if (!(
              (r && n(r).hasClass(e.params.thumbs.slideThumbActiveClass)) ||
              null == i
            )) {
              var a;
              if (
                ((a = t.params.loop
                  ? parseInt(
                      n(t.clickedSlide).attr("data-swiper-slide-index"),
                      10,
                    )
                  : i),
                e.params.loop)
              ) {
                var s = e.activeIndex;
                e.slides.eq(s).hasClass(e.params.slideDuplicateClass) &&
                  (e.loopFix(),
                  (e._clientLeft = e.$wrapperEl[0].clientLeft),
                  (s = e.activeIndex));
                var o = e.slides
                    .eq(s)
                    .prevAll('[data-swiper-slide-index="' + a + '"]')
                    .eq(0)
                    .index(),
                  l = e.slides
                    .eq(s)
                    .nextAll('[data-swiper-slide-index="' + a + '"]')
                    .eq(0)
                    .index();
                a = void 0 === o ? l : void 0 === l ? o : l - s < s - o ? l : o;
              }
              e.slideTo(a);
            }
          }
        },
        update: function (e) {
          var t = this,
            i = t.thumbs.swiper;
          if (i) {
            var n =
              "auto" === i.params.slidesPerView
                ? i.slidesPerViewDynamic()
                : i.params.slidesPerView;
            if (t.realIndex !== i.realIndex) {
              var r,
                a = i.activeIndex;
              if (i.params.loop) {
                i.slides.eq(a).hasClass(i.params.slideDuplicateClass) &&
                  (i.loopFix(),
                  (i._clientLeft = i.$wrapperEl[0].clientLeft),
                  (a = i.activeIndex));
                var s = i.slides
                    .eq(a)
                    .prevAll('[data-swiper-slide-index="' + t.realIndex + '"]')
                    .eq(0)
                    .index(),
                  o = i.slides
                    .eq(a)
                    .nextAll('[data-swiper-slide-index="' + t.realIndex + '"]')
                    .eq(0)
                    .index();
                r =
                  void 0 === s
                    ? o
                    : void 0 === o
                      ? s
                      : o - a == a - s
                        ? a
                        : o - a < a - s
                          ? o
                          : s;
              } else r = t.realIndex;
              i.visibleSlidesIndexes.indexOf(r) < 0 &&
                (i.params.centeredSlides
                  ? (r =
                      a < r
                        ? r - Math.floor(n / 2) + 1
                        : r + Math.floor(n / 2) - 1)
                  : a < r && (r = r - n + 1),
                i.slideTo(r, e ? 0 : void 0));
            }
            var l = 1,
              d = t.params.thumbs.slideThumbActiveClass;
            if (
              (1 < t.params.slidesPerView &&
                !t.params.centeredSlides &&
                (l = t.params.slidesPerView),
              i.slides.removeClass(d),
              i.params.loop)
            )
              for (var c = 0; c < l; c += 1)
                i.$wrapperEl
                  .children(
                    '[data-swiper-slide-index="' + (t.realIndex + c) + '"]',
                  )
                  .addClass(d);
            else
              for (var u = 0; u < l; u += 1)
                i.slides.eq(t.realIndex + u).addClass(d);
          }
        },
      },
      ee = [
        P,
        k,
        z,
        L,
        A,
        _,
        N,
        {
          name: "mousewheel",
          params: {
            mousewheel: {
              enabled: !1,
              releaseOnEdges: !1,
              invert: !1,
              forceToAxis: !1,
              sensitivity: 1,
              eventsTarged: "container",
            },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              mousewheel: {
                enabled: !1,
                enable: $.enable.bind(e),
                disable: $.disable.bind(e),
                handle: $.handle.bind(e),
                handleMouseEnter: $.handleMouseEnter.bind(e),
                handleMouseLeave: $.handleMouseLeave.bind(e),
                lastScrollTime: c.now(),
              },
            });
          },
          on: {
            init: function () {
              this.params.mousewheel.enabled && this.mousewheel.enable();
            },
            destroy: function () {
              this.mousewheel.enabled && this.mousewheel.disable();
            },
          },
        },
        {
          name: "navigation",
          params: {
            navigation: {
              nextEl: null,
              prevEl: null,
              hideOnClick: !1,
              disabledClass: "swiper-button-disabled",
              hiddenClass: "swiper-button-hidden",
              lockClass: "swiper-button-lock",
            },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              navigation: {
                init: F.init.bind(e),
                update: F.update.bind(e),
                destroy: F.destroy.bind(e),
                onNextClick: F.onNextClick.bind(e),
                onPrevClick: F.onPrevClick.bind(e),
              },
            });
          },
          on: {
            init: function () {
              (this.navigation.init(), this.navigation.update());
            },
            toEdge: function () {
              this.navigation.update();
            },
            fromEdge: function () {
              this.navigation.update();
            },
            destroy: function () {
              this.navigation.destroy();
            },
            click: function (e) {
              var t,
                i = this,
                r = i.navigation,
                a = r.$nextEl,
                s = r.$prevEl;
              !i.params.navigation.hideOnClick ||
                n(e.target).is(s) ||
                n(e.target).is(a) ||
                (a
                  ? (t = a.hasClass(i.params.navigation.hiddenClass))
                  : s && (t = s.hasClass(i.params.navigation.hiddenClass)),
                !0 === t
                  ? i.emit("navigationShow", i)
                  : i.emit("navigationHide", i),
                a && a.toggleClass(i.params.navigation.hiddenClass),
                s && s.toggleClass(i.params.navigation.hiddenClass));
            },
          },
        },
        {
          name: "pagination",
          params: {
            pagination: {
              el: null,
              bulletElement: "span",
              clickable: !1,
              hideOnClick: !1,
              renderBullet: null,
              renderProgressbar: null,
              renderFraction: null,
              renderCustom: null,
              progressbarOpposite: !1,
              type: "bullets",
              dynamicBullets: !1,
              dynamicMainBullets: 1,
              formatFractionCurrent: function (e) {
                return e;
              },
              formatFractionTotal: function (e) {
                return e;
              },
              bulletClass: "swiper-pagination-bullet",
              bulletActiveClass: "swiper-pagination-bullet-active",
              modifierClass: "swiper-pagination-",
              currentClass: "swiper-pagination-current",
              totalClass: "swiper-pagination-total",
              hiddenClass: "swiper-pagination-hidden",
              progressbarFillClass: "swiper-pagination-progressbar-fill",
              progressbarOppositeClass:
                "swiper-pagination-progressbar-opposite",
              clickableClass: "swiper-pagination-clickable",
              lockClass: "swiper-pagination-lock",
            },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              pagination: {
                init: H.init.bind(e),
                render: H.render.bind(e),
                update: H.update.bind(e),
                destroy: H.destroy.bind(e),
                dynamicBulletIndex: 0,
              },
            });
          },
          on: {
            init: function () {
              (this.pagination.init(),
                this.pagination.render(),
                this.pagination.update());
            },
            activeIndexChange: function () {
              (this.params.loop || void 0 === this.snapIndex) &&
                this.pagination.update();
            },
            snapIndexChange: function () {
              this.params.loop || this.pagination.update();
            },
            slidesLengthChange: function () {
              this.params.loop &&
                (this.pagination.render(), this.pagination.update());
            },
            snapGridLengthChange: function () {
              this.params.loop ||
                (this.pagination.render(), this.pagination.update());
            },
            destroy: function () {
              this.pagination.destroy();
            },
            click: function (e) {
              var t = this;
              t.params.pagination.el &&
                t.params.pagination.hideOnClick &&
                0 < t.pagination.$el.length &&
                !n(e.target).hasClass(t.params.pagination.bulletClass) &&
                (!0 ===
                t.pagination.$el.hasClass(t.params.pagination.hiddenClass)
                  ? t.emit("paginationShow", t)
                  : t.emit("paginationHide", t),
                t.pagination.$el.toggleClass(t.params.pagination.hiddenClass));
            },
          },
        },
        {
          name: "scrollbar",
          params: {
            scrollbar: {
              el: null,
              dragSize: "auto",
              hide: !1,
              draggable: !1,
              snapOnRelease: !0,
              lockClass: "swiper-scrollbar-lock",
              dragClass: "swiper-scrollbar-drag",
            },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              scrollbar: {
                init: R.init.bind(e),
                destroy: R.destroy.bind(e),
                updateSize: R.updateSize.bind(e),
                setTranslate: R.setTranslate.bind(e),
                setTransition: R.setTransition.bind(e),
                enableDraggable: R.enableDraggable.bind(e),
                disableDraggable: R.disableDraggable.bind(e),
                setDragPosition: R.setDragPosition.bind(e),
                onDragStart: R.onDragStart.bind(e),
                onDragMove: R.onDragMove.bind(e),
                onDragEnd: R.onDragEnd.bind(e),
                isTouched: !1,
                timeout: null,
                dragTimeout: null,
              },
            });
          },
          on: {
            init: function () {
              (this.scrollbar.init(),
                this.scrollbar.updateSize(),
                this.scrollbar.setTranslate());
            },
            update: function () {
              this.scrollbar.updateSize();
            },
            resize: function () {
              this.scrollbar.updateSize();
            },
            observerUpdate: function () {
              this.scrollbar.updateSize();
            },
            setTranslate: function () {
              this.scrollbar.setTranslate();
            },
            setTransition: function (e) {
              this.scrollbar.setTransition(e);
            },
            destroy: function () {
              this.scrollbar.destroy();
            },
          },
        },
        {
          name: "parallax",
          params: { parallax: { enabled: !1 } },
          create: function () {
            c.extend(this, {
              parallax: {
                setTransform: B.setTransform.bind(this),
                setTranslate: B.setTranslate.bind(this),
                setTransition: B.setTransition.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              this.params.parallax.enabled &&
                ((this.params.watchSlidesProgress = !0),
                (this.originalParams.watchSlidesProgress = !0));
            },
            init: function () {
              this.params.parallax.enabled && this.parallax.setTranslate();
            },
            setTranslate: function () {
              this.params.parallax.enabled && this.parallax.setTranslate();
            },
            setTransition: function (e) {
              this.params.parallax.enabled && this.parallax.setTransition(e);
            },
          },
        },
        {
          name: "zoom",
          params: {
            zoom: {
              enabled: !1,
              maxRatio: 3,
              minRatio: 1,
              toggle: !0,
              containerClass: "swiper-zoom-container",
              zoomedSlideClass: "swiper-slide-zoomed",
            },
          },
          create: function () {
            var e = this,
              t = {
                enabled: !1,
                scale: 1,
                currentScale: 1,
                isScaling: !1,
                gesture: {
                  $slideEl: void 0,
                  slideWidth: void 0,
                  slideHeight: void 0,
                  $imageEl: void 0,
                  $imageWrapEl: void 0,
                  maxRatio: 3,
                },
                image: {
                  isTouched: void 0,
                  isMoved: void 0,
                  currentX: void 0,
                  currentY: void 0,
                  minX: void 0,
                  minY: void 0,
                  maxX: void 0,
                  maxY: void 0,
                  width: void 0,
                  height: void 0,
                  startX: void 0,
                  startY: void 0,
                  touchesStart: {},
                  touchesCurrent: {},
                },
                velocity: {
                  x: void 0,
                  y: void 0,
                  prevPositionX: void 0,
                  prevPositionY: void 0,
                  prevTime: void 0,
                },
              };
            ("onGestureStart onGestureChange onGestureEnd onTouchStart onTouchMove onTouchEnd onTransitionEnd toggle enable disable in out"
              .split(" ")
              .forEach(function (i) {
                t[i] = X[i].bind(e);
              }),
              c.extend(e, { zoom: t }));
            var i = 1;
            Object.defineProperty(e.zoom, "scale", {
              get: function () {
                return i;
              },
              set: function (t) {
                if (i !== t) {
                  var n = e.zoom.gesture.$imageEl
                      ? e.zoom.gesture.$imageEl[0]
                      : void 0,
                    r = e.zoom.gesture.$slideEl
                      ? e.zoom.gesture.$slideEl[0]
                      : void 0;
                  e.emit("zoomChange", t, n, r);
                }
                i = t;
              },
            });
          },
          on: {
            init: function () {
              this.params.zoom.enabled && this.zoom.enable();
            },
            destroy: function () {
              this.zoom.disable();
            },
            touchStart: function (e) {
              this.zoom.enabled && this.zoom.onTouchStart(e);
            },
            touchEnd: function (e) {
              this.zoom.enabled && this.zoom.onTouchEnd(e);
            },
            doubleTap: function (e) {
              this.params.zoom.enabled &&
                this.zoom.enabled &&
                this.params.zoom.toggle &&
                this.zoom.toggle(e);
            },
            transitionEnd: function () {
              this.zoom.enabled &&
                this.params.zoom.enabled &&
                this.zoom.onTransitionEnd();
            },
          },
        },
        {
          name: "lazy",
          params: {
            lazy: {
              enabled: !1,
              loadPrevNext: !1,
              loadPrevNextAmount: 1,
              loadOnTransitionStart: !1,
              elementClass: "swiper-lazy",
              loadingClass: "swiper-lazy-loading",
              loadedClass: "swiper-lazy-loaded",
              preloaderClass: "swiper-lazy-preloader",
            },
          },
          create: function () {
            c.extend(this, {
              lazy: {
                initialImageLoaded: !1,
                load: Y.load.bind(this),
                loadInSlide: Y.loadInSlide.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              this.params.lazy.enabled &&
                this.params.preloadImages &&
                (this.params.preloadImages = !1);
            },
            init: function () {
              this.params.lazy.enabled &&
                !this.params.loop &&
                0 === this.params.initialSlide &&
                this.lazy.load();
            },
            scroll: function () {
              this.params.freeMode &&
                !this.params.freeModeSticky &&
                this.lazy.load();
            },
            resize: function () {
              this.params.lazy.enabled && this.lazy.load();
            },
            scrollbarDragMove: function () {
              this.params.lazy.enabled && this.lazy.load();
            },
            transitionStart: function () {
              var e = this;
              e.params.lazy.enabled &&
                (e.params.lazy.loadOnTransitionStart ||
                  (!e.params.lazy.loadOnTransitionStart &&
                    !e.lazy.initialImageLoaded)) &&
                e.lazy.load();
            },
            transitionEnd: function () {
              this.params.lazy.enabled &&
                !this.params.lazy.loadOnTransitionStart &&
                this.lazy.load();
            },
          },
        },
        {
          name: "controller",
          params: { controller: { control: void 0, inverse: !1, by: "slide" } },
          create: function () {
            var e = this;
            c.extend(e, {
              controller: {
                control: e.params.controller.control,
                getInterpolateFunction: V.getInterpolateFunction.bind(e),
                setTranslate: V.setTranslate.bind(e),
                setTransition: V.setTransition.bind(e),
              },
            });
          },
          on: {
            update: function () {
              this.controller.control &&
                this.controller.spline &&
                ((this.controller.spline = void 0),
                delete this.controller.spline);
            },
            resize: function () {
              this.controller.control &&
                this.controller.spline &&
                ((this.controller.spline = void 0),
                delete this.controller.spline);
            },
            observerUpdate: function () {
              this.controller.control &&
                this.controller.spline &&
                ((this.controller.spline = void 0),
                delete this.controller.spline);
            },
            setTranslate: function (e, t) {
              this.controller.control && this.controller.setTranslate(e, t);
            },
            setTransition: function (e, t) {
              this.controller.control && this.controller.setTransition(e, t);
            },
          },
        },
        {
          name: "a11y",
          params: {
            a11y: {
              enabled: !0,
              notificationClass: "swiper-notification",
              prevSlideMessage: "Previous slide",
              nextSlideMessage: "Next slide",
              firstSlideMessage: "This is the first slide",
              lastSlideMessage: "This is the last slide",
              paginationBulletMessage: "Go to slide {{index}}",
            },
          },
          create: function () {
            var e = this;
            (c.extend(e, {
              a11y: {
                liveRegion: n(
                  '<span class="' +
                    e.params.a11y.notificationClass +
                    '" aria-live="assertive" aria-atomic="true"></span>',
                ),
              },
            }),
              Object.keys(G).forEach(function (t) {
                e.a11y[t] = G[t].bind(e);
              }));
          },
          on: {
            init: function () {
              this.params.a11y.enabled &&
                (this.a11y.init(), this.a11y.updateNavigation());
            },
            toEdge: function () {
              this.params.a11y.enabled && this.a11y.updateNavigation();
            },
            fromEdge: function () {
              this.params.a11y.enabled && this.a11y.updateNavigation();
            },
            paginationUpdate: function () {
              this.params.a11y.enabled && this.a11y.updatePagination();
            },
            destroy: function () {
              this.params.a11y.enabled && this.a11y.destroy();
            },
          },
        },
        {
          name: "history",
          params: { history: { enabled: !1, replaceState: !1, key: "slides" } },
          create: function () {
            var e = this;
            c.extend(e, {
              history: {
                init: W.init.bind(e),
                setHistory: W.setHistory.bind(e),
                setHistoryPopState: W.setHistoryPopState.bind(e),
                scrollToSlide: W.scrollToSlide.bind(e),
                destroy: W.destroy.bind(e),
              },
            });
          },
          on: {
            init: function () {
              this.params.history.enabled && this.history.init();
            },
            destroy: function () {
              this.params.history.enabled && this.history.destroy();
            },
            transitionEnd: function () {
              this.history.initialized &&
                this.history.setHistory(
                  this.params.history.key,
                  this.activeIndex,
                );
            },
          },
        },
        {
          name: "hash-navigation",
          params: {
            hashNavigation: { enabled: !1, replaceState: !1, watchState: !1 },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              hashNavigation: {
                initialized: !1,
                init: j.init.bind(e),
                destroy: j.destroy.bind(e),
                setHash: j.setHash.bind(e),
                onHashCange: j.onHashCange.bind(e),
              },
            });
          },
          on: {
            init: function () {
              this.params.hashNavigation.enabled && this.hashNavigation.init();
            },
            destroy: function () {
              this.params.hashNavigation.enabled &&
                this.hashNavigation.destroy();
            },
            transitionEnd: function () {
              this.hashNavigation.initialized && this.hashNavigation.setHash();
            },
          },
        },
        {
          name: "autoplay",
          params: {
            autoplay: {
              enabled: !1,
              delay: 3e3,
              waitForTransition: !0,
              disableOnInteraction: !0,
              stopOnLastSlide: !1,
              reverseDirection: !1,
            },
          },
          create: function () {
            var e = this;
            c.extend(e, {
              autoplay: {
                running: !1,
                paused: !1,
                run: q.run.bind(e),
                start: q.start.bind(e),
                stop: q.stop.bind(e),
                pause: q.pause.bind(e),
                onTransitionEnd: function (t) {
                  e &&
                    !e.destroyed &&
                    e.$wrapperEl &&
                    t.target === this &&
                    (e.$wrapperEl[0].removeEventListener(
                      "transitionend",
                      e.autoplay.onTransitionEnd,
                    ),
                    e.$wrapperEl[0].removeEventListener(
                      "webkitTransitionEnd",
                      e.autoplay.onTransitionEnd,
                    ),
                    (e.autoplay.paused = !1),
                    e.autoplay.running ? e.autoplay.run() : e.autoplay.stop());
                },
              },
            });
          },
          on: {
            init: function () {
              this.params.autoplay.enabled && this.autoplay.start();
            },
            beforeTransitionStart: function (e, t) {
              this.autoplay.running &&
                (t || !this.params.autoplay.disableOnInteraction
                  ? this.autoplay.pause(e)
                  : this.autoplay.stop());
            },
            sliderFirstMove: function () {
              this.autoplay.running &&
                (this.params.autoplay.disableOnInteraction
                  ? this.autoplay.stop()
                  : this.autoplay.pause());
            },
            destroy: function () {
              this.autoplay.running && this.autoplay.stop();
            },
          },
        },
        {
          name: "effect-fade",
          params: { fadeEffect: { crossFade: !1 } },
          create: function () {
            c.extend(this, {
              fadeEffect: {
                setTranslate: U.setTranslate.bind(this),
                setTransition: U.setTransition.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              var e = this;
              if ("fade" === e.params.effect) {
                e.classNames.push(e.params.containerModifierClass + "fade");
                var t = {
                  slidesPerView: 1,
                  slidesPerColumn: 1,
                  slidesPerGroup: 1,
                  watchSlidesProgress: !0,
                  spaceBetween: 0,
                  virtualTranslate: !0,
                };
                (c.extend(e.params, t), c.extend(e.originalParams, t));
              }
            },
            setTranslate: function () {
              "fade" === this.params.effect && this.fadeEffect.setTranslate();
            },
            setTransition: function (e) {
              "fade" === this.params.effect && this.fadeEffect.setTransition(e);
            },
          },
        },
        {
          name: "effect-cube",
          params: {
            cubeEffect: {
              slideShadows: !0,
              shadow: !0,
              shadowOffset: 20,
              shadowScale: 0.94,
            },
          },
          create: function () {
            c.extend(this, {
              cubeEffect: {
                setTranslate: K.setTranslate.bind(this),
                setTransition: K.setTransition.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              var e = this;
              if ("cube" === e.params.effect) {
                (e.classNames.push(e.params.containerModifierClass + "cube"),
                  e.classNames.push(e.params.containerModifierClass + "3d"));
                var t = {
                  slidesPerView: 1,
                  slidesPerColumn: 1,
                  slidesPerGroup: 1,
                  watchSlidesProgress: !0,
                  resistanceRatio: 0,
                  spaceBetween: 0,
                  centeredSlides: !1,
                  virtualTranslate: !0,
                };
                (c.extend(e.params, t), c.extend(e.originalParams, t));
              }
            },
            setTranslate: function () {
              "cube" === this.params.effect && this.cubeEffect.setTranslate();
            },
            setTransition: function (e) {
              "cube" === this.params.effect && this.cubeEffect.setTransition(e);
            },
          },
        },
        {
          name: "effect-flip",
          params: { flipEffect: { slideShadows: !0, limitRotation: !0 } },
          create: function () {
            c.extend(this, {
              flipEffect: {
                setTranslate: Z.setTranslate.bind(this),
                setTransition: Z.setTransition.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              var e = this;
              if ("flip" === e.params.effect) {
                (e.classNames.push(e.params.containerModifierClass + "flip"),
                  e.classNames.push(e.params.containerModifierClass + "3d"));
                var t = {
                  slidesPerView: 1,
                  slidesPerColumn: 1,
                  slidesPerGroup: 1,
                  watchSlidesProgress: !0,
                  spaceBetween: 0,
                  virtualTranslate: !0,
                };
                (c.extend(e.params, t), c.extend(e.originalParams, t));
              }
            },
            setTranslate: function () {
              "flip" === this.params.effect && this.flipEffect.setTranslate();
            },
            setTransition: function (e) {
              "flip" === this.params.effect && this.flipEffect.setTransition(e);
            },
          },
        },
        {
          name: "effect-coverflow",
          params: {
            coverflowEffect: {
              rotate: 50,
              stretch: 0,
              depth: 100,
              modifier: 1,
              slideShadows: !0,
            },
          },
          create: function () {
            c.extend(this, {
              coverflowEffect: {
                setTranslate: Q.setTranslate.bind(this),
                setTransition: Q.setTransition.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              var e = this;
              "coverflow" === e.params.effect &&
                (e.classNames.push(
                  e.params.containerModifierClass + "coverflow",
                ),
                e.classNames.push(e.params.containerModifierClass + "3d"),
                (e.params.watchSlidesProgress = !0),
                (e.originalParams.watchSlidesProgress = !0));
            },
            setTranslate: function () {
              "coverflow" === this.params.effect &&
                this.coverflowEffect.setTranslate();
            },
            setTransition: function (e) {
              "coverflow" === this.params.effect &&
                this.coverflowEffect.setTransition(e);
            },
          },
        },
        {
          name: "thumbs",
          params: {
            thumbs: {
              swiper: null,
              slideThumbActiveClass: "swiper-slide-thumb-active",
              thumbsContainerClass: "swiper-container-thumbs",
            },
          },
          create: function () {
            c.extend(this, {
              thumbs: {
                swiper: null,
                init: J.init.bind(this),
                update: J.update.bind(this),
                onThumbClick: J.onThumbClick.bind(this),
              },
            });
          },
          on: {
            beforeInit: function () {
              var e = this.params.thumbs;
              e && e.swiper && (this.thumbs.init(), this.thumbs.update(!0));
            },
            slideChange: function () {
              this.thumbs.swiper && this.thumbs.update();
            },
            update: function () {
              this.thumbs.swiper && this.thumbs.update();
            },
            resize: function () {
              this.thumbs.swiper && this.thumbs.update();
            },
            observerUpdate: function () {
              this.thumbs.swiper && this.thumbs.update();
            },
            setTransition: function (e) {
              var t = this.thumbs.swiper;
              t && t.setTransition(e);
            },
            beforeDestroy: function () {
              var e = this.thumbs.swiper;
              e && this.thumbs.swiperCreated && e && e.destroy();
            },
          },
        },
      ];
    return (
      void 0 === M.use &&
        ((M.use = M.Class.use), (M.installModule = M.Class.installModule)),
      M.use(ee),
      M
    );
  }));
