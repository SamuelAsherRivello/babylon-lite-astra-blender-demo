"""Rebuild the C002 village using Blender --background --factory-startup --python.

All placement arguments use runtime X/Z/height; p() maps to Blender Z-up.
Only glTF's standard export conversion maps the authored scene back to Y-up.
No reference images, external textures, add-ons or third-party Python packages.
"""
import bpy
import bmesh
import json
import math
import random
from pathlib import Path
from mathutils import Vector

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / 'public/assets/world'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(2206)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

def p(x, z, h):
    return (x, -z, h)

def material(name, hexcolor, roughness=.8, emission=0):
    rgb = [int(hexcolor[i:i+2], 16)/255 for i in (0, 2, 4)]
    # Palette is expressed in sRGB; node values are linear.
    rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*rgb, 1)
    bs.inputs['Roughness'].default_value = roughness
    if emission:
        bs.inputs['Emission Color'].default_value = (*rgb, 1)
        bs.inputs['Emission Strength'].default_value = emission
    return m

M = {k: material(k, v) for k, v in {
    'GrassSage':'B8CE88', 'GrassLight':'C8D999', 'GrassMoss':'A8C580',
    'SoilRose':'AA8178', 'SoilLight':'CAA492', 'CliffLavender':'8D8397',
    'CliffWarm':'B39EA5', 'CreamPlaster':'F5E1BA', 'IvoryTrim':'FFF0CF',
    'Timber':'99715F', 'TimberDark':'70535B', 'WoodHoney':'D8A779',
    'WoodLight':'EABD8C', 'RoofRose':'D97893', 'RoofBlush':'EE9DAE',
    'RoofPink':'E78EA6', 'RoofEdge':'BB657E', 'Mint':'94CDBE',
    'MintLight':'B4DED0', 'MintShade':'72B5AE', 'TowerLavender':'C6C4DE',
    'TowerShade':'B5B3D0', 'WindowBlue':'548D9D', 'WindowGlow':'FFD99B',
    'LeafSeafoam':'88BEB1', 'LeafPale':'AFD3B7', 'LeafDark':'689B96',
    'BlossomPink':'EAB3C4', 'BlossomLight':'F4CCD1', 'Rock':'B8B7C9',
    'RockLight':'D3CBD1', 'FlowerPink':'E789AE', 'FlowerWhite':'FFF2DB',
    'FlowerGold':'F7CB72', 'Stem':'698D69', 'Water':'7FC8D2',
    'WaterLight':'ABE3E3', 'Foam':'DBF3E6', 'Brass':'E4B870'
}.items()}

def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(M[mat])
    if bevel:
        mod = obj.modifiers.new('Soft crafted edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def box(name, x, z, h, sx, sz, sh, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p(x,z,h))
    obj = bpy.context.object
    obj.scale = (sx,sz,sh)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj,name,mat,bevel)

def mesh(name, vertices, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata([p(*v) for v in vertices], [], faces)
    data.update()
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat)

def cone(name,x,z,h,r1,r2,depth,mat,n=10):
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r1, radius2=r2,
                                  depth=depth, location=p(x,z,h))
    return finish(bpy.context.object,name,mat)

def ico(name,x,z,h,scale,mat,sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=p(x,z,h))
    obj=bpy.context.object
    obj.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat)

def beam(name,a,b,r,mat,n=8):
    pa,pb=Vector(p(*a)),Vector(p(*b))
    obj=cone(name,0,0,0,r,r,(pb-pa).length,mat,n)
    obj.location=(pa+pb)/2
    obj.rotation_euler=(pb-pa).to_track_quat('Z','Y').to_euler()
    return obj

def prism(name,poly,bottom,top,mat):
    n=len(poly)
    return mesh(name,[(x,z,h) for h in (bottom,top) for x,z in poly],
                [tuple(reversed(range(n))),tuple(range(n,2*n))]+
                [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat)

def arch(name,x,z,bottom,width,height,depth,mat):
    r=width/2
    spring=bottom+height-r
    poly=[(x-r,bottom),(x+r,bottom)]
    poly += [(x+r*math.cos(t*math.pi/12),spring+r*math.sin(t*math.pi/12)) for t in range(13)]
    n=len(poly)
    verts=[(px,zz,ph) for zz in (z-depth/2,z+depth/2) for px,ph in poly]
    return mesh(name,verts,[tuple(reversed(range(n))),tuple(range(n,2*n))]+
                [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],mat)

obstacles=[]
def obstacle_box(name,minx,maxx,minz,maxz):
    obstacles.append(dict(id=name,type='box',minX=minx,maxX=maxx,minZ=minz,maxZ=maxz))
def obstacle_circle(name,x,z,r):
    obstacles.append(dict(id=name,type='circle',x=x,z=z,radius=r))

# Floating land: a chamfered square, colored strata and tapered faceted underside.
perimeter=[(-4.25,-5),(4.25,-5),(5,-4.25),(5,4.25),(4.25,5),(-4.25,5),(-5,4.25),(-5,-4.25)]
prism('Island lower stone ledge',[(x*.96,z*.96) for x,z in perimeter],-1.25,-.9,'CliffLavender')
prism('Island ochre earth',perimeter,-.97,-.18,'SoilRose')
prism('Island pale sediment stripe',[(x*1.005,z*1.005) for x,z in perimeter],-.79,-.68,'SoilLight')
prism('Grass foundation',perimeter,-.2,-.10,'GrassMoss')
for i,(x,z) in enumerate(perimeter):
    nx,nz=perimeter[(i+1)%len(perimeter)]
    mesh('Floating cliff facet %02d'%i,[(x*.96,z*.96,-1.25),(nx*.96,nz*.96,-1.25),
         (nx*.69,nz*.69,-2.05),(x*.69,z*.69,-2.05)],[(0,1,2,3)],'CliffWarm' if i%2 else 'CliffLavender')
prism('Underside cap',[(x*.69,z*.69) for x,z in perimeter],-2.06,-2.04,'CliffLavender')
# Bank tiles share an exactly flat top; their tiny bevels sit below the walking plane.
left=[(-4.25,-5),(.05,-5),(.05,5),(-4.25,5),(-5,4.25),(-5,-4.25)]
right=[(1.15,-5),(4.25,-5),(5,-4.25),(5,4.25),(4.25,5),(1.15,5)]
prism('West bank flat grass',left,-.12,0,'GrassLight')
prism('East bank flat grass',right,-.12,0,'GrassSage')
for z in [-2.8,-.2,2.5]:
    box('West lawn tile seam',-2.48,z,.001,4.99,.024,.002,'GrassSage')
    box('East lawn tile seam',3.06,z,.001,3.78,.024,.002,'GrassMoss')
# Stream below ground, silver dashes and two full-height falls at the exposed edges.
box('Stream turquoise ribbon',.6,0,-.13,1.1,10.03,.1,'Water',.035)
for k in range(27):
    x=random.uniform(.22,1.0); z=random.uniform(-4.85,4.9)
    box('Stream current glint',x,z,-.074,random.uniform(.016,.032),random.uniform(.13,.48),.003,'WaterLight',.002)
for z,sgn in [(5.025,1),(-5.025,-1)]:
    box('Waterfall broad curtain',.6,z,-.86,1.07,.075,1.48,'Water',.025)
    for k in range(6):
        box('Waterfall bright ribbon',.14+k*.18,z+sgn*.044,-.9+random.uniform(-.1,.1),.05,.014,1.36,'WaterLight',.006)
    for k in range(7):
        ico('Waterfall foam',.11+k*.16,z,-1.57,(.13,.12,.085),'Foam')
obstacle_box('stream-north',.05,1.15,-5,.45)
obstacle_box('stream-south',.05,1.15,2.35,5)

# Cottage: timber-trimmed plaster, front gable, individual overlapping pink roof panels.
cx,cz=-2.15,-1.95
box('Cottage lavender foundation',cx,cz,.12,2.9,2.8,.24,'Rock',.06)
box('Cottage cream walls',cx,cz,1.27,2.72,2.6,2.3,'CreamPlaster',.045)
for z in [-3.25,-.65]:
    mesh('Cottage plaster gable',[(cx-1.36,z,2.42),(cx+1.36,z,2.42),(cx,z,3.93)],[(0,1,2)],'CreamPlaster')
    beam('Gable left timber',(cx-1.4,z,2.4),(cx,z,3.97),.065,'Timber',4)
    beam('Gable right timber',(cx,z,3.97),(cx+1.4,z,2.4),.065,'Timber',4)
for x in [cx-1.36,cx+1.36]:
    for z in [-3.25,-.65]:
        box('Cottage corner timber',x,z,1.28,.11,.11,2.48,'Timber',.014)
    box('Cottage side sill',x,cz,.35,.12,2.65,.14,'WoodHoney',.015)
box('Cottage front lintel',cx,-.575,2.4,2.85,.13,.13,'Timber',.014)
for side in [-1,1]:
    for row in range(4):
        t0=row/4; t1=(row+1)/4+.016
        x0=cx+side*1.63*t0; x1=cx+side*1.63*t1
        h0=4.04-1.73*t0; h1=4.04-1.73*t1
        for col in range(7):
            z0=-3.55+col*.455; z1=z0+.441
            obj=mesh('Pink roof shingle %s %s %s'%(side,row,col),
                [(x0,z0,h0),(x1,z0,h1),(x1,z1,h1),(x0,z1,h0)],[(0,1,2,3)],
                ['RoofRose','RoofBlush','RoofPink'][(col+row*2)%3])
            mod=obj.modifiers.new('Tile thickness','SOLIDIFY'); mod.thickness=.06
            bpy.context.view_layer.objects.active=obj; bpy.ops.object.modifier_apply(modifier=mod.name)
    beam('Rose eave fascia',(cx+side*1.64,-3.62,2.28),(cx+side*1.64,-.26,2.28),.085,'RoofEdge',4)
for z in [-3.59,-.3]:
    for side in [-1,1]:
        beam('Gable rose fascia',(cx,z,4.075),(cx+side*1.68,z,2.29),.095,'RoofEdge',4)
for i in range(8):
    beam('Rounded ridge cap',(cx,-3.62+i*.43,4.07),(cx,-3.22+i*.43,4.07),.12,'RoofBlush')
box('Chimney shaft',-1.48,-2.72,3.84,.42,.43,1.07,'TowerLavender',.035)
box('Chimney rim',-1.48,-2.72,4.37,.56,.56,.15,'IvoryTrim',.025)
box('Chimney dark inset',-1.48,-2.72,4.452,.33,.33,.012,'TimberDark')
emitter=bpy.data.objects.new('VFX_Chimney',None)
bpy.context.collection.objects.link(emitter)
emitter.location=p(-1.48,-2.72,4.458)
for h in [3.52,3.82,4.12]:
    box('Chimney masonry accent',-1.7,-2.63,h,.018,.2,.085,'IvoryTrim',.01)
# Arched mint door and little sunset window.
arch('Door sandstone arch',-2.48,-.555,.05,1.16,1.89,.16,'WoodHoney')
arch('Door deep jamb',-2.48,-.455,.055,.93,1.67,.1,'TimberDark')
arch('Door mint leaf',-2.48,-.385,.055,.8,1.58,.06,'MintShade')
for x in [-2.74,-2.48,-2.22]:
    box('Door vertical panel',x,-.346,.68,.018,.012,1.15,'Mint')
for h in [.46,1.13]:
    box('Door iron strap',-2.48,-.325,h,.78,.04,.055,'IvoryTrim',.01)
ico('Door brass handle',-2.23,-.277,.84,(.067,.046,.067),'Brass',2)
arch('Front window frame',-1.27,-.56,.63,.7,1.18,.16,'WoodHoney')
arch('Front window warm glass',-1.27,-.458,.72,.49,.96,.045,'WindowGlow')
box('Front window mullion',-1.27,-.416,1.15,.05,.04,.83,'IvoryTrim')
box('Front window crossbar',-1.27,-.414,1.15,.54,.04,.05,'IvoryTrim')
# Circular attic window faces +runtime Z.
o=cone('Round attic timber frame',cx,-.57,3.03,.3,.3,.12,'WoodHoney',16); o.rotation_euler[0]=math.pi/2
o=cone('Round attic golden glass',cx,-.493,3.03,.22,.22,.04,'WindowGlow',16); o.rotation_euler[0]=math.pi/2
box('Attic window mullion',cx,-.459,3.03,.045,.035,.44,'IvoryTrim')
box('Attic window crossbar',cx,-.459,3.03,.44,.035,.045,'IvoryTrim')
# East-facing bay window with shutters and planter.
box('Bay window wooden surround',-.743,-1.97,1.38,.17,1.32,1.25,'WoodHoney',.025)
box('Bay window blue glass',-.646,-1.97,1.4,.04,1.09,1.04,'WindowBlue')
for z in [-2.54,-1.97,-1.4]:
    box('Bay window vertical frame',-.61,z,1.4,.055,.06,1.16,'IvoryTrim')
box('Bay window cross frame',-.607,-1.97,1.43,.06,1.18,.06,'IvoryTrim')
for z in [-2.85,-1.1]:
    box('Bay mint shutter',-.68,z,1.42,.12,.37,1.15,'MintShade',.025)
    for h in [1.1,1.4,1.7]:
        box('Shutter slat',-.605,z,h,.025,.31,.035,'MintLight')
box('Window flower box',-.53,-1.97,.68,.42,1.5,.27,'WoodHoney',.035)
box('Planter soil',-.53,-1.97,.825,.31,1.38,.035,'TimberDark')
for i in range(7):
    ico('Planter foliage',-.5,-2.57+i*.2,.91,(.16,.14,.16),'LeafSeafoam')
    ico('Planter marigold',-.48,-2.57+i*.2,1.05,(.077,.077,.077),'FlowerGold')
obstacle_box('cottage',-3.65,-.28,-3.43,-.23)

# Lavender octagonal tower with layered mint conical roof and pennant.
tx,tz=2.9,-2.35
cone('Tower chamfered plinth',tx,tz,.14,1.06,1.06,.28,'IvoryTrim',8)
cone('Tower lavender body',tx,tz,1.61,.92,.92,2.94,'TowerLavender',8)
for h in [.38,1.13,2.08,2.93]:
    cone('Tower stone belt',tx,tz,h,.955,.955,.095,'IvoryTrim',8)
for row,h in enumerate([.7,1.58,2.49]):
    for j in range(8):
        a=(j+(row%2)*.5)*math.tau/8
        x,z=tx+.92*math.cos(a),tz+.92*math.sin(a)
        box('Tower block joint',x,z,h,.024,.025,.53,'TowerShade')
for h,r1,r2,depth,col in [(3.18,1.27,.92,.52,'MintShade'),(3.63,1.03,.63,.52,'Mint'),(4.06,.75,.3,.54,'MintLight'),(4.48,.39,.025,.48,'Mint')]:
    cone('Tower mint roof tier',tx,tz,h,r1,r2,depth,col,8)
arch('Tower front ivory portal',tx,tz+.89,.025,.85,1.45,.18,'IvoryTrim')
arch('Tower front timber door',tx,tz+1.002,.025,.62,1.22,.06,'WoodHoney')
for dx in [-.17,0,.17]:
    box('Tower door plank',tx+dx,tz+1.04,.49,.021,.014,.85,'Timber')
ico('Tower door knob',tx+.18,tz+1.085,.63,(.05,.04,.05),'Brass',2)
arch('Tower upper front window',tx,tz+.9,2.2,.59,.71,.14,'IvoryTrim')
arch('Tower upper front glass',tx,tz+.989,2.26,.39,.56,.045,'WindowBlue')
box('Tower window mullion',tx,tz+1.02,2.48,.04,.03,.46,'IvoryTrim')
box('Tower east window frame',tx+.893,tz,2.48,.16,.57,.7,'IvoryTrim',.035)
box('Tower east blue glass',tx+.99,tz,2.48,.035,.38,.49,'WindowBlue',.02)
box('Tower east mullion',tx+1.014,tz,2.48,.025,.045,.51,'IvoryTrim')
beam('Tower finial pole',(tx,tz,4.65),(tx,tz,5.2),.026,'Brass')
ico('Tower finial ball',tx,tz,4.85,(.09,.09,.09),'Brass',2)
mesh('Tower coral pennant',[(tx,tz,5.15),(tx+.65,tz,4.94),(tx,tz,4.83)],[(0,1,2)],'RoofBlush')
obstacle_circle('tower',tx,tz,1.09)

# Bridge: full width planks top at zero, side rails outside the walk corridor.
for i in range(12):
    # End exactly at the banks: overlapping coplanar grass causes black artifacts.
    box('Bridge flush plank %02d'%i,.05+(i+.5)*1.1/12,1.4,-.075,1.1/12,1.9,.15,
        'WoodLight' if i%3==0 else 'WoodHoney',.003)
for z in [.49,2.31]:
    box('Bridge underbeam',.6,z,-.22,2.06,.11,.17,'TimberDark',.018)
    for x in [-.3,.6,1.5]:
        box('Bridge square post',x,z,.34,.11,.11,.86,'Timber',.012)
        ico('Bridge post cap',x,z,.82,(.095,.095,.067),'WoodLight')
    beam('Bridge handrail',(-.36,z,.71),(1.56,z,.71),.055,'WoodLight')
    obstacle_box('bridge-rail-'+str(z),-.39,1.59,z-.085,z+.085)

# Flush stepping-stone inlays approach the door and bridge without adding stairs.
for i,(x,z) in enumerate([(-2.49,-.03),(-2.4,.39),(-2.13,.81),(-1.63,1.17),(-1.07,1.4),
                         (1.96,1.39),(2.43,1.05),(2.83,.57),(2.9,.01),(2.9,-.57)]):
    o=cone('Path inset %02d'%i,x,z,-.015,.23,.23,.036,'RockLight',7)
    o.scale.y=.79

def tree(name,x,z,size=1,pink=False):
    beam(name+' trunk',(x,z,0),(x+.06,z,1.35*size),.105*size,'Timber')
    for dx,dz in [(-.36,.04),(.32,.12),(.1,-.31)]:
        beam(name+' branch',(x,z,.74*size),(x+dx*size,z+dz*size,1.51*size),.047*size,'Timber')
    for i,(dx,dz,h,s) in enumerate([(-.35,.03,1.72,.67),(.3,.08,1.83,.7),(.04,-.29,2.04,.65),(0,.12,2.31,.54)]):
        col=['BlossomPink','BlossomLight'][i%2] if pink else ['LeafSeafoam','LeafPale','LeafDark'][i%3]
        crown=ico(name+' faceted crown',x+dx*size,z+dz*size,h*size,(s*size,s*size,s*size),col,2)
        crown['vfx_binding']='VFX_Foliage_'+name.replace(' ','_')+'_'+str(i)
    obstacle_circle(name,x,z,.22*size)

tree('Blossom tree',-4.02,-3.92,1.22,True)
tree('Front west pear tree',-3.72,3.18,.85)
tree('Front east pear tree',3.8,3.25,.84)
def pine(name,x,z,s):
    cone(name+' trunk',x,z,.25*s,.1*s,.09*s,.5*s,'Timber')
    for i,(h,r) in enumerate([(.68,.59),(1.12,.47),(1.52,.32)]):
        tier=cone(name+' tier',x,z,h*s,r*s,0,.91*s,'MintShade' if h==.68 else 'MintLight',7)
        tier['vfx_binding']='VFX_Foliage_'+name.replace(' ','_')+'_'+str(i)
    obstacle_circle(name,x,z,.4*s)
pine('East spruce',4.16,.01,.93)
pine('West spruce',-4.1,.7,.77)
pine('Rear spruce',4.02,-4.07,.81)

# Rocks occupy small explicit collider circles; flower clusters remain decorative.
for i,(x,z,s) in enumerate([(-4.35,1.25,.32),(-3.2,4.26,.31),(2.57,4.05,.36),(4.31,1.63,.31),
                            (-1.02,4.16,.25),(-4.6,-2.12,.18),(1.85,-4.2,.25)]):
    ico('Landscape rock %02d'%i,x,z,s*.49,(s,s*.74,s*.75),'Rock' if i%2 else 'RockLight')
    obstacle_circle('rock-%02d'%i,x,z,s)
    ico('Rock companion',x+s*.72,z+.12,.1,(.14,.11,.14),'LeafDark')
for i in range(28):
    t=i/28*math.tau
    x,z=4.75*math.cos(t),4.75*math.sin(t)
    if .0<x<1.25: continue
    ico('Embedded cliff pebble',x,z,-.42,(.18,.08,.13),'RockLight')

def flower(x,z,h,col):
    beam('Flower stem',(x,z,0),(x,z,h),.013,'Stem',5)
    ico('Flower leaf',x+.05,z,h*.43,(.085,.03,.045),'LeafDark')
    for k in range(5):
        a=k*math.tau/5
        ico('Flower petal',x+.048*math.cos(a),z+.048*math.sin(a),h,(.052,.052,.024),col)
    ico('Flower heart',x,z,h+.022,(.027,.027,.018),'FlowerGold')
for idx,(x,z) in enumerate([(-4.3,2.1),(-2.9,3.65),(-.8,3.75),(1.6,3.8),(3.3,4.32),(4.23,2.6),
                            (3.88,.89),(-3.91,.84),(-3.99,-1.2),(1.7,-3.88)]):
    for j in range(3):
        flower(x+random.uniform(-.16,.16),z+random.uniform(-.16,.16),random.uniform(.16,.28),
               ['FlowerWhite','FlowerPink','FlowerGold'][(idx+j)%3])
for i,(x,z) in enumerate([(-3.88,3.92),(3.62,1.9),(-4.37,.53)]):
    for dx,s in [(0,1),(.19,.65)]:
        cone('Mushroom ivory stalk',x+dx,z,.095*s,.045*s,.035*s,.19*s,'IvoryTrim')
        cone('Mushroom pink cap',x+dx,z,.21*s,.14*s,.025*s,.14*s,'RoofBlush')

# Small cottage lantern attached within the building collision footprint.
box('Cottage lantern bracket',-3.33,-.48,1.75,.06,.36,.065,'TimberDark')
box('Lantern warm pane',-3.33,-.3,1.49,.19,.17,.3,'WindowGlow',.015)
for x in [-3.44,-3.22]:
    box('Lantern upright',x,-.2,1.49,.025,.03,.34,'TimberDark')
cone('Lantern cap',-3.33,-.3,1.7,.19,.07,.13,'TimberDark',4)

navigation=dict(version=1,groundY=0,bounds=dict(minX=-5,maxX=5,minZ=-5,maxZ=5),
    walkablePolygon=perimeter,spawn=dict(x=-1.6,z=2.8),characterRadius=.25,obstacles=obstacles)
(OUT/'world.navigation.json').write_text(json.dumps(navigation,indent=2)+'\n',encoding='utf-8')

# Consistent normals for handcrafted meshes, applied scale for all source objects.
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH': continue
    bm=bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    bm.to_mesh(obj.data); bm.free()
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)

scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
scene.render.engine='CYCLES'
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1100
scene.render.resolution_y=1100
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.world.color=(.35,.35,.35)
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.60,.65,.78,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
# A rose-lilac camera background does not tint the neutral studio illumination.
wn=scene.world.node_tree.nodes; wl=scene.world.node_tree.links
camera_bg=wn.new('ShaderNodeBackground'); camera_bg.inputs[0].default_value=(.61,.46,.57,1)
camera_bg.inputs[1].default_value=.8
lightpath=wn.new('ShaderNodeLightPath'); mix=wn.new('ShaderNodeMixShader')
wl.new(lightpath.outputs['Is Camera Ray'],mix.inputs[0])
wl.new(wn['Background'].outputs[0],mix.inputs[1]); wl.new(camera_bg.outputs[0],mix.inputs[2])
wl.new(mix.outputs[0],wn['World Output'].inputs['Surface'])
scene.view_settings.view_transform='AgX'
def aim(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
for name,loc,power,size in [('Warm key',(-5,-8,13),1800,8),('Cool fill',(7,-2,8),1100,7),('Soft rim',(-1,7,11),1900,6)]:
    data=bpy.data.lights.new(name,'AREA'); data.energy=power; data.shape='DISK'; data.size=size
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); obj.location=loc; aim(obj,(0,0,0))
data=bpy.data.cameras.new('Village preview camera')
camera=bpy.data.objects.new('Village preview camera',data); scene.collection.objects.link(camera)
camera.location=p(12,17,13)
aim(camera,p(0,0,1))
data.type='ORTHO'; data.ortho_scale=16.4; data.lens=50
scene.camera=camera
scene.render.filepath=str(HERE/'world.preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'world.blend'))
bpy.ops.render.render(write_still=True)

# Static copies stay batched; animated crowns and each water plane retain bindings.
source=[o for o in scene.objects if o.type=='MESH']
exports=[]
groups={}
for obj in source:
    matname=obj.data.materials[0].name
    key=obj.get('vfx_binding')
    if matname in ('Water','WaterLight'):
        surface='River' if obj.name.startswith('Stream') else ('FallSouth' if obj.location.y<0 else 'FallNorth')
        key='VFX_Water_'+surface+'_'+matname
    key=key or 'World_'+matname
    groups.setdefault(key,[]).append(obj)
for key,group in sorted(groups.items()):
    bpy.ops.object.select_all(action='DESELECT')
    copies=[]
    for obj in group:
        dup=obj.copy(); dup.data=obj.data.copy(); scene.collection.objects.link(dup)
        dup.select_set(True); copies.append(dup)
    bpy.context.view_layer.objects.active=copies[0]
    if len(copies)>1: bpy.ops.object.join()
    joined=bpy.context.object; joined.name=key
    joined.data.name=joined.name
    if key.startswith('VFX_Water_'):
        uv=joined.data.uv_layers.active or joined.data.uv_layers.new(name='Flow')
        for loop in joined.data.loops:
            v=joined.matrix_world@joined.data.vertices[loop.vertex_index].co
            # glTF flips V. Runtime +V follows +Z on river and +Y on falls.
            along=-v.y if '_River_' in key else v.z
            uv.data[loop.index].uv=(v.x*.8,1-along*.8)
    exports.append(joined)
bpy.ops.object.select_all(action='DESELECT')
for obj in exports: obj.select_set(True)
emitter.select_set(True)
bpy.context.view_layer.objects.active=exports[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'world.glb'),export_format='GLB',
    use_selection=True,export_yup=True,export_apply=True,export_animations=False,
    export_cameras=False,export_lights=False,export_texcoords=True,export_normals=True,
    export_materials='EXPORT')
print('C002 world built:',len(source),'source meshes;',len(exports),'export meshes')
