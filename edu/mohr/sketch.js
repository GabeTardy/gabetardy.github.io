// Screen size properties
var ww;
var hh;

// Two-page layout properties
var initX;
var initY;
var pageSize;
const PADDING = 50;

var lp = {x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0};
var rp = {x: 0, y: 0, w: 0, h: 0, mx: 0, my: 0};

const ANIMATION_SPEED = 1/15;
const ARROW_SIZE = 1/15;
const TEXT_SIZE = 20;
const FILL_COLOR = '#dcf3be'; 

var strokeDash = function(k){
  drawingContext.setLineDash(k);
};

var refAngDeg = function(angle){
  return angle - (angle > 180)*360;
}; 

var refAngRad = function(angle){ 
  return angle - (angle > PI)*2*PI;
}; 

var srArc = function(x, y, radius, start, stop, r, g, b){
  start = refAngRad(start);
  stop = refAngRad(stop);

  if(start > stop){
    start2 = start;
    start = stop;
    stop = start2;  
  } 
 
  const MAX_ALPHA = 15;
  noFill();
  for(var i = 0; i < radius; i++){
    stroke(r, g, b, i/radius*MAX_ALPHA);
    arc(x, y, i, i, start, stop);
  }

  stroke(r, g, b, 255);
  arc(x, y, radius, radius, start, stop);
}; 


// Mohr's circle script properties
var currentStressState;
const KEEP_DIGITS = 2;

var ground = function(n){
  return round(n * 10**KEEP_DIGITS)/(10**KEEP_DIGITS);
};

// Specialized irrotational prioritized radial labels (this was annoying to set up)
var labels = [];
var activeLabelIndex = -1;

function Label(content = "Hello World", cx = 0, cy = 0, radius = 0, padRadius = 0, theta = 0, c = color(0, 0, 0), importance = 0, isEditable = false, onChange = function(){}){
  this.cx = cx;
  this.cy = cy;
  this.radius = radius;
  this.padRadius = padRadius;
  this.theta = theta;
  this.contentRaw = content + "";
  this.isEditable = isEditable;
  this.isHovering = false;
  this.isActive = false;
  this.isColliding = false;
  this.color = c;
  this.importance = importance;

  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.h = 0;

  this.opacity = 255;
  this.targetOpacity = 255;
  this.opacitySpeed = 1/5;

  this.calculateContentArray();
  this.calculateBoundingBox();

  this.onChange = onChange;
};

Label.prototype.calculateContentArray = function(){
  this.content = this.contentRaw.split(/(\_\w)/gim);
};

Label.prototype.calculateBoundingBox = function(){
  var totalWidth = 0;
  var totalHeight = 0;


  fill(0); // for now
  for(var i = 0; i < this.content.length; i++){
    if(this.content[i][0] == "\_"){
      var baselineHeight = textAscent();
      var ssValue = this.content[i].replace("\_", "");
      push();
        textSize(TEXT_SIZE*2/3)
        totalWidth += textWidth(ssValue);
        if(baselineHeight + textAscent() + textDescent() > totalHeight) totalHeight = baselineHeight + textAscent() + textDescent();
      pop();
    }else{
      totalWidth += textWidth(this.content[i]);
      if(textAscent() + textDescent() > totalHeight) totalHeight = textAscent() + textDescent();
    }
  }

  this.w = totalWidth;
  this.h = totalHeight;
};

Label.prototype.handleInput = function(mpx, mpy){
  this.isHovering = mpx > this.x && mpy > this.y && mpx < this.x + this.w && mpy < this.y + this.h;

  if(mouseIsPressed){
    if(this.isHovering){
      if(activeLabelIndex == -1){
        this.isActive = true;
      }
    }else{
      this.isActive = false;
    }
  }
};

Label.prototype.updatePosition = function(rad, theta){ // in degrees
  this.radius = rad;

  this.x = this.cx + (this.radius + this.padRadius)*cos(theta*PI/180) - this.w*(0.5-cos(theta*PI/180)/2);
  this.y = this.cy + (this.radius + this.padRadius)*sin(theta*PI/180) - this.h*(0.5-sin(theta*PI/180)/2);

  if(this.debug){
    push();
      stroke(0);
      strokeWeight(2);
      point(this.cx, this.cy);
      point(this.cx + this.radius*cos(theta*PI/180), this.cy + this.radius*sin(theta*PI/180));
      point(this.cx + (this.radius + this.padRadius)*cos(theta*PI/180), this.cy + (this.radius + this.padRadius)*sin(theta*PI/180));
      point(this.x, this.y);

      noFill();
      strokeWeight(1);
      beginShape();
      vertex(this.cx, this.cy);
      vertex(this.cx + this.radius*cos(theta*PI/180), this.cy + this.radius*sin(theta*PI/180));
      vertex(this.cx + (this.radius + this.padRadius)*cos(theta*PI/180), this.cy + (this.radius + this.padRadius)*sin(theta*PI/180));
      vertex(this.x, this.y);
      endShape();

      noStroke();
      fill(0, 0, 0, 20);
      rect(this.x, this.y, this.w, this.h);
    pop();
  }
};

Label.prototype.render = function(){
  textAlign(LEFT, TOP);

  var rc = red(this.color);
  var gc = green(this.color);
  var bc = blue(this.color);

  fill(rc, gc, bc, ((+this.isActive) + (this.isHovering && this.isEditable))*40);
  rect(this.x - this.padRadius, this.y - this.padRadius, this.w + this.padRadius*2, this.h + this.padRadius*2);

  if(this.isActive){
    fill(rc, gc, bc);
    text(this.contentRaw, this.x, this.y);
    return;
  }

  var totalWidth = 0;
  var totalHeight = 0;


  fill(rc, gc, bc, this.opacity); // for now
  for(var i = 0; i < this.content.length; i++){
    if(this.content[i][0] == "\_"){
      var baselineHeight = textAscent();
      var ssValue = this.content[i].replace("\_", "");
      push();
        textSize(TEXT_SIZE*2/3)
        text(ssValue, this.x + totalWidth, this.y + baselineHeight);
        totalWidth += textWidth(ssValue);
        if(baselineHeight + textAscent() + textDescent() > totalHeight) totalHeight = baselineHeight + textAscent() + textDescent();
      pop();
    }else{
      text(this.content[i], this.x + totalWidth, this.y);
      totalWidth += textWidth(this.content[i]);
      if(textAscent() + textDescent() > totalHeight) totalHeight = textAscent() + textDescent();
    }
  }

  this.opacity += (this.targetOpacity - this.opacity)*this.opacitySpeed;
};

Label.prototype.collide = function(label){
  return this.x < label.x + label.w && this.x + this.w > label.x && this.y < label.y + label.h && this.y + this.h > label.y;
}

function LabelSystem(){
  this.labels = [];
  this.activeLabelIndex = -1;
  this.initialized = false;
  this.editIndex = 0;
};

LabelSystem.prototype.label = function(label){ // This one is in use - allows labels to be created only once, and then next time edit the text. jank, probably not optimal implementation but it works.
  if(!this.initialized){
    this.labels.push(label);
    //this.labels.sort((a, b) => a.importance - b.importance);
  }else{
    if(!this.labels[this.editIndex].isActive){
      this.labels[this.editIndex].contentRaw = label.contentRaw;
      this.labels[this.editIndex].calculateContentArray();
      this.labels[this.editIndex].calculateBoundingBox();
    }
    this.labels[this.editIndex].updatePosition(label.radius, label.theta);
    this.editIndex++;
  }
};

LabelSystem.prototype.addLabel = function(label){
  this.labels.push(label);
  //this.labels.sort((a, b) => a.importance - b.importance);
};

LabelSystem.prototype.removeLabel = function(i){
  this.labels.splice(i, 1);
  this.labels.sort((a, b) => a.importance - b.importance); // might not be strictly necessary
};

LabelSystem.prototype.setTheta = function(i, rad, theta){
  this.labels[i].updatePosition(rad, theta);
}

LabelSystem.prototype.update = function(mpx, mpy){
  this.initialized = true;

  for(var i = 0; i < this.labels.length; i++){
    this.labels[i].isColliding = false;
    this.labels[i].targetOpacity = 255;

    // check overlap and set opacity accordingly
    for(var j = 0; j < this.labels.length; j++){
      if(i != j && this.labels[i].collide(this.labels[j])){
        // console.log(i + " collides with " + j);
        this.labels[i].isColliding = true;
        if(this.labels[i].importance < this.labels[j].importance){
          this.labels[i].targetOpacity -= 200;
          if(this.labels[i].targetOpacity < 0){
            this.labels[i].targetOpacity = 0;
          }
        }
      }
    }

    this.labels[i].render();
    this.labels[i].handleInput(mpx, mpy);

    if(this.labels[i].isActive){
      this.activeLabelIndex = i;
    }else if(this.activeLabelIndex == i){
      this.activeLabelIndex = -1;
    }
  }

  this.editIndex = 0;
};


function StressState2D(sx, sy, txy){
  this.sx = sx;
  this.sy = sy;
  this.txy = txy;
  
  this.findPrincipals();

  this.tu = 0; // user-specified rotation of the element
  this.dTu_dT = 0; // angular velocity of the element
  this.tuG = 0; // public GOAL user-specified rotation (for snapping)
  this.isSnapped = false;
  
  this.isHydrostatic = (sx == sy && txy == 0);
  this.elementLabels = new LabelSystem();
  this.mohrLabels = new LabelSystem();
};

StressState2D.prototype.findPrincipals = function(){
  this.C = (this.sx + this.sy)/2;
  this.R = sqrt(((this.sx - this.sy)/2) ** 2 + this.txy ** 2);

  this.s1 = this.C + this.R;
  this.s2 = this.C - this.R;
  this.t1 = this.R;
  this.t2 = -this.R;

  this.tp1 = (this.sx == this.C) ? 0 : 1/2*atan(this.txy/(this.sx - this.C))*180/PI;
  this.tp2 = this.tp1 + 90;
  this.ts1 = this.tp1 + 45;
  this.ts2 = this.ts1 + 90;
};

StressState2D.prototype.arbitrarilyRotateBy = function(th){ // in degrees, for clarity
  var angle = 2*(th - this.tp1);
  this.sp1 = this.C + this.R*cos(PI/180*angle);
  this.sp2 = this.C - this.R*cos(PI/180*angle);
  this.t = this.R*sin(PI/180*angle);
};

StressState2D.prototype.processAngle = function(dT){
  this.tu += this.dTu_dT*dT;
  this.dTu_dT -= this.dTu_dT*ANIMATION_SPEED;

  this.tu %= 180;
  //this.tu += ((this.tuG - this.tu)*ANIMATION_SPEED); // for snapping

  this.arbitrarilyRotateBy(this.tu);
};

StressState2D.prototype.setAngularVelocity = function(dV){
  this.dTu_dT = -dV;
};

StressState2D.prototype.drawElement = function(x, y, s, dT){
  // update lerped properties (rotation)
  // % 360;
  //this.tuG = this.tuG % 360;
  //this.arbitrarilyRotateBy(this.tu);
  // console.log(this.sp1 + ", " + this.sp2 + ", " + this.t);
  var ox = x + s/2, oy = y + s/2;
  translate(ox, oy);
  rotate(-PI/180*this.tu);

  
  fill(255, 255, 255);
  rect(-s/6, -s/6, s/3, s/3);

  stroke(0, 0, 0);
  strokeDash([5, 5]);
  line(0, 0, s/3*cos(this.tu*PI/180), s/3*sin(this.tu*PI/180)); // x-axis
  line(0, 0, s/3*sin(this.tu*PI/180), -s/3*cos(this.tu*PI/180)); // y-axis

  strokeDash([]);
  line(0, 0, s/3*cos((this.tu - this.tp1)*PI/180), s/3*sin((this.tu - this.tp1)*PI/180)); // theta p1
  line(0, 0, s/3*cos((this.tu - this.ts1)*PI/180), s/3*sin((this.tu - this.ts1)*PI/180)); // theta s1

  // wip blocker?? idk
  //fill(FILL_COLOR);
  //noStroke(); // turn this off to debug mask
  //rect(s/6, -s/10, s/4, s/5);
  //rect(-s/6, -s/10, -s/4, s/5);
  //rect(-s/10, s/6, s/5, s/4);
  //rect(-s/10, -s/6, s/5, -s/4);

  // theta p1, s1
  srArc(0, 0, s/5, (this.tu - this.tp1)*PI/180, this.tu*PI/180, 0, 0, 0);
  srArc(0, 0, 3*s/10, (this.tu - this.ts1)*PI/180, this.tu*PI/180, 0, 0, 0);

  stroke(255, 0, 0);
  noFill();
  rect(-s/6, -s/6, s/3, s/3);

  // user x', y' axes
  line(0, 0, s/6, 0);
  line(0, 0, 0, -s/6);

  // user theta
  srArc(0, 0, s/10, 0, this.tu*PI/180, 255, 0, 0);

  var triHeadX = s/6*max(abs(this.sp1/max(abs(this.s1), abs(this.s2))), ARROW_SIZE*4/3);
  var triHeadY = s/6*max(abs(this.sp2/max(abs(this.s1), abs(this.s2))), ARROW_SIZE*4/3);

  fill(255, 0, 0);
  line(s/6, 0, s/6 + triHeadX, 0);
  line(-s/6, 0, -s/6 - triHeadX, 0);
  line(0, s/6, 0, s/6 + triHeadY);
  line(0, -s/6, 0, -s/6 - triHeadY);

  // shears
  if(abs(this.t) > 10**(-KEEP_DIGITS)){
    // "x" face
    line(s/6*(1+ARROW_SIZE), -s/6, s/6*(1+ARROW_SIZE), s/6);
    line(-s/6*(1+ARROW_SIZE), -s/6, -s/6*(1+ARROW_SIZE), s/6);

    // "y" face
    line(-s/6, s/6*(1+ARROW_SIZE), s/6, s/6*(1+ARROW_SIZE));
    line(-s/6, -s/6*(1+ARROW_SIZE), s/6, -s/6*(1+ARROW_SIZE));
  }

  // place arrowheads
  if(this.sp1 > 0){
    triangle(s/6 + triHeadX, 0, s/6 + triHeadX - s/6*ARROW_SIZE, -s/6*ARROW_SIZE/2, s/6 + triHeadX - s/6*ARROW_SIZE, s/6*ARROW_SIZE/2);
    triangle(-s/6 - triHeadX, 0, -s/6 - triHeadX + s/6*ARROW_SIZE, -s/6*ARROW_SIZE/2, -s/6 - triHeadX + s/6*ARROW_SIZE, s/6*ARROW_SIZE/2);
  }else{
    triangle(s/6, 0, s/6 + s/6*ARROW_SIZE, -s/6*ARROW_SIZE/2, s/6 + s/6*ARROW_SIZE,  s/6*ARROW_SIZE/2);
    triangle(-s/6, 0, -s/6 - s/6*ARROW_SIZE, -s/6*ARROW_SIZE/2, -s/6 - s/6*ARROW_SIZE,  s/6*ARROW_SIZE/2);
  }

  if(this.sp2 > 0){
    triangle(0, s/6 + triHeadY, -s/6*ARROW_SIZE/2, s/6 + triHeadY - s/6*ARROW_SIZE, s/6*ARROW_SIZE/2, s/6 + triHeadY - s/6*ARROW_SIZE);
    triangle(0, -s/6 - triHeadY, -s/6*ARROW_SIZE/2, -s/6 - triHeadY + s/6*ARROW_SIZE, s/6*ARROW_SIZE/2, -s/6 - triHeadY + s/6*ARROW_SIZE);
  }else{
    triangle(0, s/6, -s/6*ARROW_SIZE/2, s/6 + s/6*ARROW_SIZE, s/6*ARROW_SIZE/2, s/6 + s/6*ARROW_SIZE);
    triangle(0, -s/6, -s/6*ARROW_SIZE/2, -s/6 - s/6*ARROW_SIZE, s/6*ARROW_SIZE/2, -s/6 - s/6*ARROW_SIZE);
  }

  if(this.t < -(10**(-KEEP_DIGITS))){
    triangle(s/6*(1+ARROW_SIZE), -s/6, s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, s/6*(1+3/2*ARROW_SIZE), -s/6 + s/6*ARROW_SIZE);
    triangle(-s/6, s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, s/6*(1+3/2*ARROW_SIZE));

    triangle(-s/6*(1+ARROW_SIZE), s/6, -s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, -s/6*(1+3/2*ARROW_SIZE), s/6 - s/6*ARROW_SIZE);
    triangle(s/6, -s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, -s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, -s/6*(1+3/2*ARROW_SIZE));
  }else if(this.t > 10**(-KEEP_DIGITS)){
    triangle(s/6*(1+ARROW_SIZE), s/6, s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, s/6*(1+3/2*ARROW_SIZE), s/6 - s/6*ARROW_SIZE);
    triangle(-s/6, -s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, -s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, -s/6*(1+3/2*ARROW_SIZE));

    triangle(-s/6*(1+ARROW_SIZE), -s/6, -s/6*(1+ARROW_SIZE), -s/6 + s/6*ARROW_SIZE, -s/6*(1+3/2*ARROW_SIZE), -s/6 + s/6*ARROW_SIZE);
    triangle(s/6, s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, s/6*(1+ARROW_SIZE), s/6 - s/6*ARROW_SIZE, s/6*(1+3/2*ARROW_SIZE));
  }

  noStroke();

  resetMatrix();

  // User theta (theta_r) label
  this.elementLabels.label(new Label("\u03b8_R = " + ground(this.tu) + "º", ox, oy, s/20, ARROW_SIZE*s/6, -this.tu/2, color(255, 0, 0), 1, false));
  
  this.elementLabels.label(new Label(ground(this.sp1), ox, oy, s/6*(1 + ARROW_SIZE) + triHeadX, 0, -this.tu, color(255, 0, 0), 2, true, (val) => {
    this.sx = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label(ground(this.sp1), ox, oy, s/6*(1 + ARROW_SIZE) + triHeadX, 0, -this.tu-180, color(255, 0, 0), 2, true, (val) => {
    this.sx = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label(ground(this.sp2), ox, oy, s/6*(1 + ARROW_SIZE) + triHeadY, 0, -this.tu-90, color(255, 0, 0), 2, true, (val) => {
    this.sy = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label(ground(this.sp2), ox, oy, s/6*(1 + ARROW_SIZE) + triHeadY, 0, -this.tu-270, color(255, 0, 0), 2, true, (val) => {
    this.sy = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label(ground(this.t), ox, oy, s/6*(1 + ARROW_SIZE)*sqrt(2), 0, -this.tu-45, color(255, 0, 0), 2, true, (val) => {
    this.txy = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label(ground(this.t), ox, oy, s/6*(1 + ARROW_SIZE)*sqrt(2), 0, -this.tu-225, color(255, 0, 0), 2, true, (val) => {
    this.sxy = parseFloat(val) || 0;
  }));

  this.elementLabels.label(new Label("X", ox, oy, s/3, 0, 0, color(0)));

  this.elementLabels.label(new Label("Y", ox, oy, s/3, 0, -90, color(0)));

  this.elementLabels.label(new Label("\u03b8_p_1 = " + ground(this.tp1) + "º", ox, oy, s/10, ARROW_SIZE*s/6, -this.tp1/2, color(0)));

  this.elementLabels.label(new Label("\u03b8_s_1 = " + ground(this.ts1) + "º", ox, oy, 3*s/20, ARROW_SIZE*s/6, -this.ts1/2, color(0)));
  
  this.elementLabels.update();
};

StressState2D.prototype.drawMohr = function(x, y, s){

  translate(x + s/2, y + s/2);

  if(this.isHydrostatic){
    textAlign(CENTER, CENTER);
    fill(0);
    noStroke();
    text("Hydrostatic/Uniform Stress\nOrientation Does Not Matter\nVisual WIP (for now)", 0, 0);
    resetMatrix();
    return;
  }
  
  fill(255);
  stroke(0);
  ellipse(0, 0, s/2, s/2);
  line(-s/3, 0, s/3, 0);

  // tau-axis
  var xiZero = (-3*this.C)/(4*this.R);
  if(xiZero < -1) xiZero = -1;
  line(s/3*(-3*this.C)/(4*this.R), -s/3, s/3*(-3*this.C)/(4*this.R), s/3);

  // 2* theta p1
  srArc(0, 0, s/5, 0, 2*this.tp1*PI/180, 0, 0, 0);

  // 2* theta s1
  srArc(0, 0, 3*s/10, 2*this.tp1*PI/180, -2*(this.ts1 - this.tp1)*PI/180, 0, 0, 0);

  // axis labels
  fill(0);
  noStroke();
  textAlign(LEFT, CENTER);
  text("+ \u03c3", s/3*(1 + ARROW_SIZE), 0);

  textAlign(CENTER, TOP);
  text("\u03c4 \u21ba", s/3*(-3*this.C)/(4*this.R), s/3);

  textAlign(CENTER, BOTTOM);
  text("\u03c4 \u21bb", s/3*(-3*this.C)/(4*this.R), -s/3);


  stroke(0);
  strokeDash([5, 5]);
  line(s/3*(this.sx - this.C)/(4/3*this.R), s/3*(3*this.txy/(4*this.R)), s/3*(this.sy - this.C)/(4/3*this.R), -s/3*(3*this.txy/(4*this.R)))
  
  strokeDash([]);
  
  // principal shear planes
  line(0, s/4, 0, -s/4);
noStroke();
fill(0);
textAlign(CENTER, TOP);
  text("S_1 (" + ground(this.C) + ", " + ground(this.R) + ")", 0, s/4 + s/6*ARROW_SIZE);
textAlign(CENTER, BASELINE);
text("S_2 (" + ground(this.C) + ", -" + ground(this.R) + ")", 0, -s/4 - s/6*ARROW_SIZE);

// principal axial planes
textAlign(LEFT, TOP);
text("P_1 (" + ground(this.C + this.R) + ", 0)", s/4 + s/6*ARROW_SIZE, 0);

textAlign(RIGHT, BOTTOM);
text("P_2 (" + ground(this.C - this.R) + ", 0)", - s/4 - s/6*ARROW_SIZE, 0);

// X-Y Plane
textAlign(LEFT, TOP);
text("X (" + ground(this.sx) + ", " + ground(this.txy) + ")", s/3*(this.sx - this.C)/(4/3*this.R), s/3*(3*this.txy/(4*this.R)));

textAlign(RIGHT, BOTTOM);
text("Y (" + ground(this.sy) + ", -" + ground(this.txy) + ")", s/3*(this.sy - this.C)/(4/3*this.R), -s/3*(3*this.txy/(4*this.R)));

fill(255, 0, 0);
// User Plane
textAlign(LEFT, TOP);
text("R_1 (" + ground(this.sp1) + ", " + ground(-this.t) + ")", s/3*(this.sp1 - this.C)/(4/3*this.R), -s/3*(3*this.t/(4*this.R)));

textAlign(RIGHT, BOTTOM);
text("R_2 (" + ground(this.sp2) + ", -" + ground(-this.t) + ")", s/3*(this.sp2 - this.C)/(4/3*this.R), s/3*(3*this.t/(4*this.R)));
 
  // x-y base plane
  fill(0);
  ellipse(s/3*(this.sx - this.C)/(4/3*this.R), s/3*(3*this.txy/(4*this.R)), s/55, s/55);
  ellipse(s/3*(this.sy - this.C)/(4/3*this.R), -s/3*(3*this.txy/(4*this.R)), s/55, s/55);

  // P1-P2 plane
  ellipse(s/4, 0, s/55, s/55);
  ellipse(-s/4, 0, s/55, s/55);

  // S1-S2 plane
  ellipse(0, s/4, s/55, s/55);
  ellipse(0, -s/4, s/55, s/55);

  // user rotation plane of the stress element
  fill(255, 0, 0);
  stroke(255, 0, 0);
  line(s/3*(this.sp1 - this.C)/(4/3*this.R), -s/3*(3*this.t/(4*this.R)), s/3*(this.sp2 - this.C)/(4/3*this.R), s/3*(3*this.t/(4*this.R)));
  ellipse(s/3*(this.sp1 - this.C)/(4/3*this.R), -s/3*(3*this.t/(4*this.R)), s/55, s/55);
  ellipse(s/3*(this.sp2 - this.C)/(4/3*this.R), s/3*(3*this.t/(4*this.R)), s/55, s/55);

  // user theta text
  fill(255, 0, 0);
  textAlign(LEFT, TOP);
  text("2\u03b8_R = " + 2*ground(this.tu) + "º", s/10*cos((2*this.tp1 - this.tu)*PI/180), s/10*sin((2*this.tp1 - this.tu)*PI/180));

  // user theta
  srArc(0, 0, s/10, 2*(this.tp1 - this.tu)*PI/180, 2*this.tp1*PI/180, 255, 0, 0);
  resetMatrix();

  this.mohrLabels.update();
};

StressState2D.prototype.setRotation = function(th){
  if(th == NaN) return;

  this.tuG = th;
};

StressState2D.prototype.applyRotation = function(th){
  if(th == NaN) return;
  
  this.tuG -= th;
};

StressState2D.prototype.handleKeyRelease = function(){
  if(this.elementLabels.activeLabelIndex != -1){
    if(keyCode === ESCAPE || keyCode === ENTER || keyCode === RETURN){
      this.elementLabels.labels[activeLabelIndex].isActive = false;
      this.elementLabels.activeLabelIndex = -1;
      return; // to prevent the next code from running for whatever reason (i don't think it does but just to be safe)
    }

    // magic number 48: for more information see https://p5js.org/reference/#/p5/keyCode
    // since labels can only be numbers
    if(keyCode - 48 >= 0 && keyCode - 48 <= 9){
      this.elementLabels.labels[activeLabelIndex].contentRaw += ""+(keyCode-48);
      this.elementLabels.labels[activeLabelIndex].calculateContentArray();
      this.elementLabels.labels[activeLabelIndex].calculateBoundingBox();
      this.elementLabels.labels[activeLabelIndex].onChange(this.elementLabels.labels[activeLabelIndex].contentRaw);
    }

    if(keyCode === BACKSPACE){
      this.elementLabels.labels[activeLabelIndex].contentRaw = this.elementLabels.labels[activeLabelIndex].contentRaw.substring(0, this.elementLabels.labels[activeLabelIndex].contentRaw.length - 1);
      this.elementLabels.labels[activeLabelIndex].calculateContentArray();
      this.elementLabels.labels[activeLabelIndex].calculateBoundingBox();
      this.elementLabels.labels[activeLabelIndex].onChange(this.elementLabels.labels[activeLabelIndex].contentRaw);
    }
  }

  if(this.mohrLabels.activeLabelIndex != -1){
    if(keyCode === ESCAPE || keyCode === ENTER || keyCode === RETURN){
      this.mohrLabels.labels[activeLabelIndex].isActive = false;
      this.mohrLabels.activeLabelIndex = -1;
      return; // to prevent the next code from running for whatever reason (i don't think it does but just to be safe)
    }

    // magic number 48: for more information see https://p5js.org/reference/#/p5/keyCode
    // since labels can only be numbers
    if(keyCode - 48 >= 0 && keyCode - 48 <= 9){
      this.mohrLabels.labels[activeLabelIndex].contentRaw += ""+(keyCode-48);
      this.mohrLabels.labels[activeLabelIndex].calculateContentArray();
      this.mohrLabels.labels[activeLabelIndex].calculateBoundingBox();
      this.mohrLabels.labels[activeLabelIndex].onChange();
    }

    if(keyCode === BACKSPACE){
      this.mohrLabels.labels[activeLabelIndex].contentRaw = this.mohrLabels.labels[activeLabelIndex].contentRaw.substring(0, this.mohrLabels.labels[activeLabelIndex].contentRaw.length - 1);
      this.mohrLabels.labels[activeLabelIndex].calculateContentArray();
      this.mohrLabels.labels[activeLabelIndex].calculateBoundingBox();
      this.mohrLabels.labels[activeLabelIndex].onChange();
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(TEXT_SIZE);
}

var mouseThetaL, mouseThetaR;
var px, py, ptl, ptr;
var dx, dy, dtl, dtr;

var pt = 0, dt = 0; 

// new StressState2D(25, -5, 35);
// new StressState2D(25, -5, 0);
// new StressState2D(25, 25, 35);
// new StressState2D(25, 25, 0);
function draw() {
  dt = millis() - pt;

  //console.log(1/(dt/1000));
  // what (no clue why this is required here)
  if(!currentStressState) currentStressState = new StressState2D(25, -5, 35);

  // Set window properties
  ww = windowWidth;
  hh = windowHeight;
  
  // Split into responsive page layout (this was a pita)
  background(255, 255, 200);
  fill(FILL_COLOR);
  noStroke();

  pageSize = min((ww - PADDING*3)/2, hh - PADDING*2);

  initY = hh/2 - pageSize/2;
  initX = max(0, (ww - PADDING*3)/2 - (hh - PADDING*2))/2;

  lp = {x: PADDING + initX, y: initY, w: pageSize, h: pageSize};
  rp = {x: ww/2 + PADDING/2 + initX, y: initY, w: pageSize, h: pageSize};

  // Create localized mouse positions for each page
  lp.mx = mouseX - lp.x;
  lp.my = mouseY - lp.y;
  rp.mx = mouseX - rp.x;
  rp.my = mouseY - rp.y;

  rect(lp.x, lp.y, lp.w, lp.h);
  rect(rp.x, rp.y, rp.w, rp.h);

  currentStressState.processAngle(dt);
  currentStressState.drawElement(lp.x, lp.y, (lp.w + lp.h)/2); // trying to avoid issues
  currentStressState.drawMohr(rp.x, rp.y, (rp.w + rp.h)/2);
  // todo: display warning on mobile

  // must be first!!!
  mouseThetaL = atan((mouseY - lp.y - lp.h/2)/(mouseX - lp.x - lp.w/2))*180/PI - (mouseX < lp.x + lp.w/2)*(180 - 360*(mouseY > lp.y + lp.h/2)); // last term fixes the arctangent for the other values
  mouseThetaR = atan((mouseY - rp.y - rp.h/2)/(mouseX - rp.x - rp.w/2))*180/PI - (mouseX < rp.x + rp.w/2)*(180 - 360*(mouseY > rp.y + rp.h/2)); // last term fixes the arctangent for the other values
  
  if(!px) px = mouseX;
  if(!py) py = mouseY;
  if(!ptl) ptl = mouseThetaL;
  if(!ptr) ptr = mouseThetaL;

  dx = mouseX - px;
  dy = mouseY - py;
  dtl = mouseThetaL - ptl;
  dtr = mouseThetaR - ptr;

  //if(mouseX > lp.x && mouseX < lp.x + lp.w && mouseY > lp.y && mouseY < lp.y + lp.h && mouseIsPressed) currentStressState.applyRotation(dtl);
  //if(mouseX > rp.x && mouseX < rp.x + rp.w && mouseY > rp.y && mouseY < rp.y + rp.h && mouseIsPressed) currentStressState.applyRotation(dtr/2);
  if(mouseX > lp.x && mouseX < lp.x + lp.w && mouseY > lp.y && mouseY < lp.y + lp.h && mouseIsPressed) currentStressState.setAngularVelocity(dtl/dt);
  if(mouseX > rp.x && mouseX < rp.x + rp.w && mouseY > rp.y && mouseY < rp.y + rp.h && mouseIsPressed) currentStressState.setAngularVelocity(dtr/2/dt);

  // must be last!!!
  px = mouseX;
  py = mouseY;
  ptl = mouseThetaL;
  ptr = mouseThetaR;
  pt += dt; 
}

function windowResized(){
  resizeCanvas(ww, hh);
}


function mouseReleased(){
  //currentStressState.isSnapped = false;
  /*
  if(abs(currentStressState.tu) < 5){
    currentStressState.dTu_dT = 0;
    currentStressState.tuG = 0;
  }else if(abs(currentStressState.tp1 - currentStressState.tu) < 5){
    currentStressState.dTu_dT = 0;
    currentStressState.tuG = currentStressState.tp1;
  }else{
    currentStressState.tuG = currentStressState.tu;
  }*/

  //if(abs(currentStressState.tuG) < 5) currentStressState.tuG = 0;
  //if(abs(currentStressState.tp1 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp1;
  //if(abs(currentStressState.tp1 - 90 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp1 - 90;
  //if(abs(-(180 - currentStressState.tp1) - currentStressState.tuG) < 5) currentStressState.tuG = -(180 - currentStressState.tp1);
  //if(abs(currentStressState.ts1 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.ts1;
  //if(abs(currentStressState.tp2 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp2;
}

function keyReleased(){
  currentStressState.handleKeyRelease();
}