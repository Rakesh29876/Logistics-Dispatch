import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/* ==================== PROCEDURAL TEXTURES ==================== */
function createCorrugatedTexture(col1 = '#1e293b', col2 = '#0f172a') {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = col1
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = col2
  for (let x = 0; x < 128; x += 16) {
    ctx.fillRect(x + 8, 0, 8, 128)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 2)
  return tex
}

function createHazardTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#facc15'
  ctx.fillRect(0, 0, 128, 32)
  ctx.fillStyle = '#0f172a'
  for (let x = -32; x < 160; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + 16, 0)
    ctx.lineTo(x, 32)
    ctx.lineTo(x - 16, 32)
    ctx.closePath()
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 1)
  return tex
}

function makeSignBoard(title, subtitle, bgHex = '#0f172a', textHex = '#0ea5e9', w = 12, h = 2.2) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bgHex
  ctx.fillRect(0, 0, 512, 96)
  ctx.strokeStyle = textHex
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, 504, 88)
  ctx.fillStyle = textHex
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(title, 256, 44)
  if (subtitle) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 17px sans-serif'
    ctx.fillText(subtitle, 256, 76)
  }
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.MeshBasicMaterial({ map: tex })
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
}

/* ==================== REALISTIC COMMERCIAL VEHICLES ==================== */
function build10WheelLorry(color = 0xd97706, isDark = false) {
  const group = new THREE.Group()
  const matCab = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.45 })
  const matChassis = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
  const matTarp = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.85 })
  const matWheel = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.3, 2.1), matCab)
  cab.position.set(2.9, 1.45, 0)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 1.8), matGlass)
  windshield.position.set(4.11, 1.6, 0)
  group.add(cab, windshield)

  // Long Slatted Freight Body with Tarpaulin Cover
  const bed = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.6, 2.2), matTarp)
  bed.position.set(-1.4, 1.7, 0)
  group.add(bed)

  // Chassis Frame
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.4, 1.4), matChassis)
  chassis.position.set(0.6, 0.6, 0)
  group.add(chassis)

  // 10 Wheels (Steer Axle + Dual Rear Tandem Axles)
  const wheelPositions = [
    [2.8, -1.15], [2.8, 1.15],
    [-1.2, -1.15], [-1.2, 1.15],
    [-2.4, -1.15], [-2.4, 1.15],
    [-3.6, -1.15], [-3.6, 1.15],
  ]
  wheelPositions.forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 12), matWheel)
    w.rotation.x = Math.PI / 2
    w.position.set(wx, 0.48, wz)
    group.add(w)
  })

  // Amber hazard beacon
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }))
  beacon.position.set(2.8, 2.7, 0)
  group.add(beacon)

  return group
}

function build6WheelLorry(color = 0x0284c7, isDark = false) {
  const group = new THREE.Group()
  const matCab = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 })
  const matBody = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0xe2e8f0, roughness: 0.4 })
  const matWheel = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
  const matGlass = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 1.9), matCab)
  cab.position.set(1.5, 1.25, 0)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.6), matGlass)
  windshield.position.set(2.61, 1.4, 0)
  group.add(cab, windshield)

  // Cargo Box
  const box = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.4, 2.0), matBody)
  box.position.set(-1.8, 1.5, 0)
  group.add(box)

  // 6 Wheels
  ;[[-3.0, -1.05], [-1.2, -1.05], [1.5, -1.05], [-3.0, 1.05], [-1.2, 1.05], [1.5, 1.05]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10), matWheel)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(wx, 0.42, wz)
    group.add(wheel)
  })

  return group
}

function buildDostMini(isDark = false) {
  const group = new THREE.Group()
  const matCab = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 })
  const matBed = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
  const matWheel = new THREE.MeshStandardMaterial({ color: 0x0f172a })

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.5), matCab)
  cab.position.set(0.9, 0.9, 0)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.5), matBed)
  bed.position.set(-1.1, 0.6, 0)
  group.add(cab, bed)

  ;[[-1.6, -0.8], [0.9, -0.8], [-1.6, 0.8], [0.9, 0.8]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 8), matWheel)
    w.rotation.x = Math.PI / 2
    w.position.set(wx, 0.32, wz)
    group.add(w)
  })

  return group
}

export default function LoginBackground3D({ theme = 'light', cameraView = 'overview' }) {
  const mountRef = useRef(null)
  const sceneCtxRef = useRef(null)
  const targetCamPosRef = useRef(null)
  const targetControlsTargetRef = useRef(null)

  const VIEW_PRESETS = {
    overview: { pos: [0, 26, 42], target: [0, 2, -2] },
    plant: { pos: [-22, 11, 12], target: [-20, 3, -12] },
    dock: { pos: [13, 8.0, 9.0], target: [13, 2.2, -3.0] },
    weighbridge: { pos: [-18, 7.5, 16], target: [-22, 1.8, 6.5] },
    dispatch: { pos: [32, 11, 14], target: [31, 4.5, -5.5] },
  }

  // Handle camera view fly-to
  useEffect(() => {
    const target = VIEW_PRESETS[cameraView] || VIEW_PRESETS.overview
    targetCamPosRef.current = new THREE.Vector3(...target.pos)
    targetControlsTargetRef.current = new THREE.Vector3(...target.target)
  }, [cameraView])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const isDark = theme === 'dark'
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    // Crystal clear sky & low fog so all 3D factory models pop with high contrast!
    const bgCol = isDark ? 0x090f1d : 0xd8e8f8
    scene.background = new THREE.Color(bgCol)
    scene.fog = new THREE.FogExp2(bgCol, 0.0016)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 350)
    const initView = VIEW_PRESETS[cameraView] || VIEW_PRESETS.overview
    camera.position.set(...initView.pos)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = isDark ? 1.2 : 1.08

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Full 360-Degree Interactive OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.screenSpacePanning = true
    controls.minPolarAngle = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minDistance = 6
    controls.maxDistance = 160
    controls.target.set(...initView.target)

    // Directional Sunlight & Sky Ambient
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, isDark ? 0x0c162d : 0x64748b, isDark ? 0.75 : 0.95)
    scene.add(hemiLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.0 : 1.35)
    sunLight.position.set(38, 52, 34)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 5
    sunLight.shadow.camera.far = 140
    sunLight.shadow.camera.left = -55
    sunLight.shadow.camera.right = 55
    sunLight.shadow.camera.top = 40
    sunLight.shadow.camera.bottom = -40
    scene.add(sunLight)

    // High Mast Floodlights for night shift radiance
    const floodlights = []
    ;[[-35, 15, -18], [-35, 15, 14], [35, 15, -18], [35, 15, 14], [0, 11, 4]].forEach(([fx, fy, fz]) => {
      const fl = new THREE.PointLight(0xffedd5, isDark ? 1.8 : 0.4, 42)
      fl.position.set(fx, fy, fz)
      scene.add(fl)
      floodlights.push(fl)
    })

    // Ground Pavements
    const lawn = new THREE.Mesh(
      new THREE.PlaneGeometry(170, 120),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x091424 : 0xcbd5e1, roughness: 0.95 })
    )
    lawn.rotation.x = -Math.PI / 2
    lawn.receiveShadow = true
    scene.add(lawn)

    // Concrete Industrial Yard Platform
    const yardFloor = new THREE.Mesh(
      new THREE.BoxGeometry(84, 0.16, 40),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x111d30 : 0xb0bec5, roughness: 0.82 })
    )
    yardFloor.position.set(0, 0.08, -2.5)
    yardFloor.receiveShadow = true
    scene.add(yardFloor)

    // 4 High-Mast Yard Lattice Towers
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
    ;[[-37, -19], [-37, 13], [37, -19], [37, 13]].forEach(([mx, mz]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 16, 8), mastMat)
      mast.position.set(mx, 8.0, mz)
      mast.castShadow = true
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.2), new THREE.MeshStandardMaterial({ color: 0xfacc15 }))
      head.position.set(mx, 16.2, mz)
      scene.add(mast, head)
    })

    // ==================== 1. MAIN MANUFACTURING HALL (UNIT A) ====================
    const prodCorrugatedTex = createCorrugatedTexture('#1e293b', '#0f172a')
    const matProdWall = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x334155,
      map: prodCorrugatedTex,
      roughness: 0.5,
      metalness: 0.35,
    })
    const prodHall = new THREE.Mesh(new THREE.BoxGeometry(28, 8.0, 14), matProdWall)
    prodHall.position.set(-20, 4.0, -12.0)
    prodHall.castShadow = true
    prodHall.receiveShadow = true
    scene.add(prodHall)

    // Sawtooth Clerestory Roof Peaks with Glass Skylights
    for (let r = 0; r < 4; r++) {
      const rx = -31 + r * 7.0
      const roofPeak = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.3, 14.2), new THREE.MeshStandardMaterial({ color: isDark ? 0x0f172a : 0x475569 }))
      roofPeak.position.set(rx + 1.5, 8.8, -12.0)
      roofPeak.rotation.z = 0.22
      roofPeak.castShadow = true
      const skylightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 13.8), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 }))
      skylightGlass.position.set(rx + 4.9, 8.9, -12.0)
      scene.add(roofPeak, skylightGlass)
    }

    // Industrial Chimneys with Red/White Bands & Steam Plumes
    const steamPlumes = []
    ;[-30, -25].forEach((cx, idx) => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 12.0, 16), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4 }))
      stack.position.set(cx, 6.0, -17.5)
      stack.castShadow = true
      const safetyBand = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.4, 16), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
      safetyBand.position.set(cx, 10.5, -17.5)
      scene.add(stack, safetyBand)

      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.45 }))
      steam.position.set(cx, 12.8, -17.5)
      scene.add(steam)
      steamPlumes.push({ mesh: steam, baseX: cx, offset: idx * 1.6 })
    })

    // Substation & Factory Facade Signboard
    const subStation = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.2), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 }))
    subStation.position.set(-36, 1.4, -15)
    const factorySign = makeSignBoard('APEX PRECISION MANUFACTURING', 'UNIT A · AUTOMATED POWERTRAIN & CNC MACHINING', '#0f172a', '#14b8a6', 18.0, 2.6)
    factorySign.position.set(-20, 9.8, -4.7)
    scene.add(subStation, factorySign)

    // Animated Robotic Welding Arm & Sparks
    const armPivot = new THREE.Group()
    armPivot.position.set(-18, 0.9, -11.0)
    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.8, 0.28), new THREE.MeshStandardMaterial({ color: 0xf97316 }))
    upperArm.position.y = 0.9
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.22), new THREE.MeshStandardMaterial({ color: 0xfb923c }))
    forearm.position.set(0.5, 1.7, 0)
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 }))
    spark.position.set(1.1, 1.7, 0)
    armPivot.add(upperArm, forearm, spark)
    scene.add(armPivot)

    // ==================== 2. FINISHED-GOODS WAREHOUSE (FG-WH-01) & 6 DOCK BAYS ====================
    const whCorrugatedTex = createCorrugatedTexture('#0f172a', '#1e293b')
    const whBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(26, 9.0, 14),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x0f172a : 0x1e293b, map: whCorrugatedTex, roughness: 0.45, metalness: 0.35 })
    )
    whBuilding.position.set(13, 4.5, -12.0)
    whBuilding.castShadow = true
    whBuilding.receiveShadow = true
    scene.add(whBuilding)

    const whSign = makeSignBoard('FG-WH-01 DISTRIBUTION CENTER', '6 DOCK BAYS · LOT STOCK: 32,450 UNITS (QA RELEASED)', '#0f172a', '#0ea5e9', 18.0, 2.4)
    whSign.position.set(13, 9.9, -4.8)
    scene.add(whSign)

    // Concrete Dock Platform with Yellow Edge Curb
    const dockPlatform = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.9, 3.2), new THREE.MeshStandardMaterial({ color: 0x475569 }))
    dockPlatform.position.set(13, 0.45, -4.0)
    dockPlatform.receiveShadow = true
    const dockCurb = new THREE.Mesh(new THREE.BoxGeometry(25.6, 0.14, 0.2), new THREE.MeshStandardMaterial({ map: createHazardTexture() }))
    dockCurb.position.set(13, 0.95, -2.5)
    scene.add(dockPlatform, dockCurb)

    // 6 Dedicated Loading Dock Bays (Bays 01 - 06)
    const matDockShelter = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
    for (let bay = 0; bay < 6; bay++) {
      const bayX = 2.8 + bay * 4.1
      const isDoorOpen = bay < 3
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, isDoorOpen ? 1.4 : 3.4, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 })
      )
      door.position.set(bayX, isDoorOpen ? 4.3 : 2.5, -5.0)

      // Accordion compression seals
      const shelterTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.45, 0.75), matDockShelter)
      shelterTop.position.set(bayX, 4.45, -4.6)
      const shelterLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.75), matDockShelter)
      shelterLeft.position.set(bayX - 1.55, 2.5, -4.6)
      const shelterRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.8, 0.75), matDockShelter)
      shelterRight.position.set(bayX + 1.55, 2.5, -4.6)
      scene.add(door, shelterTop, shelterLeft, shelterRight)

      // Yellow hydraulic leveler lip plate
      const leveler = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6 }))
      leveler.position.set(bayX, 0.92, -2.8)
      scene.add(leveler)

      // Dock Bay Stenciled Sign
      const baySign = makeSignBoard(`BAY 0${bay + 1}`, bay < 3 ? 'LOADING' : 'READY', '#0f172a', bay < 3 ? '#ef4444' : '#16a34a', 2.8, 0.8)
      baySign.position.set(bayX, 5.3, -4.85)
      scene.add(baySign)

      // Docked Commercial Trucks at Bays
      if (bay === 0) {
        const truck1 = build10WheelLorry(0xd97706, isDark)
        truck1.rotation.y = -Math.PI / 2
        truck1.position.set(bayX, 0.12, 0.4)
        scene.add(truck1)
      } else if (bay === 1) {
        const truck2 = build6WheelLorry(0x0284c7, isDark)
        truck2.rotation.y = -Math.PI / 2
        truck2.position.set(bayX, 0.12, 0.2)
        scene.add(truck2)
      }
    }

    // ==================== 3. 2-STORY DISPATCH OPERATIONS COMMAND TOWER ====================
    const towerGroup = new THREE.Group()
    const towerGround = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.2, 6.0), new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x334155 }))
    towerGround.position.set(0, 1.6, 0)
    const towerGlass = new THREE.Mesh(
      new THREE.BoxGeometry(8.0, 2.6, 6.5),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.05 })
    )
    towerGlass.position.set(0, 4.4, 0)
    const towerRoof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.35, 7.0), new THREE.MeshStandardMaterial({ color: 0x0284c7 }))
    towerRoof.position.set(0, 5.85, 0)

    // Rotating Radar Dish
    const radarDish = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.45, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 }))
    radarDish.position.set(0, 7.2, 0)
    radarDish.rotation.x = Math.PI / 4

    towerGroup.add(towerGround, towerGlass, towerRoof, radarDish)
    towerGroup.position.set(31.0, 0.08, -5.5)
    scene.add(towerGroup)

    // ==================== 4. AUTOMATED WEIGHBRIDGE STATION (WB-01) ====================
    const wbPit = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 0.38, 4.4),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 })
    )
    wbPit.position.set(-22.0, 0.20, 6.5)
    scene.add(wbPit)

    // Scale Approach & Exit Ramps
    const matRamp = new THREE.MeshStandardMaterial({ color: isDark ? 0x1e293b : 0x94a3b8, roughness: 0.85 })
    const rampIn = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 4.4), matRamp)
    rampIn.position.set(-28.6, 0.12, 6.5)
    rampIn.rotation.z = -0.04
    const rampOut = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.24, 4.4), matRamp)
    rampOut.position.set(-15.4, 0.12, 6.5)
    rampOut.rotation.z = 0.04
    scene.add(rampIn, rampOut)

    // Overhead ANPR Camera Gantry & Scoreboard
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 6.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }))
    gantry.position.set(-22.0, 5.3, 6.5)
    const scaleSign = makeSignBoard('WB-01 PIT SCALE · 28.4 TONS', 'STATUS: PASS · WEIGHT VERIFIED', '#090d16', '#22c55e', 4.4, 0.9)
    scaleSign.position.set(-22.0, 6.4, 6.5)
    scene.add(gantry, scaleSign)

    // Green Laser Scanning Beam Plane
    const scanBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 4.2, 3.8),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.35 })
    )
    scanBeam.position.set(-22.0, 2.4, 6.5)
    scene.add(scanBeam)

    // Operator Control Cabin
    const wbKiosk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 3.2), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }))
    wbKiosk.position.set(-22.0, 1.6, 11.4)
    const wbRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }))
    wbRoof.position.set(-22.0, 3.35, 11.4)
    scene.add(wbKiosk, wbRoof)

    // ==================== 5. SECURITY CHECKPOINT & MAIN GATE ====================
    const gateKiosk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.0, 2.8), new THREE.MeshStandardMaterial({ color: 0x1e293b }))
    gateKiosk.position.set(-36.0, 1.5, 6.5)
    const gateRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 3.6), new THREE.MeshStandardMaterial({ color: 0x0284c7 }))
    gateRoof.position.set(-36.0, 3.15, 6.5)
    const gateSign = makeSignBoard('GATE 01 - APEX COMMERCIAL CHECKPOINT', 'FASTag RFID + ANPR ENTRY', '#090d16', '#38bdf8', 4.4, 0.9)
    gateSign.position.set(-36.0, 3.75, 6.5)
    scene.add(gateKiosk, gateRoof, gateSign)

    // ==================== 6. VEHICLE STAGING & BUFFER YARD ====================
    const stagingYard = new THREE.Mesh(
      new THREE.BoxGeometry(24, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: isDark ? 0x111c2e : 0x475569, roughness: 0.9 })
    )
    stagingYard.position.set(-2.0, 0.06, 12.0)
    stagingYard.receiveShadow = true
    scene.add(stagingYard)

    // Parked Waiting Trucks in Staging Slots
    const parkedTruck1 = build10WheelLorry(0xd97706, isDark)
    parkedTruck1.rotation.y = 0.22
    parkedTruck1.position.set(-9.5, 0.12, 12.5)
    const parkedTruck2 = build6WheelLorry(0x1e3a8a, isDark)
    parkedTruck2.rotation.y = 0.22
    parkedTruck2.position.set(-4.5, 0.12, 12.5)
    scene.add(parkedTruck1, parkedTruck2)

    // Agile Dost Mini Truck Parked at Warehouse Staging
    const dostTruck = buildDostMini(isDark)
    dostTruck.position.set(28.0, 0.12, -1.8)
    dostTruck.rotation.y = Math.PI / 3
    scene.add(dostTruck)

    // ==================== 7. ASPHALT ROADWAY, YARD MARKINGS & HIGHWAY ====================
    const matAsphalt = new THREE.MeshStandardMaterial({ color: isDark ? 0x172133 : 0x334155, roughness: 0.9 })
    const internalRoad = new THREE.Mesh(new THREE.BoxGeometry(82, 0.1, 5.6), matAsphalt)
    internalRoad.position.set(0, 0.12, 6.5)
    internalRoad.receiveShadow = true
    scene.add(internalRoad)

    const highway = new THREE.Mesh(new THREE.BoxGeometry(100, 0.1, 8.4), matAsphalt)
    highway.position.set(0, 0.06, 18.5)
    highway.receiveShadow = true
    scene.add(highway)

    // Highway Yellow Dashes
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    for (let x = -48; x <= 48; x += 4.0) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.2), dashMat)
      dash.position.set(x, 0.13, 18.5)
      scene.add(dash)
    }

    // Pedestrian White Zebra Crossings
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc })
    ;[-14, 20].forEach(zx => {
      for (let z = 4.0; z <= 9.0; z += 0.8) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 0.35), zebraMat)
        stripe.position.set(zx, 0.14, z)
        scene.add(stripe)
      }
    })

    // ==================== 8. MOVING COMMERCIAL FLEET ====================
    const movingFleet = []
    const fleetConfig = [
      { builder: build6WheelLorry, color: 0x0284c7, speed: 0.038, lane: 16.8, dir: 1, initX: -35 },
      { builder: build10WheelLorry, color: 0xd97706, speed: 0.028, lane: 20.2, dir: -1, initX: 20 },
      { builder: build6WheelLorry, color: 0x10b981, speed: 0.045, lane: 16.8, dir: 1, initX: 5 },
      { builder: build10WheelLorry, color: 0xdc2626, speed: 0.030, lane: 20.2, dir: -1, initX: -15 },
    ]

    fleetConfig.forEach((t) => {
      const truck = t.builder(t.color, isDark)
      truck.position.set(t.initX, 0.12, t.lane)
      if (t.dir === -1) truck.rotation.y = Math.PI
      scene.add(truck)
      movingFleet.push({ mesh: truck, speed: t.speed, dir: t.dir })
    })

    // Hero 10-Wheel Commercial Lorry Traversing Gate & Scale
    const heroTruck = build10WheelLorry(0x16a34a, isDark)
    heroTruck.position.set(-28, 0.12, 6.5)
    scene.add(heroTruck)

    sceneCtxRef.current = { scene, camera, renderer, controls }

    // Resize Handler
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Animation Loop
    let animId = 0
    const clock = new THREE.Clock()
    let heroPhase = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.elapsedTime

      // Smooth Drone Camera Lerp Interpolation
      if (targetCamPosRef.current && targetControlsTargetRef.current) {
        camera.position.lerp(targetCamPosRef.current, Math.min(1, dt * 3.5))
        controls.target.lerp(targetControlsTargetRef.current, Math.min(1, dt * 3.5))
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.15 && controls.target.distanceTo(targetControlsTargetRef.current) < 0.15) {
          targetCamPosRef.current = null
          targetControlsTargetRef.current = null
        }
      }

      // Billowing Steam Plumes
      steamPlumes.forEach(s => {
        const st = (elapsed * 0.6 + s.offset) % 1.0
        s.mesh.position.y = 11.2 + st * 4.2
        s.mesh.position.x = s.baseX + st * 0.8
        const sc = 0.8 + st * 1.2
        s.mesh.scale.set(sc, sc, sc)
        s.mesh.material.opacity = 0.45 * (1 - st)
      })

      // Rotating Radar Dish
      radarDish.rotation.y = elapsed * 1.5

      // Robotic Welding Sparks
      armPivot.rotation.y = Math.sin(elapsed * 2.2) * 0.4
      spark.visible = Math.sin(elapsed * 18) > 0.4

      // Weighbridge Laser Pulse
      scanBeam.material.opacity = 0.2 + Math.abs(Math.sin(elapsed * 6)) * 0.35

      // Moving Highway Fleet
      movingFleet.forEach(t => {
        t.mesh.position.x += t.speed * t.dir * 45 * dt
        if (t.dir === 1 && t.mesh.position.x > 48) t.mesh.position.x = -48
        if (t.dir === -1 && t.mesh.position.x < -48) t.mesh.position.x = 48
      })

      // Hero Truck Slow Traverse
      heroPhase = (heroPhase + dt * 0.035) % 1.0
      heroTruck.position.x = -36 + heroPhase * 60

      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [theme])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        cursor: 'grab',
      }}
    />
  )
}
