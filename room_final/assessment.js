/* The student rubric and automatic assessment share these rules. */
(() => {
  const ENERGY_FULL_J=500000000,ENERGY_STEP_J=50000000;
  const ENERGY_BANDS = Array.from({length:45},(_,index)=>[ENERGY_FULL_J+index*ENERGY_STEP_J,45-index]).concat([[Infinity,0]]);
  const appliancePoints = count => Math.min(40,Math.round(Math.max(0,count)*40/15));
  const spacePoints = count => Math.min(7,Math.max(0,count));
  const footprints = {"led-vanity":[1.3,.82],"air-styler":[.86,.65],"star-light":[.64,.62],"switch-console":[.95,.62],"nintendo-handheld":[.78,.62],"racing-wheel":[1.1,1.2],"rc-car":[.85,.58],"vibration-joystick":[.9,.66],"desktop-pc":[1.5,.85],"gaming-pc":[1.65,.9],"hair-iron":[.85,.65],"robot-vacuum":[.75,.75],treadmill:[1.1,2.1],"large-fridge":[1.25,1.2],dryer:[1.05,1.05],"qled-tv":[1.8,.65],oven:[1.2,.95],bed:[1.98,2.95],desk:[2.12,.95],chair:[.78,.82],rug:[3.3,3.52],plant:[.8,.8],"side-table":[.9,.8],sofa:[2.7,1.15],bookshelf:[1.54,.56],mirror:[.95,.55],"lounge-chair":[1.22,1.15],"coffee-table":[1.43,.94],wardrobe:[1.57,.75],"shoe-rack":[1.23,.5],cushion:[1.02,1.02],fridge:[.72,.72],washer:[1.05,1.05],"led-lamp":[.5,.5],"bulb-lamp":[.5,.5],tv:[1.4,.55],ac:[1.6,1.24],massage:[1,1.5],microwave:[1,.8],fan:[.65,.65],laptop:[.65,.55],"rice-cooker":[.82,.66],"air-fryer":[.8,.67],induction:[1.1,.78],kettle:[.74,.74],"air-purifier":[.62,.62],dehumidifier:[.68,.55],vacuum:[.58,.57],"hair-dryer":[.83,.67]};
  const aliases = {led:'led-lamp',bulb:'bulb-lamp',rice:'rice-cooker',purifier:'air-purifier'};
  const referenceHours = p => Math.max(p.min || 0, 3, Math.ceil(p.h / 6) * 3);
  const rawEnergy = i => i.w * i.h * 3600;
  function evaluationEnergy(i, p) {
    if (!p || i.h <= 0) return 0;
    return Math.max(0,i.w) * Math.max(i.h,referenceHours(p)) * 3600;
  }
  function energyPoints(joules) { return ENERGY_BANDS.find(([limit]) => joules <= limit)[1]; }
  function colorFamily(hex) {
    if (!/^#[\da-f]{6}$/i.test(hex || '')) return null;
    const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
    if(max<=.2)return 'black';
    if(!d || d/max<.12)return max>=.85?'white':'gray';
    let h=max===rgb[0]?(rgb[1]-rgb[2])/d:max===rgb[1]?(rgb[2]-rgb[0])/d+2:(rgb[0]-rgb[1])/d+4;
    h=(h*60+360)%360;
    return 'hue-'+Math.floor(((h+15)%360)/30);
  }
  function roomDimensions(layout) { return layout==='wide'?[10,7]:layout==='long'?[7,10]:[8,8]; }
  function rectangle(o,dimensions) {
    const [width,depth]=dimensions,[bw,bd]=footprints[aliases[o.kind||o.id]||o.kind||o.id]||[.9,.9],angle=(o.r||0)*Math.PI/180;
    const w=Math.abs(Math.cos(angle))*bw+Math.abs(Math.sin(angle))*bd,d=Math.abs(Math.sin(angle))*bw+Math.abs(Math.cos(angle))*bd;
    // Match the room renderer's edge clamp and saved coordinate conversion.
    const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
    const x=clamp(((o.x+9.5)/100-.5)*width,-width/2+w/2+.01,width/2-w/2-.01);
    const z=clamp(((o.y+11)/100-.5)*depth,-depth/2+d/2+.01,depth/2-d/2-.01);
    return {id:o.id,x,z,left:x-w/2,right:x+w/2,front:z-d/2,back:z+d/2,area:w*d};
  }
  function worldPosition(o,layout){const r=rectangle(o,roomDimensions(layout));return {x:r.x,z:r.z}}
  function placeObject(o,layout,x,y){const [w,d]=roomDimensions(layout),r=rectangle({...o,x,y},[w,d]);return {x:(r.x/w+.5)*100-9.5,y:(r.z/d+.5)*100-11}}
  function assess(state,products) {
    const byId=new Map(products.map(p=>[p.id,p])),seen=new Set();
    const items=state.items.filter(i=>byId.has(i.id)&&!seen.has(i.id)&&(seen.add(i.id),true));
    const essentialIds=new Set();
    for(const group of [['fridge','large-fridge'],['washer'],['led','bulb']]){
      const representative=items.filter(i=>group.includes(i.id)).sort((a,b)=>rawEnergy(a)-rawEnergy(b)||a.id.localeCompare(b.id))[0];
      if(representative)essentialIds.add(representative.id);
    }
    const additionalCount=items.filter(i=>!essentialIds.has(i.id)&&i.h>=3).length;
    const applianceScore=appliancePoints(additionalCount);
    const assessedEnergyJ=items.reduce((n,i)=>n+evaluationEnergy(i,byId.get(i.id)),0);
    const energyScore=energyPoints(assessedEnergyJ);
    const purchasedIds=new Set(items.map(i=>i.id));
    const objects=state.objects.filter(o=>purchasedIds.has(o.id)&&byId.has(o.id));
    const families=new Set(objects.map(o=>colorFamily(o.color)).filter(Boolean));
    const colorScore=Math.min(8,families.size);
    const dimensions=roomDimensions(state.layout),rects=objects.filter(o=>o.id!=='rug').map(o=>rectangle(o,dimensions));
    const [w,d]=dimensions,zones=new Set(rects.map(r=>Math.min(2,Math.max(0,Math.floor((r.x/w+.5)*3)))+','+Math.min(2,Math.max(0,Math.floor((r.z/d+.5)*3)))));
    const spaceScore=spacePoints(zones.size);
    return {total:applianceScore+energyScore+colorScore+spaceScore,applianceScore,energyScore,colorScore,spaceScore,additionalCount,assessedEnergyJ,colorCount:families.size,zoneCount:zones.size};
  }
  window.RoomAssessment={assess,referenceHours,energyPoints,appliancePoints,spacePoints,energyBands:ENERGY_BANDS,colorFamily,roomDimensions,worldPosition,placeObject};
})();
