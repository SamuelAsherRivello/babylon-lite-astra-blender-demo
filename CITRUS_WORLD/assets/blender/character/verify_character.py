"""Independently sample glTF skinning in runtime coordinates, then render import.

Run with Blender --background --factory-startup --python-exit-code 1 --python
assets/blender/character/verify_character.py after create_character.py.
"""
from pathlib import Path
import bisect
import json
import struct

import bpy
from mathutils import Matrix, Quaternion, Vector

HERE = Path(__file__).resolve().parent
GLB = HERE.parents[2] / 'public/assets/character/character.glb'
raw = GLB.read_bytes()
magic, version, length = struct.unpack_from('<4sII', raw)
assert magic == b'glTF' and version == 2 and length == len(raw)
json_len, json_type = struct.unpack_from('<II', raw, 12)
assert json_type == 0x4E4F534A
g = json.loads(raw[20:20+json_len])
binary = raw[28+json_len:]
assert sorted(a['name'] for a in g['animations']) == ['Idle', 'Walk']
assert len(g['meshes']) == 1 and len(g['skins']) == 1


def accessor(index):
    a = g['accessors'][index]
    v = g['bufferViews'][a['bufferView']]
    count = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4, 'MAT4':16}[a['type']]
    code, size = {5121:('B',1), 5123:('H',2), 5125:('I',4), 5126:('f',4)}[a['componentType']]
    offset = v.get('byteOffset',0)+a.get('byteOffset',0)
    stride = v.get('byteStride',size*count)
    return [struct.unpack_from('<'+code*count,binary,offset+i*stride) for i in range(a['count'])]


parents = {child:parent for parent,n in enumerate(g['nodes']) for child in n.get('children',[])}
skin = g['skins'][0]
inverse = [Matrix([values[i:i+4] for i in range(0,16,4)]).transposed()
           for values in accessor(skin['inverseBindMatrices'])]
vertices = []
for primitive in g['meshes'][0]['primitives']:
    a = primitive['attributes']
    for pos, weights, joints in zip(accessor(a['POSITION']), accessor(a['WEIGHTS_0']),
                                   accessor(a['JOINTS_0'])):
        assert abs(sum(weights)-1) < 1e-5
        vertices.append((Vector((*pos,1)), weights, joints, primitive['material']))


def evaluate(animation=None, time=0):
    transforms = [{p:list(n.get(p,d)) for p,d in
                   (('translation',(0,0,0)),('rotation',(0,0,0,1)),('scale',(1,1,1)))}
                  for n in g['nodes']]
    if animation:
        for channel in animation['channels']:
            sampler = animation['samplers'][channel['sampler']]
            times = [v[0] for v in accessor(sampler['input'])]
            values = accessor(sampler['output'])
            i = max(0,min(len(times)-1,bisect.bisect_right(times,time)-1))
            value = values[i]
            if i+1 < len(times) and sampler.get('interpolation','LINEAR') != 'STEP':
                t = (time-times[i])/(times[i+1]-times[i])
                if channel['target']['path'] == 'rotation':
                    a,b = values[i], values[i+1]
                    q = Quaternion((a[3],*a[:3])).slerp(Quaternion((b[3],*b[:3])),t)
                    value = (*q[1:],q[0])
                else:
                    value = [a+(b-a)*t for a,b in zip(value,values[i+1])]
            transforms[channel['target']['node']][channel['target']['path']] = value
    cache = {}
    def world(i):
        if i not in cache:
            tr = transforms[i]
            r = tr['rotation']
            local = Matrix.LocRotScale(Vector(tr['translation']),
                                       Quaternion((r[3],*r[:3])),Vector(tr['scale']))
            cache[i] = world(parents[i]) @ local if i in parents else local
        return cache[i]
    matrices = [world(joint) @ bind for joint,bind in zip(skin['joints'],inverse)]
    result = []
    for pos,weights,joints,material in vertices:
        p = Vector((0,0,0,0))
        for w,j in zip(weights,joints):
            if w:
                p += (matrices[j] @ pos)*w
        result.append(p.to_3d())
    for i,n in enumerate(g['nodes']):
        if n['name'] in ('Root','CharacterRoot'):
            assert max(abs(world(i)[r][c]-(1 if r == c else 0))
                       for r in range(4) for c in range(4)) < 1e-6
    return result


def bounds(positions):
    return {'min':[min(p[i] for p in positions) for i in range(3)],
            'max':[max(p[i] for p in positions) for i in range(3)]}


rest = evaluate()
rest_bounds = bounds(rest)
assert abs(rest_bounds['min'][1]) < 1e-5
assert .95 < rest_bounds['max'][1] < 1.1
assert abs(rest_bounds['min'][0]+rest_bounds['max'][0]) < 1e-5
eye_material = next(i for i,m in enumerate(g['materials']) if m['name'].startswith('Eyes | warm'))
eye_positions = [p for p,v in zip(rest,vertices) if v[3] == eye_material]
face_forward = sum(p.z for p in eye_positions)/len(eye_positions)
assert face_forward > .25
evidence = {}
for animation in g['animations']:
    times = sorted(set(t[0] for s in animation['samplers'] for t in accessor(s['input'])))
    expected_duration = 2 if animation['name'] == 'Idle' else .8
    assert abs(times[-1]-times[0]-expected_duration) < 1e-5
    # Include half-frames to exercise glTF interpolation as well as exact keys.
    sample_times = sorted(set(times+[(a+b)/2 for a,b in zip(times,times[1:])]))
    minimum = 100
    start,end = evaluate(animation,times[0]),evaluate(animation,times[-1])
    error = max((a-b).length for a,b in zip(start,end))
    assert error < 1e-5
    for t in sample_times:
        minimum = min(minimum,min(v.y for v in evaluate(animation,t)))
    assert minimum > -1e-5
    motion = max((a-b).length for a,b in zip(start,evaluate(animation,expected_duration/4)))
    assert motion > .003
    evidence[animation['name']] = {'durationSeconds':times[-1]-times[0],
                                   'sampleCount':len(sample_times),'loopErrorMeters':error,
                                   'minimumGroundMeters':minimum,'motionMeters':motion}

report = {'runtimeBounds':rest_bounds,'frontEyeCentroidZ':face_forward,
          'rootIdentity':True,'animations':evidence,'selfContained':True}
assert all('uri' not in b for b in g['buffers']) and not g.get('images')
(HERE/'glb-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print('C003_GLB_VERIFIED '+json.dumps(report),flush=True)

# Keep studio setup, replace authored geometry with a fresh import of the GLB.
bpy.ops.wm.open_mainfile(filepath=str(HERE/'character.blend'))
for name in ('OrangeCharacter','CharacterRoot'):
    bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(GLB))
bpy.context.scene.frame_set(1)
bpy.context.scene.render.filepath = str(HERE/'preview-glb.png')
bpy.ops.render.render(write_still=True)
