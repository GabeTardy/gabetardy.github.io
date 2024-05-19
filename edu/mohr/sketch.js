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

var StressState2D = function(sx, sy, txy){
  this.sx = sx;
  this.sy = sy;
  this.txy = txy;
  
  this.findPrincipals();

  this.tu = 0; // user-specified rotation of the element
  this.tuG = 0; // public GOAL user-specified rotation (technical)
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

StressState2D.prototype.drawElement = function(x, y, s){
  // update lerped properties (rotation)
  this.tu += ((this.tuG - this.tu)*ANIMATION_SPEED) % 360;
  this.tuG = this.tuG % 360;
  this.arbitrarilyRotateBy(this.tu);
  // console.log(this.sp1 + ", " + this.sp2 + ", " + this.t);

  translate(x + s/2, y + s/2);
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
  fill(FILL_COLOR);
  noStroke(); // turn this off to debug mask
  rect(s/6, -s/10, s/4, s/5);
  rect(-s/6, -s/10, -s/4, s/5);
  rect(-s/10, s/6, s/5, s/4);
  rect(-s/10, -s/6, s/5, -s/4);

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

  // place numbers
  noStroke();
  textAlign(LEFT, CENTER);
  text(round(this.sp1 * 10**KEEP_DIGITS)/(10**KEEP_DIGITS), s/6*(1 + ARROW_SIZE) + triHeadX, 0);

  textAlign(RIGHT, CENTER);
  text(round(this.sp1 * 10**KEEP_DIGITS)/(10**KEEP_DIGITS), -s/6*(1 + ARROW_SIZE) - triHeadX, 0);

  textAlign(CENTER, TOP);
  text(round(this.sp2 * 10**KEEP_DIGITS)/(10**KEEP_DIGITS), 0, s/6*(1 + ARROW_SIZE) + triHeadY);

  textAlign(CENTER, BASELINE);
  text(round(this.sp2 * 10**KEEP_DIGITS)/(10**KEEP_DIGITS), 0, -s/6*(1 + ARROW_SIZE) - triHeadY);

  textAlign(LEFT, BASELINE);
  text(round(this.t * 10**KEEP_DIGITS)/(10**KEEP_DIGITS), s/6*(1 + ARROW_SIZE), -s/6*(1 + ARROW_SIZE));

  textAlign(LEFT, CENTER);
  text("\u03d5 = " + ground(this.tu) + "º", s/20*cos(this.tu*PI/180/2) + ARROW_SIZE*s/6, s/20*sin(this.tu*PI/180/2) + ARROW_SIZE*s/6);

  //text("\u03d5 = " + ground(this.tp1) + "º", s/20*cos((this.tu - this.tp1)*PI/180/2) + ARROW_SIZE*s/6, s/20*sin((this.tu - this.tp1)*PI/180/2) + ARROW_SIZE*s/6);

  resetMatrix();
};

StressState2D.prototype.drawMohr = function(x, y, s){
  translate(x + s/2, y + s/2);
  fill(255);
  stroke(0);
  ellipse(0, 0, s/2, s/2);
  line(-s/3, 0, s/3, 0);

  // tau-axis
  var xiZero = (-3*this.C)/(4*this.R);
  if(xiZero < -1) xiZero = -1;
  line(s/3*(-3*this.C)/(4*this.R), -s/3, s/3*(-3*this.C)/(4*this.R), s/3);

  // 2* theta p1
  srArc(0, 0, s/10, 0, 2*this.tp1*PI/180, 0, 0, 0);

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
  text("\u03c4", 0, s/4);

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
  text("2\u03d5 = " + 2*ground(this.tu) + "º", s/10*cos((2*this.tp1 - this.tu)*PI/180), s/10*sin((2*this.tp1 - this.tu)*PI/180));

  // user theta
  srArc(0, 0, s/5, 2*(this.tp1 - this.tu)*PI/180, 2*this.tp1*PI/180, 255, 0, 0);
  resetMatrix();
};

StressState2D.prototype.setRotation = function(th){
  if(th == NaN) return;

  this.tuG = th;
};

StressState2D.prototype.applyRotation = function(th){
  if(th == NaN) return;
  
  this.tuG -= th;
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(20);
}

var mouseThetaL, mouseThetaR;
var px, py, ptl, ptr;
var dx, dy, dtl, dtr;

function draw() {
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

  if(mouseX > lp.x && mouseX < lp.x + lp.w && mouseY > lp.y && mouseY < lp.y + lp.h && mouseIsPressed) currentStressState.applyRotation(dtl);
  if(mouseX > rp.x && mouseX < rp.x + rp.w && mouseY > rp.y && mouseY < rp.y + rp.h && mouseIsPressed) currentStressState.applyRotation(dtr/2);

  // must be last!!!
  px = mouseX;
  py = mouseY;
  ptl = mouseThetaL;
  ptr = mouseThetaR;

  
}

function windowResized(){
  resizeCanvas(ww, hh);
}


function mouseReleased(){
  if(abs(currentStressState.tuG) < 5) currentStressState.tuG = 0;
  if(abs(currentStressState.tp1 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp1;
  if(abs(currentStressState.tp1 - 90 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp1 - 90;
  if(abs(-(180 - currentStressState.tp1) - currentStressState.tuG) < 5) currentStressState.tuG = -(180 - currentStressState.tp1);
  if(abs(currentStressState.ts1 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.ts1;
  if(abs(currentStressState.tp2 - currentStressState.tuG) < 5) currentStressState.tuG = currentStressState.tp2;
}