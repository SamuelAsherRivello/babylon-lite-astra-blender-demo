"""Independent Blender reopen/import and radius-aware navigation checks."""
import bpy
import json
import math
import struct
from pathlib import Path
from collections import deque
from mathutils import Vector

HERE=Path(__file__).resolve().parent
OUT=HERE.parents[2]/'public/assets/world'
nav=json.loads((OUT/'world.navigation.json').read_text())
assert set(nav)=={'version','groundY','bounds','walkablePolygon','spawn','characterRadius','obstacles'}
assert nav['version']==1 and nav['groundY']==0 and nav['characterRadius']==.25
poly=nav['walkablePolygon']; radius=nav['characterRadius']
assert len(poly)>=3 and len({tuple(v) for v in poly})==len(poly)
def cross(a,b,c):
    return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
for i,a in enumerate(poly):
    b=poly[(i+1)%len(poly)]
    assert cross(a,b,poly[(i+2)%len(poly)])>0, 'Perimeter must remain convex and consistently ordered'
    assert nav['bounds']['minX']<=a[0]<=nav['bounds']['maxX']
    assert nav['bounds']['minZ']<=a[1]<=nav['bounds']['maxZ']

def safe(x,z):
    for i,a in enumerate(poly):
        b=poly[(i+1)%len(poly)]
        if cross(a,b,(x,z))/math.dist(a,b)<radius-1e-8: return False
    for o in nav['obstacles']:
        if o['type']=='circle':
            if math.hypot(x-o['x'],z-o['z'])<o['radius']+radius-1e-8: return False
        elif o['type']=='box':
            qx=max(o['minX'],min(x,o['maxX'])); qz=max(o['minZ'],min(z,o['maxZ']))
            if math.hypot(x-qx,z-qz)<radius-1e-8: return False
        else: raise AssertionError('Unknown obstacle')
    return True

assert safe(nav['spawn']['x'],nav['spawn']['z']), 'Spawn lacks radius clearance'
assert len({o['id'] for o in nav['obstacles']})==len(nav['obstacles'])
grid={(i,j) for i in range(-50,51) for j in range(-50,51) if safe(i/10,j/10)}
start=(round(nav['spawn']['x']*10),round(nav['spawn']['z']*10))
seen={start}; queue=deque([start])
while queue:
    i,j=queue.popleft()
    for di,dj in [(1,0),(-1,0),(0,1),(0,-1)]:
        q=(i+di,j+dj)
        if q in grid and q not in seen: seen.add(q); queue.append(q)
assert len(seen)==len(grid), f'Disconnected safe terrain: {len(grid)-len(seen)} samples'
for point in [(-1,1.4),(.6,1.4),(2,1.4),(-4,1.8),(2.0,3.0)]:
    assert safe(*point), f'Expected open route blocked: {point}'

bpy.ops.wm.open_mainfile(filepath=str(HERE/'world.blend'))
source=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert len(source)>300
assert bpy.context.scene.unit_settings.scale_length==1
source_vertices=[o.matrix_world@v.co for o in source for v in o.data.vertices]
source_bounds=[[min(v[i] for v in source_vertices),max(v[i] for v in source_vertices)] for i in range(3)]
ground=[o for o in source if o.name.startswith(('West bank flat grass','East bank flat grass','Bridge flush plank'))]
assert len(ground)==14
for o in ground:
    assert abs(max((o.matrix_world@v.co).z for v in o.data.vertices))<1e-5, o.name
# Check source ground support for every radius-safe navigation sample. Scene art
# above the ground is deliberately ignored: low flowers are decorative.
for i,j in grid:
    point=Vector((i/10,-j/10,.02)); supported=False
    for o in ground:
        inv=o.matrix_world.inverted()
        hit,loc,normal,face=o.ray_cast(inv@point,inv.to_3x3()@Vector((0,0,-1)),distance=.1)
        if hit and abs((o.matrix_world@loc).z)<.012:
            supported=True; break
    assert supported, f'Navigation has no ground support at {i/10},{j/10}'
water=bpy.data.objects['Stream turquoise ribbon']
foundation=bpy.data.objects['Grass foundation']
assert max((water.matrix_world@v.co).z for v in water.data.vertices)>max((foundation.matrix_world@v.co).z for v in foundation.data.vertices)

blob=(OUT/'world.glb').read_bytes()
magic,version,length=struct.unpack_from('<III',blob)
assert magic==0x46546c67 and version==2 and length==len(blob)
chunk_len,chunk_type=struct.unpack_from('<II',blob,12)
gltf=json.loads(blob[20:20+chunk_len])
assert chunk_type==0x4e4f534a
assert not any('uri' in b for b in gltf.get('buffers',[]))
assert not gltf.get('images') and not gltf.get('textures')
assert not gltf.get('animations') and not gltf.get('cameras')
triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives'])
assert triangles<60000 and len(blob)<8_000_000
assert all('pbrMetallicRoughness' in m for m in gltf['materials'])
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(OUT/'world.glb'))
imported=[o for o in bpy.context.scene.objects if o.type=='MESH']
vertices=[o.matrix_world@v.co for o in imported for v in o.data.vertices]
bounds=[[min(v[i] for v in vertices),max(v[i] for v in vertices)] for i in range(3)]
assert all(abs(source_bounds[i][j]-bounds[i][j])<1e-4 for i in range(3) for j in range(2)), 'Export changed coordinate bounds'
runtime_bounds=dict(x=bounds[0],y=bounds[2],z=[-bounds[1][1],-bounds[1][0]])
report=dict(blenderVersion=bpy.app.version_string,sourceMeshes=len(source),exportMeshes=len(imported),
    triangles=triangles,materials=len(gltf['materials']),glbBytes=len(blob),runtimeBounds=runtime_bounds,
    meshNames=[m['name'] for m in gltf['meshes']],navigationObstacles=len(nav['obstacles']),
    safeGridSamples=len(grid),reachableGridSamples=len(seen),gridSpacingMeters=.1,
    groundSupportSamples=len(grid),checks=['blend reopen','meter scale','flat ground and bridge',
    'ground support raycasts','visible stream above foundation','GLB header and embedded PBR',
    'triangle and file budget','GLB reimport bounds','convex simple perimeter',
    'spawn disk clearance','connected radius-inflated navigation','bridge route clearance'])
(HERE/'world.validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
