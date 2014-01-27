/////// SPHERE ///////

var ColorSphereBackground = function() {
  var d = document;
  var canvas = document.getElementById("canvasSection");
  var ctx = canvas.getContext("2d");
  canvas.style.cssText = "position: fixed; left: 0; top: 0; opacity: 1";
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  document.body.appendChild(canvas);
  //
  Event.add(window, "resize", function() {
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.drawImage(theSphere = sphere(percent), 0, 0)
  });
  Event.add(d, "scroll", function(e) {
    var percent = 1 - document.body.scrollTop / document.body.scrollHeight;
    ctx.drawImage(theSphere = sphere(percent), 0, 0);
    onMouseMove();
  });

  var theSphere;
  var px = window.innerWidth / 2;
  var py = window.innerHeight / 2;
  var onMouseMove = function(event) {
    ctx.drawImage(theSphere, 0, 0);
    if (event) {
      var coords = Event.proxy.getCoord(event);
      coords.x -= document.body.scrollLeft;
      coords.y -= document.body.scrollTop;
      px = coords.x;
      py = coords.y;
    } else { // 
      var coords = { x: px, y: py };
    }
    //
    var x = (coords.x / window.innerWidth) * 255 - 127; // grab mouse pixel coords, center at midpoint
    var y = (coords.y / window.innerHeight) * 255 - 127;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // get image data
    var data = imageData.data;
    for(var n = 0, length = data.length; n < length; n += 4) {
      data[n] = data[n] + y + x; // red (control left)
      data[n + 1] = data[n + 1] + y - x; // green (control right)
      data[n + 2] = data[n + 2] - y + x; // blue (control down)
    }
    ctx.putImageData(imageData, 0, 0);
  };
  Event.add(d, "mousemove", onMouseMove);
  //
  function sphere(top) { // create Sphere image, and apply to <canvas>
    var canvas1 = document.createElement("canvas");
    var ctx = canvas1.getContext("2d");
    var w = 75;
    var left = -20;
    var top = top * -50;
    canvas.width = canvas1.width = w * window.innerWidth / window.innerHeight;
    canvas.height = canvas1.height = w;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    n = 360; while(n--) { // go through hues
      var x = left + w;
      var y = top + w;
      var g = ctx.createLinearGradient(x, top, y, left);
      g.addColorStop(0, "#000");
      g.addColorStop(.5, "hsl("+((n + 60) % 360)+",100%,50%)");
      g.addColorStop(1, "#666");
      ctx.beginPath(); // draw triangle
      ctx.moveTo(x, top);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 2, y);
      ctx.lineTo(x + 5, top);
      ctx.fillStyle = g; // apply gradient
      ctx.fill();
      ctx.translate(x, y); // rotate + translate into position
      ctx.rotate((1 / 360) * Math.PI * 2);
      ctx.translate(-x, -y);
    }
    return canvas1;
  };
  //
  var percent = 1 - document.body.scrollTop / document.body.scrollHeight;
  ctx.drawImage(theSphere = sphere(percent), 0, 0)
};