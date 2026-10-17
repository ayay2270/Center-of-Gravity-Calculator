import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,DEFAULTS,radians,toWorld,toLocal,formatDifference,formatAngleComparison,formatGap,formatHeadlineAngles} from '../src/engineering.ts';
import {compareSpecification} from '../src/specComparison.ts';
const near=(actual:number,expected:number,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance, `${actual} ≠ ${expected}`);

test('1. theoretical reference: correct floor CG and baseline results',()=>{
  const r=calculate(DEFAULTS);
  near(r.z,1377); near(r.x,0); near(r.halfWidth,546);
  near(r.criticalAngle,21.63,0.01);
  assert.equal(r.criticalAngle.toFixed(1),'21.6');
  assert.equal(r.recommendedWidth,1120);
  assert.equal(r.stability,'stable');
  const spec=compareSpecification(DEFAULTS);
  assert.equal(spec.passes,true); assert.equal(spec.status,'pass'); assert.equal(spec.margin,6);
  assert.equal(formatDifference(spec.margin),'+6.0');
});
test('2. positive manual Xcg reduces critical angle; no double pallet height',()=>{
  const r=calculate({...DEFAULTS,mode:'manual',cgHeight:1377,cgOffset:100});
  near(r.z,1377); near(r.distance,446); near(r.criticalAngle,Math.atan(446/1377)*180/Math.PI);
  assert.ok(r.criticalAngle<calculate(DEFAULTS).criticalAngle);
});
test('3. negative manual Xcg increases critical angle',()=>{
  const r=calculate({...DEFAULTS,mode:'manual',cgHeight:1377,cgOffset:-100});
  near(r.distance,646); near(r.criticalAngle,Math.atan(646/1377)*180/Math.PI);
  assert.ok(r.criticalAngle>calculate(DEFAULTS).criticalAngle);
});
test('4. specification follows tilt when critical angle is above the 22° limit',()=>{
  const parameters={...DEFAULTS,mode:'manual' as const,cgHeight:1377,cgOffset:-100,tilt:16};
  const r=calculate(parameters);
  assert.equal(r.stability,'stable'); assert.ok(r.gravityOffset<0);
  near(r.criticalAngle,25.13,0.01); assert.ok(r.criticalAngle>parameters.specLimitAngle);
  const spec=compareSpecification(parameters);
  assert.equal(spec.passes,true); assert.equal(spec.status,'pass'); assert.equal(spec.margin,6);
  assert.equal(spec.subject,'目前傾角');
});
test('5. current angle equal to critical puts world gravity through pivot',()=>{
  const r=calculate({...DEFAULTS,tilt:calculate(DEFAULTS).criticalAngle});
  assert.equal(r.stability,'critical'); near(r.gravityOffset,0);
});
test('6. current angle above critical exceeds static limit',()=>{
  const r=calculate({...DEFAULTS,tilt:22}); assert.equal(r.stability,'exceeded'); assert.ok(r.gravityOffset>0);
});
test('7. exact 22° width is the critical angle; tilt at the limit passes specification',()=>{
  const width=2*1377*Math.tan(radians(DEFAULTS.specLimitAngle));
  const parameters={...DEFAULTS,palletWidth:width,tilt:22};
  const r=calculate(parameters);
  near(r.criticalAngle,22); assert.equal(r.stability,'critical');
  const spec=compareSpecification(parameters);
  assert.equal(spec.status,'boundary'); assert.equal(spec.passes,true); assert.equal(spec.margin,0);
});
test('8. reverse width and engineering rounding include manual offset',()=>{
  const base=calculate(DEFAULTS); near(base.requiredHalfWidth,556.3,0.05);
  near(base.preciseRequiredWidth,1112.7,0.05); assert.equal(base.recommendedHalfWidth,560); assert.equal(base.recommendedWidth,1120);
  for(const offset of [-100,100]){
    const r=calculate({...DEFAULTS,mode:'manual',cgOffset:offset});
    near(r.preciseRequiredWidth,base.preciseRequiredWidth+2*offset);
    const exact=calculate({...DEFAULTS,mode:'manual',cgOffset:offset,palletWidth:r.preciseRequiredWidth}); near(exact.criticalAngle,22);
  }
});
test('9. fixed right pivot and reversible CG drag transform at each tilt',()=>{
  for(const tilt of [0,5,16,19,21,22,25,60,75]){
    const half=546, pivot=toWorld({x:half,z:0},half,tilt); near(pivot.x,half);near(pivot.z,0);
    const point={x:123,z:1377}; const local=toLocal(toWorld(point,half,tilt),half,tilt);near(local.x,point.x);near(local.z,point.z);
  }
});
test('10. invalid geometry is rejected rather than rendering NaN',()=>{
  assert.throws(()=>calculate({...DEFAULTS,palletWidth:0}),RangeError);
  assert.throws(()=>calculate({...DEFAULTS,mode:'manual',cgHeight:0}),RangeError);
});
test('11. current tilt 21.6°, 22.0°, 22.4° follows the upper-limit rule',()=>{
  for(const [tilt,status,passes,difference] of [[21.6,'pass',true,'+0.4'],[22,'boundary',true,'0.0'],[22.4,'fail',false,'-0.4']] as const){
    const parameters={...DEFAULTS,tilt};
    const spec=compareSpecification(parameters);
    assert.equal(spec.status,status); assert.equal(spec.passes,passes);
    assert.equal(formatDifference(spec.margin),difference);
    const r=calculate(parameters);
    assert.equal(r.stability,tilt<r.criticalAngle?'stable':'exceeded');
  }
});
test('12. specification boundary tolerates only numerical error',()=>{
  for(const [tilt,status,passes] of [[22-1e-6,'pass',true],[22,'boundary',true],[22+5e-9,'boundary',true],[22+1e-6,'fail',false]] as const){
    const spec=compareSpecification({...DEFAULTS,tilt});
    assert.equal(spec.status,status); assert.equal(spec.passes,passes);
  }
});
test('13. physical tipping remains independent of the tilt specification check',()=>{
  for(const tilt of [0,5,16,19,21,22,25]){
    const parameters={...DEFAULTS,tilt};
    const r=calculate(parameters);
    const spec=compareSpecification(parameters);
    const margin=DEFAULTS.specLimitAngle-tilt;
    assert.equal(spec.passes,margin>=-1e-8);
    assert.equal(spec.status,Math.abs(margin)<=1e-8?'boundary':margin>0?'pass':'fail');
    assert.equal(r.stability,tilt<r.criticalAngle?'stable':'exceeded');
    assert.equal(r.gravityOffset>0,tilt>r.criticalAngle);
  }
});
test('14. difference display has one decimal and no negative zero or floating-point leakage',()=>{
  assert.equal(formatDifference(-0.3700000000000045),'-0.4');
  assert.equal(formatDifference(0.4000000000000057),'+0.4');
  assert.equal(formatDifference(-0.049),'0.0');
  assert.equal(formatDifference(0.049),'0.0');
  assert.equal(formatDifference(0),'0.0');
});
test('15. rounded width can raise critical angle without failing the tilt specification',()=>{
  const base=calculate(DEFAULTS);
  const exactWidth={...DEFAULTS,palletWidth:base.preciseRequiredWidth};
  near(calculate(exactWidth).criticalAngle,22);
  assert.equal(compareSpecification(exactWidth).passes,true);
  const roundedWidth={...DEFAULTS,palletWidth:base.recommendedWidth};
  const rounded=calculate(roundedWidth);
  assert.ok(rounded.criticalAngle>22);
  const spec=compareSpecification(roundedWidth);
  assert.equal(spec.passes,true); assert.equal(spec.margin,DEFAULTS.specLimitAngle-DEFAULTS.tilt);
});

test('16. editable limits 20°, 22°, 25° update tilt margin and reverse width only',()=>{
  const baseline=calculate(DEFAULTS);
  for(const limit of [20,22,25]){
    const parameters={...DEFAULTS,specLimitAngle:limit};
    const r=calculate(parameters);
    const spec=compareSpecification(parameters);
    near(spec.margin,limit-DEFAULTS.tilt);
    assert.equal(spec.passes,DEFAULTS.tilt<=limit);
    assert.equal(spec.status,'pass');
    near(r.preciseRequiredWidth,2*1377*Math.tan(radians(limit)));
    assert.equal(r.recommendedWidth,2*Math.ceil((1377*Math.tan(radians(limit))-1e-9)/10)*10);
    near(r.criticalAngle,baseline.criticalAngle); near(r.gravityOffset,baseline.gravityOffset);
    assert.equal(r.stability,'stable');
  }
});
test('17. below, equal and above each editable limit retain the tilt upper-limit rule',()=>{
  for(const limit of [20,22,25]){
    for(const [delta,status,passes,display] of [[-.4,'pass',true,'+0.4'],[0,'boundary',true,'0.0'],[.4,'fail',false,'-0.4']] as const){
      const parameters={...DEFAULTS,specLimitAngle:limit,tilt:limit+delta};
      const spec=compareSpecification(parameters);
      assert.equal(spec.status,status); assert.equal(spec.passes,passes);
      assert.equal(formatDifference(spec.margin),display);
      near(calculate(parameters).criticalAngle,calculate(DEFAULTS).criticalAngle);
    }
  }
});
test('18. screenshot manual case separates specification PASS from physical exceeded state',()=>{
  const parameters={...DEFAULTS,mode:'manual' as const,cgHeight:1262,cgOffset:318,tilt:19.4};
  const r=calculate(parameters);
  const spec=compareSpecification(parameters);
  assert.equal(r.criticalAngle.toFixed(1),'10.2'); assert.equal(formatDifference(spec.margin),'+2.6');
  assert.equal(spec.status,'pass'); assert.equal(spec.passes,true); assert.equal(r.stability,'exceeded');
  assert.equal(r.preciseRequiredWidth.toFixed(1),'1655.8'); assert.equal(r.recommendedWidth,1660);
});
test('19. manual offset reverse calculation follows every editable limit',()=>{
  for(const limit of [20,22,25])for(const offset of [-318,318]){
    const r=calculate({...DEFAULTS,mode:'manual',cgHeight:1262,cgOffset:offset,specLimitAngle:limit});
    near(r.requiredHalfWidth,1262*Math.tan(radians(limit))+offset);
    const exact=calculate({...DEFAULTS,mode:'manual',cgHeight:1262,cgOffset:offset,specLimitAngle:limit,palletWidth:r.preciseRequiredWidth});
    near(exact.criticalAngle,limit);
    const spec=compareSpecification({...DEFAULTS,mode:'manual',cgHeight:1262,cgOffset:offset,specLimitAngle:limit,palletWidth:r.preciseRequiredWidth});
    assert.equal(spec.status,'pass'); assert.equal(spec.passes,true); assert.equal(spec.margin,limit-DEFAULTS.tilt);
  }
});
test('20. invalid specification limits are rejected; supported endpoints remain finite',()=>{
  for(const limit of [0,60.1,NaN,Infinity])assert.throws(()=>calculate({...DEFAULTS,specLimitAngle:limit}),RangeError);
  for(const limit of [1,60])assert.ok(Number.isFinite(calculate({...DEFAULTS,specLimitAngle:limit}).preciseRequiredWidth));
  assert.equal(DEFAULTS.specLimitAngle,22);
});
test('21. using the specification limit as current tilt changes physical state independently',()=>{
  for(const limit of [20,22,25]){
    const parameters={...DEFAULTS,specLimitAngle:limit,tilt:limit};
    const r=calculate(parameters);
    assert.equal(r.stability,limit<r.criticalAngle?'stable':'exceeded');
    const spec=compareSpecification(parameters);
    assert.equal(spec.status,'boundary'); assert.equal(spec.passes,true); assert.equal(spec.margin,0);
  }
});
test('22. displayed angle comparison adds a decimal only when one decimal would hide the order',()=>{
  const critical=calculate(DEFAULTS).criticalAngle;
  assert.equal(formatAngleComparison(21.6,21.629),'21.60° < 21.63°');
  assert.equal(formatAngleComparison(21.6,critical),'21.60° < 21.63°');
  assert.equal(formatAngleComparison(21.96,22),'21.96° < 22.00°');
  assert.equal(formatAngleComparison(16,22),'16.0° < 22.0°');
  assert.equal(formatAngleComparison(22,critical),'22.0° > 21.6°');
  assert.equal(formatAngleComparison(critical,critical),'21.6° = 21.6°');
  assert.equal(formatAngleComparison(22,22),'22.0° = 22.0°');
  assert.equal(formatAngleComparison(29.9,22),'29.9° > 22.0°');
  assert.equal(formatAngleComparison(21.649,21.651),'21.6° < 21.7°');
  const typed=calculate({...DEFAULTS,tilt:21.6,specLimitAngle:21.6});
  assert.equal(typed.stability,'stable');
  assert.equal(formatAngleComparison(21.6,typed.criticalAngle),'21.60° < 21.63°');
  assert.equal(formatGap(typed.criticalAngle-21.6),'< 0.1');
  assert.deepEqual(formatHeadlineAngles([21.6,typed.criticalAngle,21.6]),['21.60','21.63','21.60']);
  assert.deepEqual(formatHeadlineAngles([16,critical,22]),['16.0','21.6','22.0']);
});
test('24. a nonzero gap below one tenth displays as less than 0.1°',()=>{
  assert.equal(formatGap(0.029),'< 0.1');
  assert.equal(formatGap(-0.029),'< 0.1');
  assert.equal(formatGap(0),'0.0');
  assert.equal(formatGap(5e-9),'0.0');
  assert.equal(formatGap(0.1),'0.1');
  assert.equal(formatGap(0.37),'0.4');
  assert.equal(formatGap(6),'6.0');
});
test('23. calculate() does not expose a critical-angle specification verdict',()=>{
  const r=calculate({...DEFAULTS,mode:'manual',cgHeight:1377,cgOffset:-100,tilt:16});
  assert.equal('margin' in r,false);
  assert.equal('specStatus' in r,false);
  assert.equal('meetsRequirement' in r,false);
  assert.equal(compareSpecification({...DEFAULTS,mode:'manual',cgHeight:1377,cgOffset:-100,tilt:16}).passes,true);
});
