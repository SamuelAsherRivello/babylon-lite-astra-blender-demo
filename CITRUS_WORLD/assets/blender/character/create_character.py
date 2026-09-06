"""Rebuild C003 with Blender --background --factory-startup --python this_file.

All deliverables are relative to this script. No network, add-ons or reference
images are needed. Blender authoring front is -Y; glTF export front is +Z.
"""
from pathlib import Path
import json
import math
import random
import struct

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
GLB = ROOT / 'public/assets/character/character.glb'
random.seed(3003)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                   bpy.data.armatures, bpy.data.actions):
    for block in list(datablocks):
        if block.users == 0:
            datablocks.remove(block)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 61
parts = []


def material(name, color, roughness=.52):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    return m


orange = material('Mandarin | warm orange', (1.0, .285, .025))
ivory = material('Eyes | warm ivory', (.98, .94, .79), .35)
dark = material('Face | espresso', (.045, .017, .012), .42)
shine = material('Eyes | catchlight', (1, 1, .98), .3)
freckle = material('Freckles | burnt orange', (.59, .105, .013))
red = material('Boots | vermilion', (.7, .028, .025), .34)
sole = material('Boots | wine sole', (.22, .014, .018), .65)
trim = material('Boots | warm stitching', (1, .35, .13))
brown = material('Stem | cinnamon', (.26, .10, .029))
green = material('Leaf | fresh green', (.16, .43, .035))
vein = material('Leaf | lime ridge', (.37, .62, .065))


def finish(obj, name, mat, bone='Body', smooth=True):
    obj.name = name
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
    parts.append(obj)
    return obj


def ellipsoid(name, loc, scale, mat, bone='Body', segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    return finish(obj, name, mat, bone)


def rounded_box(name, loc, scale, bevel, mat, bone):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new('Soft boot edges', 'BEVEL')
    mod.width = bevel
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(obj, name, mat, bone)


def tube(name, points, radius, mat, bone='Body'):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 8
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = 'AUTO'
        p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object, name, mat, bone)


body = ellipsoid('Mandarin body', (0, 0, .535), (.345, .295, .315), orange,
                 segments=40, rings=24)
# Subtle longitudinal lobes keep the silhouette fruit-like without heavy detail.
for vertex in body.data.vertices:
    phi = math.atan2(vertex.co.y, vertex.co.x)
    factor = 1 + .012 * math.cos(10 * phi)
    vertex.co.x *= factor
    vertex.co.y *= factor

for side, x in (('L', -.142), ('R', .142)):
    bone = 'Boot.' + side
    rounded_box('Sole.' + side, (x, -.033, .024), (.226, .31, .048), .022, sole, bone)
    rounded_box('Toe.' + side, (x, -.047, .102), (.224, .302, .178), .077, red, bone)
    ellipsoid('Cuff.' + side, (x, .015, .206), (.119, .112, .049), red, bone)
    tube('Cuff piping.' + side,
         [(x-.085, -.073, .215), (x, -.101, .215), (x+.085, -.073, .215)],
         .007, trim, bone)
    # Tiny contrasting pull tabs are readable from the rear as well.
    rounded_box('Pull tab.' + side, (x, .098, .222), (.04, .025, .07), .011, sole, bone)

for side, x in (('L', -.105), ('R', .105)):
    ellipsoid('Eye white.' + side, (x, -.275, .622), (.108, .045, .123), ivory)
    ellipsoid('Pupil.' + side, (x+.009, -.318, .627), (.050, .023, .075), dark)
    ellipsoid('Glint.' + side, (x-.004, -.339, .654), (.014, .007, .019), shine,
              segments=12, rings=8)
    tube('Brow.' + side,
         [(x-.078, -.262, .755), (x-.010, -.280, .778), (x+.065, -.267, .755)],
         .016, dark)

for sign in (-1, 1):
    for index, (x, z, radius) in enumerate(((.206, .521, .010), (.229, .494, .012),
                                         (.199, .473, .009), (.25, .523, .009))):
        y = -.295 * math.sqrt(max(.01, 1-(x/.345)**2-((z-.535)/.315)**2))
        ellipsoid('Freckle.%s.%s' % (sign, index), (sign*x, y-.006, z),
                  (radius, .007, radius), freckle, segments=12, rings=8)
tube('Little smile', [(-.057, -.292, .479), (0, -.299, .46), (.057, -.292, .479)],
     .009, dark)
ellipsoid('Nose', (0, -.308, .534), (.024, .016, .022), freckle,
          segments=16, rings=10)
tube('Stem', [(0, 0, .824), (-.014, .0, .883), (-.029, .005, .942)], .024, brown)

# A folded, asymmetric leaf: upper/lower triangles form a real closed volume.
leaf_vertices = [(.005, 0, .89), (.137, -.066, .97), (.29, .012, 1.022),
                 (.147, .086, .988), (.148, .003, 1.012), (.148, .004, .982)]
leaf_faces = [(0,1,4), (1,2,4), (2,3,4), (3,0,4),
              (1,0,5), (2,1,5), (3,2,5), (0,3,5)]
mesh = bpy.data.meshes.new('Folded leaf')
mesh.from_pydata(leaf_vertices, [], leaf_faces)
mesh.update()
leaf = bpy.data.objects.new('Leaf', mesh)
scene.collection.objects.link(leaf)
bpy.ops.object.select_all(action='DESELECT')
leaf.select_set(True)
finish(leaf, 'Leaf', green, 'Leaf', False)
tube('Leaf ridge', [(.01, -.002, .896), (.148, .003, 1.014), (.282, .012, 1.023)],
     .004, vein, 'Leaf')

# Combine parts into one skinned mesh; one primitive per material.
component_names = [obj.name for obj in parts]
bpy.ops.object.select_all(action='DESELECT')
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
character = bpy.context.object
character.name = 'OrangeCharacter'
scene.cursor.location = (0, 0, 0)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

armature = bpy.data.armatures.new('OrangeRig')
rig = bpy.data.objects.new('CharacterRoot', armature)
scene.collection.objects.link(rig)
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
for name, head, tail, parent in (
    ('Root', (0,0,0), (0,0,.1), None),
    ('Body', (0,0,.535), (0,0,.735), 'Root'),
    ('Boot.L', (-.142,0,0), (-.142,0,.2), 'Root'),
    ('Boot.R', (.142,0,0), (.142,0,.2), 'Root'),
    ('Leaf', (.005,0,.89), (.148,0,1.014), 'Body')):
    bone = armature.edit_bones.new(name)
    bone.head, bone.tail = head, tail
    if parent:
        bone.parent = armature.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
character.parent = rig
modifier = character.modifiers.new('Rigid character skin', 'ARMATURE')
modifier.object = rig
rig.animation_data_create()

for name, frames in (('Idle', 60), ('Walk', 24)):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data.action = action
    for frame in range(frames+1):
        phase = frame / frames * math.tau
        for bone in rig.pose.bones:
            bone.location = (0,0,0)
            bone.rotation_mode = 'XYZ'
            bone.rotation_euler = (0,0,0)
            bone.scale = (1,1,1)
        body_pose = rig.pose.bones['Body']
        # Pose-bone coordinates follow their local axes, so convert world offsets.
        def offset(bone_name, vector):
            p = rig.pose.bones[bone_name]
            p.location = p.bone.matrix_local.to_3x3().inverted() @ Vector(vector)
        if name == 'Idle':
            breath = .5 - .5 * math.cos(phase)
            offset('Body', (0,0,.007*breath))
            body_pose.scale = (1+.008*breath,)*3
            rig.pose.bones['Leaf'].rotation_euler.x = .06*math.sin(phase)
        else:
            offset('Body', (.009*math.sin(phase), 0, .012*(1-math.cos(2*phase))))
            body_pose.rotation_euler.y = .035*math.sin(phase)
            for side, shift in (('L', 0), ('R', math.pi)):
                p = phase+shift
                offset('Boot.'+side, (0, .061*math.cos(p), .06*max(0, math.sin(p))))
            rig.pose.bones['Leaf'].rotation_euler.x = .09*math.sin(phase)
        for bone in rig.pose.bones:
            if bone.name != 'Root':
                for prop in ('location', 'rotation_euler', 'scale'):
                    bone.keyframe_insert(data_path=prop, frame=frame+1, group=bone.name)
    # Sampled linear keys make the loop predictable with no Bezier overshoot.
    for layer in action.layers:
        for strip in layer.strips:
            for slot in action.slots:
                bag = strip.channelbag(slot)
                if bag:
                    for fc in bag.fcurves:
                        for key in fc.keyframe_points:
                            key.interpolation = 'LINEAR'


def verify_scene():
    evidence = {}
    for name, count in (('Idle', 60), ('Walk', 24)):
        rig.animation_data.action = bpy.data.actions[name]
        samples = []
        min_z = 100
        for frame in range(1, count+2):
            scene.frame_set(frame)
            evaluated = character.evaluated_get(bpy.context.evaluated_depsgraph_get())
            positions = [evaluated.matrix_world @ v.co for v in evaluated.data.vertices]
            min_z = min(min_z, min(v.z for v in positions))
            if frame in (1, count//4+1, count//2+1, count+1):
                samples.append([[float(c) for c in v] for v in positions])
            assert rig.location.length < 1e-8
            assert rig.pose.bones['Root'].location.length < 1e-8
        loop_error = max((Vector(a)-Vector(b)).length for a,b in zip(samples[0],samples[-1]))
        motion = max((Vector(a)-Vector(b)).length for a,b in zip(samples[0],samples[1]))
        assert loop_error < 1e-6, (name, loop_error)
        assert motion > .003, (name, motion)
        assert min_z > -1e-5, (name, min_z)
        evidence[name] = {'seconds': count/30, 'samples': count+1,
                          'loopMaxErrorMeters': loop_error,
                          'quarterCycleMotionMeters': motion, 'minimumGroundMeters': min_z}
    rig.animation_data.action = bpy.data.actions['Idle']
    scene.frame_set(1)
    return evidence


evidence = verify_scene()
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
character.select_set(True)
bpy.context.view_layer.objects.active = rig
GLB.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
                          export_yup=True, export_animations=True,
                          export_animation_mode='ACTIONS', export_frame_range=False,
                          export_force_sampling=True, export_skins=True,
                          export_anim_slide_to_zero=True,
                          export_cameras=False, export_lights=False)
raw = GLB.read_bytes()
json_length = struct.unpack_from('<I', raw, 12)[0]
gltf = json.loads(raw[20:20+json_length])
assert sorted(a['name'] for a in gltf['animations']) == ['Idle', 'Walk']
assert not gltf.get('images')
assert not any('uri' in b for b in gltf['buffers'])
for animation in gltf['animations']:
    for channel in animation['channels']:
        node = gltf['nodes'][channel['target']['node']]
        if node['name'] not in ('Root', 'CharacterRoot'):
            continue
        sampler = animation['samplers'][channel['sampler']]
        accessor = gltf['accessors'][sampler['output']]
        view = gltf['bufferViews'][accessor['bufferView']]
        components = {'VEC3': 3, 'VEC4': 4}[accessor['type']]
        assert accessor['componentType'] == 5126
        start = 20+json_length+8+view.get('byteOffset', 0)+accessor.get('byteOffset', 0)
        expected = {'translation': (0,0,0), 'rotation': (0,0,0,1),
                    'scale': (1,1,1)}[channel['target']['path']]
        for i in range(accessor['count']):
            values = struct.unpack_from('<'+'f'*components, raw,
                                        start+i*view.get('byteStride', components*4))
            assert max(abs(a-b) for a,b in zip(values,expected)) < 1e-6, values

# Preview staging is excluded from the exported selection.
floor = material('Preview | pistachio', (.48, .59, .38), .85)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.002))
bpy.context.object.name = 'PreviewGround (not exported)'
bpy.context.object.data.materials.append(floor)
world = bpy.data.worlds.new('Warm studio')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.64,.72,.83,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .35


def aim(obj, point):
    obj.rotation_euler = (Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()


for name, position, energy, size, color in (
    ('Key softbox', (-2,-3,4), 300, 3, (1,.84,.65)),
    ('Fill softbox', (2,-1,2), 100, 2.5, (.72,.85,1)),
    ('Leaf rim', (1,2,3), 220, 2, (1,.96,.77))):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size, data.color = energy, 'DISK', size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, (0,0,.5))
data = bpy.data.cameras.new('PreviewCamera')
camera = bpy.data.objects.new('PreviewCamera', data)
scene.collection.objects.link(camera)
camera.location = (1.05,-3.3,1.65)
aim(camera, (0,0,.52))
data.type = 'ORTHO'
data.ortho_scale = 1.42
scene.camera = camera
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(HERE / 'preview.png')
bpy.ops.object.select_all(action='DESELECT')
character.select_set(True)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'character.blend'))
bpy.ops.render.render(write_still=True)
bpy.ops.wm.open_mainfile(filepath=str(HERE / 'character.blend'))
rig = bpy.data.objects['CharacterRoot']
character = bpy.data.objects['OrangeCharacter']
scene = bpy.context.scene
reopened = verify_scene()
assert evidence == reopened
positions = [character.matrix_world @ v.co for v in character.data.vertices]
bounds = {'min': [min(v[i] for v in positions) for i in range(3)],
          'max': [max(v[i] for v in positions) for i in range(3)]}
character.data.calc_loop_triangles()
report = {'blender': bpy.app.version_string, 'mesh': character.name,
          'rig': rig.name, 'components': component_names,
          'vertices': len(character.data.vertices),
          'triangles': len(character.data.loop_triangles),
          'materials': len(character.data.materials), 'blenderBounds': bounds,
          'animations': evidence, 'blendReopened': True,
          'glbBytes': len(raw), 'glbAnimationNames': [a['name'] for a in gltf['animations']]}
(HERE / 'verification.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print('C003_VERIFIED ' + json.dumps(report))
